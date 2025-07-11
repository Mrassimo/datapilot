/**
 * Section 1 Analyzer - Main orchestrator for dataset overview analysis
 * Coordinates file metadata, parsing analytics, structural analysis, and environment profiling
 */

import { FileMetadataCollector } from './file-metadata-collector';
import { ParsingMetadataTracker } from './parsing-metadata-tracker';
import { StructuralAnalyzer } from './structural-analyzer';
import { EnvironmentProfiler } from './environment-profiler';
import { DataPreviewGenerator } from './data-preview-generator';
import { logger } from '../../utils/logger';
import { getDataPilotVersion } from '../../utils/version';
import type { Section1Result, Section1Config, Section1Progress, Section1Warning } from './types';

export class Section1Analyzer {
  private config: Section1Config;
  private fileCollector: FileMetadataCollector;
  private parsingTracker: ParsingMetadataTracker;
  private structuralAnalyzer: StructuralAnalyzer;
  private environmentProfiler: EnvironmentProfiler;
  private dataPreviewGenerator: DataPreviewGenerator;
  private progressCallback?: (progress: Section1Progress) => void;

  constructor(config: Partial<Section1Config> = {}) {
    // Set default configuration
    this.config = {
      includeHostEnvironment: true,
      enableFileHashing: true,
      maxSampleSizeForSparsity: 10000,
      privacyMode: 'redacted',
      detailedProfiling: true,
      enableCompressionAnalysis: true,
      enableDataPreview: true,
      previewRows: 5,
      enableHealthChecks: true,
      enableQuickStatistics: true,
      ...config,
    };

    // Initialize component analyzers
    this.fileCollector = new FileMetadataCollector(this.config);
    this.parsingTracker = new ParsingMetadataTracker(this.config);
    this.structuralAnalyzer = new StructuralAnalyzer(this.config);
    this.environmentProfiler = new EnvironmentProfiler(this.config);
    this.dataPreviewGenerator = new DataPreviewGenerator(this.config);
  }

