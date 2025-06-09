/**
 * Section 1: Dataset Overview - Type Definitions
 * Comprehensive interfaces matching section1.md specification
 */
export interface FileMetadata {
    originalFilename: string;
    fullResolvedPath: string;
    fileSizeBytes: number;
    fileSizeMB: number;
    mimeType: string;
    lastModified: Date;
    sha256Hash: string;
}
export interface EncodingDetection {
    encoding: BufferEncoding;
    detectionMethod: string;
    confidence: number;
    bomDetected: boolean;
    bomType?: string;
}
export interface DelimiterDetection {
    delimiter: string;
    detectionMethod: string;
    confidence: number;
    alternativesConsidered: Array<{
        delimiter: string;
        score: number;
    }>;
}
export interface ParsingMetadata {
    dataSourceType: 'Local File System';
    parsingEngine: string;
    parsingTimeSeconds: number;
    encoding: EncodingDetection;
    delimiter: DelimiterDetection;
    lineEnding: 'LF' | 'CRLF';
    quotingCharacter: string;
    emptyLinesEncountered: number;
    headerProcessing: {
        headerPresence: 'Detected' | 'Not Detected' | 'Uncertain';
        headerRowNumbers: number[];
        columnNamesSource: string;
    };
    initialScanLimit: {
        method: string;
        linesScanned: number;
        bytesScanned: number;
    };
}
export interface ColumnInventory {
    index: number;
    name: string;
    originalIndex: number;
}
export interface StructuralDimensions {
    totalRowsRead: number;
    totalDataRows: number;
    totalColumns: number;
    totalDataCells: number;
    columnInventory: ColumnInventory[];
    estimatedInMemorySizeMB: number;
    averageRowLengthBytes: number;
    sparsityAnalysis: {
        sparsityPercentage: number;
        method: string;
        sampleSize: number;
        description: string;
    };
}
export interface SystemEnvironment {
    operatingSystem: string;
    systemArchitecture: string;
    executionRuntime: string;
    availableCpuCores: number;
    availableMemoryGB: number;
    nodeVersion: string;
}
export interface ExecutionContext {
    fullCommandExecuted: string;
    analysisMode: string;
    analysisStartTimestamp: Date;
    globalSamplingStrategy: string;
    activatedModules: string[];
    processingTimeSeconds: number;
    hostEnvironment?: SystemEnvironment;
}
export interface Section1Overview {
    fileDetails: FileMetadata;
    parsingMetadata: ParsingMetadata;
    structuralDimensions: StructuralDimensions;
    executionContext: ExecutionContext;
    generatedAt: Date;
    version: string;
}
export interface Section1Config {
    includeHostEnvironment: boolean;
    enableFileHashing: boolean;
    maxSampleSizeForSparsity: number;
    privacyMode: 'full' | 'redacted' | 'minimal';
    detailedProfiling: boolean;
}
export interface Section1Progress {
    phase: 'file-analysis' | 'parsing' | 'structural-analysis' | 'report-generation';
    progress: number;
    currentOperation: string;
    timeElapsed: number;
    estimatedTimeRemaining?: number;
}
export interface Section1Warning {
    category: 'file' | 'parsing' | 'structural' | 'environment';
    severity: 'low' | 'medium' | 'high';
    message: string;
    impact?: string;
    suggestion?: string;
}
export interface Section1Result {
    overview: Section1Overview;
    warnings: Section1Warning[];
    performanceMetrics: {
        totalAnalysisTime: number;
        peakMemoryUsage?: number;
        phases: Record<string, number>;
    };
}
//# sourceMappingURL=types.d.ts.map