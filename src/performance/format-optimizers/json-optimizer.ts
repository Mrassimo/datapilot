/**
 * JSON Format Performance Optimizer
 * Provides schema detection, streaming parsing, and memory optimization for JSON files
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../../core/types';
import { getGlobalMemoryOptimizer } from '../memory-optimizer';
import { getGlobalEnhancedErrorHandler } from '../../utils/enhanced-error-handler';

export interface JsonOptimizationOptions {
  enableSchemaDetection?: boolean;
  enableSchemaValidation?: boolean;
  enableStreaming?: boolean;
  bufferSize?: number;
  memoryLimitMB?: number;
  enableTypeCoercion?: boolean;
  maxNestingDepth?: number;
  enableCompression?: boolean;
  arrayBatchSize?: number;
}

export interface JsonMetrics {
  recordsProcessed: number;
  schemasDetected: number;
  validationErrors: number;
  compressionRatio: number;
  streamingEfficiency: number;
  memoryPeakMB: number;
  totalProcessingTime: number;
  averageRecordProcessingTime: number;
  schemaConsistency: number;
}

export interface JsonSchema {
  type: string;
  properties?: Map<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  format?: string;
  nullable?: boolean;
  examples?: any[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface JsonReadOptions {
  validateSchema?: boolean;
  enforceTypes?: boolean;
  skipInvalidRecords?: boolean;
  maxRecords?: number;
  startRecord?: number;
  selectFields?: string[];
  transformers?: Map<string, (value: any) => any>;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  record: any;
}

/**
 * High-performance JSON optimizer with schema detection and validation
 */
export class JsonOptimizer extends EventEmitter {
  private options: Required<JsonOptimizationOptions>;
  private metrics: JsonMetrics;
  private detectedSchema: JsonSchema | null = null;
  private schemaStatistics: Map<string, any> = new Map();
  private compressionBuffer: Buffer[] = [];
  private memoryOptimizer = getGlobalMemoryOptimizer();
  private errorHandler = getGlobalEnhancedErrorHandler();

  constructor(options: JsonOptimizationOptions = {}) {
    super();
    
    this.options = {
      enableSchemaDetection: options.enableSchemaDetection ?? true,
      enableSchemaValidation: options.enableSchemaValidation ?? true,
      enableStreaming: options.enableStreaming ?? true,
      bufferSize: options.bufferSize ?? 64 * 1024, // 64KB
      memoryLimitMB: options.memoryLimitMB ?? 256,
      enableTypeCoercion: options.enableTypeCoercion ?? true,
      maxNestingDepth: options.maxNestingDepth ?? 10,
      enableCompression: options.enableCompression ?? false,
      arrayBatchSize: options.arrayBatchSize ?? 1000
    };

    this.metrics = this.initializeMetrics();
    
    logger.info('JSON optimizer initialized', {
      component: 'JsonOptimizer',
      options: this.options
    });
  }

  /**
   * Optimize JSON file reading with schema detection and validation
   */
  async optimizeRead(filePath: string, readOptions: JsonReadOptions = {}): Promise<any[]> {
    return this.errorHandler.wrapFunction(async () => {
      const startTime = Date.now();
      
      try {
        // Validate inputs
        await this.validateInputs(filePath, readOptions);
        
        // Detect JSON structure and schema
        const jsonStructure = await this.analyzeJsonStructure(filePath);
        
        // Generate optimized schema if enabled
        if (this.options.enableSchemaDetection) {
          this.detectedSchema = await this.detectSchema(filePath, jsonStructure);
        }
        
        // Read with streaming and optimization
        const results = await this.readWithOptimization(filePath, readOptions, jsonStructure);
        
        // Update metrics
        this.updateMetrics(results.length, Date.now() - startTime);
        
        logger.info(`JSON read optimized: ${results.length} records in ${Date.now() - startTime}ms`, {
          component: 'JsonOptimizer',
          filePath,
          recordCount: results.length
        });
        
        return results;
        
      } catch (error) {
        this.emit('error', error);
        throw new DataPilotError(
          `JSON optimization failed: ${(error as Error).message}`,
          'JSON_OPTIMIZATION_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.PERFORMANCE
        );
      }
    }, { operation: 'json-read', component: 'JsonOptimizer', filePath })();
  }

