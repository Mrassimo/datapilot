/**
 * CLI-specific type definitions with enhanced dependency injection and progress callback support
 */

import type { Section1Result } from '../analyzers/overview/types';
import type { Section2Result } from '../analyzers/quality/types';
import type { Section3Result } from '../analyzers/eda/types';
import type { Section4Result } from '../analyzers/visualization/types';
import type { Section5Result } from '../analyzers/engineering/types';
import type { Section6Result } from '../analyzers/modeling/types';
import type { LogContext } from '../utils/logger';
import type { DataPilotError } from '../core/types';

// CLI Options with enhanced typing
export interface CLIOptions {
  // Output options
  output?: 'txt' | 'markdown' | 'json' | 'yaml';
  outputFile?: string;
  verbose?: boolean;
  quiet?: boolean;

  // Analysis options
  maxRows?: number;
  enableHashing?: boolean;
  includeEnvironment?: boolean;
  privacyMode?: 'full' | 'redacted' | 'minimal';

  // Performance options
  maxMemory?: number;
  parallel?: boolean;
  chunkSize?: number;
  memoryLimit?: number;

  // Section-specific options
  sections?: string[];
  accessibility?: 'excellent' | 'good' | 'adequate';
  complexity?: 'simple' | 'moderate' | 'complex';
  maxRecommendations?: number;
  includeCode?: boolean;
  database?: string;
  framework?: string;
  focus?: string[];
  interpretability?: 'low' | 'medium' | 'high';

  // Behaviour options
  force?: boolean;
  dryRun?: boolean;
  showProgress?: boolean;
  command?: string;
  encoding?: string;
  delimiter?: string;

  // Index signature for additional properties
  [key: string]: unknown;
}

export interface CLIContext {
  command: string;
  args: string[];
  options: CLIOptions;
  startTime: number;
  workingDirectory: string;
  file?: string;
}

export interface CLIResult {
  success: boolean;
  exitCode: number;
  message?: string;
  outputFiles?: string[];
  stats?: {
    processingTime: number;
    rowsProcessed: number;
    warnings: number;
    errors: number;
  };
}

