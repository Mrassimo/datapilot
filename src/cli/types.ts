/**
 * CLI-specific type definitions
 */

// CLI-specific type definitions

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

  // Specific section control
  sections?: string[];

  // Behaviour options
  force?: boolean;
  dryRun?: boolean;
  showProgress?: boolean;
}

export interface CLIContext {
  command: string;
  args: string[];
  options: CLIOptions;
  startTime: number;
  workingDirectory: string;
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
