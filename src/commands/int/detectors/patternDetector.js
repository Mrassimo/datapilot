export function detectPatterns(data, headers, columnTypes) {
  const patterns = {
    hiddenPatterns: [],
    systemPatterns: [],
    employeePatterns: [],
    testDataPatterns: []
  };

  detectHiddenPatterns(data, headers, patterns);
  detectSystemAccounts(data, headers, patterns);
  detectEmployeePatterns(data, headers, patterns);
  detectTestDataPatterns(data, headers, patterns);

  return patterns;
}

function detectHiddenPatterns(data, headers, patterns) {
  const idColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('id'));

  idColumns.forEach(idCol => {
    const suffixPatterns = analyseSuffixPatterns(data, idCol.index, headers);
    
    suffixPatterns.forEach(pattern => {
      if (pattern.correlation > 0.9) {
        patterns.hiddenPatterns.push({
          type: 'ID_SUFFIX_PATTERN',
          field: idCol.header,
          pattern: pattern.suffix,
          correlation: pattern.correlation,
          affectedRecords: pattern.count,
          associatedBehavior: pattern.behavior,
          recommendation: pattern.recommendation
        });
      }
    });
  });

  const emailColumn = headers.findIndex(h => h.toLowerCase().includes('email'));
  if (emailColumn !== -1) {
    const domainPatterns = analyseDomainPatterns(data, emailColumn, headers);
    patterns.hiddenPatterns.push(...domainPatterns);
  }

  const discountPatterns = analyseDiscountPatterns(data, headers);
  patterns.hiddenPatterns.push(...discountPatterns);
}

function analyseSuffixPatterns(data, idColIndex, headers) {
  const suffixGroups = {
    '999': { records: [], metrics: {} },
    '000': { records: [], metrics: {} },
    '888': { records: [], metrics: {} },
    '777': { records: [], metrics: {} }
  };

  data.forEach((row, index) => {
    const id = String(row[idColIndex] || '');
    Object.keys(suffixGroups).forEach(suffix => {
      if (id.endsWith(suffix)) {
        suffixGroups[suffix].records.push({ row, index });
      }
    });
  });

  const patterns = [];
  
  Object.entries(suffixGroups).forEach(([suffix, group]) => {
    if (group.records.length === 0) return;

    headers.forEach((header, colIndex) => {
      if (colIndex === idColIndex) return;
      
      const values = group.records.map(r => r.row[colIndex]);
      const analysis = analyseValueDistribution(values, data.map(row => row[colIndex]));
      
      if (analysis.deviation > 2) {
        patterns.push({
          suffix: suffix,
          count: group.records.length,
          correlation: analysis.correlation,
          behavior: {
            field: header,
            deviation: analysis.deviation,
            average: analysis.average,
            populationAverage: analysis.populationAverage
          },
          recommendation: generateRecommendation(suffix, header, analysis)
        });
      }
    });
  });

  return patterns;
}

function analyseValueDistribution(groupValues, allValues) {
  const numericGroup = groupValues
    .filter(v => v !== null && !isNaN(parseFloat(v)))
    .map(v => parseFloat(v));
  
  const numericAll = allValues
    .filter(v => v !== null && !isNaN(parseFloat(v)))
    .map(v => parseFloat(v));

  if (numericGroup.length === 0 || numericAll.length === 0) {
    return { deviation: 0, correlation: 0 };
  }

  const groupAvg = numericGroup.reduce((a, b) => a + b, 0) / numericGroup.length;
  const allAvg = numericAll.reduce((a, b) => a + b, 0) / numericAll.length;
  const allStdDev = calculateStdDev(numericAll);

  const deviation = allStdDev > 0 ? Math.abs(groupAvg - allAvg) / allStdDev : 0;
  const correlation = deviation > 2 ? 0.95 : deviation / 2;

  return {
    deviation: deviation,
    correlation: correlation,
    average: groupAvg,
    populationAverage: allAvg,
    stdDev: allStdDev
  };
}

function calculateStdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