export interface ProgressState {
  phase: string;
  progress: number; // 0-100
  message: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

// Enhanced Progress Callback System
export type ProgressCallback = (state: ProgressState) => void;

export interface ProgressCallbacks {
  onPhaseStart?: (phase: string, message: string) => void;
  onProgress?: ProgressCallback;
  onPhaseComplete?: (message: string, timeElapsed: number) => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
}

// Section Result Union Types
export type SectionResult = 
  | Section1Result 
  | Section2Result 
  | Section3Result 
  | Section4Result 
  | Section5Result 
  | Section6Result;

export type SectionResultMap = {
  section1: Section1Result;
  section2: Section2Result;
  section3: Section3Result;
  section4: Section4Result;
  section5: Section5Result;
  section6: Section6Result;
};

// Dependency Injection Types
export interface AnalyzerDependency<TResult extends SectionResult = SectionResult> {
  name: string;
  result: TResult;
  timestamp: Date;
  cached: boolean;
}

export interface DependencyResolver {
  resolve<K extends keyof SectionResultMap>(sectionName: K): Promise<SectionResultMap[K]>;
  cache<K extends keyof SectionResultMap>(sectionName: K, result: SectionResultMap[K]): void;
  clear(): void;
  has(sectionName: string): boolean;
}

// Analyzer Factory Pattern
export interface AnalyzerFactory<
  TOptions extends Record<string, unknown> = CLIOptions,
  TDeps extends SectionResult[] = SectionResult[],
  TResult extends SectionResult = SectionResult
> {
  (filePath: string, options: TOptions, dependencies?: TDeps): Promise<TResult>;
}

// Configuration for section analysis
export interface SectionAnalysisConfig<
  TResult extends SectionResult = SectionResult,
  TDeps extends SectionResult[] = SectionResult[]
> {
  sectionName: string;
  phase: string;
  message: string;
  dependencies?: Array<keyof SectionResultMap>;
  analyzerFactory: AnalyzerFactory<CLIOptions, TDeps, TResult>;
  formatterMethod?: (result: TResult) => string;
  outputMethod: OutputMethodFactory<TResult>;
  progressWeighting?: number; // 0-100, how much of total progress this section represents
  retryable?: boolean;
  required?: boolean; // If false, failures won't stop the pipeline
}

// Output Method Factory
export interface OutputMethodFactory<TResult extends SectionResult> {
  (outputManager: unknown, report: string | null, result: TResult, fileName?: string): string[];
}

// Cross-Section Dependency Chain
export interface DependencyChain {
  sections: Array<{
    name: keyof SectionResultMap;
    dependencies: Array<keyof SectionResultMap>;
    optional?: boolean;
  }>;
  validateChain(): { isValid: boolean; errors: string[] };
  getExecutionOrder(): Array<keyof SectionResultMap>;
}

// Enhanced Error Handling for CLI
export interface CLIErrorContext extends LogContext {
  command?: string;
  phase?: string;
  dependencies?: string[];
  retryAttempt?: number;
}

export interface CLIErrorHandler {
  handleSectionError(error: DataPilotError, sectionName: string, context: CLIErrorContext): Promise<boolean>;
  recordSectionFailure(sectionName: string, error: DataPilotError): void;
  getSectionErrors(sectionName: string): DataPilotError[];
  getTotalErrors(): number;
  canContinue(sectionName: string): boolean;
}

// Configuration Loading Types
export interface ConfigurationMode {
  mode: 'development' | 'production' | 'ci' | 'test';
  presets?: string[];
  overrides?: Partial<CLIOptions>;
}

export interface CLIConfigurationLoader {
  loadConfiguration(mode?: ConfigurationMode): Promise<CLIOptions>;
  validateConfiguration(config: CLIOptions): { isValid: boolean; errors: string[] };
  applyPresets(config: CLIOptions, presets: string[]): CLIOptions;
}

// Result Aggregation Types
export interface SectionExecutionResult<T extends SectionResult = SectionResult> {
  sectionName: string;
  success: boolean;
  result?: T;
  error?: DataPilotError;
  processingTime: number;
  warnings: string[];
  outputFiles: string[];
  dependencies: string[];
}

export interface AnalysisPipelineResult {
  overallSuccess: boolean;
  executedSections: SectionExecutionResult[];
  totalProcessingTime: number;
  totalWarnings: number;
  totalErrors: number;
  outputFiles: string[];
  metadata: {
    command: string;
    filePath: string;
    startTime: Date;
    endTime: Date;
    options: CLIOptions;
  };
}

// Enhanced Pipeline Orchestration
export interface AnalysisPipeline {
  addSection<T extends SectionResult>(config: SectionAnalysisConfig<T>): void;
  execute(filePath: string, options: CLIOptions): Promise<AnalysisPipelineResult>;
  validatePipeline(): { isValid: boolean; errors: string[] };
  getExecutionPlan(): string[];
}

// Memory and Resource Management
export interface ResourceMetrics {
  memoryUsage: number; // bytes
  processingTime: number; // milliseconds
  rowsProcessed: number;
  sectionsCompleted: number;
}

export interface ResourceMonitor {
  startMonitoring(context: LogContext): void;
  updateMetrics(metrics: Partial<ResourceMetrics>): void;
  checkThresholds(): { exceeded: boolean; warnings: string[] };
  stopMonitoring(): ResourceMetrics;
}

// CLI-specific error types
export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: number = 1,
    public showHelp: boolean = false,
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, 1, true);
    this.name = 'ValidationError';
  }
}

export class FileError extends CLIError {
  constructor(
    message: string,
    public filePath: string,
  ) {
    super(message, 1, false);
    this.name = 'FileError';
  }
}
