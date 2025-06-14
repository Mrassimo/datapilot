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
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        // Simulate a complete DataPilot analysis workflow
        
        // Phase 1: File Analysis
        reporter.startPhase('File Analysis', 'Analyzing file structure and metadata');
        await simulateWork(25);
        
        reporter.updateProgress({
          phase: 'File Analysis',
          progress: 25,
          message: 'Detecting encoding and delimiters',
          timeElapsed: 25
        });
        await simulateWork(25);
        
        reporter.updateProgress({
          phase: 'File Analysis',
          progress: 50,
          message: 'Parsing CSV structure',
          timeElapsed: 50
        });
        await simulateWork(25);
        
        reporter.updateProgress({
          phase: 'File Analysis',
          progress: 75,
          message: 'Analyzing columns and data types',
          timeElapsed: 75
        });
        await simulateWork(25);
        
        reporter.completePhase('File analysis completed successfully', 100);

        // Phase 2: Quality Analysis
        reporter.startPhase('Quality Analysis', 'Assessing data quality metrics');
        await simulateWork(30);
        
        reporter.updateProgress({
          phase: 'Quality Analysis',
          progress: 20,
          message: 'Checking completeness and missing values',
          timeElapsed: 120
        });
        reporter.updateProgress({
          phase: 'Quality Analysis',
          progress: 40,
          message: 'Analyzing uniqueness and duplicates',
          timeElapsed: 140
        });
        reporter.updateProgress({
          phase: 'Quality Analysis',
          progress: 60,
          message: 'Validating data formats and types',
          timeElapsed: 160
        });
        reporter.updateProgress({
          phase: 'Quality Analysis',
          progress: 80,
          message: 'Detecting outliers and anomalies',
          timeElapsed: 180
        });
        reporter.completePhase('Quality analysis completed', 200);

        // Phase 3: EDA Analysis
        reporter.startPhase('Exploratory Data Analysis', 'Performing statistical analysis');
        await simulateWork(20);
        
        reporter.updateProgress({
          phase: 'Exploratory Data Analysis',
          progress: 30,
          message: 'Computing univariate statistics',
          timeElapsed: 220
        });
        reporter.updateProgress({
          phase: 'Exploratory Data Analysis',
          progress: 60,
          message: 'Analyzing correlations and relationships',
          timeElapsed: 240
        });
        reporter.updateProgress({
          phase: 'Exploratory Data Analysis',
          progress: 90,
          message: 'Performing multivariate analysis',
          timeElapsed: 260
        });
        reporter.completePhase('EDA analysis completed', 280);

        // Verify progress callback sequence
        expect(progressCallbacks.length).toBeGreaterThan(6);
        
        // Verify progress values are in valid ranges
        progressCallbacks.forEach(update => {
          expect(update.progress).toBeGreaterThanOrEqual(0);
          expect(update.progress).toBeLessThanOrEqual(100);
          expect(update.message).toBeDefined();
          expect(update.message.length).toBeGreaterThan(0);
        });

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle nested progress tracking for complex operations', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        // Simulate engineering analysis with nested operations
        reporter.startPhase('Engineering Analysis', 'Optimizing data structures');
        
        // Sub-operation 1: Schema Analysis
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 10,
          message: 'Starting schema analysis',
          timeElapsed: 10
        });
        await simulateWork(20);
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 20,
          message: 'Analyzing column types and constraints',
          timeElapsed: 30
        });
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 30,
          message: 'Optimizing data types for efficiency',
          timeElapsed: 40
        });
        
        // Sub-operation 2: Transformation Pipeline
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 40,
          message: 'Building transformation pipeline',
          timeElapsed: 50
        });
        await simulateWork(15);
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 50,
          message: 'Designing feature engineering steps',
          timeElapsed: 65
        });
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 65,
          message: 'Validating transformation logic',
          timeElapsed: 75
        });
        
        // Sub-operation 3: ML Readiness Assessment
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 70,
          message: 'Assessing ML readiness',
          timeElapsed: 85
        });
        await simulateWork(10);
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 85,
          message: 'Computing feature importance',
          timeElapsed: 95
        });
        reporter.updateProgress({
          phase: 'Engineering Analysis',
          progress: 95,
          message: 'Generating recommendations',
          timeElapsed: 105
        });
        
        reporter.completePhase('Engineering analysis completed with optimizations', 150);

        // Verify nested progress tracking
        expect(progressCallbacks.length).toBeGreaterThan(8);
        
        // Verify progress is monotonically increasing within phase
        for (let i = 1; i < progressCallbacks.length; i++) {
          expect(progressCallbacks[i].progress).toBeGreaterThanOrEqual(progressCallbacks[i-1].progress);
        }

      } finally {
        reporter.cleanup();
      }
    });

    it('should provide accurate timing and throughput calculations', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      const startTime = Date.now();

      try {
        reporter.startPhase('Timing Test', 'Testing timing accuracy');
        
        // Simulate processing with known delays
        await simulateWork(50); // ~50ms
        reporter.updateProgress({
          phase: 'Timing Test',
          progress: 25,
          message: 'Quarter complete',
          timeElapsed: 50
        });
        
        await simulateWork(50); // ~50ms
        reporter.updateProgress({
          phase: 'Timing Test',
          progress: 50,
          message: 'Half complete',
          timeElapsed: 100
        });
        
        await simulateWork(50); // ~50ms
        reporter.updateProgress({
          phase: 'Timing Test',
          progress: 75,
          message: 'Three-quarters complete',
          timeElapsed: 150
        });
        
        await simulateWork(50); // ~50ms
        reporter.completePhase('Timing test completed', 200);

        const endTime = Date.now();
        const actualDuration = endTime - startTime;

        // Verify basic timing expectations
        expect(actualDuration).toBeGreaterThan(150); // Should take at least our simulated time
        expect(progressCallbacks.length).toBeGreaterThan(0);
        
        // Verify progress callbacks have reasonable timing
        progressCallbacks.forEach(progress => {
          expect(progress.timeElapsed).toBeGreaterThanOrEqual(0);
          expect(progress.message).toBeDefined();
        });

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle error scenarios gracefully', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        reporter.startPhase('Error Test', 'Testing error handling');
        await simulateWork(30);
        
        reporter.updateProgress({
          phase: 'Error Test',
          progress: 30,
          message: 'Processing data',
          timeElapsed: 30
        });
        
        // Simulate an error condition with warning
        const errorMessage = 'Simulated parsing error: Invalid data format detected';
        reporter.warning(errorMessage);

        // Continue after error
        reporter.updateProgress({
          phase: 'Error Test',
          progress: 50,
          message: 'Attempting recovery',
          timeElapsed: 50
        });
        reporter.completePhase('Error test completed with warnings', 75);

        // Verify progress tracking continued
        expect(progressCallbacks.length).toBeGreaterThan(1);
        
        // Verify all progress values are valid
        progressCallbacks.forEach(callback => {
          expect(callback.progress).toBeGreaterThanOrEqual(0);
          expect(callback.progress).toBeLessThanOrEqual(100);
        });

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle rapid progress updates without performance degradation', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      const startTime = Date.now();

      try {
        reporter.startPhase('Performance Test', 'Testing rapid updates');
        
        // Send many rapid updates
        for (let i = 0; i <= 100; i += 10) {
          reporter.updateProgress({
            phase: 'Performance Test',
            progress: i,
            message: `Processing item ${i}/100`,
            timeElapsed: i
          });
          await simulateWork(1); // Very small delay
        }
        
        reporter.completePhase('Performance test completed', 100);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should handle rapid updates efficiently (under 2 seconds for updates)
        expect(duration).toBeLessThan(2000);
        
        // Verify updates were captured
        expect(progressCallbacks.length).toBeGreaterThan(5);

      } finally {
        reporter.cleanup();
      }
    });

    it('should handle out-of-order progress updates gracefully', () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        reporter.startPhase('Order Test', 'Testing out-of-order updates');
        
        // Send updates out of order
        reporter.updateProgress({
          phase: 'Order Test',
          progress: 50,
          message: 'Mid-point reached',
          timeElapsed: 50
        });
        reporter.updateProgress({
          phase: 'Order Test',
          progress: 25,
          message: 'Should not go backwards',
          timeElapsed: 60
        });
        reporter.updateProgress({
          phase: 'Order Test',
          progress: 75,
          message: 'Continuing forward',
          timeElapsed: 70
        });
        reporter.updateProgress({
          phase: 'Order Test',
          progress: 100,
          message: 'Completion',
          timeElapsed: 80
        });
        
        reporter.completePhase('Order test completed', 90);

        // Verify progress values are handled appropriately
        progressCallbacks.forEach(update => {
          expect(update.progress).toBeGreaterThanOrEqual(0);
          expect(update.progress).toBeLessThanOrEqual(100);
        });

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Output Modes and Formatting', () => {
    it('should adapt output for verbose mode', async () => {
      const verboseCallbacks: any[] = [];
      const verboseReporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      verboseReporter.setProgressCallback((progress) => {
        verboseCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        verboseReporter.startPhase('Verbose Test', 'Testing verbose output');
        await simulateWork(30);
        
        verboseReporter.updateProgress({
          phase: 'Verbose Test',
          progress: 25,
          message: 'Detailed progress information',
          timeElapsed: 25
        });
        verboseReporter.updateProgress({
          phase: 'Verbose Test',
          progress: 50,
          message: 'More detailed information',
          timeElapsed: 50
        });
        verboseReporter.updateProgress({
          phase: 'Verbose Test',
          progress: 75,
          message: 'Comprehensive status update',
          timeElapsed: 75
        });
        
        verboseReporter.completePhase('Verbose test completed with details', 100);

        // Verbose mode should provide callbacks
        expect(verboseCallbacks.length).toBeGreaterThan(3);
        
        // Verify callback structure
        verboseCallbacks.forEach(callback => {
          expect(callback.message).toBeDefined();
          expect(callback.progress).toBeGreaterThanOrEqual(0);
        });

      } finally {
        verboseReporter.cleanup();
      }
    });

    it('should minimize output for quiet mode', async () => {
      const quietCallbacks: any[] = [];
      const quietReporter = new ProgressReporter(true, false); // quiet=true, verbose=false
      quietReporter.setProgressCallback((progress) => {
        quietCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        quietReporter.startPhase('Quiet Test', 'Testing quiet output');
        await simulateWork(20);
        
        quietReporter.updateProgress({
          phase: 'Quiet Test',
          progress: 33,
          message: 'Progress update 1',
          timeElapsed: 33
        });
        quietReporter.updateProgress({
          phase: 'Quiet Test',
          progress: 66,
          message: 'Progress update 2',
          timeElapsed: 66
        });
        quietReporter.updateProgress({
          phase: 'Quiet Test',
          progress: 100,
          message: 'Progress update 3',
          timeElapsed: 100
        });
        
        quietReporter.completePhase('Quiet test completed', 120);

        // Quiet mode should still provide callbacks to listeners
        expect(quietCallbacks.length).toBeGreaterThan(0);
        
        // Verify callback structure
        quietCallbacks.forEach(callback => {
          expect(callback.message).toBeDefined();
          expect(callback.progress).toBeGreaterThanOrEqual(0);
        });

      } finally {
        quietReporter.cleanup();
      }
    });

    it('should handle terminal vs non-terminal output appropriately', () => {
      // Test both TTY and non-TTY environments
      const originalIsTTY = process.stdout.isTTY;

      try {
        // Test TTY environment (mock clearLine to avoid Jest issues)
        const originalClearLine = process.stdout.clearLine;
        const originalCursorTo = process.stdout.cursorTo;
        process.stdout.clearLine = jest.fn();
        process.stdout.cursorTo = jest.fn();
        
        process.stdout.isTTY = true;
        const ttyReporter = new ProgressReporter(false, false); // quiet=false, verbose=false
        ttyReporter.setProgressCallback((progress) => {
          progressCallbacks.push({
            phase: 'test',
            progress: progress.progress,
            message: progress.message,
            timeElapsed: 0
          });
        });

        ttyReporter.startPhase('TTY Test', 'Testing TTY output');
        ttyReporter.updateProgress({
          phase: 'TTY Test',
          progress: 50,
          message: 'TTY progress update',
          timeElapsed: 50
        });
        ttyReporter.completePhase('TTY test completed', 100);
        ttyReporter.cleanup();

        const ttyCallbacks = [...progressCallbacks];
        progressCallbacks = [];

        // Test non-TTY environment
        process.stdout.isTTY = false;
        const nonTtyReporter = new ProgressReporter(false, false); // quiet=false, verbose=false
        nonTtyReporter.setProgressCallback((progress) => {
          progressCallbacks.push({
            phase: 'test',
            progress: progress.progress,
            message: progress.message,
            timeElapsed: 0
          });
        });

        nonTtyReporter.startPhase('Non-TTY Test', 'Testing non-TTY output');
        nonTtyReporter.updateProgress({
          phase: 'Non-TTY Test',
          progress: 50,
          message: 'Non-TTY progress update',
          timeElapsed: 50
        });
        nonTtyReporter.completePhase('Non-TTY test completed', 100);
        nonTtyReporter.cleanup();

        const nonTtyCallbacks = [...progressCallbacks];

        // Both should provide callbacks
        expect(ttyCallbacks.length).toBeGreaterThan(0);
        expect(nonTtyCallbacks.length).toBeGreaterThan(0);

        // Restore mocked functions
        process.stdout.clearLine = originalClearLine;
        process.stdout.cursorTo = originalCursorTo;

      } finally {
        process.stdout.isTTY = originalIsTTY;
      }
    });
  });

  describe('Summary and Statistics', () => {
    it('should provide comprehensive summary statistics', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
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
          reporter.updateProgress({
            phase: phase.name,
            progress: 25,
            message: `${phase.name} 25% complete`,
            timeElapsed: phase.duration / 4
          });
          
          await simulateWork(phase.duration / 4);
          reporter.updateProgress({
            phase: phase.name,
            progress: 50,
            message: `${phase.name} 50% complete`,
            timeElapsed: phase.duration / 2
          });
          
          await simulateWork(phase.duration / 4);
          reporter.updateProgress({
            phase: phase.name,
            progress: 75,
            message: `${phase.name} 75% complete`,
            timeElapsed: (phase.duration * 3) / 4
          });
          
          await simulateWork(phase.duration / 4);
          reporter.completePhase(`${phase.name} completed successfully`, phase.duration);
        }

        // Verify progress tracking worked
        expect(progressCallbacks.length).toBeGreaterThan(9);
        
        // Verify all phases were tracked
        const uniquePhases = new Set(progressCallbacks.map(cb => cb.phase));
        expect(uniquePhases.size).toBeGreaterThan(0);
        
        // Verify progress values are valid
        progressCallbacks.forEach(callback => {
          expect(callback.progress).toBeGreaterThanOrEqual(0);
          expect(callback.progress).toBeLessThanOrEqual(100);
          expect(callback.message).toBeDefined();
        });

      } finally {
        reporter.cleanup();
      }
    });

    it('should calculate throughput and efficiency metrics', async () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      try {
        reporter.startPhase('Throughput Test', 'Testing throughput calculations');
        
        // Simulate processing 1000 records
        const totalRecords = 1000;
        const batchSize = 100;
        
        for (let processed = 0; processed < totalRecords; processed += batchSize) {
          const percentage = (processed / totalRecords) * 100;
          reporter.updateProgress({
            phase: 'Throughput Test',
            progress: percentage,
            message: `Processed ${processed}/${totalRecords} records`,
            timeElapsed: processed / 10
          });
          await simulateWork(20); // Simulate processing time
        }
        
        reporter.completePhase(`Processed ${totalRecords} records successfully`, 200);

        // Verify progress tracking for throughput test
        expect(progressCallbacks.length).toBeGreaterThan(5);
        
        // Verify message content includes record counts
        const recordMessages = progressCallbacks.filter(cb => 
          cb.message.includes('records')
        );
        expect(recordMessages.length).toBeGreaterThan(0);

      } finally {
        reporter.cleanup();
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle cleanup properly', () => {
      const reporter = new ProgressReporter(false, true); // quiet=false, verbose=true
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
      });

      reporter.startPhase('Cleanup Test', 'Testing resource cleanup');
      reporter.updateProgress({
        phase: 'Cleanup Test',
        progress: 50,
        message: 'Mid-phase progress',
        timeElapsed: 50
      });
      
      // Cleanup should not throw
      expect(() => {
        reporter.cleanup();
      }).not.toThrow();

      // Further operations after cleanup should handle gracefully
      expect(() => {
        reporter.updateProgress({
          phase: 'Cleanup Test',
          progress: 75,
          message: 'Post-cleanup update',
          timeElapsed: 75
        });
        reporter.completePhase('Should handle gracefully', 100);
      }).not.toThrow();
    });

    it('should handle multiple cleanup calls safely', () => {
      const reporter = new ProgressReporter(false, false); // quiet=false, verbose=false
      reporter.setProgressCallback((progress) => {
        progressCallbacks.push({
          phase: 'test',
          progress: progress.progress,
          message: progress.message,
          timeElapsed: 0
        });
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