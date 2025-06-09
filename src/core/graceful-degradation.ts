/**
 * Graceful Degradation Framework
 * Provides intelligent fallback strategies for analysis failures
 */

import { logger } from '../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../utils/error-handler';

export enum DegradationLevel {
  NONE = 0,
  MINIMAL = 1,
  MODERATE = 2,
  AGGRESSIVE = 3,
  EMERGENCY = 4,
}

export interface DegradationContext {
  availableMemoryMB: number;
  processingTimeMs: number;
  dataQualityScore: number;
  userExperienceLevel: 'beginner' | 'intermediate' | 'expert';
  analysisScope: 'comprehensive' | 'standard' | 'basic';
  errorHistory: DataPilotError[];
}

export interface DegradationStrategy {
  level: DegradationLevel;
  trigger: DegradationTrigger;
  actions: DegradationAction[];
  fallbackAnalyses: string[];
  qualityImpact: number; // 0-100, percentage of quality retained
  userMessage: string;
}

export interface DegradationTrigger {
  memoryThresholdMB?: number;
  processingTimeThresholdMs?: number;
  errorCountThreshold?: number;
  dataQualityThreshold?: number;
  specificErrors?: ErrorCategory[];
}

export interface DegradationAction {
  type: 'disable_feature' | 'reduce_scope' | 'simplify_algorithm' | 'skip_optional' | 'use_sampling';
  target: string;
  parameters?: Record<string, any>;
  impact: string;
}

export interface PartialAnalysisResult<T> {
  result: Partial<T>;
  degradationLevel: DegradationLevel;
  appliedStrategies: DegradationStrategy[];
  completedSections: string[];
  failedSections: string[];
  partialSections: string[];
  qualityRetained: number; // 0-100
  userGuidance: string;
  recoveryOptions: RecoveryOption[];
}

export interface RecoveryOption {
  description: string;
  action: 'retry' | 'adjust_settings' | 'reduce_data' | 'contact_support';
  command?: string;
  automated: boolean;
  estimatedTime: string;
  successProbability: number; // 0-100
}

/**
 * Main Graceful Degradation Engine
 */
export class GracefulDegradationEngine {
  private strategies: Map<string, DegradationStrategy> = new Map();
  private currentLevel: DegradationLevel = DegradationLevel.NONE;
  private appliedStrategies: DegradationStrategy[] = [];

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Evaluate context and determine appropriate degradation level
   */
  assessDegradationNeeds(context: DegradationContext): DegradationLevel {
    logger.debug('Assessing degradation needs', { context });

    // Check memory pressure
    if (context.availableMemoryMB < 100) {
      return DegradationLevel.EMERGENCY;
    }
    if (context.availableMemoryMB < 256) {
      return DegradationLevel.AGGRESSIVE;
    }
    if (context.availableMemoryMB < 512) {
      return DegradationLevel.MODERATE;
    }

    // Check processing time
    if (context.processingTimeMs > 300000) { // 5 minutes
      return DegradationLevel.MODERATE;
    }

    // Check error history
    if (context.errorHistory.length > 10) {
      return DegradationLevel.AGGRESSIVE;
    }
    if (context.errorHistory.length > 5) {
      return DegradationLevel.MODERATE;
    }

    // Check data quality
    if (context.dataQualityScore < 30) {
      return DegradationLevel.MODERATE;
    }
    if (context.dataQualityScore < 50) {
      return DegradationLevel.MINIMAL;
    }

    return DegradationLevel.NONE;
  }

  /**
   * Apply degradation strategies based on context
   */
  applyDegradation<T>(
    context: DegradationContext,
    analysisFunction: () => Promise<T>
  ): Promise<PartialAnalysisResult<T>> {
    return this.executeWithDegradation(context, analysisFunction);
  }

