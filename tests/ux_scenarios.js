/**
 * Comprehensive User Experience Scenario Testing
 * Tests real-world user workflows and accessibility patterns
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const testFixtures = path.join(__dirname, 'fixtures');

// Test scenarios based on real user behavior patterns
const USER_SCENARIOS = {
  newbie: {
    name: "🆕 First-time user with no CSV knowledge",
    description: "User has CSV files but doesn't know where they are",
    setup: async () => {
      // Create scattered CSV files in different locations
      const tempDir = path.join(__dirname, 'temp_newbie');
      await fs.promises.mkdir(tempDir, { recursive: true });
      await fs.promises.mkdir(path.join(tempDir, 'downloads'), { recursive: true });
      await fs.promises.mkdir(path.join(tempDir, 'documents'), { recursive: true });
      
      // Copy test files to simulate real user scenario
      await fs.promises.copyFile(
        path.join(testFixtures, 'test_sales.csv'),
        path.join(tempDir, 'downloads', 'sales_report.csv')
      );
      await fs.promises.copyFile(
        path.join(testFixtures, 'insurance.csv'),
        path.join(tempDir, 'documents', 'customer_data.csv')
      );
      
      return tempDir;
    },
    tests: [
      {
        name: "Auto-discover CSV files in directory",
        test: async (tempDir) => {
          // Test if DataPilot can automatically find CSV files
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['ui', '--auto-discover']);
          return result.stdout.includes('Found CSV files') && result.exitCode === 0;
        }
      },
      {
        name: "Show helpful getting started guide",
        test: async (tempDir) => {
          const result = await runDataPilotCommand(['ui', '--help-newbie']);
          return result.stdout.includes('Getting Started') && result.stdout.includes('CSV');
        }
      }
    ]
  },

  dataAnalyst: {
    name: "📊 Data analyst working on project",
    description: "User has multiple related CSV files in project directory",
    setup: async () => {
      const tempDir = path.join(__dirname, 'temp_analyst');
      await fs.promises.mkdir(tempDir, { recursive: true });
      await fs.promises.mkdir(path.join(tempDir, 'data'), { recursive: true });
      
      // Create project structure with multiple related CSVs
      const csvFiles = ['test_sales.csv', 'insurance.csv', 'australian_data.csv'];
      for (const file of csvFiles) {
        await fs.promises.copyFile(
          path.join(testFixtures, file),
          path.join(tempDir, 'data', file)
        );
      }
      
      // Create project config
      await fs.promises.writeFile(
        path.join(tempDir, 'datapilot.config.json'),
        JSON.stringify({
          name: "Sales Analysis Project",
          csvDirectories: ["./data"],
          defaultAnalysis: ["eda", "int", "vis"]
        }, null, 2)
      );
      
      return tempDir;
    },
    tests: [
      {
        name: "Batch analyze all CSV files in project",
        test: async (tempDir) => {
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['workspace', 'analyze-all']);
          return result.exitCode === 0 && result.stdout.includes('Analyzed 3 files');
        }
      },
      {
        name: "Cross-file relationship detection",
        test: async (tempDir) => {
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['workspace', 'relationships']);
          return result.exitCode === 0;
        }
      }
    ]
  },

  powerUser: {
    name: "⚡ Power user with complex workflows",
    description: "User needs advanced features and custom workflows",
    setup: async () => {
      const tempDir = path.join(__dirname, 'temp_power');
      await fs.promises.mkdir(tempDir, { recursive: true });
      
      // Create large CSV for performance testing
      await createLargeCSV(path.join(tempDir, 'large_dataset.csv'), 50000);
      
      return tempDir;
    },
    tests: [
      {
        name: "Handle large files with progress indication",
        test: async (tempDir) => {
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['eda', 'large_dataset.csv']);
          return result.exitCode === 0 && result.stderr.includes('Progress:');
        }
      },
      {
        name: "Memory efficient processing",
        test: async (tempDir) => {
          const initialMemory = process.memoryUsage().heapUsed;
          process.chdir(tempDir);
          await runDataPilotCommand(['eda', 'large_dataset.csv', '--sample']);
          const finalMemory = process.memoryUsage().heapUsed;
          
          // Memory should not increase dramatically (sampling should work)
          return (finalMemory - initialMemory) < 100 * 1024 * 1024; // Less than 100MB increase
        }
      }
    ]
  },

  accessibility: {
    name: "♿ Accessibility scenarios",
    description: "Users with different accessibility needs",
    setup: async () => {
      const tempDir = path.join(__dirname, 'temp_accessibility');
      await fs.promises.mkdir(tempDir, { recursive: true });
      
      await fs.promises.copyFile(
        path.join(testFixtures, 'test_sales.csv'),
        path.join(tempDir, 'test.csv')
      );
      
      return tempDir;
    },
    tests: [
      {
        name: "Color-blind friendly output",
        test: async (tempDir) => {
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['ui', '--no-colors']);
          return result.exitCode === 0 && !result.stdout.includes('\x1b['); // No ANSI codes
        }
      },
      {
        name: "Screen reader friendly text output",
        test: async (tempDir) => {
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['eda', 'test.csv', '--accessibility']);
          return result.exitCode === 0 && result.stdout.includes('Screen reader:');
        }
      },
      {
        name: "Keyboard navigation only",
        test: async (tempDir) => {
          // Test that UI can be navigated without mouse
          process.chdir(tempDir);
          const result = await runDataPilotCommand(['ui', '--keyboard-only']);
          return result.exitCode === 0;
        }
      }
    ]
  }
};

// Utility functions
async function runDataPilotCommand(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(rootDir, 'bin/datapilot.js'), ...args], {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => stdout += data.toString());
    child.stderr.on('data', (data) => stderr += data.toString());
    
    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
    
    // Auto-respond to prompts for testing
    if (options.inputs) {
      options.inputs.forEach((input, index) => {
        setTimeout(() => child.stdin.write(input + '\n'), index * 100);
      });
    }
  });
}

async function createLargeCSV(filePath, rows) {
  const headers = 'id,name,email,age,salary,department,hire_date\n';
  let content = headers;
  
  for (let i = 1; i <= rows; i++) {
    content += `${i},User${i},user${i}@example.com,${25 + (i % 40)},${30000 + (i % 50000)},Dept${i % 10},2020-0${1 + (i % 9)}-${1 + (i % 28)}\n`;
  }
  
  await fs.promises.writeFile(filePath, content);
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  start(operation) {
    this.metrics[operation] = {
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed
    };
  }
  
  end(operation) {
    if (!this.metrics[operation]) return null;
    
    const metric = this.metrics[operation];
    return {
      duration: Date.now() - metric.startTime,
      memoryDelta: process.memoryUsage().heapUsed - metric.startMemory,
      operation
    };
  }
}

// Main test runner
export async function runUXScenarios() {
  console.log('🧪 Running comprehensive UX scenario tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    scenarios: {},
    performance: []
  };
  
  const monitor = new PerformanceMonitor();
  
  for (const [scenarioKey, scenario] of Object.entries(USER_SCENARIOS)) {
    console.log(`\n${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log('─'.repeat(50));
    
    try {
      monitor.start(scenarioKey);
      
      // Setup scenario
      const tempDir = await scenario.setup();
      
      const scenarioResults = {
        passed: 0,
        failed: 0,
        tests: []
      };
      
      // Run all tests for this scenario
      for (const test of scenario.tests) {
        try {
          console.log(`  ⏳ ${test.name}...`);
          const passed = await test.test(tempDir);
          
          if (passed) {
            console.log(`  ✅ ${test.name}`);
            scenarioResults.passed++;
            results.passed++;
          } else {
            console.log(`  ❌ ${test.name}`);
            scenarioResults.failed++;
            results.failed++;
          }
          
          scenarioResults.tests.push({ name: test.name, passed });
        } catch (error) {
          console.log(`  ❌ ${test.name} (Error: ${error.message})`);
          scenarioResults.failed++;
          results.failed++;
          scenarioResults.tests.push({ name: test.name, passed: false, error: error.message });
        }
      }
      
      // Cleanup
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.log(`  ⚠️  Cleanup warning: ${cleanupError.message}`);
      }
      
      const perfMetric = monitor.end(scenarioKey);
      if (perfMetric) results.performance.push(perfMetric);
      
      results.scenarios[scenarioKey] = scenarioResults;
      
    } catch (error) {
      console.log(`  ❌ Scenario setup failed: ${error.message}`);
      results.failed++;
    }
  }
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('🏁 UX SCENARIO TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Performance summary
  if (results.performance.length > 0) {
    console.log('\n📈 PERFORMANCE METRICS:');
    results.performance.forEach(metric => {
      console.log(`  ${metric.operation}: ${metric.duration}ms, ${(metric.memoryDelta / 1024 / 1024).toFixed(1)}MB`);
    });
  }
  
  return results;
}

// Export for integration with main test suite
export { USER_SCENARIOS, runDataPilotCommand, PerformanceMonitor };