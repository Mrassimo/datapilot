/**
 * Enhanced Progress Orchestration System
 * Manages complex progress reporting across multiple analyzers with aggregation and callbacks
 */

import type { 
  ProgressState, 
  ProgressCallback, 
  ProgressCallbacks,
  ResourceMetrics,
  ResourceMonitor,
  CLIOptions
} from './types';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';

/**
 * Progress phase configuration for different analysis sections
 */
export interface ProgressPhaseConfig {
  name: string;
  weight: number; // 0-100, relative weight in overall progress
  estimatedDuration?: number; // milliseconds
  subPhases?: Array<{
    name: string;
    weight: number; // relative to parent phase
  }>;
}

/**
 * Overall progress state across all sections
 */
export interface OverallProgressState {
  currentPhase: string;
  currentSection: string;
  overallProgress: number; // 0-100
  sectionProgress: number; // 0-100
  phaseProgress: number; // 0-100
  timeElapsed: number;
  estimatedTimeRemaining?: number;
  sectionsCompleted: number;
  totalSections: number;
  memoryUsage?: number;
  rowsProcessed: number;
}

/**
 * Enhanced progress orchestrator with hierarchical progress tracking
 */
export class ProgressOrchestrator implements ResourceMonitor {
  private callbacks: ProgressCallbacks;
  private phases: Map<string, ProgressPhaseConfig> = new Map();
  private currentPhase?: string;
  private currentSection?: string;
  private sectionProgress = 0;
  private phaseProgress = 0;
  private overallProgress = 0;
  private startTime: number;
  private phaseStartTime: number = 0;
  private sectionStartTime: number = 0;
  private completedSections = 0;
  private totalSections = 0;
  private resourceMetrics: ResourceMetrics;
  private context: LogContext;

  constructor(
    callbacks: ProgressCallbacks = {},
    options: CLIOptions = {},
    context: LogContext = {}
  ) {
    this.callbacks = callbacks;
    this.context = context;
    this.startTime = Date.now();
    this.resourceMetrics = {
      memoryUsage: 0,
      processingTime: 0,
      rowsProcessed: 0,
      sectionsCompleted: 0,
    };
    
    this.setupDefaultPhases();
    this.setupProgressLogging(options);
  }

  /**
   * Setup default phase configurations for DataPilot sections
   */
  private setupDefaultPhases(): void {
    const defaultPhases: ProgressPhaseConfig[] = [
      {
        name: 'initialization',
        weight: 5,
        estimatedDuration: 2000,
        subPhases: [
          { name: 'validation', weight: 40 },
          { name: 'setup', weight: 60 },
        ],
      },
      {
        name: 'section1',
        weight: 15,
        estimatedDuration: 10000,
        subPhases: [
          { name: 'metadata_collection', weight: 30 },
          { name: 'structural_analysis', weight: 40 },
          { name: 'environment_profiling', weight: 30 },
        ],
      },
      {
        name: 'section2',
        weight: 20,
        estimatedDuration: 15000,
        subPhases: [
          { name: 'completeness_analysis', weight: 25 },
          { name: 'uniqueness_analysis', weight: 25 },
          { name: 'validity_analysis', weight: 25 },
          { name: 'quality_scoring', weight: 25 },
        ],
      },
      {
        name: 'section3',
        weight: 25,
        estimatedDuration: 20000,
        subPhases: [
          { name: 'univariate_analysis', weight: 40 },
          { name: 'bivariate_analysis', weight: 35 },
          { name: 'correlation_analysis', weight: 25 },
        ],
      },
      {
        name: 'section4',
        weight: 15,
        estimatedDuration: 8000,
        subPhases: [
          { name: 'chart_selection', weight: 50 },
          { name: 'accessibility_optimization', weight: 30 },
          { name: 'recommendation_generation', weight: 20 },
        ],
      },
      {
        name: 'section5',
        weight: 10,
        estimatedDuration: 12000,
        subPhases: [
          { name: 'schema_analysis', weight: 40 },
          { name: 'transformation_analysis', weight: 35 },
          { name: 'ml_readiness', weight: 25 },
        ],
      },
      {
        name: 'section6',
        weight: 10,
        estimatedDuration: 10000,
        subPhases: [
          { name: 'task_identification', weight: 30 },
          { name: 'algorithm_selection', weight: 40 },
          { name: 'workflow_generation', weight: 30 },
        ],
      },
    ];

    defaultPhases.forEach(phase => this.phases.set(phase.name, phase));
  }

  /**
   * Setup progress logging based on CLI options
   */
  private setupProgressLogging(options: CLIOptions): void {
    if (options.verbose) {
      this.callbacks.onProgress = (state) => {
        logger.debug(
          `Progress: ${state.phase} - ${state.progress}% - ${state.message}`,
          { ...this.context, progress: state.progress, phase: state.phase }
        );
      };
    }

    if (!options.quiet && options.showProgress !== false) {
      // Add default console progress if no custom callback
      if (!this.callbacks.onProgress) {
        this.callbacks.onProgress = (state) => {
          const timeStr = this.formatDuration(state.timeElapsed);
          const etaStr = state.estimatedTimeRemaining 
            ? ` (ETA: ${this.formatDuration(state.estimatedTimeRemaining)})` 
            : '';
          console.log(`  ${state.progress}% - ${state.message} [${timeStr}]${etaStr}`);
        };
      }
    }
  }

