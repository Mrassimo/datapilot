import validator from 'validator';

export function analyseValidity(data, headers, columnTypes) {
  const results = {
    dimension: 'Validity',
    weight: 0.20,
    issues: [],
    metrics: {},
    score: 100
  };

  const validationRules = detectValidationRules(data, headers, columnTypes);
  const columnValidation = {};

  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]).filter(val => val !== null && val !== '');
    const rules = validationRules[header];
    
    columnValidation[header] = {
      totalValues: columnData.length,
      invalidValues: [],
      validationErrors: {},
      formatConsistency: 100
    };

    if (!rules || columnData.length === 0) return;

    const validation = columnValidation[header];

    columnData.forEach((value, index) => {
      let isValid = true;
      const errors = [];

      if (rules.type === 'email' && !validator.isEmail(String(value))) {
        isValid = false;
        errors.push('Invalid email format');
      }

      if (rules.type === 'url' && !validator.isURL(String(value))) {
        isValid = false;
        errors.push('Invalid URL format');
      }

      if (rules.type === 'numeric') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          isValid = false;
          errors.push('Not a valid number');
        } else {
          if (rules.min !== undefined && numValue < rules.min) {
            isValid = false;
            errors.push(`Value below minimum (${rules.min})`);
          }
          if (rules.max !== undefined && numValue > rules.max) {
            isValid = false;
            errors.push(`Value above maximum (${rules.max})`);
          }
        }
      }

      if (rules.type === 'date') {
        const dateFormats = detectDateFormat(columnData.slice(0, 100));
        if (!isValidDate(value, dateFormats)) {
          isValid = false;
          errors.push('Invalid date format');
        }
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
        isValid = false;
        errors.push(`Doesn't match expected pattern: ${rules.patternDescription}`);
      }

      if (rules.length && String(value).length !== rules.length) {
        isValid = false;
        errors.push(`Expected length: ${rules.length}, actual: ${String(value).length}`);
      }

      if (!isValid) {
        validation.invalidValues.push({ value, index, errors });
        errors.forEach(error => {
          validation.validationErrors[error] = (validation.validationErrors[error] || 0) + 1;
        });
      }
    });

    const invalidRate = (validation.invalidValues.length / validation.totalValues * 100);
    validation.formatConsistency = 100 - invalidRate;

    if (invalidRate > 10) {
      results.issues.push({
        type: 'critical',
        field: header,
        message: `${invalidRate.toFixed(1)}% invalid values (${validation.invalidValues.length}/${validation.totalValues})`,
        errors: Object.entries(validation.validationErrors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([error, count]) => `${error}: ${count} occurrences`),
        examples: validation.invalidValues.slice(0, 3).map(v => v.value)
      });
      results.score -= 15;
    } else if (invalidRate > 2) {
      results.issues.push({
        type: 'warning',
        field: header,
        message: `${invalidRate.toFixed(1)}% invalid values (${validation.invalidValues.length}/${validation.totalValues})`,
        errors: Object.entries(validation.validationErrors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([error, count]) => `${error}: ${count}`)
      });
      results.score -= 5;
    } else if (invalidRate > 0) {
      results.issues.push({
        type: 'observation',
        field: header,
        message: `${validation.invalidValues.length} invalid values found`,
        examples: validation.invalidValues.slice(0, 2).map(v => v.value)
      });
      results.score -= 1;
    }
  });

  const overallValidity = headers.reduce((sum, header) => 
    sum + (columnValidation[header]?.formatConsistency || 100), 0) / headers.length;

  results.metrics = {
    overallValidity: overallValidity.toFixed(2),
    columnsWithInvalidData: Object.values(columnValidation).filter(v => v.invalidValues.length > 0).length,
    totalInvalidValues: Object.values(columnValidation).reduce((sum, v) => sum + v.invalidValues.length, 0),
    validationRules: validationRules,
    columnValidation: columnValidation
  };

  results.score = Math.max(0, results.score);
  return results;
}

