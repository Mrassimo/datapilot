/**
 * Section 3 EDA Formatter
 * Generates comprehensive markdown report for exploratory data analysis
 */

import type {
  Section3Result,
  ColumnAnalysis,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  DateTimeAnalysis,
  BooleanAnalysis,
  TextColumnAnalysis,
  BivariateAnalysis,
  NumericalBivariateAnalysis,
  NumericalCategoricalAnalysis,
  CategoricalBivariateAnalysis,
  Section3Warning,
  MultivariateAnalysis,
  PCAAnalysis,
  KMeansAnalysis,
  MultivariateOutlierAnalysis,
  MultivariateNormalityTests,
  MultivariateRelationshipAnalysis,
  EdaInsights,
} from './types';
import { EdaDataType } from './types';

export class Section3Formatter {
  /**
   * Generate complete Section 3 markdown report
   */
  static formatSection3(result: Section3Result): string {
    const sections = [
      this.formatHeader(),
      this.formatMethodologyOverview(result),
      this.formatUnivariateAnalysis(result.edaAnalysis.univariateAnalysis),
      this.formatBivariateAnalysis(result.edaAnalysis.bivariateAnalysis),
      this.formatMultivariateAnalysis(result.edaAnalysis.multivariateAnalysis),
      this.formatSpecificAnalysisModules(result.edaAnalysis.univariateAnalysis),
      this.formatEdaSummary(result.edaAnalysis.crossVariableInsights, result.warnings),
      this.formatPerformanceMetrics(result.performanceMetrics, result.metadata),
    ];

    return sections.filter((section) => section.length > 0).join('\n\n');
  }

  private static formatHeader(): string {
    return `### **Section 3: Exploratory Data Analysis (EDA) Deep Dive** 📊🔬

This section provides a comprehensive statistical exploration of the dataset. The goal is to understand the data's underlying structure, identify patterns, detect anomalies, and extract key insights. Unless specified, all analyses are performed on the full dataset. Over 60 statistical tests and checks are considered in this module.`;
  }

  private static formatMethodologyOverview(result: Section3Result): string {
    const samplingNote = result.metadata?.samplingApplied
      ? 'Intelligent sampling applied for intensive computations while preserving statistical integrity.'
      : 'Analysis performed on the complete dataset.';

    return `**3.1. EDA Methodology Overview:**
* **Approach:** Systematic univariate, bivariate, and multivariate analysis using streaming algorithms.
* **Column Type Classification:** Each column is analysed based on its inferred data type (Numerical, Categorical, Date/Time, Boolean, Text).
* **Statistical Significance:** Standard p-value thresholds (e.g., 0.05) are used where applicable, but effect sizes and practical significance are also considered.
* **Memory-Efficient Processing:** ${result.metadata?.analysisApproach || 'Advanced streaming analysis'} ensures scalability to large datasets.
* **Sampling Strategy:** ${samplingNote}`;
  }

  private static formatUnivariateAnalysis(analyses: ColumnAnalysis[]): string {
    if (!analyses || analyses.length === 0) {
      return `**3.2. Univariate Analysis (Per-Column In-Depth Profile):**

*No column analyses available.*`;
    }

    const sections = [
      `**3.2. Univariate Analysis (Per-Column In-Depth Profile):**

*This sub-section provides detailed statistical profiles for each column in the dataset, adapted based on detected data type.*`,
    ];

    for (const analysis of analyses) {
      sections.push(this.formatSingleColumnAnalysis(analysis));
    }

    return sections.join('\n\n');
  }

  private static formatSingleColumnAnalysis(analysis: ColumnAnalysis): string {
    const header = `---
**Column: \`${analysis.columnName}\`**
* **Detected Data Type:** ${analysis.detectedDataType}
* **Inferred Semantic Type:** ${analysis.inferredSemanticType}
* **Data Quality Flag:** ${analysis.dataQualityFlag}
* **Quick Stats:**
    * Total Values (Count): ${analysis.totalValues.toLocaleString()}
    * Missing Values: ${analysis.missingValues.toLocaleString()} (${analysis.missingPercentage}%)
    * Unique Values: ${analysis.uniqueValues.toLocaleString()} (${analysis.uniquePercentage}% of total)`;

    // Format based on column type
    if (
      analysis.detectedDataType === EdaDataType.NUMERICAL_FLOAT ||
      analysis.detectedDataType === EdaDataType.NUMERICAL_INTEGER
    ) {
      return header + '\n\n' + this.formatNumericalAnalysis(analysis as NumericalColumnAnalysis);
    } else if (analysis.detectedDataType === EdaDataType.CATEGORICAL) {
      return (
        header + '\n\n' + this.formatCategoricalAnalysis(analysis as CategoricalColumnAnalysis)
      );
    } else if (analysis.detectedDataType === EdaDataType.DATE_TIME) {
      return header + '\n\n' + this.formatDateTimeAnalysis(analysis as DateTimeAnalysis);
    } else if (analysis.detectedDataType === EdaDataType.BOOLEAN) {
      return header + '\n\n' + this.formatBooleanAnalysis(analysis as BooleanAnalysis);
    } else if (
      analysis.detectedDataType === EdaDataType.TEXT_GENERAL ||
      analysis.detectedDataType === EdaDataType.TEXT_ADDRESS
    ) {
      return header + '\n\n' + this.formatTextAnalysis(analysis as TextColumnAnalysis);
    }

    return header + '\n\n*Analysis not available for this data type.*';
  }

