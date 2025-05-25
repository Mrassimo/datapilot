export function validateAustralianData(data, headers) {
  const results = {
    detected: false,
    validations: {
      abn: null,
      acn: null,
      postcodes: null,
      phoneNumbers: null,
      addresses: null,
      states: null
    }
  };

  const auIndicators = detectAustralianData(data, headers);
  if (!auIndicators.detected) {
    return results;
  }

  results.detected = true;

  if (auIndicators.abnColumn !== null) {
    results.validations.abn = validateABN(data, auIndicators.abnColumn);
  }

  if (auIndicators.acnColumn !== null) {
    results.validations.acn = validateACN(data, auIndicators.acnColumn);
  }

  if (auIndicators.postcodeColumn !== null) {
    results.validations.postcodes = validatePostcodes(
      data, 
      auIndicators.postcodeColumn,
      auIndicators.stateColumn
    );
  }

  if (auIndicators.phoneColumns.length > 0) {
    results.validations.phoneNumbers = validatePhoneNumbers(data, auIndicators.phoneColumns);
  }

  if (auIndicators.addressColumns.length > 0) {
    results.validations.addresses = validateAddresses(data, auIndicators.addressColumns);
  }

  if (auIndicators.stateColumn !== null) {
    results.validations.states = validateStates(data, auIndicators.stateColumn);
  }

  return results;
}

function detectAustralianData(data, headers) {
  const indicators = {
    detected: false,
    abnColumn: null,
    acnColumn: null,
    postcodeColumn: null,
    stateColumn: null,
    phoneColumns: [],
    addressColumns: []
  };

  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    
    if (headerLower.includes('abn')) {
      indicators.abnColumn = index;
      indicators.detected = true;
    } else if (headerLower.includes('acn')) {
      indicators.acnColumn = index;
      indicators.detected = true;
    } else if (headerLower.includes('postcode') || headerLower === 'pc') {
      indicators.postcodeColumn = index;
      indicators.detected = true;
    } else if (headerLower.includes('state') || headerLower === 'state_code') {
      indicators.stateColumn = index;
      indicators.detected = true;
    } else if (headerLower.includes('phone') || headerLower.includes('mobile') || 
               headerLower.includes('contact')) {
      indicators.phoneColumns.push({ header, index });
    } else if (headerLower.includes('address') || headerLower.includes('street') ||
               headerLower.includes('suburb')) {
      indicators.addressColumns.push({ header, index });
    }
  });

  if (!indicators.detected && indicators.postcodeColumn === null) {
    const sample = data.slice(0, 100);
    headers.forEach((header, index) => {
      const values = sample.map(row => String(row[index] || ''));
      const auPostcodePattern = values.filter(v => /^[0-8]\d{3}$/.test(v)).length;
      if (auPostcodePattern > sample.length * 0.5) {
        indicators.postcodeColumn = index;
        indicators.detected = true;
      }
    });
  }

  if (!indicators.detected && indicators.stateColumn === null) {
    const auStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
    headers.forEach((header, index) => {
      const values = data.slice(0, 100).map(row => String(row[index] || '').toUpperCase());
      const stateMatches = values.filter(v => auStates.includes(v)).length;
      if (stateMatches > values.length * 0.3) {
        indicators.stateColumn = index;
        indicators.detected = true;
      }
    });
  }

  return indicators;
}

function validateABN(data, abnColumn) {
  const validation = {
    total: 0,
    valid: 0,
    invalid: [],
    defunct: [],
    formatIssues: []
  };

  data.forEach((row, index) => {
    const abn = String(row[abnColumn] || '').replace(/\s/g, '');
    if (!abn) return;

    validation.total++;

    if (!/^\d{11}$/.test(abn)) {
      validation.formatIssues.push({
        row: index + 1,
        value: row[abnColumn],
        issue: 'Invalid format (must be 11 digits)'
      });
    } else if (isValidABN(abn)) {
      validation.valid++;
      
      if (isDefunctABN(abn)) {
        validation.defunct.push({
          row: index + 1,
          abn: abn,
          status: 'Defunct/cancelled'
        });
      }
    } else {
      validation.invalid.push({
        row: index + 1,
        abn: abn,
        issue: 'Invalid check digit'
      });
    }
  });

  validation.validRate = validation.total > 0 
    ? ((validation.valid / validation.total) * 100).toFixed(1) + '%'
    : 'N/A';

  return validation;
}

