# 🔧 DataPilot Multi-Format Technical Implementation Design

## 🏗️ Abstract Parser Interface Design

### Core Interface Definition

```typescript
// src/parsers/base/data-parser.ts
export interface DataParser {
  /**
   * Parse file and return async iterator of rows
   * Maintains streaming capability for large files
   */
  parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow>;
  
  /**
   * Detect file format and extract metadata
   */
  detect(filePath: string): Promise<FormatDetectionResult>;
  
  /**
   * Get parsing statistics
   */
  getStats(): ParserStats;
  
  /**
   * Abort parsing operation
   */
  abort(): void;
  
  /**
   * Validate file can be parsed
   */
  validate(filePath: string): Promise<ValidationResult>;
}

// Universal parse options that all formats can implement
export interface ParseOptions {
  // Common options
  maxRows?: number;
  encoding?: BufferEncoding;
  chunkSize?: number;
  
  // Format-specific options (discriminated union)
  format?: 'csv' | 'json' | 'excel' | 'parquet' | 'tsv';
  
  // CSV-specific
  delimiter?: string;
  quote?: string;
  hasHeader?: boolean;
  
  // JSON-specific
  jsonPath?: string;
  arrayMode?: 'records' | 'values';
  
  // Excel-specific
  sheetName?: string;
  sheetIndex?: number;
  
  // Parquet-specific
  columns?: string[];
}

export interface FormatDetectionResult {
  format: string;
  confidence: number;
  metadata: Record<string, any>;
  encoding?: BufferEncoding;
  estimatedRows?: number;
  estimatedColumns?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}
```

### Parser Registry System

```typescript
// src/parsers/base/parser-registry.ts
export class ParserRegistry {
  private parsers = new Map<string, () => DataParser>();
  private detectors = new Map<string, FormatDetector>();

  /**
   * Register a parser for a specific format
   */
  register(
    format: string, 
    parserFactory: () => DataParser,
    detector: FormatDetector
  ): void {
    this.parsers.set(format, parserFactory);
    this.detectors.set(format, detector);
  }

  /**
   * Auto-detect format and return appropriate parser
   */
  async getParser(filePath: string): Promise<{
    parser: DataParser;
    format: string;
    detection: FormatDetectionResult;
  }> {
    // 1. Try file extension first
    const extension = path.extname(filePath).toLowerCase();
    const formatByExtension = this.getFormatByExtension(extension);
    
    // 2. Validate with content detection
    for (const [format, detector] of this.detectors) {
      const detection = await detector.detect(filePath);
      if (detection.confidence > 0.8) {
        const parser = this.parsers.get(format)!();
        return { parser, format, detection };
      }
    }
    
    // 3. Fallback or error
    throw new DataPilotError(
      `Unsupported file format: ${extension}`,
      ErrorSeverity.HIGH,
      ErrorCategory.VALIDATION
    );
  }

  getSupportedFormats(): string[] {
    return Array.from(this.parsers.keys());
  }
}
```

### Format Detection System

