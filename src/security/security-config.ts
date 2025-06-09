/**
 * Security Configuration Management
 * Centralised security settings and policy management
 */

import { getConfig } from '../core/config';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';
import { DataPilotError, ErrorSeverity } from '../core/types';

export interface SecurityPolicy {
  /** Input validation settings */
  inputValidation: {
    maxFileSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    allowSymlinks: boolean;
    maxPathDepth: number;
    rateLimit: number;
  };
  
  /** File access control settings */
  fileAccess: {
    defaultOperations: string[];
    requireIntegrityCheck: boolean;
    tempFileTimeout: number;
    maxConcurrentHandles: number;
    auditLogRetention: number;
  };
  
  /** Error handling and disclosure settings */
  errorHandling: {
    hideSystemPaths: boolean;
    sanitiseErrorMessages: boolean;
    maxStackTraceDepth: number;
    logSecurityEvents: boolean;
  };
  
  /** Cryptographic settings */
  cryptography: {
    hashAlgorithm: 'sha256' | 'sha512';
    encryptSensitiveData: boolean;
    keyDerivationIterations: number;
    saltLength: number;
  };
  
  /** Network and external access settings */
  network: {
    allowExternalConnections: boolean;
    allowedDomains: string[];
    requestTimeout: number;
    maxRequestSize: number;
  };
  
  /** Process isolation settings */
  process: {
    restrictFileSystemAccess: boolean;
    disableShellExecution: boolean;
    memoryLimit: number;
    cpuLimit: number;
  };
}

export interface SecurityConfiguration {
  /** Current security policy */
  policy: SecurityPolicy;
  
  /** Environment-specific overrides */
  environmentOverrides: Map<string, Partial<SecurityPolicy>>;
  
  /** Security feature flags */
  features: {
    enableAdvancedThreatDetection: boolean;
    enableRealTimeMonitoring: boolean;
    enableBehaviouralAnalysis: boolean;
    enableIntrusionDetection: boolean;
  };
  
  /** Compliance settings */
  compliance: {
    enableGDPRMode: boolean;
    enableSOXCompliance: boolean;
    enableHIPAAMode: boolean;
    dataRetentionDays: number;
  };
}

/**
 * Default security policy with secure defaults
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  inputValidation: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    allowedExtensions: ['.csv', '.tsv', '.txt'],
    allowedMimeTypes: ['text/csv', 'text/plain', 'text/tab-separated-values'],
    allowSymlinks: false,
    maxPathDepth: 10,
    rateLimit: 10, // operations per second
  },
  
  fileAccess: {
    defaultOperations: ['read', 'metadata'],
    requireIntegrityCheck: true,
    tempFileTimeout: 300000, // 5 minutes
    maxConcurrentHandles: 100,
    auditLogRetention: 86400000, // 24 hours
  },
  
  errorHandling: {
    hideSystemPaths: true,
    sanitiseErrorMessages: true,
    maxStackTraceDepth: 3,
    logSecurityEvents: true,
  },
  
  cryptography: {
    hashAlgorithm: 'sha256',
    encryptSensitiveData: true,
    keyDerivationIterations: 100000,
    saltLength: 32,
  },
  
  network: {
    allowExternalConnections: false,
    allowedDomains: [],
    requestTimeout: 30000, // 30 seconds
    maxRequestSize: 10 * 1024 * 1024, // 10MB
  },
  
  process: {
    restrictFileSystemAccess: true,
    disableShellExecution: true,
    memoryLimit: 2 * 1024 * 1024 * 1024, // 2GB
    cpuLimit: 80, // 80% CPU usage
  },
};

/**
 * Security Configuration Manager
 */
