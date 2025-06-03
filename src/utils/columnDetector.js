/**
 * Centralized Column Detection Utility
 * Consolidates all column type detection and pattern analysis logic
 * Eliminates duplication across EDA, INT, VIS, and analysis engines
 */

import chalk from 'chalk';

// Consolidated regex patterns - single source of truth
export const PATTERNS = {
  // Australian-specific patterns (prioritized)
  australian: {
    postcode: /^[0-9]{4}$/,
    phone: /^(\+61\s?)?(\(0\d\)\s?|\d{2}\s?)\d{4}\s?\d{4}$|^04\d{2}\s?\d{3}\s?\d{3}$/,
    states: /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i,
    stateNames: /^(New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania|Australian Capital Territory|Northern Territory)$/i
  },
  
  // International patterns
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?(www\.)?[\w\-]+\.[\w\-]+(\.[\w\-]+)*\/?/,
  phone: /^[\d\s\-\+\(\)\.ext]+$/i,
  
  // Data format patterns
  date: {
    iso: /^\d{4}-\d{2}-\d{2}$/,
    isoDateTime: /^\d{4}-\d{2}-\d{2}T/,
    australian: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    europeanDash: /^\d{1,2}-\d{1,2}-\d{4}$/,
    europeanDot: /^\d{1,2}\.\d{1,2}\.\d{4}$/,
    monthText: /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    textMonth: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i
  },
  
  // Numeric patterns
  currency: /^[$€£¥₹][\d,]+\.?\d*$|^[\d,]+\.?\d*\s*[$€£¥₹]$/,
  percentage: /^\d+\.?\d*\s*%$/,
  number: /^[\d\s,.$€£¥₹%-]+$/,
  
  // System patterns
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ip: /^(\d{1,3}\.){3}\d{1,3}$/,
  
  // Business patterns
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  iban: /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/,
  
  // Healthcare-specific patterns
  medical: {
    bloodType: /^(A|B|AB|O)[+-]$/,
    medicalCondition: /^(cancer|diabetes|hypertension|asthma|obesity|arthritis|heart\s*disease|stroke)$/i,
    medication: /^(paracetamol|ibuprofen|aspirin|lipitor|penicillin|metformin|lisinopril)$/i,
    testResult: /^(normal|abnormal|inconclusive|positive|negative)$/i,
    admissionType: /^(emergency|elective|urgent|routine)$/i,
    gender: /^(male|female|m|f)$/i
  },
  
  // Insurance patterns  
  insurance: {
    provider: /^(blue\s*cross|medicare|aetna|cigna|unitedhealthcare|humana)$/i,
    billing: /^\$?\d{1,6}(\.\d{2})?$/
  }
};

// Geographic keywords - single source of truth
export const GEOGRAPHIC_KEYWORDS = [
  'state', 'country', 'city', 'region', 'location', 'address', 'suburb',
  'postcode', 'zip', 'zipcode', 'postal', 'latitude', 'longitude', 
  'lat', 'lon', 'lng', 'coordinates', 'coord', 'geo', 'territory',
  'province', 'county', 'district', 'area', 'zone', 'locale'
];

// Business domain keywords
export const BUSINESS_KEYWORDS = {
  financial: ['amount', 'price', 'cost', 'fee', 'charge', 'payment', 'salary', 'revenue', 'profit', 'loss', 'balance', 'total', 'sum', 'billing'],
  temporal: ['date', 'time', 'created', 'updated', 'modified', 'timestamp', 'year', 'month', 'day', 'hour', 'minute', 'admission', 'discharge'],
  identity: ['id', 'uuid', 'guid', 'key', 'reference', 'ref', 'code', 'number', 'serial', 'patient', 'record'],
  personal: ['name', 'email', 'phone', 'address', 'age', 'gender', 'title', 'first', 'last', 'middle'],
  quality: ['status', 'type', 'category', 'class', 'group', 'level', 'rank', 'grade', 'score', 'rating', 'result'],
  healthcare: ['patient', 'doctor', 'hospital', 'medical', 'medication', 'treatment', 'diagnosis', 'condition', 'blood', 'test', 'room'],
  insurance: ['insurance', 'provider', 'coverage', 'claim', 'policy', 'premium', 'deductible']
};

