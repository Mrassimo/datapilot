/**
 * Confidence Standards Tests
 * Tests centralized confidence metrics definitions and interpretation
 */

import {
  CONFIDENCE_STANDARDS,
  ConfidenceInterpreter,
  type ConfidenceMetric,
} from '../../../src/core/confidence-standards';

describe('Confidence Standards', () => {

  describe('Confidence Standards Registry', () => {
    it('should contain all expected confidence metrics', () => {
      const expectedMetrics = [
        'PARSING_CONFIDENCE',
        'TYPE_DETECTION_CONFIDENCE',
        'VISUALIZATION_CONFIDENCE',
        'QUALITY_SCORE_CONFIDENCE',
        'ML_READINESS_CONFIDENCE',
        'MODELING_TASK_CONFIDENCE',
      ];

      expectedMetrics.forEach(metric => {
        expect(CONFIDENCE_STANDARDS[metric]).toBeDefined();
      });
    });

    it('should have valid confidence metric structures', () => {
      Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
        expect(metric).toEqual({
          name: expect.any(String),
          section: expect.any(String),
          description: expect.any(String),
          methodology: expect.any(String),
          scale: expect.any(String),
          interpretation: expect.objectContaining({
            high: expect.any(String),
            medium: expect.any(String),
            low: expect.any(String),
          }),
          factors: expect.any(Array),
        });

        expect(metric.factors.length).toBeGreaterThan(0);
        expect(metric.name).toBeTruthy();
        expect(metric.section).toBeTruthy();
      });
    });

    it('should map to correct sections', () => {
      expect(CONFIDENCE_STANDARDS.PARSING_CONFIDENCE.section).toBe('Section 1 - Overview');
      expect(CONFIDENCE_STANDARDS.TYPE_DETECTION_CONFIDENCE.section).toBe('Section 3 - EDA');
      expect(CONFIDENCE_STANDARDS.VISUALIZATION_CONFIDENCE.section).toBe('Section 4 - Visualization');
      expect(CONFIDENCE_STANDARDS.QUALITY_SCORE_CONFIDENCE.section).toBe('Section 2 - Quality');
      expect(CONFIDENCE_STANDARDS.ML_READINESS_CONFIDENCE.section).toBe('Section 5 - Engineering');
      expect(CONFIDENCE_STANDARDS.MODELING_TASK_CONFIDENCE.section).toBe('Section 6 - Modeling');
    });
  });

  describe('Parsing Confidence', () => {
    const parsingMetric = CONFIDENCE_STANDARDS.PARSING_CONFIDENCE;

    it('should have appropriate scale and methodology', () => {
      expect(parsingMetric.scale).toContain('0-100%');
      expect(parsingMetric.scale).toContain('95%');
      expect(parsingMetric.scale).toContain('75%');
      expect(parsingMetric.scale).toContain('50%');
      expect(parsingMetric.methodology).toContain('Statistical analysis');
    });

    it('should have relevant factors', () => {
      expect(parsingMetric.factors).toContain('Character frequency analysis');
      expect(parsingMetric.factors).toContain('Field consistency scoring');
      expect(parsingMetric.factors).toContain('Pattern recognition');
    });

    it('should have clear interpretation levels', () => {
      expect(parsingMetric.interpretation.high).toContain('95%+');
      expect(parsingMetric.interpretation.medium).toContain('75-94%');
      expect(parsingMetric.interpretation.low).toContain('50-74%');
    });
  });

  describe('Type Detection Confidence', () => {
    const typeMetric = CONFIDENCE_STANDARDS.TYPE_DETECTION_CONFIDENCE;

    it('should use decimal scale', () => {
      expect(typeMetric.scale).toContain('0.0-1.0');
      expect(typeMetric.scale).toContain('decimal');
      expect(typeMetric.methodology).toContain('Rule-based classification');
    });

    it('should have semantic analysis factors', () => {
      expect(typeMetric.factors).toContain('Column name analysis');
      expect(typeMetric.factors).toContain('Value pattern matching');
      expect(typeMetric.factors).toContain('Statistical distribution analysis');
      expect(typeMetric.factors).toContain('Domain knowledge rules');
    });

    it('should have appropriate decimal thresholds', () => {
      expect(typeMetric.interpretation.high).toContain('0.85+');
      expect(typeMetric.interpretation.medium).toContain('0.65-0.84');
      expect(typeMetric.interpretation.low).toContain('0.0-0.64');
    });
  });

  describe('Visualization Confidence', () => {
    const vizMetric = CONFIDENCE_STANDARDS.VISUALIZATION_CONFIDENCE;

    it('should focus on chart type recommendations', () => {
      expect(vizMetric.description).toContain('chart type');
      expect(vizMetric.description).toContain('visualization recommendations');
      expect(vizMetric.methodology).toContain('Multi-factor scoring');
    });

    it('should include visualization-specific factors', () => {
      expect(vizMetric.factors).toContain('Data type compatibility');
      expect(vizMetric.factors).toContain('Variable count');
      expect(vizMetric.factors).toContain('Statistical distribution');
      expect(vizMetric.factors).toContain('Accessibility requirements');
      expect(vizMetric.factors).toContain('Performance considerations');
    });

    it('should have reasonable confidence thresholds', () => {
      expect(vizMetric.interpretation.high).toContain('0.9+');
      expect(vizMetric.interpretation.medium).toContain('0.7-0.89');
      expect(vizMetric.interpretation.low).toContain('0.0-0.69');
    });
  });

  describe('Quality Score Confidence', () => {
    const qualityMetric = CONFIDENCE_STANDARDS.QUALITY_SCORE_CONFIDENCE;

    it('should be based on completeness of assessment', () => {
      expect(qualityMetric.description).toContain('composite data quality score');
      expect(qualityMetric.methodology).toContain('Weighted average');
      expect(qualityMetric.methodology).toContain('uncertainty propagation');
    });

    it('should relate to quality dimension coverage', () => {
      expect(qualityMetric.interpretation.high).toContain('10 quality dimensions');
      expect(qualityMetric.interpretation.medium).toContain('7-9 quality dimensions');
      expect(qualityMetric.interpretation.low).toContain('<7 quality dimensions');
    });

    it('should have quality-specific factors', () => {
      expect(qualityMetric.factors).toContain('Data completeness');
      expect(qualityMetric.factors).toContain('Sample size');
      expect(qualityMetric.factors).toContain('Quality dimension coverage');
      expect(qualityMetric.factors).toContain('Business rule availability');
    });
  });

  describe('ML Readiness Confidence', () => {
    const mlMetric = CONFIDENCE_STANDARDS.ML_READINESS_CONFIDENCE;

    it('should focus on machine learning readiness', () => {
      expect(mlMetric.description).toContain('machine learning readiness');
      expect(mlMetric.methodology).toContain('Composite scoring');
      expect(mlMetric.methodology).toContain('technical constraints');
    });

    it('should have ML-specific factors', () => {
      expect(mlMetric.factors).toContain('Feature count and quality');
      expect(mlMetric.factors).toContain('Data volume');
      expect(mlMetric.factors).toContain('Missing value patterns');
      expect(mlMetric.factors).toContain('Feature correlation structure');
      expect(mlMetric.factors).toContain('Technical infrastructure');
    });

    it('should use 0-100 scale', () => {
      expect(mlMetric.scale).toContain('0-100 score');
      expect(mlMetric.scale).toContain('implicit confidence');
    });
  });

  describe('Modeling Task Confidence', () => {
    const modelingMetric = CONFIDENCE_STANDARDS.MODELING_TASK_CONFIDENCE;

    it('should use categorical scale', () => {
      expect(modelingMetric.scale).toContain('Categorical');
      expect(modelingMetric.scale).toContain('very_high, high, medium, low');
    });

    it('should focus on task identification', () => {
      expect(modelingMetric.description).toContain('modeling task identification');
      expect(modelingMetric.description).toContain('algorithm recommendations');
      expect(modelingMetric.methodology).toContain('Domain analysis');
    });

    it('should have modeling-specific factors', () => {
      expect(modelingMetric.factors).toContain('Target variable clarity');
      expect(modelingMetric.factors).toContain('Domain context');
      expect(modelingMetric.factors).toContain('Data characteristics');
      expect(modelingMetric.factors).toContain('Problem type recognition');
      expect(modelingMetric.factors).toContain('Algorithm requirements');
    });
  });

  describe('ConfidenceInterpreter', () => {
    describe('Explanation Generation', () => {
      it('should explain parsing confidence levels correctly', () => {
        const highExplanation = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 96);
        const mediumExplanation = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 80);
        const lowExplanation = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 60);

        expect(highExplanation).toContain('95%+');
        expect(highExplanation).toContain('strong statistical evidence');
        expect(mediumExplanation).toContain('75-94%');
        expect(mediumExplanation).toContain('moderate evidence');
        expect(lowExplanation).toContain('50-74%');
        expect(lowExplanation).toContain('weak evidence');
      });

      it('should explain decimal-based confidence correctly', () => {
        const highExplanation = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.9);
        const mediumExplanation = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.75);
        const lowExplanation = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.5);

        expect(highExplanation).toContain('0.85+');
        expect(highExplanation).toContain('Strong evidence');
        expect(mediumExplanation).toContain('0.65-0.84');
        expect(mediumExplanation).toContain('Moderate evidence');
        expect(lowExplanation).toContain('0.0-0.64');
        expect(lowExplanation).toContain('Weak evidence');
      });

      it('should handle unknown metric types', () => {
        const explanation = ConfidenceInterpreter.explain('UNKNOWN_METRIC' as any, 0.8);
        expect(explanation).toBe('Unknown confidence metric');
      });

      it('should include methodology in explanations', () => {
        const explanation = ConfidenceInterpreter.explain('VISUALIZATION_CONFIDENCE', 0.9);
        expect(explanation).toContain('Multi-factor scoring');
      });

      it('should handle string values gracefully', () => {
        const explanation = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 'high' as any);
        expect(explanation).toContain('Weak evidence'); // Should default to low for non-numeric
      });
    });

    describe('Documentation Generation', () => {
      it('should generate complete documentation', () => {
        const documentation = ConfidenceInterpreter.getDocumentation();

        expect(documentation).toContain('# DataPilot Confidence Metrics Documentation');
        
        // Should contain all metrics
        Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
          expect(documentation).toContain(metric.name);
          expect(documentation).toContain(metric.description);
          expect(documentation).toContain(metric.methodology);
          expect(documentation).toContain(metric.interpretation.high);
          expect(documentation).toContain(metric.interpretation.medium);
          expect(documentation).toContain(metric.interpretation.low);
        });
      });

      it('should format documentation with proper markdown', () => {
        const documentation = ConfidenceInterpreter.getDocumentation();

        expect(documentation).toContain('**Parsing Confidence**');
        expect(documentation).toContain('- Description:');
        expect(documentation).toContain('- Methodology:');
        expect(documentation).toContain('- Scale:');
        expect(documentation).toContain('- High:');
        expect(documentation).toContain('- Medium:');
        expect(documentation).toContain('- Low:');
        expect(documentation).toContain('- Factors:');
      });

      it('should include all confidence metric factors', () => {
        const documentation = ConfidenceInterpreter.getDocumentation();

        Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
          metric.factors.forEach(factor => {
            expect(documentation).toContain(factor);
          });
        });
      });
    });
  });

  describe('Confidence Metric Consistency', () => {
    it('should have consistent naming conventions', () => {
      Object.keys(CONFIDENCE_STANDARDS).forEach(key => {
        expect(key).toMatch(/^[A-Z_]+_CONFIDENCE$/);
      });
    });

    it('should have consistent interpretation structure', () => {
      Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
        expect(metric.interpretation).toHaveProperty('high');
        expect(metric.interpretation).toHaveProperty('medium');
        expect(metric.interpretation).toHaveProperty('low');
        
        expect(typeof metric.interpretation.high).toBe('string');
        expect(typeof metric.interpretation.medium).toBe('string');
        expect(typeof metric.interpretation.low).toBe('string');
        
        expect(metric.interpretation.high.length).toBeGreaterThan(0);
        expect(metric.interpretation.medium.length).toBeGreaterThan(0);
        expect(metric.interpretation.low.length).toBeGreaterThan(0);
      });
    });

    it('should have meaningful factor lists', () => {
      Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
        expect(metric.factors).toBeInstanceOf(Array);
        expect(metric.factors.length).toBeGreaterThan(0);
        expect(metric.factors.length).toBeLessThanOrEqual(10); // Reasonable upper limit
        
        metric.factors.forEach(factor => {
          expect(typeof factor).toBe('string');
          expect(factor.length).toBeGreaterThan(3); // Should be meaningful
        });
      });
    });

    it('should have appropriate section mappings', () => {
      const sectionPattern = /^Section \d+ - \w+$/;
      
      Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
        expect(metric.section).toMatch(sectionPattern);
      });

      // Check for expected sections
      const sections = Object.values(CONFIDENCE_STANDARDS).map(m => m.section);
      expect(sections).toContain('Section 1 - Overview');
      expect(sections).toContain('Section 2 - Quality');
      expect(sections).toContain('Section 3 - EDA');
      expect(sections).toContain('Section 4 - Visualization');
      expect(sections).toContain('Section 5 - Engineering');
      expect(sections).toContain('Section 6 - Modeling');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle boundary values in interpretation', () => {
      // Test exact boundary values for parsing confidence
      const boundary95 = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 95);
      const boundary94 = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 94);
      const boundary75 = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 75);
      const boundary74 = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 74);

      expect(boundary95).toContain('95%+'); // Should be high
      expect(boundary94).toContain('75-94%'); // Should be medium
      expect(boundary75).toContain('75-94%'); // Should be medium
      expect(boundary74).toContain('50-74%'); // Should be low
    });

    it('should handle boundary values for decimal scales', () => {
      const boundary085 = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.85);
      const boundary084 = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.84);
      const boundary065 = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.65);
      const boundary064 = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0.64);

      expect(boundary085).toContain('0.85+'); // Should be high
      expect(boundary084).toContain('0.65-0.84'); // Should be medium
      expect(boundary065).toContain('0.65-0.84'); // Should be medium
      expect(boundary064).toContain('0.0-0.64'); // Should be low
    });

    it('should handle extreme values gracefully', () => {
      const veryHigh = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', 150);
      const veryLow = ConfidenceInterpreter.explain('PARSING_CONFIDENCE', -10);
      const zero = ConfidenceInterpreter.explain('TYPE_DETECTION_CONFIDENCE', 0);

      expect(veryHigh).toContain('95%+'); // Should clamp to high
      expect(veryLow).toContain('50-74%'); // Should clamp to low
      expect(zero).toContain('0.0-0.64'); // Should be low
    });

    it('should validate confidence metric completeness', () => {
      Object.values(CONFIDENCE_STANDARDS).forEach(metric => {
        // All required fields should be present and non-empty
        expect(metric.name.trim()).toBeTruthy();
        expect(metric.section.trim()).toBeTruthy();
        expect(metric.description.trim()).toBeTruthy();
        expect(metric.methodology.trim()).toBeTruthy();
        expect(metric.scale.trim()).toBeTruthy();
        
        // All interpretation levels should be meaningful
        expect(metric.interpretation.high.trim()).toBeTruthy();
        expect(metric.interpretation.medium.trim()).toBeTruthy();
        expect(metric.interpretation.low.trim()).toBeTruthy();
        
        // Factors should be unique
        const uniqueFactors = new Set(metric.factors);
        expect(uniqueFactors.size).toBe(metric.factors.length);
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with typed confidence metric interfaces', () => {
      const testMetric: ConfidenceMetric = {
        name: 'Test Confidence',
        section: 'Section 1 - Test',
        description: 'Test confidence metric',
        methodology: 'Test methodology',
        scale: '0-100%',
        interpretation: {
          high: 'High confidence interpretation',
          medium: 'Medium confidence interpretation',
          low: 'Low confidence interpretation',
        },
        factors: ['Factor 1', 'Factor 2'],
      };

      expect(testMetric.name).toBe('Test Confidence');
      expect(testMetric.factors).toHaveLength(2);
      expect(testMetric.interpretation.high).toContain('High confidence');
    });

    it('should enforce proper key types for CONFIDENCE_STANDARDS', () => {
      // Type checking - these should compile correctly
      const parsingKey: keyof typeof CONFIDENCE_STANDARDS = 'PARSING_CONFIDENCE';
      const typeKey: keyof typeof CONFIDENCE_STANDARDS = 'TYPE_DETECTION_CONFIDENCE';
      
      expect(CONFIDENCE_STANDARDS[parsingKey]).toBeDefined();
      expect(CONFIDENCE_STANDARDS[typeKey]).toBeDefined();
    });
  });
});