#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { allCommand } from '../src/commands/all.js';
import { edaCommand } from '../src/commands/eda.js';
import { intCommand } from '../src/commands/int.js';
import { visCommand } from '../src/commands/vis.js';
import { engCommand } from '../src/commands/eng.js';
import { llmCommand } from '../src/commands/llm.js';
import { parseCSV } from '../src/utils/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance targets from PRD
const PERFORMANCE_TARGETS = {
  SMALL_FILE_THRESHOLD: 1024 * 1024, // 1MB
  MEDIUM_FILE_THRESHOLD: 100 * 1024 * 1024, // 100MB
  SMALL_FILE_TARGET: 1000, // 1 second in ms
  MEDIUM_FILE_TARGET: 10000, // 10 seconds in ms
  MAX_PROCESSING_TIME: 30000, // 30 seconds in ms
  SUCCESS_RATE_TARGET: 0.95 // 95%
};

// Test file configurations
const TEST_CONFIGS = [
  { name: 'tiny', size: '1KB', rows: 20, cols: 5 },
  { name: 'small', size: '100KB', rows: 2000, cols: 10 },
  { name: 'medium', size: '1MB', rows: 20000, cols: 15 },
  { name: 'large', size: '10MB', rows: 200000, cols: 20 },
  { name: 'xlarge', size: '100MB', rows: 2000000, cols: 25 }
];

// Commands to benchmark
const COMMANDS = {
  eda: { func: edaCommand, name: 'EDA' },
  int: { func: intCommand, name: 'INT' },
  vis: { func: visCommand, name: 'VIS' },
  eng: { func: engCommand, name: 'ENG' },
  llm: { func: llmCommand, name: 'LLM' },
  all: { func: allCommand, name: 'ALL' }
};

class PerformanceBenchmark {
  constructor() {
    this.results = [];
    this.testDir = path.join(__dirname, 'performance_test_files');
    this.ensureTestDirectory();
  }

  ensureTestDirectory() {
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
  }

