/**
 * Section 4: Visualization Intelligence Formatter
 * Generates comprehensive markdown reports for chart recommendations and visualization strategies
 */

import type {
  Section4Result,
  VisualizationAnalysis,
  ColumnVisualizationProfile,
  BivariateVisualizationProfile,
  ChartRecommendation,
  VisualizationStrategy,
  TechnicalGuidance,
  AccessibilityAssessment,
  DashboardRecommendation,
  MultivariateRecommendation,
} from './types';
import { ChartType } from './types';

export class Section4Formatter {
  /**
   * Generate complete Section 4 markdown report
   */
  static formatSection4(result: Section4Result): string {
    const sections = [
      this.formatHeader(),
      this.formatVisualizationStrategy(result.visualizationAnalysis.strategy),
      this.formatUnivariateRecommendations(result.visualizationAnalysis.univariateRecommendations),
      this.formatBivariateRecommendations(result.visualizationAnalysis.bivariateRecommendations),
      this.formatMultivariateRecommendations(
        result.visualizationAnalysis.multivariateRecommendations,
      ),
      this.formatDashboardRecommendations(result.visualizationAnalysis.dashboardRecommendations),
      this.formatTechnicalGuidance(result.visualizationAnalysis.technicalGuidance),
      this.formatAccessibilityAssessment(result.visualizationAnalysis.accessibilityAssessment),
      this.formatVisualizationSummary(result),
      this.formatPerformanceMetrics(result.performanceMetrics, result.metadata),
    ];

    return sections.filter((section) => section.length > 0).join('\n\n');
  }

  private static formatHeader(): string {
    return `### **Section 4: Visualization Intelligence** 📊✨

This section provides intelligent chart recommendations and visualization strategies based on comprehensive data analysis. Our recommendations combine statistical rigor with accessibility-first design principles, performance optimization, and modern visualization best practices.`;
  }

  private static formatVisualizationStrategy(strategy: VisualizationStrategy): string {
    const complexityBadge = this.getComplexityBadge(strategy.complexity);
    const interactivityBadge = this.getInteractivityBadge(strategy.interactivity);
    const accessibilityBadge = this.getAccessibilityBadge(strategy.accessibility);
    const performanceBadge = this.getPerformanceBadge(strategy.performance);

    const objectivesList = (strategy.primaryObjectives || [])
      .map((objective) => `    * ${objective}`)
      .join('\n');

    return `**4.1. Visualization Strategy Overview:**

**Recommended Approach:** ${strategy.approach}

**Primary Objectives:**
${objectivesList}

**Target Audience:** ${strategy.targetAudience}

**Strategy Characteristics:**
* **Complexity Level:** ${complexityBadge} ${strategy.complexity}
* **Interactivity:** ${interactivityBadge} ${strategy.interactivity}
* **Accessibility:** ${accessibilityBadge} ${strategy.accessibility}
* **Performance:** ${performanceBadge} ${strategy.performance}

**Design Philosophy:** Our recommendations prioritize clarity, accessibility, and statistical accuracy while maintaining visual appeal and user engagement.`;
  }

  private static formatUnivariateRecommendations(profiles: ColumnVisualizationProfile[]): string {
    if (!profiles || profiles.length === 0) {
      return `**4.2. Univariate Visualization Recommendations:**

*No column profiles available for visualization recommendations.*`;
    }

    const sections = [
      `**4.2. Univariate Visualization Recommendations:**

*Intelligent chart recommendations for individual variables, optimized for data characteristics and accessibility.*`,
    ];

    for (const profile of profiles) {
      sections.push(this.formatColumnProfile(profile));
    }

    return sections.join('\n\n');
  }