/**
 * Enhanced number parsing with comprehensive format support
 */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Reject date-like patterns before attempting number parsing
  if (PATTERNS.date.iso.test(trimmed) || 
      PATTERNS.date.australian.test(trimmed) ||
      PATTERNS.date.europeanDash.test(trimmed)) {
    return null;
  }
  
  // Remove currency symbols and spaces
  let cleaned = trimmed.replace(/[$€£¥₹\s]/g, '');
  
  // Handle different decimal separators
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Determine which is decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator (European format)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator (US format)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Check if comma is thousands separator or decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousands separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  // Check for percentage
  if (cleaned.endsWith('%')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num / 100;
  }
  
  // Try parsing
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Enhanced date parsing with Australian format priority
 */
export function parseDate(value, prioritizeAustralian = true) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Check if it matches date patterns
  const hasDatePattern = Object.values(PATTERNS.date).some(pattern => pattern.test(trimmed));
  if (!hasDatePattern) return null;
  
  // For DD/MM/YYYY format (Australian), parse explicitly if prioritized
  if (prioritizeAustralian && PATTERNS.date.australian.test(trimmed)) {
    const separator = trimmed.includes('/') ? '/' : trimmed.includes('-') ? '-' : '.';
    const parts = trimmed.split(separator);
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Validate day and month
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const date = new Date(year, month - 1, day);
      
      // Verify the date is valid
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  // Try standard Date parsing for other formats
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Comprehensive column value analysis
 * Consolidates all type detection logic from parser.js and other files
 */
export function analyzeColumnValues(values, totalRecords, options = {}) {
  const { 
    prioritizeAustralian = true,
    confidenceThreshold = 0.7,
    maxSampleSize = 1000
  } = options;

  const typeVotes = {
    integer: 0,
    float: 0,
    date: 0,
    email: 0,
    phone: 0,
    postcode: 0,
    boolean: 0,
    url: 0,
    currency: 0,
    uuid: 0,
    ip: 0,
    creditCard: 0,
    percentage: 0
  };
  
  const dateFormats = new Set();
  const sampleValues = [];
  const businessContexts = new Set();
  
  // Sample values for performance on large datasets
  const sampleSize = Math.min(maxSampleSize, values.length);
  const sampledValues = values.length > sampleSize 
    ? values.slice(0, sampleSize) 
    : values;
  
  for (const value of sampledValues) {
    // Keep sample values
    if (sampleValues.length < 5 && typeof value === 'string') {
      sampleValues.push(value);
    }
    
    // Check for boolean first
    if (typeof value === 'boolean') {
      typeVotes.boolean++;
      continue;
    }
    
    // Check for Date objects (created during CSV parsing)
    if (value instanceof Date) {
      typeVotes.date++;
      if (sampleValues.length < 5) {
        sampleValues.push(value.toISOString().split('T')[0]);
      }
      continue;
    }
    
    // Check numbers
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        typeVotes.integer++;
      } else {
        typeVotes.float++;
      }
      continue;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Percentage check
      if (PATTERNS.percentage.test(trimmed)) {
        typeVotes.percentage++;
      }
      
      // Currency check
      if (PATTERNS.currency.test(trimmed)) {
        typeVotes.currency++;
        typeVotes.float++; // Also count as float
      }
      
      // Boolean check
      if (['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed.toLowerCase())) {
        typeVotes.boolean++;
      }
      
      // Email check
      if (PATTERNS.email.test(trimmed)) {
        typeVotes.email++;
        businessContexts.add('communication');
      }
      
      // URL check
      if (PATTERNS.url.test(trimmed)) {
        typeVotes.url++;
        businessContexts.add('web');
      }
      
      // UUID check
      if (PATTERNS.uuid.test(trimmed)) {
        typeVotes.uuid++;
        businessContexts.add('system');
      }
      
      // IP address check
      if (PATTERNS.ip.test(trimmed)) {
        typeVotes.ip++;
        businessContexts.add('network');
      }
      
      // Credit card check
      if (PATTERNS.creditCard.test(trimmed)) {
        typeVotes.creditCard++;
        businessContexts.add('financial');
      }
      
      // Healthcare-specific pattern checks
      if (PATTERNS.medical.bloodType.test(trimmed)) {
        typeVotes.bloodType = (typeVotes.bloodType || 0) + 1;
        businessContexts.add('healthcare');
      }
      
      if (PATTERNS.medical.medicalCondition.test(trimmed)) {
        typeVotes.medicalCondition = (typeVotes.medicalCondition || 0) + 1;
        businessContexts.add('healthcare');
      }
      
      if (PATTERNS.medical.medication.test(trimmed)) {
        typeVotes.medication = (typeVotes.medication || 0) + 1;
        businessContexts.add('healthcare');
      }
      
      if (PATTERNS.medical.testResult.test(trimmed)) {
        typeVotes.testResult = (typeVotes.testResult || 0) + 1;
        businessContexts.add('healthcare');
      }
      
      if (PATTERNS.medical.admissionType.test(trimmed)) {
        typeVotes.admissionType = (typeVotes.admissionType || 0) + 1;
        businessContexts.add('healthcare');
      }
      
      if (PATTERNS.medical.gender.test(trimmed)) {
        typeVotes.gender = (typeVotes.gender || 0) + 1;
        businessContexts.add('personal');
      }
      
      // Insurance pattern checks
      if (PATTERNS.insurance.provider.test(trimmed)) {
        typeVotes.insuranceProvider = (typeVotes.insuranceProvider || 0) + 1;
        businessContexts.add('insurance');
      }
      
      // Phone check (enhanced for international formats)
      if (!PATTERNS.date.iso.test(trimmed) && 
          !PATTERNS.date.australian.test(trimmed)) {
        
        // Australian phone check first if prioritized
        if (prioritizeAustralian && PATTERNS.australian.phone.test(trimmed)) {
          typeVotes.phone++;
          businessContexts.add('contact');
        } else {
          const phoneDigits = trimmed.replace(/[^\d]/g, '');
          if (phoneDigits.length >= 8 && phoneDigits.length <= 15 && 
              PATTERNS.phone.test(trimmed)) {
            typeVotes.phone++;
            businessContexts.add('contact');
          }
        }
      }
      
      // Australian postcode
      if (PATTERNS.australian.postcode.test(trimmed)) {
        typeVotes.postcode++;
        businessContexts.add('geographic');
      }
      
      // Date detection with format tracking
      if (Object.values(PATTERNS.date).some(pattern => pattern.test(trimmed))) {
        typeVotes.date++;
        businessContexts.add('temporal');
        
        // Track date format
        if (PATTERNS.date.iso.test(trimmed)) {
          dateFormats.add('YYYY-MM-DD');
        } else if (PATTERNS.date.australian.test(trimmed)) {
          dateFormats.add('DD/MM/YYYY');
        } else if (PATTERNS.date.europeanDash.test(trimmed)) {
          dateFormats.add('DD-MM-YYYY');
        } else if (PATTERNS.date.europeanDot.test(trimmed)) {
          dateFormats.add('DD.MM.YYYY');
        }
      }
      
      // Number check
      const num = parseNumber(trimmed);
      if (num !== null) {
        if (Number.isInteger(num)) {
          typeVotes.integer++;
        } else {
          typeVotes.float++;
        }
      }
    }
  }
  
  // Determine type with confidence
  const totalVotes = sampledValues.length;
  let bestType = 'string';
  let bestScore = 0;
  let confidence = 0;
  
  // Create prioritized list to handle ties (specialized types win over generic)
  const typePriority = [
    'uuid', 'creditCard', 'ip', 'email', 'url', 'phone', 'postcode',
    'bloodType', 'medicalCondition', 'medication', 'testResult', 'admissionType', 'gender', 'insuranceProvider',
    'date', 'boolean', 'percentage', 'currency', 'float', 'integer'
  ];
  
  for (const type of typePriority) {
    if (typeVotes[type] > 0) {
      const score = typeVotes[type] / totalVotes;
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
        confidence = score;
      }
    }
  }
  
  // Special handling for numeric types
  if (bestType === 'integer' || bestType === 'float' || bestType === 'currency' || bestType === 'percentage') {
    const numericVotes = typeVotes.integer + typeVotes.float + typeVotes.currency + typeVotes.percentage;
    if (numericVotes / totalVotes > 0.9) {
      // Determine specific numeric type
      if (typeVotes.percentage > 0) bestType = 'percentage';
      else if (typeVotes.currency > 0) bestType = 'currency';
      else if (typeVotes.float > 0) bestType = 'float';
      else bestType = 'integer';
      
      confidence = numericVotes / totalVotes;
      businessContexts.add('quantitative');
    }
  }
  
  // Check for categorical
  const uniqueValues = [...new Set(values.filter(v => typeof v === 'string'))];
  const maxCategorical = Math.max(Math.min(20, totalRecords * 0.5), 5); // At least 5, up to 20, or 50% of records
  if (bestType === 'string' && uniqueValues.length <= maxCategorical && uniqueValues.length > 0) {
    return {
      type: 'categorical',
      categories: uniqueValues.sort(),
      confidence: 1.0,
      uniqueCount: uniqueValues.length,
      sampleValues: sampleValues.slice(0, 3),
      businessContext: Array.from(businessContexts)
    };
  }
  
  // Check for identifier
  const allUniqueValues = [...new Set(values)];
  if (bestType === 'string' && allUniqueValues.length > totalRecords * 0.95) {
    return {
      type: 'identifier',
      confidence: allUniqueValues.length / totalRecords,
      uniqueCount: allUniqueValues.length,
      sampleValues: sampleValues.slice(0, 3),
      businessContext: Array.from(businessContexts)
    };
  }
  
  // Prepare result
  const result = {
    type: bestType,
    confidence: confidence,
    sampleValues: sampleValues.slice(0, 3),
    businessContext: Array.from(businessContexts)
  };
  
  // Add type-specific metadata
  if (bestType === 'date' && dateFormats.size > 0) {
    result.formats = Array.from(dateFormats);
  }
  
  if (['integer', 'float', 'currency', 'percentage'].includes(bestType)) {
    const numbers = values.map(v => parseNumber(v)).filter(n => n !== null);
    if (numbers.length > 0) {
      result.min = Math.min(...numbers);
      result.max = Math.max(...numbers);
      result.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      result.uniqueCount = [...new Set(numbers)].length;
    }
  }
  
  return result;
}

