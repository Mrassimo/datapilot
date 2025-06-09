/**
 * Pattern Validation Engine
 * Implements format validation, regex patterns, and standardization checks
 */
import type { PatternValidation, FormatConsistency } from './types';
export interface PatternRule {
    id: string;
    name: string;
    description: string;
    columnPattern: RegExp;
    valuePattern: RegExp;
    severity: 'critical' | 'high' | 'medium' | 'low';
    examples: string[];
    enabled: boolean;
}
export interface FormatStandardization {
    columnName: string;
    inconsistencies: Array<{
        value: string;
        frequency: number;
        suggestedStandardization?: string;
    }>;
    recommendedFormat: string;
    description: string;
}
export interface PatternValidationConfig {
    enableBuiltInPatterns: boolean;
    customPatterns?: PatternRule[];
    maxViolationsPerPattern: number;
    enableFormatStandardization: boolean;
}
export declare class PatternValidationEngine {
    private data;
    private headers;
    private config;
    private patterns;
    private violations;
    constructor(data: (string | null | undefined)[][], headers: string[], config?: Partial<PatternValidationConfig>);
    validatePatterns(): {
        patternValidations: PatternValidation[];
        formatConsistency: FormatConsistency[];
        totalViolations: number;
    };
    private initializePatterns;
    /**
     * International format patterns
     */
    private addInternationalPatterns;
    /**
     * Business domain patterns
     */
    private addBusinessPatterns;
    /**
     * Security and compliance patterns
     */
    private addSecurityPatterns;
    /**
     * Educational domain patterns
     */
    private addEducationalPatterns;
    /**
     * Enhanced format consistency analysis with unit standardization
     */
    private addUnitStandardizationAnalysis;
    private validateColumnPattern;
    private analyzeFormatConsistency;
    private analyzeColumnFormatConsistency;
    private analyzeCasingConsistency;
    private generatePatternReport;
    private toTitleCase;
    private toPascalCase;
    private toCamelCase;
    getPatternSummary(): {
        totalPatternsEvaluated: number;
        totalViolations: number;
        violationsBySeverity: Record<string, number>;
        mostProblematicColumns: Array<{
            columnName: string;
            violationCount: number;
        }>;
    };
}
//# sourceMappingURL=pattern-validation-engine.d.ts.map