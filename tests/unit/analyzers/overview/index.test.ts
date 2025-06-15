/**
 * Overview Module Index Tests
 * 
 * Tests the overview module exports and integration:
 * - Module exports availability
 * - Type definitions
 * - Integration between components
 * - Overall module structure
 */

import * as OverviewModule from '../../../../src/analyzers/overview';
import { Section1Analyzer } from '../../../../src/analyzers/overview/section1-analyzer';
import { FileMetadataCollector } from '../../../../src/analyzers/overview/file-metadata-collector';
import { StructuralAnalyzer } from '../../../../src/analyzers/overview/structural-analyzer';
import { ParsingMetadataTracker } from '../../../../src/analyzers/overview/parsing-metadata-tracker';
import { EnvironmentProfiler } from '../../../../src/analyzers/overview/environment-profiler';

describe('Overview Module Exports', () => {
  describe('Main Exports', () => {
    it('should export Section1Analyzer', () => {
      expect(OverviewModule.Section1Analyzer).toBeDefined();
      expect(OverviewModule.Section1Analyzer).toBe(Section1Analyzer);
    });

    it('should export FileMetadataCollector', () => {
      expect(OverviewModule.FileMetadataCollector).toBeDefined();
      expect(OverviewModule.FileMetadataCollector).toBe(FileMetadataCollector);
    });

    it('should export StructuralAnalyzer', () => {
      expect(OverviewModule.StructuralAnalyzer).toBeDefined();
      expect(OverviewModule.StructuralAnalyzer).toBe(StructuralAnalyzer);
    });

    it('should export ParsingMetadataTracker', () => {
      expect(OverviewModule.ParsingMetadataTracker).toBeDefined();
      expect(OverviewModule.ParsingMetadataTracker).toBe(ParsingMetadataTracker);
    });

    it('should export EnvironmentProfiler', () => {
      expect(OverviewModule.EnvironmentProfiler).toBeDefined();
      expect(OverviewModule.EnvironmentProfiler).toBe(EnvironmentProfiler);
    });
  });

  describe('Class Instantiation', () => {
    it('should be able to instantiate Section1Analyzer', () => {
      expect(() => new OverviewModule.Section1Analyzer()).not.toThrow();
      
      const analyzer = new OverviewModule.Section1Analyzer();
      expect(analyzer).toBeInstanceOf(Section1Analyzer);
    });

    it('should be able to instantiate FileMetadataCollector', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };
      
      expect(() => new OverviewModule.FileMetadataCollector(config)).not.toThrow();
      
      const collector = new OverviewModule.FileMetadataCollector(config);
      expect(collector).toBeInstanceOf(FileMetadataCollector);
    });

    it('should be able to instantiate StructuralAnalyzer', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };
      
      expect(() => new OverviewModule.StructuralAnalyzer(config)).not.toThrow();
      
      const analyzer = new OverviewModule.StructuralAnalyzer(config);
      expect(analyzer).toBeInstanceOf(StructuralAnalyzer);
    });

    it('should be able to instantiate ParsingMetadataTracker', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };
      
      expect(() => new OverviewModule.ParsingMetadataTracker(config)).not.toThrow();
      
      const tracker = new OverviewModule.ParsingMetadataTracker(config);
      expect(tracker).toBeInstanceOf(ParsingMetadataTracker);
    });

    it('should be able to instantiate EnvironmentProfiler', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };
      
      expect(() => new OverviewModule.EnvironmentProfiler(config)).not.toThrow();
      
      const profiler = new OverviewModule.EnvironmentProfiler(config);
      expect(profiler).toBeInstanceOf(EnvironmentProfiler);
    });
  });

  describe('Type Exports', () => {
    it('should have type definitions available for import', () => {
      // This test verifies that the types are exported and can be imported
      // The actual type checking is done at compile time
      
      // If this compiles without TypeScript errors, the types are properly exported
      const typeCheck = () => {
        // These variables are typed using the exported types
        let config: OverviewModule.Section1Config;
        let result: OverviewModule.Section1Result;
        let progress: OverviewModule.Section1Progress;
        let warning: OverviewModule.Section1Warning;
        let fileMetadata: OverviewModule.FileMetadata;
        let parsingMetadata: OverviewModule.ParsingMetadata;
        let structuralDimensions: OverviewModule.StructuralDimensions;
        let executionContext: OverviewModule.ExecutionContext;
        let systemEnvironment: OverviewModule.SystemEnvironment;
        
        // Basic type assertion to use the variables
        expect(typeof config).toBe('undefined');
        expect(typeof result).toBe('undefined');
        expect(typeof progress).toBe('undefined');
        expect(typeof warning).toBe('undefined');
        expect(typeof fileMetadata).toBe('undefined');
        expect(typeof parsingMetadata).toBe('undefined');
        expect(typeof structuralDimensions).toBe('undefined');
        expect(typeof executionContext).toBe('undefined');
        expect(typeof systemEnvironment).toBe('undefined');
      };
      
      expect(typeCheck).not.toThrow();
    });
  });

  describe('Module Structure', () => {
    it('should have a well-defined module structure', () => {
      const moduleKeys = Object.keys(OverviewModule);
      
      // Should export main classes
      expect(moduleKeys).toContain('Section1Analyzer');
      expect(moduleKeys).toContain('FileMetadataCollector');
      expect(moduleKeys).toContain('StructuralAnalyzer');
      expect(moduleKeys).toContain('ParsingMetadataTracker');
      expect(moduleKeys).toContain('EnvironmentProfiler');
      
      // Should not export internal implementation details
      expect(moduleKeys).not.toContain('private');
      expect(moduleKeys).not.toContain('internal');
    });

    it('should export classes that are constructable', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      // All exported classes should be constructable
      expect(OverviewModule.Section1Analyzer).toBeInstanceOf(Function);
      expect(OverviewModule.FileMetadataCollector).toBeInstanceOf(Function);
      expect(OverviewModule.StructuralAnalyzer).toBeInstanceOf(Function);
      expect(OverviewModule.ParsingMetadataTracker).toBeInstanceOf(Function);
      expect(OverviewModule.EnvironmentProfiler).toBeInstanceOf(Function);
      
      // Should be able to construct instances
      const section1Analyzer = new OverviewModule.Section1Analyzer();
      const fileCollector = new OverviewModule.FileMetadataCollector(config);
      const structuralAnalyzer = new OverviewModule.StructuralAnalyzer(config);
      const parsingTracker = new OverviewModule.ParsingMetadataTracker(config);
      const environmentProfiler = new OverviewModule.EnvironmentProfiler(config);
      
      expect(section1Analyzer).toBeDefined();
      expect(fileCollector).toBeDefined();
      expect(structuralAnalyzer).toBeDefined();
      expect(parsingTracker).toBeDefined();
      expect(environmentProfiler).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should allow components to work together', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      // Create instances of all components
      const section1Analyzer = new OverviewModule.Section1Analyzer(config);
      const fileCollector = new OverviewModule.FileMetadataCollector(config);
      const structuralAnalyzer = new OverviewModule.StructuralAnalyzer(config);
      const parsingTracker = new OverviewModule.ParsingMetadataTracker(config);
      const environmentProfiler = new OverviewModule.EnvironmentProfiler(config);
      
      // Should have compatible configurations
      expect(section1Analyzer.getConfig()).toEqual(expect.objectContaining(config));
      
      // Components should have expected interfaces
      expect(typeof fileCollector.validateFile).toBe('function');
      expect(typeof fileCollector.collectMetadata).toBe('function');
      expect(typeof structuralAnalyzer.analyzeStructure).toBe('function');
      expect(typeof parsingTracker.parseWithMetadata).toBe('function');
      expect(typeof environmentProfiler.createExecutionContext).toBe('function');
    });

    it('should maintain consistent warning interfaces', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      const fileCollector = new OverviewModule.FileMetadataCollector(config);
      const structuralAnalyzer = new OverviewModule.StructuralAnalyzer(config);
      const parsingTracker = new OverviewModule.ParsingMetadataTracker(config);
      
      // All components should have consistent warning interfaces
      expect(typeof fileCollector.getWarnings).toBe('function');
      expect(typeof fileCollector.clearWarnings).toBe('function');
      expect(typeof structuralAnalyzer.getWarnings).toBe('function');
      expect(typeof structuralAnalyzer.clearWarnings).toBe('function');
      expect(typeof parsingTracker.getWarnings).toBe('function');
      expect(typeof parsingTracker.clearWarnings).toBe('function');
      
      // Warnings should be arrays
      expect(Array.isArray(fileCollector.getWarnings())).toBe(true);
      expect(Array.isArray(structuralAnalyzer.getWarnings())).toBe(true);
      expect(Array.isArray(parsingTracker.getWarnings())).toBe(true);
    });
  });

  describe('Version Compatibility', () => {
    it('should maintain backward compatibility with configuration options', () => {
      // Test with minimal configuration
      const minimalConfig = {
        includeHostEnvironment: false,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 100,
        privacyMode: 'minimal' as const,
        detailedProfiling: false,
      };

      expect(() => new OverviewModule.Section1Analyzer(minimalConfig)).not.toThrow();
      expect(() => new OverviewModule.FileMetadataCollector(minimalConfig)).not.toThrow();
      expect(() => new OverviewModule.StructuralAnalyzer(minimalConfig)).not.toThrow();
      expect(() => new OverviewModule.ParsingMetadataTracker(minimalConfig)).not.toThrow();
      expect(() => new OverviewModule.EnvironmentProfiler(minimalConfig)).not.toThrow();
    });

    it('should handle partial configuration objects', () => {
      // Test with partial configuration
      const partialConfig = {
        enableFileHashing: true,
        privacyMode: 'redacted' as const,
      };

      // Section1Analyzer should handle partial configs
      expect(() => new OverviewModule.Section1Analyzer(partialConfig)).not.toThrow();
      
      const analyzer = new OverviewModule.Section1Analyzer(partialConfig);
      const fullConfig = analyzer.getConfig();
      
      expect(fullConfig.enableFileHashing).toBe(true);
      expect(fullConfig.privacyMode).toBe('redacted');
      expect(fullConfig.includeHostEnvironment).toBeDefined();
      expect(fullConfig.maxSampleSizeForSparsity).toBeDefined();
      expect(fullConfig.detailedProfiling).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should export classes that handle errors gracefully', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      // Classes should not throw during construction
      expect(() => new OverviewModule.Section1Analyzer()).not.toThrow();
      expect(() => new OverviewModule.FileMetadataCollector(config)).not.toThrow();
      expect(() => new OverviewModule.StructuralAnalyzer(config)).not.toThrow();
      expect(() => new OverviewModule.ParsingMetadataTracker(config)).not.toThrow();
      expect(() => new OverviewModule.EnvironmentProfiler(config)).not.toThrow();
    });

    it('should provide meaningful error messages for invalid operations', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      const environmentProfiler = new OverviewModule.EnvironmentProfiler(config);
      
      // Should throw meaningful error for invalid operations
      expect(() => {
        environmentProfiler.endPhase('non-existent-phase');
      }).toThrow(/Phase.*was not started/);
    });
  });

  describe('Documentation and Discoverability', () => {
    it('should have classes with discoverable methods', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      const analyzer = new OverviewModule.Section1Analyzer();
      const collector = new OverviewModule.FileMetadataCollector(config);
      const structural = new OverviewModule.StructuralAnalyzer(config);
      
      // Main analysis methods should be available
      expect(typeof analyzer.analyze).toBe('function');
      expect(typeof analyzer.quickAnalyze).toBe('function');
      expect(typeof analyzer.validateConfig).toBe('function');
      
      // File operations should be available
      expect(typeof collector.collectMetadata).toBe('function');
      expect(typeof collector.validateFile).toBe('function');
      
      // Structural analysis should be available
      expect(typeof structural.analyzeStructure).toBe('function');
    });

    it('should have consistent method naming patterns', () => {
      const config = {
        includeHostEnvironment: true,
        enableFileHashing: false,
        maxSampleSizeForSparsity: 1000,
        privacyMode: 'full' as const,
        detailedProfiling: true,
      };

      const collector = new OverviewModule.FileMetadataCollector(config);
      const structural = new OverviewModule.StructuralAnalyzer(config);
      const tracker = new OverviewModule.ParsingMetadataTracker(config);
      
      // Warning management should be consistent
      expect(typeof collector.getWarnings).toBe('function');
      expect(typeof collector.clearWarnings).toBe('function');
      expect(typeof structural.getWarnings).toBe('function');
      expect(typeof structural.clearWarnings).toBe('function');
      expect(typeof tracker.getWarnings).toBe('function');
      expect(typeof tracker.clearWarnings).toBe('function');
    });
  });
});