/**
 * Detect column business context based on name and type
 */
export function detectColumnContext(columnName, columnType, values = []) {
  const name = columnName.toLowerCase();
  const contexts = new Set();
  
  // Check against business keyword patterns
  for (const [context, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      contexts.add(context);
    }
  }
  
  // Geographic detection
  if (GEOGRAPHIC_KEYWORDS.some(keyword => name.includes(keyword))) {
    contexts.add('geographic');
  }
  
  // Type-based context
  if (columnType.type === 'date') contexts.add('temporal');
  if (['integer', 'float', 'currency', 'percentage'].includes(columnType.type)) contexts.add('quantitative');
  if (columnType.type === 'email') contexts.add('communication');
  if (columnType.type === 'phone') contexts.add('contact');
  if (['uuid', 'identifier'].includes(columnType.type)) contexts.add('system');
  
  return Array.from(contexts);
}

/**
 * Check if column contains geographic data
 */
export function isGeographicColumn(columnName, columnType, values = []) {
  const name = columnName.toLowerCase();
  
  // Check column name
  const hasGeoKeyword = GEOGRAPHIC_KEYWORDS.some(keyword => name.includes(keyword));
  if (hasGeoKeyword) return true;
  
  // Check Australian patterns
  if (columnType.type === 'postcode') return true;
  
  // Check for state patterns in values
  if (values.length > 0) {
    const sampleValues = values.slice(0, 10).map(v => String(v).trim());
    const stateMatches = sampleValues.filter(v => 
      PATTERNS.australian.states.test(v) || PATTERNS.australian.stateNames.test(v)
    );
    return stateMatches.length > sampleValues.length * 0.5;
  }
  
  return false;
}

