/**
 * Parsing Worker
 * Handles CPU-intensive data parsing operations in parallel
 */

import { parentPort } from 'worker_threads';
import { performance } from 'perf_hooks';

interface ParsingTask {
  taskId: string;
  type: string;
  data: any;
  enableMemoryMonitoring: boolean;
  memoryLimitMB: number;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
}

/**
 * High-performance parsing utilities
 */
class ParsingComputer {

  /**
   * Parse CSV chunk with custom delimiter detection
   */
  static parseCSVChunk(chunk: string, options: any = {}): any {
    const {
      delimiter = ',',
      quote = '"',
      escape = '"',
      skipEmptyLines = true,
      trimFields = true
    } = options;

    const rows: string[][] = [];
    const lines = chunk.split(/\r?\n/);
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      if (skipEmptyLines && line.trim() === '') continue;
      
      const fields = this.parseCSVLine(line, delimiter, quote, escape, trimFields);
      if (fields.length > 0) {
        rows.push(fields);
      }
    }

    return {
      rows,
      totalLines: lines.length,
      processedRows: rows.length
    };
  }

  /**
   * Parse a single CSV line with proper quote handling
   */
  private static parseCSVLine(
    line: string, 
    delimiter: string, 
    quote: string, 
    escape: string, 
    trimFields: boolean
  ): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escaped quote
          currentField += quote;
          i += 2;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        fields.push(trimFields ? currentField.trim() : currentField);
        currentField = '';
        i++;
      } else {
        // Regular character
        currentField += char;
        i++;
      }
    }

    // Add the last field
    fields.push(trimFields ? currentField.trim() : currentField);
    return fields;
  }

  /**
   * Detect CSV format from sample data
   */
  static detectCSVFormat(sample: string): any {
    const delimiters = [',', ';', '\t', '|', ':'];
    const quotes = ['"', "'", '`'];
    const lines = sample.split(/\r?\n/).slice(0, 10); // Analyze first 10 lines
    
    let bestDelimiter = ',';
    let bestQuote = '"';
    let maxConsistency = 0;

    // Test each delimiter
    for (const delimiter of delimiters) {
      const fieldCounts: number[] = [];
      
      for (const line of lines) {
        if (line.trim()) {
          const fields = this.parseCSVLine(line, delimiter, '"', '"', true);
          fieldCounts.push(fields.length);
        }
      }

      if (fieldCounts.length > 0) {
        // Calculate consistency (how similar field counts are)
        const avgFields = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
        const variance = fieldCounts.reduce((acc, count) => acc + Math.pow(count - avgFields, 2), 0) / fieldCounts.length;
        const consistency = avgFields / (1 + Math.sqrt(variance));

        if (consistency > maxConsistency) {
          maxConsistency = consistency;
          bestDelimiter = delimiter;
        }
      }
    }

    // Detect quote character
    const quoteScores = quotes.map(quote => {
      const quotedFieldPattern = new RegExp(`${quote}[^${quote}]*${quote}`, 'g');
      const matches = sample.match(quotedFieldPattern) || [];
      return { quote, score: matches.length };
    });

    bestQuote = quoteScores.reduce((best, current) => 
      current.score > best.score ? current : best
    ).quote;

    // Detect if first row is header
    const firstLineFields = this.parseCSVLine(lines[0] || '', bestDelimiter, bestQuote, bestQuote, true);
    const secondLineFields = this.parseCSVLine(lines[1] || '', bestDelimiter, bestQuote, bestQuote, true);
    
    const hasHeader = firstLineFields.length === secondLineFields.length &&
      firstLineFields.some(field => isNaN(Number(field)) && field.trim() !== '');

    return {
      delimiter: bestDelimiter,
      quote: bestQuote,
      hasHeader,
      consistency: maxConsistency,
      estimatedColumns: firstLineFields.length
    };
  }

  /**
   * Parse JSON with nested object flattening
   */
  static parseJSONWithFlattening(jsonString: string, options: any = {}): any {
    const { flattenObjects = true, arrayMode = 'records', maxDepth = 10 } = options;

    try {
      const parsed = JSON.parse(jsonString);
      
      if (Array.isArray(parsed)) {
        return {
          data: flattenObjects ? parsed.map(obj => this.flattenObject(obj, '', maxDepth)) : parsed,
          type: 'array',
          itemCount: parsed.length
        };
      } else if (typeof parsed === 'object' && parsed !== null) {
        const flattened = flattenObjects ? this.flattenObject(parsed, '', maxDepth) : parsed;
        return {
          data: [flattened],
          type: 'object',
          itemCount: 1
        };
      } else {
        return {
          data: [{ value: parsed }],
          type: 'primitive',
          itemCount: 1
        };
      }
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  /**
   * Flatten nested object to single level
   */
  private static flattenObject(obj: any, prefix: string = '', maxDepth: number = 10): any {
    if (maxDepth <= 0) return obj;
    
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          flattened[newKey] = value;
        } else if (Array.isArray(value)) {
          // Handle arrays
          if (value.length === 0) {
            flattened[newKey] = null;
          } else if (typeof value[0] === 'object') {
            // Array of objects - flatten each and create numbered keys
            value.forEach((item, index) => {
              if (typeof item === 'object') {
                const nestedFlattened = this.flattenObject(item, `${newKey}[${index}]`, maxDepth - 1);
                Object.assign(flattened, nestedFlattened);
              } else {
                flattened[`${newKey}[${index}]`] = item;
              }
            });
          } else {
            // Array of primitives - join as string
            flattened[newKey] = value.join(';');
          }
        } else if (typeof value === 'object') {
          // Nested object
          const nestedFlattened = this.flattenObject(value, newKey, maxDepth - 1);
          Object.assign(flattened, nestedFlattened);
        } else {
          // Primitive value
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  }

  /**
   * Parse JSON Lines (JSONL) format
   */
  static parseJSONLines(content: string, options: any = {}): any {
    const { flattenObjects = true, maxLines = Infinity } = options;
    const lines = content.split('\n').filter(line => line.trim());
    const results: any[] = [];
    const errors: string[] = [];
    
    const linesToProcess = Math.min(lines.length, maxLines);
    
    for (let i = 0; i < linesToProcess; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const parsed = JSON.parse(line);
        const processed = flattenObjects && typeof parsed === 'object' && parsed !== null 
          ? this.flattenObject(parsed)
          : parsed;
        results.push(processed);
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    return {
      data: results,
      totalLines: lines.length,
      processedLines: results.length,
      errors
    };
  }

  /**
   * Detect data types from sample values
   */
  static detectDataTypes(columns: string[][]): any {
    const typeDetection = columns.map((columnData, index) => {
      const sampleSize = Math.min(columnData.length, 1000);
      const sample = columnData.slice(0, sampleSize);
      
      let numericCount = 0;
      let integerCount = 0;
      let dateCount = 0;
      let booleanCount = 0;
      let nullCount = 0;
      
      const uniqueValues = new Set<string>();
      
      for (const value of sample) {
        const trimmed = value?.toString().trim();
        
        if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'NULL') {
          nullCount++;
          continue;
        }
        
        uniqueValues.add(trimmed);
        
        // Check if numeric
        const numValue = Number(trimmed);
        if (!isNaN(numValue) && isFinite(numValue)) {
          numericCount++;
          if (Number.isInteger(numValue)) {
            integerCount++;
          }
        }
        
        // Check if date
        const dateValue = new Date(trimmed);
        if (!isNaN(dateValue.getTime()) && trimmed.length > 6) {
          dateCount++;
        }
        
        // Check if boolean
        if (['true', 'false', '1', '0', 'yes', 'no'].includes(trimmed.toLowerCase())) {
          booleanCount++;
        }
      }
      
      const validCount = sample.length - nullCount;
      const threshold = 0.8; // 80% threshold for type detection
      
      let detectedType = 'string';
      let confidence = 0;
      
      if (validCount > 0) {
        if (numericCount / validCount >= threshold) {
          detectedType = integerCount / validCount >= 0.9 ? 'integer' : 'number';
          confidence = numericCount / validCount;
        } else if (dateCount / validCount >= threshold) {
          detectedType = 'date';
          confidence = dateCount / validCount;
        } else if (booleanCount / validCount >= threshold) {
          detectedType = 'boolean';
          confidence = booleanCount / validCount;
        } else {
          detectedType = 'string';
          confidence = 1 - Math.max(numericCount, dateCount, booleanCount) / validCount;
        }
      }
      
      return {
        column: index,
        detectedType,
        confidence: Number(confidence.toFixed(3)),
        uniqueValues: uniqueValues.size,
        nullCount,
        sampleSize: sample.length,
        statistics: {
          numericCount,
          integerCount,
          dateCount,
          booleanCount
        }
      };
    });
    
    return typeDetection;
  }

  /**
   * Validate and clean data based on detected types
   */
  static validateAndCleanData(data: any[][], typeInfo: any[]): any {
    const cleanedData: any[][] = [];
    const validationErrors: any[] = [];
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const cleanedRow: any[] = [];
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const value = row[colIndex];
        const typeHint = typeInfo[colIndex];
        
        try {
          const cleanedValue = this.cleanValue(value, typeHint.detectedType);
          cleanedRow.push(cleanedValue);
        } catch (error) {
          validationErrors.push({
            row: rowIndex,
            column: colIndex,
            value,
            expectedType: typeHint.detectedType,
            error: error.message
          });
          cleanedRow.push(null); // Use null for invalid values
        }
      }
      
      cleanedData.push(cleanedRow);
    }
    
    return {
      cleanedData,
      validationErrors,
      errorRate: validationErrors.length / (data.length * (data[0]?.length || 0))
    };
  }

  /**
   * Clean individual value based on type
   */
  private static cleanValue(value: any, type: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const strValue = value.toString().trim();
    
    switch (type) {
      case 'integer':
        const intVal = parseInt(strValue, 10);
        if (isNaN(intVal)) throw new Error(`Invalid integer: ${strValue}`);
        return intVal;
        
      case 'number':
        const numVal = parseFloat(strValue);
        if (isNaN(numVal)) throw new Error(`Invalid number: ${strValue}`);
        return numVal;
        
      case 'boolean':
        const lowerVal = strValue.toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(lowerVal)) return true;
        if (['false', '0', 'no', 'n'].includes(lowerVal)) return false;
        throw new Error(`Invalid boolean: ${strValue}`);
        
      case 'date':
        const dateVal = new Date(strValue);
        if (isNaN(dateVal.getTime())) throw new Error(`Invalid date: ${strValue}`);
        return dateVal.toISOString();
        
      default:
        return strValue;
    }
  }
}

