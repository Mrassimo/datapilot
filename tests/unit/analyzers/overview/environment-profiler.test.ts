/**
 * Environment Profiler Tests
 * 
 * Tests system context and execution tracking including:
 * - System environment detection
 * - Performance timing
 * - Resource availability checking
 * - Module list generation
 * - Execution context creation
 * - Phase timing management
 */

import { EnvironmentProfiler } from '../../../../src/analyzers/overview/environment-profiler';
import type { Section1Config, ExecutionContext, SystemEnvironment } from '../../../../src/analyzers/overview/types';

describe('EnvironmentProfiler', () => {
  let profiler: EnvironmentProfiler;
  let config: Section1Config;

  beforeEach(() => {
    config = {
      includeHostEnvironment: true,
      enableFileHashing: false,
      maxSampleSizeForSparsity: 1000,
      privacyMode: 'full',
      detailedProfiling: true,
      enableCompressionAnalysis: false,
      enableDataPreview: false,
      previewRows: 5,
      enableHealthChecks: false,
      enableQuickStatistics: false,
    };
    profiler = new EnvironmentProfiler(config);
  });

  describe('Basic Environment Profiling', () => {
    it('should create execution context with basic information', () => {
      const command = 'datapilot all sample.csv';
      const modules = ['overview', 'quality', 'eda'];
      
      const context = profiler.createExecutionContext(command, modules);

      expect(context.fullCommandExecuted).toBe(command);
      expect(context.analysisMode).toBe('Comprehensive Deep Scan');
      expect(context.analysisStartTimestamp).toBeInstanceOf(Date);
      expect(context.globalSamplingStrategy).toBeDefined();
      expect(context.activatedModules).toEqual(modules);
      expect(context.processingTimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should include host environment when enabled', () => {
      const command = 'datapilot overview test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);

      expect(context.hostEnvironment).toBeDefined();
      expect(context.hostEnvironment?.operatingSystem).toBeDefined();
      expect(context.hostEnvironment?.systemArchitecture).toBeDefined();
      expect(context.hostEnvironment?.executionRuntime).toBeDefined();
      expect(context.hostEnvironment?.availableCpuCores).toBeGreaterThan(0);
      expect(context.hostEnvironment?.availableMemoryGB).toBeGreaterThan(0);
      expect(context.hostEnvironment?.nodeVersion).toBeDefined();
    });

    it('should exclude host environment when disabled', () => {
      const configWithoutEnv = {
        ...config,
        includeHostEnvironment: false,
      };
      const profilerWithoutEnv = new EnvironmentProfiler(configWithoutEnv);
      
      const command = 'datapilot overview test.csv';
      const modules = ['overview'];
      
      const context = profilerWithoutEnv.createExecutionContext(command, modules);

      expect(context.hostEnvironment).toBeUndefined();
    });

    it('should detect operating system correctly', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);

      expect(context.hostEnvironment?.operatingSystem).toBeDefined();
      expect(typeof context.hostEnvironment?.operatingSystem).toBe('string');
      
      // Should include version information
      expect(context.hostEnvironment?.operatingSystem).toBeTruthy();
    });

    it('should detect system architecture', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);

      expect(context.hostEnvironment?.systemArchitecture).toBeDefined();
      expect(typeof context.hostEnvironment?.systemArchitecture).toBe('string');
    });

    it('should detect Node.js version', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);

      expect(context.hostEnvironment?.nodeVersion).toMatch(/^v?\d+\.\d+\.\d+/);
    });
  });

  describe('Performance Timing', () => {
    it('should track phase timing', () => {
      const phaseName = 'test-phase';
      
      profiler.startPhase(phaseName);
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait at least 10ms
      }
      
      const duration = profiler.endPhase(phaseName);
      
      expect(duration).toBeGreaterThanOrEqual(5); // More lenient for timing variations
      expect(duration).toBeLessThan(1000); // Should be reasonable
    });

    it('should handle multiple overlapping phases', () => {
      profiler.startPhase('phase1');
      profiler.startPhase('phase2');
      
      // Simulate work
      const start = Date.now();
      while (Date.now() - start < 5) {}
      
      const duration2 = profiler.endPhase('phase2');
      
      // Simulate more work
      while (Date.now() - start < 15) {}
      
      const duration1 = profiler.endPhase('phase1');
      
      expect(duration2).toBeGreaterThan(0);
      expect(duration1).toBeGreaterThan(0);
      expect(duration1).toBeGreaterThan(duration2);
    });

    it('should throw error for ending non-existent phase', () => {
      expect(() => {
        profiler.endPhase('non-existent-phase');
      }).toThrow("Phase 'non-existent-phase' was not started");
    });

    it('should handle rapid phase transitions', () => {
      const phases = ['phase1', 'phase2', 'phase3'];
      const durations: number[] = [];
      
      for (const phase of phases) {
        profiler.startPhase(phase);
        // Minimal delay
        const start = Date.now();
        while (Date.now() - start < 1) {}
        durations.push(profiler.endPhase(phase));
      }
      
      durations.forEach(duration => {
        expect(duration).toBeGreaterThanOrEqual(0);
      });
    });

    it('should track total elapsed time', () => {
      // Simulate some processing time
      const start = Date.now();
      while (Date.now() - start < 20) {}
      
      const elapsed = profiler.getElapsedTime();
      expect(elapsed).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(1000);
    });

    it('should reset timing correctly', () => {
      profiler.startPhase('test-phase');
      
      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {}
      
      profiler.reset();
      
      // Time should reset to near zero
      const elapsedAfterReset = profiler.getElapsedTime();
      expect(elapsedAfterReset).toBeLessThan(5); // Should be very small
    });
  });

  describe('Performance Summary Generation', () => {
    it('should create performance summary', () => {
      profiler.startPhase('phase1');
      
      // Simulate work
      const start = Date.now();
      while (Date.now() - start < 10) {}
      
      profiler.endPhase('phase1');
      
      const summary = profiler.createPerformanceSummary();
      
      expect(summary.totalAnalysisTime).toBeGreaterThan(0);
      expect(summary.totalAnalysisTime).toBeLessThan(60); // Reasonable upper bound
      expect(typeof summary.totalAnalysisTime).toBe('number');
      
      // May include additional performance metrics
      if (summary.peakMemoryUsage !== undefined) {
        expect(summary.peakMemoryUsage).toBeGreaterThan(0);
      }
    });

    it('should include memory usage when available', () => {
      const summary = profiler.createPerformanceSummary();
      
      // Memory usage is optional but if present should be valid
      if (summary.peakMemoryUsage !== undefined) {
        expect(summary.peakMemoryUsage).toBeGreaterThan(0);
        expect(summary.peakMemoryUsage).toBeLessThan(32 * 1024); // 32GB reasonable upper bound
      }
    });
  });

  describe('Resource Availability Checking', () => {
    it('should check system resource availability', () => {
      const resources = profiler.checkResourceAvailability();
      
      expect(resources).toHaveProperty('memoryAvailable');
      expect(resources).toHaveProperty('cpuLoadEstimate');
      
      expect(typeof resources.memoryAvailable).toBe('boolean');
      expect(['low', 'medium', 'high']).toContain(resources.cpuLoadEstimate);
    });

    it('should provide realistic memory availability assessment', () => {
      const resources = profiler.checkResourceAvailability();
      
      // Memory availability should be based on actual system state
      expect(typeof resources.memoryAvailable).toBe('boolean');
    });

    it('should estimate CPU load appropriately', () => {
      const resources = profiler.checkResourceAvailability();
      
      expect(['low', 'medium', 'high']).toContain(resources.cpuLoadEstimate);
    });
  });

  describe('Module List Generation', () => {
    it('should generate module list for all sections', () => {
      const enabledSections = ['all'];
      const modules = profiler.generateModuleList(enabledSections);
      
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
      expect(modules).toContain('Report Generator');
    });

    it('should generate module list for specific sections', () => {
      const enabledSections = ['overview', 'quality', 'eda'];
      const modules = profiler.generateModuleList(enabledSections);
      
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThanOrEqual(3);
      expect(modules).toContain('Metadata Collector');
      expect(modules).toContain('Quality Assessor');
      expect(modules).toContain('EDA Engine');
    });

    it('should handle single section', () => {
      const enabledSections = ['overview'];
      const modules = profiler.generateModuleList(enabledSections);
      
      expect(Array.isArray(modules)).toBe(true);
      expect(modules).toContain('Metadata Collector');
    });

    it('should handle empty section list', () => {
      const enabledSections: string[] = [];
      const modules = profiler.generateModuleList(enabledSections);
      
      expect(Array.isArray(modules)).toBe(true);
      // Should have some default behaviour
    });

    it('should handle unknown sections gracefully', () => {
      const enabledSections = ['unknown-section', 'overview'];
      const modules = profiler.generateModuleList(enabledSections);
      
      expect(Array.isArray(modules)).toBe(true);
      expect(modules).toContain('Metadata Collector');
      // May or may not include unknown sections
    });
  });

  describe('System Environment Details', () => {
    it('should provide detailed CPU information', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);
      
      expect(context.hostEnvironment?.availableCpuCores).toBeGreaterThan(0);
      expect(context.hostEnvironment?.availableCpuCores).toBeLessThan(1000); // Reasonable upper bound
      expect(Number.isInteger(context.hostEnvironment?.availableCpuCores)).toBe(true);
    });

    it('should provide memory information in GB', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);
      
      expect(context.hostEnvironment?.availableMemoryGB).toBeGreaterThan(0);
      expect(context.hostEnvironment?.availableMemoryGB).toBeLessThan(1024); // 1TB reasonable upper bound
      expect(typeof context.hostEnvironment?.availableMemoryGB).toBe('number');
    });

    it('should identify execution runtime', () => {
      const command = 'datapilot test.csv';
      const modules = ['overview'];
      
      const context = profiler.createExecutionContext(command, modules);
      
      expect(context.hostEnvironment?.executionRuntime).toContain('Node.js');
    });
  });

  describe('Analysis Mode Detection', () => {
    it('should set appropriate analysis mode for comprehensive scan', () => {
      const context = profiler.createExecutionContext('datapilot all file.csv', ['all']);
      expect(context.analysisMode).toBe('Comprehensive Deep Scan');
    });

    it('should set custom analysis mode when provided', () => {
      const customMode = 'Quick Analysis';
      const context = profiler.createExecutionContext(
        'datapilot overview file.csv', 
        ['overview'], 
        customMode
      );
      expect(context.analysisMode).toBe(customMode);
    });

    it('should detect sampling strategy', () => {
      const context = profiler.createExecutionContext('datapilot file.csv', ['all']);
      expect(context.globalSamplingStrategy).toBeDefined();
      expect(typeof context.globalSamplingStrategy).toBe('string');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very short operations', () => {
      profiler.startPhase('instant-phase');
      const duration = profiler.endPhase('instant-phase');
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(10); // Should be very fast
    });

    it('should handle long-running operations', () => {
      profiler.startPhase('long-phase');
      
      // Simulate longer work
      const start = Date.now();
      while (Date.now() - start < 50) {}
      
      const duration = profiler.endPhase('long-phase');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle phase restart after reset', () => {
      profiler.startPhase('test-phase');
      profiler.reset();
      
      // Should be able to start new phases after reset
      profiler.startPhase('new-phase');
      
      const start = Date.now();
      while (Date.now() - start < 5) {}
      
      const duration = profiler.endPhase('new-phase');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple resets', () => {
      profiler.reset();
      profiler.reset();
      profiler.reset();
      
      const elapsed = profiler.getElapsedTime();
      expect(elapsed).toBeLessThan(5); // Should be minimal after reset
    });

    it('should handle special characters in commands', () => {
      const specialCommand = 'datapilot --option="value with spaces" file\ with\ spaces.csv';
      const context = profiler.createExecutionContext(specialCommand, ['overview']);
      
      expect(context.fullCommandExecuted).toBe(specialCommand);
    });

    it('should handle very long module lists', () => {
      const longModuleList = Array.from({ length: 100 }, (_, i) => `module${i}`);
      const modules = profiler.generateModuleList(longModuleList);
      
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Impact', () => {
    it('should respect detailed profiling setting', () => {
      const detailedConfig = {
        ...config,
        detailedProfiling: true,
      };
      const detailedProfiler = new EnvironmentProfiler(detailedConfig);
      
      const context = detailedProfiler.createExecutionContext('datapilot test.csv', ['overview']);
      
      // With detailed profiling, should include comprehensive information
      expect(context.hostEnvironment).toBeDefined();
    });

    it('should handle privacy mode impact on environment info', () => {
      const minimalConfig = {
        ...config,
        privacyMode: 'minimal' as const,
      };
      const minimalProfiler = new EnvironmentProfiler(minimalConfig);
      
      const context = minimalProfiler.createExecutionContext('datapilot test.csv', ['overview']);
      
      // Privacy mode may affect what environment info is included
      expect(context).toBeDefined();
    });
  });

  describe('Performance Metrics Accuracy', () => {
    it('should provide accurate timing measurements', () => {
      const expectedDuration = 25; // ms
      
      profiler.startPhase('timed-phase');
      
      const start = Date.now();
      while (Date.now() - start < expectedDuration) {}
      
      const actualDuration = profiler.endPhase('timed-phase');
      
      // Should be within reasonable margin of error
      expect(actualDuration).toBeGreaterThanOrEqual(expectedDuration * 0.8);
      expect(actualDuration).toBeLessThanOrEqual(expectedDuration * 2);
    });

    it('should maintain timing accuracy across multiple phases', () => {
      const phases = ['phase1', 'phase2', 'phase3'];
      const expectedDurations = [10, 15, 20];
      const actualDurations: number[] = [];
      
      for (let i = 0; i < phases.length; i++) {
        profiler.startPhase(phases[i]);
        
        const start = Date.now();
        while (Date.now() - start < expectedDurations[i]) {}
        
        actualDurations.push(profiler.endPhase(phases[i]));
      }
      
      for (let i = 0; i < actualDurations.length; i++) {
        expect(actualDurations[i]).toBeGreaterThanOrEqual(expectedDurations[i] * 0.8);
        expect(actualDurations[i]).toBeLessThanOrEqual(expectedDurations[i] * 2);
      }
    });
  });
});