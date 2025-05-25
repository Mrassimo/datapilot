export function analyseConsistency(data, headers) {
  const results = {
    dimension: 'Consistency',
    weight: 0.15,
    issues: [],
    metrics: {},
    score: 100
  };

  const consistencyChecks = {
    crossColumnValidation: [],
    formatStandardisation: [],
    namingConventions: [],
    duplicateVariations: []
  };

  const crossColumnIssues = checkCrossColumnConsistency(data, headers);
  consistencyChecks.crossColumnValidation = crossColumnIssues;
  
  crossColumnIssues.forEach(issue => {
    results.issues.push({
      type: issue.severity,
      category: 'Cross-Column Validation',
      message: issue.message,
      affectedRecords: issue.count,
      examples: issue.examples?.slice(0, 3),
      recommendation: issue.fix
    });
    results.score -= issue.severity === 'critical' ? 10 : 5;
  });

  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]).filter(val => val !== null && val !== '');
    
    const formatIssues = checkFormatConsistency(columnData, header);
    if (formatIssues.length > 0) {
      consistencyChecks.formatStandardisation.push(...formatIssues);
      formatIssues.forEach(issue => {
        results.issues.push({
          type: issue.severity,
          field: header,
          category: 'Format Standardisation',
          message: issue.message,
          variations: issue.variations,
          recommendation: issue.recommendation
        });
        results.score -= issue.severity === 'critical' ? 5 : 2;
      });
    }
  });

  const namingIssues = checkNamingConsistency(data, headers);
  if (namingIssues.length > 0) {
    consistencyChecks.namingConventions = namingIssues;
    namingIssues.forEach(issue => {
      results.issues.push({
        type: 'observation',
        category: 'Naming Conventions',
        message: issue.message,
        examples: issue.examples,
        impact: 'May cause confusion or integration issues'
      });
      results.score -= 1;
    });
  }

  const caseInsensitiveDuplicates = findCaseVariations(data, headers);
  if (caseInsensitiveDuplicates.length > 0) {
    consistencyChecks.duplicateVariations = caseInsensitiveDuplicates;
    results.issues.push({
      type: 'warning',
      category: 'Case Variations',
      message: `Found ${caseInsensitiveDuplicates.length} groups with case variations`,
      groups: caseInsensitiveDuplicates.slice(0, 3),
      recommendation: 'Standardise to consistent case format'
    });
    results.score -= 5;
  }

  results.metrics = {
    crossColumnIssues: consistencyChecks.crossColumnValidation.length,
    formatIssues: consistencyChecks.formatStandardisation.length,
    namingIssues: consistencyChecks.namingConventions.length,
    caseVariations: consistencyChecks.duplicateVariations.length,
    overallConsistency: results.score
  };

  results.score = Math.max(0, results.score);
  return results;
}

function checkCrossColumnConsistency(data, headers) {
  const issues = [];

  const dateColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('date') || 
                   col.header.toLowerCase().includes('time'));

  for (let i = 0; i < dateColumns.length - 1; i++) {
    for (let j = i + 1; j < dateColumns.length; j++) {
      const col1 = dateColumns[i];
      const col2 = dateColumns[j];
      
      const temporalIssues = checkTemporalLogic(data, col1, col2);
      if (temporalIssues) {
        issues.push(temporalIssues);
      }
    }
  }

  const ageColumn = headers.findIndex(h => h.toLowerCase().includes('age'));
  const birthDateColumn = headers.findIndex(h => 
    h.toLowerCase().includes('birth') || h.toLowerCase().includes('dob'));
  
  if (ageColumn !== -1 && birthDateColumn !== -1) {
    const ageConsistency = checkAgeDateConsistency(data, ageColumn, birthDateColumn);
    if (ageConsistency) {
      issues.push(ageConsistency);
    }
  }

  const statusColumn = headers.findIndex(h => h.toLowerCase().includes('status'));
  if (statusColumn !== -1) {
    const statusIssues = checkStatusConsistency(data, headers, statusColumn);
    issues.push(...statusIssues);
  }

  const addressColumns = findAddressColumns(headers);
  if (addressColumns.length > 0) {
    const geoIssues = checkGeographicConsistency(data, addressColumns);
    if (geoIssues.length > 0) {
      issues.push(...geoIssues);
    }
  }

  return issues;
}