function isValidABN(abn) {
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(abn[i]);
    if (i === 0) {
      sum += (digit - 1) * weights[i];
    } else {
      sum += digit * weights[i];
    }
  }
  
  return sum % 89 === 0;
}

function isDefunctABN(abn) {
  const knownDefunct = ['51824753556', '48123123124'];
  return knownDefunct.includes(abn);
}

function validateACN(data, acnColumn) {
  const validation = {
    total: 0,
    valid: 0,
    invalid: [],
    formatIssues: []
  };

  data.forEach((row, index) => {
    const acn = String(row[acnColumn] || '').replace(/\s/g, '');
    if (!acn) return;

    validation.total++;

    if (!/^\d{9}$/.test(acn)) {
      validation.formatIssues.push({
        row: index + 1,
        value: row[acnColumn],
        issue: 'Invalid format (must be 9 digits)'
      });
    } else if (isValidACN(acn)) {
      validation.valid++;
    } else {
      validation.invalid.push({
        row: index + 1,
        acn: acn,
        issue: 'Invalid check digit'
      });
    }
  });

  validation.validRate = validation.total > 0 
    ? ((validation.valid / validation.total) * 100).toFixed(1) + '%'
    : 'N/A';

  return validation;
}

function isValidACN(acn) {
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(acn[i]) * weights[i];
  }
  
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  
  return parseInt(acn[8]) === checkDigit;
}

function validatePostcodes(data, postcodeColumn, stateColumn) {
  const validation = {
    total: 0,
    valid: 0,
    invalid: [],
    stateMismatches: [],
    distribution: {
      NSW: 0, VIC: 0, QLD: 0, SA: 0, 
      WA: 0, TAS: 0, NT: 0, ACT: 0
    }
  };

  const postcodeRanges = {
    NSW: [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]],
    VIC: [[3000, 3999], [8000, 8999]],
    QLD: [[4000, 4999], [9000, 9999]],
    SA: [[5000, 5799]],
    WA: [[6000, 6797], [6800, 6999]],
    TAS: [[7000, 7799]],
    NT: [[800, 899]],
    ACT: [[200, 299], [2600, 2618], [2900, 2920]]
  };

  data.forEach((row, index) => {
    const postcode = String(row[postcodeColumn] || '').trim();
    if (!postcode) return;

    validation.total++;

    if (!/^\d{4}$/.test(postcode)) {
      validation.invalid.push({
        row: index + 1,
        value: postcode,
        issue: 'Invalid format (must be 4 digits)'
      });
      return;
    }

    const pc = parseInt(postcode);
    let validState = null;

    for (const [state, ranges] of Object.entries(postcodeRanges)) {
      if (ranges.some(([min, max]) => pc >= min && pc <= max)) {
        validState = state;
        validation.distribution[state]++;
        validation.valid++;
        break;
      }
    }

    if (!validState) {
      validation.invalid.push({
        row: index + 1,
        value: postcode,
        issue: 'Not a valid Australian postcode'
      });
    } else if (stateColumn !== null) {
      const recordState = String(row[stateColumn] || '').toUpperCase();
      if (recordState && recordState !== validState) {
        validation.stateMismatches.push({
          row: index + 1,
          postcode: postcode,
          expectedState: validState,
          actualState: recordState
        });
      }
    }
  });

  validation.validRate = validation.total > 0 
    ? ((validation.valid / validation.total) * 100).toFixed(1) + '%'
    : 'N/A';

  Object.keys(validation.distribution).forEach(state => {
    if (validation.valid > 0) {
      validation.distribution[state] = 
        ((validation.distribution[state] / validation.valid) * 100).toFixed(1) + '%';
    }
  });

  return validation;
}