```typescript
// src/parsers/base/format-detector.ts
export interface FormatDetector {
  detect(filePath: string): Promise<FormatDetectionResult>;
}

export class JSONDetector implements FormatDetector {
  async detect(filePath: string): Promise<FormatDetectionResult> {
    const sample = await this.readSample(filePath, 1024);
    
    try {
      // Try parsing as JSON
      const parsed = JSON.parse(sample);
      
      return {
        format: 'json',
        confidence: 0.95,
        metadata: {
          type: Array.isArray(parsed) ? 'array' : 'object',
          keys: Array.isArray(parsed) ? [] : Object.keys(parsed),
          estimatedRecords: Array.isArray(parsed) ? parsed.length : 1
        }
      };
    } catch (error) {
      // Try JSONL (line-delimited JSON)
      const lines = sample.split('\n').filter(l => l.trim());
      let validLines = 0;
      
      for (const line of lines.slice(0, 10)) {
        try {
          JSON.parse(line);
          validLines++;
        } catch {
          // Invalid JSON line
        }
      }
      
      if (validLines / lines.length > 0.8) {
        return {
          format: 'json',
          confidence: 0.9,
          metadata: {
            type: 'jsonl',
            estimatedRecords: lines.length
          }
        };
      }
      
      return { format: 'json', confidence: 0, metadata: {} };
    }
  }
}

export class ExcelDetector implements FormatDetector {
  async detect(filePath: string): Promise<FormatDetectionResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!['.xlsx', '.xls', '.xlsm'].includes(ext)) {
      return { format: 'excel', confidence: 0, metadata: {} };
    }
    
    // Read Excel metadata without parsing full file
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      return {
        format: 'excel',
        confidence: 0.95,
        metadata: {
          sheets: workbook.worksheets.map(ws => ({
            name: ws.name,
            rowCount: ws.rowCount,
            columnCount: ws.columnCount
          }))
        }
      };
    } catch (error) {
      return { format: 'excel', confidence: 0, metadata: {} };
    }
  }
}
```

## 📊 Format-Specific Parser Implementations

### JSON Parser Implementation

```typescript
// src/parsers/json-parser.ts
export class JSONParser implements DataParser {
  private stats: ParserStats;
  private aborted = false;

  constructor(private options: ParseOptions = {}) {
    this.stats = {
      bytesProcessed: 0,
      rowsProcessed: 0,
      errors: [],
      startTime: Date.now(),
    };
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(fileData);
      
      if (Array.isArray(parsed)) {
        // Handle JSON array
        yield* this.parseJSONArray(parsed, mergedOptions);
      } else {
        // Handle single JSON object or JSONL
        if (this.isJSONL(fileData)) {
          yield* this.parseJSONL(fileData, mergedOptions);
        } else {
          yield* this.parseJSONObject(parsed, mergedOptions);
        }
      }
    } catch (error) {
      throw new DataPilotError(
        `JSON parsing failed: ${error.message}`,
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING
      );
    }
  }

  private async *parseJSONArray(
    array: any[], 
    options: ParseOptions
  ): AsyncIterableIterator<ParsedRow> {
    const maxRows = options.maxRows || Infinity;
    
    for (let i = 0; i < Math.min(array.length, maxRows); i++) {
      if (this.aborted) break;
      
      const item = array[i];
      const flattened = this.flattenObject(item);
      
      yield {
        index: i,
        data: Object.values(flattened).map(v => String(v)),
        raw: JSON.stringify(item)
      };
      
      this.stats.rowsProcessed++;
    }
  }

  private async *parseJSONL(
    content: string, 
    options: ParseOptions
  ): AsyncIterableIterator<ParsedRow> {
    const lines = content.split('\n').filter(l => l.trim());
    const maxRows = options.maxRows || Infinity;
    
    for (let i = 0; i < Math.min(lines.length, maxRows); i++) {
      if (this.aborted) break;
      
      try {
        const item = JSON.parse(lines[i]);
        const flattened = this.flattenObject(item);
        
        yield {
          index: i,
          data: Object.values(flattened).map(v => String(v)),
          raw: lines[i]
        };
        
        this.stats.rowsProcessed++;
      } catch (error) {
        this.stats.errors.push({
          row: i,
          message: `Invalid JSON line: ${error.message}`,
          code: 'INVALID_JSON'
        });
      }
    }
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    return new JSONDetector().detect(filePath);
  }

  getStats(): ParserStats {
    return { ...this.stats, endTime: Date.now() };
  }

  abort(): void {
    this.aborted = true;
  }

  async validate(filePath: string): Promise<ValidationResult> {
    try {
      const detection = await this.detect(filePath);
      return {
        valid: detection.confidence > 0.8,
        errors: detection.confidence > 0.8 ? [] : ['Not a valid JSON file'],
        warnings: [],
        canProceed: detection.confidence > 0.5
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        canProceed: false
      };
    }
  }
}
```

### Excel Parser Implementation