function checkTemporalLogic(data, col1, col2) {
  const issues = [];
  let violationCount = 0;
  const examples = [];

  const rules = getTemporalRules(col1.header, col2.header);
  if (!rules) return null;

  data.forEach((row, index) => {
    const date1 = parseDate(row[col1.index]);
    const date2 = parseDate(row[col2.index]);
    
    if (date1 && date2) {
      if (rules.relationship === 'before' && date1 > date2) {
        violationCount++;
        if (examples.length < 5) {
          examples.push({
            row: index + 1,
            [col1.header]: row[col1.index],
            [col2.header]: row[col2.index]
          });
        }
      } else if (rules.relationship === 'after' && date1 < date2) {
        violationCount++;
        if (examples.length < 5) {
          examples.push({
            row: index + 1,
            [col1.header]: row[col1.index],
            [col2.header]: row[col2.index]
          });
        }
      }
    }
  });

  if (violationCount > 0) {
    return {
      severity: violationCount > data.length * 0.05 ? 'critical' : 'warning',
      message: `${col1.header} should be ${rules.relationship} ${col2.header}`,
      count: violationCount,
      examples: examples,
      fix: `UPDATE table SET ${col1.header} = ${rules.fix}`
    };
  }

  return null;
}

function getTemporalRules(field1, field2) {
  const rules = {
    'created,modified': { relationship: 'before', fix: 'LEAST(created_date, modified_date)' },
    'created,first': { relationship: 'before', fix: 'LEAST(created_date, first_date)' },
    'start,end': { relationship: 'before', fix: 'LEAST(start_date, end_date)' },
    'birth,death': { relationship: 'before', fix: 'birth_date' },
    'order,delivery': { relationship: 'before', fix: 'order_date' },
    'purchase,return': { relationship: 'before', fix: 'purchase_date' }
  };

  for (const [key, rule] of Object.entries(rules)) {
    const [f1, f2] = key.split(',');
    if ((field1.toLowerCase().includes(f1) && field2.toLowerCase().includes(f2)) ||
        (field1.toLowerCase().includes(f2) && field2.toLowerCase().includes(f1))) {
      return rule;
    }
  }

  return null;
}

function checkAgeDateConsistency(data, ageIndex, birthDateIndex) {
  let inconsistentCount = 0;
  const examples = [];
  const currentYear = new Date().getFullYear();

  data.forEach((row, index) => {
    const age = parseInt(row[ageIndex]);
    const birthDate = parseDate(row[birthDateIndex]);
    
    if (!isNaN(age) && birthDate) {
      const birthYear = birthDate.getFullYear();
      const calculatedAge = currentYear - birthYear;
      
      if (Math.abs(calculatedAge - age) > 1) {
        inconsistentCount++;
        if (examples.length < 3) {
          examples.push({
            row: index + 1,
            statedAge: age,
            birthDate: row[birthDateIndex],
            calculatedAge: calculatedAge
          });
        }
      }
    }
  });

  if (inconsistentCount > 0) {
    return {
      severity: inconsistentCount > data.length * 0.02 ? 'critical' : 'warning',
      message: 'Age inconsistent with birth date',
      count: inconsistentCount,
      examples: examples,
      fix: 'Recalculate age from birth date'
    };
  }

  return null;
}

