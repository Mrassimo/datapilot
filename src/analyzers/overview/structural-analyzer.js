"use strict";
/**
 * Structural Analyzer - Dataset dimensions and memory analysis
 * Handles memory estimation, sparsity analysis, and column profiling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuralAnalyzer = void 0;
class StructuralAnalyzer {
    config;
    warnings = [];
    constructor(config) {
        this.config = config;
    }
    /**
     * Analyze dataset structural dimensions and memory characteristics
     */
    analyzeStructure(rows, hasHeader) {
        if (rows.length === 0) {
            return this.createEmptyStructure();
        }
        // Basic dimensions
        const totalRowsRead = rows.length;
        const totalDataRows = hasHeader ? totalRowsRead - 1 : totalRowsRead;
        const totalColumns = rows[0]?.data.length || 0;
        const totalDataCells = totalDataRows * totalColumns;
        // Column inventory
        const columnInventory = this.createColumnInventory(rows, hasHeader);
        // Memory estimation
        const estimatedInMemorySizeMB = this.estimateMemoryUsage(rows, totalDataRows);
        // Row length analysis
        const averageRowLengthBytes = this.calculateAverageRowLength(rows);
        // Sparsity analysis
        const sparsityAnalysis = this.analyzeSparsity(rows, hasHeader);
        // Add warnings for structural issues
        this.addStructuralWarnings(totalDataRows, totalColumns, estimatedInMemorySizeMB);
        return {
            totalRowsRead,
            totalDataRows,
            totalColumns,
            totalDataCells,
            columnInventory,
            estimatedInMemorySizeMB,
            averageRowLengthBytes,
            sparsityAnalysis,
        };
    }
    /**
     * Create column inventory with names and indices
     */
    createColumnInventory(rows, hasHeader) {
        if (rows.length === 0) {
            return [];
        }
        const firstRow = rows[0];
        const columnCount = firstRow.data.length;
        const inventory = [];
        for (let i = 0; i < columnCount; i++) {
            let columnName;
            if (hasHeader) {
                // Use header row for column names
                columnName = firstRow.data[i] || `Column_${i}`;
            }
            else {
                // Generate generic column names
                columnName = `Col_${i}`;
            }
            inventory.push({
                index: i + 1, // 1-based indexing for display
                name: columnName,
                originalIndex: i, // 0-based original index
            });
        }
        return inventory;
    }
    /**
     * Estimate memory usage of the dataset
     */
    estimateMemoryUsage(rows, dataRows) {
        if (rows.length === 0)
            return 0;
        // Sample-based estimation for large datasets
        const sampleSize = Math.min(rows.length, 1000);
        const sampleRows = rows.slice(0, sampleSize);
        let totalSampleBytes = 0;
        for (const row of sampleRows) {
            for (const field of row.data) {
                // Estimate memory per field:
                // - String storage overhead (~24 bytes for V8 string object)
                // - Character storage (2 bytes per character for UTF-16 in V8)
                totalSampleBytes += 24 + field.length * 2;
            }
            // Row object overhead (~16 bytes)
            totalSampleBytes += 16;
        }
        // Average bytes per row
        const avgBytesPerRow = totalSampleBytes / sampleSize;
        // Extrapolate to full dataset
        const totalEstimatedBytes = avgBytesPerRow * dataRows;
        // Add overhead for data structures (arrays, indices, etc.) - roughly 30%
        const totalWithOverhead = totalEstimatedBytes * 1.3;
        // Convert to MB
        return Number((totalWithOverhead / (1024 * 1024)).toFixed(2));
    }
    /**
     * Calculate average row length in bytes
     */
    calculateAverageRowLength(rows) {
        if (rows.length === 0)
            return 0;
        // Sample first 100 rows for performance
        const sampleRows = rows.slice(0, Math.min(100, rows.length));
        let totalBytes = 0;
        for (const row of sampleRows) {
            let rowBytes = 0;
            for (const field of row.data) {
                // UTF-8 byte estimation (most characters are 1 byte, some are 2-4)
                rowBytes += this.estimateUtf8Bytes(field);
            }
            // Add delimiter and line ending bytes
            rowBytes += row.data.length - 1; // delimiters between fields
            rowBytes += 1; // line ending
            totalBytes += rowBytes;
        }
        return Math.round(totalBytes / sampleRows.length);
    }
    /**
     * Estimate UTF-8 byte count for a string
     */
    estimateUtf8Bytes(str) {
        let bytes = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 0x80) {
                bytes += 1;
            }
            else if (code < 0x800) {
                bytes += 2;
            }
            else if (code < 0x10000) {
                bytes += 3;
            }
            else {
                bytes += 4;
            }
        }
        return bytes;
    }
    /**
     * Analyze dataset sparsity (empty/null values)
     */
    analyzeSparsity(rows, hasHeader) {
        if (rows.length === 0) {
            return {
                sparsityPercentage: 0,
                method: 'No data available',
                sampleSize: 0,
                description: 'Empty dataset',
            };
        }
        // Determine sample size
        const dataRows = hasHeader ? rows.slice(1) : rows;
        const maxSampleSize = this.config.maxSampleSizeForSparsity || 10000;
        const sampleSize = Math.min(dataRows.length, maxSampleSize);
        const sampleRows = dataRows.slice(0, sampleSize);
        let emptyCells = 0;
        let totalCells = 0;
        for (const row of sampleRows) {
            for (const field of row.data) {
                totalCells++;
                if (this.isEmptyCell(field)) {
                    emptyCells++;
                }
            }
        }
        const sparsityPercentage = totalCells > 0 ? Number(((emptyCells / totalCells) * 100).toFixed(2)) : 0;
        let description;
        if (sparsityPercentage < 5) {
            description = 'Dense dataset with minimal missing values';
        }
        else if (sparsityPercentage < 20) {
            description = 'Moderately dense with some missing values';
        }
        else if (sparsityPercentage < 50) {
            description = 'Moderately sparse with significant missing values';
        }
        else {
            description = 'Highly sparse dataset with extensive missing values';
        }
        const method = sampleSize === dataRows.length
            ? 'Full dataset analysis'
            : `Statistical sampling of ${sampleSize} rows`;
        return {
            sparsityPercentage,
            method,
            sampleSize,
            description,
        };
    }
    /**
     * Check if a cell is considered empty
     */
    isEmptyCell(value) {
        // Consider various representations of empty/null values
        const trimmed = value.trim().toLowerCase();
        return (trimmed === '' ||
            trimmed === 'null' ||
            trimmed === 'undefined' ||
            trimmed === 'na' ||
            trimmed === 'n/a' ||
            trimmed === '-' ||
            trimmed === '#n/a');
    }
    /**
     * Add warnings for structural characteristics
     */
    addStructuralWarnings(dataRows, columns, memoryMB) {
        // Large dataset warnings
        if (dataRows > 1000000) {
            this.warnings.push({
                category: 'structural',
                severity: 'medium',
                message: `Large dataset detected (${dataRows.toLocaleString()} rows)`,
                impact: 'Higher memory usage and longer processing times',
                suggestion: 'Consider using sampling for exploratory analysis',
            });
        }
        // Wide dataset warnings
        if (columns > 100) {
            this.warnings.push({
                category: 'structural',
                severity: 'medium',
                message: `Wide dataset detected (${columns} columns)`,
                impact: 'Complex correlation analysis and visualization challenges',
                suggestion: 'Consider feature selection or dimensionality reduction',
            });
        }
        // Memory warnings
        if (memoryMB > 1000) {
            this.warnings.push({
                category: 'structural',
                severity: 'high',
                message: `High memory usage estimated (${memoryMB}MB)`,
                impact: 'May exceed available system memory',
                suggestion: 'Consider processing in chunks or using sampling',
            });
        }
        // Small dataset warnings
        if (dataRows < 10) {
            this.warnings.push({
                category: 'structural',
                severity: 'low',
                message: `Very small dataset (${dataRows} rows)`,
                impact: 'Limited statistical analysis capability',
                suggestion: 'Statistical tests may have low power',
            });
        }
    }
    /**
     * Create empty structure for edge cases
     */
    createEmptyStructure() {
        return {
            totalRowsRead: 0,
            totalDataRows: 0,
            totalColumns: 0,
            totalDataCells: 0,
            columnInventory: [],
            estimatedInMemorySizeMB: 0,
            averageRowLengthBytes: 0,
            sparsityAnalysis: {
                sparsityPercentage: 0,
                method: 'No data available',
                sampleSize: 0,
                description: 'Empty dataset',
            },
        };
    }
    /**
     * Get collected warnings
     */
    getWarnings() {
        return [...this.warnings];
    }
    /**
     * Clear warnings
     */
    clearWarnings() {
        this.warnings = [];
    }
}
exports.StructuralAnalyzer = StructuralAnalyzer;
//# sourceMappingURL=structural-analyzer.js.map