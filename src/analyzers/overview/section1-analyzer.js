"use strict";
/**
 * Section 1 Analyzer - Main orchestrator for dataset overview analysis
 * Coordinates file metadata, parsing analytics, structural analysis, and environment profiling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section1Analyzer = void 0;
const file_metadata_collector_1 = require("./file-metadata-collector");
const parsing_metadata_tracker_1 = require("./parsing-metadata-tracker");
const structural_analyzer_1 = require("./structural-analyzer");
const environment_profiler_1 = require("./environment-profiler");
const logger_1 = require("../../utils/logger");
class Section1Analyzer {
    config;
    fileCollector;
    parsingTracker;
    structuralAnalyzer;
    environmentProfiler;
    progressCallback;
    constructor(config = {}) {
        // Set default configuration
        this.config = {
            includeHostEnvironment: true,
            enableFileHashing: true,
            maxSampleSizeForSparsity: 10000,
            privacyMode: 'redacted',
            detailedProfiling: true,
            ...config,
        };
        // Initialize component analyzers
        this.fileCollector = new file_metadata_collector_1.FileMetadataCollector(this.config);
        this.parsingTracker = new parsing_metadata_tracker_1.ParsingMetadataTracker(this.config);
        this.structuralAnalyzer = new structural_analyzer_1.StructuralAnalyzer(this.config);
        this.environmentProfiler = new environment_profiler_1.EnvironmentProfiler(this.config);
    }
    /**
     * Set progress callback for long-running operations
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    /**
     * Perform comprehensive Section 1 analysis
     */
    async analyze(filePath, command = `datapilot all ${filePath}`, enabledSections = ['all']) {
        logger_1.logger.info('Starting Section 1 analysis');
        this.environmentProfiler.reset();
        const warnings = [];
        try {
            // Phase 1: File Analysis
            this.reportProgress('file-analysis', 0, 'Collecting file metadata...');
            this.environmentProfiler.startPhase('file-analysis');
            // Validate file first
            const validation = this.fileCollector.validateFile(filePath);
            if (!validation.valid) {
                throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
            }
            const fileDetails = await this.fileCollector.collectMetadata(filePath);
            warnings.push(...this.fileCollector.getWarnings());
            const fileAnalysisTime = this.environmentProfiler.endPhase('file-analysis');
            this.reportProgress('file-analysis', 100, 'File metadata collected');
            // Phase 2: Parsing Analysis
            this.reportProgress('parsing', 0, 'Parsing CSV and analyzing format...');
            this.environmentProfiler.startPhase('parsing');
            const { rows, metadata: parsingMetadata } = await this.parsingTracker.parseWithMetadata(filePath);
            warnings.push(...this.parsingTracker.getWarnings());
            const parsingTime = this.environmentProfiler.endPhase('parsing');
            this.reportProgress('parsing', 100, 'CSV parsing completed');
            // Phase 3: Structural Analysis
            this.reportProgress('structural-analysis', 0, 'Analyzing dataset structure...');
            this.environmentProfiler.startPhase('structural-analysis');
            const structuralDimensions = this.structuralAnalyzer.analyzeStructure(rows, parsingMetadata.headerProcessing.headerPresence === 'Detected');
            warnings.push(...this.structuralAnalyzer.getWarnings());
            const structuralTime = this.environmentProfiler.endPhase('structural-analysis');
            this.reportProgress('structural-analysis', 100, 'Structural analysis completed');
            // Phase 4: Environment Context
            this.reportProgress('report-generation', 0, 'Finalizing analysis context...');
            const modules = this.environmentProfiler.generateModuleList(enabledSections);
            const executionContext = this.environmentProfiler.createExecutionContext(command, modules);
            // Create comprehensive result
            const overview = {
                fileDetails,
                parsingMetadata,
                structuralDimensions,
                executionContext,
                generatedAt: new Date(),
                version: this.getDataPilotVersion(),
            };
            const performanceMetrics = {
                ...this.environmentProfiler.createPerformanceSummary(),
                phases: {
                    'file-analysis': Number((fileAnalysisTime / 1000).toFixed(3)),
                    parsing: Number((parsingTime / 1000).toFixed(3)),
                    'structural-analysis': Number((structuralTime / 1000).toFixed(3)),
                },
            };
            this.reportProgress('report-generation', 100, 'Analysis completed');
            logger_1.logger.info(`Section 1 analysis completed in ${performanceMetrics.totalAnalysisTime}s`);
            return {
                overview,
                warnings,
                performanceMetrics,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Section 1 analysis failed: ${message}`);
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
    async quickAnalyze(filePath) {
        const quickConfig = {
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
    reportProgress(phase, progress, operation) {
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
    getDataPilotVersion() {
        // In production, this would read from package.json
        return '1.0.0';
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        const errors = [];
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Recreate components with new config
        this.fileCollector = new file_metadata_collector_1.FileMetadataCollector(this.config);
        this.parsingTracker = new parsing_metadata_tracker_1.ParsingMetadataTracker(this.config);
        this.structuralAnalyzer = new structural_analyzer_1.StructuralAnalyzer(this.config);
        this.environmentProfiler = new environment_profiler_1.EnvironmentProfiler(this.config);
    }
    /**
     * Check system requirements for analysis
     */
    checkSystemRequirements() {
        const resources = this.environmentProfiler.checkResourceAvailability();
        const warnings = [];
        const recommendations = [];
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
exports.Section1Analyzer = Section1Analyzer;
//# sourceMappingURL=section1-analyzer.js.map