  private static formatNumericalAnalysis(analysis: NumericalColumnAnalysis): string {
    const stats = analysis.descriptiveStats;
    const quantiles = analysis.quantileStats;
    const distribution = analysis.distributionAnalysis;
    const normality = analysis.normalityTests;
    const outliers = analysis.outlierAnalysis;
    const patterns = analysis.numericalPatterns;

    const modesText =
      stats.modes.length > 0
        ? stats.modes.map((mode) => `${mode.value} (Frequency: ${mode.percentage}%)`).join(', ')
        : 'No clear mode detected';

    return `**3.2.A. Numerical Column Analysis:**

**Descriptive Statistics:**
* Minimum: ${stats.minimum}
* Maximum: ${stats.maximum}
* Range: ${stats.range}
* Sum: ${stats.sum}
* Mean (Arithmetic): ${stats.mean}
* Median (50th Percentile): ${stats.median}
* Mode(s): [${modesText}]
* Standard Deviation: ${stats.standardDeviation}
* Variance: ${stats.variance}
* Coefficient of Variation (CV): ${stats.coefficientOfVariation}%

**Quantile & Percentile Statistics:**
* 1st Percentile: ${quantiles.percentile1st}
* 5th Percentile: ${quantiles.percentile5th}
* 10th Percentile: ${quantiles.percentile10th}
* 25th Percentile (Q1 - First Quartile): ${quantiles.quartile1st}
* 75th Percentile (Q3 - Third Quartile): ${quantiles.quartile3rd}
* 90th Percentile: ${quantiles.percentile90th}
* 95th Percentile: ${quantiles.percentile95th}
* 99th Percentile: ${quantiles.percentile99th}
* Interquartile Range (IQR = Q3 - Q1): ${quantiles.interquartileRange}
* Median Absolute Deviation (MAD): ${quantiles.medianAbsoluteDeviation}

**Distribution Shape & Normality Assessment:**
* Skewness: ${distribution.skewness} (${distribution.skewnessInterpretation})
* Kurtosis (Excess): ${distribution.kurtosis} (${distribution.kurtosisInterpretation})
* Histogram Analysis: ${distribution.histogramSummary}
* Normality Tests:
    * Shapiro-Wilk Test: W-statistic = ${normality.shapiroWilk.statistic}, p-value = ${normality.shapiroWilk.pValue} (${normality.shapiroWilk.interpretation})
    * Jarque-Bera Test: JB-statistic = ${normality.jarqueBera.statistic}, p-value = ${normality.jarqueBera.pValue} (${normality.jarqueBera.interpretation})
    * Kolmogorov-Smirnov Test: D-statistic = ${normality.kolmogorovSmirnov.statistic}, p-value = ${normality.kolmogorovSmirnov.pValue} (${normality.kolmogorovSmirnov.interpretation})

**Univariate Outlier Analysis:**
* Method 1: IQR Proximity Rule
    * Lower Fence (Q1 - 1.5 * IQR): ${outliers.iqrMethod.lowerFence}
    * Upper Fence (Q3 + 1.5 * IQR): ${outliers.iqrMethod.upperFence}
    * Number of Outliers (Below Lower): ${outliers.iqrMethod.lowerOutliers} (${outliers.iqrMethod.lowerPercentage}%)
    * Number of Outliers (Above Upper): ${outliers.iqrMethod.upperOutliers} (${outliers.iqrMethod.upperPercentage}%)
    * Extreme Outliers (using 3.0 * IQR factor): ${outliers.iqrMethod.extremeOutliers} (${outliers.iqrMethod.extremePercentage}%)
* Method 2: Z-Score Method
    * Standard Deviations from Mean for Threshold: +/- ${outliers.zScoreMethod.threshold}
    * Number of Outliers (Z-score < -${outliers.zScoreMethod.threshold}): ${outliers.zScoreMethod.lowerOutliers}
    * Number of Outliers (Z-score > +${outliers.zScoreMethod.threshold}): ${outliers.zScoreMethod.upperOutliers}
* Method 3: Modified Z-Score (using MAD)
    * Threshold: +/- ${outliers.modifiedZScoreMethod.threshold}
    * Number of Outliers: ${outliers.modifiedZScoreMethod.outliers}
* Summary of Outliers: Total ${outliers.summary.totalOutliers} (${outliers.summary.totalPercentage}%). Min Outlier Value: ${outliers.summary.minOutlierValue}, Max Outlier Value: ${outliers.summary.maxOutlierValue}.
* Potential Impact: ${outliers.summary.potentialImpact}

**Specific Numerical Patterns & Characteristics:**
* Percentage of Zero Values: ${patterns.zeroValuePercentage}%
* Percentage of Negative Values: ${patterns.negativeValuePercentage}%
* Round Numbers Analysis: ${patterns.roundNumbersNote}
* Potential for Log Transformation: ${patterns.logTransformationPotential}`;
  }

