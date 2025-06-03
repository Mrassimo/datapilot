/**
 * Progress Estimation Utility
 * Estimates processing time and provides user-friendly sampling prompts
 */

import chalk from 'chalk';
import readline from 'readline';

// Performance benchmarks (operations per second) based on typical analysis performance
const PERFORMANCE_BENCHMARKS = {
  basicStats: 5000,        // rows per second
  outlierDetection: 2000,   // rows per second
  distributions: 1500,      // rows per second
  correlations: 800,        // rows per second (expensive)
  regression: 400,          // rows per second (very expensive)
  cart: 300,               // rows per second (very expensive)
  timeSeries: 1000,        // rows per second
  mlReadiness: 600         // rows per second
};

/**
 * Estimate processing time based on dataset size and analysis types
 */
export function estimateProcessingTime(recordCount, analysisNeeds = {}) {
  let totalTimeSeconds = 0;
  
  // Base parsing and column detection time
  totalTimeSeconds += recordCount / 10000; // Very fast for parsing
  
  // Analysis-specific time estimation
  if (analysisNeeds.basicStats !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.basicStats;
  }
  
  if (analysisNeeds.outliers !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.outlierDetection;
  }
  
  if (analysisNeeds.distributions !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.distributions;
  }
  
  if (analysisNeeds.correlationAnalysis !== false) {
    // Correlation is O(n²) for columns, O(n) for rows
    const columnFactor = Math.min(50, recordCount / 100); // Estimate column count
    totalTimeSeconds += (recordCount * columnFactor) / PERFORMANCE_BENCHMARKS.correlations;
  }
  
  if (analysisNeeds.regression !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.regression;
  }
  
  if (analysisNeeds.cart !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.cart;
  }
  
  if (analysisNeeds.timeSeries !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.timeSeries;
  }
  
  if (analysisNeeds.mlReadiness !== false) {
    totalTimeSeconds += recordCount / PERFORMANCE_BENCHMARKS.mlReadiness;
  }
  
  // Add buffer for overhead and disk I/O
  totalTimeSeconds *= 1.3;
  
  return totalTimeSeconds;
}

/**
 * Format estimated time in a human-readable way
 */
