/**
 * Section 1 Formatter - Generate structured markdown reports
 * Formats analysis results to match section1.md specification exactly
 */

import type { Section1Result, Section1Overview } from './types';

export class Section1Formatter {
  /**
   * Generate complete Section 1 markdown report
   */
  formatReport(result: Section1Result): string {
    const { overview, warnings, performanceMetrics } = result;

    const sections = [
      this.formatHeader(overview),
      this.formatFileDetails(overview),
      this.formatParsingParameters(overview),
      this.formatStructuralDimensions(overview),
      this.formatExecutionContext(overview),
      this.formatWarnings(warnings),
      this.formatPerformanceMetrics(performanceMetrics),
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Format the report header
   */
  private formatHeader(overview: Section1Overview): string {
    const timestamp = overview.generatedAt.toISOString().replace('T', ' ').slice(0, 19) + ' (UTC)';

    return `# DataPilot Analysis Report

Analysis Target: ${overview.fileDetails.originalFilename}
Report Generated: ${timestamp}
DataPilot Version: v${overview.version} (TypeScript Edition)

---

## Section 1: Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.`;
  }

  /**
   * Format file details section
   */
  private formatFileDetails(overview: Section1Overview): string {
    const { fileDetails } = overview;
    const lastModified =
      fileDetails.lastModified.toISOString().replace('T', ' ').slice(0, 19) + ' (UTC)';

    return `**1.1. Input Data File Details:**
    * Original Filename: \`${fileDetails.originalFilename}\`
    * Full Resolved Path: \`${fileDetails.fullResolvedPath}\`
    * File Size (on disk): ${this.formatFileSize(fileDetails.fileSizeMB)}
    * MIME Type (detected/inferred): \`${fileDetails.mimeType}\`
    * File Last Modified (OS Timestamp): ${lastModified}
    * File Hash (SHA256): \`${fileDetails.sha256Hash}\``;
  }

  /**
   * Format parsing parameters section
   */
  private formatParsingParameters(overview: Section1Overview): string {
    const { parsingMetadata } = overview;
    const { encoding, delimiter, headerProcessing } = parsingMetadata;

    const encodingConfidence = this.formatConfidence(encoding.confidence);
    const delimiterConfidence = this.formatConfidence(delimiter.confidence);
    const lineEndingFormat =
      parsingMetadata.lineEnding === 'LF' ? 'LF (Unix-style)' : 'CRLF (Windows-style)';
    const bomStatus = encoding.bomDetected
      ? `${encoding.bomType} Detected and Handled`
      : 'Not Detected';

    return `**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: ${parsingMetadata.dataSourceType}
    * Parsing Engine Utilized: ${parsingMetadata.parsingEngine}
    * Time Taken for Parsing & Initial Load: ${parsingMetadata.parsingTimeSeconds} seconds
    * Detected Character Encoding: \`${encoding.encoding}\`
        * Encoding Detection Method: ${encoding.detectionMethod}
        * Encoding Confidence: ${encodingConfidence}
    * Detected Delimiter Character: \`${delimiter.delimiter}\` (${this.getDelimiterName(delimiter.delimiter)})
        * Delimiter Detection Method: ${delimiter.detectionMethod}
        * Delimiter Confidence: ${delimiterConfidence}
    * Detected Line Ending Format: \`${lineEndingFormat}\`
    * Detected Quoting Character: \`${parsingMetadata.quotingCharacter}\`
        * Empty Lines Encountered: ${parsingMetadata.emptyLinesEncountered}
    * Header Row Processing:
        * Header Presence: ${headerProcessing.headerPresence}
        * Header Row Number(s): ${headerProcessing.headerRowNumbers.join(', ') || 'N/A'}
        * Column Names Derived From: ${headerProcessing.columnNamesSource}
    * Byte Order Mark (BOM): ${bomStatus}
    * Initial Row/Line Scan Limit for Detection: ${parsingMetadata.initialScanLimit.method}`;
  }

  /**
   * Format structural dimensions section
   */
  private formatStructuralDimensions(overview: Section1Overview): string {
    const { structuralDimensions } = overview;
    const { totalRowsRead, totalDataRows, totalColumns, totalDataCells } = structuralDimensions;
    const { columnInventory, estimatedInMemorySizeMB, averageRowLengthBytes, sparsityAnalysis } =
      structuralDimensions;

    const columnList = columnInventory
      .map((col) => `        ${col.index}.  (Index ${col.originalIndex}) \`${col.name}\``)
      .join('\n');

    return `**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): ${totalRowsRead.toLocaleString()}
    * Total Rows of Data (excluding header): ${totalDataRows.toLocaleString()}
    * Total Columns Detected: ${totalColumns}
    * Total Data Cells (Data Rows × Columns): ${totalDataCells.toLocaleString()}
    * List of Column Names (${totalColumns}) and Original Index:
${columnList}
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): ${estimatedInMemorySizeMB} MB
    * Average Row Length (bytes, approximate): ${averageRowLengthBytes} bytes
    * Dataset Sparsity (Initial Estimate): ${sparsityAnalysis.description} (${sparsityAnalysis.sparsityPercentage}% sparse cells via ${sparsityAnalysis.method})`;
  }

  /**
   * Format execution context section
   */
  private formatExecutionContext(overview: Section1Overview): string {
    const { executionContext } = overview;
    const startTime =
      executionContext.analysisStartTimestamp.toISOString().replace('T', ' ').slice(0, 19) +
      ' (UTC)';
    const modulesList = executionContext.activatedModules.join(', ');

    let contextSection = `**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: \`${executionContext.fullCommandExecuted}\`
    * Analysis Mode Invoked: ${executionContext.analysisMode}
    * Timestamp of Analysis Start: ${startTime}
    * Global Dataset Sampling Strategy: ${executionContext.globalSamplingStrategy}
    * DataPilot Modules Activated for this Run: ${modulesList}
    * Processing Time for Section 1 Generation: ${executionContext.processingTimeSeconds} seconds`;

    // Add host environment details if available
    if (executionContext.hostEnvironment) {
      const env = executionContext.hostEnvironment;
      contextSection += `
    * Host Environment Details:
        * Operating System: ${env.operatingSystem}
        * System Architecture: ${env.systemArchitecture}
        * Execution Runtime: ${env.executionRuntime}
        * Available CPU Cores / Memory (at start of analysis): ${env.availableCpuCores} cores / ${env.availableMemoryGB} GB`;
    }

    return contextSection;
  }

  /**
   * Format warnings section if any exist
   */
  private formatWarnings(warnings: import('./types').Section1Warning[]): string {
    if (warnings.length === 0) {
      return '';
    }

    const warningsByCategory = this.groupWarningsByCategory(warnings);
    const sections: string[] = [];

    for (const [category, categoryWarnings] of Object.entries(warningsByCategory)) {
      const warningList = categoryWarnings
        .map(
          (w) =>
            `    * ${this.getSeverityIcon(w.severity)} ${w.message}${w.suggestion ? ` (Suggestion: ${w.suggestion})` : ''}`,
        )
        .join('\n');

      sections.push(`**${this.capitalizeFirst(category)} Warnings:**\n${warningList}`);
    }

    return `---\n### Analysis Warnings\n\n${sections.join('\n\n')}`;
  }

  /**
   * Format performance metrics section
   */
  private formatPerformanceMetrics(metrics: any): string {
    const phaseList = Object.entries(metrics.phases)
      .map(([phase, time]) => `    * ${this.capitalizeFirst(phase.replace('-', ' '))}: ${time}s`)
      .join('\n');

    let metricsSection = `---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: ${metrics.totalAnalysisTime} seconds
${phaseList}`;

    if (metrics.peakMemoryUsage) {
      metricsSection += `
    * Peak Memory Usage: ${metrics.peakMemoryUsage} MB`;
    }

    return metricsSection;
  }

  /**
   * Helper methods for formatting
   */
  private formatFileSize(sizeMB: number): string {
    if (sizeMB < 0.01) {
      return `${(sizeMB * 1024).toFixed(2)} KB`;
    } else if (sizeMB >= 1024) {
      return `${(sizeMB / 1024).toFixed(2)} GB`;
    } else {
      return `${sizeMB.toFixed(2)} MB`;
    }
  }

  private formatConfidence(confidence: number): string {
    if (confidence >= 90) return `High (${confidence}%)`;
    if (confidence >= 70) return `Medium (${confidence}%)`;
    return `Low (${confidence}%)`;
  }

  private getDelimiterName(delimiter: string): string {
    const names: Record<string, string> = {
      ',': 'Comma',
      '\t': 'Tab',
      ';': 'Semicolon',
      '|': 'Pipe',
      ':': 'Colon',
    };
    return names[delimiter] || 'Custom';
  }

  private groupWarningsByCategory(
    warnings: import('./types').Section1Warning[],
  ): Record<string, import('./types').Section1Warning[]> {
    return warnings.reduce(
      (groups, warning) => {
        const category = warning.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(warning);
        return groups;
      },
      {} as Record<string, import('./types').Section1Warning[]>,
    );
  }

  private getSeverityIcon(severity: string): string {
    const icons = {
      low: '⚠️',
      medium: '⚠️',
      high: '❌',
    };
    return icons[severity as keyof typeof icons] || '⚠️';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate compact summary for quick overview
   */
  formatSummary(result: Section1Result): string {
    const { overview, performanceMetrics } = result;
    const { fileDetails, structuralDimensions } = overview;

    return `📊 **Dataset Summary**
• File: ${fileDetails.originalFilename} (${this.formatFileSize(fileDetails.fileSizeMB)})
• Structure: ${structuralDimensions.totalDataRows.toLocaleString()} rows × ${structuralDimensions.totalColumns} columns
• Memory: ~${structuralDimensions.estimatedInMemorySizeMB} MB
• Sparsity: ${structuralDimensions.sparsityAnalysis.sparsityPercentage}%
• Analysis Time: ${performanceMetrics.totalAnalysisTime}s
• Warnings: ${result.warnings.length}`;
  }
}