function checkStatusConsistency(data, headers, statusIndex) {
  const issues = [];
  const statusValues = {};

  data.forEach((row, rowIndex) => {
    const status = row[statusIndex];
    if (!status) return;

    if (!statusValues[status]) {
      statusValues[status] = {
        count: 0,
        associatedPatterns: {}
      };
    }
    statusValues[status].count++;

    headers.forEach((header, colIndex) => {
      if (colIndex !== statusIndex) {
        const value = row[colIndex];
        if (value !== null && value !== '') {
          const pattern = `${header}:${value}`;
          if (!statusValues[status].associatedPatterns[pattern]) {
            statusValues[status].associatedPatterns[pattern] = 0;
          }
          statusValues[status].associatedPatterns[pattern]++;
        }
      }
    });
  });

  Object.entries(statusValues).forEach(([status, info]) => {
    const totalCount = info.count;
    Object.entries(info.associatedPatterns).forEach(([pattern, count]) => {
      const consistency = count / totalCount;
      if (consistency > 0.95 && totalCount > 10) {
        const [field, value] = pattern.split(':');
        if (field.toLowerCase().includes('email') && status === 'inactive' && value !== '') {
          issues.push({
            severity: 'observation',
            message: `Active emails found for inactive status`,
            count: count,
            pattern: `${status} records typically have empty ${field}`,
            fix: `Consider clearing ${field} when status='${status}'`
          });
        }
      }
    });
  });

  return issues;
}

function checkFormatConsistency(values, fieldName) {
  const issues = [];
  const formats = {};

  values.forEach(value => {
    const format = detectFormat(value, fieldName);
    if (format) {
      formats[format] = (formats[format] || 0) + 1;
    }
  });

  const totalValues = values.length;
  const formatEntries = Object.entries(formats);

  if (formatEntries.length > 1) {
    const dominant = formatEntries.sort((a, b) => b[1] - a[1])[0];
    const dominantPercentage = (dominant[1] / totalValues) * 100;

    if (dominantPercentage < 95) {
      issues.push({
        severity: dominantPercentage < 80 ? 'warning' : 'observation',
        message: `Multiple format variations detected`,
        variations: formatEntries.map(([fmt, count]) => 
          `${fmt}: ${count} (${(count/totalValues*100).toFixed(1)}%)`
        ),
        recommendation: `Standardise to ${dominant[0]} format`
      });
    }
  }

  const caseVariations = checkCaseConsistency(values, fieldName);
  if (caseVariations) {
    issues.push(caseVariations);
  }

  return issues;
}

function detectFormat(value, fieldName) {
  const str = String(value);
  const fieldLower = fieldName.toLowerCase();

  if (fieldLower.includes('phone')) {
    if (/^\d{10}$/.test(str)) return 'XXXXXXXXXX';
    if (/^\d{3}-\d{3}-\d{4}$/.test(str)) return 'XXX-XXX-XXXX';
    if (/^\(\d{3}\) \d{3}-\d{4}$/.test(str)) return '(XXX) XXX-XXXX';
    if (/^\+\d{1,3} \d+$/.test(str)) return '+XX XXXXXXXXX';
  }

  if (fieldLower.includes('date')) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'YYYY-MM-DD';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 'DD/MM/YYYY';
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return 'DD-MM-YYYY';
  }

  if (fieldLower.includes('address')) {
    if (/^\d+\s+\w+\s+(St|Street)$/i.test(str)) return 'Number Name St/Street';
    if (/^\d+\s+\w+\s+(Rd|Road)$/i.test(str)) return 'Number Name Rd/Road';
    if (/^\d+\s+\w+\s+(Ave|Avenue)$/i.test(str)) return 'Number Name Ave/Avenue';
  }

  return null;
}