function validatePhoneNumbers(data, phoneColumns) {
  const validations = {};

  phoneColumns.forEach(phoneCol => {
    const validation = {
      total: 0,
      valid: { mobile: 0, landline: 0 },
      invalid: [],
      formatIssues: [],
      carrierDistribution: { Telstra: 0, Optus: 0, Vodafone: 0, Other: 0 }
    };

    data.forEach((row, index) => {
      const phone = String(row[phoneCol.index] || '').replace(/[\s\-\(\)]/g, '');
      if (!phone) return;

      validation.total++;

      const mobileResult = validateMobileNumber(phone);
      const landlineResult = validateLandlineNumber(phone);

      if (mobileResult.valid) {
        validation.valid.mobile++;
        validation.carrierDistribution[mobileResult.carrier]++;
      } else if (landlineResult.valid) {
        validation.valid.landline++;
      } else {
        validation.invalid.push({
          row: index + 1,
          value: row[phoneCol.index],
          issue: detectPhoneIssue(phone)
        });

        if (phone.match(/^4\d{8}$/)) {
          validation.formatIssues.push({
            row: index + 1,
            value: row[phoneCol.index],
            issue: 'Missing leading 0',
            suggestion: '0' + phone
          });
        }
      }
    });

    validation.validRate = validation.total > 0 
      ? (((validation.valid.mobile + validation.valid.landline) / validation.total) * 100).toFixed(1) + '%'
      : 'N/A';

    validation.breakdown = {
      mobile: `${((validation.valid.mobile / validation.total) * 100).toFixed(1)}%`,
      landline: `${((validation.valid.landline / validation.total) * 100).toFixed(1)}%`
    };

    validations[phoneCol.header] = validation;
  });

  return validations;
}

function validateMobileNumber(phone) {
  const patterns = {
    standard: /^(?:\+?61|0)?4\d{8}$/,
    international: /^\+614\d{8}$/
  };

  if (!patterns.standard.test(phone)) {
    return { valid: false };
  }

  const normalized = phone.replace(/^\+?61/, '0');
  const prefix = normalized.substring(0, 4);

  const carrierPrefixes = {
    Telstra: ['0400', '0401', '0402', '0403', '0404', '0405', '0406', '0407', '0408', '0409', 
              '0410', '0411', '0412', '0413', '0414', '0415', '0416', '0417', '0418', '0419'],
    Optus: ['0420', '0421', '0422', '0423', '0424', '0425', '0426', '0427', '0428', '0429',
            '0430', '0431', '0432', '0433', '0434', '0435'],
    Vodafone: ['0436', '0437', '0438', '0439', '0440', '0441', '0442', '0443', '0444', '0445',
               '0446', '0447', '0448', '0449', '0450']
  };

  let carrier = 'Other';
  for (const [name, prefixes] of Object.entries(carrierPrefixes)) {
    if (prefixes.includes(prefix)) {
      carrier = name;
      break;
    }
  }

  return { valid: true, carrier };
}

function validateLandlineNumber(phone) {
  const patterns = {
    standard: /^(?:\+?61|0)?[2-9]\d{8}$/,
    shortArea: /^(?:\+?61|0)?[2-9]\d{7}$/
  };

  return { 
    valid: patterns.standard.test(phone) || patterns.shortArea.test(phone) 
  };
}

function detectPhoneIssue(phone) {
  if (phone.length < 9) return 'Too short';
  if (phone.length > 10 && !phone.startsWith('+')) return 'Too long';
  if (!/^\+?\d+$/.test(phone)) return 'Contains non-numeric characters';
  if (phone.match(/^[2-9]\d{8}$/)) return 'Missing area code (0)';
  return 'Invalid Australian phone number format';
}