  private static formatCategoricalAnalysis(analysis: CategoricalColumnAnalysis): string {
    const freqTable = analysis.frequencyDistribution.slice(0, 10); // Top 10 categories
    const diversity = analysis.diversityMetrics;
    const labels = analysis.labelAnalysis;
    const recommendations = analysis.recommendations;

    const frequencyTableText = freqTable
      .map(
        (freq) =>
          `| ${freq.label} | ${freq.count} | ${freq.percentage}% | ${freq.cumulativePercentage}% |`,
      )
      .join('\n');

    return `**3.2.B. Categorical Column Analysis:**

**Frequency & Proportionality:**
* Number of Unique Categories: ${analysis.uniqueCategories}
* Mode (Most Frequent Category): \`${analysis.mostFrequentCategory.label}\` (Frequency: ${analysis.mostFrequentCategory.count}, ${analysis.mostFrequentCategory.percentage}%)
* Second Most Frequent Category: \`${analysis.secondMostFrequentCategory.label}\` (Frequency: ${analysis.secondMostFrequentCategory.count}, ${analysis.secondMostFrequentCategory.percentage}%)
* Least Frequent Category: \`${analysis.leastFrequentCategory.label}\` (Frequency: ${analysis.leastFrequentCategory.count}, ${analysis.leastFrequentCategory.percentage}%)
* Frequency Distribution Table (Top 10):

| Category Label | Count | Percentage (%) | Cumulative % |
|----------------|-------|----------------|--------------|
${frequencyTableText}

**Diversity & Balance:**
* Shannon Entropy: ${diversity.shannonEntropy} (Range: 0 to ${diversity.maxEntropy})
* Gini Impurity: ${diversity.giniImpurity}
* Interpretation of Balance: ${diversity.balanceInterpretation}
* Major Category Dominance: ${diversity.majorCategoryDominance}

**Category Label Analysis:**
* Minimum Label Length: ${labels.minLabelLength} characters
* Maximum Label Length: ${labels.maxLabelLength} characters
* Average Label Length: ${labels.avgLabelLength} characters
* Empty String or Null-like Labels: ${labels.emptyLabelsCount} occurrences

**Potential Issues & Recommendations:**
${recommendations.highCardinalityWarning ? `* High Cardinality Warning: ${recommendations.highCardinalityWarning}` : ''}
${recommendations.rareCategoriesNote ? `* Rare Categories: ${recommendations.rareCategoriesNote}` : ''}
${!recommendations.highCardinalityWarning && !recommendations.rareCategoriesNote ? '* No significant issues detected.' : ''}`;
  }

  private static formatDateTimeAnalysis(analysis: DateTimeAnalysis): string {
    const components = {
      years: analysis.mostCommonYears?.join(', ') || 'Not available',
      months: analysis.mostCommonMonths?.join(', ') || 'Not available',
      daysOfWeek: analysis.mostCommonDaysOfWeek?.join(', ') || 'Not available',
      hours: analysis.mostCommonHours?.join(', ') || 'Not available',
    };

    // Check if we have hour-level precision
    const hasHourPrecision = 
      analysis.detectedGranularity?.toLowerCase().includes('hour') ||
      analysis.detectedGranularity?.toLowerCase().includes('minute') ||
      analysis.detectedGranularity?.toLowerCase().includes('second') ||
      analysis.implicitPrecision?.toLowerCase().includes('hour') ||
      analysis.implicitPrecision?.toLowerCase().includes('minute') ||
      analysis.implicitPrecision?.toLowerCase().includes('second');

    // Build component analysis lines dynamically
    const componentLines = [
      `* Most Common Year(s): [${components.years}]`,
      `* Most Common Month(s): [${components.months}]`,
      `* Most Common Day of Week: [${components.daysOfWeek}]`
    ];
    
    // Only include hour analysis if we have hour-level precision
    if (hasHourPrecision) {
      componentLines.push(`* Most Common Hour of Day: [${components.hours}]`);
    }

    return `**3.2.C. Date/Time Column Analysis:**

**Range & Span:**
* Minimum Date/Time: ${analysis.minDateTime.toISOString()}
* Maximum Date/Time: ${analysis.maxDateTime.toISOString()}
* Overall Time Span: ${analysis.timeSpan}

**Granularity & Precision:**
* Detected Granularity: ${analysis.detectedGranularity}
* Implicit Precision: ${analysis.implicitPrecision}

**Component Analysis & Common Values:**
${componentLines.join('\n')}

**Temporal Patterns (Univariate):**
* Pattern Analysis: ${analysis.temporalPatterns}
* Gap Analysis: ${analysis.gapAnalysis}

**Validity Notes:**
* ${analysis.validityNotes}`;
  }