function generateRecommendation(suffix, field, analysis) {
  const fieldLower = field.toLowerCase();
  
  if (suffix === '999' && fieldLower.includes('discount')) {
    return 'Add explicit employee flag - these appear to be employee accounts';
  } else if (suffix === '000' && analysis.average === 0) {
    return 'Add system account flag - these appear to be test/system accounts';
  } else if (fieldLower.includes('shipping') && analysis.average === 0) {
    return 'Consider flagging as special handling accounts';
  }
  
  return 'Investigate this pattern for business logic';
}

function analyseDomainPatterns(data, emailColIndex, headers) {
  const domainStats = {};
  
  data.forEach((row, index) => {
    const email = row[emailColIndex];
    if (!email || !email.includes('@')) return;
    
    const domain = email.split('@')[1].toLowerCase();
    if (!domainStats[domain]) {
      domainStats[domain] = {
        count: 0,
        records: [],
        metrics: {}
      };
    }
    
    domainStats[domain].count++;
    domainStats[domain].records.push({ row, index });
  });

  const patterns = [];
  const companyDomains = ['company.com', 'internal.com', 'test.com'];
  
  Object.entries(domainStats).forEach(([domain, stats]) => {
    if (stats.count < 5) return;
    
    const isCompanyDomain = companyDomains.some(cd => domain.includes(cd));
    
    headers.forEach((header, colIndex) => {
      if (colIndex === emailColIndex) return;
      
      const domainValues = stats.records.map(r => r.row[colIndex]);
      const allValues = data.map(row => row[colIndex]);
      const analysis = analyseValueDistribution(domainValues, allValues);
      
      if (analysis.deviation > 2 || (isCompanyDomain && analysis.deviation > 1)) {
        patterns.push({
          type: 'EMAIL_DOMAIN_PATTERN',
          domain: domain,
          recordCount: stats.count,
          behavior: {
            field: header,
            averageValue: analysis.average,
            populationAverage: analysis.populationAverage,
            deviation: analysis.deviation
          },
          interpretation: isCompanyDomain ? 'Internal/employee accounts' : 'Special customer segment',
          recommendation: `Add account type flag for ${domain} users`
        });
      }
    });
  });

  return patterns;
}

function analyseDiscountPatterns(data, headers) {
  const patterns = [];
  const discountColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('discount'));

  if (discountColumns.length === 0) return patterns;

  discountColumns.forEach(discountCol => {
    const discountGroups = {};
    
    data.forEach((row, index) => {
      const discount = parseFloat(row[discountCol.index]);
      if (isNaN(discount) || discount === 0) return;
      
      const discountLevel = Math.round(discount);
      if (!discountGroups[discountLevel]) {
        discountGroups[discountLevel] = [];
      }
      discountGroups[discountLevel].push({ row, index });
    });

    Object.entries(discountGroups).forEach(([level, records]) => {
      if (records.length < 5) return;
      
      const correlations = findDiscountCorrelations(records, data, headers);
      correlations.forEach(correlation => {
        patterns.push({
          type: 'DISCOUNT_CORRELATION',
          discountLevel: `${level}%`,
          recordCount: records.length,
          correlatedField: correlation.field,
          correlation: correlation.strength,
          pattern: correlation.pattern,
          recommendation: 'Document discount eligibility rules'
        });
      });
    });
  });

  return patterns;
}

function findDiscountCorrelations(discountRecords, allData, headers) {
  const correlations = [];
  
  headers.forEach((header, colIndex) => {
    const values = discountRecords.map(r => r.row[colIndex]);
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 1 && discountRecords.length > 5) {
      correlations.push({
        field: header,
        strength: 1.0,
        pattern: `Always "${uniqueValues[0]}" for this discount level`
      });
    } else if (uniqueValues.length < discountRecords.length * 0.2) {
      const dominant = getMostFrequent(values);
      const dominantPercentage = values.filter(v => v === dominant).length / values.length;
      
      if (dominantPercentage > 0.8) {
        correlations.push({
          field: header,
          strength: dominantPercentage,
          pattern: `Usually "${dominant}" (${(dominantPercentage * 100).toFixed(0)}%)`
        });
      }
    }
  });

  return correlations;
}