/**
 * Enhanced column type detection that uses all consolidated logic
 */
export function detectColumnTypes(records, options = {}) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return {};
  }
  
  if (!records[0] || typeof records[0] !== 'object') {
    return {};
  }
  
  const columns = Object.keys(records[0]);
  const columnTypes = {};
  
  // Sample records for type detection on large datasets
  const sampleSize = Math.min(options.maxSampleSize || 1000, records.length);
  const sampledRecords = records.length > sampleSize 
    ? records.slice(0, sampleSize) 
    : records;
  
  for (const [index, column] of columns.entries()) {
    const values = sampledRecords.map(r => r[column]).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) {
      columnTypes[column] = { 
        type: 'empty', 
        nullable: true,
        confidence: 1.0,
        businessContext: []
      };
      continue;
    }
    
    // Use consolidated analysis
    const analysis = analyzeColumnValues(values, records.length, options);
    
    // Add additional metadata
    const contexts = detectColumnContext(column, analysis, values);
    const isGeographic = isGeographicColumn(column, analysis, values);
    
    columnTypes[column] = {
      ...analysis,
      nullable: records.some(r => r[column] === null || r[column] === undefined),
      nullCount: records.filter(r => r[column] === null || r[column] === undefined).length,
      nullPercentage: (records.filter(r => r[column] === null || r[column] === undefined).length / records.length * 100).toFixed(1),
      businessContext: contexts,
      isGeographic
    };
  }
  
  return columnTypes;
}

