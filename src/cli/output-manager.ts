/**
 * CLI Output Manager - Handle file output, formatting, and user feedback
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, extname } from 'path';
import type { CLIOptions } from './types';
import type { Section1Result } from '../analyzers/overview/types';
import { Section1Formatter } from '../analyzers/overview';

export class OutputManager {
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
  }

  /**
   * Output Section 1 results in the specified format
   */
  outputSection1(result: Section1Result, filename?: string): string[] {
    const formatter = new Section1Formatter();
    const outputFiles: string[] = [];


    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatAsJSON(result);
        extension = '.json';
        break;
      
      case 'yaml':
        content = this.formatAsYAML(result);
        extension = '.yaml';
        break;
      
      case 'markdown':
      default:
        content = formatter.formatReport(result);
        extension = '.md';
        break;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateOutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const summary = formatter.formatSummary(result);
      console.log('\n📋 Quick Summary:');
      console.log(summary);
    }

    return outputFiles;
  }

  /**
   * Output validation results
   */
  outputValidation(filePath: string, isValid: boolean, errors: string[]): void {
    const filename = filePath.split('/').pop() || filePath;
    
    if (isValid) {
      console.log(`✅ ${filename} is a valid CSV file`);
    } else {
      console.log(`❌ ${filename} has validation issues:`);
      errors.forEach(error => console.log(`   • ${error}`));
    }
  }

  /**
   * Output file information
   */
  outputFileInfo(metadata: any): void {
    console.log('📁 File Information:');
    console.log(`   • Name: ${metadata.originalFilename}`);
    console.log(`   • Size: ${this.formatFileSize(metadata.fileSizeMB)}`);
    console.log(`   • Encoding: ${metadata.encoding || 'auto-detected'}`);
    console.log(`   • Format: ${metadata.mimeType}`);
    console.log(`   • Modified: ${metadata.lastModified?.toISOString?.() || 'unknown'}`);
  }

  /**
   * Format as JSON with pretty printing
   */
  private formatAsJSON(result: Section1Result): string {
    // Create a clean object for JSON output
    const jsonOutput = {
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        command: 'datapilot',
      },
      overview: result.overview,
      warnings: result.warnings,
      performance: result.performanceMetrics,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format as YAML (simplified implementation)
   */
  private formatAsYAML(result: Section1Result): string {
    // Simple YAML formatting - in production you might want to use a proper YAML library
    const yaml = this.objectToYAML({
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        command: 'datapilot',
      },
      overview: result.overview,
      warnings: result.warnings,
      performance: result.performanceMetrics,
    });

    return yaml;
  }

  /**
   * Simple object to YAML converter
   */
  private objectToYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      yaml += `${spaces}${key}:`;
      
      if (value === null || value === undefined) {
        yaml += ' null\n';
      } else if (typeof value === 'string') {
        yaml += ` "${value}"\n`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        yaml += ` ${value}\n`;
      } else if (value instanceof Date) {
        yaml += ` "${value.toISOString()}"\n`;
      } else if (Array.isArray(value)) {
        yaml += '\n';
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.objectToYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object') {
        yaml += '\n';
        yaml += this.objectToYAML(value, indent + 1);
      }
    }

    return yaml;
  }

  /**
   * Write content to file with directory creation
   */
  private writeToFile(filePath: string, content: string): void {
    try {
      // Ensure directory exists
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });
      
      // Write file
      writeFileSync(filePath, content, 'utf8');
      
      if (!this.options.quiet) {
        console.log(`📄 Report written to: ${filePath}`);
      }
    } catch (error) {
      throw new Error(`Failed to write output file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure file has the correct extension
   */
  private ensureExtension(filePath: string, expectedExtension: string): string {
    const currentExtension = extname(filePath);
    
    if (currentExtension === expectedExtension) {
      return filePath;
    }
    
    return filePath + expectedExtension;
  }

  /**
   * Generate output filename based on input filename
   */
  private generateOutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_report${extension}`;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(sizeMB: number): string {
    if (sizeMB < 0.01) {
      return `${(sizeMB * 1024).toFixed(1)} KB`;
    } else if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    } else {
      return `${sizeMB.toFixed(2)} MB`;
    }
  }


  /**
   * Show available output formats
   */
  static showFormats(): void {
    console.log('📄 Available output formats:');
    console.log('   • markdown (default) - Human-readable report with full details');
    console.log('   • json              - Machine-readable structured data');
    console.log('   • yaml              - Human and machine-readable structured data');
    console.log('\nExample: datapilot all data.csv --output json --output-file report.json');
  }
}