  /**
   * Execute analysis with progressive degradation
   */
  private async executeWithDegradation<T>(
    context: DegradationContext,
    analysisFunction: () => Promise<T>
  ): Promise<PartialAnalysisResult<T>> {
    const targetLevel = this.assessDegradationNeeds(context);
    this.currentLevel = targetLevel;
    this.appliedStrategies = [];

    logger.info(`Applying degradation level: ${DegradationLevel[targetLevel]}`);

    try {
      // Apply pre-analysis degradation strategies
      this.applyPreAnalysisStrategies(targetLevel, context);

      // Attempt analysis with current strategies
      const result = await this.attemptAnalysisWithFallbacks(analysisFunction, context);

      return {
        result,
        degradationLevel: this.currentLevel,
        appliedStrategies: this.appliedStrategies,
        completedSections: this.getCompletedSections(result),
        failedSections: [],
        partialSections: this.getPartialSections(result),
        qualityRetained: this.calculateQualityRetention(),
        userGuidance: this.generateUserGuidance(),
        recoveryOptions: this.generateRecoveryOptions(context),
      };
    } catch (error) {
      logger.error('Analysis failed with degradation', { error, level: this.currentLevel });
      
      return this.handleCompleteFailure(error as Error, context);
    }
  }

  /**
   * Attempt analysis with progressive fallbacks
   */
  private async attemptAnalysisWithFallbacks<T>(
    analysisFunction: () => Promise<T>,
    context: DegradationContext
  ): Promise<Partial<T>> {
    const maxAttempts = 3;
    let currentAttempt = 0;
    let lastError: Error | null = null;

    while (currentAttempt < maxAttempts) {
      try {
        logger.debug(`Analysis attempt ${currentAttempt + 1}/${maxAttempts}`);
        
        const result = await analysisFunction();
        logger.info(`Analysis succeeded on attempt ${currentAttempt + 1}`);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        currentAttempt++;
        
        logger.warn(`Analysis attempt ${currentAttempt} failed`, { error });

        if (currentAttempt < maxAttempts) {
          // Escalate degradation for next attempt
          this.escalateDegradation(context);
        }
      }
    }

    // All attempts failed, return partial results if possible
    throw lastError || new Error('Analysis failed after all attempts');
  }

  /**
   * Apply strategies before analysis begins
   */
  private applyPreAnalysisStrategies(level: DegradationLevel, context: DegradationContext): void {
    const strategies = this.getStrategiesForLevel(level);
    
    for (const strategy of strategies) {
      if (this.shouldApplyStrategy(strategy, context)) {
        this.applyStrategy(strategy);
        this.appliedStrategies.push(strategy);
      }
    }
  }

