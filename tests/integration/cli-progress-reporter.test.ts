/**
 * CLI Progress Reporter Integration Tests
 * 
 * Comprehensive testing of progress reporting functionality including
 * spinner animations, progress tracking, timing calculations, and callback systems.
 */

import { ProgressReporter } from '../../src/cli/progress-reporter';
import type { ProgressState, ProgressCallback } from '../../src/cli/types';

describe('CLI Progress Reporter Integration', () => {
  let progressCallbacks: ProgressState[];
  let mockProgressCallback: ProgressCallback;

  beforeEach(() => {
    progressCallbacks = [];
    mockProgressCallback = (progress: ProgressState) => {
      progressCallbacks.push({ ...progress });
    };
  });

  describe('Progress Reporting Workflow', () => {
    it('should provide comprehensive progress tracking through complete analysis workflow', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        // Simulate a complete DataPilot analysis workflow
        
        // Phase 1: File Analysis
        reporter.startPhase('File Analysis', 'Analyzing file structure and metadata');
        await simulateWork(25);
        
        reporter.updateProgress(25, 'Detecting encoding and delimiters');
        await simulateWork(25);
        
        reporter.updateProgress(50, 'Parsing CSV structure');
        await simulateWork(25);
        
        reporter.updateProgress(75, 'Analyzing columns and data types');
        await simulateWork(25);
        
        reporter.completePhase('File analysis completed successfully');

        // Phase 2: Quality Analysis
        reporter.startPhase('Quality Analysis', 'Assessing data quality metrics');
        await simulateWork(30);
        
        reporter.updateProgress(20, 'Checking completeness and missing values');
        reporter.updateProgress(40, 'Analyzing uniqueness and duplicates');
        reporter.updateProgress(60, 'Validating data formats and types');
        reporter.updateProgress(80, 'Detecting outliers and anomalies');
        reporter.completePhase('Quality analysis completed');

        // Phase 3: EDA Analysis
        reporter.startPhase('Exploratory Data Analysis', 'Performing statistical analysis');
        await simulateWork(20);
        
        reporter.updateProgress(30, 'Computing univariate statistics');
        reporter.updateProgress(60, 'Analyzing correlations and relationships');
        reporter.updateProgress(90, 'Performing multivariate analysis');
        reporter.completePhase('EDA analysis completed');

        // Verify progress callback sequence
        expect(progressCallbacks.length).toBeGreaterThan(10);
        
        const phaseStarts = progressCallbacks.filter(cb => cb.type === 'phase_start');
        const progressUpdates = progressCallbacks.filter(cb => cb.type === 'progress');
        const phaseCompletions = progressCallbacks.filter(cb => cb.type === 'phase_complete');

        expect(phaseStarts.length).toBe(3);
        expect(progressUpdates.length).toBeGreaterThan(6);
        expect(phaseCompletions.length).toBe(3);

        // Verify phase sequencing
        expect(phaseStarts[0].phase).toBe('File Analysis');
        expect(phaseStarts[1].phase).toBe('Quality Analysis');
        expect(phaseStarts[2].phase).toBe('Exploratory Data Analysis');

        // Verify progress values are in valid ranges
        progressUpdates.forEach(update => {
          expect(update.percentage).toBeGreaterThanOrEqual(0);
          expect(update.percentage).toBeLessThanOrEqual(100);
          expect(update.message).toBeDefined();
          expect(update.message.length).toBeGreaterThan(0);
        });

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle nested progress tracking for complex operations', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        // Simulate engineering analysis with nested operations
        reporter.startPhase('Engineering Analysis', 'Optimizing data structures');
        
        // Sub-operation 1: Schema Analysis
        reporter.updateProgress(10, 'Starting schema analysis');
        await simulateWork(20);
        reporter.updateProgress(20, 'Analyzing column types and constraints');
        reporter.updateProgress(30, 'Optimizing data types for efficiency');
        
        // Sub-operation 2: Transformation Pipeline
        reporter.updateProgress(40, 'Building transformation pipeline');
        await simulateWork(15);
        reporter.updateProgress(50, 'Designing feature engineering steps');
        reporter.updateProgress(65, 'Validating transformation logic');
        
        // Sub-operation 3: ML Readiness Assessment
        reporter.updateProgress(70, 'Assessing ML readiness');
        await simulateWork(10);
        reporter.updateProgress(85, 'Computing feature importance');
        reporter.updateProgress(95, 'Generating recommendations');
        
        reporter.completePhase('Engineering analysis completed with optimizations');

        // Verify nested progress tracking
        const progressUpdates = progressCallbacks.filter(cb => cb.type === 'progress');
        expect(progressUpdates.length).toBeGreaterThan(8);
        
        // Verify progress is monotonically increasing within phase
        for (let i = 1; i < progressUpdates.length; i++) {
          expect(progressUpdates[i].percentage).toBeGreaterThanOrEqual(progressUpdates[i-1].percentage);
        }

      } finally {
        reporter.cleanup();
      }
    });

    it('should provide accurate timing and throughput calculations', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      const startTime = Date.now();

      try {
        reporter.startPhase('Timing Test', 'Testing timing accuracy');
        
        // Simulate processing with known delays
        await simulateWork(50); // ~50ms
        reporter.updateProgress(25, 'Quarter complete');
        
        await simulateWork(50); // ~50ms
        reporter.updateProgress(50, 'Half complete');
        
        await simulateWork(50); // ~50ms
        reporter.updateProgress(75, 'Three-quarters complete');
        
        await simulateWork(50); // ~50ms
        reporter.completePhase('Timing test completed');

        const endTime = Date.now();
        const actualDuration = endTime - startTime;

        // Verify timing accuracy
        const summary = reporter.getSummary();
        expect(summary.totalDuration).toBeGreaterThan(0);
        expect(summary.totalDuration).toBeLessThan(actualDuration + 100); // Allow 100ms tolerance
        expect(summary.totalDuration).toBeGreaterThan(actualDuration - 100);

        // Check that ETA calculations are reasonable
        const progressWithETA = progressCallbacks.filter(cb => 
          cb.type === 'progress' && cb.estimatedTimeRemaining !== undefined
        );
        
        if (progressWithETA.length > 0) {
          progressWithETA.forEach(progress => {
            expect(progress.estimatedTimeRemaining).toBeGreaterThan(0);
            expect(progress.estimatedTimeRemaining).toBeLessThan(10000); // Less than 10 seconds
          });
        }

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle error scenarios gracefully', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        reporter.startPhase('Error Test', 'Testing error handling');
        await simulateWork(30);
        
        reporter.updateProgress(30, 'Processing data');
        
        // Simulate an error condition
        const errorMessage = 'Simulated parsing error: Invalid data format detected';
        reporter.reportError(errorMessage, {
          phase: 'Error Test',
          operation: 'data_parsing',
          severity: 'high'
        });

        // Continue after error
        reporter.updateProgress(50, 'Attempting recovery');
        reporter.completePhase('Error test completed with warnings');

        // Verify error was captured
        const errorCallbacks = progressCallbacks.filter(cb => cb.type === 'error');
        expect(errorCallbacks.length).toBe(1);
        expect(errorCallbacks[0].message).toContain(errorMessage);
        expect(errorCallbacks[0].context).toBeDefined();
        expect(errorCallbacks[0].context?.severity).toBe('high');

        // Verify workflow continued after error
        const postErrorUpdates = progressCallbacks.filter((cb, index) => 
          cb.type === 'progress' && 
          index > progressCallbacks.findIndex(p => p.type === 'error')
        );
        expect(postErrorUpdates.length).toBeGreaterThan(0);

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle rapid progress updates without performance degradation', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      const startTime = Date.now();

      try {
        reporter.startPhase('Performance Test', 'Testing rapid updates');
        
        // Send many rapid updates
        for (let i = 0; i <= 100; i += 2) {
          reporter.updateProgress(i, `Processing item ${i}/100`);
          await simulateWork(1); // Very small delay
        }
        
        reporter.completePhase('Performance test completed');

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should handle rapid updates efficiently (under 2 seconds for 50 updates)
        expect(duration).toBeLessThan(2000);
        
        // Verify all updates were captured
        const progressUpdates = progressCallbacks.filter(cb => cb.type === 'progress');
        expect(progressUpdates.length).toBeGreaterThan(40); // May throttle some updates

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle out-of-order progress updates gracefully', () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        reporter.startPhase('Order Test', 'Testing out-of-order updates');
        
        // Send updates out of order
        reporter.updateProgress(50, 'Mid-point reached');
        reporter.updateProgress(25, 'Should not go backwards'); // Invalid
        reporter.updateProgress(75, 'Continuing forward');
        reporter.updateProgress(60, 'Another backward attempt'); // Invalid
        reporter.updateProgress(100, 'Completion');
        
        reporter.completePhase('Order test completed');

        // Verify progress values are handled appropriately
        const progressUpdates = progressCallbacks.filter(cb => cb.type === 'progress');
        
        // Should either reject backwards progress or handle gracefully
        progressUpdates.forEach(update => {
          expect(update.percentage).toBeGreaterThanOrEqual(0);
          expect(update.percentage).toBeLessThanOrEqual(100);
        });

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Output Modes and Formatting', () => {
    it('should adapt output for verbose mode', async () => {
      const verboseCallbacks: ProgressState[] = [];
      const verboseReporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: (progress) => verboseCallbacks.push({ ...progress })
      });

      try {
        verboseReporter.startPhase('Verbose Test', 'Testing verbose output');
        await simulateWork(30);
        
        verboseReporter.updateProgress(25, 'Detailed progress information');
        verboseReporter.updateProgress(50, 'More detailed information');
        verboseReporter.updateProgress(75, 'Comprehensive status update');
        
        verboseReporter.completePhase('Verbose test completed with details');

        // Verbose mode should provide more detailed callbacks
        expect(verboseCallbacks.length).toBeGreaterThan(3);
        
        // Should include detailed timing information
        const detailedCallbacks = verboseCallbacks.filter(cb => 
          cb.details !== undefined || cb.estimatedTimeRemaining !== undefined
        );
        expect(detailedCallbacks.length).toBeGreaterThan(0);

      } finally {
        verboseReporter.cleanup();
      }
    });

    it('should minimize output for quiet mode', async () => {
      const quietCallbacks: ProgressState[] = [];
      const quietReporter = new ProgressReporter({
        verbose: false,
        quiet: true,
        progressCallback: (progress) => quietCallbacks.push({ ...progress })
      });

      try {
        quietReporter.startPhase('Quiet Test', 'Testing quiet output');
        await simulateWork(20);
        
        quietReporter.updateProgress(33, 'Progress update 1');
        quietReporter.updateProgress(66, 'Progress update 2');
        quietReporter.updateProgress(100, 'Progress update 3');
        
        quietReporter.completePhase('Quiet test completed');

        // Quiet mode should minimize callbacks (possibly only start/end)
        expect(quietCallbacks.length).toBeLessThan(8);
        
        // Should still capture essential phase transitions
        const phaseStarts = quietCallbacks.filter(cb => cb.type === 'phase_start');
        const phaseCompletions = quietCallbacks.filter(cb => cb.type === 'phase_complete');
        
        expect(phaseStarts.length).toBe(1);
        expect(phaseCompletions.length).toBe(1);

      } finally {
        quietReporter.cleanup();
      }
    });

    it('should handle terminal vs non-terminal output appropriately', () => {
      // Test both TTY and non-TTY environments
      const originalIsTTY = process.stdout.isTTY;

      try {
        // Test TTY environment
        process.stdout.isTTY = true;
        const ttyReporter = new ProgressReporter({
          verbose: false,
          quiet: false,
          progressCallback: mockProgressCallback
        });

        ttyReporter.startPhase('TTY Test', 'Testing TTY output');
        ttyReporter.updateProgress(50, 'TTY progress update');
        ttyReporter.completePhase('TTY test completed');
        ttyReporter.cleanup();

        const ttyCallbacks = [...progressCallbacks];
        progressCallbacks = [];

        // Test non-TTY environment
        process.stdout.isTTY = false;
        const nonTtyReporter = new ProgressReporter({
          verbose: false,
          quiet: false,
          progressCallback: mockProgressCallback
        });

        nonTtyReporter.startPhase('Non-TTY Test', 'Testing non-TTY output');
        nonTtyReporter.updateProgress(50, 'Non-TTY progress update');
        nonTtyReporter.completePhase('Non-TTY test completed');
        nonTtyReporter.cleanup();

        const nonTtyCallbacks = [...progressCallbacks];

        // Both should provide callbacks, but TTY might have more visual elements
        expect(ttyCallbacks.length).toBeGreaterThan(0);
        expect(nonTtyCallbacks.length).toBeGreaterThan(0);

      } finally {
        process.stdout.isTTY = originalIsTTY;
      }
    });
  });

  describe('Summary and Statistics', () => {
    it('should provide comprehensive summary statistics', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        // Simulate a complete multi-phase analysis
        const phases = [
          { name: 'File Analysis', duration: 100 },
          { name: 'Quality Analysis', duration: 150 },
          { name: 'EDA Analysis', duration: 200 }
        ];

        for (const phase of phases) {
          reporter.startPhase(phase.name, `Performing ${phase.name.toLowerCase()}`);
          
          await simulateWork(phase.duration / 4);
          reporter.updateProgress(25, `${phase.name} 25% complete`);
          
          await simulateWork(phase.duration / 4);
          reporter.updateProgress(50, `${phase.name} 50% complete`);
          
          await simulateWork(phase.duration / 4);
          reporter.updateProgress(75, `${phase.name} 75% complete`);
          
          await simulateWork(phase.duration / 4);
          reporter.completePhase(`${phase.name} completed successfully`);
        }

        const summary = reporter.getSummary();

        // Verify summary completeness
        expect(summary.totalDuration).toBeGreaterThan(0);
        expect(summary.phasesCompleted).toBe(3);
        expect(summary.totalProgressUpdates).toBeGreaterThan(9);
        expect(summary.averagePhaseTime).toBeGreaterThan(0);
        
        // Verify phase-specific statistics
        expect(summary.phaseStatistics).toBeDefined();
        expect(summary.phaseStatistics.length).toBe(3);
        
        summary.phaseStatistics.forEach((phaseStat, index) => {
          expect(phaseStat.phaseName).toBe(phases[index].name);
          expect(phaseStat.duration).toBeGreaterThan(0);
          expect(phaseStat.progressUpdates).toBeGreaterThan(0);
        });

      } finally {
        reporter.cleanup();
      }
    });

    it('should calculate throughput and efficiency metrics', async () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      try {
        reporter.startPhase('Throughput Test', 'Testing throughput calculations');
        
        // Simulate processing 1000 records
        const totalRecords = 1000;
        const batchSize = 100;
        
        for (let processed = 0; processed < totalRecords; processed += batchSize) {
          const percentage = (processed / totalRecords) * 100;
          reporter.updateProgress(percentage, `Processed ${processed}/${totalRecords} records`);
          await simulateWork(20); // Simulate processing time
        }
        
        reporter.completePhase(`Processed ${totalRecords} records successfully`);

        const summary = reporter.getSummary();
        
        // Verify throughput calculations
        if (summary.throughputMetrics) {
          expect(summary.throughputMetrics.recordsPerSecond).toBeGreaterThan(0);
          expect(summary.throughputMetrics.totalRecordsProcessed).toBe(totalRecords);
          expect(summary.throughputMetrics.efficiency).toBeGreaterThanOrEqual(0);
          expect(summary.throughputMetrics.efficiency).toBeLessThanOrEqual(100);
        }

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle cleanup properly', () => {
      const reporter = new ProgressReporter({
        verbose: true,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      reporter.startPhase('Cleanup Test', 'Testing resource cleanup');
      reporter.updateProgress(50, 'Mid-phase progress');
      
      // Cleanup should not throw
      expect(() => {
        reporter.cleanup();
      }).not.toThrow();

      // Further operations after cleanup should handle gracefully
      expect(() => {
        reporter.updateProgress(75, 'Post-cleanup update');
        reporter.completePhase('Should handle gracefully');
      }).not.toThrow();
    });

    it('should handle multiple cleanup calls safely', () => {
      const reporter = new ProgressReporter({
        verbose: false,
        quiet: false,
        progressCallback: mockProgressCallback
      });

      reporter.startPhase('Multiple Cleanup Test', 'Testing multiple cleanup calls');
      
      // Multiple cleanup calls should be safe
      expect(() => {
        reporter.cleanup();
        reporter.cleanup();
        reporter.cleanup();
      }).not.toThrow();
    });
  });
});

// Helper function to simulate work with realistic timing
function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}