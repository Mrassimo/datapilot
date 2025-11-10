#!/usr/bin/env node

/**
 * DataPilot CLI - Lean Entry Point
 * Orchestrates focused modules for comprehensive CSV data analysis
 */

import { ArgumentParser } from './argument-parser';
import { UniversalAnalyzer } from './universal-analyzer';
import { OutputManager } from './output-manager';
import type { CLIResult, CLIOptions, CLIContext } from './types';
import { globalCleanupHandler, globalMemoryManager } from '../utils/memory-manager';
import { logger } from '../utils/logger';
import { WindowsPathHelper } from './windows-path-helper';
import { SectionCacheManager } from '../performance/section-cache-manager';
import { createResultCache } from './result-cache';

export class DataPilotCLI {
  private parser: ArgumentParser;
  private analyzer: UniversalAnalyzer;
  private outputManager: OutputManager;
  private static processListenersRegistered = false;

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


      if (context.command === 'version') {
        console.log(this.parser.getVersion());
        return { success: true, exitCode: 0 };
      }
      
      // Handle no-file commands (clear-cache, perf, etc.)
      const noFileCommands = ['clear-cache', 'perf'];
      if (noFileCommands.includes(context.command)) {
        return await this.handleNoFileCommand(context.command, context.options);
      }
      
      if (!context.file && (!context.args || context.args.length === 0)) {
        this.parser.showHelp();
        return {
          success: false,
          exitCode: 1,
          data: { error: 'No input files specified' }
        };
      }
      
      // Handle dry-run mode - validate and preview without executing
      if (context.options.dryRun) {
        return await this.handleDryRun(context);
      }

      // Handle lightweight commands (validate, info) separately
      const lightweightCommands = ['validate', 'info'];
      if (lightweightCommands.includes(context.command)) {
        const filePath = context.file || context.args[0];
        const analysisOptions = {
          ...context.options,
          command: context.command
        };

        let result;
        if (context.command === 'validate') {
          result = await this.analyzer.validateCSVFile(filePath, analysisOptions);
        } else if (context.command === 'info') {
          result = await this.analyzer.getFileInfo(filePath, analysisOptions);
        }

        return result;
      }

      // Detect multi-file scenarios for join-related commands
      const multiFileCommands = ['engineering', 'join', 'discover', 'join-wizard', 'optimize-joins'];
      const isMultiFileCommand = multiFileCommands.includes(context.command) && context.args && context.args.length > 1;
      
      // Add command to options for proper section selection
      const analysisOptions = {
        ...context.options,
        command: context.command
      };
      
      // Run analysis - route to appropriate analyzer method
      let result;
      if (context.command === 'all') {
        this.outputManager.startCombinedOutput();
      }

      if (isMultiFileCommand) {
        // Multi-file join analysis
        result = await this.analyzer.analyzeMultipleFiles(context.args, analysisOptions);
      } else {
        // Single file analysis (existing behavior)
        const filePath = context.file || context.args[0];
        result = await this.analyzer.analyzeFile(filePath, analysisOptions);
      }
      
