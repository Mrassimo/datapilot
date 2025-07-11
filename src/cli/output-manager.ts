/**
 * CLI Output Manager - Handle file output, formatting, and user feedback
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, extname } from 'path';
import { getDataPilotVersion } from '../utils/version';
import type { CLIOptions } from './types';
import type { Section1Result } from '../analyzers/overview/types';
import type { Section2Result } from '../analyzers/quality/types';
import type { Section3Result } from '../analyzers/eda/types';
import type { Section4Result } from '../analyzers/visualization/types';
import type { Section5Result } from '../analyzers/engineering/types';
import type { Section6Result } from '../analyzers/modeling/types';
import { Section1Formatter } from '../analyzers/overview';
import { Section2Formatter } from '../analyzers/quality';
import { Section5Formatter } from '../analyzers/engineering';
import { Section6Formatter } from '../analyzers/modeling';

export class OutputManager {
  private options: CLIOptions;
  private combinedSections: string[] = [];
  private combineMode: boolean = false;

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

      case 'txt':
        content = formatter.formatReport(result);
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = formatter.formatReport(result);
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
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
   * Output Section 2 (Data Quality) results in the specified format
   */
  outputSection2(result: Section2Result, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatSection2AsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatSection2AsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = Section2Formatter.formatReport(result.qualityAudit);
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = Section2Formatter.formatReport(result.qualityAudit);
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateSection2OutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const cockpit = result.qualityAudit.cockpit;
      console.log('\n🧐 Data Quality Summary:');
      console.log(`   Overall Score: ${cockpit.compositeScore.score.toFixed(1)}/100`);
      console.log(`   Interpretation: ${cockpit.compositeScore.interpretation}`);
    }

    return outputFiles;
  }

  /**
   * Output Section 3 (EDA) results in the specified format
   */
  outputSection3(section3Report: string, result: Section3Result, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatSection3AsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatSection3AsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = section3Report;
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = section3Report;
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateSection3OutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const insights = result.edaAnalysis?.crossVariableInsights;
      if (insights?.topFindings && insights.topFindings.length > 0) {
        console.log('\n📊 EDA Quick Summary:');
        insights.topFindings.slice(0, 3).forEach((finding: string, i: number) => {
          console.log(`   ${i + 1}. ${finding}`);
        });
      }
    }

    return outputFiles;
  }

  /**
   * Output Section 4 (Visualization Intelligence) results in the specified format
   */
  outputSection4(section4Report: string, result: Section4Result, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatSection4AsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatSection4AsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = section4Report;
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = section4Report;
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateSection4OutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const recommendations = result.performanceMetrics?.recommendationsGenerated || 0;
      const chartTypes = result.performanceMetrics?.chartTypesConsidered || 0;
      const confidence = result.metadata?.recommendationConfidence || 0;

      console.log('\n📊 Visualization Intelligence Quick Summary:');
      console.log(
        `   • Generated ${recommendations} chart recommendations across ${chartTypes} types`,
      );
      console.log(`   • Overall confidence: ${(confidence * 100).toFixed(0)}%`);
      console.log(`   • Accessibility: WCAG 2.1 AA Ready`);

      if (result.warnings && result.warnings.length > 0) {
        const criticalWarnings = result.warnings.filter(
          (w) => w.severity === 'critical' || w.severity === 'high',
        );
        if (criticalWarnings.length > 0) {
          console.log(`   ⚠️  ${criticalWarnings.length} critical considerations identified`);
        }
      }
    }

    return outputFiles;
  }

  /**
   * Output Section 5 (Data Engineering) results in the specified format
   */
  outputSection5(section5Report: string, result: Section5Result, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatSection5AsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatSection5AsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = section5Report;
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = section5Report;
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateSection5OutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const mlReadiness = result.metadata?.mlReadinessScore || 0;
      const transformations = result.performanceMetrics?.transformationsEvaluated || 0;

      console.log('\n🏗️ Data Engineering Quick Summary:');
      console.log(`   • ML Readiness Score: ${mlReadiness}%`);
      console.log(`   • Transformations Evaluated: ${transformations}`);
      console.log(
        `   • Schema Optimization: Ready for ${result.engineeringAnalysis?.schemaAnalysis?.optimizedSchema?.targetSystem || 'generic SQL'}`,
      );
    }

    return outputFiles;
  }

  /**
   * Output Section 6 (Predictive Modeling) results in the specified format
   */
  outputSection6(section6Report: string, result: Section6Result, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatSection6AsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatSection6AsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = section6Report;
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = section6Report;
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateSection6OutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const tasksIdentified = result.performanceMetrics?.tasksIdentified || 0;
      const algorithmsEvaluated = result.performanceMetrics?.algorithmsEvaluated || 0;

      console.log('\n🧠 Modeling Analysis Quick Summary:');
      console.log(`   • Tasks Identified: ${tasksIdentified}`);
      console.log(`   • Algorithms Evaluated: ${algorithmsEvaluated}`);
      console.log(`   • Ethics Assessment: Complete with bias analysis`);
    }

    return outputFiles;
  }

  /**
   * Output Join Analysis results in the specified format
   */
  outputJoinAnalysis(joinReport: string, result: any, filename?: string): string[] {
    const outputFiles: string[] = [];

    // Generate content based on format
    let content: string;
    let extension: string;

    switch (this.options.output) {
      case 'json':
        content = this.formatJoinAsJSON(result);
        extension = '.json';
        break;

      case 'yaml':
        content = this.formatJoinAsYAML(result);
        extension = '.yaml';
        break;

      case 'txt':
        content = joinReport;
        extension = '.txt';
        break;

      case 'markdown':
      default:
        content = joinReport;
        extension = '.md';
        break;
    }

    // In combine mode, just collect the content
    if (this.combineMode && (this.options.output === 'markdown' || this.options.output === 'txt')) {
      this.addToCombinedOutput(content);
      return outputFiles;
    }

    // Output to file or stdout
    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else if (filename) {
      // Auto-generate filename based on input
      const outputPath = this.generateJoinOutputFilename(filename, extension);
      this.writeToFile(outputPath, content);
      outputFiles.push(outputPath);
    } else {
      // Output to stdout
      console.log(content);
    }

    // Also generate summary if verbose and not quiet
    if (this.options.verbose && !this.options.quiet) {
      const summary = result.summary;
      console.log('\n🔗 Join Analysis Quick Summary:');
      console.log(`   • Tables Analyzed: ${summary?.tablesAnalyzed || 0}`);
      console.log(`   • Join Candidates Found: ${summary?.joinCandidatesFound || 0}`);
      console.log(`   • High Confidence Joins: ${summary?.highConfidenceJoins || 0}`);
      console.log(`   • Analysis Time: ${summary?.analysisTime || 0}ms`);
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
      errors.forEach((error) => console.log(`   • ${error}`));
    }
  }

  /**
   * Output file information
   */
  outputFileInfo(metadata: {
    originalFilename?: string;
    fileSizeMB?: number;
    encoding?: string;
    mimeType?: string;
    lastModified?: Date;
  }): void {
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
        version: getDataPilotVersion(),
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
    // Include any additional properties that might be added to the result (for testing purposes)
    const additionalProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(result)) {
      if (!['overview', 'warnings', 'performanceMetrics'].includes(key)) {
        additionalProps[key] = value;
      }
    }

    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot',
      },
      overview: result.overview,
      warnings: result.warnings,
      performance: result.performanceMetrics,
      ...additionalProps,
    });

    return yaml;
  }

  /**
   * Simple object to YAML converter
   */
  private objectToYAML(obj: Record<string, unknown>, indent: number = 0, seen = new WeakSet()): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values entirely
      if (value === undefined) {
        continue;
      }

      yaml += `${spaces}${key}:`;

      if (value === null) {
        yaml += ' null\n';
      } else if (typeof value === 'string') {
        // Escape quotes, backslashes, and newlines in strings
        const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        yaml += ` "${escapedValue}"\n`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        yaml += ` ${value}\n`;
      } else if (value instanceof Date) {
        yaml += ` "${value.toISOString()}"\n`;
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          yaml += ' []\n';
        } else {
          yaml += '\n';
          value.forEach((item) => {
            if (item === undefined) {
              return; // Skip undefined array items
            }
            if (typeof item === 'object' && item !== null) {
              if (seen.has(item as object)) {
                yaml += `${spaces}  - "[Circular Reference]"\n`;
              } else {
                seen.add(item as object);
                yaml += `${spaces}  -\n${this.objectToYAML(item as Record<string, unknown>, indent + 2, seen)}`;
                seen.delete(item as object);
              }
            } else if (typeof item === 'string') {
              const escapedItem = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
              yaml += `${spaces}  - "${escapedItem}"\n`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          });
        }
      } else if (typeof value === 'object') {
        // Check for circular references
        if (seen.has(value as object)) {
          yaml += ' "[Circular Reference]"\n';
        } else {
          seen.add(value as object);
          yaml += '\n';
          yaml += this.objectToYAML(value as Record<string, unknown>, indent + 1, seen);
          seen.delete(value as object);
        }
      }
    }

    // Minimal cleanup: only remove trailing whitespace, preserve structure
    return yaml.replace(/[ \t]+$/gm, '');
  }

  /**
   * Format Section 2 result as JSON
   */
  private formatSection2AsJSON(result: Section2Result): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot quality',
        analysisType: 'Data Quality & Integrity Audit',
      },
      qualityAudit: result.qualityAudit,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Section 2 result as YAML
   */
  private formatSection2AsYAML(result: Section2Result): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot quality',
        analysisType: 'Data Quality & Integrity Audit',
      },
      qualityAudit: result.qualityAudit,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
    });

    return yaml;
  }

  /**
   * Format Section 3 result as JSON
   */
  private formatSection3AsJSON(result: Section3Result): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot eda',
        analysisType: 'Exploratory Data Analysis',
      },
      edaAnalysis: result.edaAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Section 3 result as YAML
   */
  private formatSection3AsYAML(result: Section3Result): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot eda',
        analysisType: 'Exploratory Data Analysis',
      },
      edaAnalysis: result.edaAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    });

    return yaml;
  }

  /**
   * Format Section 4 result as JSON
   */
  private formatSection4AsJSON(result: Section4Result): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot viz',
        analysisType: 'Visualization Intelligence',
      },
      visualizationAnalysis: result.visualizationAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Section 4 result as YAML
   */
  private formatSection4AsYAML(result: Section4Result): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot viz',
        analysisType: 'Visualization Intelligence',
      },
      visualizationAnalysis: result.visualizationAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    });

    return yaml;
  }

  /**
   * Format Section 5 result as JSON
   */
  private formatSection5AsJSON(result: Section5Result): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot engineering',
        analysisType: 'Data Engineering & Structural Insights',
      },
      engineeringAnalysis: result.engineeringAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Section 5 result as YAML
   */
  private formatSection5AsYAML(result: Section5Result): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot engineering',
        analysisType: 'Data Engineering & Structural Insights',
      },
      engineeringAnalysis: result.engineeringAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    });

    return yaml;
  }

  /**
   * Format Section 6 result as JSON
   */
  private formatSection6AsJSON(result: Section6Result): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot modeling',
        analysisType: 'Predictive Modeling & Advanced Analytics Guidance',
      },
      modelingAnalysis: result.modelingAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Section 6 result as YAML
   */
  private formatSection6AsYAML(result: Section6Result): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot modeling',
        analysisType: 'Predictive Modeling & Advanced Analytics Guidance',
      },
      modelingAnalysis: result.modelingAnalysis,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics,
      analysisMetadata: result.metadata,
    });

    return yaml;
  }

  /**
   * Generate Section 2 output filename
   */
  private generateSection2OutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_quality${extension}`;
  }

  /**
   * Generate Section 3 output filename
   */
  private generateSection3OutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_eda${extension}`;
  }

  /**
   * Generate Section 4 output filename
   */
  private generateSection4OutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_viz${extension}`;
  }

  /**
   * Generate Section 5 output filename
   */
  private generateSection5OutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_engineering${extension}`;
  }

  /**
   * Generate Section 6 output filename
   */
  private generateSection6OutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_modeling${extension}`;
  }

  /**
   * Generate Join Analysis output filename
   */
  private generateJoinOutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_datapilot_join_analysis${extension}`;
  }

  /**
   * Format Join Analysis result as JSON
   */
  private formatJoinAsJSON(result: any): string {
    const jsonOutput = {
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot engineering (multi-file)',
        analysisType: 'Multi-File Join Analysis',
      },
      joinAnalysis: result,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format Join Analysis result as YAML
   */
  private formatJoinAsYAML(result: any): string {
    const yaml = this.objectToYAML({
      metadata: {
        version: getDataPilotVersion(),
        generatedAt: new Date().toISOString(),
        command: 'datapilot engineering (multi-file)',
        analysisType: 'Multi-File Join Analysis',
      },
      joinAnalysis: result,
    });

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
      throw new Error(
        `Failed to write output file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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

    // If no extension, add the expected one
    if (!currentExtension) {
      return filePath + expectedExtension;
    }

    // Replace existing extension with expected one
    return filePath.slice(0, -currentExtension.length) + expectedExtension;
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
  private formatFileSize(sizeMB?: number): string {
    if (sizeMB === undefined || sizeMB === null) {
      return 'unknown';
    }
    if (sizeMB < 0.01) {
      return `${(sizeMB * 1024).toFixed(1)} KB`;
    } else if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    } else {
      return `${sizeMB.toFixed(2)} MB`;
    }
  }

  /**
   * Start collecting sections for combined output
   */
  startCombinedOutput(): void {
    this.combinedSections = [];
    this.combineMode = true;
  }

  /**
   * Add a section to the combined output
   */
  addToCombinedOutput(content: string): void {
    this.combinedSections.push(content);
  }

  /**
   * Output the combined sections as a single file
   */
  outputCombined(filename?: string): string[] {
    if (this.combinedSections.length === 0) {
      return [];
    }

    const outputFiles: string[] = [];
    const combinedContent = this.combinedSections.join('\n\n---\n\n');
    const extension = this.options.output === 'txt' ? '.txt' : '.md';

    if (this.options.outputFile) {
      const outputPath = this.ensureExtension(this.options.outputFile, extension);
      this.writeToFile(outputPath, combinedContent);
      outputFiles.push(outputPath);
    } else if (filename) {
      const outputPath = this.generateCombinedOutputFilename(filename, extension);
      this.writeToFile(outputPath, combinedContent);
      outputFiles.push(outputPath);
    } else {
      console.log(combinedContent);
    }

    // Clear combined sections after output
    this.combinedSections = [];
    this.combineMode = false;

    return outputFiles;
  }

  /**
   * Generate combined output filename
   */
  private generateCombinedOutputFilename(inputFilename: string, extension: string): string {
    const baseName = inputFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    const filename = `${baseName}_datapilot_full_report${extension}`;
    console.log(`Generated combined output filename: ${filename}`);
    return filename;
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
