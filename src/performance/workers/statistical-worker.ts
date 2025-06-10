/**
 * Statistical Analysis Worker
 * Handles CPU-intensive statistical computations in parallel
 */

import { parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';

interface StatisticalTask {
  taskId: string;
  type: string;
  data: any;
  enableMemoryMonitoring: boolean;
  memoryLimitMB: number;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
}

/**
 * Statistical computation functions
 */
class StatisticalComputer {
  
  /**
   * Calculate descriptive statistics for a column
   */
  static calculateDescriptiveStats(values: number[]): any {
    if (values.length === 0) {
      return {
        count: 0,
        mean: null,
        median: null,
        mode: null,
        std: null,
        variance: null,
        min: null,
        max: null,
        range: null,
        q1: null,
        q3: null,
        iqr: null,
        skewness: null,
        kurtosis: null
      };
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    
    // Basic statistics
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;
    
    // Median
    const median = n % 2 === 0 
      ? (sorted[Math.floor(n / 2) - 1] + sorted[Math.floor(n / 2)]) / 2
      : sorted[Math.floor(n / 2)];
    
    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    // Variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    // Mode (most frequent value)
    const freqMap = new Map<number, number>();
    values.forEach(val => freqMap.set(val, (freqMap.get(val) || 0) + 1));
    const maxFreq = Math.max(...freqMap.values());
    const modes = Array.from(freqMap.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val, _]) => val);
    const mode = modes.length === values.length ? null : modes[0];
    
    // Skewness (measure of asymmetry)
    const skewness = n < 3 ? null : 
      (values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0) / n);
    
    // Kurtosis (measure of tail heaviness)
    const kurtosis = n < 4 ? null :
      (values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0) / n) - 3;

    return {
      count: n,
      mean: Number(mean.toFixed(6)),
      median: Number(median.toFixed(6)),
      mode,
      std: Number(std.toFixed(6)),
      variance: Number(variance.toFixed(6)),
      min,
      max,
      range,
      q1,
      q3,
      iqr,
      skewness: skewness ? Number(skewness.toFixed(6)) : null,
      kurtosis: kurtosis ? Number(kurtosis.toFixed(6)) : null
    };
  }

  /**
   * Calculate correlation between two numeric arrays
   */
  static calculateCorrelation(x: number[], y: number[]): number | null {
    if (x.length !== y.length || x.length < 2) return null;

    const n = x.length;
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumXX = x.reduce((acc, val) => acc + val * val, 0);
    const sumYY = y.reduce((acc, val) => acc + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    if (denominator === 0) return null;
    
    const correlation = numerator / denominator;
    return Number(correlation.toFixed(6));
  }

  /**
   * Perform linear regression
   */
  static calculateLinearRegression(x: number[], y: number[]): any {
    if (x.length !== y.length || x.length < 2) {
      return {
        slope: null,
        intercept: null,
        rSquared: null,
        pValue: null
      };
    }

    const n = x.length;
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumXX = x.reduce((acc, val) => acc + val * val, 0);
    const sumYY = y.reduce((acc, val) => acc + val * val, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    const numerator = sumXY - n * meanX * meanY;
    const denominator = sumXX - n * meanX * meanX;

    if (denominator === 0) {
      return {
        slope: null,
        intercept: null,
        rSquared: null,
        pValue: null
      };
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Calculate R-squared
    const totalSumSquares = sumYY - n * meanY * meanY;
    const residualSumSquares = y.reduce((acc, val, i) => {
      const predicted = slope * x[i] + intercept;
      return acc + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares);

    return {
      slope: Number(slope.toFixed(6)),
      intercept: Number(intercept.toFixed(6)),
      rSquared: Number(rSquared.toFixed(6)),
      pValue: null // P-value calculation requires more complex statistics
    };
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliersIQR(values: number[], multiplier: number = 1.5): any {
    if (values.length === 0) return { outliers: [], outlierIndices: [] };

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    
    const outliers: number[] = [];
    const outlierIndices: number[] = [];
    
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        outlierIndices.push(index);
      }
    });

    return {
      outliers,
      outlierIndices,
      lowerBound,
      upperBound,
      q1,
      q3,
      iqr
    };
  }

  /**
   * Calculate frequency distribution for categorical data
   */
  static calculateFrequencyDistribution(values: any[]): any {
    const freqMap = new Map<any, number>();
    values.forEach(val => {
      const key = val === null || val === undefined ? '<null>' : String(val);
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });

    const total = values.length;
    const distribution = Array.from(freqMap.entries())
      .map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / total) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    const uniqueCount = freqMap.size;
    const entropy = -distribution.reduce((acc, item) => {
      const p = item.count / total;
      return acc + (p * Math.log2(p));
    }, 0);

    return {
      distribution,
      uniqueCount,
      totalCount: total,
      entropy: Number(entropy.toFixed(6)),
      mostFrequent: distribution[0],
      leastFrequent: distribution[distribution.length - 1]
    };
  }

  /**
   * Batch processing for large datasets
   */
  static processInBatches<T, R>(
    data: T[], 
    processor: (batch: T[]) => R, 
    batchSize: number = 10000
  ): R[] {
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      results.push(processor(batch));
    }
    
    return results;
  }
}

