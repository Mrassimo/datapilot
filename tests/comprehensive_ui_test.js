#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_CSV = '/Users/massimoraso/Code/play/datasets/iris.csv';
const LOG_DIR = join(process.cwd(), 'tests', 'ui_test_logs');
const REPORT_FILE = join(LOG_DIR, 'comprehensive_ui_test_report.md');
const LOG_FILE = join(LOG_DIR, 'test_execution.log');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize report
const testResults = {
    startTime: new Date(),
    issues: [],
    successes: [],
    navigationPaths: [],
    performanceMetrics: [],
    errorStates: []
};

// Test scenarios
const testScenarios = [
    {
        name: 'Main Menu Navigation',
        steps: [
            { key: '\r', description: 'Select Analyze CSV Data', expectedPattern: /file|csv|analyze/i },
            { key: '\x1b', description: 'Escape back to main menu', expectedPattern: /main menu/i }
        ]
    },
    {
        name: 'CSV Analysis Flow',
        steps: [
            { key: '\r', description: 'Select Analyze CSV Data' },
            { wait: 1000, description: 'Wait for file analysis' },
            { key: '\r', description: 'Select first analysis option' },
            { wait: 2000, description: 'Wait for analysis completion' },
            { key: 'q', description: 'Quit analysis view' }
        ]
    },
    {
        name: 'Demo Mode Test',
        steps: [
            { key: '\x1b[B', description: 'Navigate down to Demo Mode' },
            { key: '\r', description: 'Enter Demo Mode' },
            { wait: 1000, description: 'Wait for demo datasets' },
            { key: '\x1b', description: 'Escape back' }
        ]
    },
    {
        name: 'Settings Navigation',
        steps: [
            { key: '\x1b[B', description: 'Navigate down' },
            { key: '\x1b[B', description: 'Navigate down' },
            { key: '\x1b[B', description: 'Navigate down to Settings' },
            { key: '\r', description: 'Enter Settings' },
            { wait: 500, description: 'Wait for settings menu' },
            { key: '\x1b', description: 'Escape back' }
        ]
    },
    {
        name: 'Rapid Navigation Test',
        steps: [
            { key: '\x1b[B', description: 'Rapid down 1' },
            { key: '\x1b[B', description: 'Rapid down 2' },
            { key: '\x1b[A', description: 'Rapid up 1' },
            { key: '\x1b[B', description: 'Rapid down 3' },
            { key: '\x1b[A', description: 'Rapid up 2' },
            { wait: 100, description: 'Brief pause' }
        ]
    },
    {
        name: 'Edge Case - Multiple Escapes',
        steps: [
            { key: '\x1b', description: 'Escape 1' },
            { key: '\x1b', description: 'Escape 2' },
            { key: '\x1b', description: 'Escape 3' },
            { wait: 500, description: 'Wait for response' }
        ]
    },
    {
        name: 'Invalid Input Test',
        steps: [
            { key: 'xyz123', description: 'Random invalid input' },
            { key: '!@#$%', description: 'Special characters' },
            { key: '\x00', description: 'Null character' },
            { wait: 500, description: 'Wait for error handling' }
        ]
    }
];

// Logging functions
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    appendFileSync(LOG_FILE, logMessage);
}

function recordIssue(category, description, details = {}) {
    testResults.issues.push({
        category,
        description,
        details,
        timestamp: new Date().toISOString()
    });
    log(`❌ ISSUE: [${category}] ${description}`);
}

function recordSuccess(description) {
    testResults.successes.push({
        description,
        timestamp: new Date().toISOString()
    });
    log(`✅ SUCCESS: ${description}`);
}