  /**
   * Set progress callback for long-running operations
   */
  setProgressCallback(callback: (progress: Section1Progress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Perform comprehensive Section 1 analysis
   */
  async analyze(
    filePath: string,
    command: string = `datapilot all ${filePath}`,
    enabledSections: string[] = ['all'],
  ): Promise<Section1Result> {
    logger.info('Starting Section 1 analysis');
    this.environmentProfiler.reset();

    const warnings: Section1Warning[] = [];

    try {
      // Phase 1: File Analysis
      this.reportProgress('file-analysis', 0, 'Collecting file metadata...');
      this.environmentProfiler.startPhase('file-analysis');

      // Validate file first
      const validation = this.fileCollector.validateFile(filePath);
      if (!validation.valid) {
        // Log the error for debugging but still throw for now
        // This maintains existing test expectations while providing better error info
        const errorMessage = `File validation failed: ${validation.errors.join(', ')}`;
        logger.error(`Section 1 analysis failed: ${errorMessage}`, {
          filePath,
          analyzer: 'Section1Analyzer',
          errors: validation.errors
        });
        throw new Error(errorMessage);
      }

      const fileDetails = await this.fileCollector.collectMetadata(filePath);
      warnings.push(...this.fileCollector.getWarnings());

      const fileAnalysisTime = this.environmentProfiler.endPhase('file-analysis');
      this.reportProgress('file-analysis', 100, 'File metadata collected');

      // Phase 2: Parsing Analysis
      this.reportProgress('parsing', 0, 'Parsing CSV and analyzing format...');
      this.environmentProfiler.startPhase('parsing');

      const { rows, metadata: parsingMetadata } =
        await this.parsingTracker.parseWithMetadata(filePath);
      warnings.push(...this.parsingTracker.getWarnings());

      const parsingTime = this.environmentProfiler.endPhase('parsing');
      this.reportProgress('parsing', 100, 'CSV parsing completed');

      // Phase 3: Structural Analysis
      this.reportProgress('structural-analysis', 0, 'Analyzing dataset structure...');
      this.environmentProfiler.startPhase('structural-analysis');

      const structuralDimensions = this.structuralAnalyzer.analyzeStructure(
        rows,
        parsingMetadata.headerProcessing.headerPresence === 'Detected',
      );
      warnings.push(...this.structuralAnalyzer.getWarnings());

      const structuralTime = this.environmentProfiler.endPhase('structural-analysis');
      this.reportProgress('structural-analysis', 100, 'Structural analysis completed');

      // Phase 4: Data Preview (if enabled)
      let dataPreview;
      let previewTime = 0;
      if (this.config.enableDataPreview) {
        this.reportProgress('report-generation', 0, 'Generating data preview...');
        this.environmentProfiler.startPhase('data-preview');
        
        try {
          dataPreview = await this.dataPreviewGenerator.generatePreview(filePath);
          warnings.push(...this.dataPreviewGenerator.getWarnings());
        } catch (error) {
          // Fall back if preview generation fails
          warnings.push({
            category: 'structural',
            severity: 'low',
            message: 'Data preview generation failed',
            impact: 'Preview not available in report',
            suggestion: 'Data analysis continues normally',
          });
        }
        
        previewTime = this.environmentProfiler.endPhase('data-preview');
        this.reportProgress('report-generation', 50, 'Data preview completed');
      }

      // Phase 5: Environment Context
      this.reportProgress('report-generation', this.config.enableDataPreview ? 75 : 0, 'Finalizing analysis context...');

      const modules = this.environmentProfiler.generateModuleList(enabledSections);
      const executionContext = this.environmentProfiler.createExecutionContext(command, modules);

      // Create comprehensive result
      const overview = {
        fileDetails,
        parsingMetadata,
        structuralDimensions,
        executionContext,
        dataPreview,
        generatedAt: new Date(),
        version: this.getDataPilotVersionInternal(),
      };

      const performanceMetrics = {
        ...this.environmentProfiler.createPerformanceSummary(),
        phases: {
          'file-analysis': Number((fileAnalysisTime / 1000).toFixed(3)),
          parsing: Number((parsingTime / 1000).toFixed(3)),
          'structural-analysis': Number((structuralTime / 1000).toFixed(3)),
          ...(this.config.enableDataPreview && { 'data-preview': Number((previewTime / 1000).toFixed(3)) }),
        },
      };

      this.reportProgress('report-generation', 100, 'Analysis completed');

      logger.info(`Section 1 analysis completed in ${performanceMetrics.totalAnalysisTime}s`);

      return {
        overview,
        warnings,
        performanceMetrics,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Section 1 analysis failed: ${message}`);

      warnings.push({
        category: 'structural',
        severity: 'high',
        message: `Analysis failed: ${message}`,
        impact: 'Unable to complete dataset overview',
        suggestion: 'Check file format and accessibility',
      });

      throw error;
    }
  }

  /**
   * Quick analysis for basic information (no hashing, limited profiling)
   */
  async quickAnalyze(filePath: string): Promise<Section1Result> {
    const quickConfig: Section1Config = {
      ...this.config,
      enableFileHashing: false,
      detailedProfiling: false,
      includeHostEnvironment: false,
      maxSampleSizeForSparsity: 1000,
    };

    const quickAnalyzer = new Section1Analyzer(quickConfig);
    return quickAnalyzer.analyze(filePath, `datapilot overview ${filePath}`, ['overview']);
  }

  /**
   * Report progress to callback if set
   */
  private reportProgress(
    phase: Section1Progress['phase'],
    progress: number,
    operation: string,
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        progress,
        currentOperation: operation,
        timeElapsed: this.environmentProfiler.getElapsedTime(),
      });
    }
  }

  /**
   * Get DataPilot version
   */
  private getDataPilotVersionInternal(): string {
    return getDataPilotVersion();
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.maxSampleSizeForSparsity < 100) {
      errors.push('maxSampleSizeForSparsity should be at least 100');
    }

    if (!['full', 'redacted', 'minimal'].includes(this.config.privacyMode)) {
      errors.push('privacyMode must be one of: full, redacted, minimal');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Section1Config {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Section1Config>): void {
    this.config = { ...this.config, ...newConfig };

    // Recreate components with new config
    this.fileCollector = new FileMetadataCollector(this.config);
    this.parsingTracker = new ParsingMetadataTracker(this.config);
    this.structuralAnalyzer = new StructuralAnalyzer(this.config);
    this.environmentProfiler = new EnvironmentProfiler(this.config);
  }

  /**
   * Check system requirements for analysis
   */
  checkSystemRequirements(): {
    suitable: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const resources = this.environmentProfiler.checkResourceAvailability();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!resources.memoryAvailable) {
      warnings.push('Low system memory detected');
      recommendations.push('Consider closing other applications or using quick analysis mode');
    }

    if (resources.cpuLoadEstimate === 'high') {
      warnings.push('Limited CPU resources detected');
      recommendations.push('Analysis may take longer on this system');
    }

    return {
      suitable: warnings.length === 0,
      warnings,
      recommendations,
    };
  }
}
