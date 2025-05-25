export function createSamplingStrategy(records, analysisType) {
  const totalRows = records.length;
  
  // Define sampling thresholds
  const thresholds = {
    noSampling: 10000,      // No sampling needed
    lightSampling: 50000,   // Light sampling for some operations
    heavySampling: 100000,  // Heavy sampling for expensive operations
    streaming: 1000000      // Stream processing required
  };
  
  // Determine sampling strategy
  let strategy = {
    method: 'none',
    sampleSize: totalRows,
    samplingRate: 1.0,
    useStreaming: false,
    stratify: false
  };
  
  if (totalRows <= thresholds.noSampling) {
    return strategy;
  }
  
  // Analysis-specific sampling
  switch (analysisType) {
    case 'distribution':
    case 'outliers':
      if (totalRows > thresholds.heavySampling) {
        strategy = {
          method: 'stratified',
          sampleSize: Math.min(50000, Math.ceil(totalRows * 0.1)),
          samplingRate: 50000 / totalRows,
          useStreaming: false,
          stratify: true
        };
      } else if (totalRows > thresholds.lightSampling) {
        strategy = {
          method: 'random',
          sampleSize: Math.min(25000, Math.ceil(totalRows * 0.2)),
          samplingRate: 25000 / totalRows,
          useStreaming: false,
          stratify: false
        };
      }
      break;
      
    case 'regression':
    case 'cart':
      if (totalRows > thresholds.lightSampling) {
        strategy = {
          method: 'stratified',
          sampleSize: Math.min(10000, Math.ceil(totalRows * 0.2)),
          samplingRate: 10000 / totalRows,
          useStreaming: false,
          stratify: true
        };
      }
      break;
      
    case 'timeseries':
      // Time series should maintain temporal order
      if (totalRows > thresholds.heavySampling) {
        strategy = {
          method: 'systematic',
          sampleSize: Math.min(50000, totalRows),
          samplingRate: 50000 / totalRows,
          useStreaming: false,
          stratify: false
        };
      }
      break;
      
    case 'basic':
      // Basic statistics can use reservoir sampling for very large datasets
      if (totalRows > thresholds.streaming) {
        strategy = {
          method: 'reservoir',
          sampleSize: 100000,
          samplingRate: 100000 / totalRows,
          useStreaming: true,
          stratify: false
        };
      }
      break;
  }
  
  return strategy;
}

export function performSampling(records, strategy, targetColumn = null) {
  if (strategy.method === 'none') {
    return records;
  }
  
  switch (strategy.method) {
    case 'random':
      return randomSample(records, strategy.sampleSize);
      
    case 'stratified':
      return stratifiedSample(records, strategy.sampleSize, targetColumn);
      
    case 'systematic':
      return systematicSample(records, strategy.sampleSize);
      
    case 'reservoir':
      return reservoirSample(records, strategy.sampleSize);
      
    default:
      return records;
  }
}

function randomSample(records, sampleSize) {
  if (sampleSize >= records.length) {
    return records;
  }
  
  // Fisher-Yates shuffle for first n elements
  const sampled = [...records];
  for (let i = 0; i < sampleSize; i++) {
    const j = Math.floor(Math.random() * (sampled.length - i)) + i;
    [sampled[i], sampled[j]] = [sampled[j], sampled[i]];
  }
  
  return sampled.slice(0, sampleSize);
}

function stratifiedSample(records, sampleSize, targetColumn) {
  if (!targetColumn || sampleSize >= records.length) {
    return randomSample(records, sampleSize);
  }
  
  // Group by target column
  const strata = {};
  records.forEach(record => {
    const key = String(record[targetColumn] || 'null');
    if (!strata[key]) {
      strata[key] = [];
    }
    strata[key].push(record);
  });
  
  // Calculate samples per stratum
  const sampled = [];
  const strataCount = Object.keys(strata).length;
  
  Object.entries(strata).forEach(([key, stratum]) => {
    const stratumRatio = stratum.length / records.length;
    const stratumSampleSize = Math.max(1, Math.round(sampleSize * stratumRatio));
    
    const stratumSample = randomSample(stratum, stratumSampleSize);
    sampled.push(...stratumSample);
  });
  
  // Adjust if we have too many or too few samples
  if (sampled.length > sampleSize) {
    return randomSample(sampled, sampleSize);
  }
  
  return sampled;
}

function systematicSample(records, sampleSize) {
  if (sampleSize >= records.length) {
    return records;
  }
  
  const interval = Math.floor(records.length / sampleSize);
  const start = Math.floor(Math.random() * interval);
  const sampled = [];
  
  for (let i = start; i < records.length && sampled.length < sampleSize; i += interval) {
    sampled.push(records[i]);
  }
  
  return sampled;
}

function reservoirSample(records, sampleSize) {
  if (sampleSize >= records.length) {
    return records;
  }
  
  // Algorithm R - Reservoir sampling
  const reservoir = records.slice(0, sampleSize);
  
  for (let i = sampleSize; i < records.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < sampleSize) {
      reservoir[j] = records[i];
    }
  }
  
  return reservoir;
}

export function createProgressTracker(totalOperations, spinner) {
  let completed = 0;
  let lastUpdate = Date.now();
  const updateInterval = 500; // Update every 500ms
  
  return {
    increment(count = 1) {
      completed += count;
      
      const now = Date.now();
      if (spinner && now - lastUpdate > updateInterval) {
        const percentage = ((completed / totalOperations) * 100).toFixed(0);
        spinner.text = `Processing... ${percentage}% complete`;
        lastUpdate = now;
      }
    },
    
    setMessage(message) {
      if (spinner) {
        spinner.text = message;
      }
    },
    
    complete() {
      completed = totalOperations;
      if (spinner) {
        spinner.succeed('Processing complete');
      }
    }
  };
}

export function optimizeMemoryUsage(operation, data) {
  const memoryThreshold = 500 * 1024 * 1024; // 500MB threshold
  
  // Estimate memory usage
  const estimatedSize = estimateDataSize(data);
  
  if (estimatedSize > memoryThreshold) {
    return {
      useChunking: true,
      chunkSize: Math.ceil(data.length / Math.ceil(estimatedSize / memoryThreshold)),
      cleanupRequired: true
    };
  }
  
  return {
    useChunking: false,
    chunkSize: data.length,
    cleanupRequired: false
  };
}

function estimateDataSize(data) {
  if (!data || data.length === 0) return 0;
  
  // Sample first 100 records to estimate size
  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);
  
  let totalSize = 0;
  sample.forEach(record => {
    totalSize += estimateObjectSize(record);
  });
  
  return (totalSize / sampleSize) * data.length;
}

function estimateObjectSize(obj) {
  let size = 0;
  
  for (const key in obj) {
    size += key.length * 2; // Key size (UTF-16)
    
    const value = obj[key];
    if (typeof value === 'string') {
      size += value.length * 2; // String size (UTF-16)
    } else if (typeof value === 'number') {
      size += 8; // Number size
    } else if (value instanceof Date) {
      size += 8; // Date size
    } else {
      size += 4; // Other types (approximate)
    }
  }
  
  return size + 32; // Object overhead
}