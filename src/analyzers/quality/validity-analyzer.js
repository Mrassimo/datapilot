"use strict";
/**
 * Section 2: Validity Dimension Analyzer
 * Validates data types, ranges, patterns, and business rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidityAnalyzer = void 0;
const types_1 = require("../../core/types");
class ValidityAnalyzer {
    data;
    headers;
    columnTypes;
    rowCount;
    columnCount;
    businessRules;
    customPatterns;
    customRanges;
    static EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    static PHONE_PATTERN = /^[\+]?[\d\s\-\(\)]{10,}$/;
    static URL_PATTERN = /^https?:\/\/[^\s]+$/;
    static DATE_PATTERNS = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];
    constructor(input) {
        this.data = input.data;
        this.headers = input.headers;
        this.columnTypes = input.columnTypes;
        this.rowCount = input.rowCount;
        this.columnCount = input.columnCount;
        this.businessRules = input.businessRules || [];
        this.customPatterns = input.customPatterns || {};
        this.customRanges = input.customRanges || {};
    }
    analyze() {
        const start = performance.now();
        // 1. Data type conformance
        const typeConformance = this.analyzeTypeConformance();
        // 2. Range conformance
        const rangeConformance = this.analyzeRangeConformance();
        // 3. Pattern conformance
        const patternConformance = this.analyzePatternConformance();
        // 4. Business rules validation
        const businessRules = this.validateBusinessRules();
        // 5. File structure validation
        const fileStructure = this.analyzeFileStructure();
        // 6. Calculate overall score
        const score = this.calculateValidityScore(typeConformance, rangeConformance, patternConformance, businessRules);
        console.log(`Validity analysis completed in ${(performance.now() - start).toFixed(2)}ms`);
        return {
            typeConformance,
            rangeConformance,
            patternConformance,
            businessRules,
            fileStructure,
            score,
        };
    }
    analyzeTypeConformance() {
        return this.headers.map((columnName, colIdx) => {
            const expectedType = this.columnTypes[colIdx];
            const actualType = this.inferActualType(colIdx);
            const conformanceResults = this.checkTypeConformance(colIdx, expectedType);
            return {
                columnName,
                expectedType: this.formatDataType(expectedType),
                actualType: this.formatDataType(actualType.type),
                confidence: actualType.confidence,
                nonConformingCount: conformanceResults.nonConformingCount,
                conformancePercentage: conformanceResults.conformancePercentage,
                examples: conformanceResults.examples,
                conversionStrategy: this.suggestConversionStrategy(expectedType, actualType.type, conformanceResults),
            };
        });
    }
    analyzeRangeConformance() {
        const numericColumns = this.headers
            .map((header, idx) => ({ header, idx, type: this.columnTypes[idx] }))
            .filter(({ type }) => type === types_1.DataType.NUMBER || type === types_1.DataType.INTEGER || type === types_1.DataType.FLOAT);
        return numericColumns.map(({ header, idx }) => {
            const range = this.customRanges[header] || this.inferReasonableRange(header);
            const violations = this.findRangeViolations(idx, range);
            return {
                columnName: header,
                expectedRange: this.formatRange(range),
                violationsCount: violations.length,
                outliers: violations.slice(0, 10), // Limit examples
            };
        });
    }
    analyzePatternConformance() {
        const patternColumns = [];
        this.headers.forEach((columnName, colIdx) => {
            let pattern;
            let patternName;
            // Check custom patterns first
            if (this.customPatterns[columnName]) {
                pattern = this.customPatterns[columnName];
                patternName = 'Custom Pattern';
            }
            else {
                // Infer pattern based on column name and content
                const inference = this.inferPattern(columnName, colIdx);
                if (inference) {
                    pattern = inference.pattern;
                    patternName = inference.name;
                }
            }
            if (pattern && patternName) {
                const violations = this.findPatternViolations(colIdx, pattern);
                patternColumns.push({
                    columnName,
                    expectedPattern: patternName,
                    violationsCount: violations.length,
                    examples: violations.slice(0, 5),
                });
            }
        });
        return patternColumns;
    }
    validateBusinessRules() {
        return this.businessRules.map((rule) => {
            const violations = this.evaluateBusinessRule(rule);
            return {
                ...rule,
                violations: violations.count,
                averageDiscrepancy: violations.averageDiscrepancy,
                examples: violations.examples.slice(0, 5),
            };
        });
    }
    analyzeFileStructure() {
        // Check column count consistency
        const columnCounts = this.data.map((row) => row?.length || 0);
        const modalColumnCount = this.getMostFrequent(columnCounts);
        const deviatingRows = columnCounts.filter((count) => count !== modalColumnCount).length;
        // Header conformance (simplified check)
        const headerConformance = this.headers.length === this.columnCount;
        return {
            consistentColumnCount: deviatingRows === 0,
            headerConformance,
            deviatingRows: deviatingRows > 0 ? deviatingRows : undefined,
        };
    }
    inferActualType(colIdx) {
        const typeCounts = {};
        let validValues = 0;
        for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
            const value = this.data[rowIdx]?.[colIdx];
            if (this.isValidValue(value)) {
                validValues++;
                const inferredType = this.inferValueType(value);
                typeCounts[inferredType] = (typeCounts[inferredType] || 0) + 1;
            }
        }
        if (validValues === 0) {
            return { type: types_1.DataType.UNKNOWN, confidence: 0 };
        }
        // Find most common type
        const dominantType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
        const confidence = (dominantType[1] / validValues) * 100;
        return {
            type: dominantType[0],
            confidence: Math.round(confidence),
        };
    }
    checkTypeConformance(colIdx, expectedType) {
        const nonConformingExamples = [];
        let nonConformingCount = 0;
        let validValueCount = 0;
        for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
            const value = this.data[rowIdx]?.[colIdx];
            if (this.isValidValue(value)) {
                validValueCount++;
                const actualType = this.inferValueType(value);
                if (actualType !== expectedType && !this.isCompatibleType(actualType, expectedType)) {
                    nonConformingCount++;
                    if (nonConformingExamples.length < 5) {
                        nonConformingExamples.push(String(value));
                    }
                }
            }
        }
        const conformancePercentage = validValueCount > 0 ? ((validValueCount - nonConformingCount) / validValueCount) * 100 : 0;
        return {
            nonConformingCount,
            conformancePercentage,
            examples: nonConformingExamples,
        };
    }
    inferValueType(value) {
        const trimmed = value.trim();
        // Boolean check
        if (['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(trimmed.toLowerCase())) {
            return types_1.DataType.BOOLEAN;
        }
        // Number checks
        if (/^-?\d+$/.test(trimmed)) {
            return types_1.DataType.INTEGER;
        }
        if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed)) {
            return types_1.DataType.FLOAT;
        }
        // Date checks
        if (this.looksLikeDate(trimmed)) {
            return this.looksLikeDateTime(trimmed) ? types_1.DataType.DATETIME : types_1.DataType.DATE;
        }
        return types_1.DataType.STRING;
    }
    looksLikeDate(value) {
        return (ValidityAnalyzer.DATE_PATTERNS.some((pattern) => pattern.test(value)) ||
            !isNaN(Date.parse(value)));
    }
    looksLikeDateTime(value) {
        return value.includes(':') || value.toLowerCase().includes('t');
    }
    isCompatibleType(actual, expected) {
        // Define compatibility rules - include CSV type conversion scenarios
        const compatibilityMap = {
            [types_1.DataType.NUMBER]: [types_1.DataType.INTEGER, types_1.DataType.FLOAT, types_1.DataType.STRING],
            [types_1.DataType.INTEGER]: [types_1.DataType.NUMBER, types_1.DataType.FLOAT, types_1.DataType.STRING],
            [types_1.DataType.FLOAT]: [types_1.DataType.NUMBER, types_1.DataType.INTEGER, types_1.DataType.STRING],
            // CSV files initially parse as STRING, so detecting proper types is good conformance
            [types_1.DataType.STRING]: [
                types_1.DataType.NUMBER,
                types_1.DataType.INTEGER,
                types_1.DataType.FLOAT,
                types_1.DataType.DATE,
                types_1.DataType.BOOLEAN,
            ],
        };
        return compatibilityMap[expected]?.includes(actual) || false;
    }
    suggestConversionStrategy(expected, _actual, conformanceResults) {
        if (conformanceResults.conformancePercentage > 95) {
            return 'No conversion needed - high conformance';
        }
        if (conformanceResults.conformancePercentage < 50) {
            return 'Manual review recommended - low conformance rate';
        }
        switch (expected) {
            case types_1.DataType.NUMBER:
            case types_1.DataType.INTEGER:
            case types_1.DataType.FLOAT:
                return 'Attempt numeric conversion, flag non-convertible values';
            case types_1.DataType.DATE:
            case types_1.DataType.DATETIME:
                return 'Parse with multiple date formats, standardise to ISO 8601';
            case types_1.DataType.BOOLEAN:
                return 'Map common boolean representations (Yes/No, 1/0, True/False)';
            default:
                return 'Convert to string with validation';
        }
    }
    inferReasonableRange(columnName) {
        const lower = columnName.toLowerCase();
        // Age-related columns
        if (lower.includes('age')) {
            return { min: 0, max: 120 };
        }
        // Percentage columns
        if (lower.includes('percent') || lower.includes('rate') || lower.includes('%')) {
            return { min: 0, max: 100 };
        }
        // Price/amount columns
        if (lower.includes('price') || lower.includes('amount') || lower.includes('cost')) {
            return { min: 0 }; // No upper limit for prices
        }
        // Year columns
        if (lower.includes('year')) {
            return { min: 1900, max: new Date().getFullYear() + 10 };
        }
        // Rating columns
        if (lower.includes('rating') || lower.includes('score')) {
            return { min: 0, max: 10 }; // Assuming 0-10 scale
        }
        return {}; // No range constraints
    }
    findRangeViolations(colIdx, range) {
        const violations = [];
        for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
            const value = this.data[rowIdx]?.[colIdx];
            if (this.isValidValue(value)) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    const violatesMin = range.min !== undefined && numValue < range.min;
                    const violatesMax = range.max !== undefined && numValue > range.max;
                    if (violatesMin || violatesMax) {
                        violations.push({ value: numValue, rowIndex: rowIdx });
                    }
                }
            }
        }
        return violations;
    }
    inferPattern(columnName, colIdx) {
        const lower = columnName.toLowerCase();
        // Email patterns
        if (lower.includes('email') || lower.includes('mail')) {
            return { pattern: ValidityAnalyzer.EMAIL_PATTERN.source, name: 'Email Format' };
        }
        // Phone patterns
        if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) {
            return { pattern: ValidityAnalyzer.PHONE_PATTERN.source, name: 'Phone Number Format' };
        }
        // URL patterns
        if (lower.includes('url') || lower.includes('website') || lower.includes('link')) {
            return { pattern: ValidityAnalyzer.URL_PATTERN.source, name: 'URL Format' };
        }
        // Sample values to infer pattern
        const sampleValues = this.getSampleValues(colIdx, 50);
        // Check if all values follow a consistent pattern
        if (sampleValues.length > 10) {
            const patterns = this.detectCommonPatterns(sampleValues);
            if (patterns.length > 0) {
                return { pattern: patterns[0].pattern, name: patterns[0].name };
            }
        }
        return null;
    }
    getSampleValues(colIdx, maxSamples) {
        const values = [];
        const step = Math.max(1, Math.floor(this.rowCount / maxSamples));
        for (let rowIdx = 0; rowIdx < this.rowCount && values.length < maxSamples; rowIdx += step) {
            const value = this.data[rowIdx]?.[colIdx];
            if (this.isValidValue(value)) {
                values.push(value.trim());
            }
        }
        return values;
    }
    detectCommonPatterns(values) {
        const patterns = [];
        // Check for consistent length and character patterns
        const lengths = values.map((v) => v.length);
        const uniqueLengths = [...new Set(lengths)];
        if (uniqueLengths.length === 1 && uniqueLengths[0] > 5) {
            // All values have same length - might be a code pattern
            const firstValue = values[0];
            let pattern = '';
            for (let i = 0; i < firstValue.length; i++) {
                const char = firstValue[i];
                if (/\d/.test(char)) {
                    pattern += '\\d';
                }
                else if (/[a-zA-Z]/.test(char)) {
                    pattern += '[a-zA-Z]';
                }
                else {
                    pattern += '\\' + char; // Escape special characters
                }
            }
            if (pattern.length > 0) {
                patterns.push({ pattern: `^${pattern}$`, name: 'Fixed Format Code' });
            }
        }
        return patterns;
    }
    findPatternViolations(colIdx, pattern) {
        const violations = [];
        const regex = new RegExp(pattern);
        for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
            const value = this.data[rowIdx]?.[colIdx];
            if (this.isValidValue(value) && !regex.test(value.trim())) {
                if (violations.length < 10) {
                    violations.push(value.trim());
                }
            }
        }
        return violations;
    }
    evaluateBusinessRule(rule) {
        // This is a simplified implementation
        // In practice, business rules would need a more sophisticated parser
        const violations = [];
        const totalDiscrepancy = 0;
        // Example: Check if a calculation rule like "Total = Quantity * Price"
        if (rule.description.includes('EQUAL') && rule.description.includes('*')) {
            // Extract column names (simplified parsing)
            // Implementation would need proper rule parsing
        }
        // For now, return empty result
        return {
            count: violations.length,
            averageDiscrepancy: violations.length > 0 ? totalDiscrepancy / violations.length : undefined,
            examples: violations,
        };
    }
    calculateValidityScore(typeConformance, rangeConformance, patternConformance, businessRules) {
        let score = 100;
        // Type conformance penalty
        const avgTypeConformance = typeConformance.reduce((sum, tc) => sum + tc.conformancePercentage, 0) /
            typeConformance.length;
        score -= (100 - avgTypeConformance) * 0.4; // 40% weight
        // Range violations penalty
        const totalRangeViolations = rangeConformance.reduce((sum, rc) => sum + rc.violationsCount, 0);
        const rangeViolationRate = (totalRangeViolations / this.rowCount) * 100;
        score -= Math.min(20, rangeViolationRate); // Max 20 points off
        // Pattern violations penalty
        const totalPatternViolations = patternConformance.reduce((sum, pc) => sum + pc.violationsCount, 0);
        const patternViolationRate = (totalPatternViolations / this.rowCount) * 100;
        score -= Math.min(15, patternViolationRate); // Max 15 points off
        // Business rule violations penalty
        const totalBusinessRuleViolations = businessRules.reduce((sum, br) => sum + br.violations, 0);
        const businessRuleViolationRate = (totalBusinessRuleViolations / this.rowCount) * 100;
        score -= Math.min(25, businessRuleViolationRate * 2); // Max 25 points off
        score = Math.max(0, score);
        let interpretation;
        if (score >= 95)
            interpretation = 'Excellent';
        else if (score >= 85)
            interpretation = 'Good';
        else if (score >= 70)
            interpretation = 'Fair';
        else if (score >= 50)
            interpretation = 'Needs Improvement';
        else
            interpretation = 'Poor';
        return {
            score: Math.round(score * 100) / 100,
            interpretation,
            details: `${avgTypeConformance.toFixed(1)}% average type conformance, ${totalRangeViolations + totalPatternViolations + totalBusinessRuleViolations} total violations`,
        };
    }
    formatDataType(type) {
        switch (type) {
            case types_1.DataType.STRING:
                return 'String';
            case types_1.DataType.NUMBER:
                return 'Number';
            case types_1.DataType.INTEGER:
                return 'Integer';
            case types_1.DataType.FLOAT:
                return 'Float';
            case types_1.DataType.DATE:
                return 'Date';
            case types_1.DataType.DATETIME:
                return 'DateTime';
            case types_1.DataType.BOOLEAN:
                return 'Boolean';
            default:
                return 'Unknown';
        }
    }
    formatRange(range) {
        if (range.min !== undefined && range.max !== undefined) {
            return `${range.min} to ${range.max}`;
        }
        else if (range.min !== undefined) {
            return `>= ${range.min}`;
        }
        else if (range.max !== undefined) {
            return `<= ${range.max}`;
        }
        return 'No range constraint';
    }
    isValidValue(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }
    getMostFrequent(array) {
        const counts = new Map();
        for (const item of array) {
            counts.set(item, (counts.get(item) || 0) + 1);
        }
        let maxCount = 0;
        let mostFrequent = array[0];
        for (const [item, count] of counts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = item;
            }
        }
        return mostFrequent;
    }
}
exports.ValidityAnalyzer = ValidityAnalyzer;
//# sourceMappingURL=validity-analyzer.js.map