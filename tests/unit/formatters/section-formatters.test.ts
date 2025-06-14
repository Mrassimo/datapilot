/**
 * Section Formatters Tests
 * 
 * Tests individual section formatters for markdown structure,
 * content accuracy, and formatting consistency.
 */

import { Section1Formatter } from '../../../src/analyzers/overview/section1-formatter';
import { Section2Formatter } from '../../../src/analyzers/quality/section2-formatter';
import type { Section1Result } from '../../../src/analyzers/overview/types';
import type { QualityAuditResult } from '../../../src/analyzers/quality/types';

// Create comprehensive mock data
const createMockSection1Result = (): Section1Result => ({
  overview: {
    version: '1.3.1',
    generatedAt: new Date('2024-01-15T14:30:45Z'),
    fileDetails: {
      originalFilename: 'sales_data_2024.csv',
      fullResolvedPath: '/Users/analyst/projects/data/sales_data_2024.csv',
      fileSizeMB: 15.7,
      mimeType: 'text/csv',
      lastModified: new Date('2024-01-14T09:15:30Z'),
      sha256Hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    parsingMetadata: {
      dataSourceType: 'CSV File',
      parsingEngine: 'DataPilot Streaming Parser v2.1',
      parsingTimeSeconds: 2.34,
      encoding: {
        encoding: 'utf-8',
        detectionMethod: 'BOM + Statistical Analysis',
        confidence: 0.99,
        bomDetected: true,
        bomType: 'UTF-8',
      },
      delimiter: {
        delimiter: ',',
        detectionMethod: 'Statistical Frequency Analysis',
        confidence: 0.97,
      },
      lineEnding: 'CRLF',
      quotingCharacter: '"',
      emptyLinesEncountered: 12,
      headerProcessing: {
        headerPresence: 'Detected and Validated',
        headerRowNumbers: [1],
        columnNamesSource: 'First Row (Auto-detected)',
      },
      initialScanLimit: {
        method: 'First 5000 lines + Smart Sampling',
      },
    },
    structuralDimensions: {
      totalRows: 50000,
      totalColumns: 12,
      dataRows: 49999,
      headerRows: 1,
      estimatedMemoryUsageMB: 85.3,
      columnSpecs: [
        { name: 'transaction_id', index: 0, dataType: 'string' },
        { name: 'customer_id', index: 1, dataType: 'integer' },
        { name: 'product_name', index: 2, dataType: 'string' },
        { name: 'category', index: 3, dataType: 'string' },
        { name: 'price', index: 4, dataType: 'float' },
        { name: 'quantity', index: 5, dataType: 'integer' },
        { name: 'discount_rate', index: 6, dataType: 'float' },
        { name: 'tax_amount', index: 7, dataType: 'float' },
        { name: 'total_amount', index: 8, dataType: 'float' },
        { name: 'purchase_date', index: 9, dataType: 'date' },
        { name: 'is_premium_customer', index: 10, dataType: 'boolean' },
        { name: 'sales_rep_id', index: 11, dataType: 'integer' },
      ],
    },
    executionContext: {
      command: 'datapilot overview sales_data_2024.csv --verbose --output markdown',
      workingDirectory: '/Users/analyst/projects/sales-analysis',
      nodeVersion: 'v20.10.0',
      platform: 'darwin',
      timestamp: new Date('2024-01-15T14:30:45Z'),
      processingTimeSeconds: 3.45,
      memoryUsageMB: 128.7,
    },
  },
  warnings: [
    {
      type: 'data_quality',
      severity: 'medium',
      message: 'Detected 156 rows with missing values',
      details: 'Missing values found in columns: discount_rate (89), tax_amount (67). Consider data cleaning.',
    },
    {
      type: 'performance',
      severity: 'low',
      message: 'Large dataset detected',
      details: 'File size exceeds 10MB. Consider using streaming mode for very large datasets.',
    },
    {
      type: 'schema',
      severity: 'medium',
      message: 'Inconsistent date formats detected',
      details: 'Purchase dates use mixed formats: YYYY-MM-DD (98%) and MM/DD/YYYY (2%). Standardization recommended.',
    },
  ],
  performanceMetrics: {
    totalProcessingTimeMs: 3450,
    memoryPeakUsageMB: 145.2,
    throughputRowsPerSecond: 14492,
    cachingEnabled: true,
    optimizationsApplied: [
      'streaming_parser',
      'type_inference_cache',
      'memory_mapped_io',
      'parallel_processing',
    ],
  },
});

const createMockQualityAudit = (): QualityAuditResult => ({
  cockpit: {
    compositeScore: {
      score: 78.3,
      interpretation: 'Fair - Needs Attention',
      breakdown: {
        completeness: 85.2,
        consistency: 72.1,
        validity: 81.5,
        accuracy: 74.8,
        timeliness: 89.1,
        uniqueness: 91.3,
      },
      trend: 'Improving',
      lastAssessment: new Date('2024-01-10T12:00:00Z'),
    },
    priorityActions: [
      {
        priority: 'high',
        dimension: 'consistency',
        action: 'Standardize date formats across all records',
        impact: 'High',
        effort: 'Medium',
        estimatedHours: 8,
      },
      {
        priority: 'medium',
        dimension: 'accuracy',
        action: 'Validate price calculations and fix negative values',
        impact: 'Medium',
        effort: 'Low',
        estimatedHours: 4,
      },
    ],
  },
  dimensionDetails: {
    completeness: {
      score: 85.2,
      description: 'Most fields are populated with some notable gaps',
      issues: [
        {
          severity: 'medium',
          column: 'discount_rate',
          description: '89 missing values (0.18% of dataset)',
          rowIndices: [125, 340, 567, 892],
          impact: 'May affect discount analysis accuracy',
        },
        {
          severity: 'low',
          column: 'tax_amount',
          description: '67 missing values (0.13% of dataset)',
          rowIndices: [89, 234, 445],
          impact: 'Minor impact on financial calculations',
        },
      ],
      recommendations: [
        'Investigate data pipeline for discount_rate collection',
        'Implement fallback values for missing tax calculations',
        'Set up monitoring for data completeness trends',
      ],
      metrics: {
        totalFields: 600000,
        populatedFields: 511200,
        missingFields: 88800,
        completenessRate: 0.852,
      },
    },
    consistency: {
      score: 72.1,
      description: 'Several format inconsistencies detected across columns',
      issues: [
        {
          severity: 'high',
          column: 'purchase_date',
          description: 'Mixed date formats: 98% YYYY-MM-DD, 2% MM/DD/YYYY',
          rowIndices: [1234, 5678, 9012],
          impact: 'Critical for temporal analysis and reporting',
        },
        {
          severity: 'medium',
          column: 'product_name',
          description: 'Inconsistent capitalization and spacing',
          rowIndices: [2345, 6789],
          impact: 'Affects product grouping and analysis',
        },
      ],
      recommendations: [
        'Standardize all dates to ISO 8601 format (YYYY-MM-DD)',
        'Implement text normalization for product names',
        'Create data validation rules for future imports',
      ],
      metrics: {
        formatInconsistencies: 1456,
        affectedColumns: 3,
        consistencyRate: 0.721,
      },
    },
    validity: {
      score: 81.5,
      description: 'Most data conforms to expected formats and ranges',
      issues: [
        {
          severity: 'medium',
          column: 'price',
          description: '12 negative price values detected',
          rowIndices: [888, 1776, 3344],
          impact: 'Invalid for business logic and calculations',
        },
        {
          severity: 'low',
          column: 'quantity',
          description: '3 zero quantity transactions',
          rowIndices: [111, 222, 333],
          impact: 'May represent refunds or data entry errors',
        },
      ],
      recommendations: [
        'Investigate and correct negative price values',
        'Review zero-quantity transactions for business validity',
        'Implement range validation for numerical fields',
      ],
      metrics: {
        validRecords: 40750,
        invalidRecords: 9249,
        validityRate: 0.815,
      },
    },
    accuracy: {
      score: 74.8,
      description: 'Some calculation discrepancies and referential integrity issues',
      issues: [
        {
          severity: 'high',
          column: 'total_amount',
          description: '234 records with calculation mismatches',
          rowIndices: [456, 789, 1023],
          impact: 'Financial accuracy critical for business decisions',
        },
      ],
      recommendations: [
        'Recalculate total_amount using price * quantity - discount + tax',
        'Implement automated calculation validation',
        'Review data entry processes for accuracy',
      ],
      metrics: {
        calculationErrors: 234,
        referentialErrors: 89,
        accuracyRate: 0.748,
      },
    },
    timeliness: {
      score: 89.1,
      description: 'Data is generally current with good update frequency',
      issues: [
        {
          severity: 'low',
          column: 'purchase_date',
          description: '45 records with future dates',
          rowIndices: [9876, 8765],
          impact: 'May indicate data entry errors or system clock issues',
        },
      ],
      recommendations: [
        'Validate system timestamps and data entry processes',
        'Implement date range validation (no future dates)',
      ],
      metrics: {
        currentRecords: 44550,
        outdatedRecords: 1449,
        timelinessRate: 0.891,
      },
    },
    uniqueness: {
      score: 91.3,
      description: 'Most records are unique with minimal duplication',
      issues: [
        {
          severity: 'low',
          column: 'transaction_id',
          description: '23 duplicate transaction IDs detected',
          rowIndices: [1111, 2222, 3333],
          impact: 'May affect transaction counting and analysis',
        },
      ],
      recommendations: [
        'Investigate duplicate transaction IDs',
        'Implement unique constraints for transaction identifiers',
      ],
      metrics: {
        uniqueRecords: 45651,
        duplicateRecords: 4348,
        uniquenessRate: 0.913,
      },
    },
  },
  businessImpact: {
    financialImpact: {
      estimatedLossFromErrors: 15420.50,
      currency: 'USD',
      affectedTransactions: 234,
    },
    operationalImpact: {
      reportingAccuracy: 0.748,
      decisionMakingReliability: 0.783,
      complianceRisk: 'Medium',
    },
  },
  remediationPlan: {
    totalEstimatedHours: 24,
    priorityOrder: [
      'Fix calculation errors in total_amount',
      'Standardize date formats',
      'Validate price ranges',
      'Investigate duplicate transactions',
    ],
    automationOpportunities: [
      'Automated calculation validation',
      'Date format standardization scripts',
      'Duplicate detection workflows',
    ],
  },
});

describe('Section Formatters', () => {
  describe('Section1Formatter', () => {
    let formatter: Section1Formatter;
    let mockResult: Section1Result;

    beforeEach(() => {
      formatter = new Section1Formatter();
      mockResult = createMockSection1Result();
    });

    describe('Markdown Structure', () => {
      it('should generate well-formed markdown with proper hierarchy', () => {
        const report = formatter.formatReport(mockResult);

        // Check main header structure
        expect(report).toMatch(/^# DataPilot Analysis Report$/m);
        expect(report).toMatch(/^## Section 1: Overview$/m);
        
        // Check subsection headers
        expect(report).toMatch(/^\*\*1\.1\. Input Data File Details:\*\*$/m);
        expect(report).toMatch(/^\*\*1\.2\. Data Ingestion & Parsing Parameters:\*\*$/m);
        expect(report).toMatch(/^\*\*1\.3\. Structural Dimensions & Schema:\*\*$/m);
        expect(report).toMatch(/^\*\*1\.4\. Execution Context & Environment:\*\*$/m);
        
        // Check separator
        expect(report).toMatch(/^---$/m);
      });

      it('should format lists with proper bullet points', () => {
        const report = formatter.formatReport(mockResult);

        // Check list formatting
        expect(report).toMatch(/^\s*\* Original Filename:/m);
        expect(report).toMatch(/^\s*\* Full Resolved Path:/m);
        expect(report).toMatch(/^\s*\* File Size \(on disk\):/m);
        
        // Check nested lists
        expect(report).toMatch(/^\s*\* Detected Character Encoding:/m);
        expect(report).toMatch(/^\s*\s+\* Encoding Detection Method:/m);
        expect(report).toMatch(/^\s*\s+\* Encoding Confidence:/m);
      });

      it('should use proper code formatting for technical values', () => {
        const report = formatter.formatReport(mockResult);

        // Check backtick formatting for technical values
        expect(report).toContain('`sales_data_2024.csv`');
        expect(report).toContain('`text/csv`');
        expect(report).toContain('`utf-8`');
        expect(report).toContain('`,`');
        expect(report).toContain('`"`');
        expect(report).toContain('`a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890`');
      });
    });

    describe('Content Accuracy', () => {
      it('should display file details correctly', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('sales_data_2024.csv');
        expect(report).toContain('/Users/analyst/projects/data/sales_data_2024.csv');
        expect(report).toContain('15.70 MB');
        expect(report).toContain('text/csv');
        expect(report).toContain('2024-01-14 09:15:30 (UTC)');
        expect(report).toContain('a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890');
      });

      it('should display parsing metadata accurately', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('DataPilot Streaming Parser v2.1');
        expect(report).toContain('2.34 seconds');
        expect(report).toContain('utf-8');
        expect(report).toContain('BOM + Statistical Analysis');
        expect(report).toContain('99.0%');
        expect(report).toContain('UTF-8 Detected and Handled');
        expect(report).toContain('Comma');
        expect(report).toContain('Statistical Frequency Analysis');
        expect(report).toContain('97.0%');
        expect(report).toContain('CRLF (Windows-style)');
        expect(report).toContain('12');
      });

      it('should display structural dimensions correctly', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('50,000');
        expect(report).toContain('12');
        expect(report).toContain('49,999');
        expect(report).toContain('1');
        expect(report).toContain('85.30 MB');
        
        // Check column specifications
        expect(report).toContain('transaction_id');
        expect(report).toContain('customer_id');
        expect(report).toContain('product_name');
        expect(report).toContain('price');
        expect(report).toContain('purchase_date');
        expect(report).toContain('is_premium_customer');
      });

      it('should display execution context properly', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('datapilot overview sales_data_2024.csv --verbose --output markdown');
        expect(report).toContain('/Users/analyst/projects/sales-analysis');
        expect(report).toContain('v20.10.0');
        expect(report).toContain('darwin');
        expect(report).toContain('2024-01-15 14:30:45 (UTC)');
        expect(report).toContain('3.45 seconds');
        expect(report).toContain('128.70 MB');
      });

      it('should format warnings with proper severity and details', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('⚠️');
        expect(report).toContain('medium');
        expect(report).toContain('156 rows with missing values');
        expect(report).toContain('discount_rate (89), tax_amount (67)');
        expect(report).toContain('Large dataset detected');
        expect(report).toContain('Inconsistent date formats');
        expect(report).toContain('YYYY-MM-DD (98%) and MM/DD/YYYY (2%)');
      });

      it('should format performance metrics accurately', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('3,450');
        expect(report).toContain('145.20 MB');
        expect(report).toContain('14,492');
        expect(report).toContain('Enabled');
        expect(report).toContain('streaming_parser');
        expect(report).toContain('type_inference_cache');
        expect(report).toContain('memory_mapped_io');
        expect(report).toContain('parallel_processing');
      });
    });

    describe('Formatting Helpers', () => {
      it('should format file sizes correctly', () => {
        const report = formatter.formatReport(mockResult);

        // Test different size ranges
        expect(report).toContain('15.70 MB'); // File size
        expect(report).toContain('85.30 MB'); // Memory usage
        expect(report).toContain('128.70 MB'); // Execution memory
        expect(report).toContain('145.20 MB'); // Peak memory
      });

      it('should format percentages with proper precision', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('99.0%'); // Encoding confidence
        expect(report).toContain('97.0%'); // Delimiter confidence
      });

      it('should format numbers with thousands separators', () => {
        const report = formatter.formatReport(mockResult);

        expect(report).toContain('50,000'); // Total rows
        expect(report).toContain('49,999'); // Data rows
        expect(report).toContain('3,450'); // Processing time
        expect(report).toContain('14,492'); // Throughput
      });

      it('should format timestamps consistently', () => {
        const report = formatter.formatReport(mockResult);

        // All timestamps should be in UTC format without 'T'
        expect(report).toContain('2024-01-15 14:30:45 (UTC)');
        expect(report).toContain('2024-01-14 09:15:30 (UTC)');
        expect(report).not.toContain('T'); // No ISO T separator
      });
    });

    describe('Summary Generation', () => {
      it('should generate concise summary', () => {
        const summary = formatter.formatSummary(mockResult);

        expect(summary).toContain('sales_data_2024.csv');
        expect(summary).toContain('50,000 rows');
        expect(summary).toContain('12 columns');
        expect(summary).toContain('15.70 MB');
        expect(summary).toContain('3 warnings');
        expect(summary).toContain('3.45s processing');
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing or null values gracefully', () => {
        const modifiedResult = {
          ...mockResult,
          overview: {
            ...mockResult.overview,
            parsingMetadata: {
              ...mockResult.overview.parsingMetadata,
              encoding: {
                ...mockResult.overview.parsingMetadata.encoding,
                bomDetected: false,
                bomType: null,
              },
            },
          },
          warnings: [],
        };

        const report = formatter.formatReport(modifiedResult);

        expect(report).toContain('Not Detected'); // BOM status
        expect(report).not.toContain('null');
        expect(report).not.toContain('undefined');
      });

      it('should handle very large numbers correctly', () => {
        const largeDataResult = {
          ...mockResult,
          overview: {
            ...mockResult.overview,
            structuralDimensions: {
              ...mockResult.overview.structuralDimensions,
              totalRows: 5000000,
              estimatedMemoryUsageMB: 1024.5,
            },
          },
          performanceMetrics: {
            ...mockResult.performanceMetrics,
            throughputRowsPerSecond: 125000,
          },
        };

        const report = formatter.formatReport(largeDataResult);

        expect(report).toContain('5,000,000');
        expect(report).toContain('1,024.50 MB');
        expect(report).toContain('125,000');
      });

      it('should handle special characters in file paths', () => {
        const specialPathResult = {
          ...mockResult,
          overview: {
            ...mockResult.overview,
            fileDetails: {
              ...mockResult.overview.fileDetails,
              originalFilename: 'data with spaces & symbols (2024).csv',
              fullResolvedPath: '/path/with spaces/and-symbols/data with spaces & symbols (2024).csv',
            },
          },
        };

        const report = formatter.formatReport(specialPathResult);

        expect(report).toContain('`data with spaces & symbols (2024).csv`');
        expect(report).toContain('`/path/with spaces/and-symbols/data with spaces & symbols (2024).csv`');
      });
    });
  });

  describe('Section2Formatter', () => {
    let mockQualityAudit: QualityAuditResult;

    beforeEach(() => {
      mockQualityAudit = createMockQualityAudit();
    });

    describe('Quality Report Structure', () => {
      it('should generate comprehensive quality report', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        // Check main sections
        expect(report).toContain('# Data Quality Assessment Report');
        expect(report).toContain('## Executive Summary');
        expect(report).toContain('## Quality Dimensions Analysis');
        expect(report).toContain('## Business Impact Assessment');
        expect(report).toContain('## Remediation Plan');

        // Check quality score display
        expect(report).toContain('78.3');
        expect(report).toContain('Fair - Needs Attention');
        
        // Check dimension scores
        expect(report).toContain('85.2%'); // Completeness
        expect(report).toContain('72.1%'); // Consistency
        expect(report).toContain('81.5%'); // Validity
        expect(report).toContain('74.8%'); // Accuracy
      });

      it('should format priority actions correctly', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        expect(report).toContain('🔴 High Priority');
        expect(report).toContain('Standardize date formats across all records');
        expect(report).toContain('High Impact');
        expect(report).toContain('Medium Effort');
        expect(report).toContain('8 hours');

        expect(report).toContain('🟡 Medium Priority');
        expect(report).toContain('Validate price calculations');
        expect(report).toContain('4 hours');
      });

      it('should display dimension details with issues and recommendations', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        // Completeness details
        expect(report).toContain('### Completeness (85.2%)');
        expect(report).toContain('89 missing values');
        expect(report).toContain('discount_rate');
        expect(report).toContain('0.18% of dataset');
        expect(report).toContain('Investigate data pipeline');

        // Consistency details
        expect(report).toContain('### Consistency (72.1%)');
        expect(report).toContain('Mixed date formats');
        expect(report).toContain('98% YYYY-MM-DD, 2% MM/DD/YYYY');
        expect(report).toContain('ISO 8601 format');

        // Validity details
        expect(report).toContain('### Validity (81.5%)');
        expect(report).toContain('12 negative price values');
        expect(report).toContain('3 zero quantity transactions');
      });

      it('should format business impact with financial metrics', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        expect(report).toContain('$15,420.50');
        expect(report).toContain('USD');
        expect(report).toContain('234 affected transactions');
        expect(report).toContain('74.8%'); // Reporting accuracy
        expect(report).toContain('78.3%'); // Decision making reliability
        expect(report).toContain('Medium'); // Compliance risk
      });

      it('should include remediation plan with time estimates', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        expect(report).toContain('24 hours');
        expect(report).toContain('Fix calculation errors in total_amount');
        expect(report).toContain('Standardize date formats');
        expect(report).toContain('Validate price ranges');
        expect(report).toContain('Automated calculation validation');
        expect(report).toContain('Date format standardization scripts');
      });
    });

    describe('Quality Metrics Formatting', () => {
      it('should format scores with proper visual indicators', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        // Check score formatting with indicators
        expect(report).toMatch(/78\.3.*Fair - Needs Attention/);
        expect(report).toMatch(/85\.2.*Completeness/);
        expect(report).toMatch(/72\.1.*Consistency/);
        
        // Should include visual progress bars or indicators
        expect(report).toMatch(/[█▉▊▋▌▍▎▏]/); // Progress bar characters
      });

      it('should format percentages consistently', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        // All percentages should be formatted with one decimal place
        expect(report).toContain('85.2%');
        expect(report).toContain('72.1%');
        expect(report).toContain('81.5%');
        expect(report).toContain('74.8%');
        expect(report).toContain('89.1%');
        expect(report).toContain('91.3%');
      });

      it('should format issue counts and metrics properly', () => {
        const report = Section2Formatter.formatReport(mockQualityAudit);

        expect(report).toContain('89 missing values');
        expect(report).toContain('67 missing values');
        expect(report).toContain('12 negative price values');
        expect(report).toContain('234 records with calculation mismatches');
        expect(report).toContain('23 duplicate transaction IDs');
      });
    });

    describe('Summary Generation', () => {
      it('should generate executive summary', () => {
        const summary = Section2Formatter.formatSummary(mockQualityAudit);

        expect(summary).toContain('Quality Score: 78.3/100');
        expect(summary).toContain('Fair - Needs Attention');
        expect(summary).toContain('2 priority actions');
        expect(summary).toContain('24 hours estimated');
        expect(summary).toContain('$15,420.50 financial impact');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle missing dimension details gracefully', () => {
        const incompleteAudit = {
          ...mockQualityAudit,
          dimensionDetails: {
            completeness: mockQualityAudit.dimensionDetails.completeness,
            // Missing other dimensions
          },
        };

        const report = Section2Formatter.formatReport(incompleteAudit);

        expect(report).toContain('Completeness');
        expect(report).not.toContain('undefined');
        expect(report).not.toContain('null');
      });

      it('should handle zero scores and empty arrays', () => {
        const emptyAudit = {
          ...mockQualityAudit,
          cockpit: {
            ...mockQualityAudit.cockpit,
            priorityActions: [],
          },
          dimensionDetails: {
            completeness: {
              ...mockQualityAudit.dimensionDetails.completeness,
              issues: [],
              recommendations: [],
            },
          },
        };

        const report = Section2Formatter.formatReport(emptyAudit);

        expect(report).not.toThrow;
        expect(report).toContain('Quality Assessment Report');
      });

      it('should handle extreme values correctly', () => {
        const extremeAudit = {
          ...mockQualityAudit,
          cockpit: {
            ...mockQualityAudit.cockpit,
            compositeScore: {
              ...mockQualityAudit.cockpit.compositeScore,
              score: 0.1,
              interpretation: 'Critical - Immediate Action Required',
            },
          },
          businessImpact: {
            ...mockQualityAudit.businessImpact,
            financialImpact: {
              estimatedLossFromErrors: 1000000.99,
              currency: 'USD',
              affectedTransactions: 50000,
            },
          },
        };

        const report = Section2Formatter.formatReport(extremeAudit);

        expect(report).toContain('0.1');
        expect(report).toContain('Critical - Immediate Action Required');
        expect(report).toContain('$1,000,000.99');
        expect(report).toContain('50,000');
      });
    });
  });
});