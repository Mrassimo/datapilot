/**
 * WCAG Accessibility Engine Tests
 * 
 * Tests the comprehensive WCAG accessibility compliance engine that ensures
 * visualizations meet Web Content Accessibility Guidelines, provide alternative
 * representations, and support assistive technologies.
 */

import { WCAGAccessibilityEngine } from '../../../src/analyzers/visualization/engines/wcag-accessibility-engine';
import type { 
  AccessibilityAssessment,
  WCAGGuideline,
  ColorAccessibility,
  AlternativeRepresentation,
  AssistiveTechnology
} from '../../../src/analyzers/visualization/types';
import { ChartType, AccessibilityLevel } from '../../../src/analyzers/visualization/types';

describe('WCAGAccessibilityEngine', () => {
  describe('WCAG 2.1 Compliance Assessment', () => {
    it('should assess Level AA compliance comprehensively', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const assessment = engine.assessWCAGCompliance({
        chart: {
          type: ChartType.BAR_CHART,
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
          text: {
            title: { fontSize: 16, color: '#000000', background: '#ffffff' },
            labels: { fontSize: 12, color: '#333333', background: '#ffffff' },
          },
          interactions: ['hover', 'click', 'keyboard_navigation'],
        },
        targetLevel: 'AA',
        guidelines: ['perceivable', 'operable', 'understandable', 'robust'],
      });

      expect(assessment.overallCompliance.level).toBeOneOf(['A', 'AA', 'AAA', 'Non-compliant']);
      expect(assessment.overallCompliance.score).toBeGreaterThanOrEqual(0);
      expect(assessment.overallCompliance.score).toBeLessThanOrEqual(1);

      // Should assess all four principles
      expect(assessment.principles.perceivable).toBeDefined();
      expect(assessment.principles.operable).toBeDefined();
      expect(assessment.principles.understandable).toBeDefined();
      expect(assessment.principles.robust).toBeDefined();

      // Should provide specific guideline assessments
      expect(assessment.guidelines.length).toBeGreaterThan(0);
      assessment.guidelines.forEach(guideline => {
        expect(guideline.id).toMatch(/^\d+\.\d+\.\d+$/); // Format: X.X.X
        expect(guideline.level).toBeOneOf(['A', 'AA', 'AAA']);
        expect(guideline.compliance).toBeOneOf(['pass', 'fail', 'not_applicable']);
      });
    });

    it('should identify specific WCAG violations and provide remediation', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const assessment = engine.assessWCAGCompliance({
        chart: {
          type: ChartType.PIE_CHART,
          colors: ['#ff0000', '#00ff00'], // Red-green issue
          text: {
            title: { fontSize: 10, color: '#cccccc', background: '#ffffff' }, // Low contrast
          },
          alternativeText: '', // Missing alt text
          keyboardSupport: false,
        },
        targetLevel: 'AA',
      });

      expect(assessment.violations.length).toBeGreaterThan(0);

      // Should identify color issues
      const colorViolation = assessment.violations.find(v => 
        v.guideline.includes('1.4.1') || v.description.includes('color')
      );
      expect(colorViolation).toBeDefined();
      expect(colorViolation?.severity).toBeOneOf(['minor', 'major', 'critical']);

      // Should identify contrast issues
      const contrastViolation = assessment.violations.find(v => 
        v.guideline.includes('1.4.3') || v.description.includes('contrast')
      );
      expect(contrastViolation).toBeDefined();

      // Should provide remediation steps
      assessment.violations.forEach(violation => {
        expect(violation.remediation.steps.length).toBeGreaterThan(0);
        expect(violation.remediation.codeExample).toBeDefined();
        expect(violation.remediation.testingGuidance).toBeDefined();
      });
    });

    it('should validate text alternatives and descriptions', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const textAlternatives = engine.validateTextAlternatives({
        chart: {
          type: ChartType.SCATTER_PLOT,
          data: {
            title: 'Height vs Weight Correlation',
            xAxis: 'Height (cm)',
            yAxis: 'Weight (kg)',
            dataPoints: 150,
          },
          alternativeText: 'Scatter plot showing positive correlation between height and weight',
          longDescription: 'This scatter plot displays the relationship between height and weight for 150 individuals...',
        },
        requirements: {
          altTextMaxLength: 125,
          longDescriptionRequired: true,
          dataTableAlternative: true,
        },
      });

      expect(textAlternatives.altText.isValid).toBe(true);
      expect(textAlternatives.altText.length).toBeLessThanOrEqual(125);
      expect(textAlternatives.longDescription.isProvided).toBe(true);

      // Should assess quality of descriptions
      expect(textAlternatives.quality.descriptiveness).toBeGreaterThan(0.7);
      expect(textAlternatives.quality.accuracy).toBeGreaterThan(0.8);
      expect(textAlternatives.quality.conciseness).toBeGreaterThan(0.6);

      // Should suggest improvements if needed
      if (textAlternatives.suggestions.length > 0) {
        textAlternatives.suggestions.forEach(suggestion => {
          expect(suggestion.type).toBeOneOf(['clarity', 'completeness', 'accuracy', 'length']);
          expect(suggestion.improvement).toBeDefined();
        });
      }
    });

    it('should ensure keyboard navigation compliance', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const keyboardAssessment = engine.assessKeyboardAccessibility({
        chart: {
          type: ChartType.LINE_CHART,
          interactiveElements: [
            { type: 'data_point', count: 50, focusable: true },
            { type: 'legend_item', count: 5, focusable: true },
            { type: 'tooltip', count: 1, focusable: false },
          ],
          navigation: {
            tabOrder: 'logical',
            focusIndicators: 'visible',
            keyboardShortcuts: ['arrow_keys', 'enter', 'escape'],
          },
        },
      });

      expect(keyboardAssessment.compliance.overall).toBeOneOf(['compliant', 'partial', 'non_compliant']);
      
      // Should validate focus management
      expect(keyboardAssessment.focusManagement.tabOrder).toBe('logical');
      expect(keyboardAssessment.focusManagement.focusTrapping).toBeDefined();
      expect(keyboardAssessment.focusManagement.focusIndicators.visible).toBe(true);

      // Should validate keyboard shortcuts
      expect(keyboardAssessment.keyboardShortcuts.standard).toContain('arrow_keys');
      expect(keyboardAssessment.keyboardShortcuts.conflicts.length).toBe(0);

      // Should ensure no keyboard traps
      expect(keyboardAssessment.accessibility.keyboardTraps).toBe(false);
      expect(keyboardAssessment.accessibility.allElementsReachable).toBe(true);
    });
  });

  describe('Color Accessibility and Contrast', () => {
    it('should calculate accurate contrast ratios', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const contrastResults = engine.calculateContrastRatios({
        colorPairs: [
          { foreground: '#000000', background: '#ffffff' }, // Black on white
          { foreground: '#ffffff', background: '#000000' }, // White on black
          { foreground: '#1f77b4', background: '#ffffff' }, // Blue on white
          { foreground: '#cccccc', background: '#ffffff' }, // Light gray on white
        ],
      });

      expect(contrastResults.length).toBe(4);

      // Black on white should have high contrast
      const blackOnWhite = contrastResults.find(r => 
        r.foreground === '#000000' && r.background === '#ffffff'
      );
      expect(blackOnWhite?.ratio).toBeCloseTo(21, 0); // Perfect contrast
      expect(blackOnWhite?.wcagLevel).toBe('AAA');

      // Light gray on white should fail
      const lightGrayOnWhite = contrastResults.find(r => 
        r.foreground === '#cccccc'
      );
      expect(lightGrayOnWhite?.ratio).toBeLessThan(4.5);
      expect(lightGrayOnWhite?.wcagLevel).toBe('Fail');
    });

    it('should detect and resolve color vision deficiency issues', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const colorVisionAssessment = engine.assessColorVisionAccessibility({
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'], // Problematic red-green
        chartType: ChartType.LINE_CHART,
        colorPurpose: 'categorical',
      });

      expect(colorVisionAssessment.issues.length).toBeGreaterThan(0);
      
      // Should identify red-green confusion
      const redGreenIssue = colorVisionAssessment.issues.find(issue => 
        issue.type === 'red_green_confusion'
      );
      expect(redGreenIssue).toBeDefined();
      expect(redGreenIssue?.severity).toBeOneOf(['mild', 'moderate', 'severe']);

      // Should provide alternative palettes
      expect(colorVisionAssessment.alternatives.length).toBeGreaterThan(0);
      colorVisionAssessment.alternatives.forEach(alternative => {
        expect(alternative.colors.length).toBe(4);
        expect(alternative.colorBlindFriendly).toBe(true);
        expect(alternative.accessibility.score).toBeGreaterThan(0.8);
      });

      // Should suggest additional encoding methods
      expect(colorVisionAssessment.additionalEncodings).toContain('patterns');
      expect(colorVisionAssessment.additionalEncodings).toContain('shapes');
    });

    it('should generate color-blind friendly palettes', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const palette = engine.generateColorBlindFriendlyPalette({
        count: 8,
        type: 'categorical',
        baseHue: 'blue',
        constraints: {
          minContrast: 4.5,
          distinctiveness: 'high',
          colorVisionTypes: ['protanopia', 'deuteranopia', 'tritanopia'],
        },
      });

      expect(palette.colors.length).toBe(8);
      expect(palette.accessibility.colorBlindFriendly).toBe(true);

      // Should test against different color vision types
      palette.accessibility.colorVisionTests.forEach(test => {
        expect(test.type).toBeOneOf(['protanopia', 'deuteranopia', 'tritanopia', 'normal']);
        expect(test.distinctiveness).toBeGreaterThan(0.8);
        expect(test.confusionPairs.length).toBe(0);
      });

      // Should provide fallback patterns
      expect(palette.fallbackEncodings.patterns.length).toBe(8);
      expect(palette.fallbackEncodings.shapes.length).toBe(8);
    });

    it('should validate color usage patterns against WCAG guidelines', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const colorUsageValidation = engine.validateColorUsage({
        chart: {
          type: ChartType.HEATMAP,
          colorEncoding: {
            type: 'sequential',
            range: ['#ffffff', '#1f77b4'],
            dataType: 'continuous',
            legend: true,
          },
          additionalIndicators: {
            patterns: false,
            textures: false,
            borders: true,
          },
        },
      });

      // Should identify if color is the only differentiator
      expect(colorUsageValidation.colorOnlyEncoding).toBeDefined();
      if (colorUsageValidation.colorOnlyEncoding.detected) {
        expect(colorUsageValidation.violations.length).toBeGreaterThan(0);
        expect(colorUsageValidation.suggestions).toContain('add_patterns');
      }

      // Should validate legend accessibility
      expect(colorUsageValidation.legend.accessible).toBeDefined();
      expect(colorUsageValidation.legend.contrastCompliant).toBe(true);
    });
  });

  describe('Alternative Representations and Formats', () => {
    it('should generate comprehensive data tables as alternatives', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const dataTable = engine.generateDataTable({
        chart: {
          type: ChartType.BAR_CHART,
          data: [
            { category: 'A', value: 10, region: 'North' },
            { category: 'B', value: 15, region: 'North' },
            { category: 'A', value: 8, region: 'South' },
            { category: 'B', value: 12, region: 'South' },
          ],
        },
        format: 'html',
        features: {
          sorting: true,
          filtering: true,
          summary: true,
          navigation: 'keyboard',
        },
      });

      expect(dataTable.html).toContain('<table');
      expect(dataTable.html).toContain('role="table"');
      expect(dataTable.accessibility.headers).toBe(true);
      expect(dataTable.accessibility.scope).toBe(true);
      expect(dataTable.accessibility.summary).toBeDefined();

      // Should include ARIA attributes
      expect(dataTable.html).toContain('aria-label');
      expect(dataTable.html).toContain('aria-describedby');

      // Should provide keyboard navigation
      expect(dataTable.keyboardSupport.enabled).toBe(true);
      expect(dataTable.keyboardSupport.instructions).toBeDefined();
    });

    it('should create sonification alternatives for data', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const sonification = engine.generateSonification({
        chart: {
          type: ChartType.LINE_CHART,
          data: Array.from({ length: 20 }, (_, i) => ({
            x: i,
            y: Math.sin(i * 0.5) * 10 + 20,
          })),
        },
        audio: {
          duration: 5000, // 5 seconds
          frequency: { min: 200, max: 800 },
          instrument: 'sine_wave',
          tempo: 'moderate',
        },
      });

      expect(sonification.audioUrl).toBeDefined();
      expect(sonification.transcript).toBeDefined();
      expect(sonification.duration).toBe(5000);

      // Should provide controls
      expect(sonification.controls.play).toBe(true);
      expect(sonification.controls.pause).toBe(true);
      expect(sonification.controls.speedControl).toBe(true);

      // Should include description
      expect(sonification.description.mapping).toBeDefined();
      expect(sonification.description.instructions).toBeDefined();
    });

    it('should generate tactile/haptic representations', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const tactile = engine.generateTactileRepresentation({
        chart: {
          type: ChartType.SCATTER_PLOT,
          data: Array.from({ length: 50 }, (_, i) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            category: ['A', 'B', 'C'][i % 3],
          })),
        },
        output: {
          format: 'svg_tactile',
          textureMapping: true,
          brailleLabels: true,
        },
      });

      expect(tactile.svg).toBeDefined();
      expect(tactile.textures.length).toBe(3); // One per category
      expect(tactile.brailleLabels.length).toBeGreaterThan(0);

      // Should provide texture legend
      expect(tactile.legend.textures).toBeDefined();
      expect(tactile.legend.brailleDescription).toBeDefined();

      // Should include exploration instructions
      expect(tactile.instructions.exploration).toBeDefined();
      expect(tactile.instructions.navigation).toBeDefined();
    });

    it('should create verbal descriptions with structured navigation', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const verbalDescription = engine.generateVerbalDescription({
        chart: {
          type: ChartType.CORRELATION_MATRIX,
          data: {
            variables: ['height', 'weight', 'age', 'income'],
            correlations: [
              [1.0, 0.8, 0.3, 0.1],
              [0.8, 1.0, 0.2, 0.15],
              [0.3, 0.2, 1.0, 0.4],
              [0.1, 0.15, 0.4, 1.0],
            ],
          },
        },
        style: {
          verbosity: 'detailed',
          structure: 'hierarchical',
          navigation: true,
        },
      });

      expect(verbalDescription.overview).toBeDefined();
      expect(verbalDescription.structure.sections.length).toBeGreaterThan(0);
      expect(verbalDescription.navigation.jumpLinks).toBe(true);

      // Should provide different levels of detail
      expect(verbalDescription.levels.summary).toBeDefined();
      expect(verbalDescription.levels.detailed).toBeDefined();
      expect(verbalDescription.levels.comprehensive).toBeDefined();

      // Should include statistical summaries
      expect(verbalDescription.statistics.strongestCorrelation).toBeDefined();
      expect(verbalDescription.statistics.weakestCorrelation).toBeDefined();
      expect(verbalDescription.statistics.averageCorrelation).toBeDefined();
    });
  });

  describe('Screen Reader and Assistive Technology Support', () => {
    it('should generate appropriate ARIA labels and roles', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const ariaMarkup = engine.generateARIAMarkup({
        chart: {
          type: ChartType.BAR_CHART,
          elements: [
            { type: 'container', id: 'chart-container' },
            { type: 'title', id: 'chart-title', text: 'Sales by Quarter' },
            { type: 'bars', count: 4, values: [100, 150, 120, 180] },
            { type: 'legend', items: ['Q1', 'Q2', 'Q3', 'Q4'] },
          ],
        },
      });

      expect(ariaMarkup.container.role).toBe('img');
      expect(ariaMarkup.container.ariaLabel).toBeDefined();
      expect(ariaMarkup.container.ariaDescribedby).toBeDefined();

      // Should provide structure for screen readers
      expect(ariaMarkup.structure.landmarks).toBeDefined();
      expect(ariaMarkup.structure.headings.length).toBeGreaterThan(0);

      // Should include live regions for dynamic updates
      expect(ariaMarkup.liveRegions.status).toBeDefined();
      expect(ariaMarkup.liveRegions.alert).toBeDefined();

      // Should provide navigation aids
      expect(ariaMarkup.navigation.skipLinks).toBe(true);
      expect(ariaMarkup.navigation.breadcrumbs).toBeDefined();
    });

    it('should support screen reader table navigation patterns', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const tableNavigation = engine.generateTableNavigation({
        chart: {
          type: ChartType.HEATMAP,
          data: {
            rows: ['Product A', 'Product B', 'Product C'],
            columns: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [
              [10, 15, 12, 18],
              [8, 20, 16, 14],
              [12, 11, 19, 22],
            ],
          },
        },
        navigation: {
          rowHeaders: true,
          columnHeaders: true,
          cellNavigation: true,
          summaryStatistics: true,
        },
      });

      expect(tableNavigation.headers.row.length).toBe(3);
      expect(tableNavigation.headers.column.length).toBe(4);
      expect(tableNavigation.scope.row).toBe(true);
      expect(tableNavigation.scope.column).toBe(true);

      // Should provide keyboard shortcuts
      expect(tableNavigation.shortcuts.nextRow).toBeDefined();
      expect(tableNavigation.shortcuts.nextColumn).toBeDefined();
      expect(tableNavigation.shortcuts.firstCell).toBeDefined();
      expect(tableNavigation.shortcuts.lastCell).toBeDefined();

      // Should include summary information
      expect(tableNavigation.summary.rowSummaries.length).toBe(3);
      expect(tableNavigation.summary.columnSummaries.length).toBe(4);
    });

    it('should provide voice control integration', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const voiceControl = engine.generateVoiceControl({
        chart: {
          type: ChartType.SCATTER_PLOT,
          interactions: ['zoom', 'pan', 'select', 'filter'],
        },
        voiceCommands: {
          navigation: ['zoom in', 'zoom out', 'pan left', 'pan right'],
          selection: ['select all', 'clear selection', 'select by category'],
          information: ['describe chart', 'read values', 'summarize'],
        },
      });

      expect(voiceControl.commands.length).toBeGreaterThan(0);
      voiceControl.commands.forEach(command => {
        expect(command.phrase).toBeDefined();
        expect(command.action).toBeDefined();
        expect(command.alternatives.length).toBeGreaterThan(0);
      });

      // Should provide feedback
      expect(voiceControl.feedback.confirmation).toBe(true);
      expect(voiceControl.feedback.errorHandling).toBe(true);

      // Should support different languages
      expect(voiceControl.localization.supported).toBe(true);
      expect(voiceControl.localization.languages.length).toBeGreaterThan(1);
    });

    it('should integrate with switch and eye-tracking devices', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const switchSupport = engine.generateSwitchSupport({
        chart: {
          type: ChartType.LINE_CHART,
          interactiveElements: 20,
        },
        switches: {
          count: 2,
          actions: ['select', 'activate'],
          timing: {
            dwellTime: 1000,
            autoScan: true,
            scanRate: 2000,
          },
        },
      });

      expect(switchSupport.scanPattern.type).toBeOneOf(['linear', 'hierarchical', 'block']);
      expect(switchSupport.scanPattern.groups.length).toBeGreaterThan(0);

      // Should provide timing controls
      expect(switchSupport.timing.dwellTime).toBe(1000);
      expect(switchSupport.timing.adjustable).toBe(true);

      // Should handle switch activation
      expect(switchSupport.activation.single).toBe(true);
      expect(switchSupport.activation.multiple).toBe(true);

      // Should provide visual feedback
      expect(switchSupport.feedback.visual.highlight).toBe(true);
      expect(switchSupport.feedback.audio.enabled).toBe(true);
    });
  });

  describe('Testing and Validation Tools', () => {
    it('should provide automated accessibility testing', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const testResults = engine.runAutomatedTests({
        chart: {
          html: '<div role="img" aria-label="Sales Chart">...</div>',
          type: ChartType.BAR_CHART,
        },
        tests: {
          wcag: 'AA',
          colorContrast: true,
          keyboardAccess: true,
          screenReader: true,
          structure: true,
        },
      });

      expect(testResults.overall.score).toBeGreaterThanOrEqual(0);
      expect(testResults.overall.score).toBeLessThanOrEqual(100);
      expect(testResults.overall.level).toBeOneOf(['A', 'AA', 'AAA', 'Non-compliant']);

      // Should provide detailed test results
      expect(testResults.tests.length).toBeGreaterThan(0);
      testResults.tests.forEach(test => {
        expect(test.id).toBeDefined();
        expect(test.result).toBeOneOf(['pass', 'fail', 'warning', 'not_applicable']);
        expect(test.details).toBeDefined();
      });

      // Should identify priority issues
      expect(testResults.priorityIssues.critical.length).toBeGreaterThanOrEqual(0);
      expect(testResults.priorityIssues.major.length).toBeGreaterThanOrEqual(0);
      expect(testResults.priorityIssues.minor.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate accessibility testing checklist', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const checklist = engine.generateTestingChecklist({
        chartType: ChartType.DASHBOARD_GRID,
        complexity: 'high',
        targetLevel: 'AA',
        assistiveTechnologies: ['screen_reader', 'voice_control', 'switch_access'],
      });

      expect(checklist.sections.length).toBeGreaterThan(0);
      
      // Should include different testing categories
      const categories = checklist.sections.map(s => s.category);
      expect(categories).toContain('structure');
      expect(categories).toContain('color_contrast');
      expect(categories).toContain('keyboard_access');
      expect(categories).toContain('screen_reader');

      // Should provide specific test steps
      checklist.sections.forEach(section => {
        expect(section.tests.length).toBeGreaterThan(0);
        section.tests.forEach(test => {
          expect(test.description).toBeDefined();
          expect(test.expectedOutcome).toBeDefined();
          expect(test.toolsRequired).toBeDefined();
        });
      });

      // Should estimate testing time
      expect(checklist.estimatedTime.total).toBeGreaterThan(0);
      expect(checklist.estimatedTime.bySection).toBeDefined();
    });

    it('should validate against real assistive technology behavior', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const validation = engine.validateWithAssistiveTech({
        chart: {
          markup: '<div role="img" aria-label="Chart">...</div>',
          type: ChartType.SCATTER_PLOT,
        },
        assistiveTech: [
          { type: 'NVDA', version: '2023.1' },
          { type: 'JAWS', version: '2023' },
          { type: 'VoiceOver', version: 'macOS 13' },
        ],
        tests: ['navigation', 'content_reading', 'interaction'],
      });

      expect(validation.results.length).toBe(3); // One per AT

      validation.results.forEach(result => {
        expect(result.assistiveTech.type).toBeOneOf(['NVDA', 'JAWS', 'VoiceOver']);
        expect(result.compatibility.overall).toBeOneOf(['excellent', 'good', 'fair', 'poor']);
        
        // Should test specific behaviors
        expect(result.behaviors.navigation).toBeDefined();
        expect(result.behaviors.contentReading).toBeDefined();
        expect(result.behaviors.interaction).toBeDefined();
      });

      // Should identify AT-specific issues
      if (validation.issues.length > 0) {
        validation.issues.forEach(issue => {
          expect(issue.assistiveTech).toBeDefined();
          expect(issue.impact).toBeOneOf(['blocking', 'major', 'minor']);
          expect(issue.workaround).toBeDefined();
        });
      }
    });

    it('should provide comprehensive accessibility report', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const report = engine.generateAccessibilityReport({
        chart: {
          type: ChartType.LINE_CHART,
          complexity: 'medium',
        },
        assessment: {
          automated: true,
          manual: true,
          userTesting: true,
        },
        format: 'comprehensive',
      });

      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);
      expect(report.summary.wcagLevel).toBeOneOf(['A', 'AA', 'AAA', 'Non-compliant']);

      // Should include all assessment sections
      expect(report.sections.wcagCompliance).toBeDefined();
      expect(report.sections.colorAccessibility).toBeDefined();
      expect(report.sections.keyboardAccess).toBeDefined();
      expect(report.sections.screenReaderSupport).toBeDefined();
      expect(report.sections.alternativeFormats).toBeDefined();

      // Should provide actionable recommendations
      expect(report.recommendations.immediate.length).toBeGreaterThanOrEqual(0);
      expect(report.recommendations.shortTerm.length).toBeGreaterThanOrEqual(0);
      expect(report.recommendations.longTerm.length).toBeGreaterThanOrEqual(0);

      // Should include testing evidence
      expect(report.evidence.automatedTests).toBeDefined();
      if (report.evidence.userTestingResults) {
        expect(report.evidence.userTestingResults.participants).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration and Performance', () => {
    it('should optimize accessibility features for performance', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const optimization = engine.optimizeAccessibilityPerformance({
        chart: {
          type: ChartType.SCATTER_PLOT,
          dataPoints: 10000,
          interactions: ['hover', 'click', 'brush'],
        },
        constraints: {
          maxLoadTime: 2000, // 2 seconds
          targetFPS: 60,
          memoryLimit: '100MB',
        },
      });

      expect(optimization.strategy).toBeDefined();
      expect(optimization.performance.estimatedLoadTime).toBeLessThan(2000);
      expect(optimization.performance.estimatedFPS).toBeGreaterThan(30);

      // Should provide optimized accessibility features
      expect(optimization.features.virtualScrolling).toBeDefined();
      expect(optimization.features.lazyAltText).toBeDefined();
      expect(optimization.features.progressiveDescription).toBeDefined();

      // Should maintain accessibility while optimizing
      expect(optimization.accessibilityMaintained.wcagLevel).toBeOneOf(['A', 'AA', 'AAA']);
      expect(optimization.accessibilityMaintained.score).toBeGreaterThan(0.8);
    });

    it('should integrate accessibility into development workflow', () => {
      const engine = new WCAGAccessibilityEngine();
      
      const integration = engine.generateDevelopmentIntegration({
        framework: 'react',
        buildTools: ['webpack', 'eslint'],
        testingFramework: 'jest',
        cicd: 'github_actions',
      });

      expect(integration.linting.rules.length).toBeGreaterThan(0);
      expect(integration.linting.eslintConfig).toBeDefined();

      // Should provide testing integration
      expect(integration.testing.unitTests).toBeDefined();
      expect(integration.testing.integrationTests).toBeDefined();
      expect(integration.testing.e2eTests).toBeDefined();

      // Should include CI/CD checks
      expect(integration.cicd.automatedTests).toBe(true);
      expect(integration.cicd.accessibilityGate).toBe(true);
      expect(integration.cicd.reportGeneration).toBe(true);

      // Should provide documentation
      expect(integration.documentation.guidelines).toBeDefined();
      expect(integration.documentation.examples).toBeGreaterThan(0);
      expect(integration.documentation.troubleshooting).toBeDefined();
    });
  });
});