// Test execution
async function runUITest() {
    log('Starting comprehensive UI test...');
    
    return new Promise((resolve) => {
        const datapilot = spawn('node', ['bin/datapilot.js', 'ui', TEST_CSV], {
            cwd: process.cwd()
        });

        let outputBuffer = '';
        let currentScenarioIndex = 0;
        let currentStepIndex = 0;
        let isProcessing = false;
        let lastOutputTime = Date.now();
        let navigationStartTime = Date.now();

        // Handle stdout
        datapilot.stdout.on('data', (data) => {
            const output = data.toString();
            outputBuffer += output;
            lastOutputTime = Date.now();
            
            // Check for common issues
            if (output.includes('Error') || output.includes('error')) {
                recordIssue('Error Detection', 'Error message in output', { output });
            }
            
            if (output.includes('undefined') || output.includes('null')) {
                recordIssue('Data Issue', 'Undefined or null values in output', { output });
            }
            
            // Check for ANSI escape sequences that might cause issues
            const ansiCount = (output.match(/\x1b\[[0-9;]*m/g) || []).length;
            if (ansiCount > 50) {
                recordIssue('Rendering', 'Excessive ANSI escape sequences', { count: ansiCount });
            }
            
            // Log raw output for debugging
            appendFileSync(join(LOG_DIR, 'raw_output.log'), output);
        });

        // Handle stderr
        datapilot.stderr.on('data', (data) => {
            const error = data.toString();
            recordIssue('Runtime Error', 'Error on stderr', { error });
        });

        // Execute test scenarios
        async function executeNextStep() {
            if (isProcessing) return;
            
            if (currentScenarioIndex >= testScenarios.length) {
                log('All scenarios completed');
                setTimeout(() => {
                    datapilot.kill();
                    resolve();
                }, 1000);
                return;
            }

            const scenario = testScenarios[currentScenarioIndex];
            const step = scenario.steps[currentStepIndex];

            if (!step) {
                // Move to next scenario
                currentScenarioIndex++;
                currentStepIndex = 0;
                recordSuccess(`Completed scenario: ${scenario.name}`);
                setTimeout(executeNextStep, 1000);
                return;
            }

            isProcessing = true;
            log(`Executing: ${scenario.name} - Step ${currentStepIndex + 1}: ${step.description}`);

            // Record navigation timing
            const stepStartTime = Date.now();

            if (step.key) {
                datapilot.stdin.write(step.key);
                
                // Check response time
                setTimeout(() => {
                    const responseTime = Date.now() - stepStartTime;
                    if (responseTime > 1000) {
                        recordIssue('Performance', 'Slow response time', { 
                            step: step.description, 
                            responseTime: `${responseTime}ms` 
                        });
                    }
                }, 1500);
            } else if (step.wait) {
                await new Promise(resolve => setTimeout(resolve, step.wait));
            }

            currentStepIndex++;
            isProcessing = false;
            
            // Continue with next step
            setTimeout(executeNextStep, step.wait || 500);
        }

        // Start test execution
        setTimeout(() => {
            log('Starting test scenario execution...');
            executeNextStep();
        }, 2000);

        // Monitor for hangs
        const hangMonitor = setInterval(() => {
            const timeSinceLastOutput = Date.now() - lastOutputTime;
            if (timeSinceLastOutput > 5000 && !isProcessing) {
                recordIssue('Hang Detection', 'No output for 5+ seconds', {
                    lastOutput: outputBuffer.slice(-200)
                });
            }
        }, 5000);

        // Handle process exit
        datapilot.on('exit', (code) => {
            clearInterval(hangMonitor);
            if (code !== 0 && code !== null) {
                recordIssue('Process Exit', `Unexpected exit code: ${code}`);
            }
        });
    });
}

// Generate comprehensive report
function generateReport() {
    const duration = (Date.now() - testResults.startTime.getTime()) / 1000;
    
    let report = `# DataPilot UI Comprehensive Test Report

## Test Summary
- **Date**: ${testResults.startTime.toISOString()}
- **Duration**: ${duration.toFixed(2)} seconds
- **Total Issues Found**: ${testResults.issues.length}
- **Successful Operations**: ${testResults.successes.length}

## Issues Found

### By Category
`;

    // Group issues by category
    const issuesByCategory = {};
    testResults.issues.forEach(issue => {
        if (!issuesByCategory[issue.category]) {
            issuesByCategory[issue.category] = [];
        }
        issuesByCategory[issue.category].push(issue);
    });

    Object.entries(issuesByCategory).forEach(([category, issues]) => {
        report += `\n#### ${category} (${issues.length} issues)\n`;
        issues.forEach((issue, index) => {
            report += `${index + 1}. **${issue.description}**\n`;
            if (issue.details && Object.keys(issue.details).length > 0) {
                report += `   - Details: ${JSON.stringify(issue.details, null, 2).replace(/\n/g, '\n   ')}\n`;
            }
        });
    });

    report += `\n## Successful Operations\n`;
    testResults.successes.forEach((success, index) => {
        report += `${index + 1}. ${success.description}\n`;
    });

    report += `\n## Recommendations

### Critical Issues to Fix
1. **Navigation Issues**: Review arrow key handling and menu state management
2. **Error Handling**: Implement proper error boundaries and user feedback
3. **Performance**: Optimize rendering for large outputs
4. **Input Validation**: Add input sanitization and validation

### UX Improvements
1. **Visual Feedback**: Add loading indicators for long operations
2. **Help System**: Implement context-sensitive help
3. **Keyboard Shortcuts**: Document and standardize shortcuts
4. **Accessibility**: Add screen reader support

### Technical Debt
1. **Testing**: Implement automated UI testing framework
2. **Error Recovery**: Add graceful error recovery mechanisms
3. **State Management**: Refactor to use proper state management
4. **Documentation**: Add inline help and tooltips
`;

    writeFileSync(REPORT_FILE, report);
    log(`Report generated: ${REPORT_FILE}`);
}

// Main execution
async function main() {
    try {
        await runUITest();
    } catch (error) {
        recordIssue('Test Framework', 'Test execution error', { error: error.message });
    } finally {
        generateReport();
        console.log('\n📊 Test completed! Check the report at:');
        console.log(`   ${REPORT_FILE}`);
        console.log(`   ${LOG_FILE}`);
        process.exit(0);
    }
}

main();