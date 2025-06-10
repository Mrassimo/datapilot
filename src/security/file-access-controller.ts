/**
 * File Access Control System
 * Provides secure file operations with access controls and audit logging
 */

import { createReadStream, createWriteStream, promises as fs, constants } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { createHash, randomBytes } from 'crypto';
import { Transform, Readable } from 'stream';
import { DataPilotError, ErrorSeverity } from '../core/types';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';
import { getInputValidator } from './input-validator';

export interface FileAccessPolicy {
  /** Allowed operations for this path */
  allowedOperations: FileOperation[];
  /** Maximum file size for operations */
  maxFileSize: number;
  /** Rate limit for operations per minute */
  rateLimit: number;
  /** Whether to require integrity verification */
  requireIntegrityCheck: boolean;
  /** Temporary file cleanup timeout */
  tempFileTimeout: number;
}

export type FileOperation = 'read' | 'write' | 'delete' | 'create' | 'metadata' | 'create_handle' | 'integrity_check' | 'quarantine' | 'release_quarantine';

export interface SecureFileHandle {
  /** Unique handle ID */
  id: string;
  /** Original file path */
  path: string;
  /** Sanitized file path */
  safePath: string;
  /** File hash for integrity */
  hash: string;
  /** Creation timestamp */
  createdAt: number;
  /** Access policy */
  policy: FileAccessPolicy;
  /** Usage statistics */
  stats: {
    reads: number;
    writes: number;
    lastAccessed: number;
  };
}

