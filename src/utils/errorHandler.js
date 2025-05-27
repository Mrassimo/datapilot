/**
 * Comprehensive Error Handling and Input Validation for DataPilot
 * Provides defensive programming patterns and graceful error recovery
 */

export class DataPilotError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'DataPilotError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  
  static validateArray(value, fieldName = 'array', options = {}) {
    const { allowEmpty = true, minLength = 0, maxLength = Infinity } = options;
    
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataPilotError(`${fieldName} is required but was ${value}`, 'VALIDATION_ERROR');
      }
      return [];
    }
    
    if (!Array.isArray(value)) {
      throw new DataPilotError(`${fieldName} must be an array, got ${typeof value}`, 'TYPE_ERROR');
    }
    
    if (!allowEmpty && value.length === 0) {
      throw new DataPilotError(`${fieldName} cannot be empty`, 'VALIDATION_ERROR');
    }
    
    if (value.length < minLength) {
      throw new DataPilotError(`${fieldName} must have at least ${minLength} items, got ${value.length}`, 'VALIDATION_ERROR');
    }
    
    if (value.length > maxLength) {
      throw new DataPilotError(`${fieldName} cannot have more than ${maxLength} items, got ${value.length}`, 'VALIDATION_ERROR');
    }
    
    return value;
  }
  
  static validateObject(value, fieldName = 'object', options = {}) {
    const { allowNull = false, requiredKeys = [] } = options;
    
    if (value === null || value === undefined) {
      if (allowNull) {
        return null;
      }
      if (options.required) {
        throw new DataPilotError(`${fieldName} is required but was ${value}`, 'VALIDATION_ERROR');
      }
      return {};
    }
    
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new DataPilotError(`${fieldName} must be an object, got ${typeof value}`, 'TYPE_ERROR');
    }
    
    // Check required keys
    for (const key of requiredKeys) {
      if (!(key in value)) {
        throw new DataPilotError(`${fieldName} is missing required key: ${key}`, 'VALIDATION_ERROR');
      }
    }
    
    return value;
  }
  
  static validateString(value, fieldName = 'string', options = {}) {
    const { allowEmpty = true, minLength = 0, maxLength = Infinity, pattern = null } = options;
    
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataPilotError(`${fieldName} is required but was ${value}`, 'VALIDATION_ERROR');
      }
      return '';
    }
    
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    if (!allowEmpty && value.length === 0) {
      throw new DataPilotError(`${fieldName} cannot be empty`, 'VALIDATION_ERROR');
    }
    
    if (value.length < minLength) {
      throw new DataPilotError(`${fieldName} must be at least ${minLength} characters, got ${value.length}`, 'VALIDATION_ERROR');
    }
    
    if (value.length > maxLength) {
      throw new DataPilotError(`${fieldName} cannot exceed ${maxLength} characters, got ${value.length}`, 'VALIDATION_ERROR');
    }
    
    if (pattern && !pattern.test(value)) {
      throw new DataPilotError(`${fieldName} does not match required pattern`, 'VALIDATION_ERROR');
    }
    
    return value;
  }
  
  static validateNumber(value, fieldName = 'number', options = {}) {
    const { min = -Infinity, max = Infinity, integer = false } = options;
    
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataPilotError(`${fieldName} is required but was ${value}`, 'VALIDATION_ERROR');
      }
      return 0;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      throw new DataPilotError(`${fieldName} must be a valid number, got ${value}`, 'TYPE_ERROR');
    }
    
    if (num < min) {
      throw new DataPilotError(`${fieldName} must be at least ${min}, got ${num}`, 'VALIDATION_ERROR');
    }
    
    if (num > max) {
      throw new DataPilotError(`${fieldName} cannot exceed ${max}, got ${num}`, 'VALIDATION_ERROR');
    }
    
    if (integer && !Number.isInteger(num)) {
      throw new DataPilotError(`${fieldName} must be an integer, got ${num}`, 'VALIDATION_ERROR');
    }
    
    return num;
  }
  
  static validateRecords(records, fieldName = 'records') {
    const validatedRecords = this.validateArray(records, fieldName, { allowEmpty: true });
    
    // Ensure all records are objects
    return validatedRecords.map((record, index) => {
      try {
        return this.validateObject(record, `${fieldName}[${index}]`, { required: true });
      } catch (error) {
        // Provide fallback for malformed records
        console.warn(`Skipping malformed record at index ${index}:`, error.message);
        return null;
      }
    }).filter(record => record !== null);
  }
  
  static validateColumns(columns, fieldName = 'columns') {
    const validatedColumns = this.validateArray(columns, fieldName, { allowEmpty: true });
    
    return validatedColumns.map((column, index) => {
      try {
        return this.validateString(column, `${fieldName}[${index}]`, { 
          required: true, 
          allowEmpty: false,
          maxLength: 255 
        });
      } catch (error) {
        console.warn(`Invalid column at index ${index}:`, error.message);
        return `column_${index}`;
      }
    });
  }
}

/**
 * Safe array operations with comprehensive error handling
 */
export class SafeArrayOps {
  
  static safeSlice(array, start = 0, end = undefined, fallback = []) {
    try {
      InputValidator.validateArray(array, 'array for slice operation');
      
      if (array.length === 0) {
        return fallback;
      }
      
      const validStart = Math.max(0, Math.min(start, array.length));
      const validEnd = end === undefined ? array.length : Math.max(validStart, Math.min(end, array.length));
      
      return array.slice(validStart, validEnd);
    } catch (error) {
      console.warn(`Safe slice operation failed: ${error.message}, returning fallback`);
      return fallback;
    }
  }
  
