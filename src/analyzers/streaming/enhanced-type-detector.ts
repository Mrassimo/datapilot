/**
 * Enhanced Column Type Detection System
 * Sophisticated type inference for EDA analysis
 */

import { EdaDataType, SemanticType } from '../eda/types';

interface TypeDetectionResult {
  dataType: EdaDataType;
  semanticType: SemanticType;
  confidence: number; // 0-1
  reasons: string[];
}

interface ColumnSample {
  values: (string | number | null | undefined)[];
  columnName: string;
  columnIndex: number;
}

/**
 * Enhanced Type Detector for sophisticated column type inference
 */
export class EnhancedTypeDetector {
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly URL_PATTERN = /^https?:\/\/[^\s]+$/;

  // Date patterns (various formats)
  private static readonly DATE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO DateTime
    /^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}/, // MM/DD/YYYY HH:MM
  ];

  // Boolean patterns
  private static readonly BOOLEAN_PATTERNS = [
    /^(true|false)$/i,
    /^(yes|no)$/i,
    /^(y|n)$/i,
    /^(1|0)$/,
    /^(on|off)$/i,
    /^(enabled|disabled)$/i,
    /^(active|inactive)$/i,
  ];

  // Currency patterns
  private static readonly CURRENCY_PATTERNS = [
    /^\$[\d,]+\.?\d*$/, // $1,234.56
    /^[\d,]+\.?\d*\s*(USD|EUR|GBP|CAD|AUD)$/i, // 1234.56 USD
    /^(USD|EUR|GBP|CAD|AUD)\s*[\d,]+\.?\d*$/i, // USD 1234.56
  ];

  // Percentage pattern
  private static readonly PERCENTAGE_PATTERN = /^[\d.]+%$/;

  /**
   * Detect column types from sample data
   */
  static detectColumnTypes(samples: ColumnSample[]): TypeDetectionResult[] {
    return samples.map((sample) => this.detectSingleColumnType(sample));
  }

  /**
   * Detect type for a single column
   */
  private static detectSingleColumnType(sample: ColumnSample): TypeDetectionResult {
    const { values, columnName } = sample;

    // Filter out null/undefined/empty values for analysis
    const validValues = values
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map((v) => String(v).trim());

    if (validValues.length === 0) {
      return {
        dataType: EdaDataType.TEXT_GENERAL,
        semanticType: SemanticType.UNKNOWN,
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
    let bestResult: TypeDetectionResult = {
      dataType: EdaDataType.TEXT_GENERAL,
      semanticType: SemanticType.UNKNOWN,
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
  private static testDateTime(values: string[], columnName: string): TypeDetectionResult | null {
    let dateCount = 0;
    const reasons: string[] = [];

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
    const nameHasNumericHint = numericNameHints.some((hint) =>
      columnName.toLowerCase().includes(hint),
    );

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
        dataType: EdaDataType.DATE_TIME,
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
  private static testBoolean(values: string[], _columnName: string): TypeDetectionResult | null {
    let booleanCount = 0;
    const uniqueValues = new Set(values.map((v) => v.toLowerCase()));
    const reasons: string[] = [];

    // Check for common boolean patterns
    for (const value of values.slice(0, 100)) {
      if (this.isBooleanLike(value)) {
        booleanCount++;
      }
    }

    const booleanRatio = booleanCount / Math.min(values.length, 100);

    // Additional checks
    if (uniqueValues.size <= 3 && booleanRatio >= 0.9) {
      reasons.push(
        `Only ${uniqueValues.size} unique values, ${Math.round(booleanRatio * 100)}% match boolean patterns`,
      );
      reasons.push(`Unique values: ${Array.from(uniqueValues).join(', ')}`);

      return {
        dataType: EdaDataType.BOOLEAN,
        semanticType: SemanticType.STATUS,
        confidence: Math.min(0.95, 0.7 + booleanRatio * 0.25),
        reasons,
      };
    }

    return null;
  }

  /**
   * Test for Currency columns
   */
  private static testCurrency(values: string[], columnName: string): TypeDetectionResult | null {
    let currencyCount = 0;
    const reasons: string[] = [];

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
        dataType: EdaDataType.NUMERICAL_FLOAT,
        semanticType: SemanticType.CURRENCY,
        confidence: Math.min(0.95, 0.5 + currencyRatio * 0.3 + (nameHasHint ? 0.15 : 0)),
        reasons,
      };
    }

    return null;
  }

  /**
   * Test for Percentage columns
   */
  private static testPercentage(values: string[], columnName: string): TypeDetectionResult | null {
    let percentageCount = 0;
    const reasons: string[] = [];

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
        dataType: EdaDataType.NUMERICAL_FLOAT,
        semanticType: SemanticType.PERCENTAGE,
        confidence: Math.min(0.95, 0.6 + percentageRatio * 0.25 + (nameHasHint ? 0.1 : 0)),
        reasons,
      };
    }

    return null;
  }

  /**
   * Test for Email columns
   */
  private static testEmail(values: string[], columnName: string): TypeDetectionResult | null {
    let emailCount = 0;
    const reasons: string[] = [];

    // Check column name hints
    const nameHasHint =
      columnName.toLowerCase().includes('email') || columnName.toLowerCase().includes('mail');

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
        dataType: EdaDataType.TEXT_ADDRESS,
        semanticType: SemanticType.IDENTIFIER,
        confidence: Math.min(0.98, 0.7 + emailRatio * 0.25 + (nameHasHint ? 0.03 : 0)),
        reasons,
      };
    }

    return null;
  }

  /**
   * Test for URL columns
   */
  private static testURL(values: string[], columnName: string): TypeDetectionResult | null {
    let urlCount = 0;
    const reasons: string[] = [];

    // Check column name hints
    const nameHasHint =
      columnName.toLowerCase().includes('url') ||
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
        dataType: EdaDataType.TEXT_ADDRESS,
        semanticType: SemanticType.IDENTIFIER,
        confidence: Math.min(0.95, 0.6 + urlRatio * 0.3 + (nameHasHint ? 0.05 : 0)),
        reasons,
      };
    }

    return null;
  }

  /**
   * Test for Numerical columns
   */
  private static testNumerical(values: string[], columnName: string): TypeDetectionResult | null {
    let numericCount = 0;
    let integerCount = 0;
    const reasons: string[] = [];

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
      if (!trimmedValue) continue;

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
      if (nameHasHint) confidence += 0.15;
      if (numericRatio >= 0.95) confidence += 0.05; // Bonus for very clean data

      return {
        dataType: isInteger ? EdaDataType.NUMERICAL_INTEGER : EdaDataType.NUMERICAL_FLOAT,
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
  private static testCategorical(values: string[], columnName: string): TypeDetectionResult | null {
    const uniqueValues = new Set(values);
    const uniqueRatio = uniqueValues.size / values.length;
    const reasons: string[] = [];

    // Check column name hints
    const nameHints = ['category', 'type', 'class', 'group', 'status', 'department'];
    const nameHasHint = nameHints.some((hint) => columnName.toLowerCase().includes(hint));

    if (nameHasHint) {
      reasons.push('Column name suggests categorical data');
    }

    // Categorical if low unique ratio and reasonable number of categories
    if (uniqueRatio <= 0.5 && uniqueValues.size >= 2 && uniqueValues.size <= 100) {
      reasons.push(
        `${uniqueValues.size} unique values (${Math.round(uniqueRatio * 100)}% of total)`,
      );
      reasons.push('Low cardinality suggests categorical data');

      return {
        dataType: EdaDataType.CATEGORICAL,
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
  private static testText(values: string[], _columnName: string): TypeDetectionResult | null {
    const avgLength = values.reduce((sum, val) => sum + val.length, 0) / values.length;
    const reasons: string[] = [];

    reasons.push(`Average text length: ${Math.round(avgLength)} characters`);

    // Determine if it's general text or could be something else
    const semanticType = avgLength > 50 ? SemanticType.UNKNOWN : SemanticType.CATEGORY;

    return {
      dataType: EdaDataType.TEXT_GENERAL,
      semanticType,
      confidence: 0.3, // Low confidence fallback
      reasons,
    };
  }

  // Helper methods for pattern matching
  private static isDateLike(value: string): boolean {
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

  private static isBooleanLike(value: string): boolean {
    return this.BOOLEAN_PATTERNS.some((pattern) => pattern.test(value));
  }

  private static isCurrencyLike(value: string): boolean {
    return this.CURRENCY_PATTERNS.some((pattern) => pattern.test(value));
  }

  // Semantic type inference helpers
  private static inferDateSemanticType(columnName: string): SemanticType {
    const name = columnName.toLowerCase();
    if (name.includes('transaction') || name.includes('payment')) {
      return SemanticType.DATE_TRANSACTION;
    }
    return SemanticType.UNKNOWN;
  }

  private static inferNumericalSemanticType(columnName: string): SemanticType {
    const name = columnName.toLowerCase();
    if (name.includes('age')) return SemanticType.AGE;
    if (name.includes('id')) return SemanticType.IDENTIFIER;
    if (name.includes('count') || name.includes('quantity')) return SemanticType.COUNT;
    if (name.includes('rating') || name.includes('score')) return SemanticType.RATING;
    return SemanticType.UNKNOWN;
  }

  private static inferCategoricalSemanticType(columnName: string): SemanticType {
    const name = columnName.toLowerCase();
    if (name.includes('department') || name.includes('unit'))
      return SemanticType.ORGANIZATIONAL_UNIT;
    if (name.includes('status') || name.includes('state')) return SemanticType.STATUS;
    return SemanticType.CATEGORY;
  }
}
