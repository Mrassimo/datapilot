/**
 * Section 2: Uniqueness Dimension Analyzer
 * Detects exact and semantic duplicates, analyzes cardinality
 */

import {
  UniquenessAnalysis,
  DuplicateRecord,
  KeyUniqueness,
  SemanticDuplicate,
  DataQualityScore,
} from './types';
import { DataType } from '../../core/types';

export interface UniquenessAnalyzerInput {
  data: (string | null | undefined)[][];
  headers: string[];
  columnTypes: DataType[];
  rowCount: number;
  columnCount: number;
  potentialKeys?: string[]; // Optional hints for key columns
}

export class UniquenessAnalyzer {
  private data: (string | null | undefined)[][];
  private headers: string[];
  private columnTypes: DataType[];
  private rowCount: number;
  private potentialKeys: string[];

  constructor(input: UniquenessAnalyzerInput) {
    this.data = input.data;
    this.headers = input.headers;
    this.columnTypes = input.columnTypes;
    this.rowCount = input.rowCount;
    this.potentialKeys = input.potentialKeys || this.inferPotentialKeys();
  }

  public analyze(): UniquenessAnalysis {
    const start = performance.now();

    // 1. Exact duplicate detection
    const exactDuplicates = this.detectExactDuplicates();

    // 2. Key uniqueness analysis
    const keyUniqueness = this.analyzeKeyUniqueness();

    // 3. Column-level uniqueness
    const columnUniqueness = this.analyzeColumnUniqueness();

    // 4. Semantic duplicate detection (limited scope for performance)
    const semanticDuplicates = this.detectSemanticDuplicates();

    // 5. Calculate overall score
    const score = this.calculateUniquenessScore(exactDuplicates, keyUniqueness, columnUniqueness);

    console.log(`Uniqueness analysis completed in ${(performance.now() - start).toFixed(2)}ms`);

    return {
      exactDuplicates,
      keyUniqueness,
      columnUniqueness,
      semanticDuplicates,
      score,
    };
  }

  private detectExactDuplicates() {
    const rowHashes = new Map<string, number[]>();

    // Create hash for each row and track indices
    for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
      const row = this.data[rowIdx] || [];
      const rowHash = this.createRowHash(row);

      if (!rowHashes.has(rowHash)) {
        rowHashes.set(rowHash, []);
      }
      rowHashes.get(rowHash)!.push(rowIdx);
    }

    // Find duplicates
    const duplicateGroups: DuplicateRecord[] = [];
    let totalDuplicateRows = 0;

    for (const [, indices] of rowHashes.entries()) {
      if (indices.length > 1) {
        duplicateGroups.push({
          rowIndices: indices,
          duplicateType: 'Exact',
        });
        totalDuplicateRows += indices.length - 1; // Don't count the original
      }
    }

    const percentage = (totalDuplicateRows / this.rowCount) * 100;

