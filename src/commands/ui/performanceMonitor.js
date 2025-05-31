import { performance } from 'perf_hooks';
import blessed from 'blessed';

/**
 * Performance monitoring for TUI components
 * Tracks render times, input lag, and resource usage
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.debug = options.debug || false;
    this.thresholds = {
      renderTime: 16.67, // 60 FPS target
      inputLag: 100,
      memoryUsage: 100 * 1024 * 1024, // 100MB
      ...options.thresholds
    };
    
    // Metrics storage
    this.metrics = {
      renders: [],
      inputs: [],
      operations: [],
      memory: [],
      errors: []
    };
    
    // Performance marks
    this.marks = new Map();
    this.measures = new Map();
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.displayBox = null;
    
    // Performance budget
    this.budget = options.budget || {};
    this.violations = [];
  }

  /**
   * Start monitoring
   */
  start() {
    if (!this.enabled || this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Start memory monitoring
    this.monitorInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 1000);
    
    if (this.debug) {
      console.log('[PerformanceMonitor] Started monitoring');
    }
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    if (this.debug) {
      console.log('[PerformanceMonitor] Stopped monitoring');
    }
  }

  /**
   * Mark start of an operation
   */
  mark(name) {
    if (!this.enabled) return;
    
    const markName = `${name}_${Date.now()}`;
    this.marks.set(name, markName);
    performance.mark(markName);
  }

  /**
   * Measure duration since mark
   */
  measure(name, category = 'operation') {
    if (!this.enabled) return null;
    
    const markName = this.marks.get(name);
    if (!markName) {
      console.warn(`[PerformanceMonitor] No mark found for '${name}'`);
      return null;
    }
    
    const measureName = `${name}_measure_${Date.now()}`;
    
    try {
      performance.measure(measureName, markName);
      const measure = performance.getEntriesByName(measureName)[0];
      const duration = measure.duration;
      
      // Record the measurement
      this.recordMetric(category, name, duration);
      
      // Clean up
      performance.clearMarks(markName);
      performance.clearMeasures(measureName);
      this.marks.delete(name);
      
      // Check threshold
      this.checkThreshold(category, name, duration);
      
      return duration;
    } catch (error) {
      console.error(`[PerformanceMonitor] Error measuring '${name}':`, error);
      return null;
    }
  }

  /**
   * Record a metric
   */
  recordMetric(category, name, value) {
    const metric = {
      name,
      value,
      timestamp: Date.now()
    };
    
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push(metric);
    
    // Keep metrics size manageable
    if (this.metrics[category].length > 1000) {
      this.metrics[category].shift();
    }
  }

  /**
   * Record render time
   */
  recordRender(duration) {
    if (!this.enabled) return;
    
    this.recordMetric('renders', 'render', duration);
    this.checkThreshold('renders', 'render', duration);
  }

  /**
   * Record input lag
   */
  recordInputLag(duration) {
    if (!this.enabled) return;
    
    this.recordMetric('inputs', 'input', duration);
    this.checkThreshold('inputs', 'input', duration);
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if (!this.enabled) return;
    
    const usage = process.memoryUsage();
    this.recordMetric('memory', 'heapUsed', usage.heapUsed);
    this.recordMetric('memory', 'heapTotal', usage.heapTotal);
    this.recordMetric('memory', 'rss', usage.rss);
    this.recordMetric('memory', 'external', usage.external);
    
    // Check memory threshold
    if (usage.heapUsed > this.thresholds.memoryUsage) {
      this.addViolation('memory', 'heapUsed', usage.heapUsed, this.thresholds.memoryUsage);
    }
  }

  /**
   * Record error
   */
  recordError(error, context) {
    if (!this.enabled) return;
    
    this.metrics.errors.push({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
    
    // Keep error log size manageable
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Check threshold violation
   */
  checkThreshold(category, name, value) {
    let threshold = null;
    
    if (category === 'renders' && this.thresholds.renderTime) {
      threshold = this.thresholds.renderTime;
    } else if (category === 'inputs' && this.thresholds.inputLag) {
      threshold = this.thresholds.inputLag;
    } else if (this.budget[name]) {
      threshold = this.budget[name];
    }
    
    if (threshold && value > threshold) {
      this.addViolation(category, name, value, threshold);
    }
  }

  /**
   * Add threshold violation
   */
  addViolation(category, name, value, threshold) {
    const violation = {
      category,
      name,
      value,
      threshold,
      excess: value - threshold,
      percentage: ((value / threshold - 1) * 100).toFixed(2),
      timestamp: Date.now()
    };
    
    this.violations.push(violation);
    
    // Keep violations size manageable
    if (this.violations.length > 100) {
      this.violations.shift();
    }
    
    if (this.debug) {
      console.warn(
        `[PerformanceMonitor] Threshold violation: ${name} (${value.toFixed(2)}ms > ${threshold}ms)`
      );
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary = {
      renders: this.getMetricsSummary('renders'),
      inputs: this.getMetricsSummary('inputs'),
      operations: this.getOperationsSummary(),
      memory: this.getMemorySummary(),
      errors: this.metrics.errors.length,
      violations: this.violations.length,
      uptime: process.uptime()
    };
    
    return summary;
  }

  /**
   * Get metrics summary for category
   */
  getMetricsSummary(category) {
    const metrics = this.metrics[category];
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map(m => m.value);
    const sorted = values.sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get operations summary grouped by name
   */
  getOperationsSummary() {
    const operations = this.metrics.operations;
    if (!operations || operations.length === 0) {
      return {};
    }
    
    const grouped = {};
    
    operations.forEach(op => {
      if (!grouped[op.name]) {
        grouped[op.name] = [];
      }
      grouped[op.name].push(op.value);
    });
    
    const summary = {};
    
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)]
      };
    });
    
    return summary;
  }

  /**
   * Get memory summary
   */
  getMemorySummary() {
    const memory = this.metrics.memory;
    if (!memory || memory.length === 0) {
      return null;
    }
    
    const latest = {};
    const trends = {};
    
    // Get latest values for each metric
    ['heapUsed', 'heapTotal', 'rss', 'external'].forEach(metric => {
      const values = memory.filter(m => m.name === metric).map(m => m.value);
      if (values.length > 0) {
        latest[metric] = values[values.length - 1];
        
        // Calculate trend (last 10 vs previous 10)
        if (values.length >= 20) {
          const recent = values.slice(-10);
          const previous = values.slice(-20, -10);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
          trends[metric] = ((recentAvg / previousAvg - 1) * 100).toFixed(2);
        }
      }
    });
    
    return {
      current: latest,
      trends
    };
  }

  /**
   * Display performance overlay
   */
  showOverlay(screen) {
    if (this.displayBox) {
      this.hideOverlay();
    }
    
    this.displayBox = blessed.box({
      parent: screen,
      top: 0,
      right: 0,
      width: 40,
      height: 20,
      content: this.formatSummary(),
      tags: true,
      border: {
        type: 'line',
        fg: 'cyan'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'cyan'
        },
        transparent: true
      },
      scrollable: true,
      keys: true,
      vi: true
    });
    
    // Update content periodically
    this.displayInterval = setInterval(() => {
      if (this.displayBox) {
        this.displayBox.setContent(this.formatSummary());
        screen.render();
      }
    }, 1000);
    
    // Close on escape
    this.displayBox.key(['escape', 'q'], () => {
      this.hideOverlay();
    });
    
    screen.render();
  }

  /**
   * Hide performance overlay
   */
  hideOverlay() {
    if (this.displayBox) {
      this.displayBox.destroy();
      this.displayBox = null;
    }
    
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
      this.displayInterval = null;
    }
  }

  /**
   * Format summary for display
   */
  formatSummary() {
    const summary = this.getSummary();
    const memory = summary.memory?.current || {};
    
    let content = '{bold}{cyan-fg}Performance Monitor{/cyan-fg}{/bold}\n\n';
    
    // Render performance
    if (summary.renders) {
      content += '{yellow-fg}Render Performance:{/yellow-fg}\n';
      content += `  FPS: ${(1000 / summary.renders.avg).toFixed(1)}\n`;
      content += `  Avg: ${summary.renders.avg.toFixed(2)}ms\n`;
      content += `  P95: ${summary.renders.p95.toFixed(2)}ms\n\n`;
    }
    
    // Input lag
    if (summary.inputs) {
      content += '{yellow-fg}Input Lag:{/yellow-fg}\n';
      content += `  Avg: ${summary.inputs.avg.toFixed(2)}ms\n`;
      content += `  Max: ${summary.inputs.max.toFixed(2)}ms\n\n`;
    }
    
    // Memory usage
    content += '{yellow-fg}Memory Usage:{/yellow-fg}\n';
    content += `  Heap: ${this.formatBytes(memory.heapUsed || 0)}\n`;
    content += `  RSS: ${this.formatBytes(memory.rss || 0)}\n\n`;
    
    // Violations
    if (this.violations.length > 0) {
      content += `{red-fg}Violations: ${this.violations.length}{/red-fg}\n`;
      const recent = this.violations.slice(-3);
      recent.forEach(v => {
        content += `  ${v.name}: +${v.percentage}%\n`;
      });
    }
    
    // Errors
    if (summary.errors > 0) {
      content += `\n{red-fg}Errors: ${summary.errors}{/red-fg}\n`;
    }
    
    content += '\n{grey-fg}Press ESC to close{/grey-fg}';
    
    return content;
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
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      summary: this.getSummary(),
      metrics: this.metrics,
      violations: this.violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      renders: [],
      inputs: [],
      operations: [],
      memory: [],
      errors: []
    };
    this.violations = [];
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Create performance monitor instance
 */
export function createPerformanceMonitor(options) {
  return new PerformanceMonitor(options);
}

/**
 * Performance decorator for methods
 */
export function monitored(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args) {
    const monitor = this.performanceMonitor || this._performanceMonitor;
    
    if (!monitor || !monitor.enabled) {
      return originalMethod.apply(this, args);
    }
    
    const operationName = `${target.constructor.name}.${propertyKey}`;
    monitor.mark(operationName);
    
    try {
      const result = await originalMethod.apply(this, args);
      monitor.measure(operationName, 'operations');
      return result;
    } catch (error) {
      monitor.recordError(error, operationName);
      throw error;
    }
  };
  
  return descriptor;
}