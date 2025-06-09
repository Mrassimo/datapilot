/**
 * Security Audit Logging System
 * Comprehensive logging and monitoring for security events
 */

import { createWriteStream, promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { createHash, randomBytes } from 'crypto';
import { DataPilotError, ErrorSeverity } from '../core/types';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';

export interface SecurityEvent {
  /** Unique event ID */
  id: string;
  /** Event timestamp */
  timestamp: string;
  /** Event type/category */
  type: SecurityEventType;
  /** Severity level */
  severity: SecurityEventSeverity;
  /** Event source component */
  source: string;
  /** User/session identifier */
  userId?: string;
  /** IP address if applicable */
  ipAddress?: string;
  /** File path involved */
  filePath?: string;
  /** Operation attempted */
  operation?: string;
  /** Event description */
  description: string;
  /** Structured event data */
  data: Record<string, unknown>;
  /** Processing outcome */
  outcome: 'success' | 'failure' | 'blocked' | 'warning';
  /** Risk score (0-10) */
  riskScore: number;
  /** Related event IDs */
  relatedEvents?: string[];
}

export type SecurityEventType =
  | 'authentication'
  | 'authorization'
  | 'file_access'
  | 'input_validation'
  | 'configuration_change'
  | 'policy_violation'
  | 'intrusion_attempt'
  | 'data_integrity'
  | 'system_security'
  | 'compliance';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditConfiguration {
  /** Enable audit logging */
  enabled: boolean;
  /** Log file path */
  logFilePath: string;
  /** Maximum log file size in bytes */
  maxFileSize: number;
  /** Number of log files to retain */
  maxFiles: number;
  /** Minimum severity to log */
  minSeverity: SecurityEventSeverity;
  /** Enable real-time alerts */
  enableAlerts: boolean;
  /** Alert thresholds */
  alertThresholds: {
    highSeverityCount: number;
    criticalSeverityCount: number;
    timeWindowMinutes: number;
  };
  /** Enable log encryption */
  encryptLogs: boolean;
  /** Retention period in days */
  retentionDays: number;
}

export interface AlertRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Event types to monitor */
  eventTypes: SecurityEventType[];
  /** Minimum severity to trigger */
  minSeverity: SecurityEventSeverity;
  /** Pattern to match in event data */
  pattern?: RegExp;
  /** Threshold count within time window */
  threshold: {
    count: number;
    timeWindowMinutes: number;
  };
  /** Alert action */
  action: 'log' | 'notify' | 'block' | 'escalate';
  /** Rule enabled status */
  enabled: boolean;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private config: AuditConfiguration;
  private events: SecurityEvent[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private alertCounts: Map<string, { count: number; timestamp: number }> = new Map();
  private writeStream?: NodeJS.WritableStream;
  private currentLogFile?: string;
  private logRotationTimer?: NodeJS.Timeout;

  private constructor(config?: Partial<AuditConfiguration>) {
    this.config = {
      enabled: true,
      logFilePath: resolve(process.cwd(), 'logs', 'security-audit.log'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      minSeverity: 'medium',
      enableAlerts: true,
      alertThresholds: {
        highSeverityCount: 5,
        criticalSeverityCount: 1,
        timeWindowMinutes: 15,
      },
      encryptLogs: false,
      retentionDays: 90,
      ...config,
    };

    this.initializeLogging();
    this.setupDefaultAlertRules();
    this.startCleanupTimer();
  }

  static getInstance(config?: Partial<AuditConfiguration>): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger(config);
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: SecurityEventType,
    description: string,
    data: Record<string, unknown> = {},
    options: {
      severity?: SecurityEventSeverity;
      source?: string;
      userId?: string;
      filePath?: string;
      operation?: string;
      outcome?: SecurityEvent['outcome'];
      riskScore?: number;
      context?: LogContext;
    } = {}
  ): Promise<string> {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();
    
    const event: SecurityEvent = {
      id: eventId,
      timestamp,
      type,
      severity: options.severity || this.calculateSeverity(type, data),
      source: options.source || 'datapilot',
      userId: options.userId,
      ipAddress: this.extractIpAddress(options.context),
      filePath: options.filePath,
      operation: options.operation,
      description,
      data: this.sanitiseEventData(data),
      outcome: options.outcome || 'success',
      riskScore: options.riskScore || this.calculateRiskScore(type, options.severity || 'medium'),
    };

    try {
      // Store in memory
      this.events.push(event);
      
      // Check if we should log based on severity
      if (this.shouldLogEvent(event)) {
        await this.writeEventToLog(event);
      }
      
      // Check alert rules
      await this.checkAlertRules(event);
      
      // Log to application logger
      logger.info('Security event logged', {
        eventId,
        type,
        severity: event.severity,
        outcome: event.outcome,
        riskScore: event.riskScore,
        ...options.context,
      });
      
      return eventId;
    } catch (error) {
      logger.error('Failed to log security event', {
        eventId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...options.context,
      });
      throw error;
    }
  }

  /**
   * Log authentication event
   */
  async logAuthenticationEvent(
    operation: 'login' | 'logout' | 'token_refresh' | 'password_change',
    outcome: SecurityEvent['outcome'],
    userId?: string,
    data: Record<string, unknown> = {},
    context?: LogContext
  ): Promise<string> {
    return this.logSecurityEvent(
      'authentication',
      `Authentication ${operation}`,
      { operation, ...data },
      {
        severity: outcome === 'failure' ? 'high' : 'low',
        userId,
        operation,
        outcome,
        context,
      }
    );
  }

  /**
   * Log file access event
   */
  async logFileAccessEvent(
    filePath: string,
    operation: string,
    outcome: SecurityEvent['outcome'],
    userId?: string,
    data: Record<string, unknown> = {},
    context?: LogContext
  ): Promise<string> {
    return this.logSecurityEvent(
      'file_access',
      `File ${operation}: ${filePath}`,
      { fileSize: data.fileSize, permissions: data.permissions, ...data },
      {
        severity: outcome === 'blocked' ? 'high' : 'medium',
        filePath,
        operation,
        outcome,
        userId,
        context,
      }
    );
  }

  /**
   * Log policy violation
   */
  async logPolicyViolation(
    policyName: string,
    violationType: string,
    data: Record<string, unknown> = {},
    context?: LogContext
  ): Promise<string> {
    return this.logSecurityEvent(
      'policy_violation',
      `Policy violation: ${policyName} - ${violationType}`,
      { policyName, violationType, ...data },
      {
        severity: 'high',
        outcome: 'blocked',
        riskScore: 8,
        context,
      }
    );
  }

  /**
   * Log intrusion attempt
   */
  async logIntrusionAttempt(
    attackType: string,
    source: string,
    data: Record<string, unknown> = {},
    context?: LogContext
  ): Promise<string> {
    return this.logSecurityEvent(
      'intrusion_attempt',
      `Intrusion attempt detected: ${attackType}`,
      { attackType, attackSource: source, ...data },
      {
        severity: 'critical',
        outcome: 'blocked',
        riskScore: 10,
        context,
      }
    );
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    
    logger.info('Security alert rule added', {
      ruleId: rule.id,
      ruleName: rule.name,
      eventTypes: rule.eventTypes,
    });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    
    if (removed) {
      logger.info('Security alert rule removed', { ruleId });
    }
    
    return removed;
  }

  /**
   * Get security events with filtering
   */
  getEvents(filter?: {
    type?: SecurityEventType;
    severity?: SecurityEventSeverity;
    outcome?: SecurityEvent['outcome'];
    userId?: string;
    filePath?: string;
    startTime?: Date;
    endTime?: Date;
    minRiskScore?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = [...this.events];
    
    if (filter) {
      filtered = filtered.filter(event => {
        if (filter.type && event.type !== filter.type) return false;
        if (filter.severity && event.severity !== filter.severity) return false;
        if (filter.outcome && event.outcome !== filter.outcome) return false;
        if (filter.userId && event.userId !== filter.userId) return false;
        if (filter.filePath && event.filePath !== filter.filePath) return false;
        if (filter.minRiskScore && event.riskScore < filter.minRiskScore) return false;
        
        const eventTime = new Date(event.timestamp);
        if (filter.startTime && eventTime < filter.startTime) return false;
        if (filter.endTime && eventTime > filter.endTime) return false;
        
        return true;
      });
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  }

  /**
   * Get security statistics
   */
  getStatistics(timeRange?: { start: Date; end: Date }): {
    totalEvents: number;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    eventsByType: Record<SecurityEventType, number>;
    eventsByOutcome: Record<string, number>;
    averageRiskScore: number;
    topRiskEvents: SecurityEvent[];
  } {
    const events = timeRange 
      ? this.getEvents({ startTime: timeRange.start, endTime: timeRange.end })
      : this.events;
    
    const eventsBySeverity: Record<SecurityEventSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };
    
    const eventsByType: Record<SecurityEventType, number> = {
      authentication: 0, authorization: 0, file_access: 0, input_validation: 0,
      configuration_change: 0, policy_violation: 0, intrusion_attempt: 0,
      data_integrity: 0, system_security: 0, compliance: 0
    };
    
    const eventsByOutcome: Record<string, number> = {};
    let totalRiskScore = 0;
    
    for (const event of events) {
      eventsBySeverity[event.severity]++;
      eventsByType[event.type]++;
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;
      totalRiskScore += event.riskScore;
    }
    
    const topRiskEvents = events
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
    
    return {
      totalEvents: events.length,
      eventsBySeverity,
      eventsByType,
      eventsByOutcome,
      averageRiskScore: events.length > 0 ? totalRiskScore / events.length : 0,
      topRiskEvents,
    };
  }

  /**
   * Export audit log
   */
  async exportAuditLog(
    filePath: string,
    format: 'json' | 'csv' = 'json',
    filter?: Parameters<typeof SecurityAuditLogger.prototype.getEvents>[0]
  ): Promise<void> {
    const events = this.getEvents(filter);
    
    try {
      if (format === 'json') {
        await fs.writeFile(filePath, JSON.stringify(events, null, 2), 'utf8');
      } else if (format === 'csv') {
        const csvContent = this.eventsToCSV(events);
        await fs.writeFile(filePath, csvContent, 'utf8');
      }
      
      logger.info('Audit log exported', {
        filePath,
        format,
        eventCount: events.length,
      });
    } catch (error) {
      logger.error('Failed to export audit log', {
        filePath,
        format,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clear old events based on retention policy
   */
  async clearOldEvents(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    const initialCount = this.events.length;
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    );
    
    const removedCount = initialCount - this.events.length;
    
    if (removedCount > 0) {
      logger.info('Cleared old security events', {
        removedCount,
        remainingCount: this.events.length,
        cutoffDate: cutoffDate.toISOString(),
      });
    }
    
    return removedCount;
  }

  // Private helper methods

  private async initializeLogging(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    
    try {
      // Ensure log directory exists
      const logDir = dirname(this.config.logFilePath);
      await fs.mkdir(logDir, { recursive: true });
      
      // Initialize write stream
      await this.createLogStream();
      
      logger.info('Security audit logging initialized', {
        logFilePath: this.config.logFilePath,
        minSeverity: this.config.minSeverity,
      });
    } catch (error) {
      logger.error('Failed to initialize security audit logging', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async createLogStream(): Promise<void> {
    if (this.writeStream) {
      this.writeStream.end();
    }
    
    this.currentLogFile = this.config.logFilePath;
    this.writeStream = createWriteStream(this.currentLogFile, { flags: 'a' });
    
    this.writeStream.on('error', (error) => {
      logger.error('Security audit log write error', {
        error: error.message,
        logFile: this.currentLogFile,
      });
    });
  }

  private setupDefaultAlertRules(): void {
    // Critical events
    this.addAlertRule({
      id: 'critical-events',
      name: 'Critical Security Events',
      eventTypes: ['intrusion_attempt', 'policy_violation'],
      minSeverity: 'critical',
      threshold: { count: 1, timeWindowMinutes: 1 },
      action: 'escalate',
      enabled: true,
    });
    
    // Failed authentication attempts
    this.addAlertRule({
      id: 'failed-auth',
      name: 'Failed Authentication Attempts',
      eventTypes: ['authentication'],
      minSeverity: 'medium',
      threshold: { count: 5, timeWindowMinutes: 15 },
      action: 'notify',
      enabled: true,
    });
    
    // Suspicious file access
    this.addAlertRule({
      id: 'suspicious-file-access',
      name: 'Suspicious File Access Patterns',
      eventTypes: ['file_access'],
      minSeverity: 'high',
      threshold: { count: 10, timeWindowMinutes: 5 },
      action: 'block',
      enabled: true,
    });
  }

  private generateEventId(): string {
    return randomBytes(8).toString('hex');
  }

  private calculateSeverity(type: SecurityEventType, data: Record<string, unknown>): SecurityEventSeverity {
    // Default severity based on event type
    const typeSeverity: Record<SecurityEventType, SecurityEventSeverity> = {
      authentication: 'medium',
      authorization: 'medium',
      file_access: 'low',
      input_validation: 'medium',
      configuration_change: 'high',
      policy_violation: 'high',
      intrusion_attempt: 'critical',
      data_integrity: 'high',
      system_security: 'high',
      compliance: 'medium',
    };
    
    let severity = typeSeverity[type] || 'medium';
    
    // Adjust based on data content
    if (data.blocked || data.quarantined) {
      severity = 'high';
    }
    
    if (data.attackDetected || data.maliciousContent) {
      severity = 'critical';
    }
    
    return severity;
  }

  private calculateRiskScore(type: SecurityEventType, severity: SecurityEventSeverity): number {
    const baseScores: Record<SecurityEventType, number> = {
      authentication: 3,
      authorization: 4,
      file_access: 2,
      input_validation: 3,
      configuration_change: 6,
      policy_violation: 7,
      intrusion_attempt: 9,
      data_integrity: 8,
      system_security: 7,
      compliance: 5,
    };
    
    const severityMultiplier: Record<SecurityEventSeverity, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };
    
    const baseScore = baseScores[type] || 5;
    const multiplier = severityMultiplier[severity] || 1.0;
    
    return Math.min(10, Math.round(baseScore * multiplier));
  }

  private shouldLogEvent(event: SecurityEvent): boolean {
    if (!this.config.enabled) {
      return false;
    }
    
    const severityLevels: Record<SecurityEventSeverity, number> = {
      low: 1, medium: 2, high: 3, critical: 4
    };
    
    return severityLevels[event.severity] >= severityLevels[this.config.minSeverity];
  }

  private async writeEventToLog(event: SecurityEvent): Promise<void> {
    if (!this.writeStream) {
      return;
    }
    
    const logEntry = JSON.stringify(event) + '\n';
    
    return new Promise((resolve, reject) => {
      this.writeStream!.write(logEntry, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async checkAlertRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || !rule.eventTypes.includes(event.type)) {
        continue;
      }
      
      const severityLevels: Record<SecurityEventSeverity, number> = {
        low: 1, medium: 2, high: 3, critical: 4
      };
      
      if (severityLevels[event.severity] < severityLevels[rule.minSeverity]) {
        continue;
      }
      
      // Check pattern if specified
      if (rule.pattern && !rule.pattern.test(JSON.stringify(event.data))) {
        continue;
      }
      
      // Check threshold
      const key = `${rule.id}_${event.type}`;
      const now = Date.now();
      const windowMs = rule.threshold.timeWindowMinutes * 60 * 1000;
      
      const countData = this.alertCounts.get(key) || { count: 0, timestamp: now };
      
      // Reset count if outside time window
      if (now - countData.timestamp > windowMs) {
        countData.count = 0;
        countData.timestamp = now;
      }
      
      countData.count++;
      this.alertCounts.set(key, countData);
      
      // Trigger alert if threshold exceeded
      if (countData.count >= rule.threshold.count) {
        await this.triggerAlert(rule, event, countData.count);
        
        // Reset counter after triggering
        countData.count = 0;
        countData.timestamp = now;
      }
    }
  }

  private async triggerAlert(rule: AlertRule, event: SecurityEvent, count: number): Promise<void> {
    const alertData = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: event,
      count,
      action: rule.action,
      timestamp: new Date().toISOString(),
    };
    
    logger.warn('Security alert triggered', alertData);
    
    // Log the alert as a security event
    await this.logSecurityEvent(
      'system_security',
      `Security alert: ${rule.name}`,
      alertData,
      {
        severity: 'high',
        outcome: 'warning',
        riskScore: 8,
      }
    );
    
    // TODO: Implement additional alert actions (email, webhook, etc.)
    switch (rule.action) {
      case 'notify':
        // Send notification
        break;
      case 'block':
        // Implement blocking logic
        break;
      case 'escalate':
        // Escalate to security team
        break;
    }
  }

  private sanitiseEventData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitised = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (field in sanitised) {
        sanitised[field] = '[REDACTED]';
      }
    }
    
    return sanitised;
  }

  private extractIpAddress(context?: LogContext): string | undefined {
    // Extract IP from context if available
    return context?.ipAddress as string;
  }

  private eventsToCSV(events: SecurityEvent[]): string {
    const headers = [
      'id', 'timestamp', 'type', 'severity', 'source', 'userId',
      'ipAddress', 'filePath', 'operation', 'description', 'outcome', 'riskScore'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const event of events) {
      const row = headers.map(header => {
        const value = event[header as keyof SecurityEvent];
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`; // Escape quotes
        }
        return value || '';
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  private startCleanupTimer(): void {
    // Run cleanup every hour
    this.logRotationTimer = setInterval(() => {
      this.clearOldEvents().catch(error => {
        logger.error('Security audit cleanup failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, 3600000);
  }

  /**
   * Shutdown audit logger gracefully
   */
  async shutdown(): Promise<void> {
    if (this.logRotationTimer) {
      clearInterval(this.logRotationTimer);
    }
    
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream!.end(() => {
          logger.info('Security audit logger shutdown complete');
          resolve();
        });
      });
    }
  }
}

/**
 * Factory function for easy access
 */
export function getSecurityAuditLogger(): SecurityAuditLogger {
  return SecurityAuditLogger.getInstance();
}

/**
 * Security monitoring middleware
 */
export class SecurityMonitor {
  private auditLogger: SecurityAuditLogger;
  
  constructor() {
    this.auditLogger = getSecurityAuditLogger();
  }
  
  /**
   * Monitor function execution for security events
   */
  async monitorExecution<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      
      await this.auditLogger.logSecurityEvent(
        'system_security',
        `Operation completed: ${operation}`,
        {
          operation,
          duration: Date.now() - startTime,
        },
        {
          severity: 'low',
          outcome: 'success',
          context,
        }
      );
      
      return result;
    } catch (error) {
      await this.auditLogger.logSecurityEvent(
        'system_security',
        `Operation failed: ${operation}`,
        {
          operation,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        },
        {
          severity: 'medium',
          outcome: 'failure',
          context,
        }
      );
      
      throw error;
    }
  }
}
