/**
 * Pattern Validation Engine
 * Implements format validation, regex patterns, and standardization checks
 */

import type { PatternValidation, FormatConsistency } from './types';

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  columnPattern: RegExp; // Pattern to match column names
  valuePattern: RegExp; // Pattern that values should match
  severity: 'critical' | 'high' | 'medium' | 'low';
  examples: string[];
  enabled: boolean;
}

export interface FormatStandardization {
  columnName: string;
  inconsistencies: Array<{
    value: string;
    frequency: number;
    suggestedStandardization?: string;
  }>;
  recommendedFormat: string;
  description: string;
}

export interface PatternValidationConfig {
  enableBuiltInPatterns: boolean;
  customPatterns?: PatternRule[];
  maxViolationsPerPattern: number;
  enableFormatStandardization: boolean;
}

export class PatternValidationEngine {
  private config: PatternValidationConfig;
  private patterns: PatternRule[] = [];
  private violations: Array<{
    patternId: string;
    columnName: string;
    value: string;
    rowIndex: number;
    issue: string;
  }> = [];

  constructor(
    private data: (string | null | undefined)[][],
    private headers: string[],
    config: Partial<PatternValidationConfig> = {}
  ) {
    this.config = {
      enableBuiltInPatterns: true,
      maxViolationsPerPattern: 100,
      enableFormatStandardization: true,
      ...config,
    };

    this.initializePatterns();
  }

  public validatePatterns(): {
    patternValidations: PatternValidation[];
    formatConsistency: FormatConsistency[];
    totalViolations: number;
  } {
    this.violations = [];

    // Validate patterns
    for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
      const columnName = this.headers[colIndex];
      const applicablePatterns = this.patterns.filter(p => 
        p.enabled && p.columnPattern.test(columnName)
      );

      for (const pattern of applicablePatterns) {
        this.validateColumnPattern(colIndex, columnName, pattern);
      }
    }

    // Analyze format consistency
    const formatConsistency = this.config.enableFormatStandardization 
      ? this.analyzeFormatConsistency() 
      : [];

