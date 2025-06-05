/**
 * CLI Progress Reporter - Real-time progress updates with spinners and progress bars
 */

import type { ProgressState } from './types';

export class ProgressReporter {
  private quiet: boolean;
  private verbose: boolean;
  private currentPhase?: string;
  private spinnerInterval?: NodeJS.Timeout;
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex = 0;

  constructor(quiet: boolean = false, verbose: boolean = false) {
    this.quiet = quiet;
    this.verbose = verbose;
  }

  /**
   * Start progress reporting for a phase
   */
  startPhase(phase: string, message: string): void {
    if (this.quiet) return;

    this.currentPhase = phase;
    this.stopSpinner();

    if (this.verbose) {
      console.log(`\n🔄 ${phase}: ${message}`);
    } else {
      process.stdout.write(`${this.getSpinnerFrame()} ${message}`);
      this.startSpinner();
    }
  }

  /**
   * Update progress within a phase
   */
  updateProgress(state: ProgressState): void {
    if (this.quiet) return;

    if (this.verbose) {
      const timeStr = this.formatTime(state.timeElapsed);
      const etaStr = state.estimatedTimeRemaining 
        ? ` (ETA: ${this.formatTime(state.estimatedTimeRemaining)})`
        : '';
      
      console.log(`  📊 ${state.progress}% - ${state.message} [${timeStr}]${etaStr}`);
    } else {
      // Update spinner message
      this.clearLine();
      process.stdout.write(`${this.getSpinnerFrame()} ${state.message} (${state.progress}%)`);
    }
  }

  /**
   * Complete current phase
   */
  completePhase(message: string, timeElapsed: number): void {
    if (this.quiet) return;

    this.stopSpinner();
    this.clearLine();
    
    const timeStr = this.formatTime(timeElapsed);
    console.log(`✅ ${message} [${timeStr}]`);
  }

  /**
   * Report error in current phase
   */
  errorPhase(message: string): void {
    if (this.quiet) return;

    this.stopSpinner();
    this.clearLine();
    console.log(`❌ ${message}`);
  }

  /**
   * Report warning
   */
  warning(message: string): void {
    if (this.quiet) return;
    
    if (this.currentPhase) {
      this.pauseSpinner();
      console.log(`⚠️  ${message}`);
      this.resumeSpinner();
    } else {
      console.log(`⚠️  ${message}`);
    }
  }

  /**
   * Report info message
   */
  info(message: string): void {
    if (this.quiet || !this.verbose) return;
    
    if (this.currentPhase) {
      this.pauseSpinner();
      console.log(`ℹ️  ${message}`);
      this.resumeSpinner();
    } else {
      console.log(`ℹ️  ${message}`);
    }
  }

  /**
   * Show summary statistics
   */
  showSummary(stats: {
    processingTime: number;
    rowsProcessed: number;
    warnings: number;
    errors: number;
  }): void {
    if (this.quiet) return;

    console.log('\n📊 Summary:');
    console.log(`   • Processing time: ${this.formatTime(stats.processingTime)}`);
    console.log(`   • Rows processed: ${stats.rowsProcessed.toLocaleString()}`);
    console.log(`   • Warnings: ${stats.warnings}`);
    console.log(`   • Errors: ${stats.errors}`);
    
    if (stats.processingTime > 0) {
      const throughput = Math.round(stats.rowsProcessed / (stats.processingTime / 1000));
      console.log(`   • Throughput: ${throughput.toLocaleString()} rows/second`);
    }
  }

  /**
   * Start the spinner animation
   */
  private startSpinner(): void {
    if (this.spinnerInterval) return;
    
    this.spinnerInterval = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
      this.updateSpinnerFrame();
    }, 100);
  }

  /**
   * Stop the spinner animation
   */
  private stopSpinner(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = undefined;
    }
  }

  /**
   * Pause spinner temporarily
   */
  private pauseSpinner(): void {
    this.stopSpinner();
    this.clearLine();
  }

  /**
   * Resume spinner after pause
   */
  private resumeSpinner(): void {
    if (this.currentPhase && !this.verbose) {
      process.stdout.write(`${this.getSpinnerFrame()} Processing...`);
      this.startSpinner();
    }
  }

  /**
   * Get current spinner frame
   */
  private getSpinnerFrame(): string {
    return this.spinnerFrames[this.spinnerIndex];
  }

  /**
   * Update spinner frame in place
   */
  private updateSpinnerFrame(): void {
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${this.getSpinnerFrame()}`);
      process.stdout.moveCursor(-1, 0);
    }
  }

  /**
   * Clear current line
   */
  private clearLine(): void {
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    } else {
      process.stdout.write('\n');
    }
  }

  /**
   * Format time duration
   */
  private formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.round((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Cleanup on exit
   */
  cleanup(): void {
    this.stopSpinner();
    if (process.stdout.isTTY && this.currentPhase) {
      this.clearLine();
    }
  }
}