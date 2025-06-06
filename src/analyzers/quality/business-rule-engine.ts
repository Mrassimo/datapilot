/**
 * Business Rule Validation Engine
 * Implements configurable cross-field validation rules for data quality assessment
 */

import { DataType } from '../../core/types';
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
  maxViolationsToTrack: number; // Limit memory usage
  enableBuiltInRules: boolean;
}

export class BusinessRuleEngine {
  private config: BusinessRuleConfig;
  private rules: ValidationRule[] = [];
  private violations: ValidationResult[] = [];

  constructor(
    private data: (string | null | undefined)[][],
    private headers: string[],
    _columnTypes: DataType[], // Intentionally unused - reserved for future type-specific rules
    config: Partial<BusinessRuleConfig> = {}
  ) {
    this.config = {
      enabledRuleTypes: ['cross_field', 'intra_record'],
      maxViolationsToTrack: 1000,
      enableBuiltInRules: true,
      ...config,
    };

    this.initializeRules();
  }

  public validateData(): {
    crossFieldValidations: CrossFieldValidation[];
    intraRecordConsistency: IntraRecordConsistency[];
    totalViolations: number;
    criticalViolations: number;
  } {
    this.violations = [];
    
    // Validate each row against all enabled rules
    for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
      const row = this.data[rowIndex];
      
      for (const rule of this.rules) {
        if (!rule.enabled || this.violations.length >= this.config.maxViolationsToTrack) {
          continue;
        }

        try {
          const result = rule.validate(row, this.headers, rowIndex);
          if (result && !result.passed) {
            this.violations.push(result);
          }
        } catch (error) {
          console.warn(`Rule ${rule.id} failed on row ${rowIndex}:`, error);
        }
      }
    }