```typescript
// src/parsers/excel-parser.ts
import * as ExcelJS from 'exceljs';

export class ExcelParser implements DataParser {
  private stats: ParserStats;
  private aborted = false;

  constructor(private options: ParseOptions = {}) {
    this.stats = {
      bytesProcessed: 0,
      rowsProcessed: 0,
      errors: [],
      startTime: Date.now(),
    };
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      // Select worksheet
      const worksheet = this.selectWorksheet(workbook, mergedOptions);
      
      if (!worksheet) {
        throw new DataPilotError(
          'No valid worksheet found',
          ErrorSeverity.HIGH,
          ErrorCategory.PARSING
        );
      }

      yield* this.parseWorksheet(worksheet, mergedOptions);
      
    } catch (error) {
      throw new DataPilotError(
        `Excel parsing failed: ${error.message}`,
        ErrorSeverity.HIGH,
        ErrorCategory.PARSING
      );
    }
  }

  private selectWorksheet(
    workbook: ExcelJS.Workbook, 
    options: ParseOptions
  ): ExcelJS.Worksheet | null {
    if (options.sheetName) {
      return workbook.getWorksheet(options.sheetName);
    }
    
    if (options.sheetIndex !== undefined) {
      return workbook.getWorksheet(options.sheetIndex + 1); // 1-based
    }
    
    // Default to first worksheet with data
    return workbook.worksheets.find(ws => ws.rowCount > 0) || null;
  }

  private async *parseWorksheet(
    worksheet: ExcelJS.Worksheet,
    options: ParseOptions
  ): AsyncIterableIterator<ParsedRow> {
    const maxRows = options.maxRows || worksheet.rowCount;
    let rowIndex = 0;
    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (this.aborted || rowIndex >= maxRows) return;
      
      const values = row.values as any[];
      // Skip the first element (it's undefined in ExcelJS)
      const data = values.slice(1).map(cell => {
        if (cell && typeof cell === 'object' && 'text' in cell) {
          return cell.text; // Handle rich text
        }
        return String(cell || '');
      });
      
      return {
        index: rowIndex++,
        data,
        raw: values.slice(1).join('\t')
      };
    });
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    return new ExcelDetector().detect(filePath);
  }

  getStats(): ParserStats {
    return { ...this.stats, endTime: Date.now() };
  }

  abort(): void {
    this.aborted = true;
  }

  async validate(filePath: string): Promise<ValidationResult> {
    try {
      const detection = await this.detect(filePath);
      return {
        valid: detection.confidence > 0.8,
        errors: detection.confidence > 0.8 ? [] : ['Not a valid Excel file'],
        warnings: [],
        canProceed: detection.confidence > 0.5
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        canProceed: false
      };
    }
  }
}
```

## 🔧 CLI Integration Refactoring

### Universal Parser Integration

```typescript
// src/cli/universal-analyzer.ts
export class UniversalAnalyzer {
  private registry: ParserRegistry;

  constructor() {
    this.registry = new ParserRegistry();
    this.initializeParsers();
  }

  private initializeParsers(): void {
    // Register all available parsers
    this.registry.register(
      'csv',
      () => new CSVParserAdapter(), // Wrap existing parser
      new CSVDetector()
    );
    
    this.registry.register(
      'json',
      () => new JSONParser(),
      new JSONDetector()
    );
    
    this.registry.register(
      'excel',
      () => new ExcelParser(),
      new ExcelDetector()
    );
    
    this.registry.register(
      'tsv',
      () => new TSVParser(),
      new TSVDetector()
    );
  }

  async analyzeFile(filePath: string, options: CLIOptions): Promise<AnalysisResult> {
    try {
      // 1. Auto-detect format and get parser
      const { parser, format, detection } = await this.registry.getParser(filePath);
      
      logger.info(`Detected format: ${format} (confidence: ${detection.confidence})`);
      
      // 2. Validate file can be parsed
      const validation = await parser.validate(filePath);
      if (!validation.canProceed) {
        throw new DataPilotError(
          `Cannot parse file: ${validation.errors.join(', ')}`,
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION
        );
      }
      
      // 3. Parse and analyze (same pipeline regardless of format)
      return await this.runAnalysisPipeline(parser, filePath, options, format);
      
    } catch (error) {
      throw new DataPilotError(
        `Analysis failed: ${error.message}`,
        ErrorSeverity.HIGH,
        ErrorCategory.ANALYSIS
      );
    }
  }

  private async runAnalysisPipeline(
    parser: DataParser,
    filePath: string,
    options: CLIOptions,
    format: string
  ): Promise<AnalysisResult> {
    // Convert to common data structure for analysis
    const rows: string[][] = [];
    let headers: string[] = [];
    
    for await (const row of parser.parse(filePath, options)) {
      if (row.index === 0) {
        headers = row.data; // First row as headers
      } else {
        rows.push(row.data);
      }
    }
    
    // Create dataset object for analyzers
    const dataset = {
      headers,
      rows,
      metadata: {
        format,
        filePath,
        totalRows: rows.length,
        ...parser.getStats()
      }
    };
    
    // Run existing 6-section analysis pipeline
    return await this.runSixSectionAnalysis(dataset, options);
  }
}
```

