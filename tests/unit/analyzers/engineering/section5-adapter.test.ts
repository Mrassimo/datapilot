/**
 * Section 5 Engineering Adapter Tests
 *
 * Tests the V1 → V2 conversion for Data Engineering analysis
 * Verifies type optimizations and memory calculations
 */

import { Section5Adapter } from '../../../../src/analyzers/engineering/section5-adapter';
import type { DataEngineeringAnalysis } from '../../../../src/analyzers/engineering/types';
import type { Section5EngineeringV2 } from '../../../../src/analyzers/engineering/types-v2';

describe('Section5Adapter', () => {
  describe('convertToV2', () => {
    describe('Happy Path Tests', () => {
      it('should convert type optimizations correctly', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'age',
                currentType: 'int64',
                recommendedType: 'int8',
                riskLevel: 'low',
              },
              {
                columnName: 'price',
                currentType: 'float64',
                recommendedType: 'float32',
                riskLevel: 'low',
              },
              {
                columnName: 'category',
                currentType: 'object',
                recommendedType: 'category',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 10485760, // 10 MB
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.type_optimizations).toHaveLength(3);

        const ageOpt = v2Output.type_optimizations.find((opt) => opt.column === 'age');
        expect(ageOpt).toBeDefined();
        expect(ageOpt!.current_type).toBe('int64');
        expect(ageOpt!.suggested_type).toBe('int8');
        expect(ageOpt!.conversion_safe).toBe(true);
        expect(ageOpt!.memory_savings_ratio).toBeCloseTo(0.875, 3); // (8-1)/8

        const priceOpt = v2Output.type_optimizations.find((opt) => opt.column === 'price');
        expect(priceOpt).toBeDefined();
        expect(priceOpt!.memory_savings_ratio).toBe(0.5); // (8-4)/8

        const catOpt = v2Output.type_optimizations.find((opt) => opt.column === 'category');
        expect(catOpt).toBeDefined();
        expect(catOpt!.memory_savings_ratio).toBeCloseTo(0.92, 2); // (50-4)/50
      });

      it('should calculate memory estimates correctly', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 104857600, // 100 MB
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.current_memory_mb).toBeCloseTo(100, 1);
        expect(v2Output.optimized_memory_mb).toBeLessThan(100);
        expect(v2Output.memory_reduction_ratio).toBeGreaterThan(0);
        expect(v2Output.memory_reduction_ratio).toBeLessThan(1);
      });

      it('should handle low risk conversions as safe', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'safe_col',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
              {
                columnName: 'risky_col',
                currentType: 'float64',
                recommendedType: 'int32',
                riskLevel: 'high',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 10485760,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        const safeOpt = v2Output.type_optimizations.find((opt) => opt.column === 'safe_col');
        expect(safeOpt!.conversion_safe).toBe(true);

        const riskyOpt = v2Output.type_optimizations.find((opt) => opt.column === 'risky_col');
        expect(riskyOpt!.conversion_safe).toBe(false);
      });
    });

    describe('Edge Case Tests', () => {
      it('should handle empty type conversions', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 1048576, // 1 MB
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
        expect(v2Output.type_optimizations).toHaveLength(0);
        expect(v2Output.current_memory_mb).toBeCloseTo(1, 1);
      });

      it('should handle missing schemaAnalysis', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: undefined,
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations).toHaveLength(0);
        expect(v2Output.current_memory_mb).toBe(0);
      });

      it('should handle missing dataTypeConversions', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations).toHaveLength(0);
      });

      it('should handle missing currentSchema', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.current_memory_mb).toBe(0);
      });

      it('should handle zero size bytes', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 0,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.current_memory_mb).toBe(0);
        expect(v2Output.memory_reduction_ratio).toBe(0);
      });

      it('should handle very large memory sizes', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 10737418240, // 10 GB
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.current_memory_mb).toBeCloseTo(10240, 1); // 10 GB in MB
        expect(v2Output.optimized_memory_mb).toBeLessThan(v2Output.current_memory_mb);
      });

      it('should handle unknown type sizes with default', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'unknown_type',
                recommendedType: 'another_unknown',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        // Should still work with default sizes
        expect(v2Output.type_optimizations).toHaveLength(1);
        expect(v2Output.type_optimizations[0].memory_savings_ratio).toBe(0); // Same default size
      });

      it('should handle same type conversions', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int32',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations[0].memory_savings_ratio).toBe(0);
      });

      it('should handle conversions to larger types', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int8',
                recommendedType: 'int64',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        // Negative savings (actually increases memory)
        expect(v2Output.type_optimizations[0].memory_savings_ratio).toBeLessThan(0);
      });

      it('should handle missing riskLevel', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                // Missing riskLevel
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations[0].conversion_safe).toBe(false);
      });
    });

    describe('Output Validation', () => {
      it('should always have version 2.0', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 0,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.version).toBe('2.0');
      });

      it('should always have required fields defined', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 0,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations).toBeDefined();
        expect(v2Output.categorical_candidates).toBeDefined();
        expect(v2Output.interaction_features).toBeDefined();
        expect(v2Output.binning_candidates).toBeDefined();
        expect(v2Output.date_features).toBeDefined();
        expect(v2Output.current_memory_mb).toBeDefined();
        expect(v2Output.optimized_memory_mb).toBeDefined();
        expect(v2Output.memory_reduction_ratio).toBeDefined();
      });

      it('should ensure arrays are always arrays not null', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 0,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(Array.isArray(v2Output.type_optimizations)).toBe(true);
        expect(Array.isArray(v2Output.categorical_candidates)).toBe(true);
        expect(Array.isArray(v2Output.interaction_features)).toBe(true);
        expect(Array.isArray(v2Output.binning_candidates)).toBe(true);
        expect(Array.isArray(v2Output.date_features)).toBe(true);
      });

      it('should ensure numeric fields are numbers not NaN', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(Number.isNaN(v2Output.current_memory_mb)).toBe(false);
        expect(Number.isNaN(v2Output.optimized_memory_mb)).toBe(false);
        expect(Number.isNaN(v2Output.memory_reduction_ratio)).toBe(false);
        expect(Number.isNaN(v2Output.type_optimizations[0].memory_savings_ratio)).toBe(false);
      });

      it('should have memory reduction ratio between 0 and 1', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col1',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.memory_reduction_ratio).toBeGreaterThanOrEqual(0);
        expect(v2Output.memory_reduction_ratio).toBeLessThanOrEqual(1);
      });

      it('should have join_candidates undefined when empty', () => {
        const v1Input: any = {
          schemaAnalysis: {
            dataTypeConversions: [],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        };

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.join_candidates).toBeUndefined();
      });

      it('should handle all integer type sizes correctly', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col8',
                currentType: 'int8',
                recommendedType: 'bool',
                riskLevel: 'low',
              },
              {
                columnName: 'col16',
                currentType: 'int16',
                recommendedType: 'int8',
                riskLevel: 'low',
              },
              {
                columnName: 'col32',
                currentType: 'int32',
                recommendedType: 'int16',
                riskLevel: 'low',
              },
              {
                columnName: 'col64',
                currentType: 'int64',
                recommendedType: 'int32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        const col8 = v2Output.type_optimizations.find((opt) => opt.column === 'col8');
        expect(col8!.memory_savings_ratio).toBe(0); // Both 1 byte

        const col16 = v2Output.type_optimizations.find((opt) => opt.column === 'col16');
        expect(col16!.memory_savings_ratio).toBe(0.5); // (2-1)/2

        const col32 = v2Output.type_optimizations.find((opt) => opt.column === 'col32');
        expect(col32!.memory_savings_ratio).toBe(0.5); // (4-2)/4

        const col64 = v2Output.type_optimizations.find((opt) => opt.column === 'col64');
        expect(col64!.memory_savings_ratio).toBe(0.5); // (8-4)/8
      });

      it('should handle float type sizes correctly', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'col_float64',
                currentType: 'float64',
                recommendedType: 'float32',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        expect(v2Output.type_optimizations[0].memory_savings_ratio).toBe(0.5); // (8-4)/8
      });

      it('should handle string to category conversion', () => {
        const v1Input: DataEngineeringAnalysis = {
          schemaAnalysis: {
            dataTypeConversions: [
              {
                columnName: 'category_col',
                currentType: 'string',
                recommendedType: 'category',
                riskLevel: 'low',
              },
            ],
            currentSchema: {
              estimatedSizeBytes: 1048576,
            },
          },
        } as any;

        const v2Output = Section5Adapter.convertToV2(v1Input);

        // String (50) to category (4) = 92% savings
        expect(v2Output.type_optimizations[0].memory_savings_ratio).toBeCloseTo(0.92, 2);
      });
    });
  });
});