    return {
      count: totalDuplicateRows,
      percentage,
      duplicateGroups: duplicateGroups.slice(0, 10), // Limit for performance
    };
  }

  private analyzeKeyUniqueness(): KeyUniqueness[] {
    const keyColumns = this.potentialKeys
      .map((keyName) => {
        const colIdx = this.headers.indexOf(keyName);
        return colIdx !== -1 ? colIdx : null;
      })
      .filter((idx) => idx !== null) as number[];

    // Also analyze columns that look like IDs
    const idLikeColumns = this.headers
      .map((header, idx) => ({ header: header.toLowerCase(), idx }))
      .filter(
        ({ header }) =>
          header.includes('id') ||
          header.includes('key') ||
          header.includes('code') ||
          header === 'index',
      )
      .map(({ idx }) => idx);

    const allCandidateColumns = [...new Set([...keyColumns, ...idLikeColumns])];

    return allCandidateColumns.map((colIdx) => {
      const columnName = this.headers[colIdx];
      const valueMap = new Map<string, number>();
      let nonNullCount = 0;

      // Count occurrences of each value
      for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
        const value = this.normalizeValue(this.data[rowIdx]?.[colIdx]);
        if (value !== null) {
          nonNullCount++;
          const key = String(value);
          valueMap.set(key, (valueMap.get(key) || 0) + 1);
        }
      }

      const uniqueCount = valueMap.size;
      const duplicateCount = nonNullCount - uniqueCount;
      const cardinality = uniqueCount;

      // Find most frequent duplicates
      const duplicateValues = Array.from(valueMap.entries())
        .filter(([_, count]) => count > 1)
        .map(([value, frequency]) => ({ value, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      const isPrimaryKey = this.isPotentialPrimaryKey(columnName, duplicateCount, nonNullCount);

      return {
        columnName,
        isPrimaryKey,
        duplicateCount,
        cardinality,
        duplicateValues,
      };
    });
  }

  private analyzeColumnUniqueness() {
    return this.headers.map((columnName, colIdx) => {
      const valueMap = new Map<string, number>();
      let nonNullCount = 0;

      for (let rowIdx = 0; rowIdx < this.rowCount; rowIdx++) {
        const value = this.normalizeValue(this.data[rowIdx]?.[colIdx]);
        if (value !== null) {
          nonNullCount++;
          const key = String(value);
          valueMap.set(key, (valueMap.get(key) || 0) + 1);
        }
      }

      const uniqueCount = valueMap.size;
      const uniquePercentage = nonNullCount > 0 ? (uniqueCount / nonNullCount) * 100 : 0;
      const duplicateCount = nonNullCount - uniqueCount;

      // Find most frequent duplicate
      let mostFrequentDuplicate = undefined;
      let maxFrequency = 1;

      for (const [value, frequency] of valueMap.entries()) {
        if (frequency > maxFrequency) {
          maxFrequency = frequency;
          mostFrequentDuplicate = { value, frequency };
        }
      }

      return {
        columnName,
        uniquePercentage,
        duplicateCount,
        mostFrequentDuplicate,
      };
    });
  }

  private detectSemanticDuplicates() {
    const semanticDuplicates: SemanticDuplicate[] = [];
    const methods = ['levenshtein', 'soundex'];

    // For performance, only check string columns with reasonable cardinality
    const stringColumns = this.headers
      .map((header, idx) => ({ header, idx, type: this.columnTypes[idx] }))
      .filter(({ type }) => type === DataType.STRING)
      .slice(0, 3); // Limit to first 3 string columns for performance

    if (stringColumns.length === 0) {
      return {
        suspectedPairs: 0,
        duplicates: [],
        methods: [],
      };
    }

    // Sample rows for performance (max 1000 comparisons)
    const maxComparisons = 1000;
    const sampleSize = Math.min(this.rowCount, Math.floor(Math.sqrt(maxComparisons * 2)));
    const sampleIndices = this.getSampleIndices(sampleSize);

    for (let i = 0; i < sampleIndices.length; i++) {
      for (let j = i + 1; j < sampleIndices.length; j++) {
        const rowIdx1 = sampleIndices[i];
        const rowIdx2 = sampleIndices[j];

        const similarity = this.calculateRowSimilarity(rowIdx1, rowIdx2, stringColumns);

        if (similarity.overall > 0.8) {
          // High similarity threshold
          semanticDuplicates.push({
            recordPair: [rowIdx1, rowIdx2],
            confidence: similarity.overall,
            method: 'composite',
            similarity: similarity.columnSimilarities,
          });
        }
      }
    }

    return {
      suspectedPairs: semanticDuplicates.length,
      duplicates: semanticDuplicates.slice(0, 10), // Limit results
      methods,
    };
  }

  private calculateRowSimilarity(
    rowIdx1: number,
    rowIdx2: number,
    stringColumns: Array<{ header: string; idx: number; type: DataType }>,
  ) {
    const columnSimilarities: Record<string, number> = {};
    let totalSimilarity = 0;
    let validColumns = 0;

    for (const { header, idx } of stringColumns) {
      const value1 = this.normalizeValue(this.data[rowIdx1]?.[idx]);
      const value2 = this.normalizeValue(this.data[rowIdx2]?.[idx]);

      if (value1 !== null && value2 !== null) {
        const str1 = String(value1).toLowerCase().trim();
        const str2 = String(value2).toLowerCase().trim();

        if (str1.length > 0 && str2.length > 0) {
          const levenshteinSim = this.calculateLevenshteinSimilarity(str1, str2);
          const soundexSim = this.calculateSoundexSimilarity(str1, str2);

          const columnSim = Math.max(levenshteinSim, soundexSim);
          columnSimilarities[header] = columnSim;
          totalSimilarity += columnSim;
          validColumns++;
        }
      }
    }

    const overall = validColumns > 0 ? totalSimilarity / validColumns : 0;

    return {
      overall,
      columnSimilarities,
    };
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateSoundexSimilarity(str1: string, str2: string): number {
    const soundex1 = this.soundex(str1);
    const soundex2 = this.soundex(str2);
    return soundex1 === soundex2 ? 1 : 0;
  }

  private soundex(str: string): string {
    // Simplified Soundex implementation
    const mapping: Record<string, string> = {
      b: '1',
      f: '1',
      p: '1',
      v: '1',
      c: '2',
      g: '2',
      j: '2',
      k: '2',
      q: '2',
      s: '2',
      x: '2',
      z: '2',
      d: '3',
      t: '3',
      l: '4',
      m: '5',
      n: '5',
      r: '6',
    };

    const cleaned = str.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length === 0) return '0000';

    let result = cleaned[0].toUpperCase();
    let prev = mapping[cleaned[0]] || '0';

    for (let i = 1; i < cleaned.length && result.length < 4; i++) {
      const code = mapping[cleaned[i]] || '0';
      if (code !== '0' && code !== prev) {
        result += code;
      }
      prev = code;
    }

    return result.padEnd(4, '0').substring(0, 4);
  }

  private getSampleIndices(sampleSize: number): number[] {
    if (sampleSize >= this.rowCount) {
      return Array.from({ length: this.rowCount }, (_, i) => i);
    }

    const indices: number[] = [];
    const step = this.rowCount / sampleSize;

    for (let i = 0; i < sampleSize; i++) {
      indices.push(Math.floor(i * step));
    }

    return indices;
  }

  private calculateUniquenessScore(
    exactDuplicates: any,
    keyUniqueness: KeyUniqueness[],
    columnUniqueness: any[],
  ): DataQualityScore {
    // Base score starts at 100
    let score = 100;

    // Penalize for exact duplicates
    score -= Math.min(30, exactDuplicates.percentage * 2); // Max 30 points off

    // Penalize for key constraint violations
    const keyViolations = keyUniqueness.filter((key) => key.isPrimaryKey && key.duplicateCount > 0);
    score -= keyViolations.length * 15; // 15 points per violated key

    // Slight penalty for low uniqueness in key-like columns
    const lowUniquenessColumns = columnUniqueness.filter((col) => {
      const isKeyLike =
        col.columnName.toLowerCase().includes('id') || col.columnName.toLowerCase().includes('key');
      return isKeyLike && col.uniquePercentage < 80;
    });
    score -= lowUniquenessColumns.length * 5; // 5 points per low-uniqueness key column

    score = Math.max(0, score);

    let interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    if (score >= 95) interpretation = 'Excellent';
    else if (score >= 85) interpretation = 'Good';
    else if (score >= 70) interpretation = 'Fair';
    else if (score >= 50) interpretation = 'Needs Improvement';
    else interpretation = 'Poor';

    return {
      score: Math.round(score * 100) / 100,
      interpretation,
      details: `${exactDuplicates.percentage.toFixed(2)}% duplicate rows, ${keyViolations.length} key constraint violations`,
    };
  }

  private createRowHash(row: (string | null | undefined)[]): string {
    return row.map((cell) => String(this.normalizeValue(cell) || '')).join('|');
  }

  private normalizeValue(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'na') {
      return null;
    }
    return trimmed;
  }

  private inferPotentialKeys(): string[] {
    const keys: string[] = [];

    for (const header of this.headers) {
      const lower = header.toLowerCase();
      if (
        lower.includes('id') ||
        lower.includes('key') ||
        lower.includes('code') ||
        lower === 'index' ||
        lower.endsWith('_id') ||
        lower.endsWith('id') ||
        lower.startsWith('id_')
      ) {
        keys.push(header);
      }
    }

    return keys;
  }

  private isPotentialPrimaryKey(
    columnName: string,
    duplicateCount: number,
    totalCount: number,
  ): boolean {
    const lower = columnName.toLowerCase();
    const isKeyLike = lower.includes('id') || lower.includes('key') || lower === 'index';
    const hasNoDuplicates = duplicateCount === 0;
    const highCardinality = totalCount > 0 && (totalCount - duplicateCount) / totalCount > 0.9;

    return isKeyLike && hasNoDuplicates && highCardinality;
  }
}