function detectSystemAccounts(data, headers, patterns) {
  const usernameColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('username') || 
                   col.header.toLowerCase().includes('user_name') ||
                   col.header.toLowerCase().includes('login'));

  if (usernameColumns.length === 0) return;

  usernameColumns.forEach(userCol => {
    const systemPatterns = [
      { regex: /^test\d{3}$/i, type: 'Test accounts (test001-test999)' },
      { regex: /^admin\d*$/i, type: 'Admin accounts' },
      { regex: /^system\d*$/i, type: 'System accounts' },
      { regex: /^demo\d*$/i, type: 'Demo accounts' },
      { regex: /^guest\d*$/i, type: 'Guest accounts' },
      { regex: /^bot_/i, type: 'Bot accounts' }
    ];

    systemPatterns.forEach(pattern => {
      const matches = data.filter((row, index) => {
        const username = row[userCol.index];
        return username && pattern.regex.test(username);
      });

      if (matches.length > 0) {
        const analysis = analyseSystemAccountBehavior(matches, data, headers, userCol.index);
        
        patterns.systemPatterns.push({
          type: 'SYSTEM_ACCOUNT_PATTERN',
          pattern: pattern.type,
          count: matches.length,
          field: userCol.header,
          behavior: analysis,
          recommendation: `Exclude ${pattern.type} from business analytics`,
          impact: 'May skew metrics if included in analysis'
        });
      }
    });
  });
}

function analyseSystemAccountBehavior(systemRecords, allData, headers, userColIndex) {
  const behavior = {
    zeroRevenue: 0,
    noActivity: 0,
    characteristics: []
  };

  const revenueColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('revenue') || 
                   col.header.toLowerCase().includes('amount') ||
                   col.header.toLowerCase().includes('total'));

  revenueColumns.forEach(revCol => {
    const zeroCount = systemRecords.filter(row => {
      const value = parseFloat(row[revCol.index]);
      return value === 0 || isNaN(value);
    }).length;

    if (zeroCount === systemRecords.length) {
      behavior.zeroRevenue++;
      behavior.characteristics.push(`${revCol.header}: always zero`);
    }
  });

  const activityColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('last_login') || 
                   col.header.toLowerCase().includes('last_active'));

  activityColumns.forEach(actCol => {
    const nullCount = systemRecords.filter(row => 
      !row[actCol.index] || row[actCol.index] === ''
    ).length;

    if (nullCount > systemRecords.length * 0.8) {
      behavior.noActivity++;
      behavior.characteristics.push(`${actCol.header}: mostly empty`);
    }
  });

  return behavior;
}

function detectEmployeePatterns(data, headers, patterns) {
  const indicators = [];

  const emailColumn = headers.findIndex(h => h.toLowerCase().includes('email'));
  if (emailColumn !== -1) {
    const employeeEmails = data.filter(row => {
      const email = row[emailColumn];
      return email && (
        email.endsWith('@company.com') ||
        email.endsWith('@internal.com') ||
        email.includes('+employee@')
      );
    });

    if (employeeEmails.length > 0) {
      const behavior = analyseEmployeeBehavior(employeeEmails, data, headers, emailColumn);
      indicators.push({
        indicator: 'Email domain pattern',
        count: employeeEmails.length,
        behavior: behavior
      });
    }
  }

  const discountColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('discount'));

  discountColumns.forEach(discCol => {
    const highDiscountThreshold = 30;
    const highDiscountRecords = data.filter(row => {
      const discount = parseFloat(row[discCol.index]);
      return !isNaN(discount) && discount >= highDiscountThreshold;
    });

    if (highDiscountRecords.length > 0) {
      const emailMatches = emailColumn !== -1 ? 
        highDiscountRecords.filter(row => {
          const email = row[emailColumn];
          return email && email.includes('@company.com');
        }).length : 0;

      if (emailMatches > highDiscountRecords.length * 0.5) {
        indicators.push({
          indicator: `High discount (>=${highDiscountThreshold}%)`,
          count: highDiscountRecords.length,
          correlation: 'Strongly correlated with company email domain'
        });
      }
    }
  });

  if (indicators.length > 0) {
    patterns.employeePatterns.push({
      type: 'EMPLOYEE_ACCOUNT_INDICATORS',
      indicators: indicators,
      recommendation: 'Add explicit employee flag to database',
      benefits: [
        'Accurate business metrics',
        'Employee purchase tracking',
        'Discount policy compliance'
      ]
    });
  }
}

