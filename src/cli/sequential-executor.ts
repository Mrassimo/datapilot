/**
 * Sequential Section Execution Engine - Advanced orchestration for multi-section analysis
 * 
 * Ultra-Hard Challenges Solved:
 * 1. Memory Management: Efficient memory handling across sequential execution with automatic cleanup
 * 2. Error Propagation & Rollback: Graceful handling of cascading failures with proper rollback
 * 3. Result Passing: Correctly typed and passed section results instead of inadequate mocks
 * 4. Progress Tracking: Real-time progress reporting with estimated completion times
 * 5. Performance Optimization: Avoid redundant execution while maintaining correctness
 */

import type {
  CLIOptions,
  CLIResult,
  SectionResult,
  SectionResultMap,
  ProgressCallback,
  ProgressState,
  ProgressCallbacks,
} from './types';
import type { LogContext } from '../utils/logger';
import type { AnalysisDataset } from './universal-analyzer';

import { 
  AnalyzerDependencyResolver, 
  createDependencyResolver,
  type ExecutionPlan 
} from './dependency-resolver';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';
import { logger } from '../utils/logger';
import { globalMemoryManager } from '../utils/memory-manager';
import { globalErrorHandler, ErrorUtils } from '../utils/error-handler';
import { ResultCache, createResultCache } from './result-cache';

// Import existing analyzers
import { Section1Analyzer } from '../analyzers/overview';
import { Section2Analyzer } from '../analyzers/quality';
import { StreamingAnalyzer } from '../analyzers/streaming/streaming-analyzer';
import { Section4Analyzer } from '../analyzers/visualization';
import { Section5Analyzer } from '../analyzers/engineering';
import { Section6Analyzer } from '../analyzers/modeling';

/**
 * Execution state for tracking progress and rollback
 */
interface ExecutionState {
  currentSection: string | null;
  completedSections: Set<string>;
  rollbackStack: Array<{
    section: string;
    timestamp: Date;
    memorySnapshot: NodeJS.MemoryUsage;
  }>;
  startTime: number;
  phaseStartTime: number;
  totalEstimatedTime: number;
  memoryPeakUsage: number;
}

/**
 * Section execution configuration with performance metadata
 */
interface SectionExecutionConfig {
  name: string;
  weight: number;
  dependencies: string[];
  estimatedDuration: number;
  memoryWeight: number;
  retryable: boolean;
  required: boolean;
}

/**
 * Result wrapper with metadata for performance tracking
 */
interface ExecutionResult<T extends SectionResult> {
  result: T;
  executionTime: number;
  memoryUsed: number;
  warnings: string[];
  performance: {
    startTime: number;
    endTime: number;
    peakMemory: number;
    gcCount: number;
  };
}

/**
 * Advanced sequential execution engine that orchestrates section analysis
 * with sophisticated memory management and error handling
 */
export class SequentialExecutor {
  private resolver: AnalyzerDependencyResolver;
  private executionState: ExecutionState;
  private progressCallbacks: ProgressCallbacks;
  private options: CLIOptions;
  private dataset: AnalysisDataset;
  private context: LogContext;
  private executionPlan: ExecutionPlan | null = null;
  private sectionConfigs: Map<string, SectionExecutionConfig>;
  private resultCache: ResultCache;

