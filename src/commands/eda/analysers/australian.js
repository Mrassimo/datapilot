import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function validateAustralianData(records, columns, columnTypes) {
  const validation = {
    detected: false,
    results: {}
  };
  
  // Check each column for Australian patterns
  columns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) return;
    
    const columnValidation = [];
    
    // Check for postcodes
    const postcodeValidation = validatePostcodes(values);
    if (postcodeValidation.detected) {
      validation.detected = true;
      columnValidation.push(postcodeValidation);
    }
    
    // Check for phone numbers
    const phoneValidation = validatePhoneNumbers(values);
    if (phoneValidation.detected) {
      validation.detected = true;
      columnValidation.push(phoneValidation);
    }
    
    // Check for state codes
    const stateValidation = validateStateCodes(values);
    if (stateValidation.detected) {
      validation.detected = true;
      columnValidation.push(stateValidation);
    }
    
    // Check for ABN/ACN
    const abnValidation = validateABN(values);
    if (abnValidation.detected) {
      validation.detected = true;
      columnValidation.push(abnValidation);
    }
    
    // Check for currency
    const currencyValidation = validateCurrency(values);
    if (currencyValidation.detected) {
      validation.detected = true;
      columnValidation.push(currencyValidation);
    }
    
    if (columnValidation.length > 0) {
      validation.results[col] = columnValidation;
    }
  });
  
  return validation;
}

function validatePostcodes(values) {
  const postcodePattern = /^[0-9]{4}$/;
  const postcodes = values.filter(v => postcodePattern.test(String(v)));
  
  if (postcodes.length < values.length * 0.1) {
    return { detected: false };
  }
  
  // Australian postcode ranges by state
  const stateRanges = {
    NSW: [[1000, 2599], [2620, 2899], [2921, 2999]],
    VIC: [[3000, 3999]],
    QLD: [[4000, 4999]],
    SA: [[5000, 5999]],
    WA: [[6000, 6999]],
    TAS: [[7000, 7999]],
    NT: [[800, 899]]
  };
  
  const validPostcodes = [];
  const invalidPostcodes = [];
  const stateDistribution = {};
  
  postcodes.forEach(postcode => {
    const num = parseInt(postcode);
    let isValid = false;
    let state = null;
    
    for (const [stateName, ranges] of Object.entries(stateRanges)) {
      for (const [min, max] of ranges) {
        if (num >= min && num <= max) {
          isValid = true;
          state = stateName;
          break;
        }
      }
      if (isValid) break;
    }
    
    if (isValid) {
      validPostcodes.push(postcode);
      stateDistribution[state] = (stateDistribution[state] || 0) + 1;
    } else {
      invalidPostcodes.push(postcode);
    }
  });
  
  return {
    type: 'Australian Postcodes',
    detected: true,
    valid: validPostcodes.length > 0,
    validCount: validPostcodes.length,
    invalidCount: invalidPostcodes.length,
    percentage: (postcodes.length / values.length * 100).toFixed(1),
    details: {
      stateDistribution: Object.entries(stateDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([state, count]) => `${state}: ${count}`)
        .join(', '),
      invalidExamples: invalidPostcodes.slice(0, 5)
    }
  };
}

function validatePhoneNumbers(values) {
  const phonePatterns = [
    /^(?:\+?61|0)[2-478]\d{8}$/, // Landline
    /^(?:\+?61|0)4\d{8}$/, // Mobile
    /^13\d{4}$|^1300\d{6}$|^1800\d{6}$/ // Special numbers
  ];
  
  const phoneNumbers = values.filter(v => {
    const str = String(v).replace(/[\s\-\(\)]/g, '');
    return phonePatterns.some(pattern => pattern.test(str));
  });
  
  if (phoneNumbers.length < values.length * 0.1) {
    return { detected: false };
  }
  
  const validNumbers = [];
  const invalidNumbers = [];
  const types = {
    mobile: 0,
    landline: 0,
    special: 0
  };
  
  phoneNumbers.forEach(phone => {
    const cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
    
    try {
      const parsed = parsePhoneNumberFromString(cleaned, 'AU');
      if (parsed && parsed.isValid()) {
        validNumbers.push(phone);
        
        if (cleaned.match(/^(?:\+?61|0)4/)) {
          types.mobile++;
        } else if (cleaned.match(/^1[38]/)) {
          types.special++;
        } else {
          types.landline++;
        }
      } else {
        invalidNumbers.push(phone);
      }
    } catch {
      invalidNumbers.push(phone);
    }
  });
  
  return {
    type: 'Australian Phone Numbers',
    detected: true,
    valid: validNumbers.length > 0,
    validCount: validNumbers.length,
    invalidCount: invalidNumbers.length,
    percentage: (phoneNumbers.length / values.length * 100).toFixed(1),
    details: {
      types: `Mobile: ${types.mobile}, Landline: ${types.landline}, Special: ${types.special}`,
      invalidExamples: invalidNumbers.slice(0, 3)
    }
  };
}