function detectValidationRules(data, headers, columnTypes) {
  const rules = {};

  headers.forEach((header, colIndex) => {
    const columnData = data.map(row => row[colIndex]).filter(val => val !== null && val !== '');
    if (columnData.length === 0) return;

    const headerLower = header.toLowerCase();
    const type = columnTypes[header];

    if (headerLower.includes('email')) {
      rules[header] = { type: 'email' };
    } else if (headerLower.includes('url') || headerLower.includes('website')) {
      rules[header] = { type: 'url' };
    } else if (headerLower.includes('phone') || headerLower.includes('mobile')) {
      rules[header] = { type: 'phone', pattern: detectPhonePattern(columnData) };
    } else if (headerLower.includes('postcode') || headerLower.includes('zip')) {
      rules[header] = { type: 'postcode', pattern: detectPostcodePattern(columnData) };
    } else if (type === 'date' || headerLower.includes('date') || headerLower.includes('time')) {
      rules[header] = { type: 'date' };
    } else if (type === 'numeric') {
      const numericData = columnData.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (numericData.length > 0) {
        rules[header] = {
          type: 'numeric',
          min: Math.min(...numericData),
          max: Math.max(...numericData)
        };
      }
    } else if (headerLower.includes('code') || headerLower.includes('id')) {
      const pattern = detectCodePattern(columnData);
      if (pattern) {
        rules[header] = { 
          type: 'code', 
          pattern: pattern.regex,
          patternDescription: pattern.description,
          length: pattern.length
        };
      }
    }
  });

  return rules;
}

function detectPhonePattern(values) {
  const auMobilePattern = /^(?:\+?61|0)?4\d{8}$/;
  const auLandlinePattern = /^(?:\+?61|0)?[2-9]\d{8}$/;
  
  const sample = values.slice(0, 100);
  let mobileMatches = 0;
  let landlineMatches = 0;

  sample.forEach(value => {
    const cleaned = String(value).replace(/[\s\-\(\)]/g, '');
    if (auMobilePattern.test(cleaned)) mobileMatches++;
    if (auLandlinePattern.test(cleaned)) landlineMatches++;
  });

  if (mobileMatches > sample.length * 0.8) {
    return '^(?:\\+?61|0)?4\\d{8}$';
  } else if (landlineMatches > sample.length * 0.8) {
    return '^(?:\\+?61|0)?[2-9]\\d{8}$';
  }
  
  return null;
}

function detectPostcodePattern(values) {
  const auPostcodePattern = /^[0-9]{4}$/;
  const usZipPattern = /^[0-9]{5}(-[0-9]{4})?$/;
  
  const sample = values.slice(0, 100);
  let auMatches = 0;
  let usMatches = 0;

  sample.forEach(value => {
    const cleaned = String(value).trim();
    if (auPostcodePattern.test(cleaned)) auMatches++;
    if (usZipPattern.test(cleaned)) usMatches++;
  });

  if (auMatches > sample.length * 0.8) {
    return '^[0-9]{4}$';
  } else if (usMatches > sample.length * 0.8) {
    return '^[0-9]{5}(-[0-9]{4})?$';
  }
  
  return null;
}

function detectCodePattern(values) {
  const sample = values.slice(0, 100).map(v => String(v));
  
  const lengths = sample.map(v => v.length);
  const uniqueLengths = [...new Set(lengths)];
  
  if (uniqueLengths.length === 1) {
    const length = uniqueLengths[0];
    
    const patterns = [
      { regex: '^[A-Z0-9]+$', desc: 'Alphanumeric uppercase' },
      { regex: '^[0-9]+$', desc: 'Numeric only' },
      { regex: '^[A-Z]+$', desc: 'Letters only uppercase' },
      { regex: '^[A-Z]{2,3}-[0-9]{4,6}$', desc: 'Pattern like XX-1234' }
    ];

    for (const pattern of patterns) {
      const matches = sample.filter(v => new RegExp(pattern.regex).test(v)).length;
      if (matches > sample.length * 0.95) {
        return {
          regex: pattern.regex,
          description: pattern.desc,
          length: length
        };
      }
    }
  }
  
  return null;
}

function detectDateFormat(values) {
  const formats = [
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'YYYY/MM/DD'
  ];
  
  return formats;
}

function isValidDate(value, formats) {
  const dateStr = String(value);
  
  const patterns = {
    'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
    'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
    'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
    'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
    'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/
  };

  for (const format of formats) {
    if (patterns[format] && patterns[format].test(dateStr)) {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
  }
  
  return false;
}