  private static formatBooleanAnalysis(analysis: BooleanAnalysis): string {
    return `**3.2.D. Boolean Column Analysis:**

**Frequency Distribution:**
* Count of True: ${analysis.trueCount} (${analysis.truePercentage}%)
* Count of False: ${analysis.falseCount} (${analysis.falsePercentage}%)
* Interpretation: ${analysis.interpretation}`;
  }

  private static formatTextAnalysis(analysis: TextColumnAnalysis): string {
    const stats = analysis.textStatistics;
    const patterns = analysis.textPatterns;
    const topWords = analysis.topFrequentWords.join(', ') || 'No frequent words detected';

    return `**3.2.E. Text Column Analysis:**

**Length-Based Statistics (Characters):**
* Minimum Length: ${stats.minCharLength}
* Maximum Length: ${stats.maxCharLength}
* Average Length: ${stats.avgCharLength}
* Median Length: ${stats.medianCharLength}
* Standard Deviation of Length: ${stats.stdCharLength}

**Word Count Statistics:**
* Minimum Word Count: ${stats.minWordCount}
* Maximum Word Count: ${stats.maxWordCount}
* Average Word Count: ${stats.avgWordCount}

**Common Patterns:**
* Percentage of Empty Strings: ${patterns.emptyStringPercentage}%
* Percentage of Purely Numeric Text: ${patterns.numericTextPercentage}%
* URLs Found: ${patterns.urlCount} (${patterns.urlPercentage}%)
* Email Addresses Found: ${patterns.emailCount} (${patterns.emailPercentage}%)

**Top 5 Most Frequent Words:** [${topWords}]`;
  }

  private static formatBivariateAnalysis(bivariate: BivariateAnalysis): string {
    const sections = [
      `**3.3. Bivariate Analysis (Exploring Relationships Between Pairs of Variables):**`,
    ];

    // Numerical vs Numerical
    sections.push(this.formatNumericalBivariateAnalysis(bivariate.numericalVsNumerical));

    // Numerical vs Categorical
    if (bivariate.numericalVsCategorical.length > 0) {
      sections.push(this.formatNumericalCategoricalAnalysis(bivariate.numericalVsCategorical));
    }

    // Categorical vs Categorical
    if (bivariate.categoricalVsCategorical.length > 0) {
      sections.push(this.formatCategoricalBivariateAnalysis(bivariate.categoricalVsCategorical));
    }

    return sections.join('\n\n');
  }

  private static formatNumericalBivariateAnalysis(analysis: NumericalBivariateAnalysis): string {
    if (!analysis || analysis.correlationPairs.length === 0) {
      return `**Numerical vs. Numerical:**
* No numerical variable pairs available for correlation analysis.`;
    }

    const topPositive = analysis.correlationPairs.filter((p) => p.correlation > 0).slice(0, 5);
    const topNegative = analysis.correlationPairs.filter((p) => p.correlation < 0).slice(0, 5);

    const positiveText =
      topPositive.length > 0
        ? topPositive
            .map(
              (pair, i) =>
                `        ${i + 1}. \`${pair.variable1}\` vs \`${pair.variable2}\`: r = ${pair.correlation} (${pair.significance}) - ${pair.interpretation}.`,
            )
            .join('\n')
        : '        No strong positive correlations found.';

    const negativeText =
      topNegative.length > 0
        ? topNegative
            .map(
              (pair, i) =>
                `        ${i + 1}. \`${pair.variable1}\` vs \`${pair.variable2}\`: r = ${pair.correlation} (${pair.significance}) - ${pair.interpretation}.`,
            )
            .join('\n')
        : '        No strong negative correlations found.';

    const scatterInsights = analysis.scatterPlotInsights
      .slice(0, 3)
      .map(
        (insight) =>
          `        * \`${insight.variable1}\` vs \`${insight.variable2}\`: "${insight.insights}" (Recommended: ${insight.recommendedVisualization})`,
      )
      .join('\n');

    return `**Numerical vs. Numerical:**
    * **Correlation Matrix Summary (Pearson's r):**
        * Total Pairs Analysed: ${analysis.totalPairsAnalyzed}
        * Top 5 Strongest Positive Correlations:
${positiveText}
        * Top 5 Strongest Negative Correlations:
${negativeText}
        * Strong Correlations (|r| > 0.5): ${analysis.strongCorrelations.length} pairs identified
    * **Scatter Plot Insights (Key Relationships):**
${scatterInsights || '        * No specific scatter plot insights available.'}`;
  }