function analyseEmployeeBehavior(employeeRecords, allData, headers, emailColIndex) {
  const behavior = {
    averageDiscount: null,
    freeShipping: null,
    orderFrequency: null
  };

  const discountCol = headers.findIndex(h => h.toLowerCase().includes('discount'));
  if (discountCol !== -1) {
    const discounts = employeeRecords
      .map(row => parseFloat(row[discountCol]))
      .filter(v => !isNaN(v));
    
    if (discounts.length > 0) {
      behavior.averageDiscount = discounts.reduce((a, b) => a + b, 0) / discounts.length;
    }
  }

  const shippingCol = headers.findIndex(h => h.toLowerCase().includes('shipping'));
  if (shippingCol !== -1) {
    const freeShippingCount = employeeRecords.filter(row => {
      const shipping = parseFloat(row[shippingCol]);
      return shipping === 0 || isNaN(shipping);
    }).length;
    
    behavior.freeShipping = (freeShippingCount / employeeRecords.length) * 100;
  }

  return behavior;
}

function detectTestDataPatterns(data, headers, patterns) {
  const suspiciousPatterns = [];

  const nameColumns = headers.map((h, i) => ({ header: h, index: i }))
    .filter(col => col.header.toLowerCase().includes('name') && 
                   !col.header.toLowerCase().includes('username'));

  nameColumns.forEach(nameCol => {
    const testNames = [
      'Test', 'Demo', 'Sample', 'Example', 'Dummy',
      'John Doe', 'Jane Doe', 'Mickey Mouse', 'Donald Duck',
      'AAAAA', 'XXXXX', 'asdf', 'qwerty'
    ];

    const testRecords = data.filter(row => {
      const name = row[nameCol.index];
      return name && testNames.some(testName => 
        name.toLowerCase().includes(testName.toLowerCase())
      );
    });

    if (testRecords.length > 0) {
      suspiciousPatterns.push({
        field: nameCol.header,
        count: testRecords.length,
        percentage: ((testRecords.length / data.length) * 100).toFixed(1),
        examples: [...new Set(testRecords.map(r => r[nameCol.index]))].slice(0, 5)
      });
    }
  });

  const sequentialPatterns = detectSequentialPatterns(data, headers);
  suspiciousPatterns.push(...sequentialPatterns);

  if (suspiciousPatterns.length > 0) {
    patterns.testDataPatterns.push({
      type: 'TEST_DATA_INDICATORS',
      patterns: suspiciousPatterns,
      totalSuspiciousRecords: [...new Set(suspiciousPatterns.flatMap(p => p.records || []))].length,
      recommendation: 'Review and clean test data from production',
      impact: 'Test data can skew analytics and reports'
    });
  }
}

function detectSequentialPatterns(data, headers) {
  const patterns = [];

  headers.forEach((header, colIndex) => {
    const values = data.map(row => row[colIndex]).filter(v => v !== null && v !== '');
    
    const sequentialGroups = findSequentialValues(values);
    
    sequentialGroups.forEach(group => {
      if (group.length >= 5) {
        patterns.push({
          field: header,
          type: 'Sequential values',
          count: group.length,
          sequence: `${group[0]} to ${group[group.length - 1]}`,
          interpretation: 'Likely auto-generated test data'
        });
      }
    });
  });

  return patterns;
}

function findSequentialValues(values) {
  const groups = [];
  const numericValues = values
    .map((v, i) => ({ value: v, index: i, numeric: parseFloat(v) }))
    .filter(v => !isNaN(v.numeric))
    .sort((a, b) => a.numeric - b.numeric);

  let currentGroup = [];
  
  for (let i = 0; i < numericValues.length - 1; i++) {
    if (currentGroup.length === 0) {
      currentGroup.push(numericValues[i].numeric);
    }
    
    if (numericValues[i + 1].numeric - numericValues[i].numeric === 1) {
      currentGroup.push(numericValues[i + 1].numeric);
    } else {
      if (currentGroup.length >= 5) {
        groups.push(currentGroup);
      }
      currentGroup = [];
    }
  }
  
  if (currentGroup.length >= 5) {
    groups.push(currentGroup);
  }

  return groups;
}

function getMostFrequent(arr) {
  const counts = {};
  let maxCount = 0;
  let mostFrequent = null;
  
  arr.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      mostFrequent = val;
    }
  });
  
  return mostFrequent;
}