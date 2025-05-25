import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { createSection, createSubSection, formatTimestamp, formatPercentage, bulletList, numberedList } from '../utils/format.js';
import { basename } from 'path';
import ora from 'ora';
import { OutputHandler } from '../utils/output.js';

export async function integrity(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  try {
    // Use preloaded data if available
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      if (spinner) spinner.text = 'Checking data integrity...';
      columnTypes = detectColumnTypes(records);
    }
    
    const fileName = basename(filePath);
    const columns = Object.keys(columnTypes);
    
    // Handle empty dataset
    if (records.length === 0) {
      const report = createSection('DATA INTEGRITY REPORT',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no data to check`);
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Build report
    let report = createSection('DATA INTEGRITY REPORT',
      `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
    
    // Find integrity issues
    const issues = [];
    
    // 1. Check for duplicate rows
    const duplicates = findDuplicateRows(records);
    if (duplicates.length > 0) {
      issues.push({
        severity: 'HIGH',
        type: 'Duplicate Records',
        description: `Found ${duplicates.length} exact duplicate rows`,
        details: `Row numbers: ${duplicates.slice(0, 10).join(', ')}${duplicates.length > 10 ? '... (see full list below)' : ''}`,
        impact: 'May cause double-counting in analyses',
        fix: 'Remove duplicates keeping first occurrence'
      });
    }
    
    // 2. Check each column for issues
    columns.forEach(column => {
      const type = columnTypes[column];
      const values = records.map(r => r[column]);
      
      // Check for email validation
      if (type.type === 'email') {
        const invalidEmails = [];
        values.forEach((val, idx) => {
          if (val && !isValidEmail(val)) {
            invalidEmails.push({ row: idx + 1, value: val, issue: getEmailIssue(val) });
          }
        });
        
        if (invalidEmails.length > 0) {
          issues.push({
            severity: 'MEDIUM',
            type: 'Invalid Email Formats',
            column: column,
            description: `${invalidEmails.length} email addresses fail validation`,
            examples: invalidEmails.slice(0, 3).map(e => 
              `  * Row ${e.row}: "${e.value}" (${e.issue})`
            ),
            pattern: analyzeEmailPatterns(invalidEmails),
            fix: 'Implement email validation at data entry'
          });
        }
      }
      
      // Check for phone validation
      if (type.type === 'phone') {
        const invalidPhones = [];
        values.forEach((val, idx) => {
          if (val && !isValidPhone(val)) {
            invalidPhones.push({ row: idx + 1, value: val });
          }
        });
        
        if (invalidPhones.length > 0) {
          issues.push({
            severity: 'LOW',
            type: 'Invalid Phone Numbers',
            column: column,
            description: `${invalidPhones.length} phone numbers have issues`,
            details: bulletList([
              `Format issues: ${invalidPhones.filter(p => p.value.length < 10).length} numbers too short`,
              `Invalid: ${invalidPhones.filter(p => !/^[\d\s\-\+\(\)]+$/.test(p.value)).length} contain invalid characters`
            ]),
            fix: 'Standardize phone number format'
          });
        }
      }
      
      // Check for postcode validation (Australian)
      if (type.type === 'postcode') {
        const invalidPostcodes = [];
        values.forEach((val, idx) => {
          if (val && !isValidAustralianPostcode(val)) {
            invalidPostcodes.push({ row: idx + 1, value: val });
          }
        });
        
        if (invalidPostcodes.length > 0) {
          issues.push({
            severity: 'LOW',
            type: 'Invalid Postcodes',
            column: column,
            description: `${invalidPostcodes.length} invalid Australian postcodes`,
            details: bulletList([
              `Out of range: ${invalidPostcodes.filter(p => p.value < 200 || p.value > 9999).length}`,
              `Wrong format: ${invalidPostcodes.filter(p => !/^\d{4}$/.test(p.value)).length}`
            ]),
            fix: 'Validate postcodes against Australian postcode ranges'
          });
        }
      }
      
      // Check for inconsistent categorical values
      if (type.type === 'categorical') {
        const inconsistencies = findCategoricalInconsistencies(values);
        if (inconsistencies.length > 0) {
          issues.push({
            severity: 'LOW',
            type: 'Inconsistent Categorical Values',
            column: column,
            description: `Mixed formats for categorical values`,
            details: inconsistencies.map(inc => 
              `Found: ${inc.variations.map(v => `${v.value} (${v.count})`).join(', ')}`
            ).join('\n'),
            fix: 'Standardize categorical values'
          });
        }
      }
      
      // Check for suspicious patterns
      if (type.type === 'integer' || type.type === 'float') {
        const suspiciousValues = findSuspiciousNumericValues(values);
        if (suspiciousValues.zeros > values.length * 0.05) {
          issues.push({
            severity: 'MEDIUM',
            type: 'Suspicious Zero Values',
            column: column,
            description: `${suspiciousValues.zeros} records have value = 0`,
            impact: 'May indicate missing data or errors',
            fix: 'Investigate zero values - possible data entry errors'
          });
        }
        
        if (suspiciousValues.negatives > 0 && column.toLowerCase().includes('amount') || column.toLowerCase().includes('price')) {
          issues.push({
            severity: 'HIGH',
            type: 'Negative Values in Financial Column',
            column: column,
            description: `${suspiciousValues.negatives} negative values found`,
            impact: 'Financial calculations may be incorrect',
            fix: 'Review negative values - may be returns or errors'
          });
        }
      }
    });
    
    // Check for referential integrity issues
    const idColumns = columns.filter(col => 
      columnTypes[col].type === 'identifier' || 
      col.toLowerCase().includes('_id') ||
      col.toLowerCase().includes('id_')
    );
    
    if (idColumns.length > 1) {
      issues.push({
        severity: 'INFO',
        type: 'Multiple ID Columns Detected',
        description: `Found ${idColumns.length} potential ID columns: ${idColumns.join(', ')}`,
        impact: 'May indicate denormalized data or multiple entities',
        fix: 'Consider normalizing into separate tables'
      });
    }
    
    // Format issues
    report += `\nCRITICAL ISSUES FOUND: ${issues.filter(i => i.severity === 'HIGH').length}\n`;
    
    issues.forEach((issue, idx) => {
      report += `\n[ISSUE ${idx + 1}] ${issue.type}\n`;
      report += `- Severity: ${issue.severity}\n`;
      if (issue.column) report += `- Column: ${issue.column}\n`;
      report += `- Description: ${issue.description}\n`;
      
      if (issue.examples) {
        report += `- Examples:\n${issue.examples.join('\n')}\n`;
      }
      if (issue.details) {
        report += `- Details: ${issue.details}\n`;
      }
      if (issue.pattern) {
        report += `- Pattern: ${issue.pattern}\n`;
      }
      if (issue.impact) {
        report += `- Impact: ${issue.impact}\n`;
      }
      report += `- Suggested fix: ${issue.fix}\n`;
    });
    
    // Data Quality Metrics
    const totalCells = records.length * columns.length;
    const nullCells = columns.reduce((sum, col) => {
      return sum + records.filter(r => r[col] === null || r[col] === undefined).length;
    }, 0);
    
    const completeness = (totalCells - nullCells) / totalCells;
    const duplicateRate = duplicates.length / records.length;
    const issueRate = issues.length / columns.length;
    
    const qualityScore = (completeness * 0.4 + (1 - duplicateRate) * 0.3 + (1 - Math.min(issueRate, 1)) * 0.3) * 100;
    
    report += createSubSection('DATA QUALITY METRICS', bulletList([
      `Overall Quality Score: ${qualityScore.toFixed(1)}%`,
      `Completeness: ${formatPercentage(completeness)} (missing ${formatPercentage(1 - completeness)} of expected values)`,
      `Consistency: ${formatPercentage(1 - issueRate)} (${issues.length} issues detected)`,
      `Validity: ${formatPercentage(1 - duplicateRate)} (${duplicates.length} duplicate rows)`
    ]));
    
    // Validation details by column
    report += createSubSection('VALIDATION DETAILS BY COLUMN', '');
    
    columns.forEach(column => {
      const type = columnTypes[column];
      const values = records.map(r => r[column]);
      const nullCount = values.filter(v => v === null || v === undefined).length;
      
      report += `\n[${column}]\n`;
      report += `- Type: ${type.type}\n`;
      report += `- Completeness: ${formatPercentage((values.length - nullCount) / values.length)}\n`;
      
      // Add type-specific validation results
      if (type.type === 'date') {
        const dates = values.filter(v => v instanceof Date);
        const futureDates = dates.filter(d => d > new Date());
        const ancientDates = dates.filter(d => d < new Date('1900-01-01'));
        
        if (futureDates.length > 0) {
          report += `- Future dates: ${futureDates.length}\n`;
        }
        if (ancientDates.length > 0) {
          report += `- Suspicious old dates: ${ancientDates.length} (before 1900)\n`;
        }
      }
      
      if (type.type === 'categorical' && type.categories) {
        report += `- Unique values: ${type.categories.length}\n`;
        if (type.categories.length <= 10) {
          report += `- Values: ${type.categories.join(', ')}\n`;
        }
      }
    });
    
    // Business rule violations
    const businessRules = checkBusinessRules(records, columnTypes);
    if (businessRules.length > 0) {
      report += createSubSection('BUSINESS RULE VIOLATIONS', 
        numberedList(businessRules.map(rule => `${rule.description}: ${rule.count} records (${rule.severity})`))
      );
    }
    
    if (spinner) spinner.succeed('Integrity check complete!');
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error checking integrity');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function findDuplicateRows(records) {
  const seen = new Map();
  const duplicates = [];
  
  records.forEach((record, idx) => {
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      duplicates.push(idx + 1);
    } else {
      seen.set(key, idx + 1);
    }
  });
  
  return duplicates;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getEmailIssue(email) {
  if (!email.includes('@')) return 'missing @ symbol';
  if (!email.includes('.')) return 'missing domain extension';
  if (email.startsWith('@')) return 'missing local part';
  if (email.endsWith('@')) return 'missing domain';
  if (email.split('@').length > 2) return 'multiple @ symbols';
  
  const [local, domain] = email.split('@');
  if (!domain.includes('.')) return 'missing TLD';
  if (domain.startsWith('.')) return 'invalid domain format';
  
  return 'invalid format';
}

function analyzeEmailPatterns(invalidEmails) {
  const patterns = {
    missingTLD: 0,
    missingDomain: 0,
    missingLocal: 0,
    other: 0
  };
  
  invalidEmails.forEach(e => {
    if (e.issue.includes('TLD')) patterns.missingTLD++;
    else if (e.issue.includes('domain')) patterns.missingDomain++;
    else if (e.issue.includes('local')) patterns.missingLocal++;
    else patterns.other++;
  });
  
  const total = invalidEmails.length;
  const mainIssue = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])[0];
  
  return `${formatPercentage(mainIssue[1] / total)} of invalid emails are ${mainIssue[0]}`;
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

function isValidAustralianPostcode(postcode) {
  const num = parseInt(postcode);
  return /^\d{4}$/.test(postcode) && num >= 200 && num <= 9999;
}

function findCategoricalInconsistencies(values) {
  const valueCounts = {};
  values.forEach(val => {
    if (val !== null && val !== undefined) {
      const normalized = String(val).toLowerCase().trim();
      if (!valueCounts[normalized]) {
        valueCounts[normalized] = { original: [], count: 0 };
      }
      if (!valueCounts[normalized].original.includes(val)) {
        valueCounts[normalized].original.push(val);
      }
      valueCounts[normalized].count++;
    }
  });
  
  const inconsistencies = [];
  Object.entries(valueCounts).forEach(([normalized, data]) => {
    if (data.original.length > 1) {
      inconsistencies.push({
        normalized,
        variations: data.original.map(orig => ({
          value: orig,
          count: values.filter(v => v === orig).length
        }))
      });
    }
  });
  
  return inconsistencies;
}

function findSuspiciousNumericValues(values) {
  let zeros = 0;
  let negatives = 0;
  let extremeValues = 0;
  
  const numbers = values.filter(v => typeof v === 'number');
  if (numbers.length === 0) return { zeros, negatives, extremeValues };
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const stdDev = Math.sqrt(numbers.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numbers.length);
  
  numbers.forEach(num => {
    if (num === 0) zeros++;
    if (num < 0) negatives++;
    if (Math.abs(num - mean) > 3 * stdDev) extremeValues++;
  });
  
  return { zeros, negatives, extremeValues };
}

function checkBusinessRules(records, columnTypes) {
  const violations = [];
  const columns = Object.keys(columnTypes);
  
  // Check for age violations
  const ageColumns = columns.filter(col => 
    col.toLowerCase().includes('age') && 
    ['integer', 'float'].includes(columnTypes[col].type)
  );
  
  ageColumns.forEach(ageCol => {
    const underAge = records.filter(r => 
      typeof r[ageCol] === 'number' && r[ageCol] < 18 && r[ageCol] > 0
    ).length;
    
    if (underAge > 0) {
      violations.push({
        description: `Age below 18 in ${ageCol}`,
        count: underAge,
        severity: 'may violate terms of service'
      });
    }
  });
  
  // Check for duplicate emails
  const emailColumns = columns.filter(col => columnTypes[col].type === 'email');
  emailColumns.forEach(emailCol => {
    const emails = records.map(r => r[emailCol]).filter(e => e !== null);
    const uniqueEmails = new Set(emails);
    const duplicateCount = emails.length - uniqueEmails.size;
    
    if (duplicateCount > 0) {
      violations.push({
        description: `Duplicate email addresses in ${emailCol}`,
        count: duplicateCount,
        severity: 'should be unique per customer'
      });
    }
  });
  
  // Check for status inconsistencies
  const statusColumns = columns.filter(col => 
    col.toLowerCase().includes('status') && 
    columnTypes[col].type === 'categorical'
  );
  
  const activeColumns = columns.filter(col => 
    col.toLowerCase().includes('active') || 
    col.toLowerCase().includes('inactive')
  );
  
  if (statusColumns.length > 0 && activeColumns.length > 0) {
    const inconsistent = records.filter(r => {
      const status = r[statusColumns[0]];
      const active = r[activeColumns[0]];
      return (status === 'inactive' && active === true) || 
             (status === 'active' && active === false);
    }).length;
    
    if (inconsistent > 0) {
      violations.push({
        description: 'Status field inconsistent with active flag',
        count: inconsistent,
        severity: 'data consistency issue'
      });
    }
  }
  
  return violations;
}