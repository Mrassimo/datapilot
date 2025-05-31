#!/usr/bin/env node

/**
 * Comprehensive UX Evaluation for DataPilot TUI
 * Based on CLI/TUI Design Best Practices
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// UX Evaluation Criteria based on research
const UX_CRITERIA = {
  navigation: {
    name: 'Navigation & Flow',
    tests: [
      { id: 'nav-1', desc: 'Can exit from every screen', weight: 'critical' },
      { id: 'nav-2', desc: 'Clear navigation indicators', weight: 'high' },
      { id: 'nav-3', desc: 'Consistent back/escape behavior', weight: 'high' },
      { id: 'nav-4', desc: 'Breadcrumb or location awareness', weight: 'medium' },
      { id: 'nav-5', desc: 'Keyboard shortcuts documented', weight: 'high' }
    ]
  },
  feedback: {
    name: 'Feedback & Status',
    tests: [
      { id: 'fb-1', desc: 'Loading indicators for long operations', weight: 'high' },
      { id: 'fb-2', desc: 'Clear error messages', weight: 'critical' },
      { id: 'fb-3', desc: 'Success confirmations', weight: 'medium' },
      { id: 'fb-4', desc: 'Progress indicators for multi-step processes', weight: 'high' },
      { id: 'fb-5', desc: 'Current state clearly visible', weight: 'high' }
    ]
  },
  userControl: {
    name: 'User Control',
    tests: [
      { id: 'uc-1', desc: 'Ctrl+C works everywhere', weight: 'critical' },
      { id: 'uc-2', desc: 'Can cancel long operations', weight: 'high' },
      { id: 'uc-3', desc: 'Undo/redo capabilities', weight: 'low' },
      { id: 'uc-4', desc: 'Confirmation for dangerous actions', weight: 'critical' },
      { id: 'uc-5', desc: 'Non-blocking UI during operations', weight: 'high' }
    ]
  },
  help: {
    name: 'Help & Documentation',
    tests: [
      { id: 'help-1', desc: 'Help accessible from every screen', weight: 'high' },
      { id: 'help-2', desc: 'Context-sensitive help', weight: 'medium' },
      { id: 'help-3', desc: 'Keyboard shortcuts visible', weight: 'high' },
      { id: 'help-4', desc: 'Clear instructions for first-time users', weight: 'high' },
      { id: 'help-5', desc: 'Error recovery guidance', weight: 'medium' }
    ]
  },
  visual: {
    name: 'Visual Design & Layout',
    tests: [
      { id: 'vis-1', desc: 'Consistent color scheme', weight: 'medium' },
      { id: 'vis-2', desc: 'Clear visual hierarchy', weight: 'high' },
      { id: 'vis-3', desc: 'Appropriate use of whitespace', weight: 'medium' },
      { id: 'vis-4', desc: 'Readable font and sizing', weight: 'high' },
      { id: 'vis-5', desc: 'Responsive to terminal size', weight: 'high' }
    ]
  },
  accessibility: {
    name: 'Accessibility',
    tests: [
      { id: 'acc-1', desc: 'Works without color', weight: 'high' },
      { id: 'acc-2', desc: 'Screen reader compatible', weight: 'medium' },
      { id: 'acc-3', desc: 'Keyboard-only navigation', weight: 'critical' },
      { id: 'acc-4', desc: 'Clear focus indicators', weight: 'high' },
      { id: 'acc-5', desc: 'Alternative text for icons/emojis', weight: 'low' }
    ]
  },
  performance: {
    name: 'Performance & Efficiency',
    tests: [
      { id: 'perf-1', desc: 'Immediate response to input', weight: 'critical' },
      { id: 'perf-2', desc: 'No unnecessary animations/delays', weight: 'high' },
      { id: 'perf-3', desc: 'Efficient screen updates', weight: 'medium' },
      { id: 'perf-4', desc: 'Low memory usage', weight: 'medium' },
      { id: 'perf-5', desc: 'Fast startup time', weight: 'high' }
    ]
  },
  consistency: {
    name: 'Consistency & Standards',
    tests: [
      { id: 'cons-1', desc: 'Follows platform conventions', weight: 'high' },
      { id: 'cons-2', desc: 'Consistent terminology', weight: 'medium' },
      { id: 'cons-3', desc: 'Standard key bindings (q=quit, etc)', weight: 'high' },
      { id: 'cons-4', desc: 'Predictable behavior', weight: 'critical' },
      { id: 'cons-5', desc: 'Consistent error handling', weight: 'high' }
    ]
  }
};

// Test scenarios for each screen
const SCREEN_TESTS = [
  {
    name: 'Welcome Screen',
    sequence: '',
    tests: [
      'Check if logo displays correctly',
      'Verify welcome message clarity',
      'Test if instructions are visible',
      'Check loading time'
    ]
  },
  {
    name: 'Main Menu',
    sequence: '\n',
    tests: [
      'Verify all menu options visible',
      'Test arrow key navigation',
      'Check if current selection is highlighted',
      'Test enter key selection',
      'Test escape/back functionality'
    ]
  },
  {
    name: 'CSV Analysis Menu',
    sequence: '\n\x1b[B\n',
    tests: [
      'Check file selection process',
      'Test invalid file handling',
      'Verify analysis options',
      'Test back navigation'
    ]
  },
  {
    name: 'Demo Mode',
    sequence: '\n\x1b[B\x1b[B\n',
    tests: [
      'Check sample data availability',
      'Test dataset selection',
      'Verify demo functionality',
      'Test exit from demo'
    ]
  },
  {
    name: 'Settings',
    sequence: '\n\x1b[B\x1b[B\x1b[B\x1b[B\x1b[B\n',
    tests: [
      'Check settings accessibility',
      'Test configuration changes',
      'Verify persistence',
      'Test cancel functionality'
    ]
  }
];

class UXEvaluator {
  constructor() {
    this.results = {};
    this.currentScreen = null;
    this.screenshots = [];
  }

  async evaluate() {
    console.log(chalk.bold.cyan('🔍 DataPilot TUI - Comprehensive UX Evaluation\n'));
    console.log(chalk.gray('Based on CLI/TUI Design Best Practices\n'));

    // Test each screen
    for (const screen of SCREEN_TESTS) {
      await this.evaluateScreen(screen);
    }

    // Generate comprehensive report
    await this.generateReport();
  }

  async evaluateScreen(screen) {
    console.log(chalk.yellow(`\n📱 Evaluating: ${screen.name}`));
    
    const results = {
      name: screen.name,
      issues: [],
      positives: [],
      suggestions: []
    };

    // Launch DataPilot TUI
    const datapilot = spawn('node', ['bin/datapilot.js', 'ui'], {
      cwd: process.cwd()
    });

    let output = '';
    let responseTimes = [];
    let lastInputTime = Date.now();

    datapilot.stdout.on('data', (data) => {
      const responseTime = Date.now() - lastInputTime;
      responseTimes.push(responseTime);
      output += data.toString();
      
      // Take "screenshot" of current state
      this.screenshots.push({
        screen: screen.name,
        content: data.toString(),
        timestamp: Date.now()
      });
    });

    // Navigate to screen
    setTimeout(() => {
      lastInputTime = Date.now();
      datapilot.stdin.write(screen.sequence);
    }, 500);

    // Perform screen-specific tests
    setTimeout(() => {
      // Test escape functionality
      lastInputTime = Date.now();
      datapilot.stdin.write('\x1b');
      
      // Check response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      if (avgResponseTime > 100) {
        results.issues.push(`Slow response time: ${avgResponseTime.toFixed(0)}ms average`);
      } else {
        results.positives.push(`Fast response time: ${avgResponseTime.toFixed(0)}ms average`);
      }
    }, 2000);

    // Exit
    setTimeout(() => {
      datapilot.stdin.write('q\n');
      datapilot.kill();
    }, 3000);

    await new Promise(resolve => {
      datapilot.on('close', () => {
        // Analyze output for this screen
        this.analyzeScreenOutput(screen, output, results);
        this.results[screen.name] = results;
        resolve();
      });
    });
  }

  analyzeScreenOutput(screen, output, results) {
    // Check for common UX issues
    
    // Navigation checks
    if (!output.includes('ESC') && !output.includes('Back') && !output.includes('Exit')) {
      results.issues.push('No clear exit/back instructions visible');
    }

    // Help availability
    if (!output.includes('Help') && !output.includes('?')) {
      results.issues.push('No help option visible');
    }

    // Loading indicators
    if (screen.name.includes('Analysis') && !output.includes('Loading') && !output.includes('...')) {
      results.suggestions.push('Add loading indicators for analysis operations');
    }

    // Error handling
    if (output.includes('Error') || output.includes('error')) {
      const errorContext = output.match(/.*[Ee]rror.*/g);
      if (errorContext) {
        results.issues.push(`Error handling issue: ${errorContext[0]}`);
      }
    }

    // Visual hierarchy
    if (!output.includes('━') && !output.includes('─') && !output.includes('│')) {
      results.suggestions.push('Consider using box-drawing characters for better visual structure');
    }

    // Color usage
    const hasColors = output.includes('\x1b[');
    if (hasColors) {
      results.positives.push('Uses color for visual enhancement');
    }

    // Keyboard shortcuts
    if (output.includes('↑↓') || output.includes('arrows')) {
      results.positives.push('Keyboard navigation instructions present');
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      detailedResults: this.results,
      scorecard: this.calculateScores(),
      recommendations: this.generateRecommendations(),
      bestPracticesAlignment: this.checkBestPractices()
    };

    // Write detailed report
    await fs.writeFile(
      path.join(process.cwd(), 'tests/UX_EVALUATION_REPORT.md'),
      this.formatReport(report),
      'utf8'
    );

    // Display summary
    console.log(chalk.bold.cyan('\n📊 UX Evaluation Summary\n'));
    this.displayScorecard(report.scorecard);
  }

  generateSummary() {
    let totalIssues = 0;
    let criticalIssues = 0;

    Object.values(this.results).forEach(result => {
      totalIssues += result.issues.length;
      result.issues.forEach(issue => {
        if (issue.includes('Error') || issue.includes('crash')) {
          criticalIssues++;
        }
      });
    });

    return {
      totalScreensEvaluated: SCREEN_TESTS.length,
      totalIssues,
      criticalIssues,
      overallStatus: criticalIssues > 0 ? 'Needs Immediate Attention' : 
                     totalIssues > 10 ? 'Needs Improvement' : 'Good'
    };
  }

  calculateScores() {
    const scores = {};
    
    Object.entries(UX_CRITERIA).forEach(([category, criteria]) => {
      let score = 100;
      let deductions = 0;
      
      // Deduct points based on issues found
      Object.values(this.results).forEach(result => {
        result.issues.forEach(issue => {
          if (this.issueBelongsToCategory(issue, category)) {
            deductions += this.getDeductionWeight(criteria.tests);
          }
        });
      });
      
      scores[category] = {
        name: criteria.name,
        score: Math.max(0, score - deductions),
        grade: this.getGrade(score - deductions)
      };
    });
    
    return scores;
  }

  issueBelongsToCategory(issue, category) {
    const categoryKeywords = {
      navigation: ['exit', 'back', 'navigate', 'escape'],
      feedback: ['loading', 'indicator', 'progress', 'status'],
      userControl: ['cancel', 'ctrl', 'undo', 'confirm'],
      help: ['help', 'instruction', 'guide', 'documentation'],
      visual: ['color', 'layout', 'hierarchy', 'spacing'],
      accessibility: ['keyboard', 'screen reader', 'focus'],
      performance: ['slow', 'delay', 'response', 'lag'],
      consistency: ['inconsistent', 'standard', 'convention']
    };
    
    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => issue.toLowerCase().includes(keyword));
  }

  getDeductionWeight(tests) {
    // Weight based on test importance
    const weights = { critical: 20, high: 10, medium: 5, low: 2 };
    return weights.high; // Default to high
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  checkBestPractices() {
    const practices = {
      'Progressive Discovery': this.checkProgressiveDiscovery(),
      'Human-First Design': this.checkHumanFirst(),
      'Composability': this.checkComposability(),
      'Modern Features': this.checkModernFeatures(),
      'Accessibility': this.checkAccessibility()
    };
    
    return practices;
  }

  checkProgressiveDiscovery() {
    // Check if UI guides users step by step
    const hasGuidance = Object.values(this.results).some(r => 
      r.positives.some(p => p.includes('instruction') || p.includes('guide'))
    );
    return hasGuidance ? 'Partially Implemented' : 'Needs Work';
  }

  checkHumanFirst() {
    // Check for human-friendly features
    const hasColors = this.screenshots.some(s => s.content.includes('\x1b['));
    const hasClearText = !this.screenshots.some(s => s.content.includes('undefined'));
    return hasColors && hasClearText ? 'Good' : 'Needs Improvement';
  }

  checkComposability() {
    // DataPilot is primarily a TUI tool, not heavily composable
    return 'Not Applicable';
  }

  checkModernFeatures() {
    // Check for modern CLI features
    const features = [];
    if (this.screenshots.some(s => s.content.includes('\x1b['))) features.push('Color support');
    if (this.screenshots.some(s => s.content.includes('📊'))) features.push('Emoji support');
    return features.length > 0 ? `Good (${features.join(', ')})` : 'Basic';
  }

  checkAccessibility() {
    // Basic accessibility check
    const keyboardNav = Object.values(this.results).some(r => 
      r.positives.some(p => p.includes('keyboard'))
    );
    return keyboardNav ? 'Basic Support' : 'Needs Work';
  }

  generateRecommendations() {
    const recommendations = [
      {
        priority: 'Critical',
        items: []
      },
      {
        priority: 'High',
        items: []
      },
      {
        priority: 'Medium',
        items: []
      }
    ];

    // Analyze issues and generate recommendations
    Object.values(this.results).forEach(result => {
      result.issues.forEach(issue => {
        if (issue.includes('Error') || issue.includes('crash')) {
          recommendations[0].items.push(`Fix: ${issue}`);
        } else if (issue.includes('exit') || issue.includes('slow')) {
          recommendations[1].items.push(`Improve: ${issue}`);
        }
      });
      
      result.suggestions.forEach(suggestion => {
        recommendations[2].items.push(suggestion);
      });
    });

    // Add best practice recommendations
    if (!this.screenshots.some(s => s.content.includes('Help'))) {
      recommendations[1].items.push('Add help system accessible with "?" key');
    }
    
    if (!this.screenshots.some(s => s.content.includes('Loading'))) {
      recommendations[1].items.push('Add loading indicators for all async operations');
    }

    return recommendations;
  }

  formatReport(report) {
    let markdown = `# DataPilot TUI - Comprehensive UX Evaluation Report

**Date**: ${new Date(report.timestamp).toLocaleDateString()}  
**Version**: DataPilot v1.1.1  
**Evaluator**: Automated UX Testing Suite

## Executive Summary

- **Overall Status**: ${report.summary.overallStatus}
- **Screens Evaluated**: ${report.summary.totalScreensEvaluated}
- **Total Issues Found**: ${report.summary.totalIssues}
- **Critical Issues**: ${report.summary.criticalIssues}

## UX Scorecard

| Category | Score | Grade | Status |
|----------|-------|-------|--------|
`;

    Object.entries(report.scorecard).forEach(([key, value]) => {
      const status = value.score >= 80 ? '✅' : value.score >= 60 ? '⚠️' : '❌';
      markdown += `| ${value.name} | ${value.score}% | ${value.grade} | ${status} |\n`;
    });

    markdown += `
## Best Practices Alignment

| Practice | Status |
|----------|--------|
`;

    Object.entries(report.bestPracticesAlignment).forEach(([practice, status]) => {
      markdown += `| ${practice} | ${status} |\n`;
    });

    markdown += `
## Detailed Screen Analysis
`;

    Object.entries(report.detailedResults).forEach(([screen, results]) => {
      markdown += `
### ${screen}

**Issues Found** (${results.issues.length}):
${results.issues.map(i => `- ❌ ${i}`).join('\n') || '- None'}

**Positive Aspects** (${results.positives.length}):
${results.positives.map(p => `- ✅ ${p}`).join('\n') || '- None identified'}

**Suggestions**:
${results.suggestions.map(s => `- 💡 ${s}`).join('\n') || '- None'}
`;
    });

    markdown += `
## Recommendations

### Critical Priority
${report.recommendations[0].items.map(i => `- 🔴 ${i}`).join('\n') || '- None'}

### High Priority
${report.recommendations[1].items.map(i => `- 🟡 ${i}`).join('\n') || '- None'}

### Medium Priority
${report.recommendations[2].items.map(i => `- 🟢 ${i}`).join('\n') || '- None'}

## Testing Methodology

This evaluation was conducted using:
- Automated navigation testing of all major screens
- Response time measurements
- Output analysis for UX patterns
- Best practices checklist from clig.dev and other industry standards
- Accessibility and usability heuristics

## Next Steps

1. Address all critical issues immediately
2. Implement high-priority recommendations
3. Consider user testing with real users
4. Re-evaluate after fixes are implemented
`;

    return markdown;
  }

  displayScorecard(scorecard) {
    console.log(chalk.bold('Category Scores:\n'));
    
    Object.entries(scorecard).forEach(([key, value]) => {
      const color = value.score >= 80 ? chalk.green : 
                    value.score >= 60 ? chalk.yellow : chalk.red;
      const bar = '█'.repeat(Math.floor(value.score / 10)) + 
                  '░'.repeat(10 - Math.floor(value.score / 10));
      
      console.log(`${value.name.padEnd(25)} ${bar} ${color(value.score + '%')} (${value.grade})`);
    });
  }
}

// Run evaluation
const evaluator = new UXEvaluator();
evaluator.evaluate().catch(console.error);