  /**
   * Check if strategy should be applied
   */
  private shouldApplyStrategy(strategy: DegradationStrategy, context: DegradationContext): boolean {
    const trigger = strategy.trigger;

    if (trigger.memoryThresholdMB && context.availableMemoryMB >= trigger.memoryThresholdMB) {
      return false;
    }

    if (trigger.processingTimeThresholdMs && context.processingTimeMs < trigger.processingTimeThresholdMs) {
      return false;
    }

    if (trigger.errorCountThreshold && context.errorHistory.length < trigger.errorCountThreshold) {
      return false;
    }

    if (trigger.dataQualityThreshold && context.dataQualityScore >= trigger.dataQualityThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Apply specific degradation strategy
   */
  private applyStrategy(strategy: DegradationStrategy): void {
    logger.info(`Applying degradation strategy: ${strategy.userMessage}`);

    for (const action of strategy.actions) {
      this.executeAction(action);
    }
  }

  /**
   * Execute degradation action
   */
  private executeAction(action: DegradationAction): void {
    logger.debug(`Executing degradation action: ${action.type} on ${action.target}`);

    switch (action.type) {
      case 'disable_feature':
        this.disableFeature(action.target);
        break;
      case 'reduce_scope':
        this.reduceScope(action.target, action.parameters);
        break;
      case 'simplify_algorithm':
        this.simplifyAlgorithm(action.target, action.parameters);
        break;
      case 'skip_optional':
        this.skipOptional(action.target);
        break;
      case 'use_sampling':
        this.enableSampling(action.target, action.parameters);
        break;
    }
  }

  /**
   * Escalate degradation level for retry
   */
  private escalateDegradation(context: DegradationContext): void {
    if (this.currentLevel < DegradationLevel.EMERGENCY) {
      this.currentLevel++;
      logger.info(`Escalating degradation to level: ${DegradationLevel[this.currentLevel]}`);
      
      this.applyPreAnalysisStrategies(this.currentLevel, context);
    }
  }

  /**
   * Handle complete analysis failure
   */
  private handleCompleteFailure<T>(error: Error, context: DegradationContext): PartialAnalysisResult<T> {
    logger.error('Complete analysis failure', { error });

    return {
      result: {} as Partial<T>,
      degradationLevel: DegradationLevel.EMERGENCY,
      appliedStrategies: this.appliedStrategies,
      completedSections: [],
      failedSections: ['all'],
      partialSections: [],
      qualityRetained: 0,
      userGuidance: 'Analysis failed completely. Please try with smaller data or reduced settings.',
      recoveryOptions: this.generateEmergencyRecoveryOptions(error, context),
    };
  }

  /**
   * Initialize default degradation strategies
   */
  private initializeDefaultStrategies(): void {
    // Minimal degradation - reduce optional features
    this.strategies.set('minimal', {
      level: DegradationLevel.MINIMAL,
      trigger: { memoryThresholdMB: 512, dataQualityThreshold: 70 },
      actions: [
        {
          type: 'skip_optional',
          target: 'advanced_statistics',
          impact: 'Some advanced statistical measures will be skipped',
        },
        {
          type: 'reduce_scope',
          target: 'correlation_analysis',
          parameters: { maxPairs: 20 },
          impact: 'Correlation analysis limited to top 20 pairs',
        },
      ],
      fallbackAnalyses: ['basic_statistics', 'data_quality'],
      qualityImpact: 10,
      userMessage: 'Using simplified analysis to optimize performance',
    });

    // Moderate degradation - significant scope reduction
    this.strategies.set('moderate', {
      level: DegradationLevel.MODERATE,
      trigger: { memoryThresholdMB: 256, errorCountThreshold: 5, dataQualityThreshold: 50 },
      actions: [
        {
          type: 'disable_feature',
          target: 'multivariate_analysis',
          impact: 'Multivariate analysis disabled',
        },
        {
          type: 'use_sampling',
          target: 'large_datasets',
          parameters: { sampleSize: 5000 },
          impact: 'Analysis limited to 5,000 row sample',
        },
        {
          type: 'simplify_algorithm',
          target: 'clustering',
          parameters: { algorithm: 'kmeans_simple' },
          impact: 'Using simplified clustering algorithm',
        },
      ],
      fallbackAnalyses: ['univariate_analysis', 'basic_quality'],
      qualityImpact: 30,
      userMessage: 'Using reduced analysis scope due to resource constraints',
    });

    // Aggressive degradation - minimal analysis only
    this.strategies.set('aggressive', {
      level: DegradationLevel.AGGRESSIVE,
      trigger: { memoryThresholdMB: 128, errorCountThreshold: 10 },
      actions: [
        {
          type: 'disable_feature',
          target: 'visualization_recommendations',
          impact: 'Visualization recommendations disabled',
        },
        {
          type: 'disable_feature',
          target: 'engineering_recommendations',
          impact: 'Engineering recommendations disabled',
        },
        {
          type: 'use_sampling',
          target: 'all_analysis',
          parameters: { sampleSize: 1000 },
          impact: 'Analysis limited to 1,000 row sample',
        },
      ],
      fallbackAnalyses: ['basic_overview', 'simple_quality'],
      qualityImpact: 60,
      userMessage: 'Using minimal analysis due to severe resource constraints',
    });

    // Emergency degradation - absolute minimum
    this.strategies.set('emergency', {
      level: DegradationLevel.EMERGENCY,
      trigger: { memoryThresholdMB: 64 },
      actions: [
        {
          type: 'disable_feature',
          target: 'all_advanced_features',
          impact: 'All advanced features disabled',
        },
        {
          type: 'use_sampling',
          target: 'emergency_sample',
          parameters: { sampleSize: 100 },
          impact: 'Analysis limited to 100 row sample',
        },
      ],
      fallbackAnalyses: ['file_overview_only'],
      qualityImpact: 90,
      userMessage: 'Emergency mode: providing minimal file overview only',
    });
  }

  // Helper methods for strategy application
  private disableFeature(feature: string): void {
    // Implementation would disable specific features
    logger.debug(`Disabling feature: ${feature}`);
  }

  private reduceScope(target: string, parameters?: Record<string, any>): void {
    // Implementation would reduce analysis scope
    logger.debug(`Reducing scope for: ${target}`, { parameters });
  }

  private simplifyAlgorithm(target: string, parameters?: Record<string, any>): void {
    // Implementation would use simpler algorithms
    logger.debug(`Simplifying algorithm for: ${target}`, { parameters });
  }

  private skipOptional(target: string): void {
    // Implementation would skip optional analysis
    logger.debug(`Skipping optional: ${target}`);
  }

  private enableSampling(target: string, parameters?: Record<string, any>): void {
    // Implementation would enable data sampling
    logger.debug(`Enabling sampling for: ${target}`, { parameters });
  }

  private getStrategiesForLevel(level: DegradationLevel): DegradationStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.level <= level);
  }