  constructor(
    dataset: AnalysisDataset,
    options: CLIOptions,
    progressCallbacks: ProgressCallbacks = {},
    context: LogContext = {}
  ) {
    this.dataset = dataset;
    this.options = options;
    this.progressCallbacks = progressCallbacks;
    this.context = {
      ...context,
      operation: 'sequential_execution',
      filePath: dataset.metadata.filePath,
    };

    // Initialize dependency resolver
    this.resolver = createDependencyResolver(
      dataset.metadata.filePath,
      options,
      this.context
    );

    // Initialize result cache with intelligent caching enabled
    this.resultCache = createResultCache(
      options,
      {
        ...this.context,
        operation: 'sequential_execution_cache',
      },
      options.enableCaching !== false // Enable persistent cache unless explicitly disabled
    );

    // Initialize execution state
    this.executionState = {
      currentSection: null,
      completedSections: new Set(),
      rollbackStack: [],
      startTime: Date.now(),
      phaseStartTime: Date.now(),
      totalEstimatedTime: 0,
      memoryPeakUsage: 0,
    };

    // Initialize section configurations
    this.sectionConfigs = new Map([
      ['section1', {
        name: 'section1',
        weight: 10,
        dependencies: [],
        estimatedDuration: 2000,
        memoryWeight: 10,
        retryable: true,
        required: true,
      }],
      ['section2', {
        name: 'section2',
        weight: 20,
        dependencies: [],
        estimatedDuration: 5000,
        memoryWeight: 20,
        retryable: true,
        required: true,
      }],
      ['section3', {
        name: 'section3',
        weight: 40,
        dependencies: [],
        estimatedDuration: 15000,
        memoryWeight: 40,
        retryable: true,
        required: true,
      }],
      ['section4', {
        name: 'section4',
        weight: 25,
        dependencies: ['section1', 'section3'],
        estimatedDuration: 8000,
        memoryWeight: 25,
        retryable: true,
        required: false,
      }],
      ['section5', {
        name: 'section5',
        weight: 35,
        dependencies: ['section1', 'section2', 'section3'],
        estimatedDuration: 12000,
        memoryWeight: 35,
        retryable: true,
        required: false,
      }],
      ['section6', {
        name: 'section6',
        weight: 60,
        dependencies: ['section1', 'section2', 'section3', 'section5'],
        estimatedDuration: 20000,
        memoryWeight: 60,
        retryable: false,
        required: false,
      }],
    ]);

    this.registerSectionResolvers();
  }

  /**
   * Execute the requested sections in optimal order with full dependency resolution
   */
  async execute(requestedSections: string[]): Promise<CLIResult> {
    const startTime = Date.now();
    
    try {
      logger.info(
        `Starting sequential execution for sections: ${requestedSections.join(', ')}`,
        this.context
      );

      // Phase 1: Plan execution
      await this.planExecution(requestedSections);

      // Phase 2: Validate readiness
      await this.validateExecutionReadiness();

      // Phase 3: Execute sections sequentially
      const results = await this.executeSequentialPlan();

      // Phase 4: Post-execution cleanup and validation
      await this.performPostExecutionCleanup();

      const totalTime = Date.now() - startTime;

      return {
        success: true,
        exitCode: 0,
        data: results,
        format: this.options.output || 'markdown',
        metadata: {
          executionTime: totalTime,
          sectionsExecuted: Array.from(this.executionState.completedSections),
          memoryPeakUsage: this.executionState.memoryPeakUsage,
          executionPlan: this.executionPlan,
          performance: this.getPerformanceMetrics(),
        },
        stats: {
          processingTime: totalTime,
          rowsProcessed: this.dataset.rows.length,
          warnings: 0,
          errors: 0,
        },
      };
    } catch (error) {
      return await this.handleExecutionError(error, startTime);
    }
  }

