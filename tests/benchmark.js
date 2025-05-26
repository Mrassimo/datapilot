#!/usr/bin/env node

/**
 * DataPilot Performance Benchmark Suite
 * Tests performance against PRD targets and identifies optimization opportunities
 */

import { execSync } from 'child_process';
import { writeFileSync, statSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../bin/datapilot.js');

// PRD Performance Targets
const PERFORMANCE_TARGETS = {
  SMALL_FILE_THRESHOLD: 1024 * 1024,      // 1MB
  MEDIUM_FILE_THRESHOLD: 100 * 1024 * 1024, // 100MB
  SMALL_FILE_TARGET: 1000,                 // <1s
  MEDIUM_FILE_TARGET: 10000,               // <10s
  GENERAL_TARGET: 30000,                   // <30s for 95% of files
  SUCCESS_RATE_TARGET: 0.95                // 95% success rate
};

// Test configurations
const TEST_CONFIGS = [
  { name: 'tiny', rows: 100, cols: 5, description: 'Tiny dataset (100 rows)' },
  { name: 'small', rows: 1000, cols: 10, description: 'Small dataset (1K rows)' },
  { name: 'medium', rows: 10000, cols: 15, description: 'Medium dataset (10K rows)' },
  { name: 'large', rows: 100000, cols: 20, description: 'Large dataset (100K rows)' },
  { name: 'wide', rows: 1000, cols: 50, description: 'Wide dataset (50 columns)' },
  { name: 'mixed', rows: 5000, cols: 25, description: 'Mixed types dataset' }
];

const COMMANDS = ['eda', 'int', 'vis', 'eng', 'llm'];

class PerformanceBenchmark {
  constructor() {
    this.results = [];
    this.testFiles = [];
  }

  async run() {
    console.log('🚀 DataPilot Performance Benchmark Suite');
    console.log('=' .repeat(50));
    
    try {
      // Generate test files
      await this.generateTestFiles();
      
      // Run benchmarks
      await this.runBenchmarks();
      
      // Analyze results
      this.analyzeResults();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      process.exit(1);
    }
  }

  async generateTestFiles() {
    console.log('\n📁 Generating test files...');
    
    const outputDir = join(__dirname, 'benchmark_data');
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    for (const config of TEST_CONFIGS) {
      const filePath = join(outputDir, `${config.name}_test.csv`);
      
      console.log(`   Creating ${config.description}...`);
      
      let csv = this.generateCSVHeaders(config.cols);
      for (let i = 0; i < config.rows; i++) {
        csv += this.generateCSVRow(config.cols, i, config.name);
      }
      
      writeFileSync(filePath, csv);
      
      const stats = statSync(filePath);
      this.testFiles.push({
        ...config,
        filePath,
        sizeBytes: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
      });
      
      console.log(`   ✓ Created ${config.name}_test.csv (${(stats.size / 1024).toFixed(1)}KB)`);
    }
  }

  generateCSVHeaders(cols) {
    const headers = ['id', 'name', 'email', 'age', 'salary', 'department', 'start_date', 'active', 'score', 'category'];
    const additionalHeaders = Array.from({length: Math.max(0, cols - headers.length)}, (_, i) => `field_${i + 1}`);
    return [...headers, ...additionalHeaders].slice(0, cols).join(',') + '\n';
  }

  generateCSVRow(cols, rowIndex, configName) {
    const baseData = [
      `ID${String(rowIndex).padStart(6, '0')}`,
      `User ${rowIndex}`,
      `user${rowIndex}@company.com`,
      Math.floor(Math.random() * 50) + 20,
      Math.floor(Math.random() * 100000) + 30000,
      ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][rowIndex % 5],
      `2024-${String((rowIndex % 12) + 1).padStart(2, '0')}-${String((rowIndex % 28) + 1).padStart(2, '0')}`,
      rowIndex % 4 !== 0 ? 'true' : 'false',
      Math.floor(Math.random() * 100),
      ['A', 'B', 'C', 'D'][rowIndex % 4]
    ];

    // Add additional fields for wider datasets
    const additionalData = Array.from({length: Math.max(0, cols - baseData.length)}, 
      () => Math.floor(Math.random() * 1000));
    
    return [...baseData, ...additionalData].slice(0, cols).join(',') + '\n';
  }

  async runBenchmarks() {
    console.log('\n⏱️  Running performance benchmarks...');
    
    for (const file of this.testFiles) {
      console.log(`\n📊 Testing ${file.description} (${file.sizeMB}MB):`);
      
      for (const command of COMMANDS) {
        const result = await this.benchmarkCommand(command, file);
        this.results.push(result);
        
        const status = result.success ? '✓' : '✗';
        const time = result.success ? `${result.executionTime}ms` : 'FAILED';
        console.log(`   ${status} ${command}: ${time}`);
      }
    }
  }

  async benchmarkCommand(command, file) {
    const startTime = Date.now();
    
    try {
      // Run command with timeout
      const timeout = 60000; // 60 second timeout
      execSync(`node "${CLI_PATH}" ${command} "${file.filePath}"`, {
        stdio: 'pipe',
        timeout: timeout
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      return {
        command,
        file: file.name,
        fileSize: file.sizeBytes,
        fileSizeMB: file.sizeMB,
        executionTime,
        success: true,
        error: null,
        meetsTarget: this.checkPerformanceTarget(file.sizeBytes, executionTime)
      };
      
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      return {
        command,
        file: file.name,
        fileSize: file.sizeBytes,
        fileSizeMB: file.fileSizeMB,
        executionTime,
        success: false,
        error: error.message,
        meetsTarget: false
      };
    }
  }

  checkPerformanceTarget(sizeBytes, executionTime) {
    if (sizeBytes < PERFORMANCE_TARGETS.SMALL_FILE_THRESHOLD) {
      return executionTime < PERFORMANCE_TARGETS.SMALL_FILE_TARGET;
    } else if (sizeBytes < PERFORMANCE_TARGETS.MEDIUM_FILE_THRESHOLD) {
      return executionTime < PERFORMANCE_TARGETS.MEDIUM_FILE_TARGET;
    } else {
      return executionTime < PERFORMANCE_TARGETS.GENERAL_TARGET;
    }
  }

  analyzeResults() {
    console.log('\n📈 Analyzing performance results...');
    
    // Calculate success rates
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const successRate = successfulTests / totalTests;
    
    // Calculate target compliance
    const targetCompliantTests = this.results.filter(r => r.success && r.meetsTarget).length;
    const targetComplianceRate = targetCompliantTests / totalTests;
    
    // Find bottlenecks
    const commandPerformance = this.analyzeCommandPerformance();
    const filePerformance = this.analyzeFilePerformance();
    
    this.analysis = {
      totalTests,
      successfulTests,
      successRate,
      targetCompliantTests,
      targetComplianceRate,
      commandPerformance,
      filePerformance,
      slowestOperations: this.findSlowestOperations(),
      recommendations: this.generateRecommendations()
    };
  }

  analyzeCommandPerformance() {
    const commandStats = {};
    
    for (const command of COMMANDS) {
      const commandResults = this.results.filter(r => r.command === command && r.success);
      if (commandResults.length === 0) continue;
      
      const times = commandResults.map(r => r.executionTime);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);
      
      commandStats[command] = {
        averageTime: Math.round(avg),
        maxTime: max,
        minTime: min,
        successRate: commandResults.length / this.results.filter(r => r.command === command).length,
        targetCompliance: commandResults.filter(r => r.meetsTarget).length / commandResults.length
      };
    }
    
    return commandStats;
  }

  analyzeFilePerformance() {
    const fileStats = {};
    
    for (const file of this.testFiles) {
      const fileResults = this.results.filter(r => r.file === file.name && r.success);
      if (fileResults.length === 0) continue;
      
      const times = fileResults.map(r => r.executionTime);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      
      fileStats[file.name] = {
        averageTime: Math.round(avg),
        sizeKB: Math.round(file.sizeBytes / 1024),
        throughputKBps: Math.round((file.sizeBytes / 1024) / (avg / 1000))
      };
    }
    
    return fileStats;
  }

  findSlowestOperations() {
    return this.results
      .filter(r => r.success)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5)
      .map(r => ({
        operation: `${r.command} on ${r.file}`,
        time: r.executionTime,
        fileSize: r.fileSizeMB + 'MB'
      }));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check overall success rate
    if (this.analysis.successRate < PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Reliability',
        issue: `Success rate ${(this.analysis.successRate * 100).toFixed(1)}% below target 95%`,
        recommendation: 'Investigate and fix command failures to improve reliability'
      });
    }
    
    // Check target compliance
    if (this.analysis.targetComplianceRate < 0.8) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Performance',
        issue: `Only ${(this.analysis.targetComplianceRate * 100).toFixed(1)}% of tests meet performance targets`,
        recommendation: 'Optimize slow operations and implement performance improvements'
      });
    }
    
    // Command-specific recommendations
    Object.entries(this.analysis.commandPerformance).forEach(([command, stats]) => {
      if (stats.averageTime > 5000) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Command Optimization',
          issue: `${command} command averages ${stats.averageTime}ms execution time`,
          recommendation: `Optimize ${command} command algorithms and data processing`
        });
      }
      
      if (stats.targetCompliance < 0.7) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Target Compliance',
          issue: `${command} command meets targets only ${(stats.targetCompliance * 100).toFixed(1)}% of the time`,
          recommendation: `Review ${command} implementation for performance bottlenecks`
        });
      }
    });
    
    return recommendations;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATAPILOT PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(60));
    
    // Executive summary
    console.log('\n🎯 EXECUTIVE SUMMARY:');
    console.log(`   Success Rate: ${(this.analysis.successRate * 100).toFixed(1)}% (Target: 95%)`);
    console.log(`   Target Compliance: ${(this.analysis.targetComplianceRate * 100).toFixed(1)}%`);
    console.log(`   Total Tests: ${this.analysis.totalTests}`);
    
    // Performance targets status
    const successStatus = this.analysis.successRate >= PERFORMANCE_TARGETS.SUCCESS_RATE_TARGET ? '✅' : '❌';
    const targetStatus = this.analysis.targetComplianceRate >= 0.8 ? '✅' : '❌';
    
    console.log(`\n📈 PERFORMANCE TARGET STATUS:`);
    console.log(`   ${successStatus} Success Rate Target (95%)`);
    console.log(`   ${targetStatus} Performance Target Compliance`);
    
    // Command performance
    console.log(`\n⚡ COMMAND PERFORMANCE:`);
    Object.entries(this.analysis.commandPerformance).forEach(([command, stats]) => {
      const status = stats.targetCompliance >= 0.7 ? '✅' : '⚠️';
      console.log(`   ${status} ${command.toUpperCase()}: avg ${stats.averageTime}ms (${(stats.targetCompliance * 100).toFixed(0)}% compliant)`);
    });
    
    // File performance
    console.log(`\n📁 FILE SIZE PERFORMANCE:`);
    Object.entries(this.analysis.filePerformance).forEach(([file, stats]) => {
      console.log(`   ${file}: ${stats.averageTime}ms (${stats.throughputKBps} KB/s)`);
    });
    
    // Slowest operations
    console.log(`\n🐌 SLOWEST OPERATIONS:`);
    this.analysis.slowestOperations.forEach((op, i) => {
      console.log(`   ${i + 1}. ${op.operation}: ${op.time}ms (${op.fileSize})`);
    });
    
    // Recommendations
    if (this.analysis.recommendations.length > 0) {
      console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
      this.analysis.recommendations.forEach((rec, i) => {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : '🟡';
        console.log(`   ${priorityIcon} [${rec.priority}] ${rec.category}:`);
        console.log(`      Issue: ${rec.issue}`);
        console.log(`      Action: ${rec.recommendation}\n`);
      });
    }
    
    // Save detailed report
    const reportPath = join(__dirname, 'benchmark_report.json');
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      results: this.results
    }, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }
}

// Run benchmark if called directly
if (process.argv[1].includes('benchmark.js')) {
  const benchmark = new PerformanceBenchmark();
  benchmark.run().catch(console.error);
}

export default PerformanceBenchmark;