  static safeMap(array, mapper, fallback = []) {
    try {
      const validArray = InputValidator.validateArray(array, 'array for map operation');
      
      if (validArray.length === 0) {
        return fallback;
      }
      
      return validArray.map((item, index) => {
        try {
          return mapper(item, index, validArray);
        } catch (error) {
          console.warn(`Map operation failed for item at index ${index}: ${error.message}`);
          return null;
        }
      }).filter(item => item !== null);
    } catch (error) {
      console.warn(`Safe map operation failed: ${error.message}, returning fallback`);
      return fallback;
    }
  }
  
  static safeFilter(array, predicate, fallback = []) {
    try {
      const validArray = InputValidator.validateArray(array, 'array for filter operation');
      
      if (validArray.length === 0) {
        return fallback;
      }
      
      return validArray.filter((item, index) => {
        try {
          return predicate(item, index, validArray);
        } catch (error) {
          console.warn(`Filter predicate failed for item at index ${index}: ${error.message}`);
          return false;
        }
      });
    } catch (error) {
      console.warn(`Safe filter operation failed: ${error.message}, returning fallback`);
      return fallback;
    }
  }
  
  static safeReduce(array, reducer, initialValue, fallback = null) {
    try {
      const validArray = InputValidator.validateArray(array, 'array for reduce operation');
      
      if (validArray.length === 0) {
        return initialValue !== undefined ? initialValue : fallback;
      }
      
      return validArray.reduce((acc, item, index) => {
        try {
          return reducer(acc, item, index, validArray);
        } catch (error) {
          console.warn(`Reduce operation failed for item at index ${index}: ${error.message}`);
          return acc;
        }
      }, initialValue);
    } catch (error) {
      console.warn(`Safe reduce operation failed: ${error.message}, returning fallback`);
      return fallback;
    }
  }
  
  static safeForEach(array, callback) {
    try {
      const validArray = InputValidator.validateArray(array, 'array for forEach operation');
      
      validArray.forEach((item, index) => {
        try {
          callback(item, index, validArray);
        } catch (error) {
          console.warn(`ForEach callback failed for item at index ${index}: ${error.message}`);
        }
      });
    } catch (error) {
      console.warn(`Safe forEach operation failed: ${error.message}`);
    }
  }
}

/**
 * Error boundary decorator for async functions
 */
export function withErrorBoundary(fn, fallback = null, context = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      const enhancedError = new DataPilotError(
        `Error in ${fn.name || 'anonymous function'}: ${error.message}`,
        error.code || 'RUNTIME_ERROR',
        { ...context, originalError: error, args }
      );
      
      console.error('DataPilot Error:', enhancedError);
      
      if (fallback !== null) {
        if (typeof fallback === 'function') {
          try {
            return fallback(enhancedError, ...args);
          } catch (fallbackError) {
            console.error('Fallback function also failed:', fallbackError);
            return null;
          }
        }
        return fallback;
      }
      
      throw enhancedError;
    }
  };
}

/**
 * Safe property access with fallback
 */
export function safeGet(obj, path, fallback = null) {
  try {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    
    const keys = Array.isArray(path) ? path : path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return fallback;
      }
      result = result[key];
    }
    
    return result === undefined ? fallback : result;
  } catch (error) {
    console.warn(`Safe property access failed for path ${path}: ${error.message}`);
    return fallback;
  }
}

/**
 * Graceful error recovery for data processing
 */
export class ErrorRecovery {
  
  static withRetry(fn, maxRetries = 3, delay = 1000) {
    return async function(...args) {
      let lastError;
      
      for (let i = 0; i <= maxRetries; i++) {
        try {
          return await fn.apply(this, args);
        } catch (error) {
          lastError = error;
          
          if (i === maxRetries) {
            break;
          }
          
          console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
      
      throw new DataPilotError(
        `All ${maxRetries + 1} attempts failed. Last error: ${lastError.message}`,
        'RETRY_EXHAUSTED',
        { originalError: lastError, attempts: maxRetries + 1 }
      );
    };
  }
  
  static partial(fn, fallbackResult = null) {
    return function(...args) {
      try {
        const result = fn.apply(this, args);
        return result === undefined || result === null ? fallbackResult : result;
      } catch (error) {
        console.warn(`Partial execution failed: ${error.message}, using fallback`);
        return fallbackResult;
      }
    };
  }
}

/**
 * Data quality validation for CSV records
 */
export class DataQualityValidator {
  
  static validateRecordStructure(record, expectedColumns = []) {
    try {
      const validRecord = InputValidator.validateObject(record, 'record', { required: true });
      
      const recordKeys = Object.keys(validRecord);
      const missingColumns = expectedColumns.filter(col => !recordKeys.includes(col));
      const extraColumns = recordKeys.filter(col => !expectedColumns.includes(col));
      
      return {
        isValid: missingColumns.length === 0,
        missingColumns,
        extraColumns,
        record: validRecord
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        record: {}
      };
    }
  }
  
  static sanitizeRecord(record) {
    try {
      const validRecord = InputValidator.validateObject(record, 'record');
      const sanitized = {};
      
      for (const [key, value] of Object.entries(validRecord)) {
        // Sanitize key
        const cleanKey = String(key).trim().replace(/[^\w\s-_]/g, '');
        if (cleanKey.length === 0) continue;
        
        // Sanitize value
        if (value === null || value === undefined) {
          sanitized[cleanKey] = null;
        } else if (typeof value === 'string') {
          sanitized[cleanKey] = value.trim();
        } else {
          sanitized[cleanKey] = value;
        }
      }
      
      return sanitized;
    } catch (error) {
      console.warn(`Record sanitization failed: ${error.message}`);
      return {};
    }
  }
}