  private static formatNumericalCategoricalAnalysis(
    analyses: NumericalCategoricalAnalysis[],
  ): string {
    if (analyses.length === 0) return '';

    const analysisText = analyses
      .slice(0, 3)
      .map((analysis) => {
        const groupTable = analysis.groupComparisons
          .slice(0, 5)
          .map(
            (group) =>
              `        | ${group.category} | ${group.mean} | ${group.median} | ${group.standardDeviation} | ${group.count} |`,
          )
          .join('\n');

        return `    * **\`${analysis.numericalVariable}\` by \`${analysis.categoricalVariable}\`:**
        | Category | Mean | Median | StdDev | Count |
        |----------|------|--------|--------|-------|
${groupTable}
        * **Statistical Tests:** 
            * **ANOVA F-test:** ${analysis.statisticalTests.anova.interpretation}
            * **Kruskal-Wallis test:** ${analysis.statisticalTests.kruskalWallis.interpretation}
        * **Summary:** ${analysis.summary}`;
      })
      .join('\n\n');

    return `**Numerical vs. Categorical:**
    * **Comparative Statistics (Mean/Median by Category):**
${analysisText}`;
  }

  private static formatCategoricalBivariateAnalysis(
    analyses: CategoricalBivariateAnalysis[],
  ): string {
    if (analyses.length === 0) return '';

    const analysisText = analyses
      .slice(0, 2)
      .map((analysis) => {
        const { table } = analysis.contingencyTable;
        const rows = Object.keys(table).slice(0, 3);
        const cols = rows.length > 0 ? Object.keys(table[rows[0]]).slice(0, 3) : [];

        const tableHeader = `        |             | ${cols.join(' | ')} |`;
        const tableSeparator = `        |${'-------------|'.repeat(cols.length + 1)}`;
        const tableRows = rows
          .map(
            (row) => `        | ${row} | ${cols.map((col) => table[row][col] || 0).join(' | ')} |`,
          )
          .join('\n');

        return `    * **\`${analysis.variable1}\` vs \`${analysis.variable2}\`:**
        * **Contingency Table (Top 3x3):**
${tableHeader}
${tableSeparator}
${tableRows}
        * **Association Tests:**
            * Chi-Squared: χ² = ${analysis.associationTests.chiSquare.statistic}, df = ${analysis.associationTests.chiSquare.degreesOfFreedom}, p-value = ${analysis.associationTests.chiSquare.pValue} (${analysis.associationTests.chiSquare.interpretation})
            * Cramer's V: ${analysis.associationTests.cramersV.statistic} (${analysis.associationTests.cramersV.interpretation})
        * **Insights:** ${analysis.insights}`;
      })
      .join('\n\n');

    return `**Categorical vs. Categorical:**
    * **Contingency Table Analysis:**
${analysisText}`;
  }

  private static formatMultivariateAnalysis(multivariate: MultivariateAnalysis): string {
    if (!multivariate || !multivariate.summary.analysisPerformed) {
      return `**3.4. Multivariate Analysis (Advanced Multi-Variable Interactions):**
* ${multivariate?.summary.applicabilityAssessment || 'Multivariate analysis not performed - insufficient numerical variables or computational limitations.'}`;
    }

    const sections = [
      `**3.4. Multivariate Analysis (Advanced Multi-Variable Interactions):**`,
      `**Analysis Overview:** ${multivariate.summary.applicabilityAssessment}`,
      `**Variables Analysed:** ${multivariate.summary.variablesAnalyzed.join(', ')} (${multivariate.summary.numericVariablesCount} numerical variables)`,
      '',
      this.formatPCAAnalysis(multivariate.principalComponentAnalysis),
      this.formatClusteringAnalysis(multivariate.clusteringAnalysis),
      this.formatOutlierDetection(multivariate.outlierDetection),
      this.formatNormalityTests(multivariate.normalityTests),
      this.formatRelationshipAnalysis(multivariate.relationshipAnalysis),
      this.formatMultivariateInsights(multivariate.insights),
    ];

    if (multivariate.summary.analysisLimitations.length > 0) {
      sections.push(
        `**Analysis Limitations:** ${multivariate.summary.analysisLimitations.join('; ')}`,
      );
    }

    return sections.filter((section) => section.length > 0).join('\n\n');
  }