    return {
      patternValidations: this.generatePatternReport(),
      formatConsistency,
      totalViolations: this.violations.length,
    };
  }

  private initializePatterns(): void {
    if (!this.config.enableBuiltInPatterns) {
      return;
    }

    // Email validation
    this.patterns.push({
      id: 'email_format',
      name: 'Email Format Validation',
      description: 'Email addresses should follow standard email format',
      columnPattern: /(email|e-mail|mail)/i,
      valuePattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      severity: 'high',
      examples: ['user@example.com', 'john.doe+newsletter@company.co.uk'],
      enabled: true,
    });

    // Phone number validation (North American)
    this.patterns.push({
      id: 'phone_nanp',
      name: 'North American Phone Number',
      description: 'Phone numbers should follow NANP format',
      columnPattern: /(phone|tel|mobile|cell)/i,
      valuePattern: /^(\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}$/,
      severity: 'medium',
      examples: ['(555) 123-4567', '+1-555-123-4567', '555.123.4567'],
      enabled: true,
    });

    // SSN validation (US)
    this.patterns.push({
      id: 'ssn_us',
      name: 'US Social Security Number',
      description: 'SSN should follow XXX-XX-XXXX format',
      columnPattern: /(ssn|social.*security|tax.*id)/i,
      valuePattern: /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/,
      severity: 'critical',
      examples: ['123-45-6789'],
      enabled: true,
    });

    // Credit card validation (basic Luhn check would be ideal)
    this.patterns.push({
      id: 'credit_card',
      name: 'Credit Card Number',
      description: 'Credit card numbers should be 13-19 digits',
      columnPattern: /(card|credit|payment)/i,
      valuePattern: /^\d{13,19}$/,
      severity: 'critical',
      examples: ['4532123456789012'],
      enabled: true,
    });

    // URL validation
    this.patterns.push({
      id: 'url_format',
      name: 'URL Format Validation',
      description: 'URLs should follow standard HTTP/HTTPS format',
      columnPattern: /(url|website|link|homepage)/i,
      valuePattern: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
      severity: 'medium',
      examples: ['https://example.com', 'http://subdomain.example.com/path'],
      enabled: true,
    });

    // Date format validation (ISO 8601)
    this.patterns.push({
      id: 'date_iso8601',
      name: 'ISO 8601 Date Format',
      description: 'Dates should follow ISO 8601 format (YYYY-MM-DD)',
      columnPattern: /(date|created|updated|birth|expir)/i,
      valuePattern: /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)?$/,
      severity: 'low',
      examples: ['2023-12-31', '2023-12-31T23:59:59Z'],
      enabled: true,
    });

    // Postal code validation (US ZIP)
    this.patterns.push({
      id: 'zip_us',
      name: 'US ZIP Code',
      description: 'US ZIP codes should be 5 digits or 5+4 format',
      columnPattern: /(zip|postal|postcode)/i,
      valuePattern: /^\d{5}(-\d{4})?$/,
      severity: 'medium',
      examples: ['12345', '12345-6789'],
      enabled: true,
    });

    // State code validation (US)
    this.patterns.push({
      id: 'state_us',
      name: 'US State Code',
      description: 'US state codes should be 2-letter abbreviations',
      columnPattern: /^state$/i,
      valuePattern: /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i,
      severity: 'medium',
      examples: ['CA', 'NY', 'TX'],
      enabled: true,
    });

    // UUID validation
    this.patterns.push({
      id: 'uuid_format',
      name: 'UUID Format',
      description: 'UUIDs should follow standard format',
      columnPattern: /(uuid|guid|id)/i,
      valuePattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      severity: 'medium',
      examples: ['123e4567-e89b-12d3-a456-426614174000'],
      enabled: true,
    });

    // Add custom patterns if provided
    if (this.config.customPatterns) {
      this.patterns.push(...this.config.customPatterns.filter(p => p.enabled));
    }
  }

  private validateColumnPattern(
    colIndex: number, 
    columnName: string, 
    pattern: PatternRule
  ): void {
    let violationCount = 0;
    
    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      if (violationCount >= this.config.maxViolationsPerPattern) {
        break;
      }

      const value = this.data[rowIndex]?.[colIndex];
      if (!value || typeof value !== 'string') {
        continue; // Skip null/empty values
      }

      const trimmedValue = value.trim();
      if (trimmedValue === '') {
        continue; // Skip empty strings
      }

      if (!pattern.valuePattern.test(trimmedValue)) {
        this.violations.push({
          patternId: pattern.id,
          columnName,
          value: trimmedValue,
          rowIndex,
          issue: `Value '${trimmedValue}' doesn't match ${pattern.name} pattern`,
        });
        violationCount++;
      }
    }
  }

  private analyzeFormatConsistency(): FormatConsistency[] {
    const formatAnalysis: FormatConsistency[] = [];

    for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
      const columnName = this.headers[colIndex];
      
      // Analyze date format consistency
      if (/(date|created|updated|birth|expir)/i.test(columnName)) {
        const dateFormats = this.analyzeColumnFormatConsistency(
          colIndex, 
          columnName,
          [
            { pattern: /^\d{4}-\d{2}-\d{2}/, name: 'ISO 8601 (YYYY-MM-DD)' },
            { pattern: /^\d{2}\/\d{2}\/\d{4}/, name: 'US Format (MM/DD/YYYY)' },
            { pattern: /^\d{2}\/\d{2}\/\d{2}/, name: 'Short US (MM/DD/YY)' },
            { pattern: /^\d{1,2}-\d{1,2}-\d{4}/, name: 'Dash Format (M-D-YYYY)' },
            { pattern: /^\w{3}\s+\d{1,2},?\s+\d{4}/, name: 'Text Format (Mon DD, YYYY)' },
          ]
        );
        if (dateFormats) formatAnalysis.push(dateFormats);
      }

      // Analyze phone format consistency
      if (/(phone|tel|mobile|cell)/i.test(columnName)) {
        const phoneFormats = this.analyzeColumnFormatConsistency(
          colIndex,
          columnName,
          [
            { pattern: /^\(\d{3}\)\s\d{3}-\d{4}/, name: '(XXX) XXX-XXXX' },
            { pattern: /^\d{3}-\d{3}-\d{4}/, name: 'XXX-XXX-XXXX' },
            { pattern: /^\d{3}\.\d{3}\.\d{4}/, name: 'XXX.XXX.XXXX' },
            { pattern: /^\+1\s\d{3}\s\d{3}\s\d{4}/, name: '+1 XXX XXX XXXX' },
            { pattern: /^\d{10}/, name: 'XXXXXXXXXX' },
          ]
        );
        if (phoneFormats) formatAnalysis.push(phoneFormats);
      }

      // Analyze boolean representation consistency
      if (/(is|has|can|should|enabled|active|valid)/i.test(columnName)) {
        const booleanFormats = this.analyzeColumnFormatConsistency(
          colIndex,
          columnName,
          [
            { pattern: /^(true|false)$/i, name: 'true/false' },
            { pattern: /^(yes|no)$/i, name: 'yes/no' },
            { pattern: /^(y|n)$/i, name: 'y/n' },
            { pattern: /^(1|0)$/, name: '1/0' },
            { pattern: /^(on|off)$/i, name: 'on/off' },
          ]
        );
        if (booleanFormats) formatAnalysis.push(booleanFormats);
      }

      // Analyze casing consistency for text fields
      if (/(name|title|city|company|description)/i.test(columnName)) {
        const casingConsistency = this.analyzeCasingConsistency(colIndex, columnName);
        if (casingConsistency) formatAnalysis.push(casingConsistency);
      }
    }

    return formatAnalysis;
  }

  private analyzeColumnFormatConsistency(
    colIndex: number,
    columnName: string,
    formats: Array<{ pattern: RegExp; name: string }>
  ): FormatConsistency | null {
    const formatCounts = new Map<string, number>();
    const examples = new Map<string, Set<string>>();
    let totalValues = 0;

    // Count format occurrences
    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      const value = this.data[rowIndex]?.[colIndex];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        continue;
      }

      totalValues++;
      const trimmedValue = value.trim();
      let formatFound = false;

      for (const format of formats) {
        if (format.pattern.test(trimmedValue)) {
          formatCounts.set(format.name, (formatCounts.get(format.name) || 0) + 1);
          
          if (!examples.has(format.name)) {
            examples.set(format.name, new Set());
          }
          if (examples.get(format.name)!.size < 3) {
            examples.get(format.name)!.add(trimmedValue);
          }
          
          formatFound = true;
          break;
        }
      }

      if (!formatFound) {
        const otherKey = 'Other/Unrecognized';
        formatCounts.set(otherKey, (formatCounts.get(otherKey) || 0) + 1);
        
        if (!examples.has(otherKey)) {
          examples.set(otherKey, new Set());
        }
        if (examples.get(otherKey)!.size < 3) {
          examples.get(otherKey)!.add(trimmedValue);
        }
      }
    }

    // Only report if there are multiple formats or issues
    if (formatCounts.size <= 1) {
      return null;
    }

    const formatArray = Array.from(formatCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([format, count]) => ({
        format,
        count,
        percentage: ((count / totalValues) * 100).toFixed(1),
        examples: Array.from(examples.get(format) || []),
      }));

    const dominantFormat = formatArray[0];
    const hasInconsistency = formatArray.length > 1 && dominantFormat.count < totalValues * 0.9;

    if (!hasInconsistency) {
      return null;
    }

    return {
      columnName,
      analysisType: 'format_standardization',
      currentFormats: formatArray,
      recommendedAction: `Standardize to ${dominantFormat.format} format`,
      consistency: {
        isConsistent: false,
        dominantFormat: dominantFormat.format,
        inconsistencyCount: totalValues - dominantFormat.count,
        inconsistencyPercentage: (((totalValues - dominantFormat.count) / totalValues) * 100).toFixed(1),
      },
      score: {
        score: Math.max(0, 100 - ((formatArray.length - 1) * 20)),
        interpretation: hasInconsistency ? 'Fair' : 'Good',
      },
    };
  }

  private analyzeCasingConsistency(colIndex: number, columnName: string): FormatConsistency | null {
    const casingPatterns = new Map<string, number>();
    const examples = new Map<string, Set<string>>();
    let totalValues = 0;

    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      const value = this.data[rowIndex]?.[colIndex];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        continue;
      }

      totalValues++;
      const trimmedValue = value.trim();
      
      let casingType = 'Mixed/Other';
      if (trimmedValue === trimmedValue.toLowerCase()) {
        casingType = 'lowercase';
      } else if (trimmedValue === trimmedValue.toUpperCase()) {
        casingType = 'UPPERCASE';
      } else if (trimmedValue === this.toTitleCase(trimmedValue)) {
        casingType = 'Title Case';
      } else if (trimmedValue === this.toPascalCase(trimmedValue)) {
        casingType = 'PascalCase';
      } else if (trimmedValue === this.toCamelCase(trimmedValue)) {
        casingType = 'camelCase';
      }

      casingPatterns.set(casingType, (casingPatterns.get(casingType) || 0) + 1);
      
      if (!examples.has(casingType)) {
        examples.set(casingType, new Set());
      }
      if (examples.get(casingType)!.size < 3) {
        examples.get(casingType)!.add(trimmedValue);
      }
    }

    if (casingPatterns.size <= 1) {
      return null;
    }

    const casingArray = Array.from(casingPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([casing, count]) => ({
        format: casing,
        count,
        percentage: ((count / totalValues) * 100).toFixed(1),
        examples: Array.from(examples.get(casing) || []),
      }));

    const dominantCasing = casingArray[0];
    const hasInconsistency = casingArray.length > 1 && dominantCasing.count < totalValues * 0.8;

    if (!hasInconsistency) {
      return null;
    }

    return {
      columnName,
      analysisType: 'casing_consistency',
      currentFormats: casingArray,
      recommendedAction: `Standardize to ${dominantCasing.format}`,
      consistency: {
        isConsistent: false,
        dominantFormat: dominantCasing.format,
        inconsistencyCount: totalValues - dominantCasing.count,
        inconsistencyPercentage: (((totalValues - dominantCasing.count) / totalValues) * 100).toFixed(1),
      },
      score: {
        score: Math.max(0, 100 - ((casingArray.length - 1) * 15)),
        interpretation: hasInconsistency ? 'Fair' : 'Good',
      },
    };
  }

  private generatePatternReport(): PatternValidation[] {
    const patternReport: PatternValidation[] = [];
    const violationsByPattern = new Map<string, typeof this.violations>();

    // Group violations by pattern
    for (const violation of this.violations) {
      if (!violationsByPattern.has(violation.patternId)) {
        violationsByPattern.set(violation.patternId, []);
      }
      violationsByPattern.get(violation.patternId)!.push(violation);
    }

    // Generate report for each pattern that had violations
    for (const [patternId, violations] of violationsByPattern) {
      const pattern = this.patterns.find(p => p.id === patternId);
      if (!pattern) continue;

      const affectedColumns = [...new Set(violations.map(v => v.columnName))];
      const examples = violations.slice(0, 5).map(v => v.value);

      patternReport.push({
        patternName: pattern.name,
        description: pattern.description,
        affectedColumns,
        violationCount: violations.length,
        examples,
        severity: pattern.severity,
        recommendedAction: `Update values to match ${pattern.name} pattern`,
      });
    }

    return patternReport;
  }

  // Helper methods for casing detection
  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
      word.toUpperCase()
    ).replace(/\s+/g, '');
  }

  private toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, '');
  }

  public getPatternSummary(): {
    totalPatternsEvaluated: number;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    mostProblematicColumns: Array<{columnName: string, violationCount: number}>;
  } {
    const violationsBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const columnViolations = new Map<string, number>();

    for (const violation of this.violations) {
      const pattern = this.patterns.find(p => p.id === violation.patternId);
      if (pattern) {
        violationsBySeverity[pattern.severity]++;
      }

      columnViolations.set(
        violation.columnName,
        (columnViolations.get(violation.columnName) || 0) + 1
      );
    }

    const mostProblematicColumns = Array.from(columnViolations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([columnName, violationCount]) => ({ columnName, violationCount }));

    return {
      totalPatternsEvaluated: this.patterns.length,
      totalViolations: this.violations.length,
      violationsBySeverity,
      mostProblematicColumns,
    };
  }
}