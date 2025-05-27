#!/usr/bin/env node

/**
 * Master Test Runner for DataPilot
 * Runs comprehensive bug tests and TUI tests in parallel
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MasterTestRunner {
    constructor() {
        this.testStartTime = Date.now();
        this.allResults = {
            bugTests: null,
            tuiTests: null,
            cliTests: null
        };
    }

    async runAllTests() {
        console.log('🚀 DATAPILOT COMPREHENSIVE TESTING SUITE');
        console.log('=' .repeat(80));
        console.log(`📅 Test Suite Started: ${new Date().toISOString()}`);
        console.log('🎯 Running all tests in parallel for maximum efficiency');
        console.log('=' .repeat(80));

        // Run all test suites in parallel
        const testPromises = [
            this.runBugTests(),
            this.runTUITests(),
            this.runCLIFunctionalityTests(),
            this.runSpecificIssueTests()
        ];

        try {
            const results = await Promise.allSettled(testPromises);
            await this.generateMasterReport(results);
        } catch (error) {
            console.error('❌ Master test suite failed:', error);
        }
    }

    async runBugTests() {
        return new Promise((resolve) => {
            console.log('🐛 Starting Bug Analysis Tests...');
            
            const child = spawn('node', ['bug_analysis_and_tests.js'], {
                stdio: 'pipe'
            });

            let output = '';

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                // Stream output with prefix
                console.log(`[BUG] ${text.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`[BUG ERROR] ${text.trim()}`);
            });

            child.on('close', (code) => {
                this.allResults.bugTests = {
                    exitCode: code,
                    output: output,
                    completed: true
                };
                console.log(`🐛 Bug tests completed with exit code: ${code}`);
                resolve(this.allResults.bugTests);
            });
        });
    }

    async runTUITests() {
        return new Promise((resolve) => {
            console.log('🎨 Starting TUI Interactive Tests...');
            
            const child = spawn('node', ['tui_interactive_tests.js'], {
                stdio: 'pipe'
            });

            let output = '';

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`[TUI] ${text.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`[TUI ERROR] ${text.trim()}`);
            });

            child.on('close', (code) => {
                this.allResults.tuiTests = {
                    exitCode: code,
                    output: output,
                    completed: true
                };
                console.log(`🎨 TUI tests completed with exit code: ${code}`);
                resolve(this.allResults.tuiTests);
            });
        });
    }

    async runCLIFunctionalityTests() {
        return new Promise((resolve) => {
            console.log('⚡ Starting CLI Functionality Tests...');
            
            // Test basic CLI commands with small files
            const tests = [
                this.testCLICommand('eda', 'test_data/diabetes_patients.csv'),
                this.testCLICommand('int', 'test_data/obesity_by_state.csv'),
                this.testCLICommand('vis', 'test_data/food_nutrition_diabetes.csv'),
                this.testCLICommand('llm', 'test_data/patient_lifestyle_data.csv'),
                this.testCLICommand('all', 'test_data/diabetes_lab_results.csv', ['--quick'])
            ];

            Promise.allSettled(tests).then(results => {
                this.allResults.cliTests = {
                    results: results,
                    completed: true
                };
                console.log('⚡ CLI functionality tests completed');
                resolve(this.allResults.cliTests);
            });
        });
    }

    async testCLICommand(command, file, extraArgs = []) {
        return new Promise((resolve) => {
            console.log(`  📊 Testing CLI: ${command} ${path.basename(file)}`);
            
            const args = ['dist/datapilot.js', command, file, ...extraArgs];
            const child = spawn('node', args, { stdio: 'pipe' });

            let output = '';
            let hasError = false;
            let hasUndefined = false;
            let hasObjectObject = false;
            const startTime = Date.now();

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                if (text.includes('undefined')) hasUndefined = true;
                if (text.includes('[object Object]')) hasObjectObject = true;
            });

            child.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                hasError = true;
            });

            // Set timeout based on command
            const timeout = command === 'all' ? 60000 : 30000;
            const timer = setTimeout(() => {
                child.kill();
                resolve({
                    command,
                    file,
                    passed: false,
                    duration: Date.now() - startTime,
                    issues: ['Timeout exceeded'],
                    timedOut: true
                });
            }, timeout);

            child.on('close', (code) => {
                clearTimeout(timer);
                const duration = Date.now() - startTime;
                
                const issues = [];
                if (hasUndefined) issues.push('Contains "undefined" output');
                if (hasObjectObject) issues.push('Contains "[object Object]" output');
                if (hasError && code !== 0) issues.push('Process error');
                if (code !== 0) issues.push(`Non-zero exit code: ${code}`);

                const result = {
                    command,
                    file: path.basename(file),
                    passed: code === 0 && !hasUndefined && !hasObjectObject,
                    duration,
                    issues,
                    output: output.substring(0, 500)
                };

                console.log(`    ${result.passed ? '✅' : '❌'} ${command} ${result.file}: ${result.passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
                resolve(result);
            });
        });
    }

    async runSpecificIssueTests() {
        return new Promise((resolve) => {
            console.log('🎯 Testing Specific Issues from myissues.md...');
            
            const specificTests = [
                this.testMediumFileFreezing(),
                this.testContextRelevanceIssue(),
                this.testUndefinedOutputIssue()
            ];

            Promise.allSettled(specificTests).then(results => {
                console.log('🎯 Specific issue tests completed');
                resolve(results);
            });
        });
    }

    async testMediumFileFreezing() {
        return new Promise((resolve) => {
            console.log('  🔍 Testing medium file freezing issue (6k rows)...');
            
            const startTime = Date.now();
            const child = spawn('node', [
                'dist/datapilot.js', 
                'eda', 
                'test_data/share-with-mental-and-substance-disorders.csv',
                '--quick'
            ], { stdio: 'pipe' });

            let output = '';
            let completed = false;

            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('Analysis complete') || output.includes('complete!')) {
                    completed = true;
                }
            });

            // Kill after 90 seconds if not completed
            setTimeout(() => {
                if (!completed) {
                    child.kill();
                }
            }, 90000);

            child.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    test: 'MEDIUM_FILE_FREEZING',
                    passed: completed && duration < 60000,
                    duration,
                    issues: []
                };

                if (!completed) result.issues.push('Process did not complete (likely froze)');
                if (duration > 60000) result.issues.push('Performance too slow (> 60s)');

                console.log(`    ${result.passed ? '✅' : '❌'} Medium file test: ${result.passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
                resolve(result);
            });
        });
    }

    async testContextRelevanceIssue() {
        return new Promise((resolve) => {
            console.log('  🎯 Testing context relevance issue (medical data getting business suggestions)...');
            
            const child = spawn('node', [
                'dist/datapilot.js', 
                'llm', 
                'test_data/diabetes_patients.csv'
            ], { stdio: 'pipe' });

            let output = '';
            let hasContextIssues = false;

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                // Check for inappropriate business context in medical data
                if (text.includes('churn prediction') || 
                    text.includes('sales performance') || 
                    text.includes('revenue')) {
                    hasContextIssues = true;
                }
            });

            setTimeout(() => {
                child.kill();
            }, 45000);

            child.on('close', (code) => {
                const result = {
                    test: 'CONTEXT_RELEVANCE_ISSUE',
                    passed: !hasContextIssues,
                    issues: hasContextIssues ? ['Medical data receiving business suggestions'] : []
                };

                console.log(`    ${result.passed ? '✅' : '❌'} Context relevance: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });
        });
    }

    async testUndefinedOutputIssue() {
        return new Promise((resolve) => {
            console.log('  🔍 Testing undefined output issue...');
            
            const child = spawn('node', [
                'dist/datapilot.js', 
                'all', 
                'test_data/diabetes_patients.csv',
                '--quick'
            ], { stdio: 'pipe' });

            let output = '';
            let hasUndefined = false;

            child.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                if (text.includes('undefined')) {
                    hasUndefined = true;
                }
            });

            setTimeout(() => {
                child.kill();
            }, 30000);

            child.on('close', (code) => {
                const result = {
                    test: 'UNDEFINED_OUTPUT_ISSUE',
                    passed: !hasUndefined,
                    issues: hasUndefined ? ['Found "undefined" in output'] : []
                };

                console.log(`    ${result.passed ? '✅' : '❌'} Undefined output: ${result.passed ? 'PASSED' : 'FAILED'}`);
                resolve(result);
            });
        });
    }

    async generateMasterReport(testResults) {
        const endTime = Date.now();
        const totalDuration = endTime - this.testStartTime;

        console.log('\n' + '=' .repeat(80));
        console.log('📊 MASTER TEST REPORT - DATAPILOT COMPREHENSIVE TESTING');
        console.log('=' .repeat(80));
        console.log(`🕒 Total Testing Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
        console.log(`📅 Testing Completed: ${new Date().toISOString()}`);

        // Analyse test results
        const bugTestsPassed = this.allResults.bugTests?.exitCode === 0;
        const tuiTestsPassed = this.allResults.tuiTests?.exitCode === 0;
        const cliTestsPassed = this.allResults.cliTests?.results?.every(r => r.value?.passed) || false;

        console.log('\n📈 TEST SUITE SUMMARY:');
        console.log(`   🐛 Bug Analysis Tests: ${bugTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   🎨 TUI Interactive Tests: ${tuiTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   ⚡ CLI Functionality Tests: ${cliTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);

        console.log('\n🎯 IDENTIFIED ISSUES FROM myissues.md:');
        console.log('   1. ❌ "undefined" appearing in analysis results (HIGH PRIORITY)');
        console.log('   2. ❌ "[object Object]" in INT analysis (HIGH PRIORITY)');
        console.log('   3. ❌ Inappropriate context suggestions for medical data (MEDIUM PRIORITY)');
        console.log('   4. ❌ TUI freezing on medium files (6k rows) (HIGH PRIORITY)');
        console.log('   5. ❌ Copy functionality broken/undefined (MEDIUM PRIORITY)');
        console.log('   6. ❌ Undefined property errors in analysis (HIGH PRIORITY)');

        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   🔧 Fix undefined property errors in analysis engines');
        console.log('   🎯 Implement domain-aware context generation for LLM suggestions');
        console.log('   ⚡ Optimise performance for medium-sized files');
        console.log('   📋 Fix copy functionality in TUI interface');
        console.log('   🧪 Implement comprehensive error handling');
        console.log('   📊 Add proper output formatting to prevent object serialisation issues');

        // Save comprehensive report
        const masterReport = {
            testSuiteType: 'COMPREHENSIVE_MASTER',
            testStartTime: this.testStartTime,
            testEndTime: endTime,
            totalDuration: totalDuration,
            testResults: this.allResults,
            summary: {
                bugTestsPassed,
                tuiTestsPassed,
                cliTestsPassed,
                overallSuccess: bugTestsPassed && tuiTestsPassed && cliTestsPassed
            },
            identifiedIssues: [
                'Undefined values in analysis output',
                'Object serialisation issues',
                'Context relevance problems',
                'Performance issues with medium files',
                'Copy functionality broken',
                'Error handling inadequate'
            ],
            priorityIssues: [
                'Fix undefined property errors (CRITICAL)',
                'Resolve object serialisation in output (CRITICAL)',
                'Improve performance for 6k+ row files (HIGH)',
                'Fix domain context for LLM suggestions (MEDIUM)',
                'Repair TUI copy functionality (MEDIUM)'
            ]
        };

        const masterReportFilename = `master_test_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(masterReportFilename, JSON.stringify(masterReport, null, 2));
        
        console.log(`\n💾 Master report saved to: ${masterReportFilename}`);
        console.log('\n🏁 COMPREHENSIVE TESTING COMPLETE!');
        
        return masterReport;
    }
}

// Main execution - cross-platform check
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const masterRunner = new MasterTestRunner();
    masterRunner.runAllTests().catch(console.error);
}

export default MasterTestRunner; 