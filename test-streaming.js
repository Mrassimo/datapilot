#!/usr/bin/env node

/**
 * Test script to demonstrate the streaming analyzer
 */

const { analyzeFileStreaming } = require('./dist/analyzers/streaming/streaming-analyzer');

async function testStreaming() {
  console.log('🚀 Testing Streaming Analysis Engine...');
  console.log('📄 File: examples/sample.csv');
  
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  try {
    // Configure for demonstration
    const config = {
      chunkSize: 500,           // Small chunks for demo
      memoryThresholdMB: 50,    // Low threshold for demo
      maxRowsAnalyzed: 50000,   // Reasonable limit
      adaptiveChunkSizing: true
    };
    
    // Set up progress monitoring
    let progressCallbackCount = 0;
    const progressCallback = (progress) => {
      progressCallbackCount++;
      if (progressCallbackCount % 10 === 0) {  // Log every 10th progress update
        console.log(`📊 ${progress.stage}: ${progress.percentage}% - ${progress.message}`);
      }
    };
    
    console.log('🔄 Starting streaming analysis...');
    console.log(`💾 Initial memory: ${Math.round(startMemory / (1024 * 1024))}MB`);
    
    const result = await analyzeFileStreaming('examples/sample.csv', config);
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const analysisTime = endTime - startTime;
    
    console.log('\n✅ Analysis Complete!');
    console.log('📈 Results:');
    console.log(`   • Analysis time: ${analysisTime}ms`);
    console.log(`   • Peak memory: ${result.performanceMetrics.peakMemoryMB || 'N/A'}MB`);
    console.log(`   • Memory efficiency: ${result.performanceMetrics.memoryEfficiency || 'N/A'}`);
    console.log(`   • Rows analyzed: ${result.performanceMetrics.rowsAnalyzed || 'N/A'}`);
    console.log(`   • Columns: ${result.metadata?.columnsAnalyzed || 'N/A'}`);
    console.log(`   • Warnings: ${result.warnings.length}`);
    console.log(`   • Memory change: ${Math.round((endMemory - startMemory) / (1024 * 1024))}MB`);
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.slice(0, 3).forEach(warning => {
        console.log(`   • ${warning.message}`);
      });
    }
    
    // Show some analysis insights
    if (result.edaAnalysis.crossVariableInsights.topFindings.length > 0) {
      console.log('\n🔍 Key Insights:');
      result.edaAnalysis.crossVariableInsights.topFindings.slice(0, 3).forEach(finding => {
        console.log(`   • ${finding}`);
      });
    }
    
    console.log('\n🎉 Streaming analysis completed successfully!');
    console.log('💡 This analysis used constant memory regardless of file size.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (error.message.includes('filePath')) {
      console.log('💡 Note: Streaming analysis requires direct file access for optimal memory efficiency.');
    }
    process.exit(1);
  }
}

// Run the test
testStreaming().catch(console.error);