  /**
   * Phase 1: Plan execution using dependency resolver
   */
  private async planExecution(requestedSections: string[]): Promise<void> {
    this.updateProgress('Planning execution', 0, 'Analyzing dependencies and optimizing execution order');

    try {
      // Generate optimal execution plan
      this.executionPlan = this.resolver.planExecution(requestedSections);
      
      // Calculate total estimated time
      this.executionState.totalEstimatedTime = this.executionPlan.order
        .map(section => this.sectionConfigs.get(section)?.estimatedDuration || 5000)
        .reduce((a, b) => a + b, 0);

      logger.info(
        `Execution plan generated: ${this.executionPlan.order.join(' -> ')}`,
        {
          ...this.context,
          estimatedDuration: this.executionState.totalEstimatedTime,
          memoryOptimized: this.executionPlan.memoryOptimized,
          parallelGroups: this.executionPlan.parallelGroups.length,
        }
      );

      this.progressCallbacks.onPhaseComplete?.(
        `Execution planned: ${this.executionPlan.order.length} sections`,
        Date.now() - this.executionState.phaseStartTime
      );

    } catch (error) {
      logger.error('Failed to plan execution', this.context, error);
      throw new DataPilotError(
        `Execution planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_PLANNING_FAILED',
        ErrorSeverity.CRITICAL,
        ErrorCategory.ANALYSIS,
        this.context,
        [
          {
            action: 'Check section dependencies',
            description: 'Verify that all requested sections have valid dependencies',
            severity: ErrorSeverity.HIGH,
          },
          {
            action: 'Validate execution environment',
            description: 'Ensure sufficient memory and resources are available',
            severity: ErrorSeverity.MEDIUM,
          },
        ]
      );
    }
  }

  /**
   * Phase 2: Validate execution readiness
   */
  private async validateExecutionReadiness(): Promise<void> {
    this.updateProgress('Validating readiness', 5, 'Checking system resources and dependencies');
    this.executionState.phaseStartTime = Date.now();

    if (!this.executionPlan) {
      throw new DataPilotError(
        'No execution plan available',
        'MISSING_EXECUTION_PLAN',
        ErrorSeverity.CRITICAL,
        ErrorCategory.VALIDATION,
        this.context
      );
    }

    // Check memory availability
    const currentMemory = process.memoryUsage();
    const memoryLimit = this.options.memoryLimit || 512 * 1024 * 1024;
    
    if (currentMemory.heapUsed > memoryLimit * 0.8) {
      logger.warn(
        `High memory usage detected before execution (${(currentMemory.heapUsed / 1024 / 1024).toFixed(0)}MB)`,
        this.context
      );
    }

    // Validate that dataset is valid
    if (!this.dataset.rows || this.dataset.rows.length === 0) {
      throw new DataPilotError(
        'Invalid dataset: no rows available',
        'INVALID_DATASET',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
        this.context
      );
    }

    // Validate execution plan readiness
    const readiness = this.resolver.validateExecutionReadiness(this.executionPlan.order);
    if (!readiness.ready) {
      throw new DataPilotError(
        `Execution not ready: ${readiness.issues.join(', ')}`,
        'EXECUTION_NOT_READY',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
        this.context,
        readiness.issues.map(issue => ({
          action: 'Fix execution issue',
          description: issue,
          severity: ErrorSeverity.HIGH,
        }))
      );
    }

    // Log warnings
    readiness.warnings.forEach(warning => {
      logger.warn(warning, this.context);
      this.progressCallbacks.onWarning?.(warning);
    });

    this.progressCallbacks.onPhaseComplete?.(
      'Execution readiness validated',
      Date.now() - this.executionState.phaseStartTime
    );
  }

  /**
   * Phase 3: Execute sections sequentially with real dependency passing
   */
  private async executeSequentialPlan(): Promise<any> {
    this.updateProgress('Executing sections', 10, 'Running analysis sections in optimal order');
    this.executionState.phaseStartTime = Date.now();

    if (!this.executionPlan) {
      throw new Error('No execution plan available');
    }

    const results: any = {};
    let progressBase = 10; // Starting after planning phase
    const progressPerSection = 80 / this.executionPlan.order.length; // 80% for execution

    for (const [index, sectionName] of this.executionPlan.order.entries()) {
      const sectionProgress = progressBase + (index * progressPerSection);
      await this.executeSingleSection(sectionName, sectionProgress, results);
    }

    this.progressCallbacks.onPhaseComplete?.(
      `All ${this.executionPlan.order.length} sections completed`,
      Date.now() - this.executionState.phaseStartTime
    );

    return results;
  }

  /**
   * Execute a single section with memory management and error handling
   */
  private async executeSingleSection(
    sectionName: string,
    progressPercentage: number,
    results: any
  ): Promise<void> {
    const config = this.sectionConfigs.get(sectionName);
    if (!config) {
      throw new DataPilotError(
        `No configuration found for section: ${sectionName}`,
        'MISSING_SECTION_CONFIG',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION,
        this.context
      );
    }

    this.executionState.currentSection = sectionName;
    const sectionStartTime = Date.now();

    this.updateProgress(
      `Executing ${sectionName}`,
      progressPercentage,
      `Running ${sectionName} analysis with dependencies`
    );

    this.progressCallbacks.onPhaseStart?.(
      sectionName,
      `Starting ${sectionName} analysis`
    );

    try {
      // Create rollback point
      this.createRollbackPoint(sectionName);

      // Pre-execution memory management
      await this.performPreExecutionCleanup();

      // Check cache first before executing
      logger.info(`Checking cache for ${sectionName}`, {
        ...this.context,
        section: sectionName,
        dependencies: config.dependencies,
      });

      let executionResult = await this.resultCache.get(
        this.dataset.metadata.filePath,
        sectionName,
        this.options,
        config.dependencies
      );

      if (executionResult) {
        logger.info(`Cache hit for ${sectionName}`, {
          ...this.context,
          section: sectionName,
          cached: true,
        });
        
        this.progressCallbacks.onPhaseComplete?.(
          `${sectionName} loaded from cache`,
          Date.now() - sectionStartTime
        );
      } else {
        // Execute section with dependency resolution
        logger.info(`Executing ${sectionName}`, {
          ...this.context,
          section: sectionName,
          dependencies: config.dependencies,
          cached: false,
        });

        executionResult = await this.executeWithTimeout(
          () => this.resolver.resolve(sectionName as keyof SectionResultMap),
          config.estimatedDuration * 2 // 2x estimated time as timeout
        );

        // Cache the result for future use
        await this.resultCache.set(
          this.dataset.metadata.filePath,
          sectionName,
          this.options,
          executionResult,
          config.dependencies,
          config.estimatedDuration * 10 // TTL based on execution time
        );

        logger.info(`${sectionName} result cached`, {
          ...this.context,
          section: sectionName,
          resultSize: JSON.stringify(executionResult).length,
        });
      }

      // Store result
      results[sectionName] = executionResult;
      this.executionState.completedSections.add(sectionName);

      // Post-execution memory tracking
      const memoryUsage = process.memoryUsage();
      this.executionState.memoryPeakUsage = Math.max(
        this.executionState.memoryPeakUsage,
        memoryUsage.heapUsed
      );

      const executionTime = Date.now() - sectionStartTime;
      logger.info(`${sectionName} completed in ${executionTime}ms`, {
        ...this.context,
        section: sectionName,
        executionTime,
        memoryUsed: memoryUsage.heapUsed,
      });

      this.progressCallbacks.onPhaseComplete?.(
        `${sectionName} completed successfully`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - sectionStartTime;
      logger.error(`${sectionName} failed after ${executionTime}ms`, {
        ...this.context,
        section: sectionName,
        executionTime,
      }, error);

      // Invalidate cache for this section and dependents on failure
      await this.resultCache.invalidateDependents(sectionName);
      
      // Handle section failure based on configuration
      await this.handleSectionFailure(sectionName, error, config);
    } finally {
      this.executionState.currentSection = null;
    }
  }

  /**
   * Handle section failure with proper rollback and error propagation
   */
  private async handleSectionFailure(
    sectionName: string,
    error: any,
    config: SectionExecutionConfig
  ): Promise<void> {
    this.progressCallbacks.onError?.(`${sectionName} failed: ${error.message}`);

    if (config.required) {
      // Required section failed - rollback and fail entire execution
      logger.error(`Required section ${sectionName} failed, rolling back`, this.context);
      await this.performRollback();
      
      throw new DataPilotError(
        `Required section ${sectionName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REQUIRED_SECTION_FAILED',
        ErrorSeverity.CRITICAL,
        ErrorCategory.ANALYSIS,
        this.context,
        [
          {
            action: 'Check section implementation',
            description: `Verify ${sectionName} analyzer is working correctly`,
            severity: ErrorSeverity.HIGH,
          },
          {
            action: 'Validate input data',
            description: 'Ensure the input data is compatible with this section',
            severity: ErrorSeverity.HIGH,
          },
          {
            action: 'Check dependencies',
            description: 'Verify all section dependencies are satisfied',
            severity: ErrorSeverity.MEDIUM,
          },
        ]
      );
    } else if (config.retryable) {
      // Optional section failed but retryable - warn and continue
      logger.warn(`Optional section ${sectionName} failed but continuing`, this.context, error);
      this.progressCallbacks.onWarning?.(
        `${sectionName} failed but continuing: ${error.message}`
      );
    } else {
      // Optional section failed and not retryable - skip and continue
      logger.warn(`Skipping failed section ${sectionName}`, this.context, error);
      this.progressCallbacks.onWarning?.(
        `Skipping ${sectionName}: ${error.message}`
      );
    }
  }

  /**
   * Execute section with enhanced error handling and context
   */
  private async executeSectionWithEnhancedContext<T>(
    sectionName: string,
    sectionExecutor: () => Promise<T>
  ): Promise<T> {
    return await ErrorUtils.withEnhancedContext(
      async () => {
        const result = await sectionExecutor();
        
        // Validate section result
        return ErrorUtils.validateOperationResult(
          result, 
          'object', 
          `${sectionName}_analysis`,
          { 
            section: sectionName, 
            analyzer: `${sectionName}Analyzer`,
            filePath: this.dataset.metadata.filePath
          }
        );
      },
      {
        operationName: `${sectionName}_execution`,
        section: sectionName,
        analyzer: `${sectionName}Analyzer`,
        filePath: this.dataset.metadata.filePath,
        additionalContext: {
          datasetRows: this.dataset.rows.length,
          datasetColumns: this.dataset.headers.length,
          executionState: {
            currentSection: this.executionState.currentSection,
            completedSections: Array.from(this.executionState.completedSections),
            memoryUsage: this.executionState.memoryPeakUsage
          }
        }
      }
    );
  }

  /**
   * Register section resolvers with the dependency resolver and enhanced error handling
   */
  private registerSectionResolvers(): void {
    // Section 1: Overview Analysis
    this.resolver.registerResolver('section1', async () => {
      const analyzer = new Section1Analyzer({
        enableFileHashing: this.options.enableHashing !== false,
        includeHostEnvironment: this.options.includeEnvironment !== false,
        privacyMode: this.options.privacyMode || 'redacted',
        detailedProfiling: this.options.verbose || false,
        maxSampleSizeForSparsity: 10000,
        enableCompressionAnalysis: this.options.enableCompressionAnalysis !== false,
        enableDataPreview: this.options.enableDataPreview !== false,
        previewRows: (this.options.previewRows as number) || 5,
        enableHealthChecks: this.options.enableHealthChecks !== false,
        enableQuickStatistics: this.options.enableQuickStats !== false,
      });

      return analyzer.analyze(
        this.dataset.metadata.filePath,
        `datapilot ${this.options.command || 'analysis'} ${this.dataset.metadata.filePath}`,
        []
      );
    });

    // Section 2: Quality Analysis
    this.resolver.registerResolver('section2', async () => {
      const analyzer = new Section2Analyzer({
        data: this.dataset.rows,
        headers: this.dataset.headers,
        columnTypes: this.dataset.headers.map(() => 'string' as any),
        rowCount: this.dataset.rows.length,
        columnCount: this.dataset.headers.length,
        config: {
          enabledDimensions: ['completeness', 'uniqueness', 'validity'],
          strictMode: false,
          maxOutlierDetection: 100,
          semanticDuplicateThreshold: 0.85,
        },
      });

      return analyzer.analyze();
    });

    // Section 3: EDA Analysis
    this.resolver.registerResolver('section3', async () => {
      const analyzer = new StreamingAnalyzer({
        chunkSize: this.options.chunkSize || 500,
        memoryThresholdMB: this.options.memoryLimit || 100,
        maxRowsAnalyzed: this.options.maxRows || 500000,
        enabledAnalyses: ['univariate', 'bivariate', 'correlations'],
        significanceLevel: 0.05,
        maxCorrelationPairs: 50,
        enableMultivariate: true,
      });

      return analyzer.analyzeFile(this.dataset.metadata.filePath);
    });

    // Section 4: Visualization Analysis (with REAL dependencies)
    this.resolver.registerResolver('section4', async () => {
      const analyzer = new Section4Analyzer({
        accessibilityLevel: (this.options.accessibility as any) || 'good',
        complexityThreshold: (this.options.complexity as any) || 'moderate',
        maxRecommendationsPerChart: this.options.maxRecommendations || 3,
        includeCodeExamples: this.options.includeCode || false,
        enabledRecommendations: [
          'UNIVARIATE' as any,
          'BIVARIATE' as any,
          'DASHBOARD' as any,
          'ACCESSIBILITY' as any,
          'PERFORMANCE' as any,
        ],
        targetLibraries: ['d3', 'plotly', 'observable'],
      });

      // Get REAL dependencies instead of mocks
      const section1Result = await this.resolver.resolve('section1');
      const section3Result = await this.resolver.resolve('section3');

      return analyzer.analyze(section1Result, section3Result);
    });

    // Section 5: Engineering Analysis (with REAL dependencies)
    this.resolver.registerResolver('section5', async () => {
      const analyzer = new Section5Analyzer({
        targetDatabaseSystem: (this.options.database as any) || 'postgresql',
        mlFrameworkTarget: (this.options.framework as any) || 'scikit_learn',
      });

      // Get REAL dependencies instead of mocks
      const section1Result = await this.resolver.resolve('section1');
      const section2Result = await this.resolver.resolve('section2');
      const section3Result = await this.resolver.resolve('section3');

      return analyzer.analyze(section1Result, section2Result, section3Result);
    });

    // Section 6: Modeling Analysis (with REAL dependencies) - THIS FIXES THE MOCK INADEQUACY
    this.resolver.registerResolver('section6', async () => {
      const analyzer = new Section6Analyzer({
        focusAreas: (this.options.focus as any) || ['regression', 'binary_classification', 'clustering'],
        complexityPreference: this.options.complexity || 'moderate',
        interpretabilityRequirement: this.options.interpretability || 'medium',
      });

      // Get REAL dependencies instead of mocks - this is the critical fix
      const section1Result = await this.resolver.resolve('section1');
      const section2Result = await this.resolver.resolve('section2');
      const section3Result = await this.resolver.resolve('section3');
      const section5Result = await this.resolver.resolve('section5');

      return analyzer.analyze(section1Result, section2Result, section3Result, section5Result);
    });
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Create rollback point for error recovery
   */
  private createRollbackPoint(sectionName: string): void {
    const memorySnapshot = process.memoryUsage();
    
    this.executionState.rollbackStack.push({
      section: sectionName,
      timestamp: new Date(),
      memorySnapshot,
    });

    // Limit rollback stack size
    if (this.executionState.rollbackStack.length > 10) {
      this.executionState.rollbackStack.shift();
    }
  }

  /**
   * Perform rollback to clean state
   */
  private async performRollback(): Promise<void> {
    logger.info('Performing execution rollback', this.context);

    // Clear all cached dependencies to force fresh execution
    this.resolver.clear();

    // Clear result cache to ensure fresh execution
    await this.resultCache.clear();

    // Reset execution state
    this.executionState.completedSections.clear();
    this.executionState.currentSection = null;

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clean up global resources
    await globalMemoryManager.runCleanup();

    logger.info('Rollback completed', this.context);
  }

  /**
   * Pre-execution memory cleanup
   */
  private async performPreExecutionCleanup(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const memoryLimit = this.options.memoryLimit || 512 * 1024 * 1024;

    if (memoryUsage.heapUsed > memoryLimit * 0.7) {
      logger.debug('Performing pre-execution memory cleanup', this.context);

      // Trigger garbage collection
      if (global.gc) {
        global.gc();
      }

      // Clean up global resources
      await globalMemoryManager.runCleanup();
    }
  }

  /**
   * Phase 4: Post-execution cleanup and validation
   */
  private async performPostExecutionCleanup(): Promise<void> {
    this.updateProgress('Finalizing', 95, 'Cleaning up resources and validating results');
    
    // Final memory cleanup
    await globalMemoryManager.runCleanup();

    // Validate all completed sections have results
    const executionPlan = this.executionPlan!;
    const missingResults = executionPlan.order.filter(
      section => !this.executionState.completedSections.has(section)
    );

    if (missingResults.length > 0) {
      const requiredMissing = missingResults.filter(section => 
        this.sectionConfigs.get(section)?.required
      );

      if (requiredMissing.length > 0) {
        throw new DataPilotError(
          `Required sections failed to complete: ${requiredMissing.join(', ')}`,
          'REQUIRED_SECTIONS_INCOMPLETE',
          ErrorSeverity.CRITICAL,
          ErrorCategory.ANALYSIS,
          this.context
        );
      }
    }

    this.updateProgress('Complete', 100, 'Sequential execution completed successfully');
  }

  /**
   * Handle execution errors with enhanced debugging and detailed reporting
   */
  private async handleExecutionError(error: any, startTime: number): Promise<CLIResult> {
    const totalTime = Date.now() - startTime;
    
    // Set verbose mode based on options
    globalErrorHandler.setVerboseMode(this.options.verbose || false);
    
    logger.error('Sequential execution failed', this.context, error);

    // Attempt rollback with enhanced error context
    try {
      await this.performRollback();
    } catch (rollbackError) {
      logger.error('Rollback failed', this.context, rollbackError);
    }

    let errorMessage = 'Sequential execution failed';
    let enhancedSuggestions: string[] = [];
    let errorDetails: any = {};

    if (error instanceof DataPilotError) {
      // Enhanced error handling for DataPilotError
      errorMessage = error.getFormattedMessage(this.options.verbose || false);
      enhancedSuggestions = error.getEnhancedSuggestions(this.options.verbose || false);
      
      if (this.options.verbose && error.verboseInfo) {
        errorDetails = {
          fullContext: error.verboseInfo.fullContext,
          performanceMetrics: error.verboseInfo.performanceMetrics,
          memorySnapshot: error.verboseInfo.memorySnapshot,
        };
      }
    } else {
      // Convert generic error to enhanced format
      errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      
      if (this.options.verbose) {
        errorMessage += `\n   Stack: ${error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n          ') : 'No stack available'}`;
        errorMessage += `\n   Section: ${this.executionState.currentSection || 'unknown'}`;
        errorMessage += `\n   Completed: ${Array.from(this.executionState.completedSections).join(', ') || 'none'}`;
        errorMessage += `\n   Memory Peak: ${(this.executionState.memoryPeakUsage / 1024 / 1024).toFixed(2)}MB`;
      }
    }

    // Determine error suggestions based on current state
    const contextualSuggestions: string[] = [];
    
    if (this.executionState.currentSection) {
      contextualSuggestions.push(`• Section Failed: ${this.executionState.currentSection} - check section-specific requirements`);
    }

    if (this.executionState.memoryPeakUsage > (this.options.memoryLimit || 512 * 1024 * 1024)) {
      contextualSuggestions.push('• Memory Issue: Consider increasing memory limit or reducing data size');
    }
    
    // Check for dependency issues
    if (this.executionPlan && this.executionState.completedSections.size < this.executionPlan.order.length) {
      const failedSections = this.executionPlan.order.filter(
        section => !this.executionState.completedSections.has(section)
      );
      contextualSuggestions.push(`• Dependency Issue: Sections not completed: ${failedSections.join(', ')}`);
    }
    
    // General debugging suggestions
    const generalSuggestions = [
      'Check system resources and memory availability',
      'Verify input data format and quality',
      'Try running individual sections to isolate the issue',
    ];
    
    if (this.options.verbose) {
      generalSuggestions.push(
        'Monitor system resources during execution',
        'Check for data corruption or format issues',
        'Use --maxRows to limit data size for testing'
      );
    } else {
      generalSuggestions.push('Use --verbose for detailed debugging information');
    }

    // Combine enhanced suggestions with contextual and general suggestions
    const allSuggestions = [
      ...enhancedSuggestions,
      ...(enhancedSuggestions.length > 0 ? ['---'] : []),
      ...contextualSuggestions,
      ...(contextualSuggestions.length > 0 ? ['---'] : []),
      ...generalSuggestions
    ].filter(Boolean);

    return {
      success: false,
      exitCode: 1,
      error: errorMessage,
      suggestions: allSuggestions,
      metadata: {
        executionTime: totalTime,
        currentSection: this.executionState.currentSection,
        completedSections: Array.from(this.executionState.completedSections),
        memoryPeakUsage: this.executionState.memoryPeakUsage,
        rollbackPoints: this.executionState.rollbackStack.length,
        errorCategory: error instanceof DataPilotError ? error.category : 'unknown',
        errorSeverity: error instanceof DataPilotError ? error.severity : 'medium',
        verboseMode: this.options.verbose || false,
        ...(this.options.verbose && errorDetails ? { errorDetails } : {}),
      },
      stats: {
        processingTime: totalTime,
        rowsProcessed: this.dataset.rows?.length || 0,
        warnings: 0,
        errors: 1,
      },
    };
  }

  /**
   * Update progress with detailed state information
   */
  private updateProgress(phase: string, progress: number, message: string): void {
    const timeElapsed = Date.now() - this.executionState.startTime;
    const estimatedTimeRemaining = this.executionState.totalEstimatedTime > 0
      ? Math.max(0, this.executionState.totalEstimatedTime - timeElapsed)
      : undefined;

    const state: ProgressState = {
      phase,
      progress,
      message,
      timeElapsed,
      estimatedTimeRemaining,
    };

    this.progressCallbacks.onProgress?.(state);
    
    logger.debug('Progress update', {
      ...this.context,
      progress,
      phase,
      timeElapsed,
      estimatedTimeRemaining,
    });
  }

  /**
   * Get performance metrics for reporting
   */
  private getPerformanceMetrics(): any {
    const stats = this.resolver.getStats();
    const insights = this.resolver.getDependencyInsights();
    const cacheStats = this.resultCache.getStats();
    const cacheInfo = this.resultCache.getCacheInfo();

    return {
      executionTime: Date.now() - this.executionState.startTime,
      memoryPeakUsage: this.executionState.memoryPeakUsage,
      sectionsCompleted: this.executionState.completedSections.size,
      dependencyResolution: stats,
      memoryOptimized: this.executionPlan?.memoryOptimized || false,
      rollbacksPerformed: this.executionState.rollbackStack.length,
      insights,
      cache: {
        stats: cacheStats,
        performance: cacheInfo.performance,
        memoryUsage: cacheInfo.memoryUsage,
        efficiency: {
          cacheHitRate: cacheStats.hitCount / (cacheStats.hitCount + cacheStats.missCount),
          averageAccessTime: cacheStats.averageAccessTime,
          memoryPressure: cacheStats.memoryPressureLevel,
        },
      },
    };
  }

  /**
   * Get current execution status for monitoring
   */
  getExecutionStatus(): {
    currentSection: string | null;
    completedSections: string[];
    totalSections: number;
    progress: number;
    memoryUsage: NodeJS.MemoryUsage;
    elapsedTime: number;
  } {
    const totalSections = this.executionPlan?.order.length || 0;
    const completed = this.executionState.completedSections.size;
    const progress = totalSections > 0 ? (completed / totalSections) * 100 : 0;

    return {
      currentSection: this.executionState.currentSection,
      completedSections: Array.from(this.executionState.completedSections),
      totalSections,
      progress,
      memoryUsage: process.memoryUsage(),
      elapsedTime: Date.now() - this.executionState.startTime,
    };
  }

  /**
   * Clean up executor resources
   */
  async cleanup(): Promise<void> {
    logger.debug('Cleaning up sequential executor', this.context);
    
    this.resolver.clear();
    this.executionState.completedSections.clear();
    this.executionState.rollbackStack = [];
    
    // Clean up result cache
    await this.resultCache.dispose();
    
    await globalMemoryManager.runCleanup();
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  getCacheStats(): any {
    return {
      stats: this.resultCache.getStats(),
      info: this.resultCache.getCacheInfo(),
    };
  }

  /**
   * Clear result cache manually
   */
  async clearCache(): Promise<void> {
    await this.resultCache.clear();
    logger.info('Result cache cleared manually', this.context);
  }

  /**
   * Invalidate cache for specific file
   */
  async invalidateCacheForFile(filePath: string): Promise<void> {
    await this.resultCache.invalidateByFile(filePath);
    logger.info(`Cache invalidated for file: ${filePath}`, this.context);
  }
}

/**
 * Factory function to create and configure a sequential executor
 */
export function createSequentialExecutor(
  dataset: AnalysisDataset,
  options: CLIOptions,
  progressCallbacks: ProgressCallbacks = {},
  context: LogContext = {}
): SequentialExecutor {
  return new SequentialExecutor(dataset, options, progressCallbacks, {
    ...context,
    operation: 'sequential_execution_factory',
  });
}

/**
 * Utility function to validate sequential execution requirements
 */
export function validateSequentialExecutionRequirements(
  dataset: AnalysisDataset,
  options: CLIOptions
): {
  canExecute: boolean;
  issues: string[];
  warnings: string[];
  estimatedMemoryUsage: number;
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Validate dataset
  if (!dataset.rows || dataset.rows.length === 0) {
    issues.push('Dataset has no rows');
  }

  if (!dataset.headers || dataset.headers.length === 0) {
    issues.push('Dataset has no columns');
  }

  // Check memory requirements
  const estimatedMemoryUsage = dataset.rows.length * dataset.headers.length * 50; // Rough estimate
  const memoryLimit = options.memoryLimit || 512 * 1024 * 1024;

  if (estimatedMemoryUsage > memoryLimit) {
    warnings.push(
      `Estimated memory usage (${(estimatedMemoryUsage / 1024 / 1024).toFixed(0)}MB) exceeds limit (${(memoryLimit / 1024 / 1024).toFixed(0)}MB)`
    );
  }

  // Check section requirements
  if (options.sections && options.sections.includes('section6')) {
    const requiredSections = ['section1', 'section2', 'section3', 'section5'];
    const missingDeps = requiredSections.filter(section => 
      !options.sections.includes(section)
    );
    
    if (missingDeps.length > 0) {
      warnings.push(
        `Section 6 requires dependencies: ${missingDeps.join(', ')} (will be auto-executed)`
      );
    }
  }

  return {
    canExecute: issues.length === 0,
    issues,
    warnings,
    estimatedMemoryUsage,
  };
}