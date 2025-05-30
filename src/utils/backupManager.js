/**
 * Backup Manager for DataPilot Knowledge Base
 * Prevents data loss identified as critical risk in Google review
 */

import fs from 'fs/promises';
import path from 'path';

export class BackupManager {
  constructor(options = {}) {
    this.maxBackups = options.maxBackups || 5;
    this.backupInterval = options.backupInterval || 3600000; // 1 hour
    this.compressionEnabled = options.compression || false;
  }

  /**
   * Create backup of file before modification
   * @param {string} filePath - Path to file to backup
   * @returns {Promise<string|null>} - Path to backup file or null if failed
   */
  async createBackup(filePath) {
    try {
      // Check if original file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        // File doesn't exist - no backup needed
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup-${timestamp}`;
      
      // Create backup directory if it doesn't exist
      const backupDir = path.dirname(backupPath);
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy file to backup location
      await fs.copyFile(filePath, backupPath);
      
      // Clean up old backups
      await this.cleanupOldBackups(filePath);
      
      return backupPath;
    } catch (error) {
      console.warn('Failed to create backup for', filePath, ':', error.message);
      return null;
    }
  }

  /**
   * Restore from most recent backup
   * @param {string} filePath - Original file path
   * @returns {Promise<boolean>} - true if restored successfully
   */
  async restoreFromBackup(filePath) {
    try {
      const backups = await this.listBackups(filePath);
      
      if (backups.length === 0) {
        return false;
      }
      
      // Use most recent backup
      const latestBackup = backups[0];
      await fs.copyFile(latestBackup.path, filePath);
      
      console.log(`Restored ${filePath} from backup: ${latestBackup.path}`);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error.message);
      return false;
    }
  }

  /**
   * List all available backups for a file
   * @param {string} filePath 
   * @returns {Promise<Array>} - Array of backup info objects
   */
  async listBackups(filePath) {
    try {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      const files = await fs.readdir(dir);
      
      const backups = [];
      
      for (const file of files) {
        if (file.startsWith(`${basename}.backup-`)) {
          const backupPath = path.join(dir, file);
          const stats = await fs.stat(backupPath);
          
          // Extract timestamp from filename
          const timestampMatch = file.match(/\.backup-(.+)$/);
          const timestamp = timestampMatch ? timestampMatch[1] : '';
          
          backups.push({
            path: backupPath,
            timestamp,
            created: stats.mtime,
            size: stats.size
          });
        }
      }
      
      // Sort by creation time (newest first)
      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.warn('Failed to list backups:', error.message);
      return [];
    }
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   * @param {string} filePath 
   */
  async cleanupOldBackups(filePath) {
    try {
      const backups = await this.listBackups(filePath);
      
      // Remove backups beyond the limit
      const backupsToRemove = backups.slice(this.maxBackups);
      
      for (const backup of backupsToRemove) {
        try {
          await fs.unlink(backup.path);
        } catch (error) {
          console.warn('Failed to remove old backup:', backup.path, error.message);
        }
      }
      
      if (backupsToRemove.length > 0) {
        console.log(`Cleaned up ${backupsToRemove.length} old backups for ${filePath}`);
      }
    } catch (error) {
      console.warn('Failed to cleanup backups:', error.message);
    }
  }

  /**
   * Verify backup integrity
   * @param {string} backupPath 
   * @returns {Promise<boolean>}
   */
  async verifyBackup(backupPath) {
    try {
      // Basic verification - check if file exists and is readable
      const stats = await fs.stat(backupPath);
      
      if (stats.size === 0) {
        return false;
      }
      
      // For YAML files, try to parse
      if (backupPath.endsWith('.yml') || backupPath.endsWith('.yaml')) {
        const content = await fs.readFile(backupPath, 'utf8');
        // Basic YAML structure check
        if (!content.trim() || content.includes('undefined')) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get backup statistics
   * @param {string} filePath 
   * @returns {Promise<object>}
   */
  async getBackupStats(filePath) {
    const backups = await this.listBackups(filePath);
    
    let totalSize = 0;
    let oldestBackup = null;
    let newestBackup = null;
    
    for (const backup of backups) {
      totalSize += backup.size;
      
      if (!oldestBackup || backup.created < oldestBackup.created) {
        oldestBackup = backup;
      }
      
      if (!newestBackup || backup.created > newestBackup.created) {
        newestBackup = backup;
      }
    }
    
    return {
      count: backups.length,
      totalSize,
      oldestBackup,
      newestBackup,
      backups
    };
  }
}

/**
 * Specialized backup manager for DataPilot knowledge base
 */
export class KnowledgeBaseBackupManager extends BackupManager {
  constructor() {
    super({
      maxBackups: 10, // Keep more backups for knowledge base
      backupInterval: 1800000, // 30 minutes
    });
  }

  /**
   * Safe write with automatic backup
   * @param {string} filePath 
   * @param {string} content 
   * @returns {Promise<boolean>}
   */
  async safeWrite(filePath, content) {
    try {
      // Create backup before writing
      const backupPath = await this.createBackup(filePath);
      
      // Write new content
      await fs.writeFile(filePath, content, 'utf8');
      
      // Verify the write
      const written = await fs.readFile(filePath, 'utf8');
      if (written !== content) {
        throw new Error('Write verification failed');
      }
      
      return true;
    } catch (error) {
      console.error('Safe write failed:', error.message);
      
      // Attempt to restore from backup
      const restored = await this.restoreFromBackup(filePath);
      if (restored) {
        console.log('Successfully restored from backup after write failure');
      }
      
      throw error;
    }
  }

  /**
   * Validate knowledge base content before backup
   * @param {string} content 
   * @returns {boolean}
   */
  validateKnowledgeContent(content) {
    try {
      // Basic validation for YAML content
      if (!content || content.trim().length === 0) {
        return false;
      }
      
      // Check for corruption indicators
      if (content.includes('undefined') || content.includes('null')) {
        console.warn('Knowledge base content contains undefined/null values');
        return false;
      }
      
      // Check for basic YAML structure
      if (!content.includes(':') && !content.includes('-')) {
        console.warn('Content does not appear to be valid YAML');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Content validation failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance for knowledge base
export const knowledgeBaseBackup = new KnowledgeBaseBackupManager();

/**
 * Decorator for functions that need automatic backup
 * @param {string} filePathGetter - Function to get file path from arguments
 */
export function withBackup(filePathGetter) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const filePath = typeof filePathGetter === 'function' 
        ? filePathGetter(...args) 
        : filePathGetter;
        
      // Create backup before executing method
      await knowledgeBaseBackup.createBackup(filePath);
      
      try {
        return await method.apply(this, args);
      } catch (error) {
        // On error, consider restoring from backup
        console.warn('Method failed, backup available at:', filePath);
        throw error;
      }
    };
    
    return descriptor;
  };
}