export function formatEstimatedTime(seconds) {
  if (seconds < 1) {
    return 'less than 1 second';
  } else if (seconds < 60) {
    return `about ${Math.ceil(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `about ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return `about ${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
  }
}

/**
 * Determine if sampling should be used based on estimated time
 */
export function shouldUseSampling(recordCount, estimatedTimeSeconds, options = {}) {
  const thresholds = {
    alwaysSample: options.alwaysSample || 120,    // Always sample if > 2 minutes
    askUser: options.askUser || 60,              // Ask user if > 1 minute
    autoSample: options.autoSample || 30,        // Auto sample if > 30 seconds for large datasets
    minRowsForSampling: options.minRowsForSampling || 5000  // Don't sample below this threshold
  };
  
  // Don't sample very small datasets
  if (recordCount < thresholds.minRowsForSampling) {
    return { shouldSample: false, reason: 'dataset_too_small' };
  }
  
  // Always sample if estimated time is very long
  if (estimatedTimeSeconds > thresholds.alwaysSample) {
    return { 
      shouldSample: true, 
      reason: 'auto_sample_long', 
      sampleSize: Math.min(20000, Math.max(5000, Math.floor(recordCount * 0.2)))
    };
  }
  
  // Ask user if estimated time is moderate
  if (estimatedTimeSeconds > thresholds.askUser) {
    return { 
      shouldSample: 'ask_user', 
      reason: 'user_choice',
      sampleSize: Math.min(15000, Math.max(5000, Math.floor(recordCount * 0.3)))
    };
  }
  
  // Auto sample for large datasets even if time is reasonable
  if (recordCount > 25000 && estimatedTimeSeconds > thresholds.autoSample) {
    return { 
      shouldSample: true, 
      reason: 'auto_sample_large',
      sampleSize: Math.min(20000, Math.floor(recordCount * 0.4))
    };
  }
  
  return { shouldSample: false, reason: 'fast_enough' };
}

/**
 * Ask user if they want to use sampling (interactive prompt)
 */
export async function askUserForSampling(recordCount, estimatedTimeSeconds, suggestedSampleSize) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.yellow('\n⏱️  Processing Time Estimation:'));
  console.log(chalk.white(`   📊 Dataset size: ${recordCount.toLocaleString()} rows`));
  console.log(chalk.white(`   ⏲️  Estimated time: ${formatEstimatedTime(estimatedTimeSeconds)}`));
  console.log(chalk.white(`   🎯 Suggested sample: ${suggestedSampleSize.toLocaleString()} rows (${Math.round((suggestedSampleSize/recordCount)*100)}%)`));
  
  console.log(chalk.cyan('\n💡 Sampling Options:'));
  console.log(chalk.white('   [f] Full analysis (process all rows)'));
  console.log(chalk.white('   [s] Smart sampling (recommended for speed)'));
  console.log(chalk.white('   [c] Custom sample size'));
  console.log(chalk.white('   [q] Quit'));
  
  const answer = await new Promise(resolve => {
    rl.question(chalk.cyan('\nChoose an option [s]: '), answer => {
      resolve(answer.toLowerCase().trim() || 's');
    });
  });
  
  rl.close();
  
  switch (answer) {
    case 'f':
    case 'full':
      console.log(chalk.green('✅ Processing full dataset...'));
      return { useSampling: false };
      
    case 's':
    case 'sample':
    case '':
      console.log(chalk.green(`✅ Using smart sampling (${suggestedSampleSize.toLocaleString()} rows)...`));
      return { useSampling: true, sampleSize: suggestedSampleSize };
      
    case 'c':
    case 'custom':
      const customSize = await askCustomSampleSize(recordCount);
      return { useSampling: true, sampleSize: customSize };
      
    case 'q':
    case 'quit':
      console.log(chalk.yellow('Analysis cancelled.'));
      process.exit(0);
      
    default:
      console.log(chalk.yellow('Invalid option, using smart sampling...'));
      return { useSampling: true, sampleSize: suggestedSampleSize };
  }
}

/**
 * Ask user for custom sample size
 */
async function askCustomSampleSize(recordCount) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const defaultSize = Math.min(10000, Math.floor(recordCount * 0.5));
  
  const answer = await new Promise(resolve => {
    rl.question(chalk.cyan(`Enter sample size (1-${recordCount.toLocaleString()}) [${defaultSize.toLocaleString()}]: `), answer => {
      resolve(answer.trim());
    });
  });
  
  rl.close();
  
  const customSize = parseInt(answer) || defaultSize;
  const finalSize = Math.max(1000, Math.min(recordCount, customSize));
  
  console.log(chalk.green(`✅ Using custom sample size: ${finalSize.toLocaleString()} rows`));
  return finalSize;
}

/**
 * Display sampling information to user
 */
export function displaySamplingInfo(originalCount, sampleSize, reason) {
  console.log(chalk.yellow('\n📊 Sampling Applied:'));
  console.log(chalk.white(`   Original: ${originalCount.toLocaleString()} rows`));
  console.log(chalk.white(`   Sample: ${sampleSize.toLocaleString()} rows (${Math.round((sampleSize/originalCount)*100)}%)`));
  
  const reasonMessages = {
    auto_sample_long: '⏰ Automatic sampling due to long processing time',
    auto_sample_large: '📈 Automatic sampling for large dataset', 
    user_choice: '👤 User-selected sampling',
    performance: '⚡ Performance optimization'
  };
  
  console.log(chalk.white(`   Reason: ${reasonMessages[reason] || reason}`));
  console.log(chalk.cyan('   💡 Results will be statistically representative\n'));
}

/**
 * Check if we're in a non-interactive environment
 */
export function isNonInteractive() {
  return !process.stdin.isTTY || process.env.CI === 'true' || process.env.NON_INTERACTIVE === 'true';
}