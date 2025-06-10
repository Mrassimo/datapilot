/**
 * Adaptive Streaming Engine
 * Intelligent chunk sizing and streaming optimization for large files
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import type { MemoryOptimizer } from './memory-optimizer';
import { getGlobalMemoryOptimizer } from './memory-optimizer';
import { logger } from '../utils/logger';

interface AdaptiveStreamingOptions {
  initialChunkSize?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
  adaptationInterval?: number;
  performanceTargetMBps?: number;
  memoryPressureThreshold?: number;
  enableProgressiveLoading?: boolean;
  maxConcurrentChunks?: number;
}

interface StreamingMetrics {
  bytesProcessed: number;
  chunksProcessed: number;
  averageChunkSize: number;
  processingRate: number; // MB/s
  memoryEfficiency: number;
  adaptationCount: number;
  totalTime: number;
}

interface ChunkProcessingResult {
  data: Buffer;
  size: number;
  processingTime: number;
  memoryUsage: number;
  success: boolean;
  error?: string;
}

interface StreamingSession {
  id: string;
  filePath: string;
  fileSize: number;
  totalChunks: number;
  processedChunks: number;
  metrics: StreamingMetrics;
  startTime: number;
  adaptiveChunkSize: number;
}

/**
 * Adaptive streaming engine with intelligent chunk sizing
 */
export class AdaptiveStreamer extends EventEmitter {
  private options: Required<AdaptiveStreamingOptions>;
  private memoryOptimizer: MemoryOptimizer;
  private activeSessions: Map<string, StreamingSession> = new Map();
  private performanceHistory: number[] = [];
  private adaptationHistory: number[] = [];

  constructor(options: AdaptiveStreamingOptions = {}) {
    super();

    this.options = {
      initialChunkSize: options.initialChunkSize || 64 * 1024, // 64KB
      minChunkSize: options.minChunkSize || 4 * 1024, // 4KB
      maxChunkSize: options.maxChunkSize || 16 * 1024 * 1024, // 16MB
      adaptationInterval: options.adaptationInterval || 5, // Every 5 chunks
      performanceTargetMBps: options.performanceTargetMBps || 50, // 50 MB/s target
      memoryPressureThreshold: options.memoryPressureThreshold || 0.8,
      enableProgressiveLoading: options.enableProgressiveLoading ?? true,
      maxConcurrentChunks: options.maxConcurrentChunks || 3,
    };

    this.memoryOptimizer = getGlobalMemoryOptimizer();

    // Listen to memory pressure events
    this.memoryOptimizer.on('memory-pressure', (data) => {
      this.handleMemoryPressure(data.pressure);
    });

    this.memoryOptimizer.on('memory-critical', (data) => {
      this.handleCriticalMemory(data.pressure);
    });

    logger.info(
      `Adaptive streamer initialized with ${this.formatBytes(this.options.initialChunkSize)} initial chunk size`,
    );
  }

