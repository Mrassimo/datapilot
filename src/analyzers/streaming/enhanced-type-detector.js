"use strict";
/**
 * Enhanced Column Type Detection System
 * Sophisticated type inference for EDA analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedTypeDetector = void 0;
const types_1 = require("../eda/types");
/**
 * Enhanced Type Detector for sophisticated column type inference
 */
class EnhancedTypeDetector {
    static EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    static URL_PATTERN = /^https?:\/\/[^\s]+$/;
    // Date patterns (various formats)
    static DATE_PATTERNS = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO DateTime
        /^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}/, // MM/DD/YYYY HH:MM
    ];
    // Boolean patterns
    static BOOLEAN_PATTERNS = [
        /^(true|false)$/i,
        /^(yes|no)$/i,
        /^(y|n)$/i,
        /^(1|0)$/,
        /^(on|off)$/i,
        /^(enabled|disabled)$/i,
        /^(active|inactive)$/i,
    ];
    // Currency patterns
    static CURRENCY_PATTERNS = [
        /^\$[\d,]+\.?\d*$/, // $1,234.56
        /^[\d,]+\.?\d*\s*(USD|EUR|GBP|CAD|AUD)$/i, // 1234.56 USD
        /^(USD|EUR|GBP|CAD|AUD)\s*[\d,]+\.?\d*$/i, // USD 1234.56
    ];
    // Percentage pattern
    static PERCENTAGE_PATTERN = /^[\d.]+%$/;
    /**
     * Detect column types from sample data
     */
    static detectColumnTypes(samples) {
        return samples.map((sample) => this.detectSingleColumnType(sample));
    }
    /**
     * Detect type for a single column
     */
    static detectSingleColumnType(sample) {
        const { values, columnName } = sample;
        // Filter out null/undefined/empty values for analysis
        const validValues = values
            .filter((v) => v !== null && v !== undefined && v !== '')
            .map((v) => String(v).trim());
        if (validValues.length === 0) {
            return {
                dataType: types_1.EdaDataType.TEXT_GENERAL,
                semanticType: types_1.SemanticType.UNKNOWN,
                confidence: 0,
                reasons: ['No valid values found'],
            };
        }
        // Run detection tests in order of specificity
        // Numerical comes early to prevent numbers being detected as dates
        const detectionTests = [
            () => this.testNumerical(validValues, columnName), // Move numerical first
            () => this.testBoolean(validValues, columnName),
            () => this.testCurrency(validValues, columnName),
            () => this.testPercentage(validValues, columnName),
            () => this.testEmail(validValues, columnName),
            () => this.testURL(validValues, columnName),
            () => this.testDateTime(validValues, columnName), // Move datetime after numerical
            () => this.testCategorical(validValues, columnName),
            () => this.testText(validValues, columnName),
        ];
        // Run tests and find the best match
        let bestResult = {
            dataType: types_1.EdaDataType.TEXT_GENERAL,
            semanticType: types_1.SemanticType.UNKNOWN,
            confidence: 0,
            reasons: ['Default fallback'],
        };
        for (const test of detectionTests) {
            const result = test();
            if (result && result.confidence > bestResult.confidence) {
                bestResult = result;
            }
        }
        return bestResult;
    }
    /**
     * Test for DateTime columns
     */
    static testDateTime(values, columnName) {
        let dateCount = 0;
        const reasons = [];
        // Skip obvious non-date columns to prevent misclassification
        const nonDateNames = ['gender', 'sex', 'type', 'category', 'status', 'class', 'group'];
        if (nonDateNames.some((name) => columnName.toLowerCase().includes(name))) {
            return null;
        }
        // Check for obvious categorical values that shouldn't be dates
        const uniqueValues = new Set(values);
        const commonCategorical = [
            'male',
            'female',
            'yes',
            'no',
            'true',
            'false',
            'good',
            'bad',
            'poor',
            'excellent',
        ];
        const hasCategoricalValues = Array.from(uniqueValues).some((val) => commonCategorical.includes(val.toLowerCase()));
        if (hasCategoricalValues && uniqueValues.size <= 10) {
            return null;
        }
        // Check column name hints - be more specific about date columns
        const nameHints = [
            'date',
            'time',
            'timestamp',
            'created',
            'updated',
            'modified',
            'birth',
            'expir',
        ];
        const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));
        // If column name doesn't suggest dates and has numeric name, probably not a date
        const numericNameHints = [
            'age',
            'rate',
            'pressure',
            'sugar',
            'weight',
            'height',
            'score',
            'count',
            'amount',
            'price',
            'salary',
        ];
        const nameHasNumericHint = numericNameHints.some((hint) => columnName.toLowerCase().includes(hint));
        if (nameHasNumericHint && !nameHasHint) {
            return null; // Don't even try date detection for clearly numeric columns
        }
        if (nameHasHint) {
            reasons.push('Column name suggests datetime');
        }
        // Test values against date patterns - be more restrictive
        for (const value of values.slice(0, 100)) {
            // Sample first 100
            if (this.isDateLike(value)) {
                dateCount++;
            }
        }
        const dateRatio = dateCount / Math.min(values.length, 100);
        // Require higher confidence for date detection, especially without name hints
        const requiredRatio = nameHasHint ? 0.7 : 0.9;
        if (dateRatio >= requiredRatio) {
            reasons.push(`${Math.round(dateRatio * 100)}% of values match date patterns`);
            return {
                dataType: types_1.EdaDataType.DATE_TIME,
                semanticType: this.inferDateSemanticType(columnName),
                confidence: Math.min(0.95, 0.5 + dateRatio * 0.3 + (nameHasHint ? 0.15 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Boolean columns
     */
    static testBoolean(values, _columnName) {
        let booleanCount = 0;
        const uniqueValues = new Set(values.map((v) => v.toLowerCase()));
        const reasons = [];
        // Check for common boolean patterns
        for (const value of values.slice(0, 100)) {
            if (this.isBooleanLike(value)) {
                booleanCount++;
            }
        }
        const booleanRatio = booleanCount / Math.min(values.length, 100);
        // Additional checks
        if (uniqueValues.size <= 3 && booleanRatio >= 0.9) {
            reasons.push(`Only ${uniqueValues.size} unique values, ${Math.round(booleanRatio * 100)}% match boolean patterns`);
            reasons.push(`Unique values: ${Array.from(uniqueValues).join(', ')}`);
            return {
                dataType: types_1.EdaDataType.BOOLEAN,
                semanticType: types_1.SemanticType.STATUS,
                confidence: Math.min(0.95, 0.7 + booleanRatio * 0.25),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Currency columns
     */
    static testCurrency(values, columnName) {
        let currencyCount = 0;
        const reasons = [];
        // Check column name hints
        const nameHints = ['price', 'cost', 'amount', 'salary', 'revenue', 'fee', 'charge'];
        const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));
        if (nameHasHint) {
            reasons.push('Column name suggests currency');
        }
        // Test values against currency patterns
        for (const value of values.slice(0, 100)) {
            if (this.isCurrencyLike(value)) {
                currencyCount++;
            }
        }
        const currencyRatio = currencyCount / Math.min(values.length, 100);
        if (currencyRatio >= 0.7) {
            reasons.push(`${Math.round(currencyRatio * 100)}% of values match currency patterns`);
            return {
                dataType: types_1.EdaDataType.NUMERICAL_FLOAT,
                semanticType: types_1.SemanticType.CURRENCY,
                confidence: Math.min(0.95, 0.5 + currencyRatio * 0.3 + (nameHasHint ? 0.15 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Percentage columns
     */
    static testPercentage(values, columnName) {
        let percentageCount = 0;
        const reasons = [];
        // Check column name hints
        const nameHints = ['percent', 'rate', 'ratio', '%'];
        const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));
        if (nameHasHint) {
            reasons.push('Column name suggests percentage');
        }
        // Test values against percentage pattern
        for (const value of values.slice(0, 100)) {
            if (this.PERCENTAGE_PATTERN.test(value)) {
                percentageCount++;
            }
        }
        const percentageRatio = percentageCount / Math.min(values.length, 100);
        if (percentageRatio >= 0.8) {
            reasons.push(`${Math.round(percentageRatio * 100)}% of values match percentage pattern`);
            return {
                dataType: types_1.EdaDataType.NUMERICAL_FLOAT,
                semanticType: types_1.SemanticType.PERCENTAGE,
                confidence: Math.min(0.95, 0.6 + percentageRatio * 0.25 + (nameHasHint ? 0.1 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Email columns
     */
    static testEmail(values, columnName) {
        let emailCount = 0;
        const reasons = [];
        // Check column name hints
        const nameHasHint = columnName.toLowerCase().includes('email') || columnName.toLowerCase().includes('mail');
        if (nameHasHint) {
            reasons.push('Column name suggests email');
        }
        // Test values against email pattern
        for (const value of values.slice(0, 100)) {
            if (this.EMAIL_PATTERN.test(value)) {
                emailCount++;
            }
        }
        const emailRatio = emailCount / Math.min(values.length, 100);
        if (emailRatio >= 0.9) {
            reasons.push(`${Math.round(emailRatio * 100)}% of values match email pattern`);
            return {
                dataType: types_1.EdaDataType.TEXT_ADDRESS,
                semanticType: types_1.SemanticType.IDENTIFIER,
                confidence: Math.min(0.98, 0.7 + emailRatio * 0.25 + (nameHasHint ? 0.03 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for URL columns
     */
    static testURL(values, columnName) {
        let urlCount = 0;
        const reasons = [];
        // Check column name hints
        const nameHasHint = columnName.toLowerCase().includes('url') ||
            columnName.toLowerCase().includes('link') ||
            columnName.toLowerCase().includes('website');
        if (nameHasHint) {
            reasons.push('Column name suggests URL');
        }
        // Test values against URL pattern
        for (const value of values.slice(0, 100)) {
            if (this.URL_PATTERN.test(value)) {
                urlCount++;
            }
        }
        const urlRatio = urlCount / Math.min(values.length, 100);
        if (urlRatio >= 0.8) {
            reasons.push(`${Math.round(urlRatio * 100)}% of values match URL pattern`);
            return {
                dataType: types_1.EdaDataType.TEXT_ADDRESS,
                semanticType: types_1.SemanticType.IDENTIFIER,
                confidence: Math.min(0.95, 0.6 + urlRatio * 0.3 + (nameHasHint ? 0.05 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Numerical columns
     */
    static testNumerical(values, columnName) {
        let numericCount = 0;
        let integerCount = 0;
        const reasons = [];
        // Enhanced column name hints including medical/scientific terms
        const nameHints = [
            'id',
            'count',
            'number',
            'quantity',
            'amount',
            'size',
            'length',
            'age',
            'rate',
            'pressure',
            'sugar',
            'weight',
            'height',
            'score',
            'price',
            'salary',
            'value',
            'level',
            'measurement',
        ];
        const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));
        if (nameHasHint) {
            reasons.push('Column name suggests numerical data');
        }
        // More robust numerical validation
        for (const value of values.slice(0, 100)) {
            const trimmedValue = String(value).trim();
            // Skip empty values
            if (!trimmedValue)
                continue;
            // Check if it's a pure number (no separators that could be dates)
            const isPlainNumber = /^-?\d*\.?\d+$/.test(trimmedValue);
            if (isPlainNumber) {
                const num = Number(trimmedValue);
                if (!isNaN(num) && isFinite(num)) {
                    numericCount++;
                    // More precise integer detection
                    if (Number.isInteger(num) && !trimmedValue.includes('.')) {
                        integerCount++;
                    }
                }
            }
        }
        const validSampleSize = Math.min(values.length, 100);
        const numericRatio = numericCount / validSampleSize;
        const integerRatio = numericCount > 0 ? integerCount / numericCount : 0;
        // Higher confidence for numerical detection, especially with name hints
        const threshold = nameHasHint ? 0.7 : 0.85;
        if (numericRatio >= threshold) {
            const isInteger = integerRatio >= 0.9;
            reasons.push(`${Math.round(numericRatio * 100)}% of values are numeric`);
            if (isInteger) {
                reasons.push(`${Math.round(integerRatio * 100)}% are integers`);
            }
            // Higher confidence scoring
            let confidence = 0.5 + numericRatio * 0.3;
            if (nameHasHint)
                confidence += 0.15;
            if (numericRatio >= 0.95)
                confidence += 0.05; // Bonus for very clean data
            return {
                dataType: isInteger ? types_1.EdaDataType.NUMERICAL_INTEGER : types_1.EdaDataType.NUMERICAL_FLOAT,
                semanticType: this.inferNumericalSemanticType(columnName),
                confidence: Math.min(0.95, confidence),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Categorical columns
     */
    static testCategorical(values, columnName) {
        const uniqueValues = new Set(values);
        const uniqueRatio = uniqueValues.size / values.length;
        const reasons = [];
        const valuesArray = Array.from(uniqueValues);
        // Check for specific demographic categories first (high priority)
        const genderValues = ['male', 'female', 'm', 'f', 'man', 'woman'];
        const educationValues = ['bachelor', 'master', 'phd', 'doctorate', 'high school', 'college'];
        const qualityValues = ['poor', 'fair', 'good', 'excellent', 'average'];
        // Check for gender column specifically
        if (columnName.toLowerCase().includes('gender') || columnName.toLowerCase().includes('sex')) {
            const isGenderLike = valuesArray.every((val) => genderValues.some((gv) => val.toLowerCase().includes(gv.toLowerCase())));
            if (isGenderLike) {
                reasons.push('Column name and values indicate gender/demographic data');
                return {
                    dataType: types_1.EdaDataType.CATEGORICAL,
                    semanticType: types_1.SemanticType.DEMOGRAPHIC,
                    confidence: 0.98,
                    reasons,
                };
            }
        }
        // Check column name hints
        const nameHints = [
            'category',
            'type',
            'class',
            'group',
            'status',
            'department',
            'gender',
            'education',
            'quality',
            'level',
        ];
        const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));
        if (nameHasHint) {
            reasons.push('Column name suggests categorical data');
        }
        // Categorical if low unique ratio and reasonable number of categories
        if (uniqueRatio <= 0.5 && uniqueValues.size >= 2 && uniqueValues.size <= 100) {
            reasons.push(`${uniqueValues.size} unique values (${Math.round(uniqueRatio * 100)}% of total)`);
            reasons.push('Low cardinality suggests categorical data');
            return {
                dataType: types_1.EdaDataType.CATEGORICAL,
                semanticType: this.inferCategoricalSemanticType(columnName),
                confidence: Math.min(0.85, 0.3 + (1 - uniqueRatio) * 0.4 + (nameHasHint ? 0.15 : 0)),
                reasons,
            };
        }
        return null;
    }
    /**
     * Test for Text columns (fallback)
     */
    static testText(values, _columnName) {
        const avgLength = values.reduce((sum, val) => sum + val.length, 0) / values.length;
        const reasons = [];
        reasons.push(`Average text length: ${Math.round(avgLength)} characters`);
        // Determine if it's general text or could be something else
        const semanticType = avgLength > 50 ? types_1.SemanticType.UNKNOWN : types_1.SemanticType.CATEGORY;
        return {
            dataType: types_1.EdaDataType.TEXT_GENERAL,
            semanticType,
            confidence: 0.3, // Low confidence fallback
            reasons,
        };
    }
    // Helper methods for pattern matching
    static isDateLike(value) {
        // First check explicit date patterns
        if (this.DATE_PATTERNS.some((pattern) => pattern.test(value))) {
            return true;
        }
        // Be much more restrictive with Date.parse
        // Only accept if it looks like a real date format and isn't just a number
        if (value.length < 4 || /^\d+$/.test(value)) {
            return false; // Don't accept pure numbers or very short strings
        }
        // Only accept Date.parse results if the string contains date-like separators
        if (!/[-\/\s:T]/.test(value)) {
            return false; // Must contain date/time separators
        }
        const parsed = Date.parse(value);
        if (isNaN(parsed)) {
            return false;
        }
        // Additional sanity check: parsed date should be between 1900 and 2100
        const year = new Date(parsed).getFullYear();
        return year >= 1900 && year <= 2100;
    }
    static isBooleanLike(value) {
        return this.BOOLEAN_PATTERNS.some((pattern) => pattern.test(value));
    }
    static isCurrencyLike(value) {
        return this.CURRENCY_PATTERNS.some((pattern) => pattern.test(value));
    }
    // Semantic type inference helpers
    static inferDateSemanticType(columnName) {
        const name = columnName.toLowerCase();
        if (name.includes('transaction') || name.includes('payment')) {
            return types_1.SemanticType.DATE_TRANSACTION;
        }
        return types_1.SemanticType.UNKNOWN;
    }
    static inferNumericalSemanticType(columnName) {
        const name = columnName.toLowerCase();
        // Add negative checks to avoid misclassification
        if (name.includes('percent') || name.includes('rate') || name.includes('%')) {
            return types_1.SemanticType.PERCENTAGE;
        }
        // More specific age detection to avoid words like "percentage", "average", "usage"
        if (name.includes('age') &&
            !name.includes('percent') &&
            !name.includes('average') &&
            !name.includes('usage') &&
            !name.includes('damage')) {
            return types_1.SemanticType.AGE;
        }
        if (name.includes('id'))
            return types_1.SemanticType.IDENTIFIER;
        if (name.includes('count') || name.includes('quantity'))
            return types_1.SemanticType.COUNT;
        if (name.includes('rating') || name.includes('score'))
            return types_1.SemanticType.RATING;
        return types_1.SemanticType.UNKNOWN;
    }
    static inferCategoricalSemanticType(columnName) {
        const name = columnName.toLowerCase();
        if (name.includes('department') || name.includes('unit'))
            return types_1.SemanticType.ORGANIZATIONAL_UNIT;
        if (name.includes('status') || name.includes('state'))
            return types_1.SemanticType.STATUS;
        return types_1.SemanticType.CATEGORY;
    }
}
exports.EnhancedTypeDetector = EnhancedTypeDetector;
//# sourceMappingURL=enhanced-type-detector.js.map