      // If analysis was successful, format and output the results
      if (result.success && result.data) {
        const primaryFilePath = isMultiFileCommand ? context.args[0] : (context.file || context.args[0]);
        await this.formatAndOutputResults(result, primaryFilePath, context.options);
        if (context.command === 'all') {
          this.outputManager.outputCombined(primaryFilePath);
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`CLI execution failed: ${error}`);
      
      // Check if this is a missing file argument error
      const errorMessage = String(error);
      let finalError = errorMessage;
      
      if (errorMessage.includes('missing required argument') || errorMessage.includes('required argument')) {
        finalError = 'No input files specified';
      }
      
      return {
        success: false,
        exitCode: 1,
        data: { error: finalError }
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

      // Check if V2 output format is requested
      if (options.outputVersion === 'v2') {
        await this.outputV2Format(analysisData, filePath, fileName, options);
        return;
      }

      // V1 Output Format (default)
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

      // Handle join analysis results
      if (analysisData.joinAnalysis) {
        const joinReport = this.generateJoinAnalysisReport(analysisData.joinAnalysis);
        this.outputManager.outputJoinAnalysis(joinReport, analysisData.joinAnalysis, fileName);
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
   * Output V2 AI-ready format (86% smaller, facts only)
   */
  private async outputV2Format(analysisData: any, filePath: string, fileName: string, options: any): Promise<void> {
    const { writeFileSync } = require('fs');
    const { Section2Adapter } = require('../analyzers/quality/section2-adapter');
    const { Section3Adapter } = require('../analyzers/eda/section3-adapter');
    const { Section4Adapter } = require('../analyzers/visualization/section4-adapter');
    const { Section5Adapter } = require('../analyzers/engineering/section5-adapter');
    const { Section6Adapter } = require('../analyzers/modeling/section6-adapter');

    const v2Output: any = {
      version: '2.0',
      format: 'AI-ready',
      source_file: fileName,
      generated_at: new Date().toISOString(),
    };

    // Extract metadata from previous sections for Section 6
    const metadata = this.extractMetadataForSection6(analysisData);

    // Convert each section to V2 format
    if (analysisData.section2) {
      v2Output.quality = Section2Adapter.convertToV2(analysisData.section2.qualityAudit || analysisData.section2);
    }

    if (analysisData.section3) {
      v2Output.eda = Section3Adapter.convertToV2(analysisData.section3.edaAnalysis || analysisData.section3);
    }

    if (analysisData.section4) {
      v2Output.visualization = Section4Adapter.convertToV2(analysisData.section4.visualizationAnalysis || analysisData.section4);
    }

    if (analysisData.section5) {
      v2Output.engineering = Section5Adapter.convertToV2(analysisData.section5.engineeringAnalysis || analysisData.section5);
    }

    if (analysisData.section6) {
      v2Output.modeling = Section6Adapter.convertToV2(analysisData.section6.modelingAnalysis || analysisData.section6, metadata);
    }

    // Output to file or stdout
    const outputContent = JSON.stringify(v2Output, null, 2);

    if (options.outputFile) {
      const outputPath = options.outputFile.replace(/\.(json|md|txt|yaml)$/, '_v2.json');
      writeFileSync(outputPath, outputContent);
      if (!options.quiet) {
        console.log(`\n✅ V2 AI-ready output written to: ${outputPath}`);
        console.log(`📉 Size reduction: ~86% smaller than V1`);
      }
    } else {
      // Auto-generate filename
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const outputPath = `${baseName}_datapilot_v2.json`;
      writeFileSync(outputPath, outputContent);
      if (!options.quiet) {
        console.log(`\n✅ V2 AI-ready output written to: ${outputPath}`);
        console.log(`📉 Size reduction: ~86% smaller than V1`);
      }
    }
  }

  /**
   * Extract metadata from previous sections for Section 6 modeling
   */
  private extractMetadataForSection6(analysisData: any): any {
    const metadata: any = {};

    // From Section 1: Sample size
    if (analysisData.section1) {
      const overview = analysisData.section1.overview || analysisData.section1;
      const structuralDimensions = overview.structuralDimensions || overview;

      metadata.sampleSize = structuralDimensions.totalDataRows ||
                            structuralDimensions.totalRows ||
                            analysisData.section1.totalRows || 0;

      metadata.totalColumns = structuralDimensions.totalColumns ||
                              analysisData.section1.totalColumns || 0;
    }

    // From Section 2: Missing data ratio
    if (analysisData.section2) {
      const qualityAudit = analysisData.section2.qualityAudit || analysisData.section2;
      const completeness = qualityAudit.completeness || qualityAudit.cockpit?.dimensionScores?.completeness;
      if (completeness) {
        // Convert completeness percentage to missing ratio
        const completenessRatio = completeness.overallCompletenessRatio ||
                                  completeness.score || 0;
        metadata.missingRatio = (100 - completenessRatio) / 100;
      }
    }

    // From Section 3: Categorical and numeric column counts
    if (analysisData.section3) {
      const edaAnalysis = analysisData.section3.edaAnalysis || analysisData.section3;
      const univariateAnalysis = edaAnalysis.univariateAnalysis || [];

      let categoricalCount = 0;
      let numericCount = 0;

      univariateAnalysis.forEach((col: any) => {
        const dataType = col.detectedDataType?.toLowerCase() || '';
        if (dataType.includes('categorical')) {
          categoricalCount++;
        } else if (dataType.includes('numerical') || dataType.includes('float') || dataType.includes('integer')) {
          numericCount++;
        }
      });

      metadata.categoricalCount = categoricalCount;
      metadata.numericCount = numericCount;
    }

    return metadata;
  }

  /**
   * Generate Section 3 report content
   */
  private generateSection3Report(section3Result: any): string {
    const { Section3Formatter } = require('../analyzers/eda');
    return Section3Formatter.formatSection3(section3Result);
  }

  /**
   * Generate Section 4 report content
   */
  private generateSection4Report(section4Result: any): string {
    const { Section4Formatter } = require('../analyzers/visualization');
    return Section4Formatter.formatSection4(section4Result);
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
   * Generate Join Analysis report content
   */
  private generateJoinAnalysisReport(joinResult: any): string {
    const { JoinFormatter } = require('../analyzers/joins');
    const formatter = new JoinFormatter();
    return formatter.format(joinResult, { type: 'MARKDOWN' });
  }

  /**
   * Handle dry-run mode - validate inputs and show analysis plan without executing
   */
  private async handleDryRun(context: CLIContext): Promise<CLIResult> {
    try {
      logger.info('Running in dry-run mode - validating inputs and showing analysis plan');
      
      const multiFileCommands = ['engineering', 'join', 'discover', 'join-wizard', 'optimize-joins'];
      const isMultiFileCommand = multiFileCommands.includes(context.command) && context.args && context.args.length > 1;
      const filePaths = isMultiFileCommand ? context.args : [context.file || context.args[0]];
      
      const analysisOptions = {
        ...context.options,
        command: context.command
      };

      // Validate all input files
      const result = await this.analyzer.validateAndPreview(filePaths, analysisOptions);
      
      if (!context.options.quiet) {
        console.log('🔍 DRY RUN MODE - No analysis was performed');
        console.log('=' .repeat(60));
      }
      
      return result;
      
    } catch (error) {
      logger.error(`Dry-run validation failed: ${error}`);
      return {
        success: false,
        exitCode: 1,
        data: {
          error: `Dry-run validation failed: ${error.message || error}`
        },
        suggestions: [
          'Check that all input files exist and are readable',
          'Verify file formats are supported',
          'Use --verbose for more detailed error information'
        ]
      };
    }
  }

  /**
   * Handle commands that don't require file arguments
   */
  private async handleNoFileCommand(command: string, options: CLIOptions): Promise<CLIResult> {
    try {
      switch (command) {
        case 'clear-cache':
          return await this.clearCache(options);
        case 'perf':
          return await this.showPerformanceDashboard(options);
        default:
          return {
            success: false,
            exitCode: 1,
            error: `Unknown no-file command: ${command}`,
            suggestions: ['Use --help to see available commands']
          };
      }
    } catch (error) {
      logger.error(`No-file command failed: ${error}`);
      return {
        success: false,
        exitCode: 1,
        error: `Command '${command}' failed: ${error.message || error}`,
        suggestions: ['Check system permissions', 'Use --verbose for more details']
      };
    }
  }

  /**
   * Clear all cached analysis results
   */
  private async clearCache(options: CLIOptions): Promise<CLIResult> {
    logger.info('Clearing all cached analysis results...');
    
    let totalCleared = 0;
    const results: string[] = [];
    
    try {
      // Clear section caches using SectionCacheManager
      const sectionCacheManager = new SectionCacheManager();
      
      const sectionStats = await sectionCacheManager.getStats();
      if (sectionStats.totalEntries > 0) {
        await sectionCacheManager.clearAll();
        totalCleared += sectionStats.totalEntries;
        results.push(`Cleared ${sectionStats.totalEntries} section cache entries (${(sectionStats.totalSizeBytes / 1024 / 1024).toFixed(1)}MB)`);
      }
      
      // Clear result caches using ResultCache
      const resultCache = createResultCache();
      
      const resultStats = resultCache.getStats();
      if (resultStats.totalEntries > 0) {
        await resultCache.clear();
        totalCleared += resultStats.totalEntries;
        results.push(`Cleared ${resultStats.totalEntries} result cache entries (${(resultStats.totalSizeBytes / 1024 / 1024).toFixed(1)}MB)`);
      }
      
      // Dispose of the result cache to clean up resources
      await resultCache.dispose();
      
      if (totalCleared === 0) {
        results.push('No cache entries found to clear');
      }
      
      const message = results.join('\n');
      
      if (!options.quiet) {
        console.log(`\n✅ Cache clearing completed`);
        console.log(`📊 Summary:`);
        results.forEach(result => console.log(`   • ${result}`));
        console.log(`\n🗑️  Total entries cleared: ${totalCleared}`);
      }
      
      logger.info(`Cache clearing completed: ${totalCleared} entries cleared`);
      
      return {
        success: true,
        exitCode: 0,
        data: {
          message,
          totalCleared,
          details: results
        },
        metadata: {
          command: 'clear-cache',
          timestamp: new Date().toISOString(),
          entriesCleared: totalCleared
        }
      };
      
    } catch (error) {
      const errorMessage = `Failed to clear cache: ${error.message || error}`;
      logger.error(errorMessage);
      
      return {
        success: false,
        exitCode: 1,
        error: errorMessage,
        suggestions: [
          'Check if cache directories are accessible',
          'Ensure no other DataPilot processes are running',
          'Use --verbose for detailed error information'
        ]
      };
    }
  }

  /**
   * Show performance dashboard and system information
   */
  private async showPerformanceDashboard(options: CLIOptions): Promise<CLIResult> {
    try {
      if (!options.quiet) {
        console.log('📊 DataPilot Performance Dashboard');
        console.log('='.repeat(50));
      }
      
      // Show system information
      const systemInfo = await this.getSystemInfo();
      
      if (!options.quiet) {
        console.log('🖥️  System Information:');
        console.log(`   Platform: ${systemInfo.platform}/${systemInfo.arch}`);
        console.log(`   Node.js: ${systemInfo.nodeVersion}`);
        console.log(`   CPU Cores: ${systemInfo.cpuCount}`);
        console.log(`   Total Memory: ${systemInfo.totalMemoryGB.toFixed(1)} GB`);
        console.log(`   Free Memory: ${systemInfo.freeMemoryGB.toFixed(1)} GB`);
        console.log(`   Load Average: ${systemInfo.loadAverage.toFixed(2)}`);
      }
      
      // Show cache statistics if requested
      if (options.cacheStats) {
        const cacheStats = await this.getCacheStatistics();
        
        if (!options.quiet) {
          console.log('💾 Cache Statistics:');
          if (cacheStats.sectionCache) {
            console.log(`   Section Cache Entries: ${cacheStats.sectionCache.totalEntries}`);
            console.log(`   Section Cache Size: ${(cacheStats.sectionCache.totalSizeBytes / 1024 / 1024).toFixed(1)} MB`);
            console.log(`   Section Cache Hit Rate: ${(cacheStats.sectionCache.hitRate * 100).toFixed(1)}%`);
          }
          if (cacheStats.resultCache) {
            console.log(`   Result Cache Entries: ${cacheStats.resultCache.totalEntries}`);
            console.log(`   Result Cache Size: ${(cacheStats.resultCache.totalSizeBytes / 1024 / 1024).toFixed(1)} MB`);
            console.log(`   Result Cache Hit Rate: ${((cacheStats.resultCache.hitCount / (cacheStats.resultCache.hitCount + cacheStats.resultCache.missCount)) * 100 || 0).toFixed(1)}%`);
          }
        }
      }
      
      if (!options.quiet) {
        console.log('🔧 Available Commands:');
        console.log('   datapilot clear-cache    Clear all cached analysis results');
        console.log('   datapilot perf --cache-stats    Show detailed cache statistics');
        console.log('   datapilot --help    Show all available commands');
      }
      
      return {
        success: true,
        exitCode: 0,
        data: {
          systemInfo,
          cacheStats: options.cacheStats ? await this.getCacheStatistics() : undefined
        },
        metadata: {
          command: 'perf',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const errorMessage = `Failed to show performance dashboard: ${error.message || error}`;
      logger.error(errorMessage);
      
      return {
        success: false,
        exitCode: 1,
        error: errorMessage,
        suggestions: ['Check system permissions', 'Use --verbose for more details']
      };
    }
  }

  /**
   * Get system information
   */
  private async getSystemInfo() {
    const os = await import('os');
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemoryGB: os.totalmem() / (1024 * 1024 * 1024),
      freeMemoryGB: os.freemem() / (1024 * 1024 * 1024),
      loadAverage: os.loadavg()[0] // 1-minute load average
    };
  }

  /**
   * Get cache statistics from both cache systems
   */
  private async getCacheStatistics() {
    try {
      const stats: any = {};
      
      // Get section cache stats
      try {
        const sectionCacheManager = new SectionCacheManager();
        stats.sectionCache = await sectionCacheManager.getStats();
      } catch (error) {
        logger.warn(`Could not get section cache stats: ${error.message}`);
      }
      
      // Get result cache stats
      try {
        const resultCache = createResultCache();
        stats.resultCache = resultCache.getStats();
        await resultCache.dispose();
      } catch (error) {
        logger.warn(`Could not get result cache stats: ${error.message}`);
      }
      
      return stats;
    } catch (error) {
      logger.warn(`Could not get cache statistics: ${error.message}`);
      return {};
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

    // Don't add process listeners in test environment or if already registered
    if (process.env.NODE_ENV !== 'test' && !DataPilotCLI.processListenersRegistered) {
      DataPilotCLI.processListenersRegistered = true;
      
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
    // Check for Windows-specific help flag
    if (process.argv.includes('--help-windows')) {
      WindowsPathHelper.showWindowsHelp();
      return;
    }

    // Proactive Windows installation health check
    if (WindowsPathHelper.isWindows()) {
      // Only check if this looks like the first run or if there might be issues
      const hasMinimalArgs = process.argv.length <= 2 || process.argv.includes('--version');
      const hasHelpFlag = process.argv.includes('--help') || process.argv.includes('-h');
      
      if (hasMinimalArgs || hasHelpFlag) {
        WindowsPathHelper.checkInstallationHealth();
      }
    }

    const cli = new DataPilotCLI();
    const result = await cli.run();

    // Exit with appropriate code
    process.exit(result.exitCode || (result.success ? 0 : 1));
  } catch (error) {
    console.error('Fatal CLI error:', error);
    
    // Provide Windows-specific guidance if this looks like a PATH issue
    WindowsPathHelper.provideErrorGuidance(error);
    
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
