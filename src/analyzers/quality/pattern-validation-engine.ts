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
    config: Partial<PatternValidationConfig> = {},
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
      const applicablePatterns = this.patterns.filter(
        (p) => p.enabled && p.columnPattern.test(columnName),
      );

      for (const pattern of applicablePatterns) {
        this.validateColumnPattern(colIndex, columnName, pattern);
      }
    }

    // Analyze format consistency
    let formatConsistency: FormatConsistency[] = [];
    if (this.config.enableFormatStandardization) {
      formatConsistency = this.analyzeFormatConsistency();
      // Add unit standardization analysis
      formatConsistency.push(...this.addUnitStandardizationAnalysis());
    }

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
      valuePattern:
        /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
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
      valuePattern:
        /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i,
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

    // Additional enhanced patterns
    this.addInternationalPatterns();
    this.addBusinessPatterns();
    this.addSecurityPatterns();
    this.addEducationalPatterns();

    // Add custom patterns if provided
    if (this.config.customPatterns) {
      this.patterns.push(...this.config.customPatterns.filter((p) => p.enabled));
    }
  }

  /**
   * International format patterns
   */
  private addInternationalPatterns(): void {
    // International phone numbers (E.164 format)
    this.patterns.push({
      id: 'phone_international',
      name: 'International Phone Number (E.164)',
      description: 'International phone numbers should follow E.164 format',
      columnPattern: /(phone|tel|mobile|cell|contact)/i,
      valuePattern: /^\+[1-9]\d{1,14}$/,
      severity: 'medium',
      examples: ['+1234567890123', '+441234567890'],
      enabled: true,
    });

    // Canadian postal codes
    this.patterns.push({
      id: 'postal_canada',
      name: 'Canadian Postal Code',
      description: 'Canadian postal codes should follow A1A 1A1 format',
      columnPattern: /(postal|postcode|zip)/i,
      valuePattern: /^[A-Z]\d[A-Z][\s-]?\d[A-Z]\d$/i,
      severity: 'medium',
      examples: ['K1A 0A6', 'M5V-3A8'],
      enabled: true,
    });

    // UK postal codes
    this.patterns.push({
      id: 'postal_uk',
      name: 'UK Postal Code',
      description: 'UK postal codes should follow standard format',
      columnPattern: /(postal|postcode|zip)/i,
      valuePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
      severity: 'medium',
      examples: ['SW1A 1AA', 'M1 1AA', 'B33 8TH'],
      enabled: true,
    });

    // IBAN validation (basic structure)
    this.patterns.push({
      id: 'iban_format',
      name: 'International Bank Account Number (IBAN)',
      description: 'IBAN should follow international standard format',
      columnPattern: /(iban|bank.*account)/i,
      valuePattern: /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/i,
      severity: 'high',
      examples: ['GB82WEST12345698765432', 'DE89370400440532013000'],
      enabled: true,
    });

    // ISO country codes (2-letter)
    this.patterns.push({
      id: 'country_iso2',
      name: 'ISO 3166-1 Alpha-2 Country Code',
      description: 'Country codes should follow ISO 3166-1 alpha-2 standard',
      columnPattern: /(country.*code|ctry|nation.*code)/i,
      valuePattern: /^[A-Z]{2}$/,
      severity: 'medium',
      examples: ['US', 'GB', 'CA', 'DE'],
      enabled: true,
    });

    // ISO currency codes
    this.patterns.push({
      id: 'currency_iso',
      name: 'ISO 4217 Currency Code',
      description: 'Currency codes should follow ISO 4217 standard',
      columnPattern: /(currency|curr|money.*code)/i,
      valuePattern: /^[A-Z]{3}$/,
      severity: 'medium',
      examples: ['USD', 'EUR', 'GBP', 'CAD'],
      enabled: true,
    });
  }

  /**
   * Business domain patterns
   */
  private addBusinessPatterns(): void {
    // EIN (US Employer Identification Number)
    this.patterns.push({
      id: 'ein_us',
      name: 'US Employer Identification Number (EIN)',
      description: 'EIN should follow XX-XXXXXXX format',
      columnPattern: /(ein|tax.*id|employer.*id)/i,
      valuePattern: /^\d{2}-\d{7}$/,
      severity: 'high',
      examples: ['12-3456789'],
      enabled: true,
    });

    // Stock symbols (basic)
    this.patterns.push({
      id: 'stock_symbol',
      name: 'Stock Trading Symbol',
      description: 'Stock symbols should be 1-5 uppercase letters',
      columnPattern: /(symbol|ticker|stock)/i,
      valuePattern: /^[A-Z]{1,5}$/,
      severity: 'low',
      examples: ['AAPL', 'MSFT', 'GOOGL'],
      enabled: true,
    });

    // SKU patterns (flexible business format)
    this.patterns.push({
      id: 'sku_format',
      name: 'Stock Keeping Unit (SKU)',
      description: 'SKU should follow consistent alphanumeric format',
      columnPattern: /(sku|product.*code|item.*code)/i,
      valuePattern: /^[A-Z0-9]{3,20}(-[A-Z0-9]{1,10})*$/i,
      severity: 'medium',
      examples: ['ABC-123', 'PROD001-XL-BLU', 'SKU12345'],
      enabled: true,
    });

    // Invoice numbers
    this.patterns.push({
      id: 'invoice_number',
      name: 'Invoice Number Format',
      description: 'Invoice numbers should follow consistent format',
      columnPattern: /(invoice|bill|receipt)/i,
      valuePattern: /^(INV|BILL|RCP)[-]?\d{4,10}$/i,
      severity: 'low',
      examples: ['INV-123456', 'BILL0001234', 'RCP-456789'],
      enabled: true,
    });

    // Purchase order numbers
    this.patterns.push({
      id: 'po_number',
      name: 'Purchase Order Number',
      description: 'PO numbers should follow business format',
      columnPattern: /(po|purchase.*order|order.*number)/i,
      valuePattern: /^(PO|ORD)[-]?\d{4,12}$/i,
      severity: 'low',
      examples: ['PO-123456789', 'ORD001234567'],
      enabled: true,
    });
  }

  /**
   * Security and compliance patterns
   */
  private addSecurityPatterns(): void {
    // Password complexity (basic)
    this.patterns.push({
      id: 'password_complexity',
      name: 'Password Complexity',
      description: 'Passwords should meet basic complexity requirements',
      columnPattern: /(password|passwd|pwd)/i,
      valuePattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      severity: 'critical',
      examples: ['Password123!', 'MyS3cur3P@ss'],
      enabled: true,
    });

    // API keys (generic pattern)
    this.patterns.push({
      id: 'api_key_format',
      name: 'API Key Format',
      description: 'API keys should follow secure format standards',
      columnPattern: /(api.*key|access.*key|secret.*key)/i,
      valuePattern: /^[A-Za-z0-9_-]{20,128}$/,
      severity: 'critical',
      examples: ['sk_test_1234567890abcdef', 'pk_live_abcd1234567890ef'],
      enabled: true,
    });

    // JWT tokens (basic structure)
    this.patterns.push({
      id: 'jwt_token',
      name: 'JSON Web Token (JWT)',
      description: 'JWT tokens should have three base64 parts separated by dots',
      columnPattern: /(jwt|token|bearer)/i,
      valuePattern: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      severity: 'critical',
      examples: ['eyJhbGci.eyJzdWIi.SflKxwRJ'],
      enabled: true,
    });

    // Hash values (SHA-256, MD5, etc.)
    this.patterns.push({
      id: 'hash_format',
      name: 'Cryptographic Hash',
      description: 'Hash values should be valid hexadecimal strings',
      columnPattern: /(hash|checksum|digest|sha|md5)/i,
      valuePattern: /^[a-fA-F0-9]{32,128}$/,
      severity: 'medium',
      examples: ['d41d8cd98f00b204e9800998ecf8427e', '2cf24dba4f21d4288094e4b5c0d37b16'],
      enabled: true,
    });
  }

  /**
   * Educational domain patterns
   */
  private addEducationalPatterns(): void {
    // Student ID formats
    this.patterns.push({
      id: 'student_id',
      name: 'Student ID Format',
      description: 'Student IDs should follow institutional format',
      columnPattern: /(student.*id|matriculation|enrollment.*id)/i,
      valuePattern: /^(STU|ST)?\d{6,12}$/i,
      severity: 'medium',
      examples: ['STU1234567', '123456789', 'ST001234567'],
      enabled: true,
    });

    // Course codes
    this.patterns.push({
      id: 'course_code',
      name: 'Course Code Format',
      description: 'Course codes should follow academic format',
      columnPattern: /(course.*code|subject.*code|class.*code)/i,
      valuePattern: /^[A-Z]{2,4}\d{3,4}[A-Z]?$/i,
      severity: 'medium',
      examples: ['CS101', 'MATH2001', 'ENG1101A'],
      enabled: true,
    });

    // GPA formats
    this.patterns.push({
      id: 'gpa_format',
      name: 'Grade Point Average Format',
      description: 'GPA should be decimal number with appropriate precision',
      columnPattern: /(gpa|grade.*point)/i,
      valuePattern: /^[0-4]\.\d{1,3}$|^[0-5]\.\d{1,3}$|^[0-9]{1,2}(\.\d{1,2})?$/,
      severity: 'medium',
      examples: ['3.85', '4.0', '2.75', '85.5'],
      enabled: true,
    });

    // Grade letter formats
    this.patterns.push({
      id: 'letter_grade',
      name: 'Letter Grade Format',
      description: 'Letter grades should follow standard format',
      columnPattern: /(grade|letter.*grade|final.*grade)/i,
      valuePattern: /^[A-F][+-]?$|^(HD|D|C|P|F|N)$/i,
      severity: 'low',
      examples: ['A+', 'B-', 'C', 'HD', 'P'],
      enabled: true,
    });

    // Academic year formats
    this.patterns.push({
      id: 'academic_year',
      name: 'Academic Year Format',
      description: 'Academic years should follow YYYY-YY or YYYY format',
      columnPattern: /(academic.*year|school.*year|year)/i,
      valuePattern: /^(19|20)\d{2}(-\d{2})?$|^(19|20)\d{2}\/(19|20)?\d{2}$/,
      severity: 'low',
      examples: ['2023-24', '2023/24', '2023'],
      enabled: true,
    });
  }

  /**
   * Enhanced format consistency analysis with unit standardization
   */
  private addUnitStandardizationAnalysis(): FormatConsistency[] {
    const unitAnalysis: FormatConsistency[] = [];

    for (let colIndex = 0; colIndex < this.headers.length; colIndex++) {
      const columnName = this.headers[colIndex];

      // Weight/mass units
      if (/(weight|mass|kg|lb|pound)/i.test(columnName)) {
        const weightFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\d+(\.\d+)?\s*kg$/i, name: 'Kilograms (kg)' },
          { pattern: /^\d+(\.\d+)?\s*lb$/i, name: 'Pounds (lb)' },
          { pattern: /^\d+(\.\d+)?\s*g$/i, name: 'Grams (g)' },
          { pattern: /^\d+(\.\d+)?\s*oz$/i, name: 'Ounces (oz)' },
          { pattern: /^\d+(\.\d+)?$/, name: 'Numeric only (no unit)' },
        ]);
        if (weightFormats) {
          weightFormats.analysisType = 'unit_standardization';
          weightFormats.recommendedAction = 'Standardize weight units to kilograms (kg)';
          unitAnalysis.push(weightFormats);
        }
      }

      // Length/distance units
      if (/(length|height|distance|cm|ft|in|meter)/i.test(columnName)) {
        const lengthFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\d+(\.\d+)?\s*cm$/i, name: 'Centimeters (cm)' },
          { pattern: /^\d+(\.\d+)?\s*m$/i, name: 'Meters (m)' },
          { pattern: /^\d+(\.\d+)?\s*ft$/i, name: 'Feet (ft)' },
          { pattern: /^\d+(\.\d+)?\s*in$/i, name: 'Inches (in)' },
          { pattern: /^\d+'\d+"?$/i, name: "Feet'Inches\"" },
          { pattern: /^\d+(\.\d+)?$/, name: 'Numeric only (no unit)' },
        ]);
        if (lengthFormats) {
          lengthFormats.analysisType = 'unit_standardization';
          lengthFormats.recommendedAction = 'Standardize length units to centimeters (cm)';
          unitAnalysis.push(lengthFormats);
        }
      }

      // Currency units
      if (/(price|cost|amount|salary|revenue|\$|£|€)/i.test(columnName)) {
        const currencyFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\$\d+(\.\d{2})?$/i, name: 'USD ($123.45)' },
          { pattern: /^£\d+(\.\d{2})?$/i, name: 'GBP (£123.45)' },
          { pattern: /^€\d+(\.\d{2})?$/i, name: 'EUR (€123.45)' },
          { pattern: /^\d+(\.\d{2})?\s*(USD|GBP|EUR)$/i, name: 'Number with currency code' },
          { pattern: /^\d+(\.\d{2})?$/, name: 'Numeric only (no currency)' },
        ]);
        if (currencyFormats) {
          currencyFormats.analysisType = 'unit_standardization';
          currencyFormats.recommendedAction = 'Standardize currency format with clear currency symbols';
          unitAnalysis.push(currencyFormats);
        }
      }

      // Temperature units
      if (/(temperature|temp|°|degree)/i.test(columnName)) {
        const tempFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\d+(\.\d+)?\s*°?C$/i, name: 'Celsius (°C)' },
          { pattern: /^\d+(\.\d+)?\s*°?F$/i, name: 'Fahrenheit (°F)' },
          { pattern: /^\d+(\.\d+)?\s*K$/i, name: 'Kelvin (K)' },
          { pattern: /^\d+(\.\d+)?$/, name: 'Numeric only (no unit)' },
        ]);
        if (tempFormats) {
          tempFormats.analysisType = 'unit_standardization';
          tempFormats.recommendedAction = 'Standardize temperature units to Celsius (°C)';
          unitAnalysis.push(tempFormats);
        }
      }
    }

    return unitAnalysis;
  }

  private validateColumnPattern(colIndex: number, columnName: string, pattern: PatternRule): void {
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
        const dateFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\d{4}-\d{2}-\d{2}/, name: 'ISO 8601 (YYYY-MM-DD)' },
          { pattern: /^\d{2}\/\d{2}\/\d{4}/, name: 'US Format (MM/DD/YYYY)' },
          { pattern: /^\d{2}\/\d{2}\/\d{2}/, name: 'Short US (MM/DD/YY)' },
          { pattern: /^\d{1,2}-\d{1,2}-\d{4}/, name: 'Dash Format (M-D-YYYY)' },
          { pattern: /^\w{3}\s+\d{1,2},?\s+\d{4}/, name: 'Text Format (Mon DD, YYYY)' },
        ]);
        if (dateFormats) formatAnalysis.push(dateFormats);
      }

      // Analyze phone format consistency
      if (/(phone|tel|mobile|cell)/i.test(columnName)) {
        const phoneFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^\(\d{3}\)\s\d{3}-\d{4}/, name: '(XXX) XXX-XXXX' },
          { pattern: /^\d{3}-\d{3}-\d{4}/, name: 'XXX-XXX-XXXX' },
          { pattern: /^\d{3}\.\d{3}\.\d{4}/, name: 'XXX.XXX.XXXX' },
          { pattern: /^\+1\s\d{3}\s\d{3}\s\d{4}/, name: '+1 XXX XXX XXXX' },
          { pattern: /^\d{10}/, name: 'XXXXXXXXXX' },
        ]);
        if (phoneFormats) formatAnalysis.push(phoneFormats);
      }

      // Analyze boolean representation consistency
      if (/(is|has|can|should|enabled|active|valid)/i.test(columnName)) {
        const booleanFormats = this.analyzeColumnFormatConsistency(colIndex, columnName, [
          { pattern: /^(true|false)$/i, name: 'true/false' },
          { pattern: /^(yes|no)$/i, name: 'yes/no' },
          { pattern: /^(y|n)$/i, name: 'y/n' },
          { pattern: /^(1|0)$/, name: '1/0' },
          { pattern: /^(on|off)$/i, name: 'on/off' },
        ]);
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
    formats: Array<{ pattern: RegExp; name: string }>,
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
        inconsistencyPercentage: (
          ((totalValues - dominantFormat.count) / totalValues) *
          100
        ).toFixed(1),
      },
      score: {
        score: Math.max(0, 100 - (formatArray.length - 1) * 20),
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
        inconsistencyPercentage: (
          ((totalValues - dominantCasing.count) / totalValues) *
          100
        ).toFixed(1),
      },
      score: {
        score: Math.max(0, 100 - (casingArray.length - 1) * 15),
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
      const pattern = this.patterns.find((p) => p.id === patternId);
      if (!pattern) continue;

      const affectedColumns = [...new Set(violations.map((v) => v.columnName))];
      const examples = violations.slice(0, 5).map((v) => v.value);

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
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '');
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase(),
      )
      .replace(/\s+/g, '');
  }

  public getPatternSummary(): {
    totalPatternsEvaluated: number;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    mostProblematicColumns: Array<{ columnName: string; violationCount: number }>;
  } {
    const violationsBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const columnViolations = new Map<string, number>();

    for (const violation of this.violations) {
      const pattern = this.patterns.find((p) => p.id === violation.patternId);
      if (pattern) {
        violationsBySeverity[pattern.severity]++;
      }

      columnViolations.set(
        violation.columnName,
        (columnViolations.get(violation.columnName) || 0) + 1,
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
