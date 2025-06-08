/**
 * Interactive prompts for DataPilot CLI
 * Provides user-friendly prompts for missing arguments and confirmations
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

export interface PromptOptions {
  type: 'input' | 'confirm' | 'select' | 'multiselect';
  message: string;
  default?: unknown;
  choices?: Array<{ name: string; value: unknown }>;
  validate?: (input: unknown) => boolean | string;
}

export class InteractivePrompt {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
  }

  /**
   * Prompt for CSV file selection
   */
  async promptForFile(currentDir: string = process.cwd()): Promise<string> {
    console.log('\n📂 Select a CSV file to analyze:\n');

    // List CSV files in current directory
    const csvFiles = this.findCSVFiles(currentDir);

    if (csvFiles.length > 0) {
      console.log('Found CSV files in current directory:');
      csvFiles.forEach((file, index) => {
        const stats = statSync(join(currentDir, file));
        const size = this.formatFileSize(stats.size);
        console.log(`  ${index + 1}. ${file} (${size})`);
      });
      console.log(`  ${csvFiles.length + 1}. Enter custom path`);
      console.log('');

      const choice = await this.prompt({
        type: 'input',
        message: 'Enter number or file path:',
        validate: (input) => {
          const num = parseInt(input, 10);
          if (!isNaN(num) && num >= 1 && num <= csvFiles.length + 1) {
            return true;
          }
          if (existsSync(input)) {
            return true;
          }
          return 'Please enter a valid number or file path';
        },
      });

      const num = parseInt(choice, 10);
      if (!isNaN(num) && num <= csvFiles.length) {
        return join(currentDir, csvFiles[num - 1]);
      } else if (num === csvFiles.length + 1) {
        return this.promptForCustomPath();
      }
      return choice;
    } else {
      console.log('No CSV files found in current directory.');
      return this.promptForCustomPath();
    }
  }

  /**
   * Prompt for custom file path
   */
  private async promptForCustomPath(): Promise<string> {
    return this.prompt({
      type: 'input',
      message: 'Enter CSV file path:',
      validate: (input) => {
        if (!input) return 'File path is required';
        if (!existsSync(input)) return 'File not found';
        if (!input.toLowerCase().endsWith('.csv')) return 'File must be a CSV';
        return true;
      },
    });
  }

  /**
   * Prompt for command selection
   */
  async promptForCommand(): Promise<string> {
    const commands = [
      { name: 'all - Complete analysis (all 6 sections)', value: 'all' },
      { name: 'overview - Dataset overview (Section 1)', value: 'overview' },
      { name: 'quality - Data quality audit (Section 2)', value: 'quality' },
      { name: 'eda - Exploratory data analysis (Section 3)', value: 'eda' },
      { name: 'viz - Visualization recommendations (Section 4)', value: 'viz' },
      { name: 'engineering - Data engineering insights (Section 5)', value: 'engineering' },
      { name: 'modeling - Predictive modeling guidance (Section 6)', value: 'modeling' },
      { name: 'validate - Quick validation only', value: 'validate' },
      { name: 'info - File information', value: 'info' },
    ];

    console.log('\n📊 Select analysis type:\n');
    commands.forEach((cmd, index) => {
      console.log(`  ${index + 1}. ${cmd.name}`);
    });
    console.log('');

    const choice = await this.prompt({
      type: 'input',
      message: 'Enter number (1-9):',
      default: '1',
      validate: (input) => {
        const num = parseInt(input, 10);
        return (num >= 1 && num <= commands.length) || 'Please enter a valid number';
      },
    });

    return commands[parseInt(choice, 10) - 1].value;
  }

  /**
   * Prompt for output format
   */
  async promptForOutputFormat(): Promise<string> {
    const formats = [
      { name: 'Text (.txt) - Plain text report', value: 'txt' },
      { name: 'Markdown (.md) - Formatted report', value: 'markdown' },
      { name: 'JSON - Machine-readable data', value: 'json' },
      { name: 'YAML - Human-readable data', value: 'yaml' },
    ];

    console.log('\n📄 Select output format:\n');
    formats.forEach((fmt, index) => {
      console.log(`  ${index + 1}. ${fmt.name}`);
    });
    console.log('');

    const choice = await this.prompt({
      type: 'input',
      message: 'Enter number (1-4):',
      default: '1',
      validate: (input) => {
        const num = parseInt(input, 10);
        return (num >= 1 && num <= formats.length) || 'Please enter a valid number';
      },
    });

    return formats[parseInt(choice, 10) - 1].value;
  }

  /**
   * Confirm processing of large file
   */
  async confirmLargeFile(filePath: string, size: number): Promise<boolean> {
    const sizeStr = this.formatFileSize(size);

    console.log(`\n⚠️  Large file detected: ${sizeStr}`);
    console.log(`   File: ${filePath}`);
    console.log(`   Estimated processing time: ${this.estimateProcessingTime(size)}`);
    console.log(`   Recommended memory: ${this.recommendedMemory(size)} MB\n`);

    return this.prompt({
      type: 'confirm',
      message: 'Continue with processing?',
      default: false,
    });
  }

  /**
   * Prompt for performance options
   */
  async promptForPerformanceOptions(fileSize: number): Promise<any> {
    const recommendedChunkSize = Math.min(1000, Math.max(100, Math.floor(fileSize / 1000000)));
    const recommendedMemory = this.recommendedMemory(fileSize);

    console.log('\n⚙️  Performance Options:\n');

    const useDefaults = await this.prompt({
      type: 'confirm',
      message: 'Use recommended settings?',
      default: true,
    });

    if (useDefaults) {
      return {
        chunkSize: recommendedChunkSize,
        maxMemory: recommendedMemory,
        maxRows: undefined,
      };
    }

    const chunkSize = await this.prompt({
      type: 'input',
      message: `Chunk size (rows per batch):`,
      default: recommendedChunkSize.toString(),
      validate: (input) => {
        const num = parseInt(input, 10);
        return num > 0 || 'Must be a positive number';
      },
    });

    const maxMemory = await this.prompt({
      type: 'input',
      message: `Memory limit (MB):`,
      default: recommendedMemory.toString(),
      validate: (input) => {
        const num = parseInt(input, 10);
        return num > 0 || 'Must be a positive number';
      },
    });

    const limitRows = await this.prompt({
      type: 'confirm',
      message: 'Limit number of rows to process?',
      default: false,
    });

    let maxRows;
    if (limitRows) {
      maxRows = await this.prompt({
        type: 'input',
        message: 'Maximum rows to process:',
        default: '100000',
        validate: (input) => {
          const num = parseInt(input, 10);
          return num > 0 || 'Must be a positive number';
        },
      });
    }

    return {
      chunkSize: parseInt(chunkSize, 10),
      maxMemory: parseInt(maxMemory, 10),
      maxRows: maxRows ? parseInt(maxRows, 10) : undefined,
    };
  }

  /**
   * Basic prompt implementation
   */
  private prompt(options: PromptOptions): Promise<any> {
    return new Promise((resolve) => {
      let question = options.message;

      if (options.type === 'confirm') {
        question += ` (${options.default ? 'Y/n' : 'y/N'}): `;
      } else if (options.default !== undefined) {
        question += ` (${options.default}): `;
      } else {
        question += ': ';
      }

      this.rl.question(question, (answer) => {
        answer = answer.trim();

        // Handle defaults
        if (!answer && options.default !== undefined) {
          answer = options.default.toString();
        }

        // Handle confirmation
        if (options.type === 'confirm') {
          const confirmed =
            answer.toLowerCase() === 'y' || (answer === '' && options.default === true);
          resolve(confirmed);
          return;
        }

        // Validate input
        if (options.validate) {
          const validation = options.validate(answer);
          if (validation !== true) {
            console.log(`❌ ${validation}`);
            this.prompt(options).then(resolve);
            return;
          }
        }

        resolve(answer);
      });
    });
  }

  /**
   * Find CSV files in directory
   */
  private findCSVFiles(dir: string): string[] {
    const fs = require('fs');
    try {
      const files = fs.readdirSync(dir);
      return files.filter((file: string) => file.toLowerCase().endsWith('.csv')).sort();
    } catch {
      return [];
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  /**
   * Estimate processing time based on file size
   */
  private estimateProcessingTime(bytes: number): string {
    // Rough estimation: 10MB/s processing speed
    const seconds = bytes / (10 * 1024 * 1024);
    if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
    return `${(seconds / 3600).toFixed(1)} hours`;
  }

  /**
   * Recommend memory based on file size
   */
  private recommendedMemory(bytes: number): number {
    // Rough estimation: 10% of file size + 100MB overhead
    const recommended = Math.ceil(bytes / (10 * 1024 * 1024)) + 100;
    return Math.min(4096, Math.max(256, recommended)); // Between 256MB and 4GB
  }

  /**
   * Cleanup resources
   */
  close(): void {
    this.rl.close();
  }
}

// Export for use in CLI
export default InteractivePrompt;