function validateStateCodes(values) {
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  const statePattern = new RegExp(`^(${states.join('|')})$`, 'i');
  
  const stateCodes = values.filter(v => statePattern.test(String(v).trim()));
  
  if (stateCodes.length < values.length * 0.1) {
    return { detected: false };
  }
  
  const distribution = {};
  stateCodes.forEach(state => {
    const upperState = String(state).trim().toUpperCase();
    distribution[upperState] = (distribution[upperState] || 0) + 1;
  });
  
  return {
    type: 'Australian State Codes',
    detected: true,
    valid: true,
    validCount: stateCodes.length,
    percentage: (stateCodes.length / values.length * 100).toFixed(1),
    details: {
      distribution: Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .map(([state, count]) => `${state}: ${count}`)
        .join(', ')
    }
  };
}

function validateABN(values) {
  const abnPattern = /^(\d{2}\s?\d{3}\s?\d{3}\s?\d{3}|\d{11})$/;
  const acnPattern = /^(\d{3}\s?\d{3}\s?\d{3}|\d{9})$/;
  
  const abnNumbers = values.filter(v => {
    const str = String(v).trim();
    return abnPattern.test(str) || acnPattern.test(str);
  });
  
  if (abnNumbers.length < values.length * 0.05) {
    return { detected: false };
  }
  
  const validABNs = [];
  const invalidABNs = [];
  
  abnNumbers.forEach(abn => {
    const digits = String(abn).replace(/\s/g, '');
    
    if (digits.length === 11) {
      // ABN validation
      if (validateABNChecksum(digits)) {
        validABNs.push(abn);
      } else {
        invalidABNs.push(abn);
      }
    } else if (digits.length === 9) {
      // ACN validation (simplified)
      validABNs.push(abn);
    } else {
      invalidABNs.push(abn);
    }
  });
  
  return {
    type: 'Australian Business Numbers',
    detected: true,
    valid: validABNs.length > 0,
    validCount: validABNs.length,
    invalidCount: invalidABNs.length,
    percentage: (abnNumbers.length / values.length * 100).toFixed(1),
    details: {
      format: 'ABN (11 digits) or ACN (9 digits)',
      invalidExamples: invalidABNs.slice(0, 3)
    }
  };
}

function validateABNChecksum(abn) {
  if (abn.length !== 11) return false;
  
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  
  // Subtract 1 from first digit
  const digits = abn.split('').map(Number);
  digits[0] -= 1;
  
  // Calculate weighted sum
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights[i];
  }
  
  return sum % 89 === 0;
}

function validateCurrency(values) {
  const currencyPattern = /^\$[\d,]+\.?\d*$/;
  const currencyValues = values.filter(v => currencyPattern.test(String(v).trim()));
  
  if (currencyValues.length < values.length * 0.1) {
    return { detected: false };
  }
  
  const amounts = currencyValues.map(v => {
    const cleaned = String(v).replace(/[$,]/g, '');
    return parseFloat(cleaned);
  }).filter(amt => !isNaN(amt));
  
  const stats = {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    average: amounts.reduce((a, b) => a + b, 0) / amounts.length
  };
  
  // Check for GST patterns (10%)
  const gstAmounts = [];
  for (let i = 0; i < amounts.length; i++) {
    for (let j = i + 1; j < amounts.length; j++) {
      const ratio = amounts[i] / amounts[j];
      if (Math.abs(ratio - 1.1) < 0.001 || Math.abs(ratio - 0.909) < 0.001) {
        gstAmounts.push({ amount: amounts[i], gst: amounts[j] });
      }
    }
  }
  
  return {
    type: 'Australian Currency',
    detected: true,
    valid: true,
    validCount: currencyValues.length,
    percentage: (currencyValues.length / values.length * 100).toFixed(1),
    details: {
      range: `$${stats.min.toFixed(2)} - $${stats.max.toFixed(2)}`,
      average: `$${stats.average.toFixed(2)}`,
      gstPatterns: gstAmounts.length > 0 ? `${gstAmounts.length} potential GST relationships found` : 'No GST patterns detected'
    }
  };
}

export function generateAustralianInsights(validation) {
  const insights = [];
  
  if (!validation.detected) {
    return insights;
  }
  
  // Geographic insights
  const postcodeColumns = Object.entries(validation.results)
    .filter(([_, validations]) => 
      validations.some(v => v.type === 'Australian Postcodes' && v.valid)
    );
  
  if (postcodeColumns.length > 0) {
    insights.push('Geographic data detected - consider state-based analysis');
  }
  
  // Contact data insights
  const phoneColumns = Object.entries(validation.results)
    .filter(([_, validations]) => 
      validations.some(v => v.type === 'Australian Phone Numbers' && v.valid)
    );
  
  if (phoneColumns.length > 0) {
    insights.push('Contact information present - ensure compliance with Privacy Act 1988');
  }
  
  // Business data insights
  const abnColumns = Object.entries(validation.results)
    .filter(([_, validations]) => 
      validations.some(v => v.type === 'Australian Business Numbers' && v.valid)
    );
  
  if (abnColumns.length > 0) {
    insights.push('Business identifiers found - can be enriched with ABR data');
  }
  
  // Financial insights
  const currencyColumns = Object.entries(validation.results)
    .filter(([_, validations]) => 
      validations.some(v => v.type === 'Australian Currency' && v.valid)
    );
  
  if (currencyColumns.length > 0) {
    insights.push('Financial data in AUD - check for GST implications');
  }
  
  return insights;
}