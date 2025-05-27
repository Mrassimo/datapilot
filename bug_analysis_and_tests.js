#!/usr/bin/env node

/**
 * DataPilot Comprehensive Bug Analysis & Testing Suite
 * Addresses specific issues found in myissues.md
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test categories based on identified issues
const BUG_CATEGORIES = {
    OUTPUT_FORMATTING: 'output_formatting',
    CONTEXT_RELEVANCE: 'context_relevance', 
    PERFORMANCE: 'performance',
    ERROR_HANDLING: 'error_handling',
    COPY_FUNCTIONALITY: 'copy_functionality'
};

// Specific bugs identified from myissues.md
const IDENTIFIED_BUGS = [
    {
        id: 'BUG_001',
        category: BUG_CATEGORIES.OUTPUT_FORMATTING,
        description: '"undefined" appearing in analysis results',
        testCase: 'Check EDA, VIS, LLM outputs for undefined values',
        severity: 'HIGH'
    },
    {
        id: 'BUG_002', 
        category: BUG_CATEGORIES.OUTPUT_FORMATTING,
        description: '"[object Object]" appearing in INT analysis',
        testCase: 'Verify INT analysis returns formatted text',
        severity: 'HIGH'
    },
    {
        id: 'BUG_003',
        category: BUG_CATEGORIES.CONTEXT_RELEVANCE,
        description: 'LLM analysis suggests irrelevant "churn prediction" for diabetes data',
        testCase: 'Verify LLM suggestions match actual data domain',
        severity: 'MEDIUM'
    },
    {
        id: 'BUG_004',
        category: BUG_CATEGORIES.CONTEXT_RELEVANCE,
        description: 'Hardcoded "sales performance" questions for medical data',
        testCase: 'Check suggested questions are domain-appropriate',
        severity: 'MEDIUM'
    },
    {
        id: 'BUG_005',
        category: BUG_CATEGORIES.ERROR_HANDLING,
        description: 'Cannot read properties of undefined (reading \'length\')',
        testCase: 'Test EDA analysis for undefined property errors',
        severity: 'HIGH'
    },
    {
        id: 'BUG_006',
        category: BUG_CATEGORIES.ERROR_HANDLING,
        description: 'Cannot read properties of undefined (reading \'slice\')',
        testCase: 'Test LLM analysis for slice errors',
        severity: 'HIGH'
    },
    {
        id: 'BUG_007',
        category: BUG_CATEGORIES.PERFORMANCE,
        description: 'TUI freezes on 6k row files with no animation',
        testCase: 'Test medium-sized files for responsiveness',
        severity: 'HIGH'
    },
    {
        id: 'BUG_008',
        category: BUG_CATEGORIES.COPY_FUNCTIONALITY,
        description: 'Copy functionality undefined/broken',
        testCase: 'Test copy option in TUI interface',
        severity: 'MEDIUM'
    }
];

class BugTestSuite {
    constructor() {
        this.testResults = [];
        this.activeTests = new Map();
        this.testStartTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Bug Analysis & Testing Suite');
        console.log(`📅 Test Start Time: ${new Date().toISOString()}`);
        console.log(`🐛 Total Bugs to Test: ${IDENTIFIED_BUGS.length}`);
        console.log('=' .repeat(80));

        // Run tests in parallel for efficiency
        const testPromises = [
            this.testOutputFormatting(),
            this.testContextRelevance(),
            this.testErrorHandling(),
            this.testPerformance(),
            this.testCopyFunctionality()
        ];

        try {
            await Promise.allSettled(testPromises);
            this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testOutputFormatting() {
        console.log('🔍 Testing Output Formatting Issues...');
        
        const tests = [
            this.testEDAOutput(),
            this.testINTOutput(),
            this.testLLMOutput(),
            this.testVISOutput()
        ];

        const results = await Promise.allSettled(tests);
        return results;
    }

    async testEDAOutput() {
        return new Promise((resolve) => {
            console.log('  📊 Testing EDA output for "undefined" values...');
            
            const child = spawn('node', [
                'dist/datapilot.js', 
                'eda', 
                'test_data/diabetes_patients.csv',
                '--quick'
            ], { stdio: 'pipe' });

            let output = '';
            let hasUndefined = false;

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('undefined')) {
                    hasUndefined = true;
                }
            });

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'EDA_OUTPUT_UNDEFINED',
                    bugId: 'BUG_001',
                    passed: !hasUndefined && code === 0,
                    output: output.substring(0, 500),
                    issues: hasUndefined ? ['Found "undefined" in output'] : []
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} EDA undefined test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'EDA_OUTPUT_UNDEFINED',
                    bugId: 'BUG_001',
                    passed: false,
                    output: 'Test timed out',
                    issues: ['Test exceeded 30 second timeout']
                });
            }, 30000);
        });
    }

    async testINTOutput() {
        return new Promise((resolve) => {
            console.log('  🛡️ Testing INT output for "[object Object]"...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'int',
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let output = '';
            let hasObjectObject = false;

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('[object Object]')) {
                    hasObjectObject = true;
                }
            });

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'INT_OUTPUT_OBJECT',
                    bugId: 'BUG_002',
                    passed: !hasObjectObject && code === 0,
                    output: output.substring(0, 500),
                    issues: hasObjectObject ? ['Found "[object Object]" in output'] : []
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} INT object test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'INT_OUTPUT_OBJECT',
                    bugId: 'BUG_002',
                    passed: false,
                    output: 'Test timed out',
                    issues: ['Test exceeded timeout']
                });
            }, 30000);
        });
    }

    async testLLMOutput() {
        return new Promise((resolve) => {
            console.log('  🤖 Testing LLM output for undefined and context issues...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'llm',
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let output = '';
            let issues = [];

            child.stdout.on('data', (data) => {
                output += data.toString();
                
                // Check for specific issues identified
                if (output.includes('undefined')) {
                    issues.push('Found "undefined" in LLM output');
                }
                if (output.includes('churn prediction')) {
                    issues.push('Inappropriate "churn prediction" suggestion for medical data');
                }
                if (output.includes('sales performance')) {
                    issues.push('Inappropriate "sales performance" suggestion for medical data');
                }
                if (output.includes('Cannot read properties of undefined')) {
                    issues.push('Undefined property error detected');
                }
            });

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'LLM_OUTPUT_CONTEXT',
                    bugId: ['BUG_003', 'BUG_004', 'BUG_006'],
                    passed: issues.length === 0 && code === 0,
                    output: output.substring(0, 1000),
                    issues: issues
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} LLM context test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                if (issues.length > 0) {
                    console.log(`      Issues found: ${issues.join(', ')}`);
                }
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'LLM_OUTPUT_CONTEXT',
                    bugId: ['BUG_003', 'BUG_004', 'BUG_006'],
                    passed: false,
                    output: 'Test timed out',
                    issues: ['Test exceeded timeout']
                });
            }, 60000); // Longer timeout for LLM
        });
    }

    async testVISOutput() {
        return new Promise((resolve) => {
            console.log('  📈 Testing VIS output for undefined values...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'vis',
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let output = '';
            let hasUndefined = false;

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('undefined')) {
                    hasUndefined = true;
                }
            });

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'VIS_OUTPUT_UNDEFINED', 
                    bugId: 'BUG_001',
                    passed: !hasUndefined && code === 0,
                    output: output.substring(0, 500),
                    issues: hasUndefined ? ['Found "undefined" in VIS output'] : []
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} VIS undefined test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'VIS_OUTPUT_UNDEFINED',
                    bugId: 'BUG_001', 
                    passed: false,
                    output: 'Test timed out',
                    issues: ['Test exceeded timeout']
                });
            }, 30000);
        });
    }

    async testContextRelevance() {
        console.log('🎯 Testing Context Relevance...');
        
        // Test different data types to ensure context appropriateness
        const testFiles = [
            'test_data/diabetes_patients.csv',
            'test_data/share-with-depression.csv',
            'test_data/obesity_by_state.csv'
        ];

        const promises = testFiles.map(file => this.testLLMContextForFile(file));
        return Promise.allSettled(promises);
    }

    async testLLMContextForFile(filename) {
        return new Promise((resolve) => {
            console.log(`  🔍 Testing LLM context relevance for ${path.basename(filename)}...`);
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'llm', 
                filename
            ], { stdio: 'pipe' });

            let output = '';
            let contextIssues = [];

            child.stdout.on('data', (data) => {
                output += data.toString();
                
                // Check for inappropriate suggestions based on file type
                if (filename.includes('diabetes') || filename.includes('health')) {
                    if (output.includes('sales') || output.includes('revenue') || output.includes('churn')) {
                        contextIssues.push('Medical data getting business suggestions');
                    }
                }
            });

            child.on('close', (code) => {
                const result = {
                    test: `CONTEXT_RELEVANCE_${path.basename(filename)}`,
                    bugId: ['BUG_003', 'BUG_004'],
                    passed: contextIssues.length === 0,
                    file: filename,
                    issues: contextIssues
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} Context relevance: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: `CONTEXT_RELEVANCE_${path.basename(filename)}`,
                    bugId: ['BUG_003', 'BUG_004'],
                    passed: false,
                    issues: ['Test timed out']
                });
            }, 45000);
        });
    }

    async testErrorHandling() {
        console.log('⚠️ Testing Error Handling...');
        
        const errorTests = [
            this.testUndefinedLengthError(),
            this.testUndefinedSliceError(),
            this.testInvalidFileHandling()
        ];

        return Promise.allSettled(errorTests);
    }

    async testUndefinedLengthError() {
        return new Promise((resolve) => {
            console.log('  🔍 Testing for "undefined length" errors...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'eda',
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let hasLengthError = false;
            let output = '';

            child.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                if (text.includes("Cannot read properties of undefined (reading 'length')")) {
                    hasLengthError = true;
                }
            });

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'UNDEFINED_LENGTH_ERROR',
                    bugId: 'BUG_005',
                    passed: !hasLengthError,
                    issues: hasLengthError ? ['Undefined length error detected'] : [],
                    output: output.substring(0, 500)
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} Length error test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'UNDEFINED_LENGTH_ERROR',
                    bugId: 'BUG_005',
                    passed: false,
                    issues: ['Test timed out']
                });
            }, 30000);
        });
    }

    async testUndefinedSliceError() {
        return new Promise((resolve) => {
            console.log('  🔍 Testing for "undefined slice" errors...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'llm',
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let hasSliceError = false;
            let output = '';

            child.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                if (text.includes("Cannot read properties of undefined (reading 'slice')")) {
                    hasSliceError = true;
                }
            });

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    test: 'UNDEFINED_SLICE_ERROR',
                    bugId: 'BUG_006',
                    passed: !hasSliceError,
                    issues: hasSliceError ? ['Undefined slice error detected'] : [],
                    output: output.substring(0, 500)
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} Slice error test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'UNDEFINED_SLICE_ERROR',
                    bugId: 'BUG_006',
                    passed: false,
                    issues: ['Test timed out']
                });
            }, 45000);
        });
    }

    async testInvalidFileHandling() {
        return new Promise((resolve) => {
            console.log('  🔍 Testing invalid file handling...');
            
            const child = spawn('node', [
                'dist/datapilot.js',
                'eda',
                'test_data/invalid.csv'
            ], { stdio: 'pipe' });

            let output = '';
            let hasGracefulError = false;

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                if (text.includes('Error') && !text.includes('undefined')) {
                    hasGracefulError = true;
                }
            });

            child.on('close', (code) => {
                const result = {
                    test: 'INVALID_FILE_HANDLING',
                    bugId: 'ERROR_HANDLING',
                    passed: hasGracefulError || code !== 0,
                    output: output.substring(0, 500),
                    issues: []
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} Invalid file test: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });

            setTimeout(() => {
                child.kill();
                resolve({
                    test: 'INVALID_FILE_HANDLING',
                    bugId: 'ERROR_HANDLING',
                    passed: false,
                    issues: ['Test timed out']
                });
            }, 20000);
        });
    }

    async testPerformance() {
        console.log('⚡ Testing Performance Issues...');
        
        // Test the medium-sized file that was causing freezing
        return this.testMediumFilePerformance();
    }

    async testMediumFilePerformance() {
        return new Promise((resolve) => {
            console.log('  📊 Testing medium file performance (6k rows)...');
            
            const startTime = Date.now();
            const child = spawn('node', [
                'dist/datapilot.js',
                'all',
                'test_data/share-with-mental-and-substance-disorders.csv',
                '--quick'
            ], { stdio: 'pipe' });

            let output = '';
            let completed = false;

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('Analysis complete')) {
                    completed = true;
                }
            });

            child.stderr.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    test: 'MEDIUM_FILE_PERFORMANCE',
                    bugId: 'BUG_007',
                    passed: completed && duration < 60000, // Should complete in under 1 minute
                    duration: duration,
                    output: output.substring(0, 500),
                    issues: duration > 60000 ? ['Performance too slow'] : []
                };
                
                this.testResults.push(result);
                console.log(`    ${result.passed ? '✅' : '❌'} Performance test: ${result.passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
                resolve(result);
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                child.kill();
                const duration = Date.now() - startTime;
                resolve({
                    test: 'MEDIUM_FILE_PERFORMANCE',
                    bugId: 'BUG_007',
                    passed: false,
                    duration: duration,
                    issues: ['Test exceeded 2 minute timeout - likely freezing bug']
                });
            }, 120000);
        });
    }

    async testCopyFunctionality() {
        console.log('📋 Testing Copy Functionality...');
        
        // This would need to test the TUI interface directly
        // For now, we'll test if the output contains copy instructions
        return new Promise((resolve) => {
            console.log('  📋 Testing copy functionality availability...');
            
            const result = {
                test: 'COPY_FUNCTIONALITY',
                bugId: 'BUG_008',
                passed: false, // Manual test needed
                issues: ['Manual TUI testing required for copy functionality'],
                output: 'This test requires manual TUI interaction'
            };
            
            this.testResults.push(result);
            console.log('    ⚠️ Copy functionality test requires manual TUI testing');
            resolve(result);
        });
    }

    generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.testStartTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE BUG TEST REPORT');
        console.log('='.repeat(80));
        console.log(`🕒 Total Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`📅 Test Completed: ${new Date().toISOString()}`);
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ✅ Passed: ${passedTests}`);
        console.log(`   ❌ Failed: ${failedTests}`);
        console.log(`   📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        console.log(`\n🐛 BUG STATUS:`);
        IDENTIFIED_BUGS.forEach(bug => {
            const relatedTests = this.testResults.filter(r => 
                Array.isArray(r.bugId) ? r.bugId.includes(bug.id) : r.bugId === bug.id
            );
            const allPassed = relatedTests.every(t => t.passed);
            const status = allPassed ? '✅ FIXED' : '❌ STILL PRESENT';
            console.log(`   ${bug.id}: ${status} - ${bug.description}`);
        });
        
        console.log(`\n📋 DETAILED RESULTS:`);
        this.testResults.forEach(result => {
            console.log(`\n   🔍 ${result.test}:`);
            console.log(`      Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
            if (result.issues && result.issues.length > 0) {
                console.log(`      Issues: ${result.issues.join(', ')}`);
            }
            if (result.duration) {
                console.log(`      Duration: ${result.duration}ms`);
            }
        });

        // Save detailed report to file
        const reportData = {
            testStartTime: this.testStartTime,
            testEndTime: endTime,
            duration: duration,
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: (passedTests / totalTests) * 100
            },
            identifiedBugs: IDENTIFIED_BUGS,
            testResults: this.testResults
        };

        const reportFilename = `bug_test_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportFilename}`);
        
        return reportData;
    }
}

// Main execution - cross-platform check
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const testSuite = new BugTestSuite();
    testSuite.runAllTests().catch(console.error);
}

export default BugTestSuite; 