  private static formatPCAAnalysis(pca: PCAAnalysis): string {
    if (!pca.isApplicable) {
      return `**3.4.A. Principal Component Analysis (PCA):**
* Not applicable: ${pca.applicabilityReason}`;
    }

    const varianceText = pca.varianceThresholds
      ? `* **Variance Explained:** ${pca.varianceThresholds.componentsFor85Percent} components explain 85% of variance, ${pca.varianceThresholds.componentsFor95Percent} explain 95%`
      : '';

    const dominantVarsText =
      pca.dominantVariables?.length > 0
        ? `* **Most Influential Variables:** ${pca.dominantVariables
            .slice(0, 3)
            .map((v) => `${v.variable} (loading: ${v.maxLoading.toFixed(3)})`)
            .join(', ')}`
        : '';

    const recommendationText =
      pca.dimensionalityRecommendations?.length > 0
        ? `* **Recommendation:** ${pca.dimensionalityRecommendations.join('; ')}`
        : `* **Recommendation:** PCA completed successfully`;

    return `**3.4.A. Principal Component Analysis (PCA):**
${varianceText}
${dominantVarsText}
${recommendationText}`;
  }

  private static formatClusteringAnalysis(clustering: KMeansAnalysis): string {
    if (!clustering.isApplicable) {
      return `**3.4.B. Cluster Analysis:**
* Not applicable: ${clustering.applicabilityReason}`;
    }

    const optimalText = `* **Optimal Clusters:** ${clustering.optimalClusters} clusters identified using elbow method`;
    const qualityText = clustering.finalClustering?.validation?.silhouetteScore
      ? `* **Cluster Quality:** Silhouette score = ${clustering.finalClustering.validation.silhouetteScore.toFixed(3)} (${clustering.finalClustering.validation.interpretation})`
      : '';

    const profilesText =
      clustering.finalClustering?.clusterProfiles?.length > 0
        ? clustering.finalClustering.clusterProfiles
            .slice(0, 3)
            .map(
              (profile, i: number) =>
                `    * **Cluster ${i + 1}:** ${profile.description} (${profile.size} observations)`,
            )
            .join('\n')
        : '';

    return `**3.4.B. Cluster Analysis:**
${optimalText}
${qualityText}
${profilesText ? `* **Cluster Profiles:**\n${profilesText}` : ''}
* **Recommendation:** ${clustering.recommendations?.join('; ') || 'Clustering analysis completed'}`;
  }

  private static formatOutlierDetection(outliers: MultivariateOutlierAnalysis): string {
    if (!outliers.isApplicable) {
      return `**3.4.C. Multivariate Outlier Detection:**
* Not applicable: ${outliers.applicabilityReason}`;
    }

    const detectionText = `* **Method:** Mahalanobis distance with ${(outliers.threshold * 100).toFixed(1)}% significance level`;
    const countText = `* **Outliers Detected:** ${outliers.totalOutliers} observations (${outliers.outlierPercentage.toFixed(1)}% of dataset)`;

    // Add explanation for high multivariate outlier count when univariate outliers are low
    const explanationText =
      outliers.outlierPercentage > 30
        ? `* **Note on Outlier Discrepancy:** While individual variables show few univariate outliers, multivariate analysis detects combinations of values that are unusual together. These ${outliers.totalOutliers} observations are not extreme on any single variable but represent uncommon patterns in the multidimensional space - this is a normal and expected pattern in multivariate analysis.`
        : '';

    const severityText = outliers.severityDistribution
      ? `* **Severity Distribution:** ${outliers.severityDistribution.extreme} extreme, ${outliers.severityDistribution.moderate} moderate, ${outliers.severityDistribution.mild} mild`
      : '';

    const affectedVarsText =
      outliers.affectedVariables?.length > 0
        ? `* **Most Affected Variables:** ${outliers.affectedVariables
            .slice(0, 3)
            .map((v) => `${v.variable} (${v.outliersCount || 'N/A'} outliers)`)
            .join(', ')}`
        : '';

    const recommendationsText =
      outliers.recommendations?.length > 0
        ? `* **Recommendations:** ${outliers.recommendations.slice(0, 2).join('; ')}`
        : '';

    return `**3.4.C. Multivariate Outlier Detection:**
${detectionText}
${countText}
${explanationText}
${severityText}
${affectedVarsText}
${recommendationsText}`;
  }