  /**
   * Start monitoring for resource usage
   */
  startMonitoring(context: LogContext): void {
    this.context = { ...this.context, ...context };
    this.startTime = Date.now();
    logger.debug('Started progress monitoring', this.context);
  }

  /**
   * Set the total number of sections for progress calculation
   */
  setTotalSections(total: number): void {
    this.totalSections = total;
    logger.debug(`Set total sections to ${total}`, this.context);
  }

  /**
   * Start a new phase with optional subphase tracking
   */
  startPhase(phaseName: string, message: string): void {
    this.currentPhase = phaseName;
    this.phaseStartTime = Date.now();
    this.phaseProgress = 0;

    const phase = this.phases.get(phaseName);
    if (phase) {
      logger.debug(
        `Starting phase ${phaseName} (weight: ${phase.weight}%, estimated: ${phase.estimatedDuration}ms)`,
        { ...this.context, phase: phaseName }
      );
    }

    this.callbacks.onPhaseStart?.(phaseName, message);
    this.updateOverallProgress();
  }

  /**
   * Start a new section within the current phase
   */
  startSection(sectionName: string, message: string): void {
    this.currentSection = sectionName;
    this.sectionStartTime = Date.now();
    this.sectionProgress = 0;

    logger.debug(`Starting section ${sectionName}`, {
      ...this.context,
      phase: this.currentPhase,
      section: sectionName,
    });

    this.callbacks.onPhaseStart?.(sectionName, message);
    this.updateOverallProgress();
  }

  /**
   * Update progress within the current phase/section
   */
  updateProgress(state: Partial<ProgressState>): void {
    if (state.progress !== undefined) {
      this.sectionProgress = Math.max(0, Math.min(100, state.progress));
    }

    // Update resource metrics if provided
    if (state.timeElapsed) {
      this.resourceMetrics.processingTime = state.timeElapsed;
    }

    this.updateOverallProgress();

    const fullState: ProgressState = {
      phase: state.phase || this.currentPhase || 'unknown',
      progress: this.sectionProgress,
      message: state.message || 'Processing...',
      timeElapsed: state.timeElapsed || Date.now() - this.startTime,
      estimatedTimeRemaining: state.estimatedTimeRemaining || this.calculateETA(),
    };

    this.callbacks.onProgress?.(fullState);
  }

  /**
   * Update resource metrics
   */
  updateMetrics(metrics: Partial<ResourceMetrics>): void {
    this.resourceMetrics = { ...this.resourceMetrics, ...metrics };
    
    if (metrics.rowsProcessed !== undefined) {
      logger.debug(`Processed ${metrics.rowsProcessed} rows`, {
        ...this.context,
        rowsProcessed: metrics.rowsProcessed,
      });
    }
  }

  /**
   * Complete the current phase
   */
  completePhase(message: string): void {
    const duration = Date.now() - this.phaseStartTime;
    
    if (this.currentPhase) {
      logger.info(`Completed phase ${this.currentPhase} in ${duration}ms`, {
        ...this.context,
        phase: this.currentPhase,
        duration,
      });
    }

    this.callbacks.onPhaseComplete?.(message, duration);
    this.updateOverallProgress();
  }

  /**
   * Complete the current section
   */
  completeSection(message: string): void {
    const duration = Date.now() - this.sectionStartTime;
    this.completedSections++;
    this.resourceMetrics.sectionsCompleted = this.completedSections;
    
    if (this.currentSection) {
      logger.info(`Completed section ${this.currentSection} in ${duration}ms`, {
        ...this.context,
        section: this.currentSection,
        duration,
        completedSections: this.completedSections,
      });
    }

    this.callbacks.onPhaseComplete?.(message, duration);
    this.updateOverallProgress();
  }

  /**
   * Report an error in the current phase
   */
  reportError(message: string, error?: Error): void {
    logger.error(`Error in ${this.currentPhase || 'unknown phase'}: ${message}`, this.context, error);
    this.callbacks.onError?.(message);
  }

  /**
   * Report a warning
   */
  reportWarning(message: string): void {
    logger.warn(`Warning in ${this.currentPhase || 'unknown phase'}: ${message}`, this.context);
    this.callbacks.onWarning?.(message);
  }

  /**
   * Calculate overall progress based on phase weights and section completion
   */
  private updateOverallProgress(): void {
    let totalProgress = 0;

    // Add progress from completed phases
    for (const [phaseName, config] of this.phases) {
      if (phaseName === this.currentPhase) {
        // Current phase contributes partial progress
        totalProgress += (config.weight * this.sectionProgress) / 100;
        break;
      } else if (this.isPhaseCompleted(phaseName)) {
        // Completed phases contribute full weight
        totalProgress += config.weight;
      }
    }

    this.overallProgress = Math.max(0, Math.min(100, totalProgress));
  }

