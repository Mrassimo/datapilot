/**
 * Aesthetic Optimization Engine Tests
 * 
 * Tests the sophisticated aesthetic optimization engine that applies design principles,
 * color theory, and perceptual psychology to create visually appealing and effective
 * data visualizations.
 */

/// <reference path="../../jest-custom-matchers.d.ts" />

import { AestheticOptimizer } from '../../../src/analyzers/visualization/engines/aesthetic-optimization';
import type { 
  ColorScheme,
  ColorAccessibility,
  TypographyGuidelines
} from '../../../src/analyzers/visualization/types';
import { ChartType } from '../../../src/analyzers/visualization/types';

describe('AestheticOptimizer', () => {
  describe('Aesthetic Profile Generation', () => {
    it('should generate comprehensive aesthetic profile', () => {
      const dataCharacteristics = {
        type: 'categorical',
        count: 8,
        variability: 'high',
        distribution: 'uniform'
      };
      
      const domainContext = {
        industry: 'technology',
        audience: 'technical',
        purpose: 'analysis'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile).toBeDefined();
      expect(profile.colorSystem).toBeDefined();
      expect(profile.typographySystem).toBeDefined();
      expect(profile.visualComposition).toBeDefined();
      expect(profile.accessibility).toBeDefined();
      
      // Should have valid color system
      expect(profile.colorSystem.primaryPalette).toBeDefined();
      expect(profile.colorSystem.primaryPalette.primary.length).toBeGreaterThan(0);
      expect(profile.colorSystem.primaryPalette.harmonyScore).toBeGreaterThan(0);
      expect(profile.colorSystem.primaryPalette.harmonyType).toBeOneOf([
        'monochromatic', 'analogous', 'complementary', 'triadic', 'tetradic', 'split_complementary'
      ]);
    });

    it('should generate typography system with hierarchy', () => {
      const dataCharacteristics = {
        textDensity: 'medium',
        readabilityRequirements: 'high',
        screenSize: 'desktop'
      };
      
      const domainContext = {
        formality: 'professional',
        branding: 'corporate'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile.typographySystem).toBeDefined();
      expect(profile.typographySystem.fontHierarchy).toBeDefined();
      expect(profile.typographySystem.fontHierarchy.levels.length).toBeGreaterThan(0);
      expect(profile.typographySystem.readabilityOptimization).toBeDefined();
      expect(profile.typographySystem.responsiveTypography).toBeDefined();
    });

    it('should create accessible aesthetic profile', () => {
      const dataCharacteristics = {
        complexity: 'high',
        userBase: 'diverse'
      };
      
      const domainContext = {
        accessibilityRequirements: 'AA',
        inclusivity: 'high'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile.accessibility).toBeDefined();
      expect(profile.accessibility.wcagCompliance).toBeDefined();
      expect(profile.accessibility.wcagCompliance.level).toBeOneOf(['A', 'AA', 'AAA']);
      expect(profile.accessibility.wcagCompliance.score).toBeGreaterThan(0);
      expect(profile.accessibility.universalDesign).toBeDefined();
    });

    it('should integrate brand guidelines when provided', () => {
      const dataCharacteristics = {
        type: 'mixed',
        chartCount: 3
      };
      
      const domainContext = {
        industry: 'finance',
        formality: 'high'
      };

      const brandGuidelines = {
        primaryColors: ['#1f77b4', '#ff7f0e'],
        fontFamily: 'Arial',
        logoPresence: true
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext,
        brandGuidelines
      );

      expect(profile.brandIntegration).toBeDefined();
      expect(profile.brandIntegration.brandAlignment).toBeDefined();
      expect(profile.brandIntegration.brandAlignment.overall).toBeGreaterThan(0.5);
      expect(profile.colorSystem.primaryPalette.primary.length).toBeGreaterThan(0);
    });

    it('should adapt for different user preferences', () => {
      const dataCharacteristics = {
        complexity: 'medium',
        interactivity: 'high'
      };
      
      const domainContext = {
        audience: 'general',
        context: 'presentation'
      };

      const userPreferences = {
        colorPreference: 'cool',
        densityPreference: 'sparse',
        contrastPreference: 'high'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext,
        undefined,
        userPreferences
      );

      expect(profile.qualityMetrics).toBeDefined();
      expect(profile.qualityMetrics.overall).toBeGreaterThan(0);
      expect(profile.qualityMetrics.usability).toBeDefined();
      expect(profile.responsiveAesthetics).toBeDefined();
    });

    it('should handle contextual requirements', () => {
      const dataCharacteristics = {
        urgency: 'high',
        criticality: 'important'
      };
      
      const domainContext = {
        environment: 'dashboard',
        updateFrequency: 'real-time'
      };

      const contextualRequirements = {
        performanceOptimization: true,
        mobileFriendly: true,
        printFriendly: false
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext,
        undefined,
        undefined,
        contextualRequirements
      );

      expect(profile.responsiveAesthetics).toBeDefined();
      expect(profile.responsiveAesthetics.breakpoints).toBeDefined();
      expect(profile.responsiveAesthetics.breakpoints).toBeDefined();
      expect(profile.qualityMetrics.performance).toBeDefined();
    });
  });

  describe('Quality Metrics and Validation', () => {
    it('should provide comprehensive quality metrics', () => {
      const dataCharacteristics = {
        type: 'time-series',
        points: 1000
      };
      
      const domainContext = {
        industry: 'healthcare',
        precision: 'critical'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile.qualityMetrics).toBeDefined();
      expect(profile.qualityMetrics.overall).toBeGreaterThanOrEqual(0);
      expect(profile.qualityMetrics.overall).toBeLessThanOrEqual(100);
      expect(profile.qualityMetrics.beauty).toBeDefined();
      expect(profile.qualityMetrics.usability).toBeDefined();
      expect(profile.qualityMetrics.accessibility).toBeDefined();
    });

    it('should validate color system effectiveness', () => {
      const dataCharacteristics = {
        colorCoding: 'essential',
        categories: 12
      };
      
      const domainContext = {
        colorVisionSupport: 'required',
        precision: 'high'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile.colorSystem.accessibilityProfile).toBeDefined();
      expect(profile.colorSystem.accessibilityProfile.colorBlindnessSupport).toBeDefined();
      expect(profile.colorSystem.accessibilityProfile.contrastCompliance).toBeDefined();
      expect(profile.colorSystem.dataVisualizationPalette).toBeDefined();
    });

    it('should ensure emotional design appropriateness', () => {
      const dataCharacteristics = {
        sentiment: 'neutral',
        context: 'business'
      };
      
      const domainContext = {
        emotionalTone: 'professional',
        trustworthiness: 'critical'
      };

      const profile = AestheticOptimizer.generateAestheticProfile(
        dataCharacteristics,
        domainContext
      );

      expect(profile.emotionalDesign).toBeDefined();
      expect(profile.emotionalDesign.targetEmotions).toBeDefined();
      expect(profile.emotionalDesign.psychologicalPrinciples).toBeDefined();
      expect(profile.emotionalDesign.emotionalJourney).toBeDefined();
      expect(profile.emotionalDesign.targetEmotions).toBeDefined();
    });
  });
});