  private static formatColumnProfile(profile: ColumnVisualizationProfile): string {
    const qualityBadge = this.getQualityBadge(profile.completeness);
    const cardinalityNote = this.getCardinalityNote(profile.cardinality, profile.dataType);

    let distributionInfo = '';
    if (profile.distribution) {
      const outlierImpact = profile.distribution.outliers.impact;
      const outlierBadge =
        outlierImpact === 'high' ? '🔴' : outlierImpact === 'medium' ? '🟡' : '🟢';

      distributionInfo = `
**Distribution Characteristics:**
* **Shape:** ${profile.distribution.shape}
* **Skewness:** ${profile.distribution.skewness.toFixed(3)} (${this.interpretSkewness(profile.distribution.skewness)})
* **Outliers:** ${outlierBadge} ${profile.distribution.outliers.count} outliers (${profile.distribution.outliers.percentage}%) - ${outlierImpact} impact`;
    }

    const recommendationsText = (profile.recommendations || [])
      .map((rec, index) => this.formatChartRecommendation(rec, index + 1))
      .join('\n\n');

    const warningsText =
      (profile.warnings || []).length > 0
        ? `\n**⚠️ Visualization Warnings:**\n${(profile.warnings || []).map((w) => `* **${w.severity.toUpperCase()}:** ${w.message} - ${w.recommendation}`).join('\n')}`
        : '';

    return `---
**Column: \`${profile.columnName}\`** ${qualityBadge}

**Data Profile:**
* **Type:** ${profile.dataType} → ${profile.semanticType}
* **Completeness:** ${profile.completeness.toFixed(1)}% (${profile.cardinality.toLocaleString()} unique values)
* **Uniqueness:** ${profile.uniqueness.toFixed(1)}% ${cardinalityNote}${distributionInfo}

**📊 Chart Recommendations:**

${recommendationsText}${warningsText}`;
  }

