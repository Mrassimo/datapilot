#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Platform detection
const platform = {
  isWindows: os.platform() === 'win32',
  isMac: os.platform() === 'darwin',
  isLinux: os.platform() === 'linux',
  name: os.platform(),
  arch: os.arch()
};

console.log(`DataPilot TUI Test Orchestrator`);
console.log(`================================`);
console.log(`Platform: ${platform.name} (${platform.arch})`);
console.log(`Node: ${process.version}`);
console.log(`Time: ${new Date().toISOString()}\n`);

// Test runners based on platform
const testRunners = {
  engineUnit: {
    name: 'TUI Engine Unit Tests',
    command: 'node',
    args: [path.join(__dirname, 'tui', 'engine.test.js')],
    platforms: ['all']
  },
  
  engineFlow: {
    name: 'TUI Engine Flow Tests',
    command: 'node',
    args: [path.join(__dirname, 'tui', 'flow.test.js')],
    platforms: ['all']
  },
  
  automated: {
    name: 'Automated TUI Tests (E2E)',
    command: 'node',
    args: [path.join(__dirname, 'tui', 'automation.test.js')],
    platforms: ['all']
  },
  
  windowsBatch: {
    name: 'Windows Batch Tests',
    command: path.join(__dirname, 'tui_test_windows.bat'),
    args: [],
    platforms: ['win32']
  },
  
  windowsPowerShell: {
    name: 'Windows PowerShell Tests',
    command: 'powershell',
    args: [
      '-ExecutionPolicy', 'Bypass',
      '-File', path.join(__dirname, 'Test-DataPilotTUI.ps1')
    ],
    platforms: ['win32']
  },
  
  interactiveSimulation: {
    name: 'Interactive Simulation Tests',
    command: 'node',
    args: [path.join(__dirname, '..', 'tui_interactive_tests.js')],
    platforms: ['all']
  }
};

// Helper to run a test suite
async function runTestSuite(suite) {
  console.log(`Running: ${suite.name}`);
  console.log('-'.repeat(40));
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const proc = spawn(suite.command, suite.args, {
      stdio: 'inherit',
      shell: platform.isWindows
    });
    
    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nCompleted in ${duration}s with exit code: ${code}`);
      console.log('='.repeat(40) + '\n');
      resolve({
        suite: suite.name,
        exitCode: code,
        duration: parseFloat(duration),
        success: code === 0
      });
    });
    
    proc.on('error', (err) => {
      console.error(`Error running ${suite.name}:`, err.message);
      resolve({
        suite: suite.name,
        exitCode: -1,
        error: err.message,
        success: false
      });
    });
  });
}

// Helper to check prerequisites
async function checkPrerequisites() {
  const issues = [];
  
  // Check if TUI exists
  try {
    await fs.access(path.join(__dirname, '..', 'bin', 'datapilot.js'));
  } catch {
    issues.push('DataPilot CLI not found at expected location');
  }
  
  // Check if node_modules exists
  try {
    await fs.access(path.join(__dirname, '..', 'node_modules'));
  } catch {
    issues.push('Dependencies not installed. Run: npm install');
  }
  
  // Windows-specific checks
  if (platform.isWindows) {
    // Check PowerShell availability
    try {
      await execAsync('powershell -Command "Get-Host"');
    } catch {
      issues.push('PowerShell not available or not in PATH');
    }
  }
  
  return issues;
}

// Main test execution
async function main() {
  // Check prerequisites
  const issues = await checkPrerequisites();
  if (issues.length > 0) {
    console.error('Prerequisites check failed:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
  
  // Determine which test suites to run
  const suitesToRun = Object.values(testRunners).filter(suite => {
    return suite.platforms.includes('all') || 
           suite.platforms.includes(platform.name);
  });
  
  console.log(`Will run ${suitesToRun.length} test suites\n`);
  
  // Run all applicable test suites
  const results = [];
  for (const suite of suitesToRun) {
    const result = await runTestSuite(suite);
    results.push(result);
  }
  
  // Generate consolidated report
  const report = {
    timestamp: new Date().toISOString(),
    platform: {
      os: platform.name,
      arch: platform.arch,
      node: process.version
    },
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
    }
  };
  
  // Save report
  const reportPath = path.join(__dirname, 'tui_test_consolidated_report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\nTest Execution Summary');
  console.log('='.repeat(40));
  console.log(`Total Suites: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Total Duration: ${report.summary.totalDuration.toFixed(2)}s`);
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Create markdown report for easier reading
  const mdReport = generateMarkdownReport(report);
  const mdPath = path.join(__dirname, 'TUI_TEST_RESULTS.md');
  await fs.writeFile(mdPath, mdReport);
  console.log(`Markdown report saved to: ${mdPath}`);
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Helper to generate markdown report
function generateMarkdownReport(report) {
  let md = `# DataPilot TUI Test Results\n\n`;
  md += `**Date:** ${report.timestamp}\n`;
  md += `**Platform:** ${report.platform.os} (${report.platform.arch})\n`;
  md += `**Node Version:** ${report.platform.node}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- Total Test Suites: ${report.summary.total}\n`;
  md += `- Passed: ${report.summary.passed}\n`;
  md += `- Failed: ${report.summary.failed}\n`;
  md += `- Total Duration: ${report.summary.totalDuration.toFixed(2)}s\n\n`;
  
  md += `## Detailed Results\n\n`;
  report.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    md += `### ${status} ${result.suite}\n\n`;
    md += `- Exit Code: ${result.exitCode}\n`;
    md += `- Duration: ${result.duration}s\n`;
    if (result.error) {
      md += `- Error: ${result.error}\n`;
    }
    md += `\n`;
  });
  
  md += `## Recommendations\n\n`;
  if (report.summary.failed > 0) {
    md += `### Failed Tests\n\n`;
    md += `The following test suites failed:\n\n`;
    report.results
      .filter(r => !r.success)
      .forEach(r => {
        md += `- **${r.suite}**: Exit code ${r.exitCode}`;
        if (r.error) md += ` (${r.error})`;
        md += `\n`;
      });
    md += `\n`;
  }
  
  md += `### Platform-Specific Notes\n\n`;
  if (report.platform.os === 'win32') {
    md += `- Windows platform detected\n`;
    md += `- Ensure Windows Terminal or PowerShell is used for best results\n`;
    md += `- Check that all paths use proper escaping\n`;
  } else {
    md += `- Unix-like platform detected (${report.platform.os})\n`;
    md += `- Terminal should support ANSI escape codes\n`;
  }
  
  return md;
}

// Run main
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});