  /**
   * Create a new streaming session
   */
  async createSession(filePath: string): Promise<string> {
    const sessionId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const fileStats = await fs.stat(filePath);
      const estimatedChunks = Math.ceil(fileStats.size / this.options.initialChunkSize);

      const session: StreamingSession = {
        id: sessionId,
        filePath,
        fileSize: fileStats.size,
        totalChunks: estimatedChunks,
        processedChunks: 0,
        metrics: {
          bytesProcessed: 0,
          chunksProcessed: 0,
          averageChunkSize: this.options.initialChunkSize,
          processingRate: 0,
          memoryEfficiency: 1,
          adaptationCount: 0,
          totalTime: 0,
        },
        startTime: performance.now(),
        adaptiveChunkSize: this.options.initialChunkSize,
      };

      this.activeSessions.set(sessionId, session);

      logger.info(
        `Created streaming session ${sessionId} for ${this.formatBytes(fileStats.size)} file`,
      );
      this.emit('session-created', { sessionId, fileSize: fileStats.size, estimatedChunks });

      return sessionId;
    } catch (error) {
      throw new Error(`Failed to create streaming session: ${error.message}`);
    }
  }

  /**
   * Process file with adaptive streaming
   */
  async *streamFile(
    sessionId: string,
    processor: (chunk: Buffer, metadata: any) => Promise<any>,
  ): AsyncGenerator<any, void, unknown> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fileHandle = await fs.open(session.filePath, 'r');
    let currentPosition = 0;
    let chunkIndex = 0;

    try {
      while (currentPosition < session.fileSize) {
        const chunkStartTime = performance.now();

        // Determine optimal chunk size
        const optimalChunkSize = this.calculateOptimalChunkSize(session, chunkIndex);
        const actualChunkSize = Math.min(optimalChunkSize, session.fileSize - currentPosition);

        // Get buffer from memory optimizer
        const buffer = this.memoryOptimizer.getBuffer(actualChunkSize);

        try {
          // Read chunk
          const readResult = await fileHandle.read(buffer, 0, actualChunkSize, currentPosition);
          const chunk = buffer.subarray(0, readResult.bytesRead);

          // Process chunk
          const metadata = {
            chunkIndex,
            chunkSize: readResult.bytesRead,
            filePosition: currentPosition,
            isLastChunk: currentPosition + readResult.bytesRead >= session.fileSize,
            sessionId,
            adaptiveSize: optimalChunkSize,
          };

          const processingStartTime = performance.now();
          const result = await processor(chunk, metadata);
          const processingTime = performance.now() - processingStartTime;

          // Update session metrics
          this.updateSessionMetrics(session, readResult.bytesRead, processingTime, chunkStartTime);

          // Adapt chunk size if needed
          if (chunkIndex % this.options.adaptationInterval === 0 && chunkIndex > 0) {
            await this.adaptChunkSize(session, processingTime, actualChunkSize);
          }

          currentPosition += readResult.bytesRead;
          chunkIndex++;

          // Return buffer to pool
          this.memoryOptimizer.returnBuffer(buffer);

          // Emit progress
          this.emit('chunk-processed', {
            sessionId,
            chunkIndex,
            progress: currentPosition / session.fileSize,
            processingRate: session.metrics.processingRate,
            adaptiveChunkSize: session.adaptiveChunkSize,
          });

          yield result;
        } catch (processingError) {
          this.memoryOptimizer.returnBuffer(buffer);
          throw processingError;
        }
      }
    } finally {
      await fileHandle.close();
      this.finalizeSession(session);
    }
  }

  /**
   * Calculate optimal chunk size based on current conditions
   */
  private calculateOptimalChunkSize(session: StreamingSession, chunkIndex: number): number {
    let baseSize = session.adaptiveChunkSize;

    // Get memory optimizer recommendation
    const memoryRecommendation = this.memoryOptimizer.getAdaptiveChunkSize(baseSize);
    baseSize = memoryRecommendation.recommendedSize;

    // Apply performance-based adaptations
    if (session.metrics.processingRate > 0) {
      const performanceRatio = session.metrics.processingRate / this.options.performanceTargetMBps;

      if (performanceRatio < 0.5) {
        // Performance is poor - reduce chunk size for better parallelization
        baseSize = Math.max(this.options.minChunkSize, baseSize * 0.7);
      } else if (performanceRatio > 1.5 && memoryRecommendation.memoryPressure < 0.6) {
        // Performance is good and memory is available - can increase chunk size
        baseSize = Math.min(this.options.maxChunkSize, baseSize * 1.3);
      }
    }

    // File size consideration
    const remainingSize = session.fileSize - session.metrics.bytesProcessed;
    const remainingChunks = Math.max(1, Math.ceil(remainingSize / baseSize));

    // If near end of file, adjust to avoid tiny last chunk
    if (remainingChunks <= 2 && remainingSize > 0) {
      baseSize = Math.floor(remainingSize / 2);
    }

    // Ensure within bounds
    return Math.max(this.options.minChunkSize, Math.min(this.options.maxChunkSize, baseSize));
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(
    session: StreamingSession,
    bytesProcessed: number,
    processingTime: number,
    chunkStartTime: number,
  ): void {
    const totalChunkTime = performance.now() - chunkStartTime;
    const currentTime = performance.now();
    const elapsedTime = (currentTime - session.startTime) / 1000; // seconds

    session.metrics.bytesProcessed += bytesProcessed;
    session.metrics.chunksProcessed++;
    session.metrics.totalTime = elapsedTime;

    // Calculate average chunk size
    session.metrics.averageChunkSize =
      session.metrics.bytesProcessed / session.metrics.chunksProcessed;

    // Calculate processing rate (MB/s)
    if (elapsedTime > 0) {
      session.metrics.processingRate = session.metrics.bytesProcessed / 1024 / 1024 / elapsedTime;
    }

    // Calculate memory efficiency
    const memoryPressure = this.memoryOptimizer.getMemoryPressure();
    session.metrics.memoryEfficiency = 1 - memoryPressure;

    // Update performance history for trend analysis
    this.performanceHistory.push(session.metrics.processingRate);
    if (this.performanceHistory.length > 20) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Adapt chunk size based on performance
   */
  private async adaptChunkSize(
    session: StreamingSession,
    processingTime: number,
    currentChunkSize: number,
  ): Promise<void> {
    const currentRate = session.metrics.processingRate;
    const targetRate = this.options.performanceTargetMBps;
    const memoryPressure = this.memoryOptimizer.getMemoryPressure();

    let newChunkSize = session.adaptiveChunkSize;
    let adaptationReason = 'No change needed';

    // Performance-based adaptation
    if (currentRate > 0) {
      const performanceRatio = currentRate / targetRate;

      if (performanceRatio < 0.6) {
        // Performance is significantly below target
        if (memoryPressure < 0.5) {
          // Try larger chunks for better throughput
          newChunkSize = Math.min(this.options.maxChunkSize, session.adaptiveChunkSize * 1.4);
          adaptationReason = 'Low performance, increasing chunk size';
        } else {
          // Memory pressure is high, reduce chunk size
          newChunkSize = Math.max(this.options.minChunkSize, session.adaptiveChunkSize * 0.8);
          adaptationReason = 'Low performance with memory pressure, reducing chunk size';
        }
      } else if (performanceRatio > 1.5 && memoryPressure < 0.3) {
        // Performance is good, memory is available - optimize for efficiency
        newChunkSize = Math.min(this.options.maxChunkSize, session.adaptiveChunkSize * 1.2);
        adaptationReason = 'Good performance, optimizing chunk size';
      }
    }

    // Memory pressure adaptation
    if (memoryPressure > this.options.memoryPressureThreshold) {
      const pressureReduction = Math.max(0.5, 1 - memoryPressure);
      newChunkSize = Math.max(this.options.minChunkSize, newChunkSize * pressureReduction);
      adaptationReason = `Memory pressure adaptation (${(memoryPressure * 100).toFixed(1)}%)`;
    }

    // Apply adaptation if significant change
    const changeRatio =
      Math.abs(newChunkSize - session.adaptiveChunkSize) / session.adaptiveChunkSize;
    if (changeRatio > 0.1) {
      // 10% change threshold
      const oldSize = session.adaptiveChunkSize;
      session.adaptiveChunkSize = newChunkSize;
      session.metrics.adaptationCount++;

      this.adaptationHistory.push(newChunkSize);
      if (this.adaptationHistory.length > 10) {
        this.adaptationHistory.shift();
      }

      logger.info(
        `Session ${session.id}: Adapted chunk size from ${this.formatBytes(oldSize)} to ${this.formatBytes(newChunkSize)} - ${adaptationReason}`,
      );

      this.emit('chunk-size-adapted', {
        sessionId: session.id,
        oldSize,
        newSize: newChunkSize,
        reason: adaptationReason,
        performanceRate: currentRate,
        memoryPressure,
      });
    }
  }

  /**
   * Handle memory pressure by reducing chunk sizes
   */
  private handleMemoryPressure(pressure: number): void {
    const reductionFactor = Math.max(0.3, 1 - pressure);

    for (const session of this.activeSessions.values()) {
      const oldSize = session.adaptiveChunkSize;
      session.adaptiveChunkSize = Math.max(
        this.options.minChunkSize,
        session.adaptiveChunkSize * reductionFactor,
      );

      if (session.adaptiveChunkSize !== oldSize) {
        logger.warn(
          `Session ${session.id}: Reduced chunk size due to memory pressure: ${this.formatBytes(oldSize)} → ${this.formatBytes(session.adaptiveChunkSize)}`,
        );
      }
    }
  }

  /**
   * Handle critical memory by aggressively reducing chunk sizes
   */
  private handleCriticalMemory(pressure: number): void {
    logger.error(
      `Critical memory pressure (${(pressure * 100).toFixed(1)}%) - emergency chunk size reduction`,
    );

    for (const session of this.activeSessions.values()) {
      session.adaptiveChunkSize = this.options.minChunkSize;
    }

    // Force garbage collection
    this.memoryOptimizer.forceGarbageCollection();
  }

  /**
   * Finalize session and cleanup
   */
  private finalizeSession(session: StreamingSession): void {
    const finalTime = performance.now();
    session.metrics.totalTime = (finalTime - session.startTime) / 1000;

    logger.info(
      `Session ${session.id} completed: ${this.formatBytes(session.metrics.bytesProcessed)} in ${session.metrics.totalTime.toFixed(2)}s (${session.metrics.processingRate.toFixed(2)} MB/s)`,
    );

    this.emit('session-completed', {
      sessionId: session.id,
      metrics: session.metrics,
      adaptationCount: session.metrics.adaptationCount,
    });

    this.activeSessions.delete(session.id);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): StreamingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get overall streaming statistics
   */
  getOverallStats(): {
    activeSessions: number;
    totalBytesProcessed: number;
    averageProcessingRate: number;
    performanceHistory: number[];
    adaptationHistory: number[];
    memoryStats: any;
    options: Required<AdaptiveStreamingOptions>;
  } {
    const activeSessions = Array.from(this.activeSessions.values());
    const totalBytesProcessed = activeSessions.reduce(
      (sum, s) => sum + s.metrics.bytesProcessed,
      0,
    );
    const avgProcessingRate =
      activeSessions.length > 0
        ? activeSessions.reduce((sum, s) => sum + s.metrics.processingRate, 0) /
          activeSessions.length
        : 0;

    return {
      activeSessions: activeSessions.length,
      totalBytesProcessed,
      averageProcessingRate: avgProcessingRate,
      performanceHistory: [...this.performanceHistory],
      adaptationHistory: [...this.adaptationHistory],
      memoryStats: this.memoryOptimizer.getDetailedStats(),
      options: this.options,
    };
  }

  /**
   * Format bytes for human-readable output
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)}${units[unitIndex]}`;
  }

  /**
   * Cleanup all sessions and resources
   */
  cleanup(): void {
    for (const sessionId of this.activeSessions.keys()) {
      this.activeSessions.delete(sessionId);
    }

    this.performanceHistory = [];
    this.adaptationHistory = [];

    logger.info('Adaptive streamer cleanup completed');
  }
}

/**
 * Global adaptive streamer instance
 */
let globalAdaptiveStreamer: AdaptiveStreamer | null = null;

/**
 * Get or create global adaptive streamer
 */
export function getGlobalAdaptiveStreamer(options?: AdaptiveStreamingOptions): AdaptiveStreamer {
  if (!globalAdaptiveStreamer) {
    globalAdaptiveStreamer = new AdaptiveStreamer(options);
  }
  return globalAdaptiveStreamer;
}

/**
 * Shutdown global adaptive streamer
 */
export function shutdownGlobalAdaptiveStreamer(): void {
  if (globalAdaptiveStreamer) {
    globalAdaptiveStreamer.cleanup();
    globalAdaptiveStreamer = null;
  }
}