function checkCaseConsistency(values, fieldName) {
  if (!['name', 'city', 'state', 'country'].some(term => 
    fieldName.toLowerCase().includes(term))) {
    return null;
  }

  const caseFormats = {
    upper: 0,
    lower: 0,
    title: 0,
    mixed: 0
  };

  values.forEach(value => {
    const str = String(value).trim();
    if (str === str.toUpperCase()) {
      caseFormats.upper++;
    } else if (str === str.toLowerCase()) {
      caseFormats.lower++;
    } else if (str === toTitleCase(str)) {
      caseFormats.title++;
    } else {
      caseFormats.mixed++;
    }
  });

  const total = values.length;
  const dominant = Object.entries(caseFormats)
    .sort((a, b) => b[1] - a[1])[0];

  if (dominant[1] < total * 0.9) {
    return {
      severity: 'observation',
      message: 'Inconsistent text casing',
      variations: Object.entries(caseFormats)
        .filter(([_, count]) => count > 0)
        .map(([format, count]) => 
          `${format}: ${(count/total*100).toFixed(1)}%`
        ),
      recommendation: `Standardise to ${dominant[0]} case`
    };
  }

  return null;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function findCaseVariations(data, headers) {
  const variations = [];
  const textColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => {
      const sample = data.slice(0, 100).map(row => row[col.index])
        .filter(v => v && typeof v === 'string');
      return sample.length > 10 && sample.some(v => isNaN(parseFloat(v)));
    });

  textColumns.forEach(col => {
    const valueGroups = {};
    
    data.forEach(row => {
      const value = row[col.index];
      if (value && typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (!valueGroups[normalized]) {
          valueGroups[normalized] = new Set();
        }
        valueGroups[normalized].add(value);
      }
    });

    Object.entries(valueGroups).forEach(([normalized, variants]) => {
      if (variants.size > 1) {
        variations.push({
          field: col.header,
          normalized: normalized,
          variants: Array.from(variants),
          count: variants.size
        });
      }
    });
  });

  return variations.sort((a, b) => b.count - a.count);
}

function checkNamingConsistency(data, headers) {
  const issues = [];
  const patterns = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    'kebab-case': /^[a-z][a-z0-9-]*$/
  };

  const namingStyles = {};
  
  headers.forEach(header => {
    Object.entries(patterns).forEach(([style, pattern]) => {
      if (pattern.test(header)) {
        namingStyles[style] = (namingStyles[style] || 0) + 1;
      }
    });
  });

  const styles = Object.entries(namingStyles).filter(([_, count]) => count > 0);
  if (styles.length > 1) {
    issues.push({
      message: 'Inconsistent column naming conventions',
      examples: styles.map(([style, count]) => 
        `${style}: ${count} columns`
      )
    });
  }

  return issues;
}

function findAddressColumns(headers) {
  const addressTerms = ['address', 'street', 'city', 'state', 'postcode', 'zip', 'country'];
  return headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => addressTerms.some(term => 
      col.header.toLowerCase().includes(term)
    ));
}

function checkGeographicConsistency(data, addressColumns) {
  const issues = [];
  
  const postcodeCol = addressColumns.find(col => 
    col.header.toLowerCase().includes('postcode') || 
    col.header.toLowerCase().includes('zip')
  );
  const stateCol = addressColumns.find(col => 
    col.header.toLowerCase().includes('state')
  );

  if (postcodeCol && stateCol) {
    const auPostcodeRanges = {
      'NSW': [[2000, 2599], [2619, 2899], [2921, 2999]],
      'VIC': [[3000, 3999], [8000, 8999]],
      'QLD': [[4000, 4999], [9000, 9999]],
      'SA': [[5000, 5799]],
      'WA': [[6000, 6797]],
      'TAS': [[7000, 7799]],
      'NT': [[800, 899]],
      'ACT': [[200, 299], [2600, 2618], [2900, 2920]]
    };

    let mismatches = 0;
    const examples = [];

    data.forEach((row, index) => {
      const postcode = parseInt(row[postcodeCol.index]);
      const state = row[stateCol.index];

      if (!isNaN(postcode) && state && auPostcodeRanges[state]) {
        const validRanges = auPostcodeRanges[state];
        const isValid = validRanges.some(([min, max]) => 
          postcode >= min && postcode <= max
        );

        if (!isValid) {
          mismatches++;
          if (examples.length < 3) {
            examples.push({
              row: index + 1,
              postcode: postcode,
              state: state
            });
          }
        }
      }
    });

    if (mismatches > 0) {
      issues.push({
        severity: mismatches > data.length * 0.02 ? 'warning' : 'observation',
        message: 'Postcode/State mismatches detected',
        count: mismatches,
        examples: examples,
        fix: 'Verify and correct geographic data'
      });
    }
  }

  return issues;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}