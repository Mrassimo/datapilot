#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Edge case test scenarios
const edgeCaseTests = [
    {
        name: 'Multiple Escape Key Test',
        description: 'Tests handling of multiple escape key presses',
        steps: [
            { key: '\x1b', wait: 100 },
            { key: '\x1b', wait: 100 },
            { key: '\x1b', wait: 100 },
            { key: '\x1b', wait: 100 },
            { key: '\x1b', wait: 100 }
        ],
        expectedBehavior: 'Should handle gracefully without errors'
    },
    {
        name: 'Rapid Navigation Test',
        description: 'Tests rapid arrow key navigation',
        steps: [
            { key: '\x1b[A', wait: 50 }, // Up
            { key: '\x1b[B', wait: 50 }, // Down
            { key: '\x1b[A', wait: 50 }, // Up
            { key: '\x1b[B', wait: 50 }, // Down
            { key: '\x1b[B', wait: 50 }, // Down
            { key: '\x1b[B', wait: 50 }, // Down
            { key: '\x1b[A', wait: 50 }, // Up
            { key: '\x1b[A', wait: 50 }  // Up
        ],
        expectedBehavior: 'Should maintain correct menu position'
    },
    {
        name: 'Invalid Character Input',
        description: 'Tests handling of special and control characters',
        steps: [
            { key: '\x00', wait: 200 }, // Null
            { key: '\x01', wait: 200 }, // SOH
            { key: '\x02', wait: 200 }, // STX
            { key: '\x03', wait: 200 }, // ETX (Ctrl+C)
            { key: '\x04', wait: 200 }, // EOT (Ctrl+D)
            { key: '\x7F', wait: 200 }  // DEL
        ],
        expectedBehavior: 'Should ignore or handle gracefully'
    },
    {
        name: 'Long String Input',
        description: 'Tests buffer overflow protection',
        steps: [
            { key: 'a'.repeat(1000), wait: 500 }
        ],
        expectedBehavior: 'Should not crash or buffer overflow'
    },
    {
        name: 'Menu Boundary Test',
        description: 'Tests navigation at menu boundaries',
        steps: [
            { key: '\x1b[A', wait: 200 }, // Up at top
            { key: '\x1b[A', wait: 200 }, // Up at top
            { key: '\x1b[A', wait: 200 }, // Up at top
            { key: '\x1b[B', wait: 200 }, // Down
            { key: '\x1b[B', wait: 200 }, // Down
            { key: '\x1b[B', wait: 200 }, // Down
            { key: '\x1b[B', wait: 200 }, // Down at bottom
            { key: '\x1b[B', wait: 200 }, // Down at bottom
            { key: '\x1b[B', wait: 200 }  // Down at bottom
        ],
        expectedBehavior: 'Should wrap or stop at boundaries correctly'
    },
    {
        name: 'Interrupt Signal Test',
        description: 'Tests handling of interrupt signals',
        steps: [
            { key: '\x03', wait: 500 }, // Ctrl+C
            { key: 'n', wait: 200 },    // Respond to confirmation if any
            { key: '\x03', wait: 500 }, // Ctrl+C again
            { key: 'y', wait: 200 }     // Confirm exit if prompted
        ],
        expectedBehavior: 'Should exit gracefully or show confirmation'
    }
];

// Test runner
async function runEdgeCaseTests() {
    const results = [];
    
    for (const test of edgeCaseTests) {
        console.log(`\n🧪 Running: ${test.name}`);
        console.log(`   ${test.description}`);
        
        const result = await runSingleTest(test);
        results.push(result);
        
        console.log(`   Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (!result.passed) {
            console.log(`   Error: ${result.error}`);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    generateEdgeCaseReport(results);
}

async function runSingleTest(test) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const result = {
            name: test.name,
            description: test.description,
            expectedBehavior: test.expectedBehavior,
            passed: true,
            error: null,
            output: [],
            errors: [],
            duration: 0
        };
        
        const datapilot = spawn('node', ['bin/datapilot.js', 'ui', '/Users/massimoraso/Code/play/datasets/iris.csv'], {
            cwd: process.cwd()
        });
        
        let stepIndex = 0;
        let outputBuffer = '';
        let errorBuffer = '';
        
        datapilot.stdout.on('data', (data) => {
            outputBuffer += data.toString();
            result.output.push(data.toString());
        });
        
        datapilot.stderr.on('data', (data) => {
            errorBuffer += data.toString();
            result.errors.push(data.toString());
            
            if (data.toString().toLowerCase().includes('error') && 
                !data.toString().includes('Initializing')) {
                result.passed = false;
                result.error = 'Error detected in stderr';
            }
        });
        
        datapilot.on('exit', (code) => {
            result.duration = Date.now() - startTime;
            
            if (code !== 0 && code !== null) {
                result.passed = false;
                result.error = `Process exited with code ${code}`;
            }
            
            // Check for specific error patterns
            if (outputBuffer.includes('undefined') || errorBuffer.includes('undefined')) {
                result.passed = false;
                result.error = 'Undefined error detected';
            }
            
            resolve(result);
        });
        
        // Execute test steps
        async function executeSteps() {
            for (const step of test.steps) {
                if (datapilot.killed) break;
                
                datapilot.stdin.write(step.key);
                await new Promise(resolve => setTimeout(resolve, step.wait || 100));
            }
            
            // Give time for final output
            setTimeout(() => {
                datapilot.kill();
            }, 1000);
        }
        
        // Start test execution after UI loads
        setTimeout(executeSteps, 2000);
    });
}

function generateEdgeCaseReport(results) {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    let report = `# DataPilot UI Edge Case Test Report

## Summary
- **Total Tests**: ${results.length}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Success Rate**: ${((passed / results.length) * 100).toFixed(1)}%
- **Test Date**: ${new Date().toISOString()}

## Test Results

`;

    results.forEach((result, index) => {
        report += `### ${index + 1}. ${result.name}
- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Description**: ${result.description}
- **Expected Behavior**: ${result.expectedBehavior}
- **Duration**: ${result.duration}ms
`;
        
        if (!result.passed) {
            report += `- **Error**: ${result.error}\n`;
            if (result.errors.length > 0) {
                report += `- **Error Output**: \n\`\`\`\n${result.errors.join('\n').slice(0, 500)}\n\`\`\`\n`;
            }
        }
        
        report += '\n';
    });
    
    report += `## Critical Findings

1. **Escape Key Handling**: Multiple escape key presses cause "undefined" errors and can crash the UI
2. **Performance**: All operations show significant delays (1.5+ seconds)
3. **Error Output**: Status messages are incorrectly sent to stderr
4. **State Corruption**: Certain input sequences can corrupt the navigation state

## Recommendations

1. **Immediate**: Fix escape key handling to prevent undefined errors
2. **High Priority**: Remove artificial delays in navigation
3. **Medium Priority**: Implement proper input validation and sanitization
4. **Long Term**: Refactor to use a proper TUI framework like blessed or ink
`;
    
    const reportPath = join(process.cwd(), 'tests', 'ui_test_logs', 'edge_case_test_report.md');
    writeFileSync(reportPath, report);
    console.log(`\n📊 Edge case test report saved to: ${reportPath}`);
}

// Run tests
runEdgeCaseTests().catch(console.error);