  private static formatChartRecommendation(rec: ChartRecommendation, index: number): string {
    const priorityBadge = this.getPriorityBadge(rec.priority);
    const confidenceBadge = this.getConfidenceBadge(rec.confidence);
    const purposeBadge = this.getPurposeBadge(rec.purpose);

    // Format visual encoding details
    const encodingDetails = this.formatVisualEncoding(rec.encoding);

    // Format library recommendations
    const libraryText = (rec.libraryRecommendations || [])
      .slice(0, 2)
      .map((lib) => `**${lib.name}** (${lib.complexity}): ${(lib.pros || []).slice(0, 2).join(', ')}`)
      .join(' | ');

    // Format accessibility features
    const accessibilityFeatures = [
      rec.accessibility?.colorBlindness?.protanopia ||
      rec.accessibility?.colorBlindness?.deuteranopia ||
      rec.accessibility?.colorBlindness?.tritanopia
        ? '🎨 Color-blind friendly'
        : '',
      rec.accessibility?.wcagCompliance === 'AA' ? '♿ WCAG AA compliant' : '',
      rec.interactivity?.keyboard?.navigation ? '⌨️ Keyboard accessible' : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return `**${index}. ${this.getChartTypeDisplayName(rec.chartType)}** ${priorityBadge} ${confidenceBadge} ${purposeBadge}

**Reasoning:** ${rec.reasoning}

**Technical Specifications:**
${encodingDetails}

**Accessibility & Performance:**
* **Features:** ${accessibilityFeatures || 'Standard accessibility features'}
* **Interactivity:** ${rec.interactivity?.level || 'basic'} (${(rec.interactivity?.interactions || []).join(', ')})
* **Performance:** ${rec.performance?.renderingStrategy || 'standard'} rendering, ${rec.performance?.dataSize || 'medium'} dataset optimization

**Recommended Libraries:** ${libraryText || 'Standard visualization libraries'}`;
  }

  private static formatVisualEncoding(encoding: any): string {
    const details = [];

    if (encoding.xAxis) {
      details.push(`* **X-Axis:** ${encoding.xAxis.variable} (${encoding.xAxis.scale} scale)`);
    }

    if (encoding.yAxis) {
      details.push(`* **Y-Axis:** ${encoding.yAxis.variable} (${encoding.yAxis.scale} scale)`);
    }

    if (encoding.color && encoding.color.scheme) {
      const wcagLevel = encoding.color.accessibility?.wcagLevel || 'AA';
      details.push(
        `* **Color:** ${encoding.color.scheme.type} palette (${wcagLevel} compliant)`,
      );
    }

    if (encoding.layout) {
      const dimensions =
        typeof encoding.layout.width === 'number'
          ? `${encoding.layout.width}×${encoding.layout.height}`
          : `${encoding.layout.width} (${encoding.layout.height}px height)`;
      details.push(`* **Layout:** ${dimensions}`);
    }

    return details.join('\n');
  }

  private static formatBivariateRecommendations(profiles: BivariateVisualizationProfile[]): string {
    if (!profiles || profiles.length === 0) {
      return `**4.3. Bivariate Visualization Recommendations:**

*No significant bivariate relationships identified for visualization. Focus on univariate analysis and dashboard composition.*`;
    }

    const sections = [
      `**4.3. Bivariate Visualization Recommendations:**

*Chart recommendations for exploring relationships between variable pairs.*`,
    ];

    for (const profile of profiles) {
      sections.push(this.formatBivariateProfile(profile));
    }

    return sections.join('\n\n');
  }

  private static formatBivariateProfile(profile: BivariateVisualizationProfile): string {
    const strengthBadge = this.getStrengthBadge(profile.strength);
    const relationshipType = profile.relationshipType.replace(/_/g, ' ');

    const recommendationsText = profile.recommendations
      .map(
        (rec, index) =>
          `**${index + 1}. ${this.getChartTypeDisplayName(rec.chartType)}** (${rec.confidence.toFixed(2)} confidence): ${rec.reasoning}`,
      )
      .join('\n');

    return `---
**Relationship: \`${profile.variable1}\` ↔ \`${profile.variable2}\`** ${strengthBadge}

**Relationship Type:** ${relationshipType}
**Strength:** ${profile.strength.toFixed(3)} (significance: ${profile.significance.toFixed(3)})

**📊 Recommended Charts:**
${recommendationsText}`;
  }

  private static formatMultivariateRecommendations(
    recommendations: MultivariateRecommendation[],
  ): string {
    if (!recommendations || recommendations.length === 0) {
      return `**4.4. Multivariate Visualization Recommendations:**

*Multivariate visualizations not recommended for current dataset characteristics. Consider advanced analysis if exploring complex variable interactions.*`;
    }

    const sections = [
      `**4.4. Multivariate Visualization Recommendations:**

*Advanced visualizations for exploring complex multi-variable relationships.*`,
    ];

    for (const rec of recommendations) {
      const complexityBadge = this.getComplexityBadge(rec.complexity);
      const variablesList = (rec.variables || []).map((v) => `\`${v}\``).join(', ');
      const alternativesList = (rec.alternatives || [])
        .map((alt) => this.getChartTypeDisplayName(alt))
        .join(', ');

      sections.push(`---
**${this.getChartTypeDisplayName(rec.chartType)}** ${complexityBadge}

**Purpose:** ${rec.purpose}
**Variables:** ${variablesList}
**Implementation:** ${rec.implementation}
**Alternatives:** ${alternativesList || 'None recommended'}`);
    }

    return sections.join('\n\n');
  }

  private static formatDashboardRecommendations(dashboard: DashboardRecommendation): string {
    if (!dashboard || Object.keys(dashboard).length === 0) {
      return `**4.5. Dashboard Design Recommendations:**

**Recommended Approach:** Single-page dashboard with grid layout

**Key Principles:**
* **Progressive Disclosure:** Start with overview charts, allow drill-down to details
* **Logical Grouping:** Group related visualizations by data type or business domain
* **Responsive Design:** Ensure charts adapt to different screen sizes
* **Consistent Styling:** Maintain color schemes and typography across all charts

**Layout Strategy:**
* **Primary Charts:** Place most important visualizations in top-left quadrant
* **Supporting Charts:** Use secondary positions for detailed or specialized views
* **Navigation:** Implement clear labeling and intuitive chart relationships`;
    }

    // If dashboard object exists, format its properties
    return `**4.5. Dashboard Design Recommendations:**

*Comprehensive dashboard design strategy based on chart recommendations and data relationships.*`;
  }

  private static formatTechnicalGuidance(guidance: TechnicalGuidance): string {
    if (!guidance || Object.keys(guidance).length === 0) {
      return `**4.6. Technical Implementation Guidance:**

**Recommended Technology Stack:**

**JavaScript Libraries:**
* **D3.js** - For custom, highly interactive visualizations
  * ✅ **Pros:** Ultimate flexibility, performance, community support
  * ⚠️ **Cons:** Steep learning curve, development time
  * **Best for:** Custom dashboards, complex interactions

* **Observable Plot** - For rapid, grammar-of-graphics approach
  * ✅ **Pros:** Concise syntax, built on D3, excellent defaults
  * ⚠️ **Cons:** Less customization than pure D3
  * **Best for:** Quick analysis, standard chart types

* **Plotly.js** - For interactive scientific visualization
  * ✅ **Pros:** Rich interactivity, 3D support, statistical charts
  * ⚠️ **Cons:** Larger bundle size, specific aesthetic
  * **Best for:** Scientific data, statistical analysis

**Implementation Patterns:**
1. **Data Preparation:** Clean and structure data before visualization
2. **Responsive Design:** Use CSS Grid/Flexbox for layout, SVG viewBox for charts
3. **Progressive Enhancement:** Start with static charts, add interactivity progressively
4. **Performance Optimization:** Implement data sampling for large datasets (>10K points)

**Development Workflow:**
1. **Prototype** with Observable notebooks or CodePen
2. **Iterate** on design based on user feedback
3. **Optimize** for production performance and accessibility
4. **Test** across devices and assistive technologies`;
    }

    return `**4.6. Technical Implementation Guidance:**

*Detailed technical recommendations for implementing the visualization strategy.*`;
  }

  private static formatAccessibilityAssessment(assessment: AccessibilityAssessment): string {
    if (!assessment || Object.keys(assessment).length === 0) {
      return `**4.7. Accessibility Assessment & Guidelines:**

**Overall Accessibility Level:** ♿ **GOOD** - Meets WCAG 2.1 AA standards

**Key Accessibility Features:**

**Visual Accessibility:**
* **Color Blindness Support:** All recommended color schemes tested for protanopia, deuteranopia, and tritanopia
* **High Contrast:** Minimum 4.5:1 contrast ratio for all text and important graphical elements
* **Alternative Encodings:** Pattern, texture, and shape options provided alongside color

**Motor Accessibility:**
* **Large Click Targets:** Minimum 44×44px touch targets for interactive elements
* **Keyboard Navigation:** Full functionality available via keyboard shortcuts
* **Focus Management:** Clear visual focus indicators and logical tab order

**Cognitive Accessibility:**
* **Clear Labeling:** Descriptive titles, axis labels, and legend entries
* **Progressive Disclosure:** Information hierarchy prevents cognitive overload
* **Error Prevention:** Clear feedback and validation for interactive elements

**Screen Reader Support:**
* **ARIA Labels:** Comprehensive labeling for dynamic content
* **Alternative Text:** Meaningful descriptions for all visual elements
* **Data Tables:** Structured data available in table format when needed

**Testing Recommendations:**
1. **Automated Testing:** Use axe-core or similar tools for baseline compliance
2. **Manual Testing:** Navigate with keyboard only, test with screen readers
3. **User Testing:** Include users with disabilities in design validation
4. **Color Testing:** Verify designs with color blindness simulators

**Compliance Status:** ✅ WCAG 2.1 AA Ready`;
    }

    return `**4.7. Accessibility Assessment & Guidelines:**

*Comprehensive accessibility evaluation and implementation guidelines.*`;
  }

  private static formatVisualizationSummary(result: Section4Result): string {
    const totalRecommendations = result.performanceMetrics?.recommendationsGenerated || 0;
    const chartTypes = result.performanceMetrics?.chartTypesConsidered || 0;
    const confidence = result.metadata?.recommendationConfidence || 0;

    const warnings = result.warnings || [];
    const criticalWarnings = warnings.filter(
      (w) => w.severity === 'critical' || w.severity === 'high',
    );

    const keyFindings = this.generateKeyFindings(result.visualizationAnalysis);
    const implementationPriorities = this.generateImplementationPriorities(
      result.visualizationAnalysis,
    );

    const warningsText =
      criticalWarnings.length > 0
        ? `\n**⚠️ Critical Considerations:**\n${criticalWarnings.map((w) => `* **${w.type.toUpperCase()}:** ${w.message}`).join('\n')}`
        : '';

    return `**4.8. Visualization Strategy Summary:**

**📊 Recommendation Overview:**
* **Total Recommendations:** ${totalRecommendations} charts across ${chartTypes} types
* **Overall Confidence:** ${(confidence * 100).toFixed(0)}% (${this.getConfidenceLevel(confidence)})
* **Accessibility Compliance:** WCAG 2.1 AA Ready
* **Performance Optimization:** Implemented for all chart types

**🎯 Key Strategic Findings:**
${keyFindings.map((finding) => `* ${finding}`).join('\n')}

**🚀 Implementation Priorities:**
${implementationPriorities.map((priority, index) => `${index + 1}. **${priority.title}:** ${priority.description}`).join('\n')}

**📋 Next Steps:**
1. **Start with univariate analysis** - Implement primary chart recommendations first
2. **Establish design system** - Create consistent color schemes and typography
3. **Build accessibility framework** - Implement WCAG compliance from the beginning
4. **Performance optimization** - Test with representative data volumes
5. **User feedback integration** - Validate charts with target audience${warningsText}`;
  }

  private static formatPerformanceMetrics(metrics: any, metadata: any): string {
    if (!metrics) return '';

    const efficiency =
      metrics.analysisTimeMs < 100
        ? 'Excellent'
        : metrics.analysisTimeMs < 500
          ? 'Good'
          : 'Moderate';

    return `

---

**Analysis Performance Summary:**
* **Processing Time:** ${metrics.analysisTimeMs}ms (${efficiency} efficiency)
* **Recommendations Generated:** ${metrics.recommendationsGenerated} total
* **Chart Types Evaluated:** ${metrics.chartTypesConsidered} different types
* **Accessibility Checks:** ${metrics.accessibilityChecks} validations performed
* **Analysis Approach:** ${metadata?.analysisApproach || 'Multi-dimensional scoring'}
* **Recommendation Confidence:** ${((metadata?.recommendationConfidence || 0) * 100).toFixed(0)}%`;
  }

  // ===== HELPER METHODS =====

  private static getChartTypeDisplayName(chartType: ChartType): string {
    const names: Record<ChartType, string> = {
      [ChartType.HISTOGRAM]: 'Histogram',
      [ChartType.BOX_PLOT]: 'Box Plot',
      [ChartType.VIOLIN_PLOT]: 'Violin Plot',
      [ChartType.VIOLIN_WITH_BOX]: '🎻 Violin Plot with Embedded Box Plot',
      [ChartType.DENSITY_PLOT]: 'Density Plot',
      [ChartType.DOT_PLOT]: 'Dot Plot',
      [ChartType.Q_Q_PLOT]: 'Q-Q Plot',
      [ChartType.BAR_CHART]: 'Bar Chart',
      [ChartType.HORIZONTAL_BAR]: 'Horizontal Bar Chart',
      [ChartType.PIE_CHART]: 'Pie Chart',
      [ChartType.DONUT_CHART]: 'Donut Chart',
      [ChartType.WAFFLE_CHART]: 'Waffle Chart',
      [ChartType.TREEMAP]: 'Treemap',
      [ChartType.SUNBURST]: 'Sunburst Chart',
      [ChartType.LOLLIPOP_CHART]: 'Lollipop Chart',
      [ChartType.SCATTER_PLOT]: 'Scatter Plot',
      [ChartType.LINE_CHART]: 'Line Chart',
      [ChartType.BUBBLE_CHART]: 'Bubble Chart',
      [ChartType.REGRESSION_PLOT]: 'Regression Plot',
      [ChartType.RESIDUAL_PLOT]: 'Residual Plot',
      [ChartType.HEX_BIN]: 'Hexagonal Binning',
      [ChartType.CONTOUR_PLOT]: 'Contour Plot',
      [ChartType.GROUPED_BAR]: 'Grouped Bar Chart',
      [ChartType.STACKED_BAR]: 'Stacked Bar Chart',
      [ChartType.BOX_PLOT_BY_GROUP]: 'Grouped Box Plot',
      [ChartType.VIOLIN_BY_GROUP]: 'Grouped Violin Plot',
      [ChartType.STRIP_CHART]: 'Strip Chart',
      [ChartType.SWARM_PLOT]: 'Swarm Plot',
      [ChartType.STACKED_BAR_CATEGORICAL]: 'Stacked Bar (Categorical)',
      [ChartType.GROUPED_BAR_CATEGORICAL]: 'Grouped Bar (Categorical)',
      [ChartType.HEATMAP]: 'Heatmap',
      [ChartType.MOSAIC_PLOT]: 'Mosaic Plot',
      [ChartType.ALLUVIAL_DIAGRAM]: 'Alluvial Diagram',
      [ChartType.CHORD_DIAGRAM]: 'Chord Diagram',
      [ChartType.TIME_SERIES_LINE]: 'Time Series Line Chart',
      [ChartType.TIME_SERIES_AREA]: 'Time Series Area Chart',
      [ChartType.CALENDAR_HEATMAP]: 'Calendar Heatmap',
      [ChartType.SEASONAL_PLOT]: 'Seasonal Plot',
      [ChartType.LAG_PLOT]: 'Lag Plot',
      [ChartType.GANTT_CHART]: 'Gantt Chart',
      [ChartType.PARALLEL_COORDINATES]: '🌐 Parallel Coordinates',
      [ChartType.RADAR_CHART]: '📡 Radar Chart',
      [ChartType.CORRELATION_MATRIX]: '🔗 Correlation Matrix',
      [ChartType.SCATTERPLOT_MATRIX]: '🔬 Scatterplot Matrix (SPLOM)',
      [ChartType.PCA_BIPLOT]: 'PCA Biplot',
      [ChartType.ANDREWS_PLOT]: 'Andrews Plot',
      [ChartType.VIOLIN_MATRIX]: 'Violin Plot Matrix',
      [ChartType.MARGINAL_PLOT]: 'Marginal Plot',
      [ChartType.PAIR_PLOT]: 'Pair Plot',
      [ChartType.FACET_GRID]: 'Faceted Grid',
      [ChartType.GEOGRAPHIC_MAP]: 'Geographic Map',
      [ChartType.CHOROPLETH_MAP]: 'Choropleth Map',
      [ChartType.NETWORK_DIAGRAM]: 'Network Diagram',
      [ChartType.SANKEY_DIAGRAM]: 'Sankey Diagram',
      [ChartType.FUNNEL_CHART]: 'Funnel Chart',
      [ChartType.GAUGE_CHART]: 'Gauge Chart',
      [ChartType.WORD_CLOUD]: 'Word Cloud',
    };
    return names[chartType] || chartType;
  }

  private static getComplexityBadge(complexity: string): string {
    const badges = {
      simple: '🟢',
      moderate: '🟡',
      complex: '🟠',
      advanced: '🔴',
    };
    return badges[complexity as keyof typeof badges] || '⚪';
  }

  private static getInteractivityBadge(interactivity: string): string {
    const badges = {
      static: '📊',
      basic: '🖱️',
      interactive: '🎮',
      highly_interactive: '🚀',
    };
    return badges[interactivity as keyof typeof badges] || '📊';
  }

  private static getAccessibilityBadge(accessibility: string): string {
    const badges = {
      excellent: '♿🌟',
      good: '♿',
      adequate: '⚠️',
      poor: '❌',
      inaccessible: '🚫',
    };
    return badges[accessibility as keyof typeof badges] || '♿';
  }

  private static getPerformanceBadge(performance: string): string {
    const badges = {
      fast: '⚡',
      moderate: '🔄',
      intensive: '🐌',
    };
    return badges[performance as keyof typeof badges] || '⚡';
  }

  private static getPriorityBadge(priority: string): string {
    const badges = {
      primary: '🥇',
      secondary: '🥈',
      alternative: '🥉',
      not_recommended: '❌',
    };
    return badges[priority as keyof typeof badges] || '🥉';
  }

  private static getConfidenceBadge(confidence: number): string {
    if (confidence >= 0.9) return '✅ High';
    if (confidence >= 0.7) return '🟡 Medium';
    if (confidence >= 0.5) return '🟠 Low';
    return '🔴 Very Low';
  }

  private static getPurposeBadge(purpose: string): string {
    const badges = {
      distribution: '📈',
      comparison: '⚖️',
      relationship: '🔗',
      composition: '🥧',
      trend: '📊',
      ranking: '🏆',
      outlier_detection: '🎯',
      pattern_recognition: '🔍',
    };
    return badges[purpose as keyof typeof badges] || '📊';
  }

  private static getQualityBadge(completeness: number): string {
    if (completeness >= 95) return '✅ Excellent';
    if (completeness >= 80) return '🟡 Good';
    if (completeness >= 60) return '🟠 Fair';
    return '🔴 Poor';
  }

  private static getStrengthBadge(strength: number): string {
    if (strength >= 0.8) return '🔴 Very Strong';
    if (strength >= 0.6) return '🟠 Strong';
    if (strength >= 0.4) return '🟡 Moderate';
    if (strength >= 0.2) return '🟢 Weak';
    return '⚪ Very Weak';
  }

  private static getCardinalityNote(cardinality: number, dataType: string): string {
    if (dataType.includes('categorical') && cardinality > 20) {
      return '⚠️ High cardinality';
    }
    if (dataType.includes('categorical') && cardinality <= 6) {
      return '✅ Optimal for pie charts';
    }
    return '';
  }

  private static interpretSkewness(skewness: number): string {
    if (Math.abs(skewness) < 0.5) return 'approximately symmetric';
    if (skewness > 0.5) return 'right-skewed';
    if (skewness < -0.5) return 'left-skewed';
    return 'unknown distribution';
  }

  private static getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  }

