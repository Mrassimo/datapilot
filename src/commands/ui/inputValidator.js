import path from 'path';
import fs from 'fs';

/**
 * Input validation utilities for TUI
 * Provides comprehensive validation for user inputs
 */
export class InputValidator {
  constructor(options = {}) {
    this.customValidators = options.validators || {};
    this.sanitizers = options.sanitizers || {};
    this.messages = {
      required: 'This field is required',
      minLength: 'Must be at least {min} characters',
      maxLength: 'Must be at most {max} characters',
      pattern: 'Invalid format',
      email: 'Invalid email address',
      url: 'Invalid URL',
      numeric: 'Must be a number',
      integer: 'Must be an integer',
      range: 'Must be between {min} and {max}',
      fileExists: 'File does not exist',
      dirExists: 'Directory does not exist',
      csvFile: 'Must be a CSV file',
      ...options.messages
    };
  }

  /**
   * Validate a value against rules
   */
  validate(value, rules) {
    const errors = [];
    
    // Convert single rule to array
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of ruleList) {
      const error = this.applyRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply a single validation rule
   */
  applyRule(value, rule) {
    // Handle function rules
    if (typeof rule === 'function') {
      const result = rule(value);
      if (result !== true) {
        return typeof result === 'string' ? result : 'Validation failed';
      }
      return null;
    }
    
    // Handle object rules
    if (typeof rule === 'object') {
      return this.applyObjectRule(value, rule);
    }
    
    // Handle string rules (built-in validators)
    if (typeof rule === 'string') {
      return this.applyBuiltInRule(value, rule);
    }
    
    return null;
  }

  /**
   * Apply object-based validation rule
   */
  applyObjectRule(value, rule) {
    const { type, ...params } = rule;
    
    switch (type) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim())) {
          return this.formatMessage('required', params);
        }
        break;
        
      case 'minLength':
        if (value && value.length < params.min) {
          return this.formatMessage('minLength', params);
        }
        break;
        
      case 'maxLength':
        if (value && value.length > params.max) {
          return this.formatMessage('maxLength', params);
        }
        break;
        
      case 'pattern':
        if (value && !params.regex.test(value)) {
          return params.message || this.formatMessage('pattern', params);
        }
        break;
        
      case 'range':
        const num = parseFloat(value);
        if (!isNaN(num) && (num < params.min || num > params.max)) {
          return this.formatMessage('range', params);
        }
        break;
        
      case 'custom':
        if (this.customValidators[params.validator]) {
          const result = this.customValidators[params.validator](value, params);
          if (result !== true) {
            return typeof result === 'string' ? result : params.message || 'Validation failed';
          }
        }
        break;
        
      case 'fileExists':
        if (value && !fs.existsSync(value)) {
          return this.formatMessage('fileExists', params);
        }
        break;
        
      case 'dirExists':
        if (value && !fs.existsSync(value)) {
          return this.formatMessage('dirExists', params);
        }
        break;
        
