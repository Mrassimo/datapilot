/**
 * Simple Facade for Join Analysis - Phase 1 Only
 * Provides easy-to-use interface without overengineering
 */

import { JoinAnalyzer } from './join-analyzer.js';
import { JoinFormatter } from './join-formatter.js';
import { JoinAnalysisConfig, JoinAnalysisResult, OutputFormat } from './types.js';

/**
 * Create a simple join analyzer with sensible defaults
 */
export function createJoinAnalyzer(config: Partial<JoinAnalysisConfig> = {}): {
  analyzer: JoinAnalyzer;
  formatter: JoinFormatter;
  analyze: (files: string[]) => Promise<JoinAnalysisResult>;
  format: (result: JoinAnalysisResult, format?: string) => string;
} {
  
  const analyzer = new JoinAnalyzer({
    maxTables: config.maxTables ?? 5, // Start small
    confidenceThreshold: config.confidenceThreshold ?? 0.7,
    enableFuzzyMatching: config.enableFuzzyMatching ?? true,
    enableSemanticAnalysis: config.enableSemanticAnalysis ?? true,
    enableTemporalJoins: false, // Phase 2 feature
    performanceMode: 'BALANCED',
    outputFormats: [{ type: 'MARKDOWN' }]
  });

  const formatter = new JoinFormatter();

  return {
    analyzer,
    formatter,
    
    // Simple analyze method
    async analyze(files: string[]): Promise<JoinAnalysisResult> {
      if (files.length < 2) {
        throw new Error('Join analysis requires at least 2 files');
      }
      if (files.length > 5) {
        throw new Error('Phase 1 supports maximum 5 files for stability');
      }
      
      return await analyzer.analyzeJoins(files);
    },

    // Simple format method  
    format(result: JoinAnalysisResult, format: string = 'markdown'): string {
      const outputFormat: OutputFormat = {
        type: format.toUpperCase() as any
      };
      
      return formatter.format(result, outputFormat);
    }
  };
}