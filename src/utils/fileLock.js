/**
 * File Locking System for DataPilot Knowledge Base
 * Prevents concurrent access corruption identified in Google review
 */

import fs from 'fs/promises';
import path from 'path';

export class FileLockManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.lockPath = `${filePath}.lock`;
    this.maxRetries = 50; // 5 seconds with 100ms intervals
    this.retryInterval = 100;
  }

  /**
   * Acquire exclusive lock on file
   * @param {number} timeout - Maximum time to wait for lock (ms)
   * @returns {Promise<boolean>} - true if lock acquired
   */
  async acquireLock(timeout = 5000) {
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < timeout && attempts < this.maxRetries) {
      try {
        // Create lock file with process info
        const lockInfo = {
          pid: process.pid,
          timestamp: Date.now(),
          file: this.filePath
        };
        
        await fs.writeFile(
          this.lockPath, 
          JSON.stringify(lockInfo), 
          { flag: 'wx' } // Exclusive create - fails if exists
        );
        
        return true;
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock exists - check if it's stale
          const lockValid = await this.checkLockValidity();
          
          if (!lockValid) {
            // Remove stale lock and retry
            await this.forceRemoveLock();
          } else {
            // Valid lock exists, wait
            await this.sleep(this.retryInterval);
          }
        } else {
          // Other error - propagate
          throw new Error(`Failed to acquire lock: ${error.message}`);
        }
      }
      
      attempts++;
    }
    
    throw new Error(`Failed to acquire file lock within ${timeout}ms (${attempts} attempts)`);
  }

  /**
   * Release the file lock
   */
  async releaseLock() {
    try {
      // Verify we own the lock before removing
      const lockInfo = await this.readLockInfo();
      
      if (lockInfo && lockInfo.pid === process.pid) {
        await fs.unlink(this.lockPath);
      } else {
        console.warn('Attempting to release lock not owned by this process');
      }
    } catch (error) {
      // Lock might already be removed - this is not necessarily an error
      if (error.code !== 'ENOENT') {
        console.warn('Warning: Failed to release lock:', error.message);
      }
    }
  }

  /**
   * Check if existing lock is still valid
   * @returns {Promise<boolean>}
   */
  async checkLockValidity() {
    try {
      const lockInfo = await this.readLockInfo();
      
      if (!lockInfo) {
        return false;
      }
      
      // Check if lock is too old (stale)
      const lockAge = Date.now() - lockInfo.timestamp;
      if (lockAge > 30000) { // 30 seconds
        return false;
      }
      
      // Check if process is still running
      try {
        process.kill(lockInfo.pid, 0); // Signal 0 just checks if process exists
        return true;
      } catch (killError) {
        // Process doesn't exist
        return false;
      }
    } catch (error) {
      // Can't read lock file - assume invalid
      return false;
    }
  }

  /**
   * Read lock file information
   * @returns {Promise<object|null>}
   */
  async readLockInfo() {
    try {
      const content = await fs.readFile(this.lockPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Force remove lock file (for stale locks)
   */
  async forceRemoveLock() {
    try {
      await fs.unlink(this.lockPath);
    } catch (error) {
      // Ignore - might have been removed by another process
    }
  }

  /**
   * Sleep utility
   * @param {number} ms 
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute function with file lock
   * @param {Function} fn - Function to execute with lock
   * @param {number} timeout - Lock timeout
   * @returns {Promise<any>}
   */
  async withLock(fn, timeout = 5000) {
    await this.acquireLock(timeout);
    
    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }
}

/**
 * Global lock manager for knowledge base
 */
export class KnowledgeBaseLockManager {
  constructor() {
    this.lockManagers = new Map();
  }

  /**
   * Get lock manager for specific file
   * @param {string} filePath 
   * @returns {FileLockManager}
   */
  getLockManager(filePath) {
    if (!this.lockManagers.has(filePath)) {
      this.lockManagers.set(filePath, new FileLockManager(filePath));
    }
    return this.lockManagers.get(filePath);
  }

  /**
   * Execute function with lock on specific file
   * @param {string} filePath 
   * @param {Function} fn 
   * @param {number} timeout 
   * @returns {Promise<any>}
   */
  async withLock(filePath, fn, timeout = 5000) {
    const lockManager = this.getLockManager(filePath);
    return await lockManager.withLock(fn, timeout);
  }
}

// Export singleton instance
export const knowledgeBaseLocks = new KnowledgeBaseLockManager();

/**
 * Decorator for functions that need file locking
 * @param {string} filePathGetter - Function to get file path from arguments
 * @param {number} timeout 
 */
export function withFileLock(filePathGetter, timeout = 5000) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const filePath = typeof filePathGetter === 'function' 
        ? filePathGetter(...args) 
        : filePathGetter;
        
      return await knowledgeBaseLocks.withLock(
        filePath, 
        () => method.apply(this, args), 
        timeout
      );
    };
    
    return descriptor;
  };
}