      case 'csvFile':
        if (value && path.extname(value).toLowerCase() !== '.csv') {
          return this.formatMessage('csvFile', params);
        }
        break;
    }
    
    return null;
  }

  /**
   * Apply built-in validation rule
   */
  applyBuiltInRule(value, rule) {
    switch (rule) {
      case 'required':
        return this.applyObjectRule(value, { type: 'required' });
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return this.formatMessage('email');
        }
        break;
        
      case 'url':
        try {
          if (value) {
            new URL(value);
          }
        } catch {
          return this.formatMessage('url');
        }
        break;
        
      case 'numeric':
        if (value && isNaN(parseFloat(value))) {
          return this.formatMessage('numeric');
        }
        break;
        
      case 'integer':
        if (value && !Number.isInteger(parseFloat(value))) {
          return this.formatMessage('integer');
        }
        break;
    }
    
    return null;
  }

  /**
   * Format error message with parameters
   */
  formatMessage(type, params = {}) {
    let message = this.messages[type] || 'Invalid value';
    
    // Replace placeholders
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
    
    return message;
  }

  /**
   * Sanitize input value
   */
  sanitize(value, sanitizers) {
    let sanitized = value;
    
    const sanitizerList = Array.isArray(sanitizers) ? sanitizers : [sanitizers];
    
    for (const sanitizer of sanitizerList) {
      sanitized = this.applySanitizer(sanitized, sanitizer);
    }
    
    return sanitized;
  }

  /**
   * Apply sanitizer to value
   */
  applySanitizer(value, sanitizer) {
    // Handle function sanitizers
    if (typeof sanitizer === 'function') {
      return sanitizer(value);
    }
    
    // Handle string sanitizers (built-in)
    if (typeof sanitizer === 'string') {
      return this.applyBuiltInSanitizer(value, sanitizer);
    }
    
    // Handle object sanitizers
    if (typeof sanitizer === 'object') {
      const { type, ...params } = sanitizer;
      if (this.sanitizers[type]) {
        return this.sanitizers[type](value, params);
      }
    }
    
    return value;
  }

  /**
   * Apply built-in sanitizer
   */
  applyBuiltInSanitizer(value, sanitizer) {
    if (typeof value !== 'string') {
      return value;
    }
    
    switch (sanitizer) {
      case 'trim':
        return value.trim();
        
      case 'lowercase':
        return value.toLowerCase();
        
      case 'uppercase':
        return value.toUpperCase();
        
      case 'escape':
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        
      case 'normalizeWhitespace':
        return value.replace(/\s+/g, ' ').trim();
        
      case 'alphanumeric':
        return value.replace(/[^a-zA-Z0-9]/g, '');
        
      case 'numeric':
        return value.replace(/[^0-9.-]/g, '');
        
      case 'absolutePath':
        return path.resolve(value);
        
      default:
        return value;
    }
  }

  /**
   * Validate form data
   */
  validateForm(data, schema) {
    const results = {};
    const errors = {};
    let hasErrors = false;
    
    // Validate each field
    Object.entries(schema).forEach(([field, config]) => {
      const value = data[field];
      
      // Apply sanitizers if defined
      let sanitizedValue = value;
      if (config.sanitize) {
        sanitizedValue = this.sanitize(value, config.sanitize);
      }
      
      // Validate
      if (config.validate) {
        const validation = this.validate(sanitizedValue, config.validate);
        if (!validation.valid) {
          errors[field] = validation.errors;
          hasErrors = true;
        }
      }
      
      results[field] = sanitizedValue;
    });
    
    return {
      valid: !hasErrors,
      data: results,
      errors
    };
  }

  /**
   * Create validator for file selection
   */
  createFileValidator(options = {}) {
    const rules = [];
    
    if (options.required) {
      rules.push('required');
    }
    
    if (options.exists !== false) {
      rules.push({ type: 'fileExists' });
    }
    
    if (options.extensions) {
      rules.push({
        type: 'pattern',
        regex: new RegExp(`\\.(${options.extensions.join('|')})$`, 'i'),
        message: `File must have one of these extensions: ${options.extensions.join(', ')}`
      });
    }
    
    if (options.maxSize) {
      rules.push((value) => {
        try {
          const stats = fs.statSync(value);
          if (stats.size > options.maxSize) {
            return `File size must not exceed ${this.formatBytes(options.maxSize)}`;
          }
        } catch {
          // File doesn't exist, will be caught by fileExists rule
        }
        return true;
      });
    }
    
    return rules;
  }

  /**
   * Create validator for command selection
   */
  createCommandValidator(availableCommands) {
    return [
      'required',
      {
        type: 'pattern',
        regex: new RegExp(`^(${availableCommands.join('|')})$`),
        message: `Must be one of: ${availableCommands.join(', ')}`
      }
    ];
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Register custom validator
   */
  registerValidator(name, validator) {
    this.customValidators[name] = validator;
  }

  /**
   * Register custom sanitizer
   */
  registerSanitizer(name, sanitizer) {
    this.sanitizers[name] = sanitizer;
  }
}

/**
 * Create input validator instance
 */
export function createInputValidator(options) {
  return new InputValidator(options);
}

/**
 * Common validation rules
 */
export const commonRules = {
  requiredString: ['required', 'trim'],
  optionalString: ['trim'],
  requiredEmail: ['required', 'email', 'lowercase'],
  requiredNumber: ['required', 'numeric'],
  requiredInteger: ['required', 'integer'],
  csvFile: ['required', { type: 'csvFile' }, { type: 'fileExists' }],
  outputFile: [
    'required',
    {
      type: 'pattern',
      regex: /\.(txt|json|csv|md)$/i,
      message: 'Output file must have .txt, .json, .csv, or .md extension'
    }
  ],
  positiveInteger: [
    'required',
    'integer',
    {
      type: 'custom',
      validator: 'positiveNumber',
      message: 'Must be a positive number'
    }
  ]
};

/**
 * Common sanitizers
 */
export const commonSanitizers = {
  cleanString: ['trim', 'normalizeWhitespace'],
  cleanPath: ['trim', 'absolutePath'],
  cleanEmail: ['trim', 'lowercase'],
  cleanNumeric: ['trim', 'numeric']
};