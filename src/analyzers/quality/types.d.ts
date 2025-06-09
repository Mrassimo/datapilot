/**
 * Section 2: Data Quality & Integrity Audit - Type Definitions
 * Comprehensive interfaces matching section2.md specification
 */
export interface DataQualityScore {
    score: number;
    interpretation: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
    details?: string;
}
export interface DataQualityStrength {
    description: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
}
export interface DataQualityWeakness {
    description: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    priority: number;
    estimatedEffort?: string;
}
export interface TechnicalDebt {
    timeEstimate: string;
    complexityLevel: 'Low' | 'Medium' | 'High';
    primaryDebtContributors: string[];
    automatedCleaningPotential: {
        fixableIssues: number;
        examples: string[];
    };
}
export interface DataQualityCockpit {
    compositeScore: DataQualityScore;
    dimensionScores: {
        completeness: DataQualityScore;
        accuracy: DataQualityScore;
        consistency: DataQualityScore;
        timeliness: DataQualityScore;
        uniqueness: DataQualityScore;
        validity: DataQualityScore;
        integrity: DataQualityScore;
        reasonableness: DataQualityScore;
        precision: DataQualityScore;
        representational: DataQualityScore;
    };
    topStrengths: DataQualityStrength[];
    topWeaknesses: DataQualityWeakness[];
    technicalDebt: TechnicalDebt;
}
export interface MissingnessPattern {
    type: 'MCAR' | 'MAR' | 'MNAR' | 'Unknown';
    description: string;
    correlatedColumns?: string[];
}
export interface ImputationStrategy {
    method: 'Mean' | 'Median' | 'Mode' | 'Regression' | 'ML Model' | 'None' | 'Domain Input Required';
    rationale: string;
    confidence: number;
}
export interface ColumnCompleteness {
    columnName: string;
    missingCount: number;
    missingPercentage: number;
    missingnessPattern: MissingnessPattern;
    suggestedImputation: ImputationStrategy;
    sparklineRepresentation?: string;
}
export interface CompletenessAnalysis {
    datasetLevel: {
        overallCompletenessRatio: number;
        totalMissingValues: number;
        rowsWithMissingPercentage: number;
        columnsWithMissingPercentage: number;
        distributionOverview: string;
    };
    columnLevel: ColumnCompleteness[];
    missingDataMatrix: {
        correlations: Array<{
            column1: string;
            column2: string;
            correlation: number;
            description: string;
        }>;
        blockPatterns: string[];
    };
    score: DataQualityScore;
}
export interface ConformityCheck {
    columnName: string;
    standard: string;
    violationsFound: number;
    examples?: string[];
    description: string;
}
export interface CrossFieldValidation {
    ruleId: string;
    description: string;
    violations: number;
    examples?: Array<{
        rowIndex: number;
        values: Record<string, any>;
        issue: string;
    }>;
}
export interface AccuracyAnalysis {
    valueConformity: ConformityCheck[];
    crossFieldValidation: CrossFieldValidation[];
    outlierImpact: {
        percentageErrornousOutliers: number;
        description: string;
    };
    dataSourceLineage?: {
        sources: Array<{
            name: string;
            trustworthiness: 'High' | 'Medium' | 'Low';
            recordCount: number;
        }>;
    };
    patternValidation?: Array<{
        pattern: string;
        patternName: string;
        violations: number;
        violationCount: number;
        description: string;
        affectedColumns: string[];
    }>;
    businessRuleSummary?: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        violationRate: number;
        totalViolations: number;
        criticalViolations: number;
    };
    score: DataQualityScore;
}
export interface IntraRecordConsistency {
    ruleDescription: string;
    violatingRecords: number;
    examples?: Array<{
        rowIndex: number;
        inconsistentValues: Record<string, any>;
        issue: string;
    }>;
}
export interface InterRecordConsistency {
    entityType: string;
    inconsistentEntities: number;
    examples?: Array<{
        entityId: string;
        conflictingValues: Array<{
            column: string;
            value1: any;
            value2: any;
            recordIndices: number[];
        }>;
    }>;
}
export interface FormatConsistency {
    columnName: string;
    analysisType: 'format_standardization' | 'casing_consistency' | 'unit_standardization' | 'boolean_representation';
    currentFormats: Array<{
        format: string;
        count: number;
        percentage: string;
        examples: string[];
    }>;
    recommendedAction: string;
    consistency: {
        isConsistent: boolean;
        dominantFormat: string;
        inconsistencyCount: number;
        inconsistencyPercentage: string;
    };
    score: DataQualityScore;
}
export interface PatternValidation {
    patternName: string;
    description: string;
    affectedColumns: string[];
    violationCount: number;
    examples: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
}
export interface ConsistencyAnalysis {
    intraRecord: IntraRecordConsistency[];
    interRecord: InterRecordConsistency[];
    formatConsistency: FormatConsistency[];
    patternSummary?: {
        totalPatterns: number;
        consistentPatterns: number;
        inconsistentPatterns: number;
        violationRate: number;
        totalViolations: number;
        problematicColumns: string[];
    };
    score: DataQualityScore;
}
export interface TimelinessAnalysis {
    dataFreshness: {
        latestTimestamp?: Date;
        datasetAge?: string;
        staleRecordsPercentage?: number;
        threshold?: string;
    };
    updateFrequency?: {
        averageTimeBetweenUpdates?: number;
        medianTimeBetweenUpdates?: number;
        dormantSegments?: string[];
    };
    score: DataQualityScore;
}
export interface DuplicateRecord {
    rowIndices: number[];
    duplicateType: 'Exact' | 'Semantic';
    confidence?: number;
}
export interface KeyUniqueness {
    columnName: string;
    isPrimaryKey: boolean;
    duplicateCount: number;
    cardinality: number;
    duplicateValues: Array<{
        value: any;
        frequency: number;
    }>;
}
export interface SemanticDuplicate {
    recordPair: [number, number];
    confidence: number;
    method: string;
    similarity: Record<string, number>;
}
export interface UniquenessAnalysis {
    exactDuplicates: {
        count: number;
        percentage: number;
        duplicateGroups: DuplicateRecord[];
    };
    keyUniqueness: KeyUniqueness[];
    columnUniqueness: Array<{
        columnName: string;
        uniquePercentage: number;
        duplicateCount: number;
        mostFrequentDuplicate?: {
            value: any;
            frequency: number;
        };
    }>;
    semanticDuplicates: {
        suspectedPairs: number;
        duplicates: SemanticDuplicate[];
        methods: string[];
    };
    score: DataQualityScore;
}
export interface TypeConformance {
    columnName: string;
    expectedType: string;
    actualType: string;
    confidence: number;
    nonConformingCount: number;
    conformancePercentage: number;
    examples: string[];
    conversionStrategy: string;
}
export interface RangeConformance {
    columnName: string;
    expectedRange: string;
    violationsCount: number;
    outliers: Array<{
        value: any;
        rowIndex: number;
    }>;
}
export interface PatternConformance {
    columnName: string;
    expectedPattern: string;
    violationsCount: number;
    examples: string[];
}
export interface BusinessRule {
    ruleId: string;
    description: string;
    violations: number;
    averageDiscrepancy?: number;
    examples?: Array<{
        rowIndex: number;
        issue: string;
        values: Record<string, any>;
    }>;
}
export interface ValidityAnalysis {
    typeConformance: TypeConformance[];
    rangeConformance: RangeConformance[];
    patternConformance: PatternConformance[];
    businessRules: BusinessRule[];
    fileStructure: {
        consistentColumnCount: boolean;
        headerConformance: boolean;
        deviatingRows?: number;
    };
    score: DataQualityScore;
}
export interface OrphanedRecord {
    parentColumn: string;
    childColumn: string;
    orphanedValues: Array<{
        value: any;
        count: number;
    }>;
}
export interface CardinalityViolation {
    relationship: string;
    expectedCardinality: string;
    violations: number;
    description: string;
}
export interface IntegrityAnalysis {
    orphanedRecords: OrphanedRecord[];
    cardinalityViolations: CardinalityViolation[];
    schemaIntegrity?: {
        typeMatches: boolean;
        requiredColumnsPresent: boolean;
        issues: string[];
    };
    score: DataQualityScore;
}
export interface StatisticalPlausibility {
    columnName: string;
    mean?: number;
    standardDeviation?: number;
    implausibleValues: Array<{
        value: number;
        rowIndex: number;
        standardDeviations: number;
    }>;
    benfordsLaw?: {
        conformanceScore: number;
        deviations: string[];
    };
}
export interface SemanticPlausibility {
    description: string;
    violations: number;
    examples: Array<{
        rowIndex: number;
        issue: string;
        values: Record<string, any>;
    }>;
}
export interface ReasonablenessAnalysis {
    statisticalPlausibility: StatisticalPlausibility[];
    semanticPlausibility: SemanticPlausibility[];
    contextualAnomalies: Array<{
        description: string;
        severity: 'Low' | 'Medium' | 'High';
        affectedRecords: number;
    }>;
    score: DataQualityScore;
}
export interface NumericPrecision {
    columnName: string;
    maxDecimalPlaces: number;
    inconsistentPrecision: boolean;
    examples?: Array<{
        value: number;
        decimalPlaces: number;
    }>;
    expectedPrecision?: number;
}
export interface TemporalGranularity {
    columnName: string;
    granularity: 'Date' | 'Hour' | 'Minute' | 'Second' | 'Millisecond';
    sufficient: boolean;
    recommendation?: string;
}
export interface CategoricalSpecificity {
    columnName: string;
    levelOfDetail: 'Generic' | 'Specific' | 'Very Specific';
    hierarchyLevels: number;
    consistentGranularity: boolean;
    examples: string[];
}
export interface PrecisionAnalysis {
    numericPrecision: NumericPrecision[];
    temporalGranularity: TemporalGranularity[];
    categoricalSpecificity: CategoricalSpecificity[];
    geospatialPrecision?: Array<{
        columnName: string;
        decimalPlaces: number;
        estimatedAccuracy: string;
    }>;
    score: DataQualityScore;
}
export interface UnitStandardization {
    columnName: string;
    standardized: boolean;
    detectedUnits: string[];
    recommendedStandard?: string;
    conversionNeeded: boolean;
}
export interface CodeStandardization {
    columnName: string;
    codeType: 'Abbreviation' | 'Acronym' | 'Numeric Code' | 'Boolean';
    standardized: boolean;
    representations: Array<{
        value: string;
        count: number;
    }>;
    dictionaryAvailable: boolean;
    recommendedStandard?: string;
}
export interface TextFormatting {
    columnName: string;
    issues: Array<{
        type: 'Whitespace' | 'Special Characters' | 'Length' | 'Encoding';
        count: number;
        examples: string[];
    }>;
    recommendations: string[];
}
export interface RepresentationalAnalysis {
    unitStandardization: UnitStandardization[];
    codeStandardization: CodeStandardization[];
    textFormatting: TextFormatting[];
    score: DataQualityScore;
}
export interface ValueLengthAnalysis {
    columnName: string;
    minLength: number;
    maxLength: number;
    averageLength: number;
    medianLength: number;
    standardDeviation: number;
    lengthDistribution: Array<{
        range: string;
        count: number;
        percentage: number;
    }>;
    unusualLengths: Array<{
        length: number;
        count: number;
        examples: string[];
    }>;
}
export interface CharacterSetAnalysis {
    columnName: string;
    predominantCharset: string;
    nonAsciiCount: number;
    encodingIssues: Array<{
        type: string;
        count: number;
        examples: string[];
    }>;
}
export interface SpecialCharacterAnalysis {
    columnName: string;
    leadingTrailingSpaces: number;
    controlCharacters: Array<{
        character: string;
        count: number;
    }>;
    placeholderValues: Array<{
        value: string;
        count: number;
    }>;
}
export interface ProfilingInsights {
    valueLengthAnalysis: ValueLengthAnalysis[];
    characterSetAnalysis: CharacterSetAnalysis[];
    specialCharacterAnalysis: SpecialCharacterAnalysis[];
}
export interface Section2QualityAudit {
    cockpit: DataQualityCockpit;
    completeness: CompletenessAnalysis;
    accuracy: AccuracyAnalysis;
    consistency: ConsistencyAnalysis;
    timeliness: TimelinessAnalysis;
    uniqueness: UniquenessAnalysis;
    validity: ValidityAnalysis;
    integrity: IntegrityAnalysis;
    reasonableness: ReasonablenessAnalysis;
    precision: PrecisionAnalysis;
    representational: RepresentationalAnalysis;
    profilingInsights: ProfilingInsights;
    generatedAt: Date;
    version: string;
}
export interface Section2Config {
    enabledDimensions: string[];
    strictMode: boolean;
    maxOutlierDetection: number;
    semanticDuplicateThreshold: number;
    customBusinessRules?: any[];
    customPatterns?: any[];
    externalReferences?: {
        countryCodesList?: string[];
        currencyCodesList?: string[];
        productMasterList?: string[];
        customPatterns?: Record<string, string>;
        customRanges?: Record<string, {
            min?: number;
            max?: number;
        }>;
    };
}
export interface Section2Progress {
    phase: 'completeness' | 'accuracy' | 'consistency' | 'uniqueness' | 'validity' | 'integrity' | 'reasonableness' | 'precision' | 'representational' | 'report-generation';
    progress: number;
    currentOperation: string;
    timeElapsed: number;
    estimatedTimeRemaining?: number;
}
export interface Section2Warning {
    category: 'performance' | 'data' | 'computation' | 'threshold' | 'business_rules' | 'pattern_validation';
    severity: 'low' | 'medium' | 'high';
    message: string;
    impact?: string;
    suggestion?: string;
}
export interface Section2Result {
    qualityAudit: Section2QualityAudit;
    warnings: Section2Warning[];
    performanceMetrics: {
        totalAnalysisTime: number;
        peakMemoryUsage?: number;
        phases: Record<string, number>;
    };
}
//# sourceMappingURL=types.d.ts.map