  /**
   * Analyze JSON file structure for optimization
   */
  private async analyzeJsonStructure(filePath: string): Promise<any> {
    const fs = await import('fs');
    const sample = await this.readFileSample(filePath, 1024 * 1024); // 1MB sample
    
    try {
      const sampleData = JSON.parse(sample);
      
      const structure = {
        isArray: Array.isArray(sampleData),
        rootType: this.getDataType(sampleData),
        estimatedSize: this.estimateJsonSize(filePath),
        complexity: this.calculateComplexity(sampleData),
        hasNestedObjects: this.hasNestedStructures(sampleData),
        arrayElementTypes: Array.isArray(sampleData) ? this.analyzeArrayTypes(sampleData.slice(0, 100)) : null
      };
      
      logger.debug('JSON structure analyzed', {
        component: 'JsonOptimizer',
        structure
      });
      
      return structure;
      
    } catch (error) {
      throw new DataPilotError(
        `Failed to analyze JSON structure: ${(error as Error).message}`,
        'JSON_ANALYSIS_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING
      );
    }
  }

  /**
   * Detect and generate JSON schema
   */
  private async detectSchema(filePath: string, structure: any): Promise<JsonSchema> {
    try {
      const sampleData = await this.getSampleData(filePath, 1000); // Sample 1000 records
      
      if (structure.isArray && sampleData.length > 0) {
        return this.generateSchemaFromArray(sampleData);
      } else if (typeof sampleData === 'object' && sampleData !== null) {
        return this.generateSchemaFromObject(sampleData);
      }
      
      return {
        type: this.getDataType(sampleData),
        nullable: false
      };
      
    } catch (error) {
      logger.warn('Failed to detect JSON schema', {
        component: 'JsonOptimizer',
        error: (error as Error).message
      });
      
      return {
        type: 'unknown',
        nullable: true
      };
    }
  }

  /**
   * Generate schema from array of objects
   */
  private generateSchemaFromArray(data: any[]): JsonSchema {
    const itemSchemas: JsonSchema[] = [];
    const commonProperties = new Map<string, Set<string>>();
    
    // Analyze sample of array items
    const sampleSize = Math.min(100, data.length);
    for (let i = 0; i < sampleSize; i++) {
      const item = data[i];
      const itemSchema = this.generateSchemaFromObject(item);
      itemSchemas.push(itemSchema);
      
      // Track property frequency
      if (itemSchema.properties) {
        for (const [prop, schema] of itemSchema.properties) {
          if (!commonProperties.has(prop)) {
            commonProperties.set(prop, new Set());
          }
          commonProperties.get(prop)!.add(schema.type);
        }
      }
    }
    
    // Merge schemas to find common structure
    const mergedSchema = this.mergeSchemas(itemSchemas);
    
    // Determine required fields (present in >80% of samples)
    const requiredThreshold = sampleSize * 0.8;
    const required: string[] = [];
    
    for (const [prop, types] of commonProperties) {
      if (types.size >= requiredThreshold) {
        required.push(prop);
      }
    }
    
    return {
      type: 'array',
      items: mergedSchema,
      nullable: false
    };
  }

  /**
   * Generate schema from single object
   */
  private generateSchemaFromObject(obj: any): JsonSchema {
    if (obj === null) {
      return { type: 'null', nullable: true };
    }
    
    if (typeof obj !== 'object') {
      return {
        type: this.getDataType(obj),
        nullable: false,
        ...(this.getConstraints(obj))
      };
    }
    
    const properties = new Map<string, JsonSchema>();
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      properties.set(key, this.generateSchemaFromValue(value));
      
      // Consider field required if not null/undefined
      if (value !== null && value !== undefined) {
        required.push(key);
      }
    }
    
