"use strict";
/**
 * High-performance streaming CSV parser
 * Optimized for large files with minimal memory usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVParser = void 0;
const fs_1 = require("fs");
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const csv_detector_1 = require("./csv-detector");
const csv_state_machine_1 = require("./csv-state-machine");
const types_1 = require("../core/types");
const config_1 = require("../core/config");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
class CSVParser {
    options;
    stats;
    aborted = false;
    constructor(options = {}) {
        const configManager = (0, config_1.getConfig)();
        const perfConfig = configManager.getPerformanceConfig();
        this.options = {
            delimiter: ',',
            quote: '"',
            escape: '"',
            encoding: 'utf8',
            hasHeader: true,
            lineEnding: '\n',
            skipEmptyLines: true,
            maxRows: options.maxRows ?? perfConfig.maxRows,
            chunkSize: options.chunkSize ?? perfConfig.chunkSize,
            detectTypes: true,
            trimFields: true,
            maxFieldSize: options.maxFieldSize ?? perfConfig.maxFieldSize,
            autoDetect: true,
            sampleSize: options.sampleSize ?? perfConfig.sampleSize,
            ...options,
        };
        this.stats = {
            bytesProcessed: 0,
            rowsProcessed: 0,
            errors: [],
            startTime: Date.now(),
        };
    }
    /**
     * Parse CSV file with automatic format detection
     */
    async parseFile(filePath) {
        try {
            // Get file stats
            const fileStats = (0, fs_1.statSync)(filePath);
            if (fileStats.size === 0) {
                throw new types_1.DataPilotError('File is empty', 'EMPTY_FILE');
            }
            // Auto-detect format if enabled
            if (this.options.autoDetect) {
                await this.detectFormat(filePath);
            }
            // For large files, use streaming with batching to prevent memory overflow
            const fileSizeMB = fileStats.size / (1024 * 1024);
            const configManager = (0, config_1.getConfig)();
            const streamingConfig = configManager.getStreamingConfig();
            const isLargeFile = fileSizeMB > streamingConfig.memoryThresholdMB;
            if (isLargeFile) {
                return this.parseFileStreaming(filePath);
            }
            // Create parsing pipeline for smaller files
            const rows = [];
            const readStream = (0, fs_1.createReadStream)(filePath, {
                encoding: this.options.encoding,
                highWaterMark: this.options.chunkSize,
            });
            const parseTransform = this.createParseTransform((row) => {
                rows.push(row);
                // Check for memory pressure and switch to streaming if needed
                if (rows.length % 10000 === 0) {
                    const memUsage = process.memoryUsage();
                    this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage || 0, memUsage.heapUsed);
                    const configManager = (0, config_1.getConfig)();
                    const perfConfig = configManager.getPerformanceConfig();
                    if (memUsage.heapUsed > perfConfig.memoryThresholdBytes) {
                        throw new types_1.DataPilotError('Memory limit reached, file too large for in-memory parsing', 'MEMORY_LIMIT');
                    }
                }
            });
            // Process file with error handling
            try {
                await (0, promises_1.pipeline)(readStream, parseTransform);
            }
            catch (pipelineError) {
                if (pipelineError instanceof types_1.DataPilotError) {
                    throw pipelineError;
                }
                throw types_1.DataPilotError.parsing(`Pipeline processing failed: ${pipelineError instanceof Error ? pipelineError.message : 'Unknown error'}`, 'PIPELINE_ERROR', { filePath, rowIndex: rows.length }, [
                    {
                        action: 'Check file format',
                        description: 'Verify the CSV format is valid',
                        severity: types_1.ErrorSeverity.HIGH,
                    },
                    {
                        action: 'Try different options',
                        description: 'Experiment with different delimiter or quote settings',
                        severity: types_1.ErrorSeverity.MEDIUM,
                        command: '--delimiter ";" --quote "\""',
                    },
                ]);
            }
            this.stats.endTime = Date.now();
            // Validate results
            if (rows.length === 0) {
                throw error_handler_1.ErrorUtils.handleInsufficientData(0, 1, { filePath, operationName: 'parseFile' }, []);
            }
            return rows;
        }
        catch (error) {
            if (error instanceof types_1.DataPilotError && error.code === 'MEMORY_LIMIT') {
                // Fallback to streaming for large datasets
                return this.parseFileStreaming(filePath);
            }
            throw new types_1.DataPilotError(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PARSE_FAILED', types_1.ErrorSeverity.HIGH, types_1.ErrorCategory.PARSING, { filePath });
        }
    }
    /**
     * Parse large CSV files using streaming with memory-efficient batching
     */
    async parseFileStreaming(filePath) {
        const rows = [];
        const configManager = (0, config_1.getConfig)();
        const perfConfig = configManager.getPerformanceConfig();
        const batchSize = perfConfig.batchSize;
        let currentBatch = [];
        const readStream = (0, fs_1.createReadStream)(filePath, {
            encoding: this.options.encoding,
            highWaterMark: this.options.chunkSize,
        });
        const parseTransform = this.createParseTransform((row) => {
            currentBatch.push(row);
            // Process batch and clear memory periodically
            if (currentBatch.length >= batchSize) {
                rows.push(...currentBatch);
                currentBatch = []; // Clear batch to free memory
                // Track memory usage
                const memUsage = process.memoryUsage();
                this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage || 0, memUsage.heapUsed);
                // Respect maxRows limit to prevent unbounded growth
                if (rows.length >= this.options.maxRows) {
                    this.abort();
                }
            }
        });
        try {
            await (0, promises_1.pipeline)(readStream, parseTransform);
        }
        catch (error) {
            if (error instanceof types_1.DataPilotError) {
                throw error;
            }
            throw types_1.DataPilotError.parsing(`Streaming pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STREAMING_PIPELINE_ERROR', { filePath, rowIndex: rows.length }, [
                {
                    action: 'Reduce batch size',
                    description: 'Try processing with smaller chunks',
                    severity: types_1.ErrorSeverity.MEDIUM,
                    command: '--chunkSize 1000',
                },
                {
                    action: 'Check system resources',
                    description: 'Ensure sufficient memory and disk space',
                    severity: types_1.ErrorSeverity.HIGH,
                },
            ]);
        }
        // Add any remaining rows in the final batch
        if (currentBatch.length > 0) {
            rows.push(...currentBatch);
        }
        this.stats.endTime = Date.now();
        return rows;
    }
    /**
     * Create a streaming parser that can process large files
     */
    createStream() {
        return this.createParseTransform();
    }
    /**
     * Parse CSV from string data
     */
    parseString(data) {
        // Strip BOM if present
        let cleanData = data;
        if (data.charCodeAt(0) === 0xfeff) {
            cleanData = data.slice(1);
            logger_1.logger.debug('Stripped UTF-8 BOM from string data');
        }
        const stateMachine = new csv_state_machine_1.CSVStateMachine({
            delimiter: this.options.delimiter,
            quote: this.options.quote,
            escape: this.options.escape,
            trimFields: this.options.trimFields,
            maxFieldSize: this.options.maxFieldSize,
        });
        const rawRows = stateMachine.processChunk(cleanData);
        const finalRow = stateMachine.finalize();
        if (finalRow) {
            rawRows.push(finalRow);
        }
        const stats = stateMachine.getStats();
        this.stats.errors.push(...stats.errors);
        this.stats.bytesProcessed = cleanData.length;
        // Apply maxRows limit
        const limitedRawRows = rawRows.slice(0, this.options.maxRows);
        const processedRows = this.processRawRows(limitedRawRows);
        this.stats.rowsProcessed = processedRows.length;
        this.stats.endTime = Date.now();
        return processedRows;
    }
    /**
     * Auto-detect CSV format from file sample with error handling
     */
    async detectFormat(filePath) {
        try {
            const fileStats = (0, fs_1.statSync)(filePath);
            const sampleSize = Math.min(this.options.sampleSize, fileStats.size);
            if (sampleSize === 0) {
                logger_1.logger.warn('Cannot detect format from empty file, using defaults');
                return;
            }
            // Sample from beginning of file
            const stream = (0, fs_1.createReadStream)(filePath, { start: 0, end: sampleSize - 1 });
            const chunks = [];
            try {
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
            }
            catch (streamError) {
                throw types_1.DataPilotError.parsing(`Failed to read sample for format detection: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`, 'SAMPLE_READ_ERROR', { filePath }, [
                    {
                        action: 'Check file permissions',
                        description: 'Ensure the file is readable',
                        severity: types_1.ErrorSeverity.HIGH,
                    },
                    {
                        action: 'Specify format manually',
                        description: 'Skip auto-detection and specify format options',
                        severity: types_1.ErrorSeverity.MEDIUM,
                        command: '--delimiter "," --encoding utf8 --no-auto-detect',
                    },
                ]);
            }
            if (chunks.length === 0) {
                logger_1.logger.warn('No data read for format detection, using defaults');
                return;
            }
            const sampleBuffer = Buffer.concat(chunks);
            try {
                const detected = csv_detector_1.CSVDetector.detect(sampleBuffer);
                // Update options with detected values
                this.options = {
                    ...this.options,
                    encoding: detected.encoding,
                    delimiter: detected.delimiter,
                    quote: detected.quote,
                    lineEnding: detected.lineEnding,
                    hasHeader: detected.hasHeader,
                };
                logger_1.logger.debug(`Auto-detected format: delimiter='${detected.delimiter}', encoding='${detected.encoding}', quote='${detected.quote}'`);
            }
            catch (detectionError) {
                throw types_1.DataPilotError.parsing(`Format detection failed: ${detectionError instanceof Error ? detectionError.message : 'Unknown error'}`, 'FORMAT_DETECTION_FAILED', { filePath }, [
                    {
                        action: 'Use manual settings',
                        description: 'Specify delimiter, encoding, and quote characters manually',
                        severity: types_1.ErrorSeverity.MEDIUM,
                        command: '--delimiter "," --encoding utf8 --quote "\\""',
                    },
                    {
                        action: 'Check file format',
                        description: 'Verify the file is a valid CSV with consistent formatting',
                        severity: types_1.ErrorSeverity.HIGH,
                    },
                ]);
            }
        }
        catch (error) {
            if (error instanceof types_1.DataPilotError) {
                throw error;
            }
            throw types_1.DataPilotError.parsing(`Detection process failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'DETECTION_PROCESS_ERROR', { filePath });
        }
    }
    /**
     * Create the main parsing transform stream
     */
    createParseTransform(onRow) {
        const stateMachine = new csv_state_machine_1.CSVStateMachine({
            delimiter: this.options.delimiter,
            quote: this.options.quote,
            escape: this.options.escape,
            trimFields: this.options.trimFields,
            maxFieldSize: this.options.maxFieldSize,
        });
        let buffer = '';
        let processedRows = 0;
        let isFirstChunk = true;
        const parserInstance = this; // Capture reference for use in transform functions
        return new stream_1.Transform({
            objectMode: true,
            transform(chunk, _encoding, callback) {
                if (parserInstance.aborted) {
                    callback();
                    return;
                }
                try {
                    // Convert chunk to string
                    let chunkStr = chunk instanceof Buffer ? chunk.toString(parserInstance.options.encoding) : chunk;
                    // Strip BOM from first chunk
                    if (isFirstChunk) {
                        isFirstChunk = false;
                        // Check for UTF-8 BOM (EF BB BF)
                        if (typeof chunkStr === 'string' && chunkStr.length > 0 && chunkStr.charCodeAt(0) === 0xfeff) {
                            chunkStr = chunkStr.slice(1);
                            logger_1.logger.debug('Stripped UTF-8 BOM from first chunk');
                        }
                    }
                    buffer += chunkStr;
                    parserInstance.stats.bytesProcessed +=
                        chunk instanceof Buffer ? chunk.length : chunk.length;
                    // Process complete lines from buffer
                    const { processedBuffer, rows } = parserInstance.processBuffer(buffer, stateMachine);
                    buffer = processedBuffer;
                    // Handle processed rows
                    for (const rawRow of rows) {
                        if (processedRows >= parserInstance.options.maxRows) {
                            parserInstance.aborted = true;
                            break;
                        }
                        const processedRowData = parserInstance.processRawRows([rawRow]);
                        if (processedRowData.length > 0) {
                            const row = processedRowData[0];
                            processedRows++;
                            if (onRow) {
                                onRow(row);
                            }
                            else {
                                this.push(row);
                            }
                        }
                    }
                    callback();
                }
                catch (error) {
                    callback(error instanceof Error ? error : new Error('Unknown error'));
                }
            },
            flush(callback) {
                try {
                    // Process any remaining data in buffer
                    if (buffer.length > 0) {
                        const rows = stateMachine.processChunk(buffer);
                        const finalRow = stateMachine.finalize();
                        if (finalRow) {
                            rows.push(finalRow);
                        }
                        for (const rawRow of rows) {
                            if (processedRows >= parserInstance.options.maxRows)
                                break;
                            const processedRowData = parserInstance.processRawRows([rawRow]);
                            if (processedRowData.length > 0) {
                                const row = processedRowData[0];
                                processedRows++;
                                if (onRow) {
                                    onRow(row);
                                }
                                else {
                                    this.push(row);
                                }
                            }
                        }
                    }
                    // Update final stats
                    const machineStats = stateMachine.getStats();
                    parserInstance.stats.errors.push(...machineStats.errors);
                    parserInstance.stats.rowsProcessed = processedRows;
                    parserInstance.stats.endTime = Date.now();
                    callback();
                }
                catch (error) {
                    callback(error instanceof Error ? error : new Error('Unknown error'));
                }
            },
        });
    }
    /**
     * Process buffer and extract complete rows
     */
    processBuffer(buffer, stateMachine) {
        // Find last complete line
        const lineEndingLength = this.options.lineEnding.length;
        const lastLineEndingIndex = buffer.lastIndexOf(this.options.lineEnding);
        if (lastLineEndingIndex === -1) {
            // No complete lines yet
            return { processedBuffer: buffer, rows: [] };
        }
        // Process complete lines
        const completeData = buffer.substring(0, lastLineEndingIndex + lineEndingLength);
        const remainingBuffer = buffer.substring(lastLineEndingIndex + lineEndingLength);
        const rows = stateMachine.processChunk(completeData);
        return { processedBuffer: remainingBuffer, rows };
    }
    /**
     * Process raw string arrays into ParsedRow objects with error handling
     */
    processRawRows(rawRows) {
        const processedRows = [];
        let skippedRows = 0;
        let errorRows = 0;
        for (let i = 0; i < rawRows.length; i++) {
            try {
                const rawRow = rawRows[i];
                // Validate row data
                if (!Array.isArray(rawRow)) {
                    errorRows++;
                    logger_1.logger.debug(`Invalid row data at index ${i}: expected array, got ${typeof rawRow}`);
                    continue;
                }
                // Skip empty rows if configured
                if (this.options.skipEmptyLines && this.isEmptyRow(rawRow)) {
                    skippedRows++;
                    continue;
                }
                // Check for excessively long fields
                const hasOversizedField = rawRow.some((field) => typeof field === 'string' && field.length > this.options.maxFieldSize);
                if (hasOversizedField) {
                    logger_1.logger.warn(`Row ${i} contains oversized field(s), truncating`);
                    // Truncate oversized fields
                    const truncatedRow = rawRow.map((field) => typeof field === 'string' && field.length > this.options.maxFieldSize
                        ? field.substring(0, this.options.maxFieldSize) + '...'
                        : field);
                    const row = {
                        index: this.stats.rowsProcessed + processedRows.length,
                        data: truncatedRow,
                    };
                    processedRows.push(row);
                }
                else {
                    const row = {
                        index: this.stats.rowsProcessed + processedRows.length,
                        data: rawRow,
                    };
                    processedRows.push(row);
                }
            }
            catch (error) {
                errorRows++;
                logger_1.logger.debug(`Error processing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // If too many errors, warn the user
                if (errorRows > 10 && errorRows / (i + 1) > 0.1) {
                    logger_1.logger.warn(`High error rate in row processing: ${errorRows} errors in ${i + 1} rows`);
                }
            }
        }
        if (skippedRows > 0) {
            logger_1.logger.debug(`Skipped ${skippedRows} empty rows`);
        }
        if (errorRows > 0) {
            logger_1.logger.warn(`Encountered ${errorRows} invalid rows during processing`);
        }
        return processedRows;
    }
    /**
     * Check if a row is empty with error handling
     */
    isEmptyRow(row) {
        try {
            if (!Array.isArray(row)) {
                return true; // Treat invalid data as empty
            }
            return row.every((field) => {
                if (typeof field !== 'string') {
                    return false; // Non-string fields are considered non-empty
                }
                return field.trim().length === 0;
            });
        }
        catch (error) {
            logger_1.logger.debug(`Error checking if row is empty: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return true; // Treat errors as empty to skip problematic rows
        }
    }
    /**
     * Get current parsing statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Abort parsing operation
     */
    abort() {
        this.aborted = true;
    }
    /**
     * Get detected/configured options
     */
    getOptions() {
        return { ...this.options };
    }
}
exports.CSVParser = CSVParser;
//# sourceMappingURL=csv-parser.js.map