  /**
   * Check if a phase has been completed
   */
  private isPhaseCompleted(phaseName: string): boolean {
    // This is a simplified check - in practice, we'd track completed phases
    const phaseOrder = ['initialization', 'section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
    const currentIndex = phaseOrder.indexOf(this.currentPhase || '');
    const checkIndex = phaseOrder.indexOf(phaseName);
    
    return checkIndex >= 0 && checkIndex < currentIndex;
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateETA(): number | undefined {
    if (this.overallProgress <= 0) return undefined;

    const timeElapsed = Date.now() - this.startTime;
    const estimatedTotal = (timeElapsed / this.overallProgress) * 100;
    const remaining = estimatedTotal - timeElapsed;

    return Math.max(0, remaining);
  }

  /**
   * Get current overall progress state
   */
  getOverallState(): OverallProgressState {
    return {
      currentPhase: this.currentPhase || 'unknown',
      currentSection: this.currentSection || 'unknown',
      overallProgress: this.overallProgress,
      sectionProgress: this.sectionProgress,
      phaseProgress: this.phaseProgress,
      timeElapsed: Date.now() - this.startTime,
      estimatedTimeRemaining: this.calculateETA(),
      sectionsCompleted: this.completedSections,
      totalSections: this.totalSections,
      memoryUsage: this.resourceMetrics.memoryUsage,
      rowsProcessed: this.resourceMetrics.rowsProcessed,
    };
  }

  /**
   * Check if resource thresholds are exceeded
   */
  checkThresholds(): { exceeded: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let exceeded = false;

    // Check memory usage (if available)
    if (this.resourceMetrics.memoryUsage > 0) {
      const memoryMB = this.resourceMetrics.memoryUsage / (1024 * 1024);
      if (memoryMB > 1024) { // 1GB threshold
        warnings.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
        exceeded = true;
      }
    }

    // Check processing time
    const timeElapsed = Date.now() - this.startTime;
    if (timeElapsed > 300000) { // 5 minutes
      warnings.push(`Long processing time: ${this.formatDuration(timeElapsed)}`);
    }

    return { exceeded, warnings };
  }

  /**
   * Stop monitoring and return final metrics
   */
  stopMonitoring(): ResourceMetrics {
    const finalMetrics: ResourceMetrics = {
      ...this.resourceMetrics,
      processingTime: Date.now() - this.startTime,
      sectionsCompleted: this.completedSections,
    };

    logger.debug('Stopped progress monitoring', {
      ...this.context,
      finalMetrics,
    });

    return finalMetrics;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.round((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Create a scoped progress callback for a specific section
   */
  createSectionCallback(sectionName: string, sectionWeight: number = 100): ProgressCallback {
    return (state: ProgressState) => {
      // Scale the progress based on section weight
      const scaledProgress = (state.progress * sectionWeight) / 100;
      
      this.updateProgress({
        ...state,
        progress: scaledProgress,
        phase: sectionName,
      });
    };
  }

  /**
   * Create a progress callback that aggregates multiple sub-operations
   */
  createAggregatedCallback(
    subOperations: Array<{ name: string; weight: number }>
  ): (operationName: string, progress: number) => void {
    const operationProgress = new Map<string, number>();
    
    return (operationName: string, progress: number) => {
      operationProgress.set(operationName, progress);
      
      // Calculate weighted average
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (const op of subOperations) {
        const opProgress = operationProgress.get(op.name) || 0;
        totalWeight += op.weight;
        weightedSum += opProgress * op.weight;
      }
      
      const aggregatedProgress = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      this.updateProgress({
        progress: aggregatedProgress,
        message: `${operationName}: ${progress}%`,
        timeElapsed: Date.now() - this.startTime,
      });
    };
  }
}

/**
 * Factory function to create a progress orchestrator with sensible defaults
 */
export function createProgressOrchestrator(
  options: CLIOptions,
  context: LogContext = {}
): ProgressOrchestrator {
  const callbacks: ProgressCallbacks = {};
  
  // Setup callbacks based on options
  if (!options.quiet) {
    callbacks.onPhaseStart = (phase, message) => {
      if (options.verbose) {
        console.log(`\n🔄 ${phase}: ${message}`);
      }
    };
    
    callbacks.onPhaseComplete = (message, timeElapsed) => {
      const duration = timeElapsed < 1000 
        ? `${Math.round(timeElapsed)}ms` 
        : `${(timeElapsed / 1000).toFixed(1)}s`;
      console.log(`✅ ${message} [${duration}]`);
    };
    
    callbacks.onError = (message) => {
      console.error(`❌ ${message}`);
    };
    
    callbacks.onWarning = (message) => {
      console.warn(`⚠️  ${message}`);
    };
  }

  return new ProgressOrchestrator(callbacks, options, context);
}