  // Generate synthetic CSV data
  generateCSVData(rows, cols) {
    const headers = [];
    for (let i = 0; i < cols; i++) {
      headers.push(`column_${i + 1}`);
    }

    let csvContent = headers.join(',') + '\n';
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < cols; col++) {
        // Generate varied data types
        if (col === 0) {
          rowData.push(row + 1); // ID column
        } else if (col === 1) {
          rowData.push(`"Item ${row + 1}"`); // String column
        } else if (col === 2) {
          rowData.push((Math.random() * 1000).toFixed(2)); // Decimal
        } else if (col === 3) {
          rowData.push(Math.floor(Math.random() * 100)); // Integer
        } else if (col === 4 && cols > 4) {
          // Date column
          const date = new Date(2020, 0, 1);
          date.setDate(date.getDate() + Math.floor(Math.random() * 365));
          rowData.push(date.toISOString().split('T')[0]);
        } else {
          // Random data with some nulls
          if (Math.random() < 0.05) {
            rowData.push(''); // 5% null values
          } else {
            rowData.push((Math.random() * 10000).toFixed(2));
          }
        }
      }
      csvContent += rowData.join(',') + '\n';
    }

    return csvContent;
  }

  // Create test files
  async createTestFiles() {
    console.log('🔧 Creating test files...');
    
    for (const config of TEST_CONFIGS) {
      const filePath = path.join(this.testDir, `test_${config.name}_${config.size}.csv`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  Creating ${config.name} file (${config.size})...`);
        const csvData = this.generateCSVData(config.rows, config.cols);
        fs.writeFileSync(filePath, csvData);
        
        const stats = fs.statSync(filePath);
        console.log(`  ✅ Created ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      } else {
        console.log(`  ⏭️  ${config.name} file already exists`);
      }
    }
    console.log('');
  }

  // Memory usage tracking
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  // Benchmark a single command on a file
  async benchmarkCommand(commandKey, commandConfig, filePath, fileSize) {
    const memoryBefore = this.getMemoryUsage();
    
    try {
      // Parse CSV
      const parseStart = performance.now();
      const { data, headers } = await parseCSV(filePath);
      const parseTime = performance.now() - parseStart;

      // Execute command
      const commandStart = performance.now();
      
      // Capture stdout to prevent output during benchmarking
      const originalWrite = process.stdout.write;
      let output = '';
      process.stdout.write = function(chunk) {
        output += chunk;
        return true;
      };

      await commandConfig.func(data, headers, filePath, { quiet: true });
      
      // Restore stdout
      process.stdout.write = originalWrite;
      
      const commandTime = performance.now() - commandStart;
      const totalTime = parseTime + commandTime;
      
      const memoryAfter = this.getMemoryUsage();
      const memoryDelta = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed
      };

      return {
        success: true,
        parseTime,
        commandTime,
        totalTime,
        memoryBefore,
        memoryAfter,
        memoryDelta,
        outputSize: output.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        totalTime: null,
        memoryDelta: { rss: 0, heapUsed: 0 }
      };
    }
  }

  // Run full benchmark suite
  async runBenchmarks() {
    console.log('🚀 Starting Performance Benchmark Suite\n');
    
    await this.createTestFiles();

    const startTime = performance.now();
    
    for (const config of TEST_CONFIGS) {
      const filePath = path.join(this.testDir, `test_${config.name}_${config.size}.csv`);
      const fileStats = fs.statSync(filePath);
      const fileSizeBytes = fileStats.size;
      const fileSizeMB = fileSizeBytes / 1024 / 1024;

      console.log(`📊 Benchmarking ${config.name} file (${config.size}, ${fileSizeMB.toFixed(2)}MB)`);
      console.log(`   ${config.rows.toLocaleString()} rows × ${config.cols} columns`);

      for (const [commandKey, commandConfig] of Object.entries(COMMANDS)) {
        // Skip 'all' command for large files to save time
        if (commandKey === 'all' && config.name === 'xlarge') {
          console.log(`   ⏭️  Skipping ${commandConfig.name} (too large)`);
          continue;
        }

        process.stdout.write(`   🔄 Running ${commandConfig.name}... `);
        
        const result = await this.benchmarkCommand(commandKey, commandConfig, filePath, fileSizeBytes);
        
        if (result.success) {
          console.log(`✅ ${result.totalTime.toFixed(0)}ms (parse: ${result.parseTime.toFixed(0)}ms, cmd: ${result.commandTime.toFixed(0)}ms)`);
        } else {
          console.log(`❌ Failed: ${result.error}`);
        }

        this.results.push({
          testFile: config.name,
          fileSize: config.size,
          fileSizeBytes,
          fileSizeMB,
          rows: config.rows,
          cols: config.cols,
          command: commandKey,
          commandName: commandConfig.name,
          ...result
        });

        // Small delay to prevent memory pressure
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log('');
    }

    const totalTime = performance.now() - startTime;
    console.log(`🏁 Benchmark completed in ${(totalTime / 1000).toFixed(1)} seconds\n`);
  }

  // Analyze results and generate report
  generateReport() {
    console.log('📈 PERFORMANCE BENCHMARK REPORT');
    console.log('================================\n');

    // Overall statistics
    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);
    const successRate = successfulResults.length / this.results.length;

    console.log('📊 OVERALL STATISTICS');
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Successful: ${successfulResults.length}`);
    console.log(`Failed: ${failedResults.length}`);
    console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);
    console.log(`Target success rate: ${(PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET * 100)}%`);
    console.log(`✅ Success rate target: ${successRate >= PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET ? 'PASSED' : 'FAILED'}\n`);

    // Performance target analysis
    console.log('🎯 PERFORMANCE TARGET ANALYSIS');
    
    const smallFiles = successfulResults.filter(r => r.fileSizeBytes < PERFORMANCE_TARGETS.SMALL_FILE_THRESHOLD);
    const mediumFiles = successfulResults.filter(r => 
      r.fileSizeBytes >= PERFORMANCE_TARGETS.SMALL_FILE_THRESHOLD && 
      r.fileSizeBytes < PERFORMANCE_TARGETS.MEDIUM_FILE_THRESHOLD
    );

    // Small files (<1MB) target: <1s
    const smallFilesPassed = smallFiles.filter(r => r.totalTime < PERFORMANCE_TARGETS.SMALL_FILE_TARGET);
    const smallFilesPassRate = smallFiles.length > 0 ? smallFilesPassed.length / smallFiles.length : 1;
    
    console.log(`Small files (<1MB): ${smallFilesPassed.length}/${smallFiles.length} under 1s (${(smallFilesPassRate * 100).toFixed(1)}%)`);
    console.log(`✅ Small files target: ${smallFilesPassRate >= PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET ? 'PASSED' : 'FAILED'}`);

    // Medium files (<100MB) target: <10s
    const mediumFilesPassed = mediumFiles.filter(r => r.totalTime < PERFORMANCE_TARGETS.MEDIUM_FILE_TARGET);
    const mediumFilesPassRate = mediumFiles.length > 0 ? mediumFilesPassed.length / mediumFiles.length : 1;
    
    console.log(`Medium files (<100MB): ${mediumFilesPassed.length}/${mediumFiles.length} under 10s (${(mediumFilesPassRate * 100).toFixed(1)}%)`);
    console.log(`✅ Medium files target: ${mediumFilesPassRate >= PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET ? 'PASSED' : 'FAILED'}`);

    // Overall processing time target: <30s
    const overallPassed = successfulResults.filter(r => r.totalTime < PERFORMANCE_TARGETS.MAX_PROCESSING_TIME);
    const overallPassRate = overallPassed.length / successfulResults.length;
    
    console.log(`All files: ${overallPassed.length}/${successfulResults.length} under 30s (${(overallPassRate * 100).toFixed(1)}%)`);
    console.log(`✅ Overall time target: ${overallPassRate >= PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET ? 'PASSED' : 'FAILED'}\n`);

    // Command performance breakdown
    console.log('⚡ COMMAND PERFORMANCE BREAKDOWN');
    const commandStats = {};
    
    for (const result of successfulResults) {
      if (!commandStats[result.command]) {
        commandStats[result.command] = {
          name: result.commandName,
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          avgMemory: 0
        };
      }
      
      const stats = commandStats[result.command];
      stats.count++;
      stats.totalTime += result.totalTime;
      stats.minTime = Math.min(stats.minTime, result.totalTime);
      stats.maxTime = Math.max(stats.maxTime, result.totalTime);
      stats.avgMemory += result.memoryDelta.heapUsed;
    }

    // Calculate averages and sort by performance
    const sortedCommands = Object.entries(commandStats)
      .map(([key, stats]) => ({
        command: key,
        name: stats.name,
        avgTime: stats.totalTime / stats.count,
        minTime: stats.minTime,
        maxTime: stats.maxTime,
        avgMemory: stats.avgMemory / stats.count,
        count: stats.count
      }))
      .sort((a, b) => a.avgTime - b.avgTime);

    for (const cmd of sortedCommands) {
      console.log(`${cmd.name.padEnd(8)}: avg ${cmd.avgTime.toFixed(0)}ms | min ${cmd.minTime.toFixed(0)}ms | max ${cmd.maxTime.toFixed(0)}ms | mem +${cmd.avgMemory.toFixed(1)}MB`);
    }
    console.log('');

    // File size scaling analysis
    console.log('📏 FILE SIZE SCALING ANALYSIS');
    const fileSizeGroups = {};
    
    for (const result of successfulResults) {
      if (!fileSizeGroups[result.testFile]) {
        fileSizeGroups[result.testFile] = {
          size: result.fileSize,
          sizeMB: result.fileSizeMB,
          rows: result.rows,
          results: []
        };
      }
      fileSizeGroups[result.testFile].results.push(result);
    }

    for (const [fileName, group] of Object.entries(fileSizeGroups)) {
      const avgTime = group.results.reduce((sum, r) => sum + r.totalTime, 0) / group.results.length;
      const throughput = group.rows / (avgTime / 1000); // rows per second
      
      console.log(`${group.size.padEnd(8)}: ${group.rows.toLocaleString().padStart(10)} rows | avg ${avgTime.toFixed(0)}ms | ${Math.round(throughput).toLocaleString()} rows/sec`);
    }
    console.log('');

    // Bottleneck identification
    console.log('🔍 BOTTLENECK ANALYSIS & OPTIMIZATION OPPORTUNITIES');
    
    // Parse vs Command time analysis
    const parseTimeRatio = successfulResults.reduce((sum, r) => sum + (r.parseTime / r.totalTime), 0) / successfulResults.length;
    console.log(`Average parse time ratio: ${(parseTimeRatio * 100).toFixed(1)}%`);
    
    if (parseTimeRatio > 0.3) {
      console.log('⚠️  CSV parsing is a significant bottleneck (>30% of total time)');
      console.log('   💡 Consider: streaming parser optimizations, worker threads for large files');
    }

    // Memory usage analysis
    const highMemoryResults = successfulResults.filter(r => r.memoryDelta.heapUsed > 100);
    if (highMemoryResults.length > 0) {
      console.log(`⚠️  ${highMemoryResults.length} tests used >100MB additional memory`);
      console.log('   💡 Consider: data streaming, chunked processing, garbage collection optimization');
    }

    // Command-specific recommendations
    const slowestCommand = sortedCommands[sortedCommands.length - 1];
    if (slowestCommand && slowestCommand.avgTime > 5000) {
      console.log(`⚠️  ${slowestCommand.name} command is slowest (avg ${slowestCommand.avgTime.toFixed(0)}ms)`);
      console.log('   💡 Consider: algorithm optimization, caching, parallel processing');
    }

    // Failed tests analysis
    if (failedResults.length > 0) {
      console.log(`⚠️  ${failedResults.length} tests failed:`);
      const errorGroups = {};
      for (const failed of failedResults) {
        const key = failed.error || 'Unknown error';
        errorGroups[key] = (errorGroups[key] || 0) + 1;
      }
      for (const [error, count] of Object.entries(errorGroups)) {
        console.log(`   • ${error}: ${count} occurrences`);
      }
    }

    console.log('');
    console.log('🏆 BENCHMARK SUMMARY');
    const overallScore = (successRate + smallFilesPassRate + mediumFilesPassRate + overallPassRate) / 4;
    console.log(`Overall Performance Score: ${(overallScore * 100).toFixed(1)}%`);
    
    if (overallScore >= 0.95) {
      console.log('🎉 EXCELLENT - All performance targets exceeded!');
    } else if (overallScore >= 0.90) {
      console.log('✅ GOOD - Most performance targets met');
    } else if (overallScore >= 0.75) {
      console.log('⚠️  NEEDS IMPROVEMENT - Some performance issues detected');
    } else {
      console.log('❌ POOR - Significant performance optimization needed');
    }
  }

  // Save detailed results to file
  saveDetailedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `performance_report_${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      targets: PERFORMANCE_TARGETS,
      testConfigs: TEST_CONFIGS,
      results: this.results,
      summary: {
        totalTests: this.results.length,
        successfulTests: this.results.filter(r => r.success).length,
        failedTests: this.results.filter(r => !r.success).length,
        successRate: this.results.filter(r => r.success).length / this.results.length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed results saved to: ${reportPath}`);
  }

  // Cleanup test files
  cleanup() {
    if (fs.existsSync(this.testDir)) {
      console.log('🧹 Cleaning up test files...');
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
  }
}

// Main execution
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  try {
    await benchmark.runBenchmarks();
    benchmark.generateReport();
    benchmark.saveDetailedResults();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    // Ask user if they want to cleanup
    if (process.argv.includes('--cleanup')) {
      benchmark.cleanup();
    } else {
      console.log('\n💡 Test files preserved. Use --cleanup flag to remove them.');
      console.log(`   Test files location: ${benchmark.testDir}`);
    }
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main().catch(console.error);
}

export { PerformanceBenchmark };