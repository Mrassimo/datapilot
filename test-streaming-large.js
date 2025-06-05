#!/usr/bin/env node

/**
 * Test streaming analyzer with large dataset
 */

const { analyzeFileStreaming } = require('./dist/analyzers/streaming/streaming-analyzer');

// Memory monitoring helper
function getMemoryUsageMB() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(usage.heapTotal / (1024 * 1024)),
    rss: Math.round(usage.rss / (1024 * 1024)),
    external: Math.round(usage.external / (1024 * 1024))
  };
}

// Memory tracking
const memorySnapshots = [];
let peakMemory = 0;

async function testLargeDataset(filename) {
  console.log('🚀 Testing Streaming Analysis with Large Dataset');
  console.log(`📄 File: ${filename}`);
  console.log('━'.repeat(60));
  
  // Initial memory state
  if (global.gc) {
    global.gc(); // Force GC if available (run with --expose-gc)
  }
  
  const initialMemory = getMemoryUsageMB();
  console.log('💾 Initial Memory:');
  console.log(`   • Heap Used: ${initialMemory.heapUsed} MB`);
  console.log(`   • RSS: ${initialMemory.rss} MB`);
  
  const startTime = Date.now();
  
  try {
    // Configure for large dataset
    const config = {
      chunkSize: 1000,          // Process 1000 rows at a time
      memoryThresholdMB: 200,   // Stay under 200MB
      maxRowsAnalyzed: 2000000, // Allow up to 2M rows
      adaptiveChunkSizing: true
    };
    
    // Monitor memory during analysis
    const memoryInterval = setInterval(() => {
      const memory = getMemoryUsageMB();
      memorySnapshots.push({
        time: Date.now() - startTime,
        heapUsed: memory.heapUsed
      });
      peakMemory = Math.max(peakMemory, memory.heapUsed);
    }, 100); // Check every 100ms
    
    // Progress tracking
    let lastProgress = 0;
    const progressCallback = (progress) => {
      if (progress.percentage - lastProgress >= 10 || progress.percentage === 100) {
        const memory = getMemoryUsageMB();
        console.log(`\n📊 ${progress.stage.toUpperCase()} - ${progress.percentage}%`);
        console.log(`   • ${progress.message}`);
        console.log(`   • Memory: ${memory.heapUsed} MB (heap) / ${memory.rss} MB (RSS)`);
        console.log(`   • Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        lastProgress = progress.percentage;
      }
    };
    
    console.log('\n🔄 Starting streaming analysis...\n');
    
    const result = await analyzeFileStreaming(filename, { 
      ...config,
      progressCallback 
    });
    
    clearInterval(memoryInterval);
    
    const endTime = Date.now();
    const finalMemory = getMemoryUsageMB();
    const analysisTime = (endTime - startTime) / 1000;
    
    console.log('\n' + '━'.repeat(60));
    console.log('✅ Analysis Complete!\n');
    
    console.log('📈 Performance Metrics:');
    console.log(`   • Total time: ${analysisTime.toFixed(1)} seconds`);
    console.log(`   • Rows/second: ${Math.round(result.performanceMetrics.rowsAnalyzed / analysisTime).toLocaleString()}`);
    console.log(`   • Rows analyzed: ${result.performanceMetrics.rowsAnalyzed?.toLocaleString()}`);
    console.log(`   • Chunks processed: ${result.performanceMetrics.chunksProcessed}`);
    console.log(`   • Average chunk size: ${result.performanceMetrics.avgChunkSize}`);
    
    console.log('\n💾 Memory Usage:');
    console.log(`   • Initial: ${initialMemory.heapUsed} MB`);
    console.log(`   • Peak: ${peakMemory} MB`);
    console.log(`   • Final: ${finalMemory.heapUsed} MB`);
    console.log(`   • Memory efficiency: ${result.performanceMetrics.memoryEfficiency}`);
    console.log(`   • Memory increase: ${finalMemory.heapUsed - initialMemory.heapUsed} MB`);
    
    console.log('\n📊 Dataset Info:');
    console.log(`   • Columns analyzed: ${result.metadata?.columnsAnalyzed}`);
    console.log(`   • Dataset size: ${result.metadata?.datasetSize?.toLocaleString()} rows`);
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning, i) => {
        if (i < 5) { // Show first 5 warnings
          console.log(`   ${i + 1}. ${warning.message}`);
        }
      });
      if (result.warnings.length > 5) {
        console.log(`   ... and ${result.warnings.length - 5} more warnings`);
      }
    }
    
    // Show sample insights
    if (result.edaAnalysis.crossVariableInsights.topFindings.length > 0) {
      console.log('\n🔍 Sample Insights:');
      result.edaAnalysis.crossVariableInsights.topFindings.slice(0, 3).forEach(finding => {
        console.log(`   • ${finding}`);
      });
    }
    
    // Show column analysis sample
    if (result.edaAnalysis.univariateAnalysis.length > 0) {
      console.log('\n📊 Sample Column Analysis:');
      const sampleColumn = result.edaAnalysis.univariateAnalysis[0];
      console.log(`   • Column: ${sampleColumn.columnName}`);
      console.log(`   • Type: ${sampleColumn.detectedDataType}`);
      console.log(`   • Missing: ${sampleColumn.missingPercentage}%`);
      console.log(`   • Unique: ${sampleColumn.uniqueValues} values`);
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('🎉 SUCCESS: Large dataset processed with streaming!');
    console.log(`💡 Processed ${result.performanceMetrics.rowsAnalyzed?.toLocaleString()} rows`);
    console.log(`   using only ${peakMemory} MB peak memory`);
    console.log('━'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Get filename from command line or use default
const filename = process.argv[2] || 'test-datasets/large/transactions-large.csv';

// Run the test
console.log('🚀 DataPilot Streaming Analysis Test');
console.log('━'.repeat(60));

testLargeDataset(filename).catch(console.error);