/**
 * Get columns by type - utility function for analysis modules
 */
export function getColumnsByType(columnTypes, targetTypes) {
  const types = Array.isArray(targetTypes) ? targetTypes : [targetTypes];
  return Object.keys(columnTypes).filter(col => 
    types.includes(columnTypes[col].type)
  );
}

/**
 * Get numeric columns - commonly used utility
 */
export function getNumericColumns(columnTypes) {
  return getColumnsByType(columnTypes, ['integer', 'float', 'currency', 'percentage']);
}

/**
 * Get categorical columns - commonly used utility
 */
export function getCategoricalColumns(columnTypes) {
  return getColumnsByType(columnTypes, ['categorical', 'boolean']);
}

/**
 * Get date columns - commonly used utility
 */
export function getDateColumns(columnTypes) {
  return getColumnsByType(columnTypes, 'date');
}

/**
 * Get geographic columns - commonly used utility
 */
export function getGeographicColumns(columnTypes) {
  return Object.keys(columnTypes).filter(col => 
    columnTypes[col].isGeographic || 
    columnTypes[col].type === 'postcode' ||
    columnTypes[col].businessContext?.includes('geographic')
  );
}

/**
 * Column analysis summary for reporting
 */
export function generateColumnSummary(columnTypes) {
  const summary = {
    total: Object.keys(columnTypes).length,
    byType: {},
    byContext: {},
    geographic: 0,
    nullable: 0,
    highCardinality: 0
  };
  
  for (const [column, type] of Object.entries(columnTypes)) {
    // Count by type
    summary.byType[type.type] = (summary.byType[type.type] || 0) + 1;
    
    // Count by business context
    if (type.businessContext) {
      type.businessContext.forEach(context => {
        summary.byContext[context] = (summary.byContext[context] || 0) + 1;
      });
    }
    
    // Count special characteristics
    if (type.isGeographic) summary.geographic++;
    if (type.nullable) summary.nullable++;
    if (type.uniqueCount && type.uniqueCount > 100) summary.highCardinality++;
  }
  
  return summary;
}

// Export consolidated utilities
export default {
  detectColumnTypes,
  analyzeColumnValues,
  detectColumnContext,
  isGeographicColumn,
  parseNumber,
  parseDate,
  getColumnsByType,
  getNumericColumns,
  getCategoricalColumns,
  getDateColumns,
  getGeographicColumns,
  generateColumnSummary,
  PATTERNS,
  GEOGRAPHIC_KEYWORDS,
  BUSINESS_KEYWORDS
};