export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfiguration;
  private configValidators: Map<string, (value: unknown) => boolean> = new Map();
  private sensitiveKeys: Set<string> = new Set();

  private constructor() {
    this.config = {
      policy: { ...DEFAULT_SECURITY_POLICY },
      environmentOverrides: new Map(),
      features: {
        enableAdvancedThreatDetection: false,
        enableRealTimeMonitoring: true,
        enableBehaviouralAnalysis: false,
        enableIntrusionDetection: true,
      },
      compliance: {
        enableGDPRMode: false,
        enableSOXCompliance: false,
        enableHIPAAMode: false,
        dataRetentionDays: 30,
      },
    };
    
    this.initializeValidators();
    this.initializeSensitiveKeys();
    this.loadEnvironmentOverrides();
  }

  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  /**
   * Get current security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return JSON.parse(JSON.stringify(this.config.policy));
  }

  /**
   * Update security policy with validation
   */
  updateSecurityPolicy(
    updates: Partial<SecurityPolicy>,
    context?: LogContext
  ): void {
    try {
      // Validate updates
      const validation = this.validatePolicyUpdates(updates);
      if (!validation.isValid) {
        throw DataPilotError.security(
          `Security policy validation failed: ${validation.errors.join(', ')}`,
          'INVALID_SECURITY_POLICY',
          context
        );
      }

      // Apply updates with deep merge
      this.config.policy = this.deepMergePolicy(this.config.policy, updates);
      
      // Log security policy change
      this.logSecurityEvent('SECURITY_POLICY_UPDATED', {
        updates: this.sanitiseForLogging(updates),
        timestamp: new Date().toISOString(),
      }, context);
      
      logger.info('Security policy updated', {
        updatedKeys: Object.keys(updates),
        ...context,
      });
    } catch (error) {
      logger.error('Failed to update security policy', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context,
      });
      throw error;
    }
  }

  /**
   * Apply environment-specific security overrides
   */
  applyEnvironmentOverrides(environment: string): void {
    const overrides = this.config.environmentOverrides.get(environment);
    if (overrides) {
      this.config.policy = this.deepMergePolicy(this.config.policy, overrides);
      
      logger.info('Applied security environment overrides', {
        environment,
        overriddenKeys: Object.keys(overrides),
      });
    }
  }

  /**
   * Get security features configuration
   */
  getSecurityFeatures(): Record<string, boolean> {
    return { ...this.config.features };
  }

  /**
   * Enable or disable security features
   */
  updateSecurityFeatures(
    features: Partial<Record<keyof SecurityConfiguration['features'], boolean>>,
    context?: LogContext
  ): void {
    const previousFeatures = { ...this.config.features };
    
    Object.assign(this.config.features, features);
    
    this.logSecurityEvent('SECURITY_FEATURES_UPDATED', {
      previous: previousFeatures,
      current: this.config.features,
      changes: features,
    }, context);
    
    logger.info('Security features updated', {
      features,
      ...context,
    });
  }

  /**
   * Get compliance settings
   */
  getComplianceSettings(): Record<string, unknown> {
    return { ...this.config.compliance };
  }

  /**
   * Check if a specific security feature is enabled
   */
  isFeatureEnabled(feature: keyof SecurityConfiguration['features']): boolean {
    return this.config.features[feature] || false;
  }

  /**
   * Get effective security policy for environment
   */
  getEffectivePolicy(environment?: string): SecurityPolicy {
    let policy = { ...this.config.policy };
    
    if (environment) {
      const overrides = this.config.environmentOverrides.get(environment);
      if (overrides) {
        policy = this.deepMergePolicy(policy, overrides);
      }
    }
    
    return policy;
  }

  /**
   * Validate current security configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const policy = this.config.policy;
    
    // Validate input validation settings
    if (policy.inputValidation.maxFileSize > 10 * 1024 * 1024 * 1024) {
      warnings.push('Very large maximum file size may pose security risks');
    }
    
    if (policy.inputValidation.allowSymlinks) {
      warnings.push('Allowing symbolic links may enable path traversal attacks');
    }
    
    if (policy.inputValidation.rateLimit > 100) {
      warnings.push('High rate limit may allow abuse');
    }
    
    // Validate file access settings
    if (!policy.fileAccess.requireIntegrityCheck) {
      warnings.push('Disabling integrity checks reduces security');
    }
    
    if (policy.fileAccess.maxConcurrentHandles > 1000) {
      warnings.push('Very high concurrent handle limit may enable resource exhaustion');
    }
    
    // Validate error handling
    if (!policy.errorHandling.hideSystemPaths) {
      errors.push('System paths should be hidden in error messages');
    }
    
    if (!policy.errorHandling.sanitiseErrorMessages) {
      errors.push('Error messages should be sanitised');
    }
    
    // Validate cryptography settings
    if (policy.cryptography.hashAlgorithm === 'sha256') {
      recommendations.push('Consider upgrading to SHA-512 for enhanced security');
    }
    
    if (policy.cryptography.keyDerivationIterations < 50000) {
      warnings.push('Low key derivation iterations may be vulnerable to brute force');
    }
    
    // Validate network settings
    if (policy.network.allowExternalConnections && policy.network.allowedDomains.length === 0) {
      errors.push('External connections allowed but no domains whitelisted');
    }
    
    // Validate process settings
    if (!policy.process.restrictFileSystemAccess) {
      warnings.push('Unrestricted file system access increases attack surface');
    }
    
    if (!policy.process.disableShellExecution) {
      errors.push('Shell execution should be disabled for security');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Export security configuration (with sensitive data redacted)
   */
  exportConfiguration(includeSensitive: boolean = false): Record<string, unknown> {
    const exported = JSON.parse(JSON.stringify(this.config));
    
    if (!includeSensitive) {
      // Redact sensitive information
      exported.policy = this.sanitiseForLogging(exported.policy);
    }
    
    return exported;
  }

  /**
   * Import security configuration with validation
   */
  importConfiguration(
    configData: Record<string, unknown>,
    context?: LogContext
  ): void {
    try {
      // Validate imported configuration
      const validation = this.validateImportedConfig(configData);
      if (!validation.isValid) {
        throw DataPilotError.security(
          `Configuration import validation failed: ${validation.errors.join(', ')}`,
          'INVALID_IMPORTED_CONFIG',
          context
        );
      }
      
      // Backup current configuration
      const backup = JSON.parse(JSON.stringify(this.config));
      
      try {
        // Apply imported configuration
        this.config = configData as SecurityConfiguration;
        
        this.logSecurityEvent('SECURITY_CONFIG_IMPORTED', {
          timestamp: new Date().toISOString(),
        }, context);
        
        logger.info('Security configuration imported successfully', context);
      } catch (error) {
        // Restore backup on failure
        this.config = backup;
        throw error;
      }
    } catch (error) {
      logger.error('Failed to import security configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context,
      });
      throw error;
    }
  }

  // Private helper methods

  private initializeValidators(): void {
    this.configValidators.set('maxFileSize', (value) => 
      typeof value === 'number' && value > 0 && value <= 100 * 1024 * 1024 * 1024
    );
    
    this.configValidators.set('allowedExtensions', (value) =>
      Array.isArray(value) && value.every(ext => typeof ext === 'string' && ext.startsWith('.'))
    );
    
    this.configValidators.set('rateLimit', (value) =>
      typeof value === 'number' && value > 0 && value <= 1000
    );
    
    this.configValidators.set('hashAlgorithm', (value) =>
      typeof value === 'string' && ['sha256', 'sha512'].includes(value)
    );
  }

  private initializeSensitiveKeys(): void {
    this.sensitiveKeys.add('cryptography.keyDerivationIterations');
    this.sensitiveKeys.add('cryptography.saltLength');
    this.sensitiveKeys.add('network.allowedDomains');
    this.sensitiveKeys.add('process.memoryLimit');
    this.sensitiveKeys.add('process.cpuLimit');
  }

  private loadEnvironmentOverrides(): void {
    // Development environment - more permissive for debugging
    this.config.environmentOverrides.set('development', {
      errorHandling: {
        hideSystemPaths: false,
        sanitiseErrorMessages: false,
        maxStackTraceDepth: 10,
        logSecurityEvents: true,
      },
      inputValidation: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        rateLimit: 50,
      },
    });
    
    // Production environment - maximum security
    this.config.environmentOverrides.set('production', {
      errorHandling: {
        hideSystemPaths: true,
        sanitiseErrorMessages: true,
        maxStackTraceDepth: 1,
        logSecurityEvents: true,
      },
      inputValidation: {
        rateLimit: 5,
        allowSymlinks: false,
      },
      network: {
        allowExternalConnections: false,
      },
      process: {
        restrictFileSystemAccess: true,
        disableShellExecution: true,
      },
    });
    
    // CI environment - optimised for testing
    this.config.environmentOverrides.set('ci', {
      inputValidation: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        rateLimit: 100,
      },
      fileAccess: {
        tempFileTimeout: 60000, // 1 minute
        maxConcurrentHandles: 10,
      },
    });
  }

  private validatePolicyUpdates(updates: Partial<SecurityPolicy>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Recursive validation of nested objects
    const validateObject = (obj: any, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const validator = this.configValidators.get(key);
        
        if (validator && !validator(value)) {
          errors.push(`Invalid value for ${fullPath}: ${value}`);
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          validateObject(value, fullPath);
        }
      }
    };
    
    validateObject(updates);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateImportedConfig(configData: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check required structure
    if (!configData.policy || typeof configData.policy !== 'object') {
      errors.push('Missing or invalid policy section');
    }
    
    if (!configData.features || typeof configData.features !== 'object') {
      errors.push('Missing or invalid features section');
    }
    
    // Validate policy if present
    if (configData.policy) {
      const policyValidation = this.validatePolicyUpdates(configData.policy as Partial<SecurityPolicy>);
      errors.push(...policyValidation.errors);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private deepMergePolicy(target: SecurityPolicy, source: Partial<SecurityPolicy>): SecurityPolicy {
    const result = JSON.parse(JSON.stringify(target));
    
    const merge = (targetObj: any, sourceObj: any): void => {
      for (const key in sourceObj) {
        if (sourceObj[key] && typeof sourceObj[key] === 'object' && !Array.isArray(sourceObj[key])) {
          if (!targetObj[key]) targetObj[key] = {};
          merge(targetObj[key], sourceObj[key]);
        } else {
          targetObj[key] = sourceObj[key];
        }
      }
    };
    
    merge(result, source);
    return result;
  }

  private sanitiseForLogging(data: any): any {
    const sanitised = JSON.parse(JSON.stringify(data));
    
    const sanitise = (obj: any, path: string = ''): void => {
      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (this.sensitiveKeys.has(fullPath)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          sanitise(obj[key], fullPath);
        }
      }
    };
    
    sanitise(sanitised);
    return sanitised;
  }

  private logSecurityEvent(
    event: string,
    data: Record<string, unknown>,
    context?: LogContext
  ): void {
    logger.info(`Security Configuration Event: ${event}`, {
      ...context,
      securityEvent: event,
      eventData: data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Factory function for easy access
 */
export function getSecurityConfig(): SecurityConfigManager {
  return SecurityConfigManager.getInstance();
}

/**
 * Security policy builder for fluent configuration
 */
export class SecurityPolicyBuilder {
  private policy: Partial<SecurityPolicy> = {};

  static create(): SecurityPolicyBuilder {
    return new SecurityPolicyBuilder();
  }

  inputValidation(config: Partial<SecurityPolicy['inputValidation']>): SecurityPolicyBuilder {
    this.policy.inputValidation = { ...this.policy.inputValidation, ...config };
    return this;
  }

  fileAccess(config: Partial<SecurityPolicy['fileAccess']>): SecurityPolicyBuilder {
    this.policy.fileAccess = { ...this.policy.fileAccess, ...config };
    return this;
  }

  errorHandling(config: Partial<SecurityPolicy['errorHandling']>): SecurityPolicyBuilder {
    this.policy.errorHandling = { ...this.policy.errorHandling, ...config };
    return this;
  }

  cryptography(config: Partial<SecurityPolicy['cryptography']>): SecurityPolicyBuilder {
    this.policy.cryptography = { ...this.policy.cryptography, ...config };
    return this;
  }

  network(config: Partial<SecurityPolicy['network']>): SecurityPolicyBuilder {
    this.policy.network = { ...this.policy.network, ...config };
    return this;
  }

  process(config: Partial<SecurityPolicy['process']>): SecurityPolicyBuilder {
    this.policy.process = { ...this.policy.process, ...config };
    return this;
  }

  build(): Partial<SecurityPolicy> {
    return JSON.parse(JSON.stringify(this.policy));
  }
}

/**
 * Pre-defined security profiles
 */
export const SecurityProfiles = {
  /** High security profile for production environments */
  HIGH_SECURITY: SecurityPolicyBuilder.create()
    .inputValidation({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowSymlinks: false,
      rateLimit: 5,
    })
    .fileAccess({
      requireIntegrityCheck: true,
      maxConcurrentHandles: 50,
    })
    .errorHandling({
      hideSystemPaths: true,
      sanitiseErrorMessages: true,
      maxStackTraceDepth: 1,
    })
    .network({
      allowExternalConnections: false,
    })
    .process({
      restrictFileSystemAccess: true,
      disableShellExecution: true,
    })
    .build(),

  /** Balanced security profile for general use */
  BALANCED: SecurityPolicyBuilder.create()
    .inputValidation({
      maxFileSize: 500 * 1024 * 1024, // 500MB
      rateLimit: 10,
    })
    .fileAccess({
      requireIntegrityCheck: true,
    })
    .errorHandling({
      hideSystemPaths: true,
      sanitiseErrorMessages: true,
    })
    .build(),

  /** Development profile with relaxed security for debugging */
  DEVELOPMENT: SecurityPolicyBuilder.create()
    .inputValidation({
      rateLimit: 50,
    })
    .errorHandling({
      hideSystemPaths: false,
      sanitiseErrorMessages: false,
      maxStackTraceDepth: 10,
    })
    .build(),
};
