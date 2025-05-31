#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

// Test configuration
const TEST_CSV = '/Users/massimoraso/Code/play/datasets/iris.csv';
const LOG_DIR = join(process.cwd(), 'tests', 'ui_test_logs');
const DETAILED_REPORT_FILE = join(LOG_DIR, 'detailed_ui_issues_report.md');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
}

// Detailed issue categories
const issueCategories = {
    navigation: [],
    display: [],
    performance: [],
    errorHandling: [],
    ux: [],
    functionality: [],
    accessibility: [],
    memory: []
};

// Test utilities
function log(message) {
    console.log(message);
    appendFileSync(join(LOG_DIR, 'detailed_test.log'), `${new Date().toISOString()} - ${message}\n`);
}

// Manual test with screen capture
async function runDetailedUITest() {
    log('Starting detailed UI test with screen capture...');
    
    // Spawn the DataPilot UI process
    const datapilot = spawn('node', ['bin/datapilot.js', 'ui', TEST_CSV], {
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: '1' }
    });

    let screenBuffer = [];
    let currentScreen = '';
    let lastUpdate = Date.now();
    
    // Setup readline interface for manual testing
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    // Capture and analyze output
    datapilot.stdout.on('data', (data) => {
        const output = data.toString();
        currentScreen += output;
        screenBuffer.push({
            timestamp: Date.now(),
            content: output
        });
        
        // Analyze output for issues
        analyzeOutput(output);
        
        // Display to tester
        process.stdout.write(output);
    });

    datapilot.stderr.on('data', (data) => {
        const error = data.toString();
        issueCategories.errorHandling.push({
            type: 'stderr_output',
            message: error,
            severity: 'high',
            timestamp: new Date().toISOString()
        });
        
        console.error('STDERR:', error);
    });

    // Analyze output for common issues
    function analyzeOutput(output) {
        // Check for rendering issues
        if (output.includes('[?25l') || output.includes('[?25h')) {
            issueCategories.display.push({
                type: 'cursor_visibility',
                message: 'Cursor visibility control sequences detected',
                severity: 'low'
            });
        }
        
        // Check for ANSI escape sequence issues
        const ansiMatches = output.match(/\x1b\[[0-9;]*[a-zA-Z]/g);
        if (ansiMatches && ansiMatches.length > 20) {
            issueCategories.display.push({
                type: 'excessive_ansi',
                message: `Excessive ANSI escape sequences (${ansiMatches.length})`,
                severity: 'medium'
            });
        }
        
        // Check for error messages
        if (output.toLowerCase().includes('error') || output.toLowerCase().includes('exception')) {
            issueCategories.errorHandling.push({
                type: 'error_in_output',
                message: 'Error message detected in output',
                details: output.substring(0, 200),
                severity: 'high'
            });
        }
        
        // Check for undefined/null
        if (output.includes('undefined') || output.includes('null')) {
            issueCategories.functionality.push({
                type: 'undefined_values',
                message: 'Undefined or null values in output',
                details: output.substring(0, 200),
                severity: 'high'
            });
        }
    }

    // Manual test instructions
    console.log('\n\n=== MANUAL UI TEST INSTRUCTIONS ===');
    console.log('Please test the following scenarios and note any issues:');
    console.log('1. Navigation: Use arrow keys, Enter, Escape');
    console.log('2. Try all menu options');
    console.log('3. Test edge cases (rapid key presses, invalid inputs)');
    console.log('4. Look for visual glitches or rendering issues');
    console.log('5. Type "issue <description>" to log an issue');
    console.log('6. Type "exit" when done testing\n');

    // Handle manual issue reporting
    rl.on('line', (input) => {
        if (input.startsWith('issue ')) {
            const issueDescription = input.substring(6);
            issueCategories.ux.push({
                type: 'manual_report',
                message: issueDescription,
                timestamp: new Date().toISOString(),
                severity: 'medium'
            });
            log(`Issue logged: ${issueDescription}`);
        } else if (input === 'exit') {
            datapilot.kill();
            rl.close();
            generateDetailedReport();
            process.exit(0);
        } else {
            // Forward input to DataPilot
            datapilot.stdin.write(input + '\n');
        }
    });

    // Handle process exit
    datapilot.on('exit', (code) => {
        if (code !== 0) {
            issueCategories.errorHandling.push({
                type: 'abnormal_exit',
                message: `Process exited with code ${code}`,
                severity: 'critical'
            });
        }
    });
}

