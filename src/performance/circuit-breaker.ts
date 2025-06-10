/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and enables graceful degradation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, blocking requests
  HALF_OPEN = 'half-open' // Testing if service recovered
}

interface CircuitBreakerOptions {
  failureThreshold?: number;    // Number of failures before opening
  resetTimeout?: number;        // Time before trying half-open
  monitoringPeriod?: number;    // Window for failure counting
  successThreshold?: number;    // Successes needed to close from half-open
  timeoutMs?: number;          // Timeout for individual calls
  volumeThreshold?: number;     // Minimum calls before evaluating failure rate
}

interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  stateChangeTime: number;
  failureRate: number;
}

export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private stateChangeTime = Date.now();
  private recentCalls: { success: boolean; timestamp: number }[] = [];
  private resetTimer?: NodeJS.Timeout;
  
  private readonly options: Required<CircuitBreakerOptions>;
  private readonly operation: T;
  private readonly name: string;

  constructor(operation: T, name: string, options: CircuitBreakerOptions = {}) {
    super();
    
    this.operation = operation;
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      successThreshold: options.successThreshold || 3,
      timeoutMs: options.timeoutMs || 30000, // 30 seconds
      volumeThreshold: options.volumeThreshold || 10
    };
  }

  /**
   * Execute the wrapped operation with circuit breaker protection
   */
  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    this.cleanupOldCalls();
    
    if (this.state === CircuitState.OPEN) {
      this.emit('circuit-open-rejection', { name: this.name, args });
      throw new CircuitBreakerOpenError(`Circuit breaker ${this.name} is OPEN`);
    }

    const startTime = performance.now();
    this.totalCalls++;

    try {
      // Add timeout protection
      const result = await this.executeWithTimeout(args);
      
      const executionTime = performance.now() - startTime;
      this.onSuccess(executionTime);
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.onFailure(error, executionTime);
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout(args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new CircuitBreakerTimeoutError(`Operation ${this.name} timed out after ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);

      this.operation(...args)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(executionTime: number): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.recentCalls.push({ success: true, timestamp: Date.now() });

    this.emit('success', {
      name: this.name,
      executionTime,
      state: this.state,
      metrics: this.getMetrics()
    });

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error, executionTime: number): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.recentCalls.push({ success: false, timestamp: Date.now() });

    this.emit('failure', {
      name: this.name,
      error: error.message,
      executionTime,
      state: this.state,
      metrics: this.getMetrics()
    });

    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.shouldOpenCircuit()) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Determine if circuit should open based on failure criteria
   */
  private shouldOpenCircuit(): boolean {
    const recentFailures = this.recentCalls.filter(call => !call.success).length;
    const failureRate = this.recentCalls.length > 0 ? recentFailures / this.recentCalls.length : 0;
    
    // Need minimum volume and either threshold failures or high failure rate
    return this.recentCalls.length >= this.options.volumeThreshold &&
           (recentFailures >= this.options.failureThreshold || failureRate > 0.5);
  }

  /**
   * Transition circuit to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTime = Date.now();

    logger.info(`Circuit breaker ${this.name} transitioned from ${oldState} to ${newState}`);
    
    this.emit('state-change', {
      name: this.name,
      oldState,
      newState,
      metrics: this.getMetrics()
    });

    if (newState === CircuitState.OPEN) {
      this.scheduleReset();
    } else if (newState === CircuitState.CLOSED) {
      this.reset();
    }
  }

  /**
   * Schedule transition to half-open state
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }, this.options.resetTimeout);
  }

  /**
   * Reset circuit breaker metrics
   */
  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.recentCalls = [];
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  /**
   * Clean up old call records outside monitoring period
   */
  private cleanupOldCalls(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.recentCalls = this.recentCalls.filter(call => call.timestamp > cutoff);
  }

  /**
   * Force circuit to specific state (for testing/recovery)
   */
  forceState(state: CircuitState): void {
    this.transitionTo(state);
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    this.cleanupOldCalls();
    
    const recentFailures = this.recentCalls.filter(call => !call.success).length;
    const failureRate = this.recentCalls.length > 0 ? recentFailures / this.recentCalls.length : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangeTime: this.stateChangeTime,
      failureRate
    };
  }

  /**
   * Check if circuit is available for requests
   */
  isAvailable(): boolean {
    return this.state !== CircuitState.OPEN;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Shutdown circuit breaker
   */
  shutdown(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    
    this.emit('shutdown', { name: this.name });
  }
}

/**
 * Circuit breaker specific error types
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

/**
 * Circuit breaker manager for multiple operations
 */
export class CircuitBreakerManager extends EventEmitter {
  private breakers = new Map<string, CircuitBreaker<any>>();

  /**
   * Create or get circuit breaker for operation
   */
  getCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
    name: string,
    operation: T,
    options?: CircuitBreakerOptions
  ): CircuitBreaker<T> {
    let breaker = this.breakers.get(name) as CircuitBreaker<T>;
    
    if (!breaker) {
      breaker = new CircuitBreaker(operation, name, options);
      this.breakers.set(name, breaker);
      
      // Forward events
      breaker.on('state-change', (data) => this.emit('breaker-state-change', data));
      breaker.on('failure', (data) => this.emit('breaker-failure', data));
      breaker.on('success', (data) => this.emit('breaker-success', data));
    }
    
    return breaker;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): { [name: string]: CircuitBreakerMetrics } {
    const metrics: { [name: string]: CircuitBreakerMetrics } = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalBreakers: number;
    openBreakers: number;
    halfOpenBreakers: number;
    closedBreakers: number;
    overallHealth: number;
  } {
    const metrics = this.getAllMetrics();
    const breakers = Object.values(metrics);
    
    const openCount = breakers.filter(b => b.state === CircuitState.OPEN).length;
    const halfOpenCount = breakers.filter(b => b.state === CircuitState.HALF_OPEN).length;
    const closedCount = breakers.filter(b => b.state === CircuitState.CLOSED).length;
    
    const overallHealth = breakers.length > 0 ? (closedCount / breakers.length) * 100 : 100;
    
    return {
      totalBreakers: breakers.length,
      openBreakers: openCount,
      halfOpenBreakers: halfOpenCount,
      closedBreakers: closedCount,
      overallHealth
    };
  }

  /**
   * Force all circuits to closed state (emergency recovery)
   */
  forceAllClosed(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceState(CircuitState.CLOSED);
    }
    
    logger.warn('Forced all circuit breakers to CLOSED state');
    this.emit('emergency-reset');
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdown(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    
    this.breakers.clear();
    this.emit('shutdown');
  }
}

/**
 * Global circuit breaker manager
 */
let globalCircuitBreakerManager: CircuitBreakerManager | null = null;

export function getGlobalCircuitBreakerManager(): CircuitBreakerManager {
  if (!globalCircuitBreakerManager) {
    globalCircuitBreakerManager = new CircuitBreakerManager();
  }
  return globalCircuitBreakerManager;
}

export function shutdownGlobalCircuitBreakerManager(): void {
  if (globalCircuitBreakerManager) {
    globalCircuitBreakerManager.shutdown();
    globalCircuitBreakerManager = null;
  }
}