### Updated CLI Commands

```typescript
// src/cli/index.ts - Updated command handling
async function runUniversalAnalysis(
  command: string,
  filePath: string,
  options: CLIOptions
): Promise<CLIResult> {
  const analyzer = new UniversalAnalyzer();
  
  try {
    // Show supported formats if file not found
    if (!fs.existsSync(filePath)) {
      const formats = analyzer.getSupportedFormats();
      throw new FileError(
        `File not found: ${filePath}\nSupported formats: ${formats.join(', ')}`
      );
    }
    
    // Run analysis with new universal system
    const result = await analyzer.analyzeFile(filePath, options);
    
    return {
      success: true,
      data: result,
      format: options.format || 'markdown',
      metadata: {
        command,
        filePath,
        timestamp: new Date().toISOString(),
        version: '1.1.0' // Bump for multi-format support
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestions: [
        `Check if file format is supported: ${analyzer.getSupportedFormats().join(', ')}`,
        'Try specifying format explicitly: --format csv',
        'Use --help for more information'
      ]
    };
  }
}
```

## 🎯 Backwards Compatibility Strategy

### CSV Parser Adapter

```typescript
// src/parsers/adapters/csv-parser-adapter.ts
export class CSVParserAdapter implements DataParser {
  private csvParser: CSVParser;
  
  constructor(options: ParseOptions = {}) {
    // Convert universal options to CSV-specific options
    const csvOptions: CSVParserOptions = {
      delimiter: options.delimiter || ',',
      quote: options.quote || '"',
      hasHeader: options.hasHeader ?? true,
      maxRows: options.maxRows,
      // ... other mappings
    };
    
    this.csvParser = new CSVParser(csvOptions);
  }

  async *parse(filePath: string, options?: ParseOptions): AsyncIterableIterator<ParsedRow> {
    // Delegate to existing CSV parser
    yield* this.csvParser.parse(filePath);
  }

  async detect(filePath: string): Promise<FormatDetectionResult> {
    const detector = new CSVDetector();
    const csvFormat = await detector.detect(filePath);
    
    return {
      format: 'csv',
      confidence: csvFormat.delimiterConfidence,
      metadata: csvFormat
    };
  }

  getStats(): ParserStats {
    return this.csvParser.getStats();
  }

  abort(): void {
    this.csvParser.abort();
  }

  async validate(filePath: string): Promise<ValidationResult> {
    // Use existing CSV validation logic
    return this.csvParser.validate(filePath);
  }
}
```

This technical design ensures:
- ✅ **Zero Breaking Changes** for existing CSV functionality
- ✅ **Seamless Extension** to new formats
- ✅ **Maintained Performance** with streaming architecture
- ✅ **Consistent User Experience** across all formats
- ✅ **Easy Testing** with clear interfaces
- ✅ **Future Extensibility** with plugin architecture