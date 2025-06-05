#!/usr/bin/env node

/**
 * Debug streaming analyzer to see what's happening
 */

const fs = require('fs');
const { CSVParser } = require('./dist/parsers/csv-parser');

async function debugStreaming(filename) {
  console.log(`🔍 Debugging streaming analysis for: ${filename}`);
  
  // Check if file exists
  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    return;
  }
  
  const stats = fs.statSync(filename);
  console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(1)} MB`);
  
  try {
    // Test basic CSV parsing first
    console.log('\n🔧 Testing CSV parser...');
    
    const parser = new CSVParser({
      maxRows: 10,  // Just parse first 10 rows
      autoDetect: true,
    });
    
    const rows = await parser.parseFile(filename);
    console.log(`✅ Parsed ${rows.length} rows`);
    
    if (rows.length > 0) {
      console.log('📝 Sample row:');
      console.log('   Headers detected:', rows[0].data.length, 'columns');
      console.log('   First row data:', rows[0].data.slice(0, 5), '...');
    }
    
    const options = parser.getOptions();
    console.log('⚙️  Parser options:');
    console.log('   Delimiter:', JSON.stringify(options.delimiter));
    console.log('   Encoding:', options.encoding);
    console.log('   Has header:', options.hasHeader);
    
  } catch (error) {
    console.error('❌ CSV parsing failed:', error.message);
  }
  
  try {
    console.log('\n🔧 Testing streaming analyzer...');
    
    const { StreamingAnalyzer } = require('./dist/analyzers/streaming/streaming-analyzer');
    
    const analyzer = new StreamingAnalyzer({
      chunkSize: 100,
      memoryThresholdMB: 50,
      maxRowsAnalyzed: 1000,  // Just process first 1000 rows for debugging
      adaptiveChunkSizing: false
    });
    
    // Add progress tracking
    analyzer.setProgressCallback((progress) => {
      console.log(`📊 ${progress.stage}: ${progress.percentage}% - ${progress.message}`);
    });
    
    const result = await analyzer.analyzeFile(filename);
    
    console.log('✅ Streaming analysis completed');
    console.log('📈 Results:');
    console.log(`   Rows processed: ${result.performanceMetrics.rowsAnalyzed || 'N/A'}`);
    console.log(`   Chunks: ${result.performanceMetrics.chunksProcessed || 'N/A'}`);
    console.log(`   Columns: ${result.metadata?.columnsAnalyzed || 'N/A'}`);
    console.log(`   Warnings: ${result.warnings.length}`);
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  First few warnings:');
      result.warnings.slice(0, 3).forEach(w => console.log(`   • ${w.message}`));
    }
    
  } catch (error) {
    console.error('❌ Streaming analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

const filename = process.argv[2] || 'test-datasets/large/transactions-xlarge.csv';
debugStreaming(filename).catch(console.error);