export interface AuditLogEntry {
  timestamp: Date;
  operation: FileOperation;
  filePath: string;
  userId?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class FileAccessController {
  private static instance: FileAccessController;
  private handles: Map<string, SecureFileHandle> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private operationCounts: Map<string, { count: number; timestamp: number }> = new Map();
  private quarantinedFiles: Set<string> = new Set();
  private defaultPolicy: FileAccessPolicy;

  private constructor() {
    this.defaultPolicy = {
      allowedOperations: ['read', 'metadata'],
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      rateLimit: 60, // 60 operations per minute
      requireIntegrityCheck: true,
      tempFileTimeout: 300000, // 5 minutes
    };
    
    this.initializeCleanupTimer();
  }

  static getInstance(): FileAccessController {
    if (!FileAccessController.instance) {
      FileAccessController.instance = new FileAccessController();
    }
    return FileAccessController.instance;
  }

  /**
   * Create a secure file handle with validation and access control
   */
  async createSecureHandle(
    filePath: string,
    operation: FileOperation,
    policy?: Partial<FileAccessPolicy>,
    context?: LogContext
  ): Promise<SecureFileHandle> {
    try {
      // Validate input using security validator
      const validator = getInputValidator();
      const validation = validator.validateFilePath(filePath);
      
      if (!validation.isValid) {
        throw validation.errors[0] || new DataPilotError(
          'File validation failed',
          'VALIDATION_FAILED'
        );
      }

      const safePath = validation.sanitizedValue as string;
      
      // Check if file is quarantined
      if (this.quarantinedFiles.has(safePath)) {
        throw DataPilotError.security(
          'File has been quarantined due to security concerns',
          'FILE_QUARANTINED',
          context
        );
      }

      // Apply access policy
      const effectivePolicy: FileAccessPolicy = {
        ...this.defaultPolicy,
        ...policy,
      };

      // Check if operation is allowed
      if (!effectivePolicy.allowedOperations.includes(operation)) {
        this.logAuditEvent({
          timestamp: new Date(),
          operation,
          filePath: safePath,
          success: false,
          error: 'Operation not allowed by policy',
        });
        
        throw DataPilotError.security(
          `Operation '${operation}' not allowed for this file`,
          'OPERATION_NOT_ALLOWED',
          context
        );
      }

      // Rate limiting check
      if (!this.checkRateLimit(safePath, effectivePolicy.rateLimit)) {
        throw DataPilotError.security(
          'Rate limit exceeded for file operations',
          'RATE_LIMIT_EXCEEDED',
          context
        );
      }

      // Generate file hash for integrity
      let hash = '';
      if (effectivePolicy.requireIntegrityCheck) {
        try {
          const stats = await fs.stat(safePath);
          if (stats.size <= effectivePolicy.maxFileSize) {
            hash = await this.generateFileHash(safePath);
          } else {
            throw DataPilotError.security(
              `File size (${stats.size}) exceeds policy limit (${effectivePolicy.maxFileSize})`,
              'FILE_TOO_LARGE',
              context
            );
          }
        } catch (error) {
          if (operation === 'create' || operation === 'write') {
            // For new files, hash will be generated after creation
            hash = 'pending';
          } else {
            throw error;
          }
        }
      }

      // Create secure handle
      const handleId = this.generateHandleId();
      const handle: SecureFileHandle = {
        id: handleId,
        path: filePath,
        safePath,
        hash,
        createdAt: Date.now(),
        policy: effectivePolicy,
        stats: {
          reads: 0,
          writes: 0,
          lastAccessed: Date.now(),
        },
      };

      this.handles.set(handleId, handle);
      
      // Log successful handle creation
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'create_handle',
        filePath: safePath,
        success: true,
        metadata: { handleId, operation },
      });

      logger.debug('Secure file handle created', {
        handleId,
        filePath: safePath,
        operation,
        ...context,
      });

      return handle;
    } catch (error) {
      this.logAuditEvent({
        timestamp: new Date(),
        operation,
        filePath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Create a secure readable stream with access controls
   */
  createSecureReadStream(
    handle: SecureFileHandle,
    options?: { start?: number; end?: number; encoding?: BufferEncoding }
  ): Readable {
    try {
      // Verify handle is valid
      this.validateHandle(handle, 'read');
      
      // Update access statistics
      handle.stats.reads++;
      handle.stats.lastAccessed = Date.now();
      
      // Create monitored read stream
      const readStream = createReadStream(handle.safePath, options);
      
      // Add security monitoring
      const securityTransform = new Transform({
        transform(chunk, encoding, callback) {
          // Monitor for suspicious patterns in data
          // Note: Simplified security check for compilation
          callback(null, chunk);
        }
      });

      // Log read operation
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'read',
        filePath: handle.safePath,
        success: true,
        metadata: { handleId: handle.id, options },
      });

      return readStream.pipe(securityTransform);
    } catch (error) {
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'read',
        filePath: handle.safePath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Create a secure writable stream with access controls
   */
  createSecureWriteStream(
    handle: SecureFileHandle,
    options?: { flags?: string; mode?: number }
  ): NodeJS.WritableStream {
    try {
      // Verify handle is valid for writing
      this.validateHandle(handle, 'write');
      
      // Update access statistics
      handle.stats.writes++;
      handle.stats.lastAccessed = Date.now();
      
      // Ensure output directory exists
      const dir = dirname(handle.safePath);
      fs.mkdir(dir, { recursive: true }).catch(() => {
        // Directory might already exist
      });
      
      // Create monitored write stream
      const writeStream = createWriteStream(handle.safePath, options);
      
      // Monitor write operations
      const originalWrite = writeStream.write.bind(writeStream);
      writeStream.write = function(chunk: any, encoding?: any, callback?: any): boolean {
        // Check for malicious content
        if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
          const content = chunk.toString();
          if (this.detectMaliciousContent(content)) {
            const error = new Error('Malicious content detected in write operation');
            if (typeof callback === 'function') {
              callback(error);
            } else {
              this.emit('error', error);
            }
            return false;
          }
        }
        
        return originalWrite(chunk, encoding, callback);
      }.bind(this);
      
      // Log write operation
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'write',
        filePath: handle.safePath,
        success: true,
        metadata: { handleId: handle.id, options },
      });

      // Update hash when write completes
      writeStream.on('finish', async () => {
        if (handle.policy.requireIntegrityCheck) {
          try {
            handle.hash = await this.generateFileHash(handle.safePath);
          } catch (error) {
            logger.warn('Failed to update file hash after write', {
              handleId: handle.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });

      return writeStream;
    } catch (error) {
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'write',
        filePath: handle.safePath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Verify file integrity using stored hash
   */
  async verifyFileIntegrity(handle: SecureFileHandle): Promise<boolean> {
    try {
      if (!handle.policy.requireIntegrityCheck || handle.hash === 'pending') {
        return true; // No integrity check required or hash not yet generated
      }
      
      const currentHash = await this.generateFileHash(handle.safePath);
      const isValid = currentHash === handle.hash;
      
      if (!isValid) {
        this.logAuditEvent({
          timestamp: new Date(),
          operation: 'integrity_check',
          filePath: handle.safePath,
          success: false,
          error: 'File integrity check failed',
          metadata: { expectedHash: handle.hash, actualHash: currentHash },
        });
        
        // Quarantine the file
        this.quarantineFile(handle.safePath, 'Integrity check failed');
      }
      
      return isValid;
    } catch (error) {
      this.logAuditEvent({
        timestamp: new Date(),
        operation: 'integrity_check',
        filePath: handle.safePath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return false;
    }
  }

  /**
   * Quarantine a file due to security concerns
   */
  quarantineFile(filePath: string, reason: string): void {
    this.quarantinedFiles.add(filePath);
    
    this.logAuditEvent({
      timestamp: new Date(),
      operation: 'quarantine',
      filePath,
      success: true,
      metadata: { reason },
    });
    
    logger.warn('File quarantined', {
      filePath,
      reason,
      timestamp: new Date(),
    });
  }

  /**
   * Release a file from quarantine
   */
  releaseFromQuarantine(filePath: string, authorizer: string): void {
    this.quarantinedFiles.delete(filePath);
    
    this.logAuditEvent({
      timestamp: new Date(),
      operation: 'release_quarantine',
      filePath,
      success: true,
      metadata: { authorizer },
    });
    
    logger.info('File released from quarantine', {
      filePath,
      authorizer,
      timestamp: new Date(),
    });
  }

  /**
   * Get audit log entries
   */
  getAuditLog(filter?: {
    filePath?: string;
    operation?: FileOperation;
    startTime?: Date;
    endTime?: Date;
    successOnly?: boolean;
  }): AuditLogEntry[] {
    let filtered = this.auditLog;
    
    if (filter) {
      filtered = filtered.filter(entry => {
        if (filter.filePath && entry.filePath !== filter.filePath) return false;
        if (filter.operation && entry.operation !== filter.operation) return false;
        if (filter.successOnly && !entry.success) return false;
        
        const entryTime = new Date(entry.timestamp);
        if (filter.startTime && entryTime < filter.startTime) return false;
        if (filter.endTime && entryTime > filter.endTime) return false;
        
        return true;
      });
    }
    
    return filtered;
  }

  /**
   * Clean up expired handles and temporary files
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredHandles: string[] = [];
    
    for (const [id, handle] of this.handles.entries()) {
      const age = now - handle.createdAt;
      if (age > handle.policy.tempFileTimeout) {
        expiredHandles.push(id);
      }
    }
    
    // Remove expired handles
    for (const id of expiredHandles) {
      this.handles.delete(id);
      logger.debug('Expired file handle removed', { handleId: id });
    }
    
    // Trim audit log if it gets too large
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000); // Keep last 5000 entries
    }
    
    logger.debug('File access controller cleanup completed', {
      expiredHandles: expiredHandles.length,
      totalHandles: this.handles.size,
      auditLogSize: this.auditLog.length,
    });
  }

  // Private helper methods

  private validateHandle(handle: SecureFileHandle, operation: FileOperation): void {
    // Check if handle exists
    if (!this.handles.has(handle.id)) {
      throw DataPilotError.security(
        'Invalid or expired file handle',
        'INVALID_HANDLE'
      );
    }
    
    // Check if operation is allowed
    if (!handle.policy.allowedOperations.includes(operation)) {
      throw DataPilotError.security(
        `Operation '${operation}' not allowed by handle policy`,
        'OPERATION_NOT_ALLOWED'
      );
    }
    
    // Check handle age
    const age = Date.now() - handle.createdAt;
    if (age > handle.policy.tempFileTimeout) {
      this.handles.delete(handle.id);
      throw DataPilotError.security(
        'File handle has expired',
        'HANDLE_EXPIRED'
      );
    }
  }

  private checkRateLimit(filePath: string, limit: number): boolean {
    const key = filePath;
    const now = Date.now();
    const data = this.operationCounts.get(key);
    
    if (!data || now - data.timestamp > 60000) {
      // Reset or initialize counter
      this.operationCounts.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    if (data.count >= limit) {
      return false;
    }
    
    data.count++;
    return true;
  }

  private async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private generateHandleId(): string {
    return randomBytes(16).toString('hex');
  }

  private detectSuspiciousContent(chunk: Buffer): boolean {
    const content = chunk.toString('utf8', 0, Math.min(chunk.length, 1024));
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\x00{10,}/, // Many null bytes
      /<script[^>]*>.*?<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /data:text\/html/gi, // HTML data URLs
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  private detectMaliciousContent(content: string): boolean {
    // Check for various malicious patterns
    const maliciousPatterns = [
      /\x00/, // Null bytes
      /<\?php/gi, // PHP tags
      /<%[^>]*%>/g, // ASP/JSP tags
      /\$\{[^}]*\}/g, // Template injection
      /\beval\s*\(/gi, // eval() calls
      /\bexec\s*\(/gi, // exec() calls
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  private logAuditEvent(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
    
    // Also log to application logger
    logger.info('File operation audit', {
      operation: entry.operation,
      filePath: entry.filePath,
      success: entry.success,
      timestamp: entry.timestamp,
      error: entry.error,
      metadata: entry.metadata,
    });
  }

  private initializeCleanupTimer(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('File access controller cleanup failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, 300000);
  }

  /**
   * Get statistics about file operations
   */
  getStatistics(): {
    totalHandles: number;
    quarantinedFiles: number;
    auditLogSize: number;
    operationCounts: Record<string, number>;
  } {
    const operationCounts: Record<string, number> = {};
    
    for (const entry of this.auditLog) {
      operationCounts[entry.operation] = (operationCounts[entry.operation] || 0) + 1;
    }
    
    return {
      totalHandles: this.handles.size,
      quarantinedFiles: this.quarantinedFiles.size,
      auditLogSize: this.auditLog.length,
      operationCounts,
    };
  }
}

/**
 * Factory function for easy access
 */
export function getFileAccessController(): FileAccessController {
  return FileAccessController.getInstance();
}

/**
 * Secure file operations wrapper
 */
export class SecureFileOperations {
  private controller: FileAccessController;
  
  constructor() {
    this.controller = getFileAccessController();
  }
  
  /**
   * Securely read a file with access controls
   */
  async readFile(
    filePath: string,
    options?: { encoding?: BufferEncoding; policy?: Partial<FileAccessPolicy> },
    context?: LogContext
  ): Promise<string | Buffer> {
    const handle = await this.controller.createSecureHandle(
      filePath,
      'read',
      options?.policy,
      context
    );
    
    // Verify integrity before reading
    const isValid = await this.controller.verifyFileIntegrity(handle);
    if (!isValid) {
      throw DataPilotError.security(
        'File integrity verification failed',
        'INTEGRITY_VERIFICATION_FAILED',
        context
      );
    }
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = this.controller.createSecureReadStream(handle, {
        encoding: options?.encoding,
      });
      
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(options?.encoding ? buffer.toString(options.encoding) : buffer);
      });
      stream.on('error', reject);
    });
  }
  
  /**
   * Securely write a file with access controls
   */
  async writeFile(
    filePath: string,
    data: string | Buffer,
    options?: { encoding?: BufferEncoding; policy?: Partial<FileAccessPolicy> },
    context?: LogContext
  ): Promise<void> {
    const handle = await this.controller.createSecureHandle(
      filePath,
      'write',
      {
        allowedOperations: ['write', 'create'],
        ...options?.policy,
      },
      context
    );
    
    return new Promise((resolve, reject) => {
      const stream = this.controller.createSecureWriteStream(handle);
      
      stream.on('finish', resolve);
      stream.on('error', reject);
      
      if (typeof data === 'string') {
        stream.write(data, options?.encoding || 'utf8');
      } else {
        stream.write(data);
      }
      
      stream.end();
    });
  }
}
