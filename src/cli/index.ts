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
      
      // If analysis was successful, format and output the results
      if (result.success && result.data) {
        await this.formatAndOutputResults(result, filePath, context.options);
      }
      
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
   * Format and output analysis results using OutputManager
   */
  private async formatAndOutputResults(result: CLIResult, filePath: string, options: any): Promise<void> {
    try {
      // Update the output manager with current options
      this.outputManager = new OutputManager(options);
      
      const analysisData = result.data;
      const fileName = filePath.split('/').pop() || filePath;
      
      // Output each section that was analyzed
      if (analysisData.section1) {
        this.outputManager.outputSection1(analysisData.section1, fileName);
      }
      
      if (analysisData.section2) {
        this.outputManager.outputSection2(analysisData.section2, fileName);
      }
      
      if (analysisData.section3) {
        // Generate report content for Section 3
        const section3Report = this.generateSection3Report(analysisData.section3);
        this.outputManager.outputSection3(section3Report, analysisData.section3, fileName);
      }
      
      if (analysisData.section4) {
        // Generate report content for Section 4
        const section4Report = this.generateSection4Report(analysisData.section4);
        this.outputManager.outputSection4(section4Report, analysisData.section4, fileName);
      }
      
      if (analysisData.section5) {
        // Generate report content for Section 5
        const section5Report = this.generateSection5Report(analysisData.section5);
        this.outputManager.outputSection5(section5Report, analysisData.section5, fileName);
      }
      
      if (analysisData.section6) {
        // Generate report content for Section 6
        const section6Report = this.generateSection6Report(analysisData.section6);
        this.outputManager.outputSection6(section6Report, analysisData.section6, fileName);
      }
      
    } catch (error) {
      logger.error('Failed to format and output results:', error);
      // Fall back to simple output
      if (!options.quiet) {
        console.log('\n📊 Analysis Results:');
        console.log(JSON.stringify(result.data, null, 2));
      }
    }
  }

  /**
   * Generate Section 3 report content
   */
  private generateSection3Report(section3Result: any): string {
    const { Section3Formatter } = require('../analyzers/eda');
    return Section3Formatter.formatMarkdown(section3Result);
  }

  /**
   * Generate Section 4 report content
   */
  private generateSection4Report(section4Result: any): string {
    const { Section4Formatter } = require('../analyzers/visualization');
    return Section4Formatter.formatMarkdown(section4Result);
  }

  /**
   * Generate Section 5 report content
   */
  private generateSection5Report(section5Result: any): string {
    const { Section5Formatter } = require('../analyzers/engineering');
    return Section5Formatter.formatMarkdown(section5Result);
  }

  /**
   * Generate Section 6 report content
   */
  private generateSection6Report(section6Result: any): string {
    const { Section6Formatter } = require('../analyzers/modeling');
    return Section6Formatter.formatMarkdown(section6Result);
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