/**
 * Handle incoming tasks
 */
function handleTask(task: StatisticalTask): TaskResult {
  const startTime = performance.now();
  let memoryBefore: number | undefined;
  
  if (task.enableMemoryMonitoring) {
    memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  try {
    let result: any;

    switch (task.type) {
      case 'descriptive-stats':
        result = StatisticalComputer.calculateDescriptiveStats(task.data.values);
        break;

      case 'correlation':
        result = StatisticalComputer.calculateCorrelation(task.data.x, task.data.y);
        break;

      case 'linear-regression':
        result = StatisticalComputer.calculateLinearRegression(task.data.x, task.data.y);
        break;

      case 'outlier-detection':
        result = StatisticalComputer.detectOutliersIQR(task.data.values, task.data.multiplier);
        break;

      case 'frequency-distribution':
        result = StatisticalComputer.calculateFrequencyDistribution(task.data.values);
        break;

      case 'batch-descriptive-stats':
        result = StatisticalComputer.processInBatches(
          task.data.datasets,
          (batch) => batch.map((values: number[]) => StatisticalComputer.calculateDescriptiveStats(values)),
          task.data.batchSize
        ).flat();
        break;

      case 'batch-correlations':
        result = StatisticalComputer.processInBatches(
          task.data.pairs,
          (batch) => batch.map((pair: { x: number[], y: number[] }) => 
            StatisticalComputer.calculateCorrelation(pair.x, pair.y)
          ),
          task.data.batchSize
        ).flat();
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    const executionTime = performance.now() - startTime;
    let memoryUsage: number | undefined;
    
    if (task.enableMemoryMonitoring && memoryBefore !== undefined) {
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      memoryUsage = memoryAfter - memoryBefore;
      
      // Check memory limit
      if (memoryAfter > task.memoryLimitMB) {
        throw new Error(`Memory limit exceeded: ${memoryAfter.toFixed(2)}MB > ${task.memoryLimitMB}MB`);
      }
    }

    return {
      taskId: task.taskId,
      success: true,
      result,
      executionTime,
      memoryUsage
    };

  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return {
      taskId: task.taskId,
      success: false,
      error: error.message,
      executionTime
    };
  }
}

// Worker initialization
if (parentPort) {
  // Signal that worker is ready
  parentPort.postMessage({ type: 'ready' });

  // Handle incoming messages
  parentPort.on('message', (task: StatisticalTask) => {
    const result = handleTask(task);
    parentPort!.postMessage(result);
  });
} else {
  console.error('Statistical worker: parentPort is null');
  process.exit(1);
}