  private getCompletedSections<T>(result: Partial<T>): string[] {
    // Implementation would determine completed sections
    return Object.keys(result);
  }

  private getPartialSections<T>(result: Partial<T>): string[] {
    // Implementation would determine partial sections
    return [];
  }

  private calculateQualityRetention(): number {
    const totalImpact = this.appliedStrategies.reduce((sum, s) => sum + s.qualityImpact, 0);
    return Math.max(0, 100 - totalImpact);
  }

  private generateUserGuidance(): string {
    if (this.appliedStrategies.length === 0) {
      return 'Analysis completed successfully with full features.';
    }

    const messages = this.appliedStrategies.map(s => s.userMessage);
    return `Analysis completed with adaptations: ${messages.join('; ')}.`;
  }

  private generateRecoveryOptions(context: DegradationContext): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    if (context.availableMemoryMB < 512) {
      options.push({
        description: 'Increase available memory or reduce dataset size',
        action: 'adjust_settings',
        command: 'datapilot --memory-limit 2GB',
        automated: false,
        estimatedTime: '2-5 minutes',
        successProbability: 80,
      });
    }

    if (this.currentLevel > DegradationLevel.MINIMAL) {
      options.push({
        description: 'Retry with reduced scope',
        action: 'retry',
        command: 'datapilot --scope basic',
        automated: true,
        estimatedTime: '1-2 minutes',
        successProbability: 90,
      });
    }

    return options;
  }

  private generateEmergencyRecoveryOptions(error: Error, context: DegradationContext): RecoveryOption[] {
    return [
      {
        description: 'Try with a smaller data sample',
        action: 'reduce_data',
        command: 'head -n 1000 your-file.csv > sample.csv && datapilot sample.csv',
        automated: false,
        estimatedTime: '30 seconds',
        successProbability: 95,
      },
      {
        description: 'Contact support with error details',
        action: 'contact_support',
        automated: false,
        estimatedTime: '24-48 hours',
        successProbability: 100,
      },
    ];
  }
}

// Global instance
export const globalDegradationEngine = new GracefulDegradationEngine();