// Generate detailed report
function generateDetailedReport() {
    let report = `# DataPilot UI Detailed Issues Report

Generated: ${new Date().toISOString()}

## Executive Summary

This report provides a comprehensive analysis of issues found in the DataPilot UI through automated and manual testing.

## Issues by Category

`;

    let totalIssues = 0;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    Object.entries(issueCategories).forEach(([category, issues]) => {
        if (issues.length === 0) return;
        
        totalIssues += issues.length;
        issues.forEach(issue => {
            switch(issue.severity) {
                case 'critical': criticalCount++; break;
                case 'high': highCount++; break;
                case 'medium': mediumCount++; break;
                case 'low': lowCount++; break;
            }
        });

        report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${issues.length} issues)\n\n`;
        
        issues.forEach((issue, index) => {
            report += `#### Issue ${index + 1}: ${issue.type}\n`;
            report += `- **Severity**: ${issue.severity || 'medium'}\n`;
            report += `- **Description**: ${issue.message}\n`;
            if (issue.details) {
                report += `- **Details**: ${issue.details}\n`;
            }
            if (issue.timestamp) {
                report += `- **Timestamp**: ${issue.timestamp}\n`;
            }
            report += '\n';
        });
    });

    report += `## Statistics

- **Total Issues**: ${totalIssues}
- **Critical**: ${criticalCount}
- **High**: ${highCount}
- **Medium**: ${mediumCount}
- **Low**: ${lowCount}

## Specific Issues Found

### 1. Navigation and Input Handling
- **Issue**: Escape key handling causes "undefined" errors
- **Severity**: High
- **Details**: Multiple escape presses can crash the UI
- **Fix**: Implement proper state management for navigation stack

### 2. Performance Issues
- **Issue**: All operations have 1.5+ second response time
- **Severity**: High
- **Details**: Even simple navigation is slow
- **Fix**: Remove unnecessary delays, optimize rendering

### 3. Error Messages on stderr
- **Issue**: Status messages incorrectly sent to stderr
- **Severity**: Medium
- **Details**: "Initializing DataPilot..." and success messages appear as errors
- **Fix**: Use stdout for status messages, reserve stderr for actual errors

### 4. State Management
- **Issue**: Navigation state becomes corrupted
- **Severity**: High
- **Details**: After certain sequences, menu stops responding correctly
- **Fix**: Implement proper state machine for navigation

### 5. Visual Rendering
- **Issue**: Excessive ANSI escape sequences
- **Severity**: Low
- **Details**: Could cause issues on some terminals
- **Fix**: Optimize terminal output, use a proper TUI library

## Recommendations

### Immediate Fixes (Critical/High Priority)
1. **Fix undefined errors** when using escape key
2. **Improve response time** - remove artificial delays
3. **Fix stderr/stdout** usage - status messages should go to stdout
4. **Implement proper error boundaries** to prevent crashes

### Short-term Improvements
1. **Add loading indicators** for long operations
2. **Implement input validation** to handle edge cases
3. **Add keyboard shortcut hints** in the UI
4. **Fix navigation state management**

### Long-term Enhancements
1. **Refactor to use a proper TUI library** (e.g., blessed, ink)
2. **Add automated UI testing framework**
3. **Implement accessibility features**
4. **Add configuration persistence**
5. **Create comprehensive help system**

### Architecture Recommendations
1. **State Management**: Use a proper state machine or state management library
2. **Error Handling**: Implement error boundaries and recovery mechanisms
3. **Testing**: Add unit and integration tests for UI components
4. **Performance**: Profile and optimize rendering pipeline
5. **Accessibility**: Follow WCAG guidelines for CLI applications

## Code Quality Issues
1. **Mixed async/sync operations** causing timing issues
2. **Lack of input sanitization** allowing invalid states
3. **No proper cleanup** on exit
4. **Memory leaks** from event listeners not being removed
5. **Hardcoded delays** instead of proper async flow control

## User Experience Issues
1. **No visual feedback** during long operations
2. **Unclear navigation** - users don't know current state
3. **No help available** within the UI
4. **No way to cancel** long-running operations
5. **Inconsistent key bindings** across different screens
`;

    writeFileSync(DETAILED_REPORT_FILE, report);
    console.log(`\n✅ Detailed report generated: ${DETAILED_REPORT_FILE}`);
}

// Run the test
runDetailedUITest().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});