/**
 * DataPilot Security Framework
 * Main entry point for all security components
 */

export { InputValidator, getInputValidator, ExternalDataValidator } from './input-validator';
export {
  FileAccessController,
  getFileAccessController,
  SecureFileOperations,
  type FileAccessPolicy,
  type FileOperation,
  type SecureFileHandle,
  type AuditLogEntry,
} from './file-access-controller';
export {
  SecurityConfigManager,
  getSecurityConfig,
  SecurityPolicyBuilder,
  SecurityProfiles,
  type SecurityPolicy,
  type SecurityConfiguration,
  DEFAULT_SECURITY_POLICY,
} from './security-config';
export {
  SecurityAuditLogger,
  getSecurityAuditLogger,
  SecurityMonitor,
  type SecurityEvent,
  type SecurityEventType,
  type SecurityEventSeverity,
  type AuditConfiguration,
  type AlertRule,
} from './audit-logger';

import { getInputValidator } from './input-validator';
import { getFileAccessController } from './file-access-controller';
import { getSecurityConfig } from './security-config';
import { getSecurityAuditLogger } from './audit-logger';
import { DataPilotError } from '../core/types';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';

/**
 * Initialize the security framework
 */
export async function initializeSecurity(options?: {
  environment?: 'development' | 'production' | 'ci' | 'test';
  auditLogPath?: string;
  enableAdvancedThreatDetection?: boolean;
}): Promise<void> {
  try {
    logger.info('Initializing DataPilot Security Framework', options);

    // Initialize security configuration
    const securityConfig = getSecurityConfig();
    if (options?.environment) {
      securityConfig.applyEnvironmentOverrides(options.environment);
    }

    // Validate security configuration
    const validation = securityConfig.validateConfiguration();
    if (!validation.isValid) {
      throw new DataPilotError(
        `Security configuration validation failed: ${validation.errors.join(', ')}`,
        'SECURITY_CONFIG_INVALID',
      );
    }

    if (validation.warnings.length > 0) {
      logger.warn('Security configuration warnings', {
        warnings: validation.warnings,
      });
    }

    // Initialize audit logging
    const auditLogger = getSecurityAuditLogger();
    await auditLogger.logSecurityEvent(
      'system_security',
      'Security framework initialized',
      {
        environment: options?.environment,
        configValidation: validation,
      },
      {
        severity: 'low',
        outcome: 'success',
      },
    );

    // Enable advanced features if requested
    if (options?.enableAdvancedThreatDetection) {
      securityConfig.updateSecurityFeatures({
        enableAdvancedThreatDetection: true,
        enableRealTimeMonitoring: true,
        enableIntrusionDetection: true,
      });
    }

    logger.info('DataPilot Security Framework initialized successfully', {
      environment: options?.environment,
      features: Object.keys(securityConfig.getSecurityFeatures()),
    });
  } catch (error) {
    logger.error('Failed to initialize security framework', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Secure wrapper for file operations
 */
export class SecureDataPilot {
  private inputValidator = getInputValidator();
  private fileController = getFileAccessController();
  private auditLogger = getSecurityAuditLogger();

  /**
   * Securely validate and process a file path
   */
  async validateAndProcessFile(
    filePath: string,
    operation: 'read' | 'write' | 'analyze',
    context?: LogContext,
  ): Promise<{
    isValid: boolean;
    sanitizedPath?: string;
    securityHandle?: any;
    errors: string[];
  }> {
    try {
      // Log the operation attempt
      await this.auditLogger.logFileAccessEvent(
        filePath,
        operation,
        'success',
        context?.userId,
        { originalPath: filePath },
        context,
      );

      // Validate the file path
      const validation = this.inputValidator.validateFilePath(filePath);

      if (!validation.isValid) {
        await this.auditLogger.logFileAccessEvent(
          filePath,
          operation,
          'blocked',
          context?.userId,
          {
            reason: 'Validation failed',
            errors: validation.errors.map((e) => typeof e === 'string' ? e : e.message),
          },
          context,
        );

        return {
          isValid: false,
          errors: validation.errors.map((e) => typeof e === 'string' ? e : e.message),
        };
      }

      // Create secure file handle
      const handle = await this.fileController.createSecureHandle(
        validation.sanitizedValue as string,
        operation === 'analyze' ? 'read' : operation,
        undefined,
        context,
      );

      return {
        isValid: true,
        sanitizedPath: validation.sanitizedValue as string,
        securityHandle: handle,
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.auditLogger.logFileAccessEvent(
        filePath,
        operation,
        'failure',
        context?.userId,
        { error: errorMessage },
        context,
      );

      return {
        isValid: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Securely validate CLI options
   */
  validateCLIOptions(
    options: Record<string, unknown>,
    context?: LogContext,
  ): {
    isValid: boolean;
    sanitizedOptions?: Record<string, unknown>;
    errors: string[];
    warnings: string[];
  } {
    try {
      const validation = this.inputValidator.validateCLIInput(options, context);

      // Log validation attempt
      this.auditLogger.logSecurityEvent(
        'input_validation',
        'CLI options validation',
        {
          optionKeys: Object.keys(options),
          isValid: validation.isValid,
          errorCount: validation.errors.length,
        },
        {
          severity: validation.isValid ? 'low' : 'medium',
          outcome: validation.isValid ? 'success' : 'failure',
          context,
        },
      );

      return {
        isValid: validation.isValid,
        sanitizedOptions: (validation.sanitizedValue as unknown) as Record<string, unknown> | undefined,
        errors: validation.errors.map((e) => typeof e === 'string' ? e : e.message),
        warnings: validation.warnings,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.auditLogger.logSecurityEvent(
        'input_validation',
        'CLI options validation failed',
        { error: errorMessage },
        {
          severity: 'high',
          outcome: 'failure',
          context,
        },
      );

      return {
        isValid: false,
        errors: [errorMessage],
        warnings: [],
      };
    }
  }

  /**
   * Get security status and statistics
   */
  getSecurityStatus(): {
    isHealthy: boolean;
    statistics: any;
    recentEvents: any[];
    warnings: string[];
  } {
    const fileStats = this.fileController.getStatistics();
    const auditStats = this.auditLogger.getStatistics();
    const recentEvents = this.auditLogger.getEvents({ limit: 10 });

    const warnings: string[] = [];

    // Check for security issues
    if (fileStats.quarantinedFiles > 0) {
      warnings.push(`${fileStats.quarantinedFiles} files are quarantined`);
    }

    if (auditStats.eventsBySeverity.critical > 0) {
      warnings.push(`${auditStats.eventsBySeverity.critical} critical security events`);
    }

    if (auditStats.averageRiskScore > 7) {
      warnings.push('High average risk score detected');
    }

    return {
      isHealthy: warnings.length === 0,
      statistics: {
        fileAccess: fileStats,
        audit: auditStats,
      },
      recentEvents,
      warnings,
    };
  }
}

/**
 * Global security instance
 */
let globalSecureDataPilot: SecureDataPilot;

/**
 * Get the global secure DataPilot instance
 */
export function getSecureDataPilot(): SecureDataPilot {
  if (!globalSecureDataPilot) {
    globalSecureDataPilot = new SecureDataPilot();
  }
  return globalSecureDataPilot;
}

/**
 * Security decorator for method execution monitoring
 */
export function securityMonitor(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const auditLogger = getSecurityAuditLogger();
      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);

        await auditLogger.logSecurityEvent(
          'system_security',
          `Method execution: ${operation}`,
          {
            className: target.constructor.name,
            methodName: propertyName,
            duration: Date.now() - startTime,
            argsCount: args.length,
          },
          {
            severity: 'low',
            outcome: 'success',
          },
        );

        return result;
      } catch (error) {
        await auditLogger.logSecurityEvent(
          'system_security',
          `Method execution failed: ${operation}`,
          {
            className: target.constructor.name,
            methodName: propertyName,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
          },
          {
            severity: 'medium',
            outcome: 'failure',
          },
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Sanitize error messages for safe display
   */
  sanitizeErrorMessage(error: Error | string, hideSystemPaths: boolean = true): string {
    const message = typeof error === 'string' ? error : error.message;

    if (!hideSystemPaths) {
      return message;
    }

    // Remove system paths and sensitive information
    return message
      .replace(/\/[^\s]+\/[^\s]+/g, '[PATH]') // Remove Unix paths
      .replace(/[A-Z]:\\[^\s]+/g, '[PATH]') // Remove Windows paths
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Remove emails
  },

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Hash sensitive data
   */
  hashSensitiveData(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    const crypto = require('crypto');
    return crypto.createHash(algorithm).update(data).digest('hex');
  },
};