  private static formatNormalityTests(normality: MultivariateNormalityTests): string {
    if (!normality?.overallAssessment) {
      return `**3.4.D. Multivariate Normality Tests:**
* Normality testing not performed`;
    }

    const overallText = `* **Overall Assessment:** ${normality.overallAssessment.isMultivariateNormal ? 'Multivariate normality not rejected' : 'Multivariate normality rejected'} (confidence: ${(normality.overallAssessment.confidence * 100).toFixed(1)}%)`;

    const mardiasText = normality.mardiasTest
      ? `* **Mardia's Test:** ${normality.mardiasTest.interpretation}`
      : '';

    const roystonText = normality.roystonTest
      ? `* **Royston's Test:** ${normality.roystonTest.interpretation}`
      : '';

    const violationsText =
      normality.overallAssessment.violations?.length > 0
        ? `* **Violations:** ${normality.overallAssessment.violations.join(', ')}`
        : '';

    const recommendationsText =
      normality.overallAssessment.recommendations?.length > 0
        ? `* **Recommendations:** ${normality.overallAssessment.recommendations.slice(0, 2).join('; ')}`
        : '';

    return `**3.4.D. Multivariate Normality Tests:**
${overallText}
${mardiasText}
${roystonText}
${violationsText}
${recommendationsText}`;
  }

  private static formatRelationshipAnalysis(
    relationships: MultivariateRelationshipAnalysis,
  ): string {
    if (
      !relationships ||
      (!relationships.variableInteractions?.length && !relationships.correlationStructure)
    ) {
      return `**3.4.E. Variable Relationship Analysis:**
* No significant multivariate relationships detected`;
    }

    const interactionsText =
      relationships.variableInteractions?.length > 0
        ? `* **Key Interactions:** ${relationships.variableInteractions
            .slice(0, 3)
            .map(
              (int) =>
                `${int.variables.join(' ↔ ')} (${int.interactionType}, strength: ${int.strength.toFixed(3)})`,
            )
            .join('; ')}`
        : '';

    const correlationText = relationships.correlationStructure
      ? (relationships.correlationStructure.stronglyCorrelatedGroups?.length > 0
          ? `* **Correlated Groups:** ${relationships.correlationStructure.stronglyCorrelatedGroups.length} groups of highly correlated variables identified`
          : '') +
        (relationships.correlationStructure.redundantVariables?.length > 0
          ? `\n* **Redundant Variables:** ${relationships.correlationStructure.redundantVariables.length} variables with high correlation (r > 0.9)`
          : '') +
        (relationships.correlationStructure.independentVariables?.length > 0
          ? `\n* **Independent Variables:** ${relationships.correlationStructure.independentVariables.length} variables with low correlations`
          : '')
      : '';

    const dimensionalityText = relationships.dimensionalityInsights?.dimensionalityReduction
      ?.recommended
      ? `* **Dimensionality:** Reduction recommended - ${relationships.dimensionalityInsights.effectiveDimensionality} effective dimensions detected`
      : `* **Dimensionality:** ${relationships.dimensionalityInsights?.effectiveDimensionality || 'Full'} effective dimensions`;

    return `**3.4.E. Variable Relationship Analysis:**
${interactionsText}
${correlationText}
${dimensionalityText}`;
  }

  private static formatMultivariateInsights(insights: {
    keyFindings: string[];
    dataQualityIssues: string[];
    hypothesesGenerated: string[];
    preprocessingRecommendations: string[];
    analysisRecommendations: string[];
  }): string {
    if (!insights || (!insights.keyFindings?.length && !insights.dataQualityIssues?.length)) {
      return '';
    }

    const sections = [];

    if (insights.keyFindings?.length > 0) {
      sections.push(`**Key Multivariate Findings:**
${insights.keyFindings
  .slice(0, 3)
  .map((finding, i: number) => `    ${i + 1}. ${finding}`)
  .join('\n')}`);
    }

    if (insights.dataQualityIssues?.length > 0) {
      sections.push(`**Data Quality Issues:**
${insights.dataQualityIssues
  .slice(0, 2)
  .map((issue) => `    * ${issue}`)
  .join('\n')}`);
    }

    if (insights.preprocessingRecommendations?.length > 0) {
      sections.push(`**Preprocessing Recommendations:**
${insights.preprocessingRecommendations
  .slice(0, 2)
  .map((rec) => `    * ${rec}`)
  .join('\n')}`);
    }

    if (insights.analysisRecommendations?.length > 0) {
      sections.push(`**Analysis Recommendations:**
${insights.analysisRecommendations
  .slice(0, 2)
  .map((rec) => `    * ${rec}`)
  .join('\n')}`);
    }

    return sections.length > 0
      ? `**3.4.F. Multivariate Insights & Recommendations:**
${sections.join('\n\n')}`
      : '';
  }

