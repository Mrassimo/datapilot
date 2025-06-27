#!/usr/bin/env node

/**
 * DataPilot CLI - Lean Entry Point
 * Orchestrates focused modules for comprehensive CSV data analysis
 */

import { ArgumentParser } from './argument-parser';
import { UniversalAnalyzer } from './universal-analyzer';
import { OutputManager } from './output-manager';
import type { CLIResult, CLIOptions } from './types';
import { globalCleanupHandler, globalMemoryManager } from '../utils/memory-manager';
import { logger } from '../utils/logger';

export class DataPilotCLI {
  private parser: ArgumentParser;
  private analyzer: UniversalAnalyzer;
  private outputManager: OutputManager;

  constructor() {
    this.parser = new ArgumentParser();
    this.analyzer = new UniversalAnalyzer();
    this.outputManager = new OutputManager({});
    this.initializeGlobalHandlers();
  }

  /**
   * Main CLI execution entry point
   */
  async run(argv: string[] = process.argv): Promise<CLIResult> {
    try {
      // Parse command line arguments
      const context = this.parser.parse(argv);
      
      if (!context.file && (!context.args || context.args.length === 0)) {
        return {
          success: false,
          exitCode: 1,
          data: { error: 'No input files specified' }
        };
      }
      
      // Get the file path to analyze
      const filePath = context.file || context.args[0];
      
      // Run analysis
      const result = await this.analyzer.analyzeFile(filePath, context.options);
      
      return result;
    } catch (error) {
      logger.error(`CLI execution failed: ${error}`);
      return {
        success: false,
        exitCode: 1,
        data: { error: String(error) }
      };
    } finally {
      // Ensure cleanup runs
      await this.cleanup();
    }
  }

  /**
   * Set progress callback for test purposes
   */
  setProgressCallback(callback: (progress: { message: string; progress: number }) => void): void {
    // This could be implemented by passing callback to command executor
    // For now, this is a placeholder for compatibility
  }

  /**
   * Initialize global error handling and memory management
   */
  private initializeGlobalHandlers(): void {
    // Start memory monitoring
    globalMemoryManager.startMonitoring({ analyzer: 'CLI', operation: 'initialization' });

    // Register global cleanup handler
    globalCleanupHandler.register(async () => {
      logger.debug('CLI cleanup: stopping memory monitoring');
      globalMemoryManager.stopMonitoring();
    });

    // Handle process exit gracefully
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, cleaning up...');
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, cleaning up...');
      await this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      globalMemoryManager.stopMonitoring();
      await globalCleanupHandler.runCleanup();
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }
}

// Main execution when run directly
async function main(): Promise<void> {
  try {
    const cli = new DataPilotCLI();
    const result = await cli.run();

    // Exit with appropriate code
    process.exit(result.exitCode || (result.success ? 0 : 1));
  } catch (error) {
    console.error('Fatal CLI error:', error);
    process.exit(1);
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled CLI error:', error);
    process.exit(1);
  });
}

// Export for external usage
export { main };
export default DataPilotCLI;