function validateAddresses(data, addressColumns) {
  const validation = {
    standardisationNeeded: [],
    abbreviationInconsistencies: [],
    suburbSpellingIssues: [],
    gnafMatchable: { count: 0, percentage: 0 }
  };

  const abbreviations = {
    'Street': ['St', 'St.', 'Str'],
    'Road': ['Rd', 'Rd.'],
    'Avenue': ['Ave', 'Ave.', 'Av'],
    'Place': ['Pl', 'Pl.'],
    'Drive': ['Dr', 'Dr.', 'Drv'],
    'Court': ['Ct', 'Ct.'],
    'Parade': ['Pde', 'Pde.', 'Prd']
  };

  addressColumns.forEach(addrCol => {
    const addressValues = data.map(row => String(row[addrCol.index] || ''));
    
    const inconsistencies = {};
    addressValues.forEach((address, index) => {
      if (!address) return;

      Object.entries(abbreviations).forEach(([full, abbrevs]) => {
        abbrevs.forEach(abbrev => {
          if (address.includes(` ${abbrev} `) || address.endsWith(` ${abbrev}`)) {
            if (!inconsistencies[full]) {
              inconsistencies[full] = { full: 0, abbreviated: {} };
            }
            inconsistencies[full].abbreviated[abbrev] = 
              (inconsistencies[full].abbreviated[abbrev] || 0) + 1;
          }
        });
        
        if (address.includes(` ${full} `) || address.endsWith(` ${full}`)) {
          if (!inconsistencies[full]) {
            inconsistencies[full] = { full: 0, abbreviated: {} };
          }
          inconsistencies[full].full++;
        }
      });
    });

    Object.entries(inconsistencies).forEach(([streetType, counts]) => {
      const total = counts.full + Object.values(counts.abbreviated).reduce((a, b) => a + b, 0);
      if (total > 10) {
        validation.abbreviationInconsistencies.push({
          field: addrCol.header,
          type: streetType,
          distribution: {
            full: `${counts.full} (${(counts.full/total*100).toFixed(0)}%)`,
            abbreviated: Object.entries(counts.abbreviated).map(([abbr, count]) => 
              `${abbr}: ${count} (${(count/total*100).toFixed(0)}%)`
            )
          }
        });
      }
    });

    const gnafMatches = addressValues.filter(addr => isGNAFMatchable(addr)).length;
    validation.gnafMatchable.count += gnafMatches;
  });

  const totalAddresses = data.length * addressColumns.length;
  validation.gnafMatchable.percentage = totalAddresses > 0
    ? ((validation.gnafMatchable.count / totalAddresses) * 100).toFixed(1) + '%'
    : 'N/A';

  return validation;
}

function isGNAFMatchable(address) {
  const gnafPattern = /^\d+\s+\w+\s+(Street|St|Road|Rd|Avenue|Ave|Place|Pl|Drive|Dr)/i;
  return gnafPattern.test(address);
}

function validateStates(data, stateColumn) {
  const validation = {
    total: 0,
    valid: 0,
    invalid: [],
    distribution: {},
    formatIssues: []
  };

  const validStates = {
    'NSW': 'New South Wales',
    'VIC': 'Victoria',
    'QLD': 'Queensland',
    'SA': 'South Australia',
    'WA': 'Western Australia',
    'TAS': 'Tasmania',
    'NT': 'Northern Territory',
    'ACT': 'Australian Capital Territory'
  };

  data.forEach((row, index) => {
    const state = String(row[stateColumn] || '').trim();
    if (!state) return;

    validation.total++;

    const stateUpper = state.toUpperCase();
    if (validStates[stateUpper]) {
      validation.valid++;
      validation.distribution[stateUpper] = (validation.distribution[stateUpper] || 0) + 1;
      
      if (state !== stateUpper) {
        validation.formatIssues.push({
          row: index + 1,
          value: state,
          issue: 'Inconsistent case',
          suggestion: stateUpper
        });
      }
    } else {
      const fullName = Object.values(validStates).find(name => 
        name.toLowerCase() === state.toLowerCase()
      );
      
      if (fullName) {
        const abbreviation = Object.keys(validStates).find(key => 
          validStates[key] === fullName
        );
        validation.formatIssues.push({
          row: index + 1,
          value: state,
          issue: 'Full name instead of abbreviation',
          suggestion: abbreviation
        });
      } else {
        validation.invalid.push({
          row: index + 1,
          value: state,
          issue: 'Not a valid Australian state/territory'
        });
      }
    }
  });

  validation.validRate = validation.total > 0 
    ? ((validation.valid / validation.total) * 100).toFixed(1) + '%'
    : 'N/A';

  Object.keys(validation.distribution).forEach(state => {
    validation.distribution[state] = 
      `${validation.distribution[state]} (${(validation.distribution[state]/validation.valid*100).toFixed(1)}%)`;
  });

  return validation;
}