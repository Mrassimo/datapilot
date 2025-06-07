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
  validate: (
    row: (string | null | undefined)[],
    headers: string[],
    rowIndex: number,
  ) => ValidationResult | null;
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
    config: Partial<BusinessRuleConfig> = {},
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

    // Medical Domain Rules
    this.addMedicalValidationRules();

    // Add custom rules if provided
    if (this.config.customRules) {
      this.rules.push(...this.config.customRules.filter((rule) => rule.enabled));
    }

    // Filter rules by enabled types
    this.rules = this.rules.filter((rule) => this.config.enabledRuleTypes.includes(rule.type));
  }

  private addDateChronologyRules(): void {
    // Find date-like columns
    const dateColumns = this.findColumnsByPattern(
      /(date|time|created|updated|start|end|birth|expir)/i,
    );

    if (dateColumns.length >= 2) {
      // Start/End date validation
      const startDateCols = dateColumns.filter((col) => /(start|begin|from)/i.test(col.name));
      const endDateCols = dateColumns.filter((col) =>
        /(end|finish|to|until|expir)/i.test(col.name),
      );

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

            if (ageDifference > 1) {
              // Allow 1 year tolerance
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

            const formatMismatch =
              (isUSState && !isUSZip && !isCAPostal) || (isCAProvince && !isCAPostal && !isUSZip);

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
            const hasSpouseName = spouse.length > 0 && !/(n\/a|na|null|none|empty)/i.test(spouse);

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

  private addMedicalValidationRules(): void {
    // Medical vital signs and measurement validation
    const bpSysCol = this.findColumnsByPattern(/(blood.*pressure.*sys|systolic|bp.*sys)/i)[0];
    const bpDiaCol = this.findColumnsByPattern(/(blood.*pressure.*dia|diastolic|bp.*dia)/i)[0];
    const heartRateCol = this.findColumnsByPattern(/(heart.*rate|pulse|hr|bpm)/i)[0];
    const temperatureCol = this.findColumnsByPattern(/(temperature|temp|fever)/i)[0];
    const heightCol = this.findColumnsByPattern(/(height|stature)/i)[0];
    const weightCol = this.findColumnsByPattern(/(weight|mass)/i)[0];
    const ageCol = this.findColumnsByPattern(/^age$/i)[0];

    // Blood Pressure Systolic vs Diastolic
    if (bpSysCol && bpDiaCol) {
      this.rules.push({
        id: 'blood_pressure_systolic_diastolic',
        name: 'Blood Pressure Systolic vs Diastolic',
        description: 'Systolic pressure should be greater than diastolic pressure',
        type: 'cross_field',
        severity: 'high',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const systolic = this.parseNumber(row[bpSysCol.index]);
          const diastolic = this.parseNumber(row[bpDiaCol.index]);

          if (systolic !== null && diastolic !== null) {
            if (systolic <= diastolic) {
              return {
                ruleId: 'blood_pressure_systolic_diastolic',
                passed: false,
                rowIndex,
                values: { systolic: row[bpSysCol.index], diastolic: row[bpDiaCol.index] },
                issue: `Systolic BP (${systolic}) should be greater than diastolic BP (${diastolic})`,
                severity: 'high',
              };
            }

            // Check for unrealistic values
            if (systolic < 60 || systolic > 300 || diastolic < 30 || diastolic > 200) {
              return {
                ruleId: 'blood_pressure_systolic_diastolic',
                passed: false,
                rowIndex,
                values: { systolic: row[bpSysCol.index], diastolic: row[bpDiaCol.index] },
                issue: `Blood pressure values (${systolic}/${diastolic}) outside realistic range (60-300/30-200)`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    }

    // Heart Rate Validation
    if (heartRateCol) {
      this.rules.push({
        id: 'heart_rate_range',
        name: 'Heart Rate Range Validation',
        description: 'Heart rate should be within physiologically plausible range',
        type: 'business_logic',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const heartRate = this.parseNumber(row[heartRateCol.index]);

          if (heartRate !== null) {
            // Normal range: 30-220 BPM (covers bradycardia to maximum exercise)
            if (heartRate < 30 || heartRate > 220) {
              return {
                ruleId: 'heart_rate_range',
                passed: false,
                rowIndex,
                values: { heartRate: row[heartRateCol.index] },
                issue: `Heart rate (${heartRate} BPM) outside physiological range (30-220 BPM)`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    }

    // Body Temperature Validation
    if (temperatureCol) {
      this.rules.push({
        id: 'body_temperature_range',
        name: 'Body Temperature Range Validation',
        description: 'Body temperature should be within survivable range',
        type: 'business_logic',
        severity: 'high',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const temp = this.parseNumber(row[temperatureCol.index]);

          if (temp !== null) {
            // Detect if Celsius or Fahrenheit based on value range
            let tempC = temp;
            let unit = '°C';

            if (temp > 50) {
              // Likely Fahrenheit, convert to Celsius
              tempC = ((temp - 32) * 5) / 9;
              unit = '°F';
            }

            // Normal human body temperature range: 32-45°C (89.6-113°F)
            if (tempC < 32 || tempC > 45) {
              return {
                ruleId: 'body_temperature_range',
                passed: false,
                rowIndex,
                values: { temperature: row[temperatureCol.index] },
                issue: `Body temperature (${temp}${unit} = ${tempC.toFixed(1)}°C) outside survivable range (32-45°C)`,
                severity: 'high',
              };
            }
          }

          return null;
        },
      });
    }

    // BMI Consistency (Height vs Weight)
    if (heightCol && weightCol) {
      this.rules.push({
        id: 'bmi_plausibility',
        name: 'BMI Plausibility Check',
        description: 'BMI calculated from height and weight should be realistic',
        type: 'cross_field',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const height = this.parseNumber(row[heightCol.index]);
          const weight = this.parseNumber(row[weightCol.index]);

          if (height !== null && weight !== null && height > 0) {
            // Convert height to meters if likely in cm
            let heightM = height;
            if (height > 3) {
              heightM = height / 100; // Convert cm to m
            }

            const bmi = weight / (heightM * heightM);

            // Extreme BMI ranges (survival limits approximately 10-80)
            if (bmi < 10 || bmi > 80) {
              return {
                ruleId: 'bmi_plausibility',
                passed: false,
                rowIndex,
                values: { height: row[heightCol.index], weight: row[weightCol.index] },
                issue: `Calculated BMI (${bmi.toFixed(1)}) from height (${height}) and weight (${weight}) is implausible (normal: 10-80)`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    }

    // Age vs Medical Values Consistency
    if (ageCol && bpSysCol) {
      this.rules.push({
        id: 'age_blood_pressure_consistency',
        name: 'Age vs Blood Pressure Consistency',
        description: 'Blood pressure should be age-appropriate',
        type: 'cross_field',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const age = this.parseNumber(row[ageCol.index]);
          const systolic = this.parseNumber(row[bpSysCol.index]);

          if (age !== null && systolic !== null) {
            // Very basic age-related BP check
            if (age < 18 && systolic > 140) {
              return {
                ruleId: 'age_blood_pressure_consistency',
                passed: false,
                rowIndex,
                values: { age: row[ageCol.index], systolic: row[bpSysCol.index] },
                issue: `High systolic BP (${systolic}) unusual for age ${age} (pediatric hypertension threshold typically <130)`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    }

    // Medical Code Format Validation (ICD-10, etc.)
    const diagnosisCol = this.findColumnsByPattern(/(diagnosis|icd|disease|condition)/i)[0];
    if (diagnosisCol) {
      this.rules.push({
        id: 'medical_code_format',
        name: 'Medical Code Format Validation',
        description: 'Medical codes should follow standard formats',
        type: 'business_logic',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const diagnosis = row[diagnosisCol.index]?.toString().trim();

          if (diagnosis && diagnosis.length > 0) {
            // Basic ICD-10 format check (letter followed by 2-3 digits, optional decimal and more digits)
            const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,4})?$/i;
            // Basic ICD-9 format check (3-5 digits, optional decimal)
            const icd9Pattern = /^\d{3}(\.\d{1,2})?$/;

            if (
              !icd10Pattern.test(diagnosis) &&
              !icd9Pattern.test(diagnosis) &&
              !/^[A-Z]/.test(diagnosis)
            ) {
              return {
                ruleId: 'medical_code_format',
                passed: false,
                rowIndex,
                values: { diagnosis },
                issue: `Medical code '${diagnosis}' doesn't match standard ICD-9/ICD-10 format`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    }

    // Additional enhanced validation rules
    this.addEducationalValidationRules();
    this.addDataIntegrityRules();
    this.addStringFormatConsistencyRules();
    this.addBusinessDomainRules();
  }

  /**
   * Educational Domain Validation Rules
   */
  private addEducationalValidationRules(): void {
    const gradeCol = this.findColumnsByPattern(/(grade|gpa|score|mark)/i)[0];
    const ageCol = this.findColumnsByPattern(/^age$/i)[0];
    const graduationCol = this.findColumnsByPattern(/(graduation|graduate|completed)/i)[0];
    const enrollmentCol = this.findColumnsByPattern(/(enrollment|enroll|start)/i)[0];

    // GPA Range Validation
    if (gradeCol) {
      this.rules.push({
        id: 'gpa_range_validation',
        name: 'GPA Range Validation',
        description: 'GPA/Grade should be within valid academic range',
        type: 'business_logic',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const grade = this.parseNumber(row[gradeCol.index]);

          if (grade !== null) {
            // Common GPA scales: 0-4.0, 0-5.0, 0-100 percentage
            const isValidGPA = (grade >= 0 && grade <= 4.0) || 
                              (grade >= 0 && grade <= 5.0) || 
                              (grade >= 0 && grade <= 100);

            if (!isValidGPA || grade < 0) {
              return {
                ruleId: 'gpa_range_validation',
                passed: false,
                rowIndex,
                values: { [gradeCol.name]: row[gradeCol.index] },
                issue: `Grade/GPA (${grade}) outside valid academic range (0-4.0, 0-5.0, or 0-100)`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    }

    // Age vs Academic Year Validation
    if (ageCol && gradeCol) {
      this.rules.push({
        id: 'age_academic_consistency',
        name: 'Age vs Academic Performance Consistency',
        description: 'Student age should be appropriate for academic context',
        type: 'cross_field',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const age = this.parseNumber(row[ageCol.index]);
          const grade = this.parseNumber(row[gradeCol.index]);

          if (age !== null && grade !== null) {
            // Very basic age validation for students
            if (age < 3 || age > 100) {
              return {
                ruleId: 'age_academic_consistency',
                passed: false,
                rowIndex,
                values: { age: row[ageCol.index], grade: row[gradeCol.index] },
                issue: `Student age (${age}) seems unrealistic for academic context`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    }

    // Graduation vs Enrollment Date Logic
    if (graduationCol && enrollmentCol) {
      this.rules.push({
        id: 'enrollment_graduation_chronology',
        name: 'Enrollment vs Graduation Chronology',
        description: 'Graduation date should be after enrollment date',
        type: 'cross_field',
        severity: 'high',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const enrollmentDate = this.parseDate(row[enrollmentCol.index] || '');
          const graduationDate = this.parseDate(row[graduationCol.index] || '');

          if (enrollmentDate && graduationDate) {
            if (graduationDate <= enrollmentDate) {
              return {
                ruleId: 'enrollment_graduation_chronology',
                passed: false,
                rowIndex,
                values: { 
                  enrollment: row[enrollmentCol.index], 
                  graduation: row[graduationCol.index] 
                },
                issue: `Graduation date (${row[graduationCol.index]}) should be after enrollment date (${row[enrollmentCol.index]})`,
                severity: 'high',
              };
            }

            // Check for unrealistic graduation timeline (too fast or too slow)
            const timeDiffYears = (graduationDate.getTime() - enrollmentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            if (timeDiffYears < 0.5 || timeDiffYears > 10) {
              return {
                ruleId: 'enrollment_graduation_chronology',
                passed: false,
                rowIndex,
                values: { 
                  enrollment: row[enrollmentCol.index], 
                  graduation: row[graduationCol.index] 
                },
                issue: `Time between enrollment and graduation (${timeDiffYears.toFixed(1)} years) seems unrealistic`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    }
  }

  /**
   * Data Integrity and Consistency Rules
   */
  private addDataIntegrityRules(): void {
    // Percentage fields validation
    const percentageColumns = this.findColumnsByPattern(/(percent|rate|ratio|%)/i);
    
    percentageColumns.forEach(col => {
      this.rules.push({
        id: `percentage_range_${col.name}`,
        name: 'Percentage Range Validation',
        description: `${col.name} should be between 0 and 100`,
        type: 'business_logic',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const value = this.parseNumber(row[col.index]);

          if (value !== null) {
            if (value < 0 || value > 100) {
              return {
                ruleId: `percentage_range_${col.name}`,
                passed: false,
                rowIndex,
                values: { [col.name]: row[col.index] },
                issue: `Percentage value (${value}) in ${col.name} outside valid range (0-100)`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    });

    // ID field consistency (should not be negative)
    const idColumns = this.findColumnsByPattern(/(^id$|_id$|^.*id$)/i);
    
    idColumns.forEach(col => {
      this.rules.push({
        id: `id_positive_${col.name}`,
        name: 'ID Field Positive Validation',
        description: `${col.name} should be positive`,
        type: 'business_logic',
        severity: 'high',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const value = this.parseNumber(row[col.index]);

          if (value !== null && value <= 0) {
            return {
              ruleId: `id_positive_${col.name}`,
              passed: false,
              rowIndex,
              values: { [col.name]: row[col.index] },
              issue: `ID field ${col.name} should be positive (found: ${value})`,
              severity: 'high',
            };
          }

          return null;
        },
      });
    });

    // Count/Quantity field validation
    const countColumns = this.findColumnsByPattern(/(count|quantity|number|amount)/i);
    
    countColumns.forEach(col => {
      this.rules.push({
        id: `count_non_negative_${col.name}`,
        name: 'Count Field Non-Negative Validation',
        description: `${col.name} should not be negative`,
        type: 'business_logic',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const value = this.parseNumber(row[col.index]);

          if (value !== null && value < 0) {
            return {
              ruleId: `count_non_negative_${col.name}`,
              passed: false,
              rowIndex,
              values: { [col.name]: row[col.index] },
              issue: `Count/quantity field ${col.name} should not be negative (found: ${value})`,
              severity: 'medium',
            };
          }

          return null;
        },
      });
    });
  }

  /**
   * String Format Consistency Rules
   */
  private addStringFormatConsistencyRules(): void {
    // Email format validation
    const emailColumns = this.findColumnsByPattern(/(email|mail)/i);
    
    emailColumns.forEach(col => {
      this.rules.push({
        id: `email_format_${col.name}`,
        name: 'Email Format Validation',
        description: `${col.name} should contain valid email format`,
        type: 'business_logic',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const email = row[col.index]?.toString().trim();

          if (email && email.length > 0) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailPattern.test(email)) {
              return {
                ruleId: `email_format_${col.name}`,
                passed: false,
                rowIndex,
                values: { [col.name]: email },
                issue: `Invalid email format: '${email}'`,
                severity: 'medium',
              };
            }
          }

          return null;
        },
      });
    });

    // Phone number format validation
    const phoneColumns = this.findColumnsByPattern(/(phone|tel|mobile|contact)/i);
    
    phoneColumns.forEach(col => {
      this.rules.push({
        id: `phone_format_${col.name}`,
        name: 'Phone Number Format Validation',
        description: `${col.name} should contain valid phone format`,
        type: 'business_logic',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const phone = row[col.index]?.toString().trim();

          if (phone && phone.length > 0) {
            // Basic phone pattern (allows various formats)
            const phonePattern = /^[\+]?[\d\s\-\(\)]{7,}$/;
            
            if (!phonePattern.test(phone)) {
              return {
                ruleId: `phone_format_${col.name}`,
                passed: false,
                rowIndex,
                values: { [col.name]: phone },
                issue: `Invalid phone number format: '${phone}'`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    });

    // URL format validation
    const urlColumns = this.findColumnsByPattern(/(url|website|link|uri)/i);
    
    urlColumns.forEach(col => {
      this.rules.push({
        id: `url_format_${col.name}`,
        name: 'URL Format Validation',
        description: `${col.name} should contain valid URL format`,
        type: 'business_logic',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const url = row[col.index]?.toString().trim();

          if (url && url.length > 0) {
            const urlPattern = /^https?:\/\/[^\s]+$/;
            
            if (!urlPattern.test(url)) {
              return {
                ruleId: `url_format_${col.name}`,
                passed: false,
                rowIndex,
                values: { [col.name]: url },
                issue: `Invalid URL format: '${url}' (should start with http:// or https://)`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    });
  }

  /**
   * Business Domain Specific Rules
   */
  private addBusinessDomainRules(): void {
    // Product/Inventory validation
    const skuCol = this.findColumnsByPattern(/(sku|product.*code|item.*code)/i)[0];
    const stockCol = this.findColumnsByPattern(/(stock|inventory|quantity.*hand)/i)[0];
    const priceCol = this.findColumnsByPattern(/(price|cost|amount)/i)[0];

    if (skuCol && stockCol) {
      this.rules.push({
        id: 'product_stock_consistency',
        name: 'Product Stock Consistency',
        description: 'Product with SKU should have valid stock quantity',
        type: 'cross_field',
        severity: 'medium',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const sku = row[skuCol.index]?.toString().trim();
          const stock = this.parseNumber(row[stockCol.index]);

          if (sku && sku.length > 0 && stock !== null && stock < 0) {
            return {
              ruleId: 'product_stock_consistency',
              passed: false,
              rowIndex,
              values: { sku, stock: row[stockCol.index] },
              issue: `Product ${sku} has negative stock quantity (${stock})`,
              severity: 'medium',
            };
          }

          return null;
        },
      });
    }

    if (priceCol && stockCol) {
      this.rules.push({
        id: 'price_stock_business_logic',
        name: 'Price Stock Business Logic',
        description: 'Products with price should have reasonable stock levels',
        type: 'business_logic',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const price = this.parseNumber(row[priceCol.index]);
          const stock = this.parseNumber(row[stockCol.index]);

          if (price !== null && stock !== null) {
            // Business rule: High-value items (>$1000) with zero stock might need attention
            if (price > 1000 && stock === 0) {
              return {
                ruleId: 'price_stock_business_logic',
                passed: false,
                rowIndex,
                values: { price: row[priceCol.index], stock: row[stockCol.index] },
                issue: `High-value item (${price}) has zero stock - potential business impact`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    }

    // Customer relationship validation
    const customerIdCol = this.findColumnsByPattern(/(customer.*id|client.*id)/i)[0];
    const orderCol = this.findColumnsByPattern(/(order|purchase|transaction)/i)[0];
    const statusCol = this.findColumnsByPattern(/(status|state)/i)[0];

    if (customerIdCol && orderCol) {
      this.rules.push({
        id: 'customer_order_relationship',
        name: 'Customer Order Relationship',
        description: 'Order should have valid customer ID',
        type: 'cross_field',
        severity: 'high',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const customerId = row[customerIdCol.index]?.toString().trim();
          const order = row[orderCol.index]?.toString().trim();

          if (order && order.length > 0 && (!customerId || customerId.length === 0)) {
            return {
              ruleId: 'customer_order_relationship',
              passed: false,
              rowIndex,
              values: { customerId, order },
              issue: `Order '${order}' exists but customer ID is missing`,
              severity: 'high',
            };
          }

          return null;
        },
      });
    }

    // Status field consistency
    if (statusCol) {
      this.rules.push({
        id: 'status_field_standardization',
        name: 'Status Field Standardization',
        description: 'Status values should follow consistent format',
        type: 'business_logic',
        severity: 'low',
        enabled: true,
        validate: (row, _headers, rowIndex) => {
          const status = row[statusCol.index]?.toString().trim();

          if (status && status.length > 0) {
            // Check for common status inconsistencies
            const hasInconsistentCasing = status !== status.toLowerCase() && status !== status.toUpperCase();
            const hasSpecialChars = /[^a-zA-Z0-9\s\-_]/.test(status);
            
            if (hasInconsistentCasing && hasSpecialChars) {
              return {
                ruleId: 'status_field_standardization',
                passed: false,
                rowIndex,
                values: { status },
                issue: `Status '${status}' has inconsistent format (mixed case and special characters)`,
                severity: 'low',
              };
            }
          }

          return null;
        },
      });
    }
  }

  private findColumnsByPattern(pattern: RegExp): Array<{ name: string; index: number }> {
    return this.headers
      .map((header, index) => ({ name: header, index }))
      .filter((col) => pattern.test(col.name));
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
      const rule = this.rules.find((r) => r.id === ruleId);
      if (!rule) continue;

      const examples = violations.slice(0, 5).map((v) => ({
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
          examples: examples.map((ex) => ({
            rowIndex: ex.rowIndex,
            inconsistentValues: ex.values,
            issue: ex.issue,
          })),
        });
      }
    }

    const criticalViolations = this.violations.filter(
      (v) => v.severity === 'critical' || v.severity === 'high',
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

      const rule = this.rules.find((r) => r.id === violation.ruleId);
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