    return this.generateValidationReport();
  }

  private initializeRules(): void {
    if (!this.config.enableBuiltInRules) {
      return;
    }

    // Date Chronology Rules
    this.addDateChronologyRules();
    
    // Age-Related Rules
    this.addAgeValidationRules();
    
    // Financial Calculation Rules
    this.addFinancialValidationRules();
    
    // Geographic Consistency Rules
    this.addGeographicConsistencyRules();
    
    // Logical Consistency Rules
    this.addLogicalConsistencyRules();

    // Add custom rules if provided
    if (this.config.customRules) {
      this.rules.push(...this.config.customRules.filter(rule => rule.enabled));
    }

    // Filter rules by enabled types
    this.rules = this.rules.filter(rule => 
      this.config.enabledRuleTypes.includes(rule.type)
    );
  }

  private addDateChronologyRules(): void {
    // Find date-like columns
    const dateColumns = this.findColumnsByPattern(/(date|time|created|updated|start|end|birth|expir)/i);
    
    if (dateColumns.length >= 2) {
      // Start/End date validation
      const startDateCols = dateColumns.filter(col => /(start|begin|from)/i.test(col.name));
      const endDateCols = dateColumns.filter(col => /(end|finish|to|until|expir)/i.test(col.name));
      
      for (const startCol of startDateCols) {
        for (const endCol of endDateCols) {
          this.rules.push({
            id: `date_chronology_${startCol.name}_${endCol.name}`,
            name: 'Date Chronology Validation',
            description: `${startCol.name} should be before ${endCol.name}`,
            type: 'cross_field',
            severity: 'high',
            enabled: true,
            validate: (row, _headers, rowIndex) => {
              const startValue = row[startCol.index];
              const endValue = row[endCol.index];
              
              if (!startValue || !endValue) return null;
              
              const startDate = this.parseDate(startValue);
              const endDate = this.parseDate(endValue);
              
              if (startDate && endDate && startDate > endDate) {
                return {
                  ruleId: `date_chronology_${startCol.name}_${endCol.name}`,
                  passed: false,
                  rowIndex,
                  values: { [startCol.name]: startValue, [endCol.name]: endValue },
                  issue: `${startCol.name} (${startValue}) is after ${endCol.name} (${endValue})`,
                  severity: 'high',
                };
              }
              
              return null;
            },
          });
        }
      }
    }
  }

  private addAgeValidationRules(): void {
    const ageCol = this.findColumnsByPattern(/^age$/i)[0];
    const experienceCol = this.findColumnsByPattern(/(experience|years.*work|tenure)/i)[0];
    const birthCol = this.findColumnsByPattern(/(birth|born|dob)/i)[0];

    // Age vs Experience validation
    if (ageCol && experienceCol) {
      this.rules.push({
        id: 'age_experience_consistency',
        name: 'Age vs Experience Validation',
        description: 'Age should be >= (Years of Experience + 16)',
        type: 'cross_field',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const age = this.parseNumber(row[ageCol.index]);
          const experience = this.parseNumber(row[experienceCol.index]);
          
          if (age !== null && experience !== null) {
            const minimumAge = experience + 16; // Assuming work starts at 16
            
            if (age < minimumAge) {
              return {
                ruleId: 'age_experience_consistency',
                passed: false,
                rowIndex,
                values: { age: row[ageCol.index], experience: row[experienceCol.index] },
                issue: `Age (${age}) too young for ${experience} years of experience (minimum: ${minimumAge})`,
                severity: 'medium',
              };
            }
          }
          
          return null;
        },
      });
    }

    // Age vs Birth Date validation
    if (ageCol && birthCol) {
      this.rules.push({
        id: 'age_birthdate_consistency',
        name: 'Age vs Birth Date Validation',
        description: 'Age should match calculated age from birth date',
        type: 'cross_field',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const age = this.parseNumber(row[ageCol.index]);
          const birthDate = this.parseDate(row[birthCol.index] || '');
          
          if (age !== null && birthDate) {
            const calculatedAge = new Date().getFullYear() - birthDate.getFullYear();
            const ageDifference = Math.abs(age - calculatedAge);
            
            if (ageDifference > 1) { // Allow 1 year tolerance
              return {
                ruleId: 'age_birthdate_consistency',
                passed: false,
                rowIndex,
                values: { age: row[ageCol.index], birthDate: row[birthCol.index] },
                issue: `Age (${age}) doesn't match birth date (calculated: ${calculatedAge})`,
                severity: 'medium',
              };
            }
          }
          
          return null;
        },
      });
    }
  }

  private addFinancialValidationRules(): void {
    // Total = Quantity × Unit Price validation
    const totalCols = this.findColumnsByPattern(/(total|amount|sum)/i);
    const quantityCols = this.findColumnsByPattern(/(quantity|qty|count|number)/i);
    const priceCols = this.findColumnsByPattern(/(price|cost|rate|unit.*price)/i);

    for (const totalCol of totalCols) {
      for (const qtyCol of quantityCols) {
        for (const priceCol of priceCols) {
          this.rules.push({
            id: `financial_calculation_${totalCol.name}_${qtyCol.name}_${priceCol.name}`,
            name: 'Financial Calculation Validation',
            description: `${totalCol.name} should equal ${qtyCol.name} × ${priceCol.name}`,
            type: 'business_logic',
            severity: 'high',
            enabled: true,
            validate: (row, _headers, rowIndex) => {
              const total = this.parseNumber(row[totalCol.index]);
              const quantity = this.parseNumber(row[qtyCol.index]);
              const price = this.parseNumber(row[priceCol.index]);
              
              if (total !== null && quantity !== null && price !== null) {
                const calculatedTotal = quantity * price;
                const tolerance = Math.max(0.01, calculatedTotal * 0.001); // 0.1% or $0.01 minimum
                
                if (Math.abs(total - calculatedTotal) > tolerance) {
                  return {
                    ruleId: `financial_calculation_${totalCol.name}_${qtyCol.name}_${priceCol.name}`,
                    passed: false,
                    rowIndex,
                    values: {
                      [totalCol.name]: row[totalCol.index],
                      [qtyCol.name]: row[qtyCol.index],
                      [priceCol.name]: row[priceCol.index],
                    },
                    issue: `${totalCol.name} (${total}) ≠ ${qtyCol.name} (${quantity}) × ${priceCol.name} (${price}) = ${calculatedTotal}`,
                    severity: 'high',
                  };
                }
              }
              
              return null;
            },
          });
        }
      }
    }
  }

  private addGeographicConsistencyRules(): void {
    // Find relevant columns (city and country reserved for future geographic validation)
    const stateCol = this.findColumnsByPattern(/(state|province|region)/i)[0];
    const postalCol = this.findColumnsByPattern(/(postal|zip|postcode)/i)[0];

    // Note: This would require external geographic databases for full validation
    // For now, we implement basic format consistency checks
    
    if (stateCol && postalCol) {
      this.rules.push({
        id: 'state_postal_format_consistency',
        name: 'State-Postal Code Format Consistency',
        description: 'State and postal code formats should be consistent',
        type: 'intra_record',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const state = row[stateCol.index]?.toString().trim();
          const postal = row[postalCol.index]?.toString().trim();
          
          if (state && postal) {
            // US format check (2-letter state, 5 or 9 digit ZIP)
            const isUSState = /^[A-Z]{2}$/i.test(state);
            const isUSZip = /^\d{5}(-?\d{4})?$/.test(postal);
            
            // Canadian format check (2-letter province, postal format)
            const isCAProvince = /^[A-Z]{2}$/i.test(state);
            const isCAPostal = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postal);
            
            const formatMismatch = (isUSState && !isUSZip && !isCAPostal) || 
                                   (isCAProvince && !isCAPostal && !isUSZip);
            
            if (formatMismatch) {
              return {
                ruleId: 'state_postal_format_consistency',
                passed: false,
                rowIndex,
                values: { state, postal },
                issue: `State format (${state}) doesn't match postal code format (${postal})`,
                severity: 'medium',
              };
            }
          }
          
          return null;
        },
      });
    }
  }

  private addLogicalConsistencyRules(): void {
    // Marital status vs spouse name
    const maritalCol = this.findColumnsByPattern(/(marital|marriage)/i)[0];
    const spouseCol = this.findColumnsByPattern(/(spouse|partner)/i)[0];

    if (maritalCol && spouseCol) {
      this.rules.push({
        id: 'marital_spouse_consistency',
        name: 'Marital Status vs Spouse Consistency',
        description: 'Single status should not have spouse name',
        type: 'cross_field',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const marital = row[maritalCol.index]?.toString().toLowerCase().trim();
          const spouse = row[spouseCol.index]?.toString().trim();
          
          if (marital && spouse) {
            const isSingle = /(single|unmarried|never.*married)/i.test(marital);
            const hasSpouseName = spouse.length > 0 && 
                                  !/(n\/a|na|null|none|empty)/i.test(spouse);
            
            if (isSingle && hasSpouseName) {
              return {
                ruleId: 'marital_spouse_consistency',
                passed: false,
                rowIndex,
                values: { maritalStatus: marital, spouseName: spouse },
                issue: `Marital status is '${marital}' but spouse name is provided: '${spouse}'`,
                severity: 'low',
              };
            }
          }
          
          return null;
        },
      });
    }
  }

  private findColumnsByPattern(pattern: RegExp): Array<{name: string, index: number}> {
    return this.headers
      .map((header, index) => ({ name: header, index }))
      .filter(col => pattern.test(col.name));
  }

  private parseDate(value: string): Date | null {
    if (!value || typeof value !== 'string') return null;
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseNumber(value: string | null | undefined): number | null {
    if (!value) return null;
    
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private generateValidationReport(): {
    crossFieldValidations: CrossFieldValidation[];
    intraRecordConsistency: IntraRecordConsistency[];
    totalViolations: number;
    criticalViolations: number;
  } {
    // Group violations by rule ID
    const violationsByRule = new Map<string, ValidationResult[]>();
    
    for (const violation of this.violations) {
      if (!violationsByRule.has(violation.ruleId)) {
        violationsByRule.set(violation.ruleId, []);
      }
      violationsByRule.get(violation.ruleId)!.push(violation);
    }

    const crossFieldValidations: CrossFieldValidation[] = [];
    const intraRecordConsistency: IntraRecordConsistency[] = [];

    for (const [ruleId, violations] of violationsByRule) {
      const rule = this.rules.find(r => r.id === ruleId);
      if (!rule) continue;

      const examples = violations.slice(0, 5).map(v => ({
        rowIndex: v.rowIndex,
        values: v.values,
        issue: v.issue,
      }));

      if (rule.type === 'cross_field' || rule.type === 'business_logic') {
        crossFieldValidations.push({
          ruleId,
          description: rule.description,
          violations: violations.length,
          examples,
        });
      } else if (rule.type === 'intra_record') {
        intraRecordConsistency.push({
          ruleDescription: rule.description,
          violatingRecords: violations.length,
          examples: examples.map(ex => ({
            rowIndex: ex.rowIndex,
            inconsistentValues: ex.values,
            issue: ex.issue,
          })),
        });
      }
    }

    const criticalViolations = this.violations.filter(v => 
      v.severity === 'critical' || v.severity === 'high'
    ).length;

    return {
      crossFieldValidations,
      intraRecordConsistency,
      totalViolations: this.violations.length,
      criticalViolations,
    };
  }

  public getViolationSummary(): {
    totalRulesEvaluated: number;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    violationsByType: Record<string, number>;
  } {
    const violationsBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const violationsByType: Record<string, number> = {
      cross_field: 0,
      intra_record: 0,
      business_logic: 0,
    };

    for (const violation of this.violations) {
      violationsBySeverity[violation.severity]++;
      
      const rule = this.rules.find(r => r.id === violation.ruleId);
      if (rule) {
        violationsByType[rule.type]++;
      }
    }

    return {
      totalRulesEvaluated: this.rules.length,
      totalViolations: this.violations.length,
      violationsBySeverity,
      violationsByType,
    };
  }
}