/**
 * Handle incoming tasks
 */
function handleTask(task: ParsingTask): TaskResult {
  const startTime = performance.now();
  let memoryBefore: number | undefined;
  
  if (task.enableMemoryMonitoring) {
    memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  try {
    let result: any;

    switch (task.type) {
      case 'parse-csv-chunk':
        result = ParsingComputer.parseCSVChunk(task.data.chunk, task.data.options);
        break;

      case 'detect-csv-format':
        result = ParsingComputer.detectCSVFormat(task.data.sample);
        break;

      case 'parse-json':
        result = ParsingComputer.parseJSONWithFlattening(task.data.content, task.data.options);
        break;

      case 'parse-jsonl':
        result = ParsingComputer.parseJSONLines(task.data.content, task.data.options);
        break;

      case 'detect-data-types':
        result = ParsingComputer.detectDataTypes(task.data.columns);
        break;

      case 'validate-and-clean':
        result = ParsingComputer.validateAndCleanData(task.data.data, task.data.typeInfo);
        break;

      default:
        throw new Error(`Unknown parsing task type: ${task.type}`);
    }

    const executionTime = performance.now() - startTime;
    let memoryUsage: number | undefined;
    
    if (task.enableMemoryMonitoring && memoryBefore !== undefined) {
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      memoryUsage = memoryAfter - memoryBefore;
      
      // Check memory limit
      if (memoryAfter > task.memoryLimitMB) {
        throw new Error(`Memory limit exceeded: ${memoryAfter.toFixed(2)}MB > ${task.memoryLimitMB}MB`);
      }
    }

    return {
      taskId: task.taskId,
      success: true,
      result,
      executionTime,
      memoryUsage
    };

  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return {
      taskId: task.taskId,
      success: false,
      error: error.message,
      executionTime
    };
  }
}

// Worker initialization
if (parentPort) {
  // Signal that worker is ready
  parentPort.postMessage({ type: 'ready' });

  // Handle incoming messages
  parentPort.on('message', (task: ParsingTask) => {
    const result = handleTask(task);
    parentPort!.postMessage(result);
  });
} else {
  console.error('Parsing worker: parentPort is null');
  process.exit(1);
}