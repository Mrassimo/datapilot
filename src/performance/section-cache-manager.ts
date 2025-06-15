/**
 * Section Cache Manager - Intelligent caching of section results
 * Addresses GitHub issue #23: Prevent re-processing files for each section
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { logger } from '../utils/logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  fileHash: string;
  fileSize: number;
  lastModified: number;
  dataSize: number;
  section: string;
  version: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  enabled: boolean;
  maxSizeBytes: number;
  maxEntries: number;
  ttlMs: number;
  cacheDirectory: string;
  enableDiskCache: boolean;
  enableMemoryCache: boolean;
  compressionLevel: number;
}

export class SectionCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  private config: CacheConfig;
  private readonly CACHE_VERSION = '1.0.0';

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      maxSizeBytes: 500 * 1024 * 1024, // 500MB default
      maxEntries: 1000,
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      cacheDirectory: path.join(os.tmpdir(), 'datapilot-cache'),
      enableDiskCache: true,
      enableMemoryCache: true,
      compressionLevel: 6, // gzip compression level
      ...config,
    };

    this.ensureCacheDirectory();
    this.cleanupExpiredEntries();
  }

  /**
   * Get cached result for a section
   */
  async get<T>(filePath: string, section: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    try {
      const cacheKey = await this.generateCacheKey(filePath, section);
      
      // Try memory cache first
      if (this.config.enableMemoryCache) {
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry && this.isValidEntry(memoryEntry, filePath)) {
          this.cacheStats.hits++;
          logger.debug(`Cache hit (memory): ${section} for ${path.basename(filePath)}`);
          return memoryEntry.data as T;
        }
      }

      // Try disk cache
      if (this.config.enableDiskCache) {
        const diskEntry = await this.getDiskEntry<T>(cacheKey);
        if (diskEntry && this.isValidEntry(diskEntry, filePath)) {
          // Promote to memory cache if enabled
          if (this.config.enableMemoryCache) {
            this.setMemoryEntry(cacheKey, diskEntry);
          }
          
          this.cacheStats.hits++;
          logger.debug(`Cache hit (disk): ${section} for ${path.basename(filePath)}`);
          return diskEntry.data as T;
        }
      }

      this.cacheStats.misses++;
      logger.debug(`Cache miss: ${section} for ${path.basename(filePath)}`);
      return null;
    } catch (error) {
      logger.warn(`Cache get error for ${section}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set cached result for a section
   */
  async set<T>(filePath: string, section: string, data: T): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const cacheKey = await this.generateCacheKey(filePath, section);
      const entry = await this.createCacheEntry(filePath, section, data);
      
      // Store in memory cache if enabled and data is not too large
      if (this.config.enableMemoryCache) {
        const isSmallEnough = entry.dataSize < 10 * 1024 * 1024; // 10MB threshold
        if (isSmallEnough) {
          this.setMemoryEntry(cacheKey, entry);
          logger.debug(`Cached in memory: ${section} for ${path.basename(filePath)} (${this.formatBytes(entry.dataSize)})`);
        }
      }

      // Store in disk cache if enabled
      if (this.config.enableDiskCache) {
        await this.setDiskEntry(cacheKey, entry);
        logger.debug(`Cached to disk: ${section} for ${path.basename(filePath)} (${this.formatBytes(entry.dataSize)})`);
      }

      // Trigger cleanup if needed
      await this.cleanup();
    } catch (error) {
      logger.warn(`Cache set error for ${section}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  async has(filePath: string, section: string): Promise<boolean> {
    const cached = await this.get(filePath, section);
    return cached !== null;
  }

  /**
   * Clear cache for a specific file
   */
  async clearFile(filePath: string): Promise<void> {
    try {
      const fileHash = await this.calculateFileHash(filePath);
      const keysToRemove: string[] = [];

      // Remove from memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.fileHash === fileHash) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.memoryCache.delete(key));

      // Remove from disk cache
      if (this.config.enableDiskCache) {
        const files = await fs.promises.readdir(this.config.cacheDirectory);
        const diskKeysToRemove = files.filter(file => file.includes(fileHash));
        
        await Promise.all(
          diskKeysToRemove.map(file => 
            fs.promises.unlink(path.join(this.config.cacheDirectory, file)).catch(() => {})
          )
        );
      }

      logger.info(`Cleared cache for ${path.basename(filePath)} (${keysToRemove.length} entries)`);
    } catch (error) {
      logger.warn(`Cache clear error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear disk cache
      if (this.config.enableDiskCache) {
        const files = await fs.promises.readdir(this.config.cacheDirectory);
        await Promise.all(
          files.map(file => 
            fs.promises.unlink(path.join(this.config.cacheDirectory, file)).catch(() => {})
          )
        );
      }

      // Reset stats
      this.cacheStats = { hits: 0, misses: 0, evictions: 0 };

      logger.info('Cleared all cache entries');
    } catch (error) {
      logger.warn(`Cache clear all error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memoryEntries = Array.from(this.memoryCache.values());
    const memorySizeBytes = memoryEntries.reduce((sum, entry) => sum + entry.dataSize, 0);

    let diskEntries = 0;
    let diskSizeBytes = 0;

    if (this.config.enableDiskCache) {
      try {
        const files = await fs.promises.readdir(this.config.cacheDirectory);
        diskEntries = files.length;
        
        const stats = await Promise.all(
          files.map(file => 
            fs.promises.stat(path.join(this.config.cacheDirectory, file)).catch(() => null)
          )
        );
        
        diskSizeBytes = stats
          .filter(stat => stat !== null)
          .reduce((sum, stat) => sum + stat!.size, 0);
      } catch (error) {
        // Ignore errors for stats
      }
    }

    const allTimestamps = memoryEntries.map(e => e.timestamp);
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;

    return {
      totalEntries: memoryEntries.length + diskEntries,
      totalSizeBytes: memorySizeBytes + diskSizeBytes,
      hitRate: totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0,
      totalHits: this.cacheStats.hits,
      totalMisses: this.cacheStats.misses,
      oldestEntry: allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0,
      newestEntry: allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0,
    };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    logger.info(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.ensureCacheDirectory();
    logger.info('Cache configuration updated');
  }

  /**
   * Generate cache key for file and section
   */
  private async generateCacheKey(filePath: string, section: string): Promise<string> {
    const fileHash = await this.calculateFileHash(filePath);
    const stats = await fs.promises.stat(filePath);
    
    const keyData = {
      fileHash,
      section,
      fileSize: stats.size,
      lastModified: stats.mtime.getTime(),
      version: this.CACHE_VERSION,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Calculate file hash for cache invalidation
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const stats = await fs.promises.stat(filePath);
      
      // For large files, use file metadata instead of content hash for performance
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        return crypto
          .createHash('sha256')
          .update(`${filePath}-${stats.size}-${stats.mtime.getTime()}`)
          .digest('hex');
      }

      // For smaller files, use content hash
      const content = await fs.promises.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      // Fallback to path-based hash
      return crypto.createHash('sha256').update(filePath).digest('hex');
    }
  }

  /**
   * Create cache entry
   */
  private async createCacheEntry<T>(filePath: string, section: string, data: T): Promise<CacheEntry<T>> {
    const stats = await fs.promises.stat(filePath);
    const fileHash = await this.calculateFileHash(filePath);
    const serializedData = JSON.stringify(data);

    return {
      data,
      timestamp: Date.now(),
      fileHash,
      fileSize: stats.size,
      lastModified: stats.mtime.getTime(),
      dataSize: Buffer.byteLength(serializedData, 'utf8'),
      section,
      version: this.CACHE_VERSION,
    };
  }

  /**
   * Check if cache entry is valid
   */
  private async isValidEntry(entry: CacheEntry, filePath: string): Promise<boolean> {
    try {
      // Check version compatibility
      if (entry.version !== this.CACHE_VERSION) {
        return false;
      }

      // Check TTL
      if (Date.now() - entry.timestamp > this.config.ttlMs) {
        return false;
      }

      // Check file modification
      const stats = await fs.promises.stat(filePath);
      if (stats.mtime.getTime() !== entry.lastModified || stats.size !== entry.fileSize) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set entry in memory cache with eviction
   */
  private setMemoryEntry(key: string, entry: CacheEntry): void {
    // Check if we need to evict
    while (this.memoryCache.size >= this.config.maxEntries) {
      this.evictOldestMemoryEntry();
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Evict oldest entry from memory cache
   */
  private evictOldestMemoryEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Date fields that need restoration during deserialization
   */
  private static readonly DATE_FIELDS = [
    'generatedAt',
    'lastModified', 
    'analysisStartTimestamp',
    'timestamp',
    'createdAt',
    'modifiedAt'
  ];

  /**
   * Custom JSON reviver to restore Date objects from strings
   */
  private static dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && SectionCacheManager.DATE_FIELDS.includes(key)) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  }

  /**
   * Get entry from disk cache
   */
  private async getDiskEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = path.join(this.config.cacheDirectory, `${key}.json`);
      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content, SectionCacheManager.dateReviver) as CacheEntry<T>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set entry in disk cache
   */
  private async setDiskEntry(key: string, entry: CacheEntry): Promise<void> {
    try {
      const filePath = path.join(this.config.cacheDirectory, `${key}.json`);
      const content = JSON.stringify(entry);
      await fs.promises.writeFile(filePath, content, 'utf8');
    } catch (error) {
      logger.warn(`Failed to write disk cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    try {
      if (!fs.existsSync(this.config.cacheDirectory)) {
        fs.mkdirSync(this.config.cacheDirectory, { recursive: true });
      }
    } catch (error) {
      logger.warn(`Failed to create cache directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired entries and enforce size limits
   */
  private async cleanup(): Promise<void> {
    try {
      await this.cleanupExpiredEntries();
      await this.enforceSizeLimit();
    } catch (error) {
      logger.warn(`Cache cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove expired entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    
    // Clean memory cache
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        expiredKeys.push(key);
      }
    }
    expiredKeys.forEach(key => this.memoryCache.delete(key));

    // Clean disk cache
    if (this.config.enableDiskCache) {
      try {
        const files = await fs.promises.readdir(this.config.cacheDirectory);
        const expiredFiles: string[] = [];

        for (const file of files) {
          try {
            const filePath = path.join(this.config.cacheDirectory, file);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const entry = JSON.parse(content) as CacheEntry;
            
            if (now - entry.timestamp > this.config.ttlMs) {
              expiredFiles.push(file);
            }
          } catch (error) {
            // If we can't read the file, consider it expired
            expiredFiles.push(file);
          }
        }

        await Promise.all(
          expiredFiles.map(file => 
            fs.promises.unlink(path.join(this.config.cacheDirectory, file)).catch(() => {})
          )
        );

        if (expiredFiles.length > 0) {
          logger.debug(`Cleaned up ${expiredFiles.length} expired cache entries`);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Enforce cache size limits
   */
  private async enforceSizeLimit(): Promise<void> {
    // Get current total size
    const stats = await this.getStats();
    
    if (stats.totalSizeBytes <= this.config.maxSizeBytes) {
      return; // Within limits
    }

    logger.info(`Cache size (${this.formatBytes(stats.totalSizeBytes)}) exceeds limit (${this.formatBytes(this.config.maxSizeBytes)}), cleaning up...`);

    // First, clean memory cache (keep only most recent entries)
    const memoryEntries = Array.from(this.memoryCache.entries());
    memoryEntries.sort(([, a], [, b]) => b.timestamp - a.timestamp);
    
    const keepCount = Math.floor(this.config.maxEntries * 0.8); // Keep 80%
    const toRemove = memoryEntries.slice(keepCount);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));

    // Then clean disk cache if still over limit
    if (this.config.enableDiskCache) {
      try {
        const files = await fs.promises.readdir(this.config.cacheDirectory);
        const fileEntries: Array<{ file: string; timestamp: number; size: number }> = [];

        for (const file of files) {
          try {
            const filePath = path.join(this.config.cacheDirectory, file);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const entry = JSON.parse(content) as CacheEntry;
            const fileStat = await fs.promises.stat(filePath);
            
            fileEntries.push({
              file,
              timestamp: entry.timestamp,
              size: fileStat.size,
            });
          } catch (error) {
            // Remove corrupted files
            try {
              await fs.promises.unlink(path.join(this.config.cacheDirectory, file));
            } catch (_error) {
              // Ignore unlink errors - file may not exist or be locked
            }
          }
        }

        // Sort by timestamp (oldest first) and remove until under size limit
        fileEntries.sort((a, b) => a.timestamp - b.timestamp);
        
        let currentSize = fileEntries.reduce((sum, entry) => sum + entry.size, 0);
        const toRemoveFiles: string[] = [];

        while (currentSize > this.config.maxSizeBytes && fileEntries.length > 0) {
          const entry = fileEntries.shift()!;
          toRemoveFiles.push(entry.file);
          currentSize -= entry.size;
        }

        await Promise.all(
          toRemoveFiles.map(file => 
            fs.promises.unlink(path.join(this.config.cacheDirectory, file)).catch(() => {})
          )
        );

        if (toRemoveFiles.length > 0) {
          logger.info(`Removed ${toRemoveFiles.length} cache files to enforce size limit`);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}