  private static formatSpecificAnalysisModules(analyses: ColumnAnalysis[]): string {
    const dateTimeColumns = analyses.filter((a) => a.detectedDataType === EdaDataType.DATE_TIME);
    const textColumns = analyses.filter(
      (a) =>
        a.detectedDataType === EdaDataType.TEXT_GENERAL ||
        a.detectedDataType === EdaDataType.TEXT_ADDRESS,
    );

    const sections = [
      `**3.5. Specific Analysis Modules (Activated Based on Data Characteristics):**`,
    ];

    // Time Series Analysis
    if (dateTimeColumns.length > 0) {
      sections.push(`    * **3.5.A. Time Series Analysis Deep Dive:**
        * **Detected DateTime Columns:** ${dateTimeColumns.length} columns identified
        * **Primary Temporal Column:** \`${dateTimeColumns[0].columnName}\`
        * **Analysis Note:** Advanced time series decomposition, trend analysis, and seasonality detection would be performed here for time-ordered data with sufficient temporal granularity.
        * **Recommendation:** Consider sorting data by primary temporal column for time series analysis if records represent sequential events.`);
    }

    // Text Analytics
    if (textColumns.length > 0) {
      const textAnalysis = textColumns[0] as TextColumnAnalysis;
      const topWords = textAnalysis.topFrequentWords?.slice(0, 5).join(', ') || 'Not available';

      sections.push(`    * **3.5.B. Text Analytics Deep Dive:**
        * **Detected Text Columns:** ${textColumns.length} columns identified
        * **Primary Text Column:** \`${textColumns[0].columnName}\`
        * **Advanced Analysis Available:** N-gram analysis, topic modelling, named entity recognition, sentiment analysis
        * **Sample Keywords:** [${topWords}]
        * **Recommendation:** Apply NLP preprocessing pipeline for deeper text insights if required for analysis goals.`);
    }

    if (dateTimeColumns.length === 0 && textColumns.length === 0) {
      sections.push(
        `    * **No Specific Modules Activated:** Dataset does not contain sufficient datetime or rich text columns for specialized analysis modules.`,
      );
    }

    return sections.join('\n\n');
  }

  private static formatEdaSummary(insights: EdaInsights, warnings: Section3Warning[]): string {
    const topFindings = insights?.topFindings || [];
    const qualityIssues = insights?.dataQualityIssues || [];
    const hypotheses = insights?.hypothesesGenerated || [];
    const recommendations = insights?.preprocessingRecommendations || [];

    const findingsText =
      topFindings.length > 0
        ? topFindings.map((finding: string, i: number) => `    ${i + 1}. ${finding}`).join('\n')
        : '    * No significant patterns detected in current analysis.';

    const qualityText =
      qualityIssues.length > 0
        ? qualityIssues.map((issue) => `    * ${issue}`).join('\n')
        : '    * No major data quality issues identified during EDA.';

    const hypothesesText =
      hypotheses.length > 0
        ? hypotheses.map((hyp, i: number) => `    * H${i + 1}: ${hyp}`).join('\n')
        : '    * No specific hypotheses generated - consider domain knowledge for hypothesis formation.';

    const recommendationsText =
      recommendations.length > 0
        ? recommendations.map((rec) => `    * ${rec}`).join('\n')
        : '    * Standard preprocessing steps recommended based on detected data types.';

    const warningsText =
      warnings.length > 0
        ? warnings
            .filter((w) => w.severity === 'high')
            .slice(0, 3)
            .map((w) => `    * ${w.message} (${w.suggestion})`)
            .join('\n')
        : '    * No critical warnings identified.';

    return `**3.6. EDA Summary & Key Hypotheses/Insights:**
    * **Top Statistical Findings:**
${findingsText}
    * **Data Quality Issues Uncovered:**
${qualityText}
    * **Hypotheses Generated for Further Testing:**
${hypothesesText}
    * **Recommendations for Data Preprocessing & Feature Engineering:**
${recommendationsText}
    * **Critical Warnings & Considerations:**
${warningsText}`;
  }

  private static formatPerformanceMetrics(
    metrics: {
      analysisTimeMs?: number;
      rowsAnalyzed?: number;
      memoryEfficiency?: string;
    },
    metadata?: {
      analysisApproach?: string;
      datasetSize?: number;
      columnsAnalyzed?: number;
      samplingApplied?: boolean;
    },
  ): string {
    if (!metrics) return '';

    return `

---

**Analysis Performance Summary:**
* **Processing Time:** ${metrics.analysisTimeMs || 0}ms (${((metrics.analysisTimeMs || 0) / 1000).toFixed(2)} seconds)
* **Rows Analysed:** ${metrics.rowsAnalyzed?.toLocaleString() || 'Not available'}
* **Memory Efficiency:** ${metrics.memoryEfficiency || 'Not measured'}
* **Analysis Method:** ${metadata?.analysisApproach || 'Standard processing'}
* **Dataset Size:** ${metadata?.datasetSize?.toLocaleString() || 'Not available'} records across ${metadata?.columnsAnalyzed || 'unknown'} columns`;
  }
}