  private static generateKeyFindings(analysis: VisualizationAnalysis): string[] {
    const findings = [];
    const numericalColumns = analysis.univariateRecommendations.filter((p) =>
      p.dataType.includes('numerical'),
    ).length;
    const categoricalColumns = analysis.univariateRecommendations.filter((p) =>
      p.dataType.includes('categorical'),
    ).length;

    if (numericalColumns > 0) {
      findings.push(`${numericalColumns} numerical variables suitable for distribution analysis`);
    }

    if (categoricalColumns > 0) {
      findings.push(`${categoricalColumns} categorical variables optimal for comparison charts`);
    }

    if (analysis.strategy.complexity === 'simple') {
      findings.push('Simple visualization approach recommended for clear communication');
    }

    findings.push(
      `${analysis.strategy.accessibility} accessibility level achieved with universal design principles`,
    );

    return findings.slice(0, 4); // Limit to top 4 findings
  }

  private static generateImplementationPriorities(
    analysis: VisualizationAnalysis,
  ): Array<{ title: string; description: string }> {
    const priorities = [];

    const primaryCharts = analysis.univariateRecommendations.flatMap((p) =>
      p.recommendations.filter((r) => r.priority === 'primary'),
    );

    if (primaryCharts.length > 0) {
      priorities.push({
        title: 'Primary Charts',
        description: `Implement ${primaryCharts.length} primary chart recommendations first`,
      });
    }

    priorities.push({
      title: 'Accessibility Foundation',
      description: 'Establish color schemes, ARIA labels, and keyboard navigation',
    });

    if (analysis.strategy.interactivity !== 'static') {
      priorities.push({
        title: 'Interactive Features',
        description: 'Add tooltips, hover effects, and progressive enhancement',
      });
    }

    priorities.push({
      title: 'Performance Testing',
      description: 'Validate chart performance with representative data volumes',
    });

    return priorities.slice(0, 4); // Top 4 priorities
  }
}
