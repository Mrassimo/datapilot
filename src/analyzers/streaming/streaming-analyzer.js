"use strict";
/**
 * Streaming Data Analysis Engine
 * Memory-efficient analysis using online algorithms and chunk processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingAnalyzer = void 0;
exports.analyzeFileStreaming = analyzeFileStreaming;
const fs_1 = require("fs");
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const logger_1 = require("../../utils/logger");
const csv_parser_1 = require("../../parsers/csv-parser");
const config_1 = require("../../core/config");
const types_1 = require("../../core/types");
const streaming_univariate_analyzer_1 = require("./streaming-univariate-analyzer");
const streaming_bivariate_analyzer_1 = require("./streaming-bivariate-analyzer");
const multivariate_orchestrator_1 = require("../multivariate/multivariate-orchestrator");
const enhanced_type_detector_1 = require("./enhanced-type-detector");
const types_2 = require("../eda/types");
/**
 * Main Streaming Analysis Engine
 * Processes any size dataset with constant memory usage
 */
class StreamingAnalyzer {
    config;
    state;
    progressCallback;
    // Analyzers
    columnAnalyzers = new Map();
    bivariateAnalyzer;
    // Metadata
    headers = [];
    detectedTypes = [];
    semanticTypes = [];
    warnings = [];
    typeDetectionResults = []; // Store enhanced detection results (limited)
    hasHeaders = false; // Track if CSV has headers
    // Data collection for multivariate analysis (when enabled)
    collectedData = [];
    maxCollectedRows;
    constructor(config = {}) {
        const configManager = (0, config_1.getConfig)();
        const streamingConfig = configManager.getStreamingConfig();
        const analysisConfig = configManager.getAnalysisConfig();
        const statisticalConfig = configManager.getStatisticalConfig();
        this.config = {
            // Default streaming config from configuration manager
            chunkSize: streamingConfig.adaptiveChunkSizing.minChunkSize,
            memoryThresholdMB: streamingConfig.memoryThresholdMB,
            maxRowsAnalyzed: streamingConfig.maxRowsAnalyzed,
            adaptiveChunkSizing: streamingConfig.adaptiveChunkSizing.enabled,
            // Default Section3Config from configuration manager
            enabledAnalyses: analysisConfig.enabledAnalyses,
            significanceLevel: statisticalConfig.significanceLevel,
            maxCorrelationPairs: analysisConfig.maxCorrelationPairs,
            outlierMethods: analysisConfig.outlierMethods,
            normalityTests: analysisConfig.normalityTests,
            maxCategoricalLevels: analysisConfig.maxCategoricalLevels,
            enableMultivariate: analysisConfig.enableMultivariate,
            samplingThreshold: analysisConfig.samplingThreshold,
            ...config,
        };
        // Set maxCollectedRows from configuration
        const perfConfig = configManager.getPerformanceConfig();
        this.maxCollectedRows = perfConfig.maxCollectedRowsMultivariate;
        this.state = {
            rowsProcessed: 0,
            chunksProcessed: 0,
            currentMemoryMB: 0,
            peakMemoryMB: 0,
            startTime: 0,
            currentChunkSize: this.config.chunkSize,
            hasSkippedHeader: false,
        };
        this.bivariateAnalyzer = new streaming_bivariate_analyzer_1.StreamingBivariateAnalyzer(this.config.maxCorrelationPairs);
    }
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }
    /**
     * Analyze a CSV file using streaming processing
     */
    async analyzeFile(filePath) {
        const context = {
            section: 'eda',
            analyzer: 'StreamingAnalyzer',
            filePath,
            operation: 'analyzeFile',
        };
        logger_1.logger.info('Starting streaming analysis of file', context);
        this.state.startTime = Date.now();
        try {
            // Phase 1: Initialize parsers and detect format
            this.reportProgress('initialization', 0, 'Initializing streaming analysis...');
            const parser = new csv_parser_1.CSVParser({
                maxRows: this.config.maxRowsAnalyzed,
                autoDetect: true,
            });
            // Phase 2: First pass - data type detection and initialization
            await this.firstPass(parser, filePath);
            // Phase 3: Main streaming analysis
            await this.streamingPass(parser, filePath);
            // Phase 4: Finalize results
            return await this.finalizeResults();
        }
        catch (error) {
            logger_1.logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), context);
            throw error;
        }
    }
    /**
     * First pass: Quick scan for headers, types, and basic metadata
     */
    async firstPass(parser, filePath) {
        this.reportProgress('initialization', 25, 'Detecting data types...');
        let sampleRowCount = 0;
        const maxSampleRows = 1000;
        const sampleData = [];
        const sampleStream = new stream_1.Transform({
            objectMode: true,
            transform(chunk, _encoding, callback) {
                if (sampleRowCount < maxSampleRows) {
                    sampleData.push(chunk);
                    sampleRowCount++;
                }
                callback();
            },
        });
        const readStream = (0, fs_1.createReadStream)(filePath);
        const parseStream = parser.createStream();
        await (0, promises_1.pipeline)(readStream, parseStream, sampleStream);
        if (sampleData.length === 0) {
            throw new Error('No data found in file');
        }
        // Extract headers from parser config and sample data
        this.headers = this.extractHeaders(sampleData, parser);
        // Store whether CSV has headers for later use in data processing
        const parserOptions = parser.getOptions();
        this.hasHeaders = parserOptions.hasHeader ?? true;
        // Detect column types from sample
        this.detectedTypes = this.detectColumnTypes(sampleData);
        // Infer semantic types
        this.semanticTypes = this.inferSemanticTypes();
        // Initialize column analyzers
        this.initializeColumnAnalyzers();
        // Initialize bivariate analysis
        this.initializeBivariateAnalysis();
        this.reportProgress('initialization', 100, 'Initialization complete');
    }
    /**
     * Main streaming pass: Process data in chunks
     */
    async streamingPass(parser, filePath) {
        this.reportProgress('univariate', 0, 'Starting streaming analysis...');
        let currentChunk = [];
        const chunkProcessor = new stream_1.Transform({
            objectMode: true,
            transform: (row, _encoding, callback) => {
                try {
                    currentChunk.push(row);
                    // Process chunk when it reaches target size
                    if (currentChunk.length >= this.state.currentChunkSize) {
                        this.processChunk(currentChunk);
                        currentChunk = [];
                        // Adaptive memory management
                        this.manageMemory();
                        // Check if we've hit row limit
                        if (this.state.rowsProcessed >= this.config.maxRowsAnalyzed) {
                            this.warnings.push({
                                category: 'performance',
                                severity: 'medium',
                                message: `Analysis stopped at ${this.config.maxRowsAnalyzed} rows to prevent memory issues`,
                                impact: 'Results based on subset of data',
                                suggestion: 'Increase maxRowsAnalyzed in configuration if more memory is available',
                            });
                            return callback();
                        }
                    }
                    callback();
                }
                catch (error) {
                    callback(error instanceof Error ? error : new Error(String(error)));
                }
            },
            flush: (callback) => {
                // Process final partial chunk
                if (currentChunk.length > 0) {
                    this.processChunk(currentChunk);
                }
                callback();
            },
        });
        const readStream = (0, fs_1.createReadStream)(filePath);
        const parseStream = parser.createStream();
        await (0, promises_1.pipeline)(readStream, parseStream, chunkProcessor);
        this.reportProgress('univariate', 100, 'Streaming analysis complete');
    }
    /**
     * Process a single chunk of data
     */
    processChunk(chunk) {
        this.state.chunksProcessed++;
        for (const row of chunk) {
            // Skip header row if this is the first row and CSV has headers
            if (this.hasHeaders && !this.state.hasSkippedHeader && row.index === 0) {
                this.state.hasSkippedHeader = true;
                continue; // Skip processing the header row as data
            }
            this.state.rowsProcessed++;
            // Process each column for univariate analysis
            for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
                const columnName = this.headers[colIndex];
                const analyzer = this.columnAnalyzers.get(columnName);
                if (analyzer && row.data[colIndex] !== undefined) {
                    analyzer.processValue(row.data[colIndex]);
                }
            }
            // Process for bivariate analysis
            this.bivariateAnalyzer.processRow(row.data, this.detectedTypes);
            // Collect data for multivariate analysis (if enabled and within limit)
            if (this.config.enableMultivariate && this.collectedData.length < this.maxCollectedRows) {
                this.collectedData.push([...row.data]); // Store a copy of the row data
            }
        }
        // Clear chunk from memory immediately
        chunk.length = 0;
        // Update progress periodically based on configuration
        const configManager = (0, config_1.getConfig)();
        const perfConfig = configManager.getPerformanceConfig();
        if (this.state.chunksProcessed % perfConfig.performanceMonitoringInterval === 0) {
            const progress = Math.min(90, (this.state.rowsProcessed / this.config.maxRowsAnalyzed) * 90);
            this.reportProgress('univariate', progress, `Processed ${this.state.rowsProcessed.toLocaleString()} rows in ${this.state.chunksProcessed} chunks`);
        }
        // Memory cleanup based on configuration interval
        if (this.state.chunksProcessed % perfConfig.memoryCleanupInterval === 0) {
            this.performMemoryCleanup();
        }
    }
    /**
     * Perform aggressive memory cleanup
     */
    performMemoryCleanup() {
        const configManager = (0, config_1.getConfig)();
        const perfConfig = configManager.getPerformanceConfig();
        const streamingConfig = configManager.getStreamingConfig();
        // Clear type detection results after initial setup
        if (this.state.chunksProcessed > perfConfig.performanceMonitoringInterval) {
            this.typeDetectionResults = [];
        }
        // Clear memory from all column analyzers
        for (const analyzer of this.columnAnalyzers.values()) {
            if (analyzer.clearMemory) {
                analyzer.clearMemory();
            }
        }
        // If under extreme memory pressure and we have sufficient data for multivariate analysis,
        // limit the collected data to prevent memory issues
        const emergencyThreshold = this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
        const minMultivariateRows = Math.min(1000, perfConfig.maxCollectedRowsMultivariate / 2);
        if (this.state.currentMemoryMB > emergencyThreshold &&
            this.collectedData.length > minMultivariateRows) {
            // Keep only the minimum required rows for multivariate analysis
            this.collectedData = this.collectedData.slice(0, minMultivariateRows);
        }
        // Force garbage collection if available and enabled
        if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
            global.gc();
        }
    }
    /**
     * Adaptive memory management with aggressive cleanup
     */
    manageMemory() {
        const memUsage = process.memoryUsage();
        this.state.currentMemoryMB = Math.round(memUsage.heapUsed / (1024 * 1024));
        this.state.peakMemoryMB = Math.max(this.state.peakMemoryMB, this.state.currentMemoryMB);
        const configManager = (0, config_1.getConfig)();
        const streamingConfig = configManager.getStreamingConfig();
        if (this.config.adaptiveChunkSizing) {
            if (this.state.currentMemoryMB > this.config.memoryThresholdMB) {
                // Reduce chunk size to use less memory based on configuration
                this.state.currentChunkSize = Math.max(streamingConfig.adaptiveChunkSizing.minChunkSize, Math.floor(this.state.currentChunkSize * streamingConfig.adaptiveChunkSizing.reductionFactor));
                // Clear type detection results to free memory
                this.typeDetectionResults = [];
                // Force garbage collection if available and enabled
                if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
                    global.gc();
                }
            }
            else if (this.state.currentMemoryMB < this.config.memoryThresholdMB * 0.3) {
                // Increase chunk size for better performance
                this.state.currentChunkSize = Math.min(streamingConfig.adaptiveChunkSizing.maxChunkSize, Math.floor(this.state.currentChunkSize * streamingConfig.adaptiveChunkSizing.expansionFactor));
            }
        }
        // Emergency brake if memory gets too high
        const emergencyThreshold = this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
        if (this.state.currentMemoryMB > emergencyThreshold) {
            this.warnings.push({
                category: 'performance',
                severity: 'high',
                message: `High memory usage detected (${this.state.currentMemoryMB}MB). Consider reducing maxRowsAnalyzed in configuration.`,
                impact: 'Analysis may slow down or fail',
                suggestion: 'Reduce dataset size, increase available memory, or adjust memory thresholds in configuration',
            });
            // Aggressive memory cleanup
            this.typeDetectionResults = [];
            if (streamingConfig.memoryManagement.forceGarbageCollection && global.gc) {
                global.gc();
            }
        }
    }
    /**
     * Finalize analysis and generate results
     */
    async finalizeResults() {
        this.reportProgress('finalization', 0, 'Finalizing results...');
        // Collect univariate results
        const univariateAnalysis = [];
        for (const [columnName, analyzer] of this.columnAnalyzers) {
            try {
                const result = analyzer.finalize();
                univariateAnalysis.push(result);
                this.warnings.push(...analyzer.getWarnings());
            }
            catch (error) {
                logger_1.logger.error(`Error finalizing analysis for column ${columnName}:`, {
                    section: 'eda',
                    analyzer: 'StreamingAnalyzer',
                    operation: 'finalizeColumnAnalysis',
                }, error);
                this.warnings.push({
                    category: 'error',
                    severity: 'high',
                    message: `Failed to complete analysis for column ${columnName}`,
                    impact: 'Column excluded from results',
                    suggestion: 'Check data quality or column type detection',
                });
            }
        }
        // Collect bivariate results
        const bivariateAnalysis = this.bivariateAnalyzer.finalize(this.headers);
        this.warnings.push(...this.bivariateAnalyzer.getWarnings());
        // Generate insights
        const insights = this.generateStreamingInsights(univariateAnalysis);
        const endTime = Date.now();
        const analysisTime = endTime - this.state.startTime;
        // Perform multivariate analysis if enabled and applicable
        let multivariateAnalysis;
        if (this.config.enableMultivariate && this.state.rowsProcessed > 50) {
            this.reportProgress('multivariate', 90, 'Performing multivariate analysis...');
            try {
                multivariateAnalysis = await multivariate_orchestrator_1.MultivariateOrchestrator.analyze(this.collectedData || [], this.headers, this.detectedTypes, this.state.rowsProcessed);
                logger_1.logger.info('Multivariate analysis completed successfully');
            }
            catch (error) {
                logger_1.logger.warn('Multivariate analysis failed:', {
                    section: 'eda',
                    analyzer: 'StreamingAnalyzer',
                    operation: 'multivariateAnalysis',
                }, error);
                // Fallback to minimal analysis
                multivariateAnalysis = await multivariate_orchestrator_1.MultivariateOrchestrator.analyze([], [], [], 0);
            }
        }
        else {
            // Create minimal multivariate analysis when disabled or insufficient data
            multivariateAnalysis = await multivariate_orchestrator_1.MultivariateOrchestrator.analyze([], [], [], 0);
        }
        const edaAnalysis = {
            univariateAnalysis,
            bivariateAnalysis,
            multivariateAnalysis,
            crossVariableInsights: insights,
        };
        this.reportProgress('finalization', 100, 'Analysis complete');
        return {
            edaAnalysis,
            warnings: this.warnings,
            performanceMetrics: {
                analysisTimeMs: analysisTime,
                rowsAnalyzed: this.state.rowsProcessed,
                chunksProcessed: this.state.chunksProcessed,
                peakMemoryMB: this.state.peakMemoryMB,
                avgChunkSize: Math.round(this.state.rowsProcessed / this.state.chunksProcessed),
                memoryEfficiency: `Constant ~${this.state.peakMemoryMB}MB usage`,
            },
            metadata: {
                analysisApproach: 'Streaming with online algorithms',
                datasetSize: this.state.rowsProcessed,
                columnsAnalyzed: this.headers.length,
                samplingApplied: this.state.rowsProcessed >= this.config.maxRowsAnalyzed,
            },
        };
    }
    extractHeaders(sampleData, parser) {
        if (sampleData.length === 0)
            return [];
        const firstRow = sampleData[0];
        // Get header setting from parser options
        const parserOptions = parser.getOptions();
        const hasHeader = parserOptions.hasHeader ?? true; // Default to true for CSV files
        if (hasHeader) {
            // Use actual column names from header row
            return firstRow.data.map((headerValue, index) => headerValue && headerValue.trim() ? headerValue.trim() : `Column_${index + 1}`);
        }
        else {
            // Generate generic column names only if no headers
            return firstRow.data.map((_, index) => `Column_${index + 1}`);
        }
    }
    detectColumnTypes(sampleData) {
        if (sampleData.length === 0)
            return [];
        const columnCount = sampleData[0].data.length;
        // Skip header row if present when sampling for type detection
        const dataStartIndex = this.hasHeaders ? 1 : 0;
        const effectiveSampleData = sampleData.slice(dataStartIndex);
        // Prepare column samples for enhanced detection
        const columnSamples = [];
        for (let colIndex = 0; colIndex < columnCount; colIndex++) {
            const values = effectiveSampleData.slice(0, 500).map((row) => row.data[colIndex]); // Use more samples, excluding header
            const columnName = this.headers[colIndex] || `Column_${colIndex + 1}`;
            columnSamples.push({
                values,
                columnName,
                columnIndex: colIndex,
            });
        }
        // Use enhanced type detection
        const detectionResults = enhanced_type_detector_1.EnhancedTypeDetector.detectColumnTypes(columnSamples);
        // Store detection results for semantic type inference (clear after use to save memory)
        this.typeDetectionResults = detectionResults;
        // Log detection results for debugging
        for (let i = 0; i < detectionResults.length; i++) {
            const result = detectionResults[i];
            if (result.confidence > 0.7) {
                logger_1.logger.info(`Column ${this.headers[i]}: ${result.dataType} (${result.semanticType}) - Confidence: ${result.confidence.toFixed(2)}`);
            }
        }
        return detectionResults.map((result) => result.dataType);
    }
    inferSemanticTypes() {
        // Use enhanced detection results if available
        if (this.typeDetectionResults && this.typeDetectionResults.length > 0) {
            return this.typeDetectionResults.map((result) => result.semanticType);
        }
        // Fallback to simple inference
        return this.headers.map((header, index) => {
            const headerLower = header.toLowerCase();
            const type = this.detectedTypes[index];
            // Simple semantic type inference
            if (headerLower.includes('price') ||
                headerLower.includes('cost') ||
                headerLower.includes('amount')) {
                return types_2.SemanticType.CURRENCY;
            }
            else if (headerLower.includes('age')) {
                return types_2.SemanticType.AGE;
            }
            else if (headerLower.includes('id') || headerLower.includes('identifier')) {
                return types_2.SemanticType.IDENTIFIER;
            }
            else if (type === types_2.EdaDataType.CATEGORICAL) {
                return types_2.SemanticType.CATEGORY;
            }
            return types_2.SemanticType.UNKNOWN;
        });
    }
    initializeColumnAnalyzers() {
        for (let i = 0; i < this.headers.length; i++) {
            const columnName = this.headers[i];
            const columnType = this.detectedTypes[i];
            const semanticType = this.semanticTypes[i];
            let analyzer;
            // Select appropriate analyzer based on detected column type
            switch (columnType) {
                case types_2.EdaDataType.NUMERICAL_FLOAT:
                case types_2.EdaDataType.NUMERICAL_INTEGER:
                    analyzer = new streaming_univariate_analyzer_1.StreamingNumericalAnalyzer(columnName, columnType, semanticType);
                    break;
                case types_2.EdaDataType.DATE_TIME:
                    analyzer = new streaming_univariate_analyzer_1.StreamingDateTimeAnalyzer(columnName, columnType, semanticType);
                    break;
                case types_2.EdaDataType.BOOLEAN:
                    analyzer = new streaming_univariate_analyzer_1.StreamingBooleanAnalyzer(columnName, columnType, semanticType);
                    break;
                case types_2.EdaDataType.TEXT_GENERAL:
                case types_2.EdaDataType.TEXT_ADDRESS:
                    analyzer = new streaming_univariate_analyzer_1.StreamingTextAnalyzer(columnName, columnType, semanticType);
                    break;
                case types_2.EdaDataType.CATEGORICAL:
                default:
                    analyzer = new streaming_univariate_analyzer_1.StreamingCategoricalAnalyzer(columnName, columnType, semanticType);
                    break;
            }
            this.columnAnalyzers.set(columnName, analyzer);
        }
    }
    initializeBivariateAnalysis() {
        const pairs = [];
        for (let i = 0; i < this.headers.length; i++) {
            for (let j = i + 1; j < this.headers.length; j++) {
                pairs.push({
                    col1Index: i,
                    col1Name: this.headers[i],
                    col1Type: this.detectedTypes[i],
                    col2Index: j,
                    col2Name: this.headers[j],
                    col2Type: this.detectedTypes[j],
                });
            }
        }
        this.bivariateAnalyzer.initializePairs(pairs);
    }
    generateStreamingInsights(univariateAnalysis) {
        const topFindings = [];
        const dataQualityIssues = [];
        const hypothesesGenerated = [];
        const preprocessingRecommendations = [];
        // Analyze data quality
        const poorQualityColumns = univariateAnalysis.filter((col) => col.missingPercentage > 20);
        if (poorQualityColumns.length > 0) {
            dataQualityIssues.push(`${poorQualityColumns.length} columns have >20% missing values: ${poorQualityColumns.map((c) => c.columnName).join(', ')}`);
        }
        // High cardinality detection
        const highCardinalityColumns = univariateAnalysis.filter((col) => col.uniquePercentage > 80 && col.totalValues > 100);
        if (highCardinalityColumns.length > 0) {
            preprocessingRecommendations.push(`Consider encoding or grouping high-cardinality columns: ${highCardinalityColumns.map((c) => c.columnName).join(', ')}`);
        }
        // Memory efficiency insight
        topFindings.push(`Streaming analysis processed ${this.state.rowsProcessed.toLocaleString()} rows using only ${this.state.peakMemoryMB}MB peak memory`);
        return {
            topFindings,
            dataQualityIssues,
            hypothesesGenerated,
            preprocessingRecommendations,
        };
    }
    reportProgress(stage, percentage, message) {
        if (this.progressCallback) {
            this.progressCallback({
                stage: stage,
                percentage,
                message,
                currentStep: this.state.chunksProcessed,
                totalSteps: Math.ceil(this.config.maxRowsAnalyzed / this.state.currentChunkSize),
            });
        }
    }
    /**
     * Handle analysis errors with graceful degradation
     */
    async handleAnalysisError(error, logContext) {
        logger_1.logger.errorWithStack(error instanceof Error ? error : new Error(String(error)), logContext);
        if (error instanceof types_1.DataPilotError) {
            // Check if we can provide a degraded result
            if (error.recoverable && this.state.rowsProcessed > 0) {
                this.warnings.push({
                    category: 'error',
                    message: `Analysis completed with errors: ${error.message}`,
                    severity: 'high',
                    impact: 'Partial results available',
                    suggestion: 'Check data quality or review error logs',
                });
                logger_1.logger.warn('Returning partial results due to recoverable error', logContext);
                return await this.createDegradedResult(error);
            }
        }
        // Re-throw non-recoverable errors
        throw error;
    }
    /**
     * Create a degraded result when full analysis fails
     */
    async createDegradedResult(error) {
        // Use the existing MultivariateOrchestrator to create an empty analysis
        const emptyMultivariateAnalysis = await multivariate_orchestrator_1.MultivariateOrchestrator.analyze([], [], [], 0);
        return {
            edaAnalysis: {
                univariateAnalysis: [],
                bivariateAnalysis: {
                    numericalVsNumerical: {
                        totalPairsAnalyzed: 0,
                        correlationPairs: [],
                        strongestPositiveCorrelation: null,
                        strongestNegativeCorrelation: null,
                        strongCorrelations: [],
                        scatterPlotInsights: [],
                        regressionInsights: [],
                    },
                    numericalVsCategorical: [],
                    categoricalVsCategorical: [],
                },
                multivariateAnalysis: emptyMultivariateAnalysis,
                crossVariableInsights: {
                    topFindings: [`Analysis interrupted: ${error.message}`],
                    dataQualityIssues: ['Incomplete analysis due to processing error'],
                    hypothesesGenerated: [],
                    preprocessingRecommendations: [],
                },
            },
            warnings: [
                ...this.warnings,
                {
                    category: 'error',
                    message: 'Analysis completed with reduced functionality due to errors',
                    severity: 'high',
                    impact: 'No analysis results available',
                    suggestion: 'Check error logs and retry with different configuration',
                },
            ],
            performanceMetrics: {
                analysisTimeMs: Date.now() - this.state.startTime,
                peakMemoryMB: this.state.peakMemoryMB,
                rowsAnalyzed: this.state.rowsProcessed,
                chunksProcessed: this.state.chunksProcessed,
            },
            metadata: {
                analysisApproach: 'StreamingAnalyzer (degraded)',
                datasetSize: this.state.rowsProcessed,
                columnsAnalyzed: this.headers.length,
                samplingApplied: false,
            },
        };
    }
    /**
     * Check if multivariate data should be collected
     */
    shouldCollectMultivariateData() {
        return (this.collectedData.length < this.maxCollectedRows &&
            this.state.currentMemoryMB < this.config.memoryThresholdMB * 0.8);
    }
    /**
     * Collect data for multivariate analysis with memory-efficient approach
     */
    collectMultivariateData(rowData) {
        // Use a more memory-efficient approach by sampling if needed
        const shouldSample = this.collectedData.length > this.maxCollectedRows * 0.8;
        if (!shouldSample || Math.random() < 0.1) {
            this.collectedData.push(Object.freeze([...rowData]));
        }
    }
    /**
     * Handle memory pressure for multivariate data collection
     */
    handleMultivariateMemoryPressure(streamingConfig, perfConfig) {
        const emergencyThreshold = this.config.memoryThresholdMB * streamingConfig.memoryManagement.emergencyThresholdMultiplier;
        const minMultivariateRows = Math.min(1000, perfConfig.maxCollectedRowsMultivariate / 2);
        if (this.state.currentMemoryMB > emergencyThreshold &&
            this.collectedData.length > minMultivariateRows) {
            // Keep only the minimum required rows for multivariate analysis
            this.collectedData = this.collectedData.slice(0, minMultivariateRows);
        }
    }
    /**
     * Perform multivariate analysis with enhanced type safety
     */
    async performMultivariateAnalysis() {
        const dataArray = this.collectedData.map((row) => [...row]);
        return await multivariate_orchestrator_1.MultivariateOrchestrator.analyze(dataArray, this.headers, this.detectedTypes, this.state.rowsProcessed);
    }
    /**
     * Create minimal multivariate analysis when disabled or insufficient data
     */
    async createMinimalMultivariateAnalysis() {
        return await multivariate_orchestrator_1.MultivariateOrchestrator.analyze([], [], [], 0);
    }
    /**
     * Validate analyzer state before operations
     */
    validateAnalyzerState(operation) {
        if (this.headers.length === 0) {
            throw types_1.DataPilotError.analysis(`Cannot perform ${operation}: no headers detected`, 'NO_HEADERS_DETECTED', { analyzer: 'StreamingAnalyzer', operationName: operation }, [
                {
                    action: 'Check data format',
                    description: 'Ensure the CSV file has proper column headers',
                    severity: types_1.ErrorSeverity.HIGH,
                },
            ]);
        }
        if (this.detectedTypes.length !== this.headers.length) {
            throw types_1.DataPilotError.analysis(`Type detection mismatch: ${this.headers.length} headers, ${this.detectedTypes.length} types`, 'TYPE_HEADER_MISMATCH', { analyzer: 'StreamingAnalyzer', operationName: operation }, [
                {
                    action: 'Re-run type detection',
                    description: 'Retry the analysis to fix type detection',
                    severity: types_1.ErrorSeverity.MEDIUM,
                },
            ]);
        }
    }
}
exports.StreamingAnalyzer = StreamingAnalyzer;
/**
 * Convenience function to analyze a file using streaming approach
 */
async function analyzeFileStreaming(filePath, config = {}) {
    const analyzer = new StreamingAnalyzer(config);
    return analyzer.analyzeFile(filePath);
}
//# sourceMappingURL=streaming-analyzer.js.map