    return {
      type: 'object',
      properties,
      required,
      nullable: false
    };
  }

  /**
   * Generate schema from individual value
   */
  private generateSchemaFromValue(value: any): JsonSchema {
    const baseSchema: JsonSchema = {
      type: this.getDataType(value),
      nullable: value === null || value === undefined
    };
    
    // Add type-specific constraints
    const constraints = this.getConstraints(value);
    Object.assign(baseSchema, constraints);
    
    // Handle nested objects and arrays
    if (Array.isArray(value) && value.length > 0) {
      baseSchema.items = this.generateSchemaFromValue(value[0]);
    } else if (typeof value === 'object' && value !== null) {
      baseSchema.properties = new Map();
      for (const [key, nestedValue] of Object.entries(value)) {
        baseSchema.properties.set(key, this.generateSchemaFromValue(nestedValue));
      }
    }
    
    return baseSchema;
  }

  /**
   * Get data type for value
   */
  private getDataType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') {
      // Check for special string formats
      if (this.isDateString(value)) return 'date';
      if (this.isEmailString(value)) return 'email';
      if (this.isUrlString(value)) return 'url';
      return 'string';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    }
    return typeof value;
  }

  /**
   * Get type-specific constraints
   */
  private getConstraints(value: any): Partial<JsonSchema> {
    const constraints: Partial<JsonSchema> = {};
    
    if (typeof value === 'string') {
      constraints.minLength = value.length;
      constraints.maxLength = value.length;
      
      // Add pattern for common formats
      if (this.isEmailString(value)) {
        constraints.format = 'email';
      } else if (this.isUrlString(value)) {
        constraints.format = 'url';
      } else if (this.isDateString(value)) {
        constraints.format = 'date';
      }
      
    } else if (typeof value === 'number') {
      constraints.minimum = value;
      constraints.maximum = value;
    }
    
    return constraints;
  }

  /**
   * Merge multiple schemas into one
   */
  private mergeSchemas(schemas: JsonSchema[]): JsonSchema {
    if (schemas.length === 0) {
      return { type: 'unknown', nullable: true };
    }
    
    if (schemas.length === 1) {
      return schemas[0];
    }
    
    // Find common type
    const types = new Set(schemas.map(s => s.type));
    const commonType = types.size === 1 ? schemas[0].type : 'any';
    
    const merged: JsonSchema = {
      type: commonType,
      nullable: schemas.some(s => s.nullable)
    };
    
    // Merge properties for object types
    if (commonType === 'object') {
      const allProperties = new Map<string, JsonSchema[]>();
      
      for (const schema of schemas) {
        if (schema.properties) {
          for (const [prop, propSchema] of schema.properties) {
            if (!allProperties.has(prop)) {
              allProperties.set(prop, []);
            }
            allProperties.get(prop)!.push(propSchema);
          }
        }
      }
      
      merged.properties = new Map();
      for (const [prop, propSchemas] of allProperties) {
        merged.properties.set(prop, this.mergeSchemas(propSchemas));
      }
    }
    
    return merged;
  }

  /**
   * Read JSON with streaming and optimization
   */
  private async readWithOptimization(
    filePath: string,
    options: JsonReadOptions,
    structure: any
  ): Promise<any[]> {
    return this.memoryOptimizer.withOptimization(async () => {
      if (this.options.enableStreaming && structure.estimatedSize > this.options.memoryLimitMB * 1024 * 1024) {
        return this.readWithStreaming(filePath, options, structure);
      } else {
        return this.readWithBuffering(filePath, options);
      }
    });
  }

  /**
   * Read JSON with streaming for large files
   */
  private async readWithStreaming(
    filePath: string,
    options: JsonReadOptions,
    structure: any
  ): Promise<any[]> {
    const fs = await import('fs');
    const results: any[] = [];
    
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      let buffer = '';
      let recordCount = 0;
      let inArray = false;
      let braceDepth = 0;
      let currentRecord = '';
      
      stream.on('data', (chunk: string) => {
        buffer += chunk;
        
        try {
          const processed = this.processStreamBuffer(
            buffer,
            options,
            structure,
            results,
            { recordCount, inArray, braceDepth, currentRecord }
          );
          
          buffer = processed.remainingBuffer;
          recordCount = processed.recordCount;
          inArray = processed.inArray;
          braceDepth = processed.braceDepth;
          currentRecord = processed.currentRecord;
          
          // Check memory pressure
          if (recordCount % this.options.arrayBatchSize === 0) {
            this.checkMemoryPressureSync();
          }
          
          // Stop if max records reached
          if (options.maxRecords && recordCount >= options.maxRecords) {
            stream.destroy();
          }
          
        } catch (error) {
          stream.destroy();
          reject(error);
        }
      });
      
      stream.on('end', () => {
        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            this.processRemainingBuffer(buffer, options, results);
          } catch (error) {
            logger.warn('Error processing remaining buffer', {
              component: 'JsonOptimizer',
              error: (error as Error).message
            });
          }
        }
        
        resolve(results);
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Process streaming buffer for JSON parsing
   */
  private processStreamBuffer(
    buffer: string,
    options: JsonReadOptions,
    structure: any,
    results: any[],
    state: any
  ): any {
    let { recordCount, inArray, braceDepth, currentRecord } = state;
    let position = 0;
    
    while (position < buffer.length) {
      const char = buffer[position];
      
      if (char === '[' && !inArray && braceDepth === 0) {
        inArray = true;
        position++;
        continue;
      }
      
      if (char === '{') {
        braceDepth++;
        currentRecord += char;
      } else if (char === '}') {
        braceDepth--;
        currentRecord += char;
        
        if (braceDepth === 0 && currentRecord.trim()) {
          // Complete record found
          try {
            const record = JSON.parse(currentRecord);
            const processedRecord = this.processRecord(record, options);
            
            if (processedRecord !== null) {
              results.push(processedRecord);
              recordCount++;
            }
            
          } catch (error) {
            if (!options.skipInvalidRecords) {
              throw error;
            }
            this.metrics.validationErrors++;
          }
          
          currentRecord = '';
        }
      } else if (braceDepth > 0) {
        currentRecord += char;
      }
      
      position++;
    }
    
    // Calculate remaining buffer
    const lastCompleteRecord = buffer.lastIndexOf('}');
    const remainingBuffer = lastCompleteRecord >= 0 ? buffer.substring(lastCompleteRecord + 1) : buffer;
    
    return {
      remainingBuffer,
      recordCount,
      inArray,
      braceDepth,
      currentRecord
    };
  }

  /**
   * Read JSON with buffering for smaller files
   */
  private async readWithBuffering(filePath: string, options: JsonReadOptions): Promise<any[]> {
    const fs = await import('fs');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    try {
      const data = JSON.parse(content);
      const results: any[] = [];
      
      if (Array.isArray(data)) {
        const startIndex = options.startRecord || 0;
        const endIndex = options.maxRecords ? startIndex + options.maxRecords : data.length;
        
        for (let i = startIndex; i < Math.min(endIndex, data.length); i++) {
          const processedRecord = this.processRecord(data[i], options);
          if (processedRecord !== null) {
            results.push(processedRecord);
          }
          
          this.metrics.recordsProcessed++;
          
          // Memory check every batch
          if (i % this.options.arrayBatchSize === 0) {
            await this.checkMemoryPressure();
          }
        }
      } else {
        const processedRecord = this.processRecord(data, options);
        if (processedRecord !== null) {
          results.push(processedRecord);
        }
        this.metrics.recordsProcessed++;
      }
      
      return results;
      
    } catch (error) {
      throw new DataPilotError(
        `Failed to parse JSON file: ${(error as Error).message}`,
        'JSON_PARSE_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING
      );
    }
  }

  /**
   * Process individual record with validation and transformation
   */
  private processRecord(record: any, options: JsonReadOptions): any | null {
    try {
      // Validate against schema if enabled
      if (this.options.enableSchemaValidation && this.detectedSchema && options.validateSchema) {
        const validation = this.validateRecord(record, this.detectedSchema);
        if (!validation.isValid && !options.skipInvalidRecords) {
          throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
        }
        if (!validation.isValid) {
          this.metrics.validationErrors++;
          return null;
        }
      }
      
      // Apply field selection
      if (options.selectFields && options.selectFields.length > 0) {
        const filtered: any = {};
        for (const field of options.selectFields) {
          if (this.hasNestedProperty(record, field)) {
            this.setNestedProperty(filtered, field, this.getNestedProperty(record, field));
          }
        }
        record = filtered;
      }
      
      // Apply transformations
      if (options.transformers && options.transformers.size > 0) {
        for (const [field, transformer] of options.transformers) {
          if (this.hasNestedProperty(record, field)) {
            const value = this.getNestedProperty(record, field);
            const transformed = transformer(value);
            this.setNestedProperty(record, field, transformed);
          }
        }
      }
      
      // Apply type coercion if enabled
      if (this.options.enableTypeCoercion && options.enforceTypes && this.detectedSchema) {
        record = this.coerceTypes(record, this.detectedSchema);
      }
      
      return record;
      
    } catch (error) {
      if (options.skipInvalidRecords) {
        this.metrics.validationErrors++;
        return null;
      }
      throw error;
    }
  }

  /**
   * Validate record against schema
   */
  private validateRecord(record: any, schema: JsonSchema): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      this.validateValue(record, schema, '', errors, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        record
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${(error as Error).message}`],
        warnings,
        record
      };
    }
  }

  /**
   * Validate individual value against schema
   */
  private validateValue(
    value: any,
    schema: JsonSchema,
    path: string,
    errors: string[],
    warnings: string[]
  ): void {
    // Check nullability
    if (value === null || value === undefined) {
      if (!schema.nullable) {
        errors.push(`${path}: null value not allowed`);
      }
      return;
    }
    
    // Check type
    const actualType = this.getDataType(value);
    if (schema.type !== 'any' && schema.type !== actualType) {
      errors.push(`${path}: expected ${schema.type}, got ${actualType}`);
      return;
    }
    
    // Type-specific validation
    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${path}: string too short (min: ${schema.minLength})`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${path}: string too long (max: ${schema.maxLength})`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${path}: string does not match pattern`);
      }
    }
    
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path}: value below minimum (${schema.minimum})`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path}: value above maximum (${schema.maximum})`);
      }
    }
    
    // Validate object properties
    if (schema.type === 'object' && schema.properties) {
      for (const [prop, propSchema] of schema.properties) {
        const propPath = path ? `${path}.${prop}` : prop;
        
        if (value.hasOwnProperty(prop)) {
          this.validateValue(value[prop], propSchema, propPath, errors, warnings);
        } else if (schema.required && schema.required.includes(prop)) {
          errors.push(`${propPath}: required property missing`);
        }
      }
    }
    
    // Validate array items
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        this.validateValue(value[i], schema.items, `${path}[${i}]`, errors, warnings);
      }
    }
  }

  /**
   * Coerce types according to schema
   */
  private coerceTypes(record: any, schema: JsonSchema): any {
    if (schema.type === 'object' && schema.properties && typeof record === 'object') {
      const coerced: any = {};
      
      for (const [prop, propSchema] of schema.properties) {
        if (record.hasOwnProperty(prop)) {
          coerced[prop] = this.coerceValue(record[prop], propSchema);
        }
      }
      
      return coerced;
    }
    
    return this.coerceValue(record, schema);
  }

  /**
   * Coerce individual value to schema type
   */
  private coerceValue(value: any, schema: JsonSchema): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    try {
      switch (schema.type) {
        case 'string':
          return String(value);
          
        case 'number':
          const num = Number(value);
          return isNaN(num) ? value : num;
          
        case 'integer':
          const int = parseInt(String(value), 10);
          return isNaN(int) ? value : int;
          
        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (lower === 'true' || lower === 'yes' || lower === '1') return true;
            if (lower === 'false' || lower === 'no' || lower === '0') return false;
          }
          return Boolean(value);
          
        case 'date':
          if (value instanceof Date) return value;
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date;
          
        default:
          return value;
      }
    } catch (error) {
      return value; // Return original value if coercion fails
    }
  }

  /**
   * Utility functions for nested property access
   */
  private hasNestedProperty(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || !current.hasOwnProperty(part)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    // Validate all path parts to prevent prototype pollution
    for (const part of parts) {
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        throw new DataPilotError(
          `Prototype pollution attempt detected in property path: ${path}`,
          'PROTOTYPE_POLLUTION_DETECTED',
          ErrorSeverity.HIGH,
          ErrorCategory.SECURITY
        );
      }
    }
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    const finalKey = parts[parts.length - 1];
    // Final assignment is now safe since we've validated all path parts
    current[finalKey] = value;
  }

  /**
   * Helper functions for analysis
   */
  private async readFileSample(filePath: string, sampleSize: number): Promise<string> {
    const fs = await import('fs');
    const fd = await fs.promises.open(filePath, 'r');
    
    try {
      const buffer = Buffer.alloc(sampleSize);
      const { bytesRead } = await fd.read(buffer, 0, sampleSize, 0);
      return buffer.slice(0, bytesRead).toString('utf8');
    } finally {
      await fd.close();
    }
  }

  private async getSampleData(filePath: string, maxRecords: number): Promise<any> {
    const sample = await this.readFileSample(filePath, 1024 * 1024); // 1MB
    
    try {
      const data = JSON.parse(sample);
      
      if (Array.isArray(data)) {
        return data.slice(0, maxRecords);
      }
      
      return data;
    } catch (error) {
      // Try to extract partial array from truncated JSON
      const matches = sample.match(/\[.*$/);
      if (matches) {
        try {
          const partialArray = JSON.parse(matches[0] + ']');
          return partialArray.slice(0, maxRecords);
        } catch (e) {
          // Fallback to empty array
          return [];
        }
      }
      
      throw error;
    }
  }

  private estimateJsonSize(filePath: string): number {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  private calculateComplexity(data: any, depth = 0): number {
    if (depth > this.options.maxNestingDepth) {
      return 0;
    }
    
    if (Array.isArray(data)) {
      return data.length + data.reduce((sum, item) => sum + this.calculateComplexity(item, depth + 1), 0);
    }
    
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      return keys.length + keys.reduce((sum, key) => sum + this.calculateComplexity(data[key], depth + 1), 0);
    }
    
    return 1;
  }

  private hasNestedStructures(data: any, depth = 0): boolean {
    if (depth > 2) return true;
    
    if (Array.isArray(data)) {
      return data.some(item => this.hasNestedStructures(item, depth + 1));
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => this.hasNestedStructures(value, depth + 1));
    }
    
    return false;
  }

  private analyzeArrayTypes(array: any[]): Map<string, number> {
    const types = new Map<string, number>();
    
    for (const item of array) {
      const type = this.getDataType(item);
      types.set(type, (types.get(type) || 0) + 1);
    }
    
    return types;
  }

  private isDateString(str: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO 8601
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/
    ];
    
    return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
  }

  private isEmailString(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  private isUrlString(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  private processRemainingBuffer(buffer: string, options: JsonReadOptions, results: any[]): void {
    const trimmed = buffer.trim();
    if (!trimmed) return;
    
    try {
      // Try to parse as complete JSON
      const data = JSON.parse(trimmed);
      const processed = this.processRecord(data, options);
      if (processed !== null) {
        results.push(processed);
      }
    } catch (error) {
      // Try to extract valid JSON objects
      const objects = trimmed.split('\n').filter(line => line.trim());
      for (const line of objects) {
        try {
          const data = JSON.parse(line);
          const processed = this.processRecord(data, options);
          if (processed !== null) {
            results.push(processed);
          }
        } catch (e) {
          // Skip invalid lines
        }
      }
    }
  }

  /**
   * Check memory pressure and optimize if needed
   */
  private async checkMemoryPressure(): Promise<void> {
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    
    if (memoryStats.pressure.level > 0.8) {
      logger.warn('High memory pressure during JSON processing', {
        component: 'JsonOptimizer',
        pressure: memoryStats.pressure.level
      });
      
      // Clear caches if memory pressure is high
      if (memoryStats.pressure.level > 0.9) {
        this.schemaStatistics.clear();
        this.compressionBuffer = [];
        logger.debug('Cleared JSON optimizer caches due to memory pressure');
      }
      
      // Force garbage collection
      this.memoryOptimizer.forceGarbageCollection();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update peak memory
    const currentMemoryMB = process.memoryUsage().heapUsed / (1024 * 1024);
    if (currentMemoryMB > this.metrics.memoryPeakMB) {
      this.metrics.memoryPeakMB = currentMemoryMB;
    }
  }

  private checkMemoryPressureSync(): void {
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    
    if (memoryStats.pressure.level > 0.9) {
      this.schemaStatistics.clear();
      this.compressionBuffer = [];
      this.memoryOptimizer.forceGarbageCollection();
    }
  }

  /**
   * Validate inputs
   */
  private async validateInputs(filePath: string, options: JsonReadOptions): Promise<void> {
    if (!filePath || typeof filePath !== 'string') {
      throw new DataPilotError(
        'Invalid file path provided',
        'INVALID_INPUT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );
    }
    
    if (!filePath.match(/\.json$/i)) {
      throw new DataPilotError(
        'File must be a valid JSON format (.json)',
        'INVALID_FILE_FORMAT',
        ErrorSeverity.HIGH,
        ErrorCategory.VALIDATION
      );
    }
    
    if (options.maxRecords !== undefined && options.maxRecords < 1) {
      throw new DataPilotError(
        'Max records must be positive',
        'INVALID_MAX_RECORDS',
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(totalRecords: number, processingTime: number): void {
    this.metrics.totalProcessingTime += processingTime;
    
    if (totalRecords > 0 && processingTime > 0) {
      this.metrics.averageRecordProcessingTime = processingTime / totalRecords;
    }
    
    // Calculate schema consistency
    if (this.detectedSchema) {
      this.metrics.schemaConsistency = 1 - (this.metrics.validationErrors / Math.max(1, this.metrics.recordsProcessed));
    }
    
    // Update streaming efficiency
    const memoryStats = this.memoryOptimizer.getDetailedStats();
    this.metrics.streamingEfficiency = 1 - memoryStats.pressure.level;
    
    this.metrics.schemasDetected = this.detectedSchema ? 1 : 0;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): JsonMetrics {
    return {
      recordsProcessed: 0,
      schemasDetected: 0,
      validationErrors: 0,
      compressionRatio: 1.0,
      streamingEfficiency: 1.0,
      memoryPeakMB: 0,
      totalProcessingTime: 0,
      averageRecordProcessingTime: 0,
      schemaConsistency: 1.0
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): JsonMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detected schema
   */
  getDetectedSchema(): JsonSchema | null {
    return this.detectedSchema;
  }

  /**
   * Reset optimizer state
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.detectedSchema = null;
    this.schemaStatistics.clear();
    this.compressionBuffer = [];
    
    logger.debug('JSON optimizer reset', {
      component: 'JsonOptimizer'
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.schemaStatistics.clear();
    this.compressionBuffer = [];
    this.detectedSchema = null;
    
    logger.info('JSON optimizer shutdown', {
      component: 'JsonOptimizer'
    });
  }
}

/**
 * Global JSON optimizer instance
 */
let globalJsonOptimizer: JsonOptimizer | null = null;

/**
 * Get or create global JSON optimizer
 */
export function getGlobalJsonOptimizer(options?: JsonOptimizationOptions): JsonOptimizer {
  if (!globalJsonOptimizer) {
    globalJsonOptimizer = new JsonOptimizer(options);
  }
  return globalJsonOptimizer;
}

/**
 * Shutdown global JSON optimizer
 */
export async function shutdownGlobalJsonOptimizer(): Promise<void> {
  if (globalJsonOptimizer) {
    await globalJsonOptimizer.shutdown();
    globalJsonOptimizer = null;
  }
}