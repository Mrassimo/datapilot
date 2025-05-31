import blessed from 'blessed';
import { format } from '../../utils/format.js';

/**
 * Error boundary for TUI components
 * Provides graceful error handling and recovery
 */
export class ErrorBoundary {
  constructor(screen, options = {}) {
    this.screen = screen;
    this.onError = options.onError || this.defaultErrorHandler;
    this.onRecover = options.onRecover || (() => {});
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.errorLog = [];
    this.retryCount = new Map();
    this.isRecovering = false;
  }

  /**
   * Wrap a component method with error handling
   */
  wrap(fn, context, componentName = 'Component') {
    return async (...args) => {
      try {
        return await fn.apply(context, args);
      } catch (error) {
        await this.handleError(error, componentName, fn, context, args);
      }
    };
  }

  /**
   * Wrap all methods of a component
   */
  wrapComponent(component, componentName) {
    const prototype = Object.getPrototypeOf(component);
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => {
        if (name === 'constructor') return false;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
        return typeof descriptor.value === 'function';
      });

    methodNames.forEach(methodName => {
      const originalMethod = component[methodName];
      component[methodName] = this.wrap(originalMethod, component, `${componentName}.${methodName}`);
    });

    return component;
  }

  /**
   * Handle an error with retry logic
   */
  async handleError(error, componentName, fn, context, args) {
    // Log the error
    this.logError(error, componentName);

    // Get retry count for this component
    const retryKey = `${componentName}_${error.message}`;
    const currentRetries = this.retryCount.get(retryKey) || 0;

    // Check if we should retry
    if (currentRetries < this.maxRetries && this.isRetryableError(error)) {
      this.retryCount.set(retryKey, currentRetries + 1);
      
      // Show retry notification
      this.showRetryNotification(componentName, currentRetries + 1, this.maxRetries);
      
      // Wait before retry (disabled for testing)
      // await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      
      // Retry the operation
      try {
        const result = await fn.apply(context, args);
        // Success - reset retry count
        this.retryCount.delete(retryKey);
        this.hideNotification();
        return result;
      } catch (retryError) {
        // Retry failed, continue to error handling
        return this.handleError(retryError, componentName, fn, context, args);
      }
    }

    // Max retries exceeded or non-retryable error
    this.retryCount.delete(retryKey);
    
    // Call error handler
    await this.onError(error, componentName, this);
    
    // Attempt recovery if not already recovering
    if (!this.isRecovering) {
      this.isRecovering = true;
      try {
        await this.recover(error, componentName);
      } finally {
        this.isRecovering = false;
      }
    }
  }

  /**
   * Default error handler
   */
  defaultErrorHandler(error, componentName, boundary) {
    this.showErrorDialog(error, componentName);
  }

  /**
   * Show error dialog
   */
  showErrorDialog(error, componentName) {
    // Create error box
    const errorBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '40%',
      content: this.formatErrorMessage(error, componentName),
      tags: true,
      border: {
        type: 'line',
        fg: 'red'
      },
      style: {
        fg: 'white',
        bg: 'red',
        border: {
          fg: 'red'
        }
      },
      scrollable: true,
      keys: true,
      vi: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'grey'
        },
        style: {
          inverse: true
        }
      }
    });

    // Add close handler
    errorBox.key(['escape', 'q', 'enter'], () => {
      errorBox.destroy();
      this.screen.render();
    });

    // Focus and render
    errorBox.focus();
    this.screen.render();
  }

  /**
   * Show retry notification
   */
  showRetryNotification(componentName, attempt, maxAttempts) {
    if (this.notificationBox) {
      this.notificationBox.destroy();
    }

    this.notificationBox = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 'center',
      width: 'shrink',
      height: 3,
      content: ` Retrying ${componentName} (${attempt}/${maxAttempts})... `,
      style: {
        fg: 'yellow',
        bg: 'black',
        border: {
          fg: 'yellow'
        }
      },
      border: {
        type: 'line'
      }
    });

    this.screen.render();
  }

  /**
   * Hide notification
   */
  hideNotification() {
    if (this.notificationBox) {
      this.notificationBox.destroy();
      this.notificationBox = null;
      this.screen.render();
    }
  }

  /**
   * Format error message for display
   */
  formatErrorMessage(error, componentName) {
    const timestamp = new Date().toLocaleTimeString();
    const stack = error.stack || 'No stack trace available';
    
    return `{bold}{red-fg}Error in ${componentName}{/red-fg}{/bold}\n\n` +
           `{yellow-fg}Time:{/yellow-fg} ${timestamp}\n` +
           `{yellow-fg}Message:{/yellow-fg} ${error.message}\n\n` +
           `{yellow-fg}Stack Trace:{/yellow-fg}\n${stack}\n\n` +
           `{grey-fg}Press ESC, Q, or Enter to close{/grey-fg}`;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // File system temporary errors
    if (error.code === 'EBUSY' || error.code === 'EAGAIN') {
      return true;
    }
    
    // Custom retryable errors
    if (error.retryable === true) {
      return true;
    }
    
    return false;
  }

  /**
   * Attempt to recover from error
   */
  async recover(error, componentName) {
    // Attempt different recovery strategies
    const strategies = [
      () => this.recoverByReset(componentName),
      () => this.recoverByReload(componentName),
      () => this.recoverByFallback(componentName)
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        await this.onRecover(componentName);
        return;
      } catch (recoveryError) {
        // Continue to next strategy
      }
    }

    // All recovery strategies failed
    this.showFatalError(error, componentName);
  }

  /**
   * Recovery strategy: Reset component
   */
  async recoverByReset(componentName) {
    // Component-specific reset logic would go here
    // This is a placeholder for the actual implementation
  }

  /**
   * Recovery strategy: Reload component
   */
  async recoverByReload(componentName) {
    // Component-specific reload logic would go here
    // This is a placeholder for the actual implementation
  }

  /**
   * Recovery strategy: Fallback mode
   */
  async recoverByFallback(componentName) {
    // Component-specific fallback logic would go here
    // This is a placeholder for the actual implementation
  }

  /**
   * Show fatal error (unrecoverable)
   */
  showFatalError(error, componentName) {
    const fatalBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '70%',
      height: '50%',
      content: this.formatFatalError(error, componentName),
      tags: true,
      border: {
        type: 'line',
        fg: 'red'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'red'
        }
      }
    });

    // Exit on any key
    fatalBox.key(['escape', 'q', 'C-c'], () => {
      process.exit(1);
    });

    fatalBox.focus();
    this.screen.render();
  }

  /**
   * Format fatal error message
   */
  formatFatalError(error, componentName) {
    return `{bold}{red-fg}FATAL ERROR{/red-fg}{/bold}\n\n` +
           `Unable to recover from error in ${componentName}\n\n` +
           `{yellow-fg}Error:{/yellow-fg} ${error.message}\n\n` +
           `The application must be restarted.\n\n` +
           `{grey-fg}Press any key to exit{/grey-fg}`;
  }

  /**
   * Log error for debugging
   */
  logError(error, componentName) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      component: componentName,
      message: error.message,
      stack: error.stack,
      code: error.code
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byComponent: {},
      byCode: {},
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(entry => {
      // Count by component
      stats.byComponent[entry.component] = (stats.byComponent[entry.component] || 0) + 1;
      
      // Count by error code
      if (entry.code) {
        stats.byCode[entry.code] = (stats.byCode[entry.code] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    this.retryCount.clear();
  }
}

/**
 * Create error boundary instance
 */
export function createErrorBoundary(screen, options) {
  return new ErrorBoundary(screen, options);
}