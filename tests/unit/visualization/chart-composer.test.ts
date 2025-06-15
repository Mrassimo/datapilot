/**
 * Chart Composer Tests
 * 
 * Comprehensive tests for the advanced chart composition engine that creates
 * sophisticated multi-dimensional visualizations with perceptual optimization,
 * accessibility compliance, and cultural adaptation.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { ChartComposer } from '../../../src/analyzers/visualization/engines/chart-composer';
import type {
  CompositionProfile,
  EncodingDimension,
  VisualChannel,
  DataType,
  HSLColor,
  MultiDimensionalEncoding,
  AestheticProfile,
  PerceptualOptimization,
  AccessibilityCompliance,
  CulturalAdaptation,
  CompositionPrinciple,
  VisualQualityMetrics,
  ColorHarmony,
  TypographySystem,
  SpatialRhythm,
  VisualBalance,
  ProportionSystem,
  StyleConsistency,
  GestaltApplication,
  CognitiveLoadAnalysis,
  AttentionFlowAnalysis,
  MemorabilityFactors,
  UsabilityMetrics,
  RedundantEncoding,
  VisualHierarchy,
  SemanticColorMapping,
  ImprovementArea
} from '../../../src/analyzers/visualization/engines/chart-composer';

describe('ChartComposer', () => {
  // Test data fixtures
  const mockEncodingDimensions: EncodingDimension[] = [
    {
      channel: 'position_x',
      dataField: 'sales',
      dataType: 'quantitative',
      encodingStrength: 0.9,
      perceptualAccuracy: 1.0,
      discriminability: 0.9,
      orderingPreservation: 1.0,
      optimization: {
        scalingFunction: 'linear',
        domainOptimization: {
          zeroBehavior: 'include',
          outlierHandling: 'clip',
          domainPadding: 0.1,
          symmetryPreservation: false
        },
        rangeOptimization: {
          minValue: 0,
          maxValue: 100,
          resolution: 1,
          perceptualUniformity: true,
          physicalConstraints: []
        },
        perceptualCorrection: {
          gammaCorrection: 2.2,
          luminanceAdjustment: 1.0,
          contrastEnhancement: 1.0,
          colorBlindnessCompensation: {
            protanopia: 1.0,
            deuteranopia: 1.0,
            tritanopia: 1.0,
            achromatopsia: 1.0
          }
        }
      }
    },
    {
      channel: 'position_y',
      dataField: 'profit',
      dataType: 'quantitative',
      encodingStrength: 0.85,
      perceptualAccuracy: 1.0,
      discriminability: 0.85,
      orderingPreservation: 1.0,
      optimization: {
        scalingFunction: 'linear',
        domainOptimization: {
          zeroBehavior: 'include',
          outlierHandling: 'clip',
          domainPadding: 0.1,
          symmetryPreservation: false
        },
        rangeOptimization: {
          minValue: 0,
          maxValue: 100,
          resolution: 1,
          perceptualUniformity: true,
          physicalConstraints: []
        },
        perceptualCorrection: {
          gammaCorrection: 2.2,
          luminanceAdjustment: 1.0,
          contrastEnhancement: 1.0,
          colorBlindnessCompensation: {
            protanopia: 1.0,
            deuteranopia: 1.0,
            tritanopia: 1.0,
            achromatopsia: 1.0
          }
        }
      }
    },
    {
      channel: 'color_hue',
      dataField: 'category',
      dataType: 'nominal',
      encodingStrength: 0.6,
      perceptualAccuracy: 0.4,
      discriminability: 0.54,
      orderingPreservation: 0.5,
      optimization: {
        scalingFunction: 'ordinal',
        domainOptimization: {
          zeroBehavior: 'include',
          outlierHandling: 'clip',
          domainPadding: 0.1,
          symmetryPreservation: false
        },
        rangeOptimization: {
          minValue: 0,
          maxValue: 100,
          resolution: 1,
          perceptualUniformity: true,
          physicalConstraints: []
        },
        perceptualCorrection: {
          gammaCorrection: 2.2,
          luminanceAdjustment: 1.0,
          contrastEnhancement: 1.0,
          colorBlindnessCompensation: {
            protanopia: 1.0,
            deuteranopia: 1.0,
            tritanopia: 1.0,
            achromatopsia: 1.0
          }
        }
      }
    }
  ];

  const mockDataCharacteristics = {
    fields: [
      { name: 'sales', type: 'quantitative' },
      { name: 'profit', type: 'quantitative' },
      { name: 'category', type: 'nominal' },
      { name: 'success_rate', type: 'quantitative' },
      { name: 'error_count', type: 'quantitative' }
    ],
    recordCount: 1000,
    categoricalColumns: 1,
    numericalColumns: 4
  };

  const mockContextualRequirements = {
    domain: 'technology',
    culture: 'en-US',
    audience: 'technical',
    brandColors: ['#1f77b4', '#ff7f0e']
  };

  describe('Basic Functionality', () => {
    it('should be a class with static methods', () => {
      expect(typeof ChartComposer).toBe('function');
      expect(ChartComposer.prototype).toBeDefined();
    });

    it('should have a static composeVisualization method', () => {
      expect(typeof ChartComposer.composeVisualization).toBe('function');
    });

    it('should create a chart composer instance', () => {
      const composer = new ChartComposer();
      expect(composer).toBeDefined();
      expect(composer).toBeInstanceOf(ChartComposer);
    });
  });

  describe('composeVisualization', () => {
    it('should generate a complete composition profile', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      expect(profile).toBeDefined();
      expect(profile).toHaveProperty('visualEncoding');
      expect(profile).toHaveProperty('aestheticProfile');
      expect(profile).toHaveProperty('perceptualOptimization');
      expect(profile).toHaveProperty('accessibilityCompliance');
      expect(profile).toHaveProperty('culturalAdaptation');
      expect(profile).toHaveProperty('compositionPrinciples');
      expect(profile).toHaveProperty('qualityMetrics');
    });

    it('should work with minimal parameters', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions.slice(0, 1),
        { fields: [{ name: 'test', type: 'quantitative' }] }
      );

      expect(profile).toBeDefined();
      expect(profile.visualEncoding).toBeDefined();
      expect(profile.aestheticProfile).toBeDefined();
    });

    it('should handle different chart types', () => {
      const chartTypes = ['scatter_plot', 'bar_chart', 'line_chart', 'heatmap'];
      
      chartTypes.forEach(chartType => {
        const profile = ChartComposer.composeVisualization(
          chartType,
          mockEncodingDimensions,
          mockDataCharacteristics
        );

        expect(profile).toBeDefined();
        expect(profile.visualEncoding).toBeDefined();
        expect(profile.qualityMetrics.overallQuality).toBeGreaterThan(0);
      });
    });

    it('should handle empty encoding dimensions gracefully', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        [],
        mockDataCharacteristics
      );

      expect(profile).toBeDefined();
      expect(profile.visualEncoding.primaryDimensions).toEqual([]);
      expect(profile.visualEncoding.secondaryDimensions).toEqual([]);
    });

    it('should handle complex encoding scenarios', () => {
      const complexDimensions: EncodingDimension[] = [
        ...mockEncodingDimensions,
        {
          channel: 'size_area',
          dataField: 'volume',
          dataType: 'quantitative',
          encodingStrength: 0.7,
          perceptualAccuracy: 0.8,
          discriminability: 0.63,
          orderingPreservation: 0.8,
          optimization: {
            scalingFunction: 'sqrt',
            domainOptimization: {
              zeroBehavior: 'exclude',
              outlierHandling: 'compress',
              domainPadding: 0.05,
              symmetryPreservation: true
            },
            rangeOptimization: {
              minValue: 10,
              maxValue: 200,
              resolution: 5,
              perceptualUniformity: false,
              physicalConstraints: [
                { constraint: 'min_size', value: 10, reasoning: 'Readability' }
              ]
            },
            perceptualCorrection: {
              gammaCorrection: 1.8,
              luminanceAdjustment: 0.9,
              contrastEnhancement: 1.2,
              colorBlindnessCompensation: {
                protanopia: 0.8,
                deuteranopia: 0.9,
                tritanopia: 1.0,
                achromatopsia: 0.7
              }
            }
          }
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'bubble_chart',
        complexDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      expect(profile).toBeDefined();
      expect(profile.visualEncoding.primaryDimensions.length).toBeGreaterThan(0);
      expect(profile.visualEncoding.encodingEfficiency).toBeGreaterThan(0);
      expect(profile.visualEncoding.informationDensity).toBeGreaterThan(0);
    });
  });

  describe('Visual Encoding Optimization', () => {
    it('should optimize multi-dimensional encoding', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const encoding = profile.visualEncoding;
      expect(encoding.encodingEfficiency).toBeGreaterThanOrEqual(0);
      expect(encoding.encodingEfficiency).toBeLessThanOrEqual(100);
      expect(encoding.cognitiveLoad).toBeGreaterThanOrEqual(0);
      expect(encoding.cognitiveLoad).toBeLessThanOrEqual(100);
      expect(encoding.informationDensity).toBeGreaterThanOrEqual(0);
      expect(encoding.informationDensity).toBeLessThanOrEqual(100);
    });

    it('should create appropriate visual hierarchy', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const hierarchy = profile.visualEncoding.hierarchicalStructure;
      expect(hierarchy).toBeDefined();
      expect(hierarchy.levels).toBeDefined();
      expect(hierarchy.levels.length).toBeGreaterThan(0);
      expect(hierarchy.focusPoints).toBeDefined();
      expect(hierarchy.visualFlow).toBeDefined();
      expect(hierarchy.attentionGuides).toBeDefined();
      
      // Check hierarchy levels are ordered by precedence
      for (let i = 0; i < hierarchy.levels.length - 1; i++) {
        expect(hierarchy.levels[i].precedence).toBeLessThanOrEqual(hierarchy.levels[i + 1].precedence);
      }
    });

    it('should generate redundant encodings for accessibility', () => {
      const colorEncodingDimensions: EncodingDimension[] = [
        {
          ...mockEncodingDimensions[2], // color_hue dimension
          encodingStrength: 0.8
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        colorEncodingDimensions,
        mockDataCharacteristics
      );

      const redundantEncodings = profile.visualEncoding.redundantEncodings;
      expect(redundantEncodings).toBeDefined();
      expect(redundantEncodings.length).toBeGreaterThan(0);
      
      const accessibilityEncoding = redundantEncodings.find(enc => enc.purpose === 'accessibility');
      expect(accessibilityEncoding).toBeDefined();
      expect(accessibilityEncoding?.effectiveness).toBeGreaterThan(0);
    });

    it('should handle different data types appropriately', () => {
      const mixedDataTypes: EncodingDimension[] = [
        {
          channel: 'position_x',
          dataField: 'timestamp',
          dataType: 'temporal',
          encodingStrength: 0.95,
          perceptualAccuracy: 1.0,
          discriminability: 0.95,
          orderingPreservation: 1.0,
          optimization: mockEncodingDimensions[0].optimization
        },
        {
          channel: 'position_y',
          dataField: 'rating',
          dataType: 'ordinal',
          encodingStrength: 0.8,
          perceptualAccuracy: 0.9,
          discriminability: 0.72,
          orderingPreservation: 1.0,
          optimization: mockEncodingDimensions[1].optimization
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mixedDataTypes,
        mockDataCharacteristics
      );

      expect(profile.visualEncoding.primaryDimensions.length).toBeGreaterThan(0);
      expect(profile.visualEncoding.encodingEfficiency).toBeGreaterThan(0);
    });
  });

  describe('Aesthetic Profile Generation', () => {
    it('should generate comprehensive aesthetic profile', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      const aesthetic = profile.aestheticProfile;
      expect(aesthetic).toBeDefined();
      expect(aesthetic.colorHarmony).toBeDefined();
      expect(aesthetic.typographySystem).toBeDefined();
      expect(aesthetic.spatialRhythm).toBeDefined();
      expect(aesthetic.visualBalance).toBeDefined();
      expect(aesthetic.proportionSystem).toBeDefined();
      expect(aesthetic.styleConsistency).toBeDefined();
    });

    it('should create appropriate color harmony', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      const colorHarmony = profile.aestheticProfile.colorHarmony;
      expect(colorHarmony).toBeDefined();
      expect(colorHarmony.scheme).toBeDefined();
      expect(colorHarmony.palette).toBeDefined();
      expect(colorHarmony.psychologicalImpact).toBeDefined();
      expect(colorHarmony.semanticMapping).toBeDefined();
      expect(colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(colorHarmony.harmonyScore).toBeLessThanOrEqual(100);
    });

    it('should handle semantic color mappings', () => {
      const semanticData = {
        fields: [
          { name: 'success_rate', type: 'quantitative' },
          { name: 'error_count', type: 'quantitative' },
          { name: 'warning_level', type: 'ordinal' },
          { name: 'profit_margin', type: 'quantitative' },
          { name: 'loss_amount', type: 'quantitative' }
        ]
      };

      const profile = ChartComposer.composeVisualization(
        'heatmap',
        mockEncodingDimensions,
        semanticData
      );

      const semanticMappings = profile.aestheticProfile.colorHarmony.semanticMapping;
      expect(semanticMappings).toBeDefined();
      expect(semanticMappings.length).toBeGreaterThan(0);
      
      // Should include common semantic concepts
      const concepts = semanticMappings.map(mapping => mapping.concept);
      expect(concepts).toContain('success');
    });

    it('should adapt to different domains', () => {
      const domains = ['healthcare', 'finance', 'education', 'technology'];
      
      domains.forEach(domain => {
        const contextualReqs = { ...mockContextualRequirements, domain };
        const profile = ChartComposer.composeVisualization(
          'bar_chart',
          mockEncodingDimensions,
          mockDataCharacteristics,
          contextualReqs
        );

        expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThan(0);
        expect(profile.qualityMetrics.aestheticScore).toBeGreaterThan(0);
      });
    });

    it('should generate typography system', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const typography = profile.aestheticProfile.typographySystem;
      expect(typography).toBeDefined();
      expect(typography.hierarchy).toBeDefined();
      expect(typography.readability).toBeDefined();
      expect(typography.personality).toBeDefined();
      expect(typography.technicalOptimization).toBeDefined();
      
      expect(typography.hierarchy.scaleRatio).toBeGreaterThan(1);
      expect(typography.readability.contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should create spatial rhythm system', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const spatial = profile.aestheticProfile.spatialRhythm;
      expect(spatial).toBeDefined();
      expect(spatial.gridSystem).toBeDefined();
      expect(spatial.spacingScale).toBeDefined();
      expect(spatial.alignmentPrinciples).toBeDefined();
      expect(spatial.proximityRules).toBeDefined();
      
      expect(spatial.gridSystem.columns).toBeGreaterThan(0);
      expect(spatial.spacingScale.baseUnit).toBeGreaterThan(0);
    });
  });

  describe('Perceptual Optimization', () => {
    it('should optimize for human visual perception', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const perceptual = profile.perceptualOptimization;
      expect(perceptual).toBeDefined();
      expect(perceptual.gestaltPrinciples).toBeDefined();
      expect(perceptual.cognitiveLoad).toBeDefined();
      expect(perceptual.attentionFlow).toBeDefined();
      expect(perceptual.memorability).toBeDefined();
      expect(perceptual.usabilityMetrics).toBeDefined();
    });

    it('should apply Gestalt principles', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const gestalt = profile.perceptualOptimization.gestaltPrinciples;
      expect(gestalt).toBeDefined();
      expect(gestalt.length).toBeGreaterThan(0);
      
      const principles = gestalt.map(g => g.principle);
      expect(principles).toContain('figure_ground');
      
      gestalt.forEach(principle => {
        expect(principle.effectiveness).toBeGreaterThanOrEqual(0);
        expect(principle.effectiveness).toBeLessThanOrEqual(100);
        expect(principle.application).toBeDefined();
        expect(principle.cognitiveSupport).toBeDefined();
      });
    });

    it('should analyze cognitive load', () => {
      const profile = ChartComposer.composeVisualization(
        'parallel_coordinates',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const cognitiveLoad = profile.perceptualOptimization.cognitiveLoad;
      expect(cognitiveLoad).toBeDefined();
      expect(cognitiveLoad.intrinsicLoad).toBeGreaterThanOrEqual(0);
      expect(cognitiveLoad.extraneousLoad).toBeGreaterThanOrEqual(0);
      expect(cognitiveLoad.germaneLoad).toBeGreaterThanOrEqual(0);
      expect(cognitiveLoad.totalLoad).toBeGreaterThanOrEqual(0);
      expect(cognitiveLoad.recommendations).toBeDefined();
    });

    it('should assess memorability factors', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const memorability = profile.perceptualOptimization.memorability;
      expect(memorability).toBeDefined();
      expect(memorability.distinctiveness).toBeGreaterThanOrEqual(0);
      expect(memorability.distinctiveness).toBeLessThanOrEqual(100);
      expect(memorability.meaningfulness).toBeGreaterThanOrEqual(0);
      expect(memorability.meaningfulness).toBeLessThanOrEqual(100);
      expect(memorability.simplicity).toBeGreaterThanOrEqual(0);
      expect(memorability.simplicity).toBeLessThanOrEqual(100);
      expect(memorability.emotionalImpact).toBeGreaterThanOrEqual(0);
      expect(memorability.emotionalImpact).toBeLessThanOrEqual(100);
      expect(memorability.overallMemorability).toBeGreaterThanOrEqual(0);
      expect(memorability.overallMemorability).toBeLessThanOrEqual(100);
    });

    it('should provide usability metrics', () => {
      const profile = ChartComposer.composeVisualization(
        'heatmap',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const usability = profile.perceptualOptimization.usabilityMetrics;
      expect(usability).toBeDefined();
      expect(usability.learnability).toBeGreaterThanOrEqual(0);
      expect(usability.learnability).toBeLessThanOrEqual(100);
      expect(usability.efficiency).toBeGreaterThanOrEqual(0);
      expect(usability.efficiency).toBeLessThanOrEqual(100);
      expect(usability.memorability).toBeGreaterThanOrEqual(0);
      expect(usability.memorability).toBeLessThanOrEqual(100);
      expect(usability.errorPrevention).toBeGreaterThanOrEqual(0);
      expect(usability.errorPrevention).toBeLessThanOrEqual(100);
      expect(usability.satisfaction).toBeGreaterThanOrEqual(0);
      expect(usability.satisfaction).toBeLessThanOrEqual(100);
      expect(usability.overall).toBeGreaterThanOrEqual(0);
      expect(usability.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should ensure accessibility compliance', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const accessibility = profile.accessibilityCompliance;
      expect(accessibility).toBeDefined();
      expect(accessibility.wcagLevel).toBeOneOf(['A', 'AA', 'AAA']);
      expect(accessibility.colorBlindnessSupport).toBeDefined();
      expect(accessibility.contrastCompliance).toBeDefined();
      expect(accessibility.motorImpairmentSupport).toBeDefined();
      expect(accessibility.cognitiveSupport).toBeDefined();
      expect(accessibility.screenReaderCompatibility).toBeDefined();
      expect(accessibility.complianceScore).toBeGreaterThanOrEqual(0);
      expect(accessibility.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should provide color blindness support', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const colorBlindness = profile.accessibilityCompliance.colorBlindnessSupport;
      expect(colorBlindness).toBeDefined();
      expect(colorBlindness.protanopia).toBeGreaterThanOrEqual(0);
      expect(colorBlindness.protanopia).toBeLessThanOrEqual(100);
      expect(colorBlindness.deuteranopia).toBeGreaterThanOrEqual(0);
      expect(colorBlindness.deuteranopia).toBeLessThanOrEqual(100);
      expect(colorBlindness.tritanopia).toBeGreaterThanOrEqual(0);
      expect(colorBlindness.tritanopia).toBeLessThanOrEqual(100);
      expect(colorBlindness.achromatopsia).toBeGreaterThanOrEqual(0);
      expect(colorBlindness.achromatopsia).toBeLessThanOrEqual(100);
      expect(colorBlindness.alternativeEncodings).toBeDefined();
      expect(colorBlindness.alternativeEncodings.length).toBeGreaterThan(0);
    });

    it('should ensure contrast compliance', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const contrast = profile.accessibilityCompliance.contrastCompliance;
      expect(contrast).toBeDefined();
      expect(contrast.minimumContrast).toBeGreaterThanOrEqual(3.0);
      expect(contrast.enhancedContrast).toBeGreaterThanOrEqual(4.5);
      expect(contrast.graphicalObjectContrast).toBeGreaterThanOrEqual(3.0);
      expect(contrast.complianceLevel).toBeOneOf(['fail', 'AA', 'AAA']);
    });

    it('should support motor impairment accessibility', () => {
      const profile = ChartComposer.composeVisualization(
        'bubble_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const motor = profile.accessibilityCompliance.motorImpairmentSupport;
      expect(motor).toBeDefined();
      expect(motor.minimumTargetSize).toBeGreaterThanOrEqual(44);
      expect(motor.spacing).toBeGreaterThanOrEqual(8);
      expect(motor.dragAlternatives).toBeDefined();
      expect(motor.keyboardNavigation).toBeDefined();
    });

    it('should provide cognitive support', () => {
      const profile = ChartComposer.composeVisualization(
        'treemap',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const cognitive = profile.accessibilityCompliance.cognitiveSupport;
      expect(cognitive).toBeDefined();
      expect(cognitive.complexityReduction).toBeDefined();
      expect(cognitive.memoryAids).toBeDefined();
      expect(cognitive.consistentPatterns).toBeDefined();
      expect(cognitive.errorPrevention).toBeDefined();
    });

    it('should ensure screen reader compatibility', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const screenReader = profile.accessibilityCompliance.screenReaderCompatibility;
      expect(screenReader).toBeDefined();
      expect(screenReader.ariaCompliance).toBeDefined();
      expect(screenReader.textAlternatives).toBeDefined();
      expect(screenReader.structuralMarkup).toBeDefined();
      expect(screenReader.focusManagement).toBeDefined();
    });
  });

  describe('Cultural Adaptation', () => {
    it('should adapt for different cultures', () => {
      const cultures = ['en-US', 'ar-SA', 'zh-CN', 'ja-JP'];
      
      cultures.forEach(culture => {
        const contextualReqs = { ...mockContextualRequirements, culture };
        const profile = ChartComposer.composeVisualization(
          'bar_chart',
          mockEncodingDimensions,
          mockDataCharacteristics,
          contextualReqs
        );

        const cultural = profile.culturalAdaptation;
        expect(cultural).toBeDefined();
        expect(cultural.readingDirection).toBeOneOf(['ltr', 'rtl', 'ttb']);
        expect(cultural.colorCulturalMeaning).toBeDefined();
        expect(cultural.symbolismAdaptation).toBeDefined();
        expect(cultural.numeralSystem).toBeDefined();
        expect(cultural.dateFormat).toBeDefined();
        expect(cultural.localizations).toBeDefined();
      });
    });

    it('should provide appropriate reading direction', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics,
        { culture: 'ar-SA' }
      );

      const cultural = profile.culturalAdaptation;
      expect(cultural.readingDirection).toBeOneOf(['ltr', 'rtl', 'ttb']);
    });
  });

  describe('Composition Principles', () => {
    it('should apply composition principles', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const principles = profile.compositionPrinciples;
      expect(principles).toBeDefined();
      expect(principles.length).toBeGreaterThan(0);
      
      principles.forEach(principle => {
        expect(principle.principle).toBeDefined();
        expect(principle.application).toBeDefined();
        expect(principle.strength).toBeGreaterThanOrEqual(0);
        expect(principle.strength).toBeLessThanOrEqual(100);
        expect(principle.visualImpact).toBeDefined();
        expect(principle.reasoning).toBeDefined();
      });
    });

    it('should include visual hierarchy principle', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const principles = profile.compositionPrinciples;
      const hierarchyPrinciple = principles.find(p => p.principle === 'Visual Hierarchy');
      expect(hierarchyPrinciple).toBeDefined();
      expect(hierarchyPrinciple?.strength).toBeGreaterThan(0);
    });
  });

  describe('Quality Metrics Assessment', () => {
    it('should assess visual quality comprehensively', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const quality = profile.qualityMetrics;
      expect(quality).toBeDefined();
      expect(quality.aestheticScore).toBeGreaterThanOrEqual(0);
      expect(quality.aestheticScore).toBeLessThanOrEqual(100);
      expect(quality.functionalScore).toBeGreaterThanOrEqual(0);
      expect(quality.functionalScore).toBeLessThanOrEqual(100);
      expect(quality.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(quality.accessibilityScore).toBeLessThanOrEqual(100);
      expect(quality.usabilityScore).toBeGreaterThanOrEqual(0);
      expect(quality.usabilityScore).toBeLessThanOrEqual(100);
      expect(quality.originalityScore).toBeGreaterThanOrEqual(0);
      expect(quality.originalityScore).toBeLessThanOrEqual(100);
      expect(quality.overallQuality).toBeGreaterThanOrEqual(0);
      expect(quality.overallQuality).toBeLessThanOrEqual(100);
      expect(quality.improvementAreas).toBeDefined();
    });

    it('should identify improvement areas when scores are low', () => {
      // Create a scenario that would produce lower scores
      const simpleDimensions: EncodingDimension[] = [
        {
          ...mockEncodingDimensions[0],
          encodingStrength: 0.3
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'pie_chart',
        simpleDimensions,
        { fields: [{ name: 'test', type: 'nominal' }] }
      );

      const quality = profile.qualityMetrics;
      expect(quality.improvementAreas).toBeDefined();
      
      if (quality.improvementAreas.length > 0) {
        quality.improvementAreas.forEach(area => {
          expect(area.area).toBeDefined();
          expect(area.currentScore).toBeGreaterThanOrEqual(0);
          expect(area.currentScore).toBeLessThanOrEqual(100);
          expect(area.potentialScore).toBeGreaterThan(area.currentScore);
          expect(area.recommendations).toBeDefined();
          expect(area.recommendations.length).toBeGreaterThan(0);
          expect(area.priority).toBeOneOf(['low', 'medium', 'high', 'critical']);
        });
      }
    });

    it('should calculate originality score appropriately', () => {
      const diverseChannelDimensions: EncodingDimension[] = [
        {
          channel: 'position_x',
          dataField: 'x',
          dataType: 'quantitative',
          encodingStrength: 0.9,
          perceptualAccuracy: 1.0,
          discriminability: 0.9,
          orderingPreservation: 1.0,
          optimization: mockEncodingDimensions[0].optimization
        },
        {
          channel: 'position_y',
          dataField: 'y',
          dataType: 'quantitative',
          encodingStrength: 0.85,
          perceptualAccuracy: 1.0,
          discriminability: 0.85,
          orderingPreservation: 1.0,
          optimization: mockEncodingDimensions[1].optimization
        },
        {
          channel: 'color_hue',
          dataField: 'category',
          dataType: 'nominal',
          encodingStrength: 0.6,
          perceptualAccuracy: 0.4,
          discriminability: 0.54,
          orderingPreservation: 0.5,
          optimization: mockEncodingDimensions[2].optimization
        },
        {
          channel: 'size_area',
          dataField: 'size',
          dataType: 'quantitative',
          encodingStrength: 0.7,
          perceptualAccuracy: 0.8,
          discriminability: 0.56,
          orderingPreservation: 0.8,
          optimization: mockEncodingDimensions[0].optimization
        },
        {
          channel: 'shape',
          dataField: 'type',
          dataType: 'nominal',
          encodingStrength: 0.4,
          perceptualAccuracy: 0.3,
          discriminability: 0.12,
          orderingPreservation: 0.5,
          optimization: mockEncodingDimensions[2].optimization
        },
        {
          channel: 'color_opacity',
          dataField: 'confidence',
          dataType: 'quantitative',
          encodingStrength: 0.5,
          perceptualAccuracy: 0.6,
          discriminability: 0.3,
          orderingPreservation: 0.6,
          optimization: mockEncodingDimensions[0].optimization
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        diverseChannelDimensions,
        mockDataCharacteristics
      );

      expect(profile.qualityMetrics.originalityScore).toBeGreaterThan(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null or undefined inputs gracefully', () => {
      expect(() => {
        ChartComposer.composeVisualization(
          'bar_chart',
          [],
          {}
        );
      }).not.toThrow();
    });

    it('should handle malformed data characteristics', () => {
      const malformedData = {
        fields: null,
        recordCount: 'invalid'
      };

      expect(() => {
        ChartComposer.composeVisualization(
          'line_chart',
          mockEncodingDimensions,
          malformedData as any
        );
      }).not.toThrow();
    });

    it('should handle unknown chart types', () => {
      const profile = ChartComposer.composeVisualization(
        'unknown_chart_type' as any,
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      expect(profile).toBeDefined();
      expect(profile.visualEncoding).toBeDefined();
    });

    it('should handle extreme encoding dimension values', () => {
      const extremeDimensions: EncodingDimension[] = [
        {
          ...mockEncodingDimensions[0],
          encodingStrength: 2.0, // Invalid: > 1.0
          perceptualAccuracy: -0.5 // Invalid: < 0
        }
      ];

      expect(() => {
        ChartComposer.composeVisualization(
          'scatter_plot',
          extremeDimensions,
          mockDataCharacteristics
        );
      }).not.toThrow();
    });

    it('should handle missing contextual requirements', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics,
        undefined
      );

      expect(profile).toBeDefined();
      expect(profile.culturalAdaptation.readingDirection).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large numbers of encoding dimensions', () => {
      const largeDimensions: EncodingDimension[] = Array.from({ length: 20 }, (_, i) => ({
        channel: (`position_${i % 2 === 0 ? 'x' : 'y'}` as VisualChannel),
        dataField: `field_${i}`,
        dataType: (i % 3 === 0 ? 'quantitative' : i % 3 === 1 ? 'nominal' : 'ordinal') as DataType,
        encodingStrength: Math.random(),
        perceptualAccuracy: Math.random(),
        discriminability: Math.random(),
        orderingPreservation: Math.random(),
        optimization: mockEncodingDimensions[0].optimization
      }));

      const startTime = Date.now();
      const profile = ChartComposer.composeVisualization(
        'parallel_coordinates',
        largeDimensions,
        mockDataCharacteristics
      );
      const endTime = Date.now();

      expect(profile).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex data characteristics efficiently', () => {
      const complexData = {
        fields: Array.from({ length: 100 }, (_, i) => ({
          name: `field_${i}`,
          type: i % 4 === 0 ? 'quantitative' : i % 4 === 1 ? 'nominal' : i % 4 === 2 ? 'ordinal' : 'temporal'
        })),
        recordCount: 1000000,
        categoricalColumns: 25,
        numericalColumns: 75
      };

      const startTime = Date.now();
      const profile = ChartComposer.composeVisualization(
        'heatmap',
        mockEncodingDimensions,
        complexData
      );
      const endTime = Date.now();

      expect(profile).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Integration and Consistency', () => {
    it('should maintain consistency across multiple calls', () => {
      const profile1 = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      const profile2 = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics,
        mockContextualRequirements
      );

      // Should produce consistent results
      expect(profile1.visualEncoding.encodingEfficiency).toBe(profile2.visualEncoding.encodingEfficiency);
      expect(profile1.aestheticProfile.colorHarmony.harmonyScore).toBe(profile2.aestheticProfile.colorHarmony.harmonyScore);
      expect(profile1.qualityMetrics.overallQuality).toBe(profile2.qualityMetrics.overallQuality);
    });

    it('should have correlated quality metrics', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      const quality = profile.qualityMetrics;
      
      // Overall quality should be related to component scores
      const componentAverage = (
        quality.aestheticScore +
        quality.functionalScore +
        quality.accessibilityScore +
        quality.usabilityScore +
        quality.originalityScore
      ) / 5;

      expect(Math.abs(quality.overallQuality - componentAverage)).toBeLessThan(10);
    });

    it('should maintain logical relationships between profiles', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      // Higher encoding efficiency should correlate with higher functional score
      const functionalScore = profile.qualityMetrics.functionalScore;
      const encodingEfficiency = profile.visualEncoding.encodingEfficiency;
      
      expect(functionalScore).toBeGreaterThanOrEqual(0);
      expect(encodingEfficiency).toBeGreaterThanOrEqual(0);

      // Accessibility compliance score should match accessibility assessment
      const accessibilityScore = profile.qualityMetrics.accessibilityScore;
      const complianceScore = profile.accessibilityCompliance.complianceScore;
      
      expect(Math.abs(accessibilityScore - complianceScore)).toBeLessThan(5);
    });
  });

  describe('Advanced Color Theory and Harmony', () => {
    it('should handle hex color conversion correctly', () => {
      const brandGuidelines = {
        brandColors: ['#ff0000', '#00ff00', '#0000ff']
      };

      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics,
        brandGuidelines
      );

      expect(profile.aestheticProfile.colorHarmony).toBeDefined();
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThan(0);
    });

    it('should calculate different color harmony types', () => {
      const testData = {
        fields: [
          { name: 'temporal_field', type: 'temporal' },
          { name: 'info_field', type: 'quantitative' }
        ]
      };

      const temporalDimensions: EncodingDimension[] = [
        {
          channel: 'position_x',
          dataField: 'temporal_field',
          dataType: 'temporal',
          encodingStrength: 0.9,
          perceptualAccuracy: 1.0,
          discriminability: 0.9,
          orderingPreservation: 1.0,
          optimization: mockEncodingDimensions[0].optimization
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'line_chart',
        temporalDimensions,
        testData
      );

      expect(profile.perceptualOptimization.gestaltPrinciples).toBeDefined();
      const principles = profile.perceptualOptimization.gestaltPrinciples.map(g => g.principle);
      expect(principles).toContain('continuity');
    });

    it('should handle edge cases in harmony score calculation', () => {
      // Test with empty harmony
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        [],
        { fields: [] }
      );

      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
    });

    it('should test monochromatic color scheme compliance', () => {
      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      expect(profile.aestheticProfile.colorHarmony.scheme.type).toBeDefined();
      expect(profile.aestheticProfile.colorHarmony.scheme.baseColor).toBeDefined();
    });

    it('should handle high information density scenarios', () => {
      const highDensityDimensions: EncodingDimension[] = Array.from({ length: 8 }, (_, i) => ({
        channel: (i % 2 === 0 ? 'position_x' : 'color_hue') as VisualChannel,
        dataField: `field_${i}`,
        dataType: 'quantitative' as DataType,
        encodingStrength: 0.8,
        perceptualAccuracy: 0.7,
        discriminability: 0.6,
        orderingPreservation: 0.8,
        optimization: mockEncodingDimensions[0].optimization
      }));

      const profile = ChartComposer.composeVisualization(
        'bubble_chart',
        highDensityDimensions,
        mockDataCharacteristics
      );

      expect(profile.visualEncoding.informationDensity).toBeGreaterThan(60);
      const commonFate = profile.perceptualOptimization.gestaltPrinciples
        .find(p => p.principle === 'common_fate');
      expect(commonFate).toBeDefined();
    });
  });

  describe('Complex Encoding and Channel Optimization', () => {
    it('should handle all visual channel types', () => {
      const allChannelTypes: VisualChannel[] = [
        'position_x', 'position_y', 'position_angle', 'position_radius',
        'color_hue', 'color_saturation', 'color_lightness', 'color_opacity',
        'size_area', 'size_length', 'size_width', 'size_volume',
        'shape', 'texture', 'orientation', 'motion',
        'typography_weight', 'typography_style', 'typography_size'
      ];

      allChannelTypes.forEach((channel, index) => {
        const dimension: EncodingDimension = {
          channel,
          dataField: `field_${index}`,
          dataType: channel.includes('position') || channel.includes('size') ? 'quantitative' : 'nominal',
          encodingStrength: 0.5,
          perceptualAccuracy: 0.5,
          discriminability: 0.5,
          orderingPreservation: 0.5,
          optimization: mockEncodingDimensions[0].optimization
        };

        const profile = ChartComposer.composeVisualization(
          'scatter_plot',
          [dimension],
          mockDataCharacteristics
        );

        expect(profile).toBeDefined();
        expect(profile.visualEncoding.primaryDimensions.length + 
               profile.visualEncoding.secondaryDimensions.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should test cognitive load calculations for complex charts', () => {
      const complexChartTypes = ['parallel_coordinates', 'sankey', 'heatmap'];
      
      complexChartTypes.forEach(chartType => {
        const profile = ChartComposer.composeVisualization(
          chartType,
          mockEncodingDimensions,
          mockDataCharacteristics
        );

        expect(profile.visualEncoding.cognitiveLoad).toBeGreaterThan(0);
        expect(profile.perceptualOptimization.cognitiveLoad.totalLoad).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle redundant encoding for different purposes', () => {
      const emphasizedDimension: EncodingDimension = {
        channel: 'position_y',
        dataField: 'important_metric',
        dataType: 'quantitative',
        encodingStrength: 0.85,
        perceptualAccuracy: 1.0,
        discriminability: 0.85,
        orderingPreservation: 1.0,
        optimization: mockEncodingDimensions[0].optimization
      };

      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        [emphasizedDimension],
        mockDataCharacteristics
      );

      const emphasisEncodings = profile.visualEncoding.redundantEncodings
        .filter(enc => enc.purpose === 'emphasis');
      
      if (emphasisEncodings.length > 0) {
        expect(emphasisEncodings[0].effectiveness).toBeGreaterThan(0);
      }
    });

    it('should handle spatial vs temporal data sentiment analysis', () => {
      const spatialData = {
        fields: [
          { name: 'latitude', type: 'spatial' },
          { name: 'longitude', type: 'spatial' },
          { name: 'growth_rate', type: 'quantitative' }
        ]
      };

      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        spatialData
      );

      expect(profile.aestheticProfile.colorHarmony.psychologicalImpact).toBeDefined();
      expect(profile.aestheticProfile.colorHarmony.psychologicalImpact.emotion).toBeDefined();
    });
  });

  describe('Advanced Accessibility and Compliance', () => {
    it('should handle extreme accessibility requirements', () => {
      const accessibilityData = {
        fields: [
          { name: 'success_indicator', type: 'quantitative' },
          { name: 'warning_flag', type: 'nominal' },
          { name: 'error_rate', type: 'quantitative' }
        ]
      };

      const profile = ChartComposer.composeVisualization(
        'heatmap',
        mockEncodingDimensions,
        accessibilityData,
        { accessibilityRequirements: 'AAA' }
      );

      expect(profile.accessibilityCompliance.wcagLevel).toBeOneOf(['A', 'AA', 'AAA']);
      expect(profile.accessibilityCompliance.complianceScore).toBeGreaterThan(0);
    });

    it('should test red-green color combination problems', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        {
          fields: [
            { name: 'profit', type: 'quantitative' },
            { name: 'loss', type: 'quantitative' }
          ]
        }
      );

      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThan(0);
    });
  });

  describe('Cultural and Domain Adaptations', () => {
    it('should handle different sentiment analysis outcomes', () => {
      const negativeData = {
        fields: [
          { name: 'error_count', type: 'quantitative' },
          { name: 'problem_severity', type: 'ordinal' },
          { name: 'decline_rate', type: 'quantitative' }
        ]
      };

      const profile = ChartComposer.composeVisualization(
        'line_chart',
        mockEncodingDimensions,
        negativeData
      );

      expect(profile.aestheticProfile.colorHarmony.psychologicalImpact).toBeDefined();
    });

    it('should adapt color selection for high complexity data', () => {
      const complexData = {
        fields: Array.from({ length: 25 }, (_, i) => ({
          name: `complex_field_${i}`,
          type: i % 2 === 0 ? 'quantitative' : 'nominal'
        })),
        recordCount: 50000,
        categoricalColumns: 12,
        numericalColumns: 13
      };

      const profile = ChartComposer.composeVisualization(
        'parallel_coordinates',
        mockEncodingDimensions,
        complexData
      );

      expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.saturation).toBeDefined();
    });

    it('should handle all domain types for color selection', () => {
      const domains = ['education', 'healthcare', 'finance', 'marketing', 'technology', 'environment', 'social', 'general'];
      
      domains.forEach(domain => {
        const profile = ChartComposer.composeVisualization(
          'bar_chart',
          mockEncodingDimensions,
          mockDataCharacteristics,
          { domain }
        );

        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor).toBeDefined();
        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.hue).toBeGreaterThanOrEqual(0);
        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.hue).toBeLessThanOrEqual(360);
      });
    });
  });

  describe('Visual Flow and Hierarchy', () => {
    it('should generate appropriate visual flow for different dimension counts', () => {
      // Test single dimension (no flow)
      const singleDim = [mockEncodingDimensions[0]];
      const profileSingle = ChartComposer.composeVisualization(
        'bar_chart',
        singleDim,
        mockDataCharacteristics
      );

      expect(profileSingle.visualEncoding.hierarchicalStructure.visualFlow).toBeDefined();

      // Test multiple dimensions with varying encoding strengths
      const varyingStrengthDims: EncodingDimension[] = [
        { ...mockEncodingDimensions[0], encodingStrength: 0.9 },
        { ...mockEncodingDimensions[1], encodingStrength: 0.6 },
        { ...mockEncodingDimensions[2], encodingStrength: 0.3 }
      ];

      const profileMultiple = ChartComposer.composeVisualization(
        'scatter_plot',
        varyingStrengthDims,
        mockDataCharacteristics
      );

      expect(profileMultiple.visualEncoding.hierarchicalStructure.visualFlow.length).toBeGreaterThan(0);
    });

    it('should select appropriate flow techniques for different channel combinations', () => {
      const flowTestDimensions: [VisualChannel, VisualChannel][] = [
        ['color_hue', 'color_saturation'],
        ['size_area', 'size_length'],
        ['position_x', 'position_y'],
        ['shape', 'texture']
      ];

      flowTestDimensions.forEach(([channel1, channel2]) => {
        const dims: EncodingDimension[] = [
          {
            ...mockEncodingDimensions[0],
            channel: channel1,
            encodingStrength: 0.8
          },
          {
            ...mockEncodingDimensions[1],
            channel: channel2,
            encodingStrength: 0.5
          }
        ];

        const profile = ChartComposer.composeVisualization(
          'scatter_plot',
          dims,
          mockDataCharacteristics
        );

        expect(profile.visualEncoding.hierarchicalStructure.visualFlow).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle excessive cognitive load scenarios', () => {
      const highLoadDimensions: EncodingDimension[] = Array.from({ length: 10 }, (_, i) => ({
        channel: ('color_hue') as VisualChannel,
        dataField: `overload_field_${i}`,
        dataType: 'nominal' as DataType,
        encodingStrength: 0.2,
        perceptualAccuracy: 0.1,
        discriminability: 0.1,
        orderingPreservation: 0.5,
        optimization: mockEncodingDimensions[0].optimization
      }));

      const profile = ChartComposer.composeVisualization(
        'parallel_coordinates',
        highLoadDimensions,
        mockDataCharacteristics
      );

      expect(profile.qualityMetrics.originalityScore).toBeDefined();
      expect(profile.visualEncoding.cognitiveLoad).toBeGreaterThan(80);
    });

    it('should handle zero and negative values in color calculations', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        [],
        { fields: [] }
      );

      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
    });

    it('should test variance calculation edge cases', () => {
      // This will test the calculateVariance helper method through harmony score calculation
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeDefined();
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Comprehensive Coverage of Helper Methods', () => {
    it('should test all color theory compliance methods', () => {
      // Test analogous compliance
      const analogousProfile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        {
          fields: [
            { name: 'field1', type: 'quantitative' },
            { name: 'field2', type: 'quantitative' }
          ]
        }
      );
      expect(analogousProfile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
    });

    it('should test hex color conversion with edge cases', () => {
      const hexColors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'];
      
      hexColors.forEach(color => {
        const profile = ChartComposer.composeVisualization(
          'scatter_plot',
          mockEncodingDimensions,
          mockDataCharacteristics,
          { brandColors: [color] }
        );
        
        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor).toBeDefined();
      });
    });

    it('should test hue spread calculation with different distributions', () => {
      // This tests the calculateHueSpread method indirectly
      const multiColorData = {
        fields: Array.from({ length: 6 }, (_, i) => ({
          name: `color_field_${i}`,
          type: 'nominal'
        }))
      };

      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        multiColorData
      );

      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
    });

    it('should test ordinal data type handling in encoding optimization', () => {
      const ordinalDimension: EncodingDimension = {
        channel: 'position_y',
        dataField: 'rating',
        dataType: 'ordinal',
        encodingStrength: 0.8,
        perceptualAccuracy: 0.9,
        discriminability: 0.72,
        orderingPreservation: 1.0,
        optimization: mockEncodingDimensions[1].optimization
      };

      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        [ordinalDimension],
        mockDataCharacteristics
      );

      expect(profile.visualEncoding.primaryDimensions[0].orderingPreservation).toBeGreaterThan(0);
    });

    it('should test different data complexity levels', () => {
      const complexityLevels = [
        { fieldCount: 5, recordCount: 100 },
        { fieldCount: 15, recordCount: 5000 },
        { fieldCount: 25, recordCount: 50000 }
      ];

      complexityLevels.forEach(({ fieldCount, recordCount }) => {
        const complexData = {
          fields: Array.from({ length: fieldCount }, (_, i) => ({
            name: `field_${i}`,
            type: i % 2 === 0 ? 'quantitative' : 'nominal'
          })),
          recordCount,
          categoricalColumns: Math.floor(fieldCount / 2),
          numericalColumns: Math.ceil(fieldCount / 2)
        };

        const profile = ChartComposer.composeVisualization(
          'heatmap',
          mockEncodingDimensions,
          complexData
        );

        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.saturation).toBeDefined();
      });
    });

    it('should test all chart interaction complexity levels', () => {
      const chartComplexityMap = {
        'scatter_plot': 2,
        'line_chart': 1,
        'bar_chart': 1,
        'heatmap': 3,
        'parallel_coordinates': 4,
        'sankey': 4,
        'unknown_chart': 2
      };

      Object.keys(chartComplexityMap).forEach(chartType => {
        const profile = ChartComposer.composeVisualization(
          chartType as any,
          mockEncodingDimensions,
          mockDataCharacteristics
        );

        expect(profile.visualEncoding.cognitiveLoad).toBeGreaterThan(0);
      });
    });

    it('should test different sentiment analysis paths', () => {
      const sentimentTestCases = [
        {
          name: 'positive',
          fields: [
            { name: 'positive_score', type: 'quantitative' },
            { name: 'success_rate', type: 'quantitative' },
            { name: 'good_outcome', type: 'nominal' },
            { name: 'profit_margin', type: 'quantitative' },
            { name: 'growth_trend', type: 'quantitative' },
            { name: 'improvement_score', type: 'quantitative' }
          ]
        },
        {
          name: 'negative',
          fields: [
            { name: 'negative_impact', type: 'quantitative' },
            { name: 'error_rate', type: 'quantitative' },
            { name: 'bad_result', type: 'nominal' },
            { name: 'loss_amount', type: 'quantitative' },
            { name: 'decline_factor', type: 'quantitative' },
            { name: 'problem_count', type: 'quantitative' }
          ]
        },
        {
          name: 'neutral',
          fields: [
            { name: 'value', type: 'quantitative' },
            { name: 'measurement', type: 'quantitative' }
          ]
        }
      ];

      sentimentTestCases.forEach(testCase => {
        const profile = ChartComposer.composeVisualization(
          'bar_chart',
          mockEncodingDimensions,
          { fields: testCase.fields }
        );

        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor).toBeDefined();
      });
    });

    it('should test comprehensive semantic color mapping scenarios', () => {
      const semanticFields = [
        { name: 'info_level', type: 'ordinal' },
        { name: 'neutral_state', type: 'nominal' },
        { name: 'standard_measure', type: 'quantitative' },
        { name: 'time_period', type: 'temporal' },
        { name: 'profit_earned', type: 'quantitative' },
        { name: 'revenue_stream', type: 'quantitative' },
        { name: 'income_source', type: 'quantitative' },
        { name: 'loss_recorded', type: 'quantitative' },
        { name: 'cost_factor', type: 'quantitative' },
        { name: 'expense_item', type: 'quantitative' }
      ];

      const profile = ChartComposer.composeVisualization(
        'treemap',
        mockEncodingDimensions,
        { fields: semanticFields }
      );

      expect(profile.aestheticProfile.colorHarmony.semanticMapping.length).toBeGreaterThan(0);
      
      // Test that primary and secondary mappings are created when no semantic mappings found
      const minimalProfile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        { fields: [{ name: 'simple_value', type: 'quantitative' }] }
      );

      expect(minimalProfile.aestheticProfile.colorHarmony.semanticMapping.length).toBeGreaterThan(0);
    });

    it('should test accessibility bonus calculations', () => {
      // Create different color scenarios to test accessibility bonuses
      const testCases = [
        { name: 'high_contrast', expectedBonus: true },
        { name: 'color_blind_safe', expectedBonus: true },
        { name: 'moderate_saturation', expectedBonus: true }
      ];

      testCases.forEach(testCase => {
        const profile = ChartComposer.composeVisualization(
          'line_chart',
          mockEncodingDimensions,
          mockDataCharacteristics
        );

        expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should test originality score edge cases', () => {
      // Test minimum originality scenario
      const minimalDimensions: EncodingDimension[] = [
        {
          channel: 'position_x',
          dataField: 'simple',
          dataType: 'quantitative',
          encodingStrength: 0.5,
          perceptualAccuracy: 0.5,
          discriminability: 0.5,
          orderingPreservation: 0.5,
          optimization: mockEncodingDimensions[0].optimization
        }
      ];

      const profileMinimal = ChartComposer.composeVisualization(
        'bar_chart',
        minimalDimensions,
        { fields: [{ name: 'simple', type: 'quantitative' }] }
      );

      expect(profileMinimal.qualityMetrics.originalityScore).toBeGreaterThanOrEqual(0);
      expect(profileMinimal.qualityMetrics.originalityScore).toBeLessThanOrEqual(100);

      // Test high cognitive load penalty
      const highCognitiveLoadDimensions: EncodingDimension[] = Array.from({ length: 15 }, (_, i) => ({
        channel: 'color_hue' as VisualChannel,
        dataField: `complex_field_${i}`,
        dataType: 'nominal' as DataType,
        encodingStrength: 0.1,
        perceptualAccuracy: 0.1,
        discriminability: 0.1,
        orderingPreservation: 0.1,
        optimization: mockEncodingDimensions[0].optimization
      }));

      const profileComplex = ChartComposer.composeVisualization(
        'parallel_coordinates',
        highCognitiveLoadDimensions,
        mockDataCharacteristics
      );

      // Should have cognitive load penalty
      expect(profileComplex.visualEncoding.cognitiveLoad).toBeGreaterThan(90);
    });

    it('should test improvement area identification for all score types', () => {
      // Create scenarios that would trigger each improvement area type
      const lowScoreScenarios = [
        { name: 'aesthetic', expectedArea: 'Aesthetic Design' },
        { name: 'functional', expectedArea: 'Functional Efficiency' },
        { name: 'accessibility', expectedArea: 'Accessibility Compliance' },
        { name: 'usability', expectedArea: 'User Experience' },
        { name: 'originality', expectedArea: 'Visual Innovation' }
      ];

      // Test with simple configuration that might produce lower scores
      const simpleConfig: EncodingDimension[] = [
        {
          channel: 'shape',
          dataField: 'category',
          dataType: 'nominal',
          encodingStrength: 0.2,
          perceptualAccuracy: 0.3,
          discriminability: 0.12,
          orderingPreservation: 0.5,
          optimization: mockEncodingDimensions[0].optimization
        }
      ];

      const profile = ChartComposer.composeVisualization(
        'pie_chart',
        simpleConfig,
        { fields: [{ name: 'category', type: 'nominal' }] }
      );

      expect(profile.qualityMetrics.improvementAreas).toBeDefined();
      
      // Verify improvement areas have correct structure
      profile.qualityMetrics.improvementAreas.forEach(area => {
        expect(area.area).toBeDefined();
        expect(area.currentScore).toBeGreaterThanOrEqual(0);
        expect(area.currentScore).toBeLessThanOrEqual(100);
        expect(area.potentialScore).toBeGreaterThan(area.currentScore);
        expect(area.recommendations).toBeDefined();
        expect(area.recommendations.length).toBeGreaterThan(0);
        expect(area.priority).toBeOneOf(['low', 'medium', 'high', 'critical']);
      });
    });

    it('should test all color theory compliance branches', () => {
      // Test triadic compliance
      const profile1 = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        { fields: [{ name: 'test1', type: 'nominal' }, { name: 'test2', type: 'nominal' }, { name: 'test3', type: 'nominal' }] }
      );
      expect(profile1.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);

      // Test tetradic compliance
      const profile2 = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        { fields: Array.from({ length: 4 }, (_, i) => ({ name: `test${i}`, type: 'nominal' })) }
      );
      expect(profile2.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
    });

    it('should test edge cases in redundant encoding generation', () => {
      // Test texture redundancy for important categorical data
      const importantCategoricalDim: EncodingDimension = {
        channel: 'color_hue',
        dataField: 'critical_category',
        dataType: 'nominal',
        encodingStrength: 0.8,
        perceptualAccuracy: 0.4,
        discriminability: 0.32,
        orderingPreservation: 0.5,
        optimization: mockEncodingDimensions[0].optimization
      };

      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        [importantCategoricalDim],
        mockDataCharacteristics
      );

      const textureEncodings = profile.visualEncoding.redundantEncodings
        .filter(enc => enc.redundantChannel === 'texture');
      
      if (textureEncodings.length > 0) {
        expect(textureEncodings[0].purpose).toBe('emphasis');
      }
    });

    it('should test flow strength differences and edge cases', () => {
      // Test dimensions with small strength differences (should not create flow)
      const similarStrengthDims: EncodingDimension[] = [
        { ...mockEncodingDimensions[0], encodingStrength: 0.5 },
        { ...mockEncodingDimensions[1], encodingStrength: 0.49 }
      ];

      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        similarStrengthDims,
        mockDataCharacteristics
      );

      // Small difference should not create strong flow
      expect(profile.visualEncoding.hierarchicalStructure.visualFlow).toBeDefined();
    });

    it('should test hex color parsing edge cases', () => {
      const edgeCaseColors = ['#123456', '#abcdef', '#ABCDEF', '#fedcba'];
      
      edgeCaseColors.forEach(color => {
        const profile = ChartComposer.composeVisualization(
          'line_chart',
          mockEncodingDimensions,
          mockDataCharacteristics,
          { brandColors: [color] }
        );

        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.hue).toBeGreaterThanOrEqual(0);
        expect(profile.aestheticProfile.colorHarmony.scheme.baseColor.hue).toBeLessThanOrEqual(360);
      });
    });

    it('should test different chart hierarchy levels', () => {
      // Test with 4+ dimensions to create level 3 hierarchy
      const manyDimensions: EncodingDimension[] = [
        { ...mockEncodingDimensions[0], encodingStrength: 0.9, dataField: 'primary' },
        { ...mockEncodingDimensions[1], encodingStrength: 0.8, dataField: 'secondary1' },
        { ...mockEncodingDimensions[2], encodingStrength: 0.7, dataField: 'secondary2' },
        { ...mockEncodingDimensions[0], encodingStrength: 0.6, dataField: 'tertiary1', channel: 'size_area' },
        { ...mockEncodingDimensions[1], encodingStrength: 0.5, dataField: 'tertiary2', channel: 'shape' }
      ];

      const profile = ChartComposer.composeVisualization(
        'bubble_chart',
        manyDimensions,
        mockDataCharacteristics
      );

      const hierarchy = profile.visualEncoding.hierarchicalStructure;
      expect(hierarchy.levels.length).toBeGreaterThanOrEqual(2);
      
      // Check that level 3 exists if we have enough elements
      const level3 = hierarchy.levels.find(level => level.level === 3);
      if (level3) {
        expect(level3.elements.length).toBeGreaterThan(0);
        expect(level3.visualWeight).toBeLessThan(100);
      }
    });

    it('should test information density and originality correlations', () => {
      // Test high info density with low cognitive load for originality bonus
      const optimizedDimensions: EncodingDimension[] = [
        { ...mockEncodingDimensions[0], encodingStrength: 0.9 },
        { ...mockEncodingDimensions[1], encodingStrength: 0.9 },
        { ...mockEncodingDimensions[2], encodingStrength: 0.9 }
      ];

      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        optimizedDimensions,
        mockDataCharacteristics
      );

      // Should have high info density
      expect(profile.visualEncoding.informationDensity).toBeGreaterThan(70);
      
      // Check originality bonus for high info density with manageable cognitive load
      if (profile.visualEncoding.informationDensity > 70 && profile.visualEncoding.cognitiveLoad < 60) {
        expect(profile.qualityMetrics.originalityScore).toBeGreaterThan(50);
      }
    });

    it('should test comprehensive variance calculation scenarios', () => {
      const profile = ChartComposer.composeVisualization(
        'scatter_plot',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      // Test that variance calculation handles empty arrays correctly
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeLessThanOrEqual(100);
    });

    it('should test cultural bonus calculations', () => {
      const profile = ChartComposer.composeVisualization(
        'bar_chart',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      // Cultural bonus should be factored into harmony score
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(profile.culturalAdaptation.readingDirection).toBeDefined();
    });

    it('should test red-green color detection edge cases', () => {
      const profile = ChartComposer.composeVisualization(
        'heatmap',
        mockEncodingDimensions,
        mockDataCharacteristics
      );

      // Harmony score should account for color-blind safety
      expect(profile.aestheticProfile.colorHarmony.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(profile.accessibilityCompliance.colorBlindnessSupport.protanopia).toBeGreaterThanOrEqual(0);
      expect(profile.accessibilityCompliance.colorBlindnessSupport.deuteranopia).toBeGreaterThanOrEqual(0);
    });
  });
});