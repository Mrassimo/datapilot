/**
 * Core Types and Data Structures Tests
 * Tests type definitions, interfaces, validation, and error handling
 */

import {
  DataType,
  DataPilotError,
  ErrorSeverity,
  ErrorCategory,
  type CSVParsingOptions,
  type CSVMetadata,
  type ColumnMetadata,
  type ColumnStatistics,
  type QualityDimension,
  type QualityIssue,
  type DataQualityReport,
  type AnalysisResult,
  type DataPilotReport,
  type ErrorContext,
  type ActionableSuggestion,
} from '../../../src/core/types';

describe('Core Types and Data Structures', () => {

  describe('DataType Enum', () => {
    it('should have all expected data types', () => {
      expect(DataType.STRING).toBe('string');
      expect(DataType.NUMBER).toBe('number');
      expect(DataType.INTEGER).toBe('integer');
      expect(DataType.FLOAT).toBe('float');
      expect(DataType.DATE).toBe('date');
      expect(DataType.DATETIME).toBe('datetime');
      expect(DataType.BOOLEAN).toBe('boolean');
      expect(DataType.UNKNOWN).toBe('unknown');
    });

    it('should be usable in type guards', () => {
      const checkDataType = (type: string): type is DataType => {
        return Object.values(DataType).includes(type as DataType);
      };

      expect(checkDataType('string')).toBe(true);
      expect(checkDataType('number')).toBe(true);
      expect(checkDataType('invalid')).toBe(false);
    });
  });

  describe('ErrorSeverity and ErrorCategory Enums', () => {
    it('should have all expected severity levels', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });

    it('should have all expected error categories', () => {
      expect(ErrorCategory.PARSING).toBe('parsing');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.ANALYSIS).toBe('analysis');
      expect(ErrorCategory.MEMORY).toBe('memory');
      expect(ErrorCategory.IO).toBe('io');
      expect(ErrorCategory.CONFIGURATION).toBe('configuration');
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.PERMISSION).toBe('permission');
      expect(ErrorCategory.SECURITY).toBe('security');
      expect(ErrorCategory.PERFORMANCE).toBe('performance');
    });
  });

  describe('DataPilotError Class', () => {
    describe('Basic Error Creation', () => {
      it('should create error with all parameters', () => {
        const context: ErrorContext = {
          filePath: '/test/file.csv',
          section: 'parsing',
          rowIndex: 10,
          columnName: 'age',
        };

        const suggestions: ActionableSuggestion[] = [{
          action: 'Fix encoding',
          description: 'Try UTF-8 encoding',
          severity: ErrorSeverity.MEDIUM,
          command: 'datapilot --encoding utf8'
        }];

        const error = new DataPilotError(
          'Invalid character encoding',
          'ENCODING_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.PARSING,
          context,
          suggestions,
          true
        );

        expect(error.message).toBe('Invalid character encoding');
        expect(error.code).toBe('ENCODING_ERROR');
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.category).toBe(ErrorCategory.PARSING);
        expect(error.context).toEqual(context);
        expect(error.suggestions).toEqual(suggestions);
        expect(error.recoverable).toBe(true);
        expect(error.name).toBe('DataPilotError');
      });

      it('should create error with minimal parameters', () => {
        const error = new DataPilotError('Simple error', 'SIMPLE_ERROR');

        expect(error.message).toBe('Simple error');
        expect(error.code).toBe('SIMPLE_ERROR');
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.category).toBe(ErrorCategory.ANALYSIS);
        expect(error.recoverable).toBe(true);
      });
    });

    describe('Static Factory Methods', () => {
      it('should create parsing error', () => {
        const context: ErrorContext = { filePath: '/test/file.csv', rowIndex: 5 };
        const error = DataPilotError.parsing('Parse failed', 'PARSE_FAIL', context);

        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.category).toBe(ErrorCategory.PARSING);
        expect(error.recoverable).toBe(true);
        expect(error.context).toEqual(context);
      });

      it('should create memory error', () => {
        const context: ErrorContext = { memoryUsage: 2048 };
        const error = DataPilotError.memory('Out of memory', 'OOM', context);

        expect(error.severity).toBe(ErrorSeverity.CRITICAL);
        expect(error.category).toBe(ErrorCategory.MEMORY);
        expect(error.recoverable).toBe(true);
        expect(error.context).toEqual(context);
      });

      it('should create validation error', () => {
        const context: ErrorContext = { columnName: 'email', value: 'invalid-email' };
        const error = DataPilotError.validation('Invalid email', 'INVALID_EMAIL', context);

        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.category).toBe(ErrorCategory.VALIDATION);
        expect(error.recoverable).toBe(false);
        expect(error.context).toEqual(context);
      });

      it('should create analysis error', () => {
        const context: ErrorContext = { analyzer: 'StatisticalAnalyzer' };
        const error = DataPilotError.analysis('Analysis failed', 'ANALYSIS_FAIL', context);

        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.category).toBe(ErrorCategory.ANALYSIS);
        expect(error.recoverable).toBe(true);
        expect(error.context).toEqual(context);
      });

      it('should create security error', () => {
        const context: ErrorContext = { filePath: '/restricted/file.csv' };
        const error = DataPilotError.security('Access denied', 'ACCESS_DENIED', context);

        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.category).toBe(ErrorCategory.SECURITY);
        expect(error.recoverable).toBe(false);
        expect(error.context).toEqual(context);
      });
    });

    describe('Error Formatting', () => {
      it('should format error message with context', () => {
        const context: ErrorContext = {
          filePath: '/test/data.csv',
          section: 'quality',
          analyzer: 'CompletenessAnalyzer',
          rowIndex: 100,
          columnName: 'email',
        };

        const error = new DataPilotError(
          'Missing required value',
          'MISSING_VALUE',
          ErrorSeverity.MEDIUM,
          ErrorCategory.VALIDATION,
          context
        );

        const formatted = error.getFormattedMessage();

        expect(formatted).toContain('❌ ERROR: Missing required value');
        expect(formatted).toContain('File: /test/data.csv');
        expect(formatted).toContain('Section: quality');
        expect(formatted).toContain('Analyzer: CompletenessAnalyzer');
        expect(formatted).toContain('Row: 100');
        expect(formatted).toContain('Column: email');
      });

      it('should format error message without context', () => {
        const error = new DataPilotError('Simple error', 'SIMPLE_ERROR');
        const formatted = error.getFormattedMessage();

        expect(formatted).toBe('❌ ERROR: Simple error');
      });

      it('should handle partial context', () => {
        const context: ErrorContext = {
          filePath: '/test/data.csv',
          columnName: 'age',
        };

        const error = new DataPilotError('Type mismatch', 'TYPE_MISMATCH', undefined, undefined, context);
        const formatted = error.getFormattedMessage();

        expect(formatted).toContain('File: /test/data.csv');
        expect(formatted).toContain('Column: age');
        expect(formatted).not.toContain('Section:');
        expect(formatted).not.toContain('Row:');
      });
    });

    describe('Suggestions Formatting', () => {
      it('should format suggestions correctly', () => {
        const suggestions: ActionableSuggestion[] = [
          {
            action: 'Check encoding',
            description: 'Verify file encoding is UTF-8',
            severity: ErrorSeverity.HIGH,
            command: 'file --mime-encoding data.csv'
          },
          {
            action: 'Manual review',
            description: 'Manually inspect the problematic rows',
            severity: ErrorSeverity.MEDIUM,
          }
        ];

        const error = new DataPilotError('Encoding issue', 'ENCODING_ISSUE', undefined, undefined, undefined, suggestions);
        const formattedSuggestions = error.getSuggestions();

        expect(formattedSuggestions).toHaveLength(2);
        expect(formattedSuggestions[0]).toContain('• Check encoding: Verify file encoding is UTF-8');
        expect(formattedSuggestions[0]).toContain('(Run: file --mime-encoding data.csv)');
        expect(formattedSuggestions[1]).toContain('• Manual review: Manually inspect the problematic rows');
        expect(formattedSuggestions[1]).not.toContain('(Run:');
      });

      it('should return empty array for no suggestions', () => {
        const error = new DataPilotError('Simple error', 'SIMPLE_ERROR');
        const suggestions = error.getSuggestions();

        expect(suggestions).toEqual([]);
      });
    });
  });

  describe('Interface Type Validation', () => {
    describe('CSVParsingOptions', () => {
      it('should accept valid parsing options', () => {
        const options: CSVParsingOptions = {
          delimiter: ',',
          quote: '"',
          escape: '\\',
          encoding: 'utf8',
          hasHeader: true,
          lineEnding: '\n',
          skipEmptyLines: true,
          maxRows: 1000000,
        };

        expect(options.delimiter).toBe(',');
        expect(options.encoding).toBe('utf8');
        expect(options.hasHeader).toBe(true);
        expect(options.maxRows).toBe(1000000);
      });

      it('should work with partial options', () => {
        const options: CSVParsingOptions = {
          delimiter: '\t',
          hasHeader: false,
        };

        expect(options.delimiter).toBe('\t');
        expect(options.hasHeader).toBe(false);
        expect(options.encoding).toBeUndefined();
      });
    });

    describe('CSVMetadata', () => {
      it('should contain all required metadata fields', () => {
        const metadata: CSVMetadata = {
          filename: 'test.csv',
          filepath: '/data/test.csv',
          fileSize: 1024000,
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-02'),
          hash: 'abc123',
          encoding: 'utf8',
          encodingConfidence: 95,
          delimiter: ',',
          delimiterConfidence: 98,
          lineEnding: '\n',
          quote: '"',
          hasHeader: true,
          rowCount: 10000,
          columnCount: 15,
          estimatedMemorySize: 2048000,
        };

        expect(metadata.filename).toBe('test.csv');
        expect(metadata.rowCount).toBe(10000);
        expect(metadata.encodingConfidence).toBe(95);
        expect(metadata.estimatedMemorySize).toBeGreaterThan(metadata.fileSize);
      });
    });

    describe('ColumnMetadata', () => {
      it('should contain column information', () => {
        const column: ColumnMetadata = {
          index: 0,
          name: 'user_id',
          dataType: DataType.INTEGER,
          nullCount: 5,
          uniqueCount: 9995,
          exampleValues: [1, 2, 3, 4, 5],
        };

        expect(column.name).toBe('user_id');
        expect(column.dataType).toBe(DataType.INTEGER);
        expect(column.exampleValues).toHaveLength(5);
      });
    });

    describe('ColumnStatistics', () => {
      it('should contain statistical measures for numeric columns', () => {
        const stats: ColumnStatistics = {
          column: 'age',
          dataType: DataType.INTEGER,
          count: 1000,
          missing: 10,
          unique: 60,
          mean: 35.5,
          median: 34,
          mode: 30,
          stdDev: 12.3,
          variance: 151.29,
          min: 18,
          max: 85,
          quartiles: [25, 34, 45],
          skewness: 0.1,
          kurtosis: -0.5,
        };

        expect(stats.column).toBe('age');
        expect(stats.mean).toBe(35.5);
        expect(stats.quartiles).toHaveLength(3);
        expect(stats.unique).toBeLessThanOrEqual(stats.count - stats.missing);
      });

      it('should work for categorical columns', () => {
        const stats: ColumnStatistics = {
          column: 'gender',
          dataType: DataType.STRING,
          count: 1000,
          missing: 5,
          unique: 3,
          mode: 'Female',
        };

        expect(stats.column).toBe('gender');
        expect(stats.dataType).toBe(DataType.STRING);
        expect(stats.mean).toBeUndefined();
        expect(stats.mode).toBe('Female');
      });
    });

    describe('QualityDimension', () => {
      it('should contain quality scoring information', () => {
        const dimension: QualityDimension = {
          score: 85,
          issues: [
            {
              severity: 'medium',
              column: 'email',
              rowIndices: [10, 25, 100],
              description: 'Invalid email format',
              impact: 'May affect email validation processes',
            }
          ],
          recommendations: [
            'Implement email validation',
            'Clean existing invalid entries',
          ],
        };

        expect(dimension.score).toBe(85);
        expect(dimension.issues).toHaveLength(1);
        expect(dimension.recommendations).toHaveLength(2);
        expect(dimension.issues[0].severity).toBe('medium');
      });
    });

    describe('DataQualityReport', () => {
      it('should contain comprehensive quality assessment', () => {
        const report: DataQualityReport = {
          overallScore: 82,
          completeness: {
            score: 95,
            issues: [],
            recommendations: ['No action needed'],
          },
          accuracy: {
            score: 75,
            issues: [
              {
                severity: 'high',
                description: 'Inconsistent date formats',
                impact: 'May cause parsing errors',
              }
            ],
            recommendations: ['Standardize date formats'],
          },
          consistency: {
            score: 80,
            issues: [],
            recommendations: [],
          },
          timeliness: {
            score: 90,
            issues: [],
            recommendations: [],
          },
          uniqueness: {
            score: 85,
            issues: [],
            recommendations: [],
          },
          validity: {
            score: 70,
            issues: [],
            recommendations: [],
          },
          technicalDebt: {
            estimatedHours: 8,
            complexity: 'medium',
            automationPotential: 75,
          },
        };

        expect(report.overallScore).toBe(82);
        expect(report.completeness.score).toBe(95);
        expect(report.technicalDebt.complexity).toBe('medium');
        expect(report.technicalDebt.automationPotential).toBe(75);
      });
    });

    describe('AnalysisResult', () => {
      it('should wrap analysis data with metadata', () => {
        const testData = { mean: 25.5, median: 24, count: 100 };
        
        const result: AnalysisResult<typeof testData> = {
          section: 'statistics',
          timestamp: new Date(),
          processingTime: 1500,
          data: testData,
          warnings: ['Small sample size'],
          errors: [],
        };

        expect(result.section).toBe('statistics');
        expect(result.data.mean).toBe(25.5);
        expect(result.warnings).toHaveLength(1);
        expect(result.errors).toHaveLength(0);
        expect(result.processingTime).toBe(1500);
      });
    });

    describe('DataPilotReport', () => {
      it('should contain complete report structure', () => {
        const report: DataPilotReport = {
          metadata: {
            version: '1.0.0',
            analysisDate: new Date(),
            commandExecuted: 'datapilot analyze data.csv',
            totalProcessingTime: 15000,
          },
          sections: {
            overview: {
              section: 'overview',
              timestamp: new Date(),
              processingTime: 2000,
              data: {
                filename: 'data.csv',
                filepath: '/data/data.csv',
                fileSize: 1024000,
                createdAt: new Date(),
                modifiedAt: new Date(),
                hash: 'abc123',
                encoding: 'utf8',
                encodingConfidence: 95,
                delimiter: ',',
                delimiterConfidence: 98,
                lineEnding: '\n',
                quote: '"',
                hasHeader: true,
                rowCount: 1000,
                columnCount: 10,
                estimatedMemorySize: 2048000,
                columns: [],
              },
            },
          },
        };

        expect(report.metadata.version).toBe('1.0.0');
        expect(report.sections.overview).toBeDefined();
        expect(report.sections.overview?.data.filename).toBe('data.csv');
      });
    });
  });

  describe('Type Safety and Validation', () => {
    it('should enforce DataType enum values', () => {
      const validType: DataType = DataType.STRING;
      const invalidType = 'text'; // This should cause TypeScript error if used as DataType
      
      expect(validType).toBe('string');
      expect(Object.values(DataType).includes(invalidType as DataType)).toBe(false);
    });

    it('should handle union types for severity levels', () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low', 'medium', 'high', 'critical'
      ];
      
      severities.forEach(severity => {
        expect(['low', 'medium', 'high', 'critical']).toContain(severity);
      });
    });

    it('should validate optional properties', () => {
      const minimalStats: ColumnStatistics = {
        column: 'test',
        dataType: DataType.UNKNOWN,
        count: 0,
        missing: 0,
        unique: 0,
      };

      expect(minimalStats.mean).toBeUndefined();
      expect(minimalStats.median).toBeUndefined();
      expect(minimalStats.quartiles).toBeUndefined();
    });
  });

  describe('Error Context Validation', () => {
    it('should handle all context properties', () => {
      const fullContext: ErrorContext = {
        filePath: '/data/test.csv',
        section: 'quality',
        analyzer: 'CompletenessAnalyzer',
        rowIndex: 100,
        columnIndex: 5,
        columnName: 'email',
        operationName: 'validateEmail',
        memoryUsage: 1024,
        timeElapsed: 5000,
        retryCount: 2,
        option: 'strict',
        options: 'encoding=utf8,delimiter=,',
        rowCount: 10000,
        value: 'invalid@email',
        maximum: 100,
        minimum: 0,
        allowedValues: ['value1', 'value2', 'value3'],
        minLength: 5,
        maxLength: 50,
      };

      expect(fullContext.filePath).toBe('/data/test.csv');
      expect(fullContext.retryCount).toBe(2);
      expect(fullContext.allowedValues).toHaveLength(3);
      expect(fullContext.memoryUsage).toBe(1024);
    });

    it('should work with minimal context', () => {
      const minimalContext: ErrorContext = {
        filePath: '/data/test.csv',
      };

      expect(minimalContext.filePath).toBe('/data/test.csv');
      expect(minimalContext.rowIndex).toBeUndefined();
    });
  });
});