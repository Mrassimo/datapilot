/**
 * Business Rule Validation Engine
 * Implements configurable cross-field validation rules for data quality assessment
 */
import type { DataType } from '../../core/types';
import type { CrossFieldValidation, IntraRecordConsistency } from './types';
export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    type: 'cross_field' | 'intra_record' | 'business_logic';
    severity: 'critical' | 'high' | 'medium' | 'low';
    enabled: boolean;
    validate: (row: (string | null | undefined)[], headers: string[], rowIndex: number) => ValidationResult | null;
}
export interface ValidationResult {
    ruleId: string;
    passed: boolean;
    rowIndex: number;
    values: Record<string, any>;
    issue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface BusinessRuleConfig {
    enabledRuleTypes: ('cross_field' | 'intra_record' | 'business_logic')[];
    customRules?: ValidationRule[];
    maxViolationsToTrack: number;
    enableBuiltInRules: boolean;
}
export declare class BusinessRuleEngine {
    private data;
    private headers;
    private config;
    private rules;
    private violations;
    constructor(data: (string | null | undefined)[][], headers: string[], _columnTypes: DataType[], // Intentionally unused - reserved for future type-specific rules
    config?: Partial<BusinessRuleConfig>);
    validateData(): {
        crossFieldValidations: CrossFieldValidation[];
        intraRecordConsistency: IntraRecordConsistency[];
        totalViolations: number;
        criticalViolations: number;
    };
    private initializeRules;
    private addDateChronologyRules;
    private addAgeValidationRules;
    private addFinancialValidationRules;
    private addGeographicConsistencyRules;
    private addLogicalConsistencyRules;
    private addMedicalValidationRules;
    /**
     * Educational Domain Validation Rules
     */
    private addEducationalValidationRules;
    /**
     * Data Integrity and Consistency Rules
     */
    private addDataIntegrityRules;
    /**
     * String Format Consistency Rules
     */
    private addStringFormatConsistencyRules;
    /**
     * Business Domain Specific Rules
     */
    private addBusinessDomainRules;
    private findColumnsByPattern;
    private parseDate;
    private parseNumber;
    private generateValidationReport;
    getViolationSummary(): {
        totalRulesEvaluated: number;
        totalViolations: number;
        violationsBySeverity: Record<string, number>;
        violationsByType: Record<string, number>;
    };
}
//# sourceMappingURL=business-rule-engine.d.ts.map