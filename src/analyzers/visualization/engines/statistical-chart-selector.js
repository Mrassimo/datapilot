"use strict";
/**
 * Statistical-Driven Chart Selection Engine
 *
 * Advanced engine that analyzes statistical properties of data to make
 * intelligent chart recommendations based on:
 * - Distribution characteristics (normality, skewness, kurtosis)
 * - Statistical significance of relationships
 * - Data quality metrics and outlier patterns
 * - Correlation structures and effect sizes
 * - Variance explained and dimensionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalChartSelector = void 0;
const types_1 = require("../../eda/types");
/**
 * Advanced Statistical Chart Selection Engine
 */
class StatisticalChartSelector {
    /**
     * Generate statistically-informed chart recommendations for univariate data
     */
    static recommendUnivariateChart(columnAnalysis) {
        const dataType = columnAnalysis.detectedDataType;
        const distribution = this.analyzeDistribution(columnAnalysis);
        switch (dataType) {
            case types_1.EdaDataType.NUMERICAL_FLOAT:
            case types_1.EdaDataType.NUMERICAL_INTEGER:
                return this.recommendNumericalUnivariate(columnAnalysis, distribution);
            case types_1.EdaDataType.CATEGORICAL:
                return this.recommendCategoricalUnivariate(columnAnalysis);
            case types_1.EdaDataType.DATE_TIME:
                return this.recommendTemporalUnivariate(columnAnalysis);
            case types_1.EdaDataType.BOOLEAN:
                return this.recommendBooleanUnivariate(columnAnalysis);
            default:
                return this.createFallbackRecommendation(columnAnalysis);
        }
    }
    /**
     * Generate statistically-informed chart recommendations for bivariate relationships
     */
    static recommendBivariateChart(xColumn, yColumn, correlation) {
        const xType = xColumn.detectedDataType;
        const yType = yColumn.detectedDataType;
        // Numerical vs Numerical
        if (this.isNumerical(xType) && this.isNumerical(yType)) {
            return this.recommendNumericalBivariate(xColumn, yColumn, correlation);
        }
        // Categorical vs Numerical
        if (this.isCategorical(xType) && this.isNumerical(yType)) {
            return this.recommendCategoricalNumerical(xColumn, yColumn);
        }
        // Numerical vs Categorical (swap for consistency)
        if (this.isNumerical(xType) && this.isCategorical(yType)) {
            return this.recommendCategoricalNumerical(yColumn, xColumn);
        }
        // Categorical vs Categorical
        if (this.isCategorical(xType) && this.isCategorical(yType)) {
            return this.recommendCategoricalBivariate(xColumn, yColumn);
        }
        // Temporal relationships
        if (this.isTemporal(xType) || this.isTemporal(yType)) {
            return this.recommendTemporalBivariate(xColumn, yColumn);
        }
        return this.createFallbackBivariateRecommendation(xColumn, yColumn);
    }
    /**
     * Analyze distribution characteristics for statistical insights
     */
    static analyzeDistribution(columnAnalysis) {
        const stats = columnAnalysis.descriptiveStats;
        if (!stats) {
            return {
                isNormal: false,
                skewness: 0,
                kurtosis: 0,
                modality: 'unimodal',
                outlierSeverity: 'none',
                tailBehavior: 'normal',
            };
        }
        // Determine normality based on skewness and kurtosis
        const skewness = columnAnalysis.distributionAnalysis?.skewness || 0;
        const kurtosis = columnAnalysis.distributionAnalysis?.kurtosis || 0;
        const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1.0;
        // Analyze outlier severity
        const outlierCount = columnAnalysis.outlierAnalysis?.totalOutliers || 0;
        const totalCount = columnAnalysis.totalValues || 1;
        const outlierRate = outlierCount / totalCount;
        let outlierSeverity = 'none';
        if (outlierRate > 0.1)
            outlierSeverity = 'severe';
        else if (outlierRate > 0.05)
            outlierSeverity = 'moderate';
        else if (outlierRate > 0.01)
            outlierSeverity = 'mild';
        // Determine tail behavior
        let tailBehavior = 'normal';
        if (Math.abs(kurtosis) > 2)
            tailBehavior = 'heavy';
        else if (Math.abs(kurtosis) < -1)
            tailBehavior = 'light';
        // Suggest transformation if needed
        let recommendedTransformation;
        if (skewness > 1)
            recommendedTransformation = 'log';
        else if (skewness < -1)
            recommendedTransformation = 'square';
        else if (Math.abs(kurtosis) > 3)
            recommendedTransformation = 'box-cox';
        return {
            isNormal,
            skewness,
            kurtosis,
            modality: 'unimodal', // Would need more sophisticated analysis for multimodality
            outlierSeverity,
            tailBehavior,
            recommendedTransformation,
        };
    }
    /**
     * Recommend charts for numerical univariate data based on distribution
     */
    static recommendNumericalUnivariate(columnAnalysis, distribution) {
        const uniqueValues = columnAnalysis.uniqueValues || 0;
        const totalValues = columnAnalysis.totalValues || 1;
        const cardinality = uniqueValues / totalValues;
        let chartType;
        let confidence;
        let justification;
        let encodingStrategy;
        // High cardinality numerical data
        if (cardinality > 0.8 || uniqueValues > 50) {
            if (distribution.isNormal && distribution.outlierSeverity === 'none') {
                chartType = 'density_plot';
                confidence = 0.9;
                justification =
                    'Normal distribution with high cardinality best shown with smooth density estimation';
            }
            else if (distribution.outlierSeverity === 'severe') {
                chartType = 'violin_plot';
                confidence = 0.85;
                justification =
                    'Severe outliers require violin plot to show both distribution and outlier patterns';
            }
            else {
                chartType = 'histogram';
                confidence = 0.8;
                justification =
                    'High cardinality numerical data shows distribution patterns best with histogram';
            }
        }
        // Moderate cardinality
        else if (cardinality > 0.3) {
            chartType = 'histogram';
            confidence = 0.85;
            justification = 'Moderate cardinality allows for meaningful bin-based distribution analysis';
        }
        // Low cardinality (discrete-like)
        else {
            chartType = 'bar_chart';
            confidence = 0.9;
            justification = 'Low cardinality numerical data treated as discrete categories for clarity';
        }
        // Generate encoding strategy
        encodingStrategy = this.createUnivariateEncodingStrategy(columnAnalysis, chartType, distribution);
        const interactions = this.generateUnivariateInteractions(chartType, distribution);
        const alternatives = this.generateUnivariateAlternatives(chartType, distribution, cardinality);
        const performance = this.generatePerformanceGuidance(totalValues, chartType);
        return {
            chartType,
            confidence,
            statisticalJustification: justification,
            dataCharacteristics: this.extractDataCharacteristics(distribution, cardinality),
            visualEncodingStrategy: encodingStrategy,
            interactionRecommendations: interactions,
            alternativeOptions: alternatives,
            performanceConsiderations: performance,
        };
    }
    /**
     * Recommend charts for categorical univariate data
     */
    static recommendCategoricalUnivariate(columnAnalysis) {
        const uniqueValues = columnAnalysis.uniqueValues || 0;
        const entropy = this.calculateEntropy(columnAnalysis);
        const isOrderedCategories = this.detectOrderedCategories(columnAnalysis);
        let chartType;
        let confidence;
        let justification;
        if (uniqueValues <= 5 && entropy > 1.5) {
            chartType = 'pie_chart';
            confidence = 0.85;
            justification = 'Low cardinality with high entropy suitable for proportional comparison';
        }
        else if (uniqueValues <= 10) {
            chartType = isOrderedCategories ? 'ordered_bar_chart' : 'bar_chart';
            confidence = 0.9;
            justification = isOrderedCategories
                ? 'Ordinal categories maintain natural ordering in bar chart'
                : 'Moderate cardinality categorical data ideal for bar chart comparison';
        }
        else if (uniqueValues <= 20) {
            chartType = 'horizontal_bar_chart';
            confidence = 0.8;
            justification = 'High cardinality requires horizontal orientation for label readability';
        }
        else {
            chartType = 'treemap';
            confidence = 0.75;
            justification =
                'Very high cardinality categorical data benefits from hierarchical treemap display';
        }
        const encodingStrategy = this.createCategoricalEncodingStrategy(columnAnalysis, chartType);
        const interactions = this.generateCategoricalInteractions(chartType, uniqueValues);
        const alternatives = this.generateCategoricalAlternatives(chartType, uniqueValues, entropy);
        const performance = this.generatePerformanceGuidance(columnAnalysis.totalValues || 0, chartType);
        return {
            chartType,
            confidence,
            statisticalJustification: justification,
            dataCharacteristics: [`Cardinality: ${uniqueValues}`, `Entropy: ${entropy.toFixed(2)}`],
            visualEncodingStrategy: encodingStrategy,
            interactionRecommendations: interactions,
            alternativeOptions: alternatives,
            performanceConsiderations: performance,
        };
    }
    /**
     * Recommend charts for numerical vs numerical relationships
     */
    static recommendNumericalBivariate(xColumn, yColumn, correlation) {
        const totalPoints = Math.min(xColumn.totalValues || 0, yColumn.totalValues || 0);
        const correlationStrength = correlation?.strength || 'weak';
        const relationshipType = correlation?.relationship || 'linear';
        let chartType;
        let confidence;
        let justification;
        // Large datasets require different approaches
        if (totalPoints > 10000) {
            if (correlationStrength === 'very_strong' || correlationStrength === 'strong') {
                chartType = 'hexbin_plot';
                confidence = 0.9;
                justification =
                    'Strong correlation in large dataset best shown with hexagonal binning to reveal density patterns';
            }
            else {
                chartType = 'density_scatter';
                confidence = 0.85;
                justification = 'Large dataset requires density-based scatter plot to prevent overplotting';
            }
        }
        // Medium datasets
        else if (totalPoints > 1000) {
            if (relationshipType === 'non_linear') {
                chartType = 'smooth_scatter';
                confidence = 0.8;
                justification = 'Non-linear relationship benefits from smoothed trend line visualization';
            }
            else {
                chartType = 'scatter_plot';
                confidence = 0.9;
                justification =
                    'Medium-sized dataset ideal for traditional scatter plot with trend analysis';
            }
        }
        // Small datasets
        else {
            chartType = 'scatter_plot';
            confidence = 0.95;
            justification =
                'Small dataset allows for detailed scatter plot analysis with individual point inspection';
        }
        const encodingStrategy = this.createBivariateEncodingStrategy(xColumn, yColumn, chartType, correlation);
        const interactions = this.generateBivariateInteractions(chartType, correlationStrength);
        const alternatives = this.generateBivariateAlternatives(chartType, totalPoints, relationshipType);
        const performance = this.generatePerformanceGuidance(totalPoints, chartType);
        return {
            chartType,
            confidence,
            statisticalJustification: justification,
            dataCharacteristics: [
                `Correlation: ${correlationStrength}`,
                `Relationship: ${relationshipType}`,
                `Sample size: ${totalPoints}`,
            ],
            visualEncodingStrategy: encodingStrategy,
            interactionRecommendations: interactions,
            alternativeOptions: alternatives,
            performanceConsiderations: performance,
        };
    }
    // Helper methods for creating encoding strategies
    static createUnivariateEncodingStrategy(columnAnalysis, chartType, distribution) {
        const primaryEncoding = {
            channel: chartType.includes('bar') ? 'y' : 'x',
            dataField: columnAnalysis.columnName,
            dataType: 'quantitative',
            scale: this.recommendScale(columnAnalysis, distribution),
            justification: `Primary ${chartType.includes('bar') ? 'vertical' : 'horizontal'} encoding for ${columnAnalysis.columnName}`,
        };
        const colorStrategy = {
            scheme: 'sequential',
            palette: distribution.outlierSeverity === 'severe' ? 'viridis' : 'blues',
            accessibility: {
                colorBlindnessSafe: true,
                contrastRatio: 4.5,
                alternativeEncodings: ['pattern', 'texture'],
                screenReaderGuidance: `Distribution of ${columnAnalysis.columnName}`,
            },
            reasoning: 'Sequential color scheme appropriate for continuous numerical data',
        };
        return {
            primaryEncoding,
            secondaryEncodings: [],
            colorStrategy,
            aestheticOptimizations: this.generateAestheticOptimizations(distribution),
        };
    }
    static createBivariateEncodingStrategy(xColumn, yColumn, chartType, correlation) {
        const xEncoding = {
            channel: 'x',
            dataField: xColumn.columnName,
            dataType: 'quantitative',
            scale: this.recommendScale(xColumn),
            justification: `Horizontal axis encoding for ${xColumn.columnName}`,
        };
        const yEncoding = {
            channel: 'y',
            dataField: yColumn.columnName,
            dataType: 'quantitative',
            scale: this.recommendScale(yColumn),
            justification: `Vertical axis encoding for ${yColumn.columnName}`,
        };
        const colorStrategy = {
            scheme: correlation?.strength === 'very_strong' ? 'diverging' : 'categorical',
            palette: correlation?.direction === 'negative' ? 'rdbu' : 'plasma',
            accessibility: {
                colorBlindnessSafe: true,
                contrastRatio: 4.5,
                alternativeEncodings: ['size', 'shape'],
                screenReaderGuidance: `Relationship between ${xColumn.columnName} and ${yColumn.columnName}`,
            },
            reasoning: `${correlation?.strength || 'Unknown'} correlation benefits from ${correlation?.strength === 'very_strong' ? 'diverging' : 'categorical'} color scheme`,
        };
        return {
            primaryEncoding: xEncoding,
            secondaryEncodings: [yEncoding],
            colorStrategy,
            aestheticOptimizations: [],
        };
    }
    // Helper methods for scale recommendations
    static recommendScale(columnAnalysis, distribution) {
        const stats = columnAnalysis.descriptiveStats;
        const min = stats?.minimum || 0;
        const max = stats?.maximum || 100;
        // Detect if log scale would be beneficial
        if (distribution?.recommendedTransformation === 'log' || (max / min > 1000 && min > 0)) {
            return {
                type: 'log',
                domain: [min, max],
                nice: true,
                reasoning: 'Log scale recommended due to wide range or right-skewed distribution',
            };
        }
        // Standard linear scale
        return {
            type: 'linear',
            domain: [min, max],
            nice: true,
            zero: min >= 0, // Include zero if all values are positive
            reasoning: 'Linear scale appropriate for normal distribution with reasonable range',
        };
    }
    // Utility methods
    static isNumerical(dataType) {
        return dataType === types_1.EdaDataType.NUMERICAL_FLOAT || dataType === types_1.EdaDataType.NUMERICAL_INTEGER;
    }
    static isCategorical(dataType) {
        return dataType === types_1.EdaDataType.CATEGORICAL;
    }
    static isTemporal(dataType) {
        return dataType === types_1.EdaDataType.DATE_TIME;
    }
    static calculateEntropy(columnAnalysis) {
        // Enhanced entropy calculation using actual frequency data if available
        const frequencyData = columnAnalysis.frequencyDistribution;
        const totalValues = columnAnalysis.totalValues || 1;
        if (!frequencyData) {
            // Fallback to simplified calculation
            const uniqueValues = columnAnalysis.uniqueValues || 1;
            if (uniqueValues === 1)
                return 0;
            const probability = 1 / uniqueValues;
            return -uniqueValues * probability * Math.log2(probability);
        }
        // Calculate entropy using actual frequencies
        let entropy = 0;
        for (const freq of Object.values(frequencyData)) {
            const probability = freq / totalValues;
            if (probability > 0) {
                entropy -= probability * Math.log2(probability);
            }
        }
        return entropy;
    }
    static detectOrderedCategories(columnAnalysis) {
        const columnName = columnAnalysis.columnName.toLowerCase();
        // Common ordinal indicators in column names
        const ordinalKeywords = [
            'rating',
            'level',
            'grade',
            'score',
            'rank',
            'priority',
            'stage',
            'class',
            'tier',
            'scale',
            'order',
            'sequence',
            'step',
            'phase',
            'generation',
            'version',
            'size',
            'magnitude',
            'intensity',
            'severity',
        ];
        // Check for ordinal keywords
        if (ordinalKeywords.some((keyword) => columnName.includes(keyword))) {
            return true;
        }
        // Check for sequential patterns in actual values if available
        const frequencyData = columnAnalysis.frequencyDistribution;
        if (frequencyData) {
            const categories = Object.keys(frequencyData);
            // Check for numerical sequences (1,2,3 or A,B,C)
            const isNumericSequence = categories.every((cat) => !isNaN(Number(cat)));
            if (isNumericSequence && categories.length > 1) {
                const numbers = categories.map(Number).sort((a, b) => a - b);
                const isConsecutive = numbers.every((num, i) => i === 0 || num === numbers[i - 1] + 1);
                return isConsecutive;
            }
            // Check for alphabetical sequences
            if (categories.length <= 10 && categories.every((cat) => cat.length === 1)) {
                const sortedCats = [...categories].sort();
                return sortedCats.join('') === categories.sort().join('');
            }
        }
        return false;
    }
    static extractDataCharacteristics(distribution, cardinality) {
        const characteristics = [];
        characteristics.push(`Distribution: ${distribution.isNormal ? 'Normal' : 'Non-normal'}`);
        characteristics.push(`Skewness: ${Math.abs(distribution.skewness) < 0.5 ? 'Symmetric' : distribution.skewness > 0 ? 'Right-skewed' : 'Left-skewed'}`);
        characteristics.push(`Outliers: ${distribution.outlierSeverity}`);
        characteristics.push(`Cardinality: ${cardinality > 0.8 ? 'High' : cardinality > 0.3 ? 'Moderate' : 'Low'}`);
        if (distribution.recommendedTransformation) {
            characteristics.push(`Suggested transformation: ${distribution.recommendedTransformation}`);
        }
        return characteristics;
    }
    // Placeholder methods for generating interactions, alternatives, and performance guidance
    static generateUnivariateInteractions(chartType, distribution) {
        const interactions = [];
        interactions.push({
            interactionType: 'hover',
            purpose: 'Show exact values and statistics',
            implementation: 'Tooltip with value, percentile, and z-score',
            priority: 'essential',
            statisticalBenefit: 'Allows precise value inspection and statistical context',
        });
        if (distribution.outlierSeverity !== 'none') {
            interactions.push({
                interactionType: 'click',
                purpose: 'Highlight outliers',
                implementation: 'Click to highlight outlier points and show outlier analysis',
                priority: 'recommended',
                statisticalBenefit: 'Facilitates outlier investigation and data quality assessment',
            });
        }
        return interactions;
    }
    static generateUnivariateAlternatives(chartType, distribution, cardinality) {
        const alternatives = [];
        if (chartType !== 'box_plot' && distribution.outlierSeverity !== 'none') {
            alternatives.push({
                chartType: 'box_plot',
                confidence: 0.8,
                tradeoffs: 'Less detailed distribution but better outlier visibility',
                whenToUse: 'When outlier analysis is primary concern',
                statisticalSuitability: 0.85,
            });
        }
        if (chartType !== 'violin_plot' && !distribution.isNormal) {
            alternatives.push({
                chartType: 'violin_plot',
                confidence: 0.75,
                tradeoffs: 'More complex but shows full distribution shape',
                whenToUse: 'When distribution shape analysis is important',
                statisticalSuitability: 0.8,
            });
        }
        return alternatives;
    }
    static generatePerformanceGuidance(dataSize, chartType) {
        let threshold = 10000;
        let samplingStrategy;
        const aggregationSuggestions = [];
        const renderingOptimizations = [];
        const memoryConsiderations = [];
        if (dataSize > 100000) {
            threshold = 5000;
            samplingStrategy = 'Stratified random sampling maintaining distribution characteristics';
            aggregationSuggestions.push('Bin data for histogram display');
            renderingOptimizations.push('Use canvas rendering instead of SVG');
            memoryConsiderations.push('Stream data processing to avoid loading full dataset');
        }
        else if (dataSize > 10000) {
            aggregationSuggestions.push('Consider binning for performance');
            renderingOptimizations.push('Optimize for moderate data size');
        }
        return {
            dataPointThreshold: threshold,
            samplingStrategy,
            aggregationSuggestions,
            renderingOptimizations,
            memoryConsiderations,
        };
    }
    static generateAestheticOptimizations(distribution) {
        const optimizations = [];
        if (distribution.outlierSeverity === 'severe') {
            optimizations.push({
                property: 'opacity',
                value: 0.7,
                reasoning: 'Reduced opacity helps manage visual impact of severe outliers',
                impact: 'medium',
            });
        }
        if (!distribution.isNormal) {
            optimizations.push({
                property: 'binning',
                value: 'adaptive',
                reasoning: 'Adaptive binning better represents non-normal distributions',
                impact: 'high',
            });
        }
        return optimizations;
    }
    // Additional placeholder methods
    static recommendTemporalUnivariate(columnAnalysis) {
        return this.createFallbackRecommendation(columnAnalysis, 'line_chart');
    }
    static recommendBooleanUnivariate(columnAnalysis) {
        return this.createFallbackRecommendation(columnAnalysis, 'pie_chart');
    }
    static recommendCategoricalNumerical(catColumn, numColumn) {
        return this.createFallbackRecommendation(catColumn, 'box_plot');
    }
    static recommendCategoricalBivariate(xColumn, yColumn) {
        return this.createFallbackBivariateRecommendation(xColumn, yColumn, 'heatmap');
    }
    static recommendTemporalBivariate(xColumn, yColumn) {
        return this.createFallbackBivariateRecommendation(xColumn, yColumn, 'line_chart');
    }
    static createCategoricalEncodingStrategy(columnAnalysis, chartType) {
        return {
            primaryEncoding: {
                channel: 'x',
                dataField: columnAnalysis.columnName,
                dataType: 'nominal',
                scale: {
                    type: 'ordinal',
                    domain: [],
                    reasoning: 'Categorical data requires ordinal scale',
                },
                justification: 'Primary categorical encoding',
            },
            secondaryEncodings: [],
            colorStrategy: {
                scheme: 'categorical',
                palette: 'category10',
                accessibility: {
                    colorBlindnessSafe: true,
                    contrastRatio: 4.5,
                    alternativeEncodings: ['pattern'],
                    screenReaderGuidance: `Categories of ${columnAnalysis.columnName}`,
                },
                reasoning: 'Categorical color scheme for distinct categories',
            },
            aestheticOptimizations: [],
        };
    }
    static generateCategoricalInteractions(chartType, uniqueValues) {
        return [
            {
                interactionType: 'hover',
                purpose: 'Show category details',
                implementation: 'Tooltip with frequency and percentage',
                priority: 'essential',
                statisticalBenefit: 'Provides exact frequency information',
            },
        ];
    }
    static generateCategoricalAlternatives(chartType, uniqueValues, entropy) {
        const alternatives = [];
        // For bar charts, suggest alternatives based on cardinality and entropy
        if (chartType === 'bar_chart' || chartType === 'horizontal_bar_chart') {
            if (uniqueValues <= 5 && entropy > 1.0) {
                alternatives.push({
                    chartType: 'pie_chart',
                    confidence: 0.8,
                    tradeoffs: 'Shows proportions clearly but harder to compare exact values',
                    whenToUse: 'When emphasizing part-to-whole relationships',
                    statisticalSuitability: 0.85,
                });
                alternatives.push({
                    chartType: 'donut_chart',
                    confidence: 0.75,
                    tradeoffs: 'Better space utilization but harder to compare small segments',
                    whenToUse: 'When space is limited and proportions are important',
                    statisticalSuitability: 0.75,
                });
            }
            if (uniqueValues > 10) {
                alternatives.push({
                    chartType: 'treemap',
                    confidence: 0.7,
                    tradeoffs: 'Handles many categories well but less precise value comparison',
                    whenToUse: 'When dealing with high cardinality categorical data',
                    statisticalSuitability: 0.8,
                });
            }
        }
        // For pie charts, suggest bar chart alternative
        if (chartType === 'pie_chart') {
            alternatives.push({
                chartType: 'bar_chart',
                confidence: 0.85,
                tradeoffs: 'Better for precise value comparison but loses part-to-whole context',
                whenToUse: 'When exact value comparison is more important than proportions',
                statisticalSuitability: 0.9,
            });
        }
        // For high cardinality, suggest packed bubble chart
        if (uniqueValues > 20) {
            alternatives.push({
                chartType: 'packed_bubble',
                confidence: 0.65,
                tradeoffs: 'Visually appealing for many categories but imprecise value reading',
                whenToUse: 'When visual impact is important and precise values are secondary',
                statisticalSuitability: 0.6,
            });
        }
        return alternatives;
    }
    static generateBivariateInteractions(chartType, correlationStrength) {
        const interactions = [];
        // Essential hover interaction for all bivariate charts
        interactions.push({
            interactionType: 'hover',
            purpose: 'Show point details and statistical context',
            implementation: 'Tooltip with coordinates, residuals, and leverage values',
            priority: 'essential',
            statisticalBenefit: 'Provides immediate access to point-level statistics',
        });
        // Brush selection for subset analysis
        interactions.push({
            interactionType: 'brush',
            purpose: 'Select data subset for analysis',
            implementation: 'Brush selection with linked summary statistics and correlation update',
            priority: 'recommended',
            statisticalBenefit: 'Enables subset analysis and outlier investigation',
        });
        // Zoom for detailed examination
        if (chartType.includes('scatter') || chartType.includes('hexbin')) {
            interactions.push({
                interactionType: 'zoom',
                purpose: 'Examine dense regions in detail',
                implementation: 'Semantic zoom maintaining statistical context',
                priority: 'recommended',
                statisticalBenefit: 'Allows detailed examination of high-density regions',
            });
        }
        // Filter for outlier management
        interactions.push({
            interactionType: 'filter',
            purpose: 'Remove outliers or focus on data ranges',
            implementation: 'Interactive filtering with real-time correlation updates',
            priority: 'optional',
            statisticalBenefit: 'Enables robust analysis by handling outliers systematically',
        });
        // For strong correlations, add trend line interaction
        if (correlationStrength === 'strong' || correlationStrength === 'very_strong') {
            interactions.push({
                interactionType: 'click',
                purpose: 'Toggle regression line and confidence intervals',
                implementation: 'Click to show/hide trend analysis with R² and confidence bands',
                priority: 'recommended',
                statisticalBenefit: 'Provides immediate access to regression analysis',
            });
        }
        return interactions;
    }
    static generateBivariateAlternatives(chartType, totalPoints, relationshipType) {
        const alternatives = [];
        // For scatter plots
        if (chartType === 'scatter_plot') {
            if (totalPoints > 5000) {
                alternatives.push({
                    chartType: 'hexbin_plot',
                    confidence: 0.85,
                    tradeoffs: 'Better for large datasets but loses individual point detail',
                    whenToUse: 'When data density patterns are more important than individual points',
                    statisticalSuitability: 0.9,
                });
                alternatives.push({
                    chartType: 'density_scatter',
                    confidence: 0.8,
                    tradeoffs: 'Reveals density patterns but may obscure outliers',
                    whenToUse: 'For very large datasets where overplotting is a concern',
                    statisticalSuitability: 0.85,
                });
            }
            if (relationshipType === 'non_linear') {
                alternatives.push({
                    chartType: 'smooth_scatter',
                    confidence: 0.8,
                    tradeoffs: 'Shows trend clearly but may oversimplify complex relationships',
                    whenToUse: 'When trend visualization is more important than individual points',
                    statisticalSuitability: 0.85,
                });
            }
            alternatives.push({
                chartType: 'contour_plot',
                confidence: 0.7,
                tradeoffs: 'Shows density patterns but loses individual point detail',
                whenToUse: 'For large datasets where point density is important',
                statisticalSuitability: 0.8,
            });
        }
        // For hexbin plots
        if (chartType === 'hexbin_plot') {
            alternatives.push({
                chartType: 'scatter_plot',
                confidence: 0.6,
                tradeoffs: 'Shows individual points but may have overplotting issues',
                whenToUse: 'When individual point analysis is needed despite large dataset',
                statisticalSuitability: 0.7,
            });
            alternatives.push({
                chartType: 'heatmap_2d',
                confidence: 0.75,
                tradeoffs: 'Regular grid may not align well with data distribution',
                whenToUse: 'When rectangular binning is preferred over hexagonal',
                statisticalSuitability: 0.8,
            });
        }
        // For large datasets, always suggest sampling approach
        if (totalPoints > 50000) {
            alternatives.push({
                chartType: 'sampled_scatter',
                confidence: 0.7,
                tradeoffs: 'Faster rendering but may miss important data patterns',
                whenToUse: 'When performance is critical and patterns are robust to sampling',
                statisticalSuitability: 0.75,
            });
        }
        return alternatives;
    }
    static createFallbackRecommendation(columnAnalysis, defaultChart = 'bar_chart') {
        return {
            chartType: defaultChart,
            confidence: 0.5,
            statisticalJustification: 'Default recommendation - statistical analysis incomplete',
            dataCharacteristics: ['Insufficient statistical analysis'],
            visualEncodingStrategy: {
                primaryEncoding: {
                    channel: 'x',
                    dataField: columnAnalysis.columnName,
                    dataType: 'nominal',
                    scale: { type: 'ordinal', domain: [], reasoning: 'Default scale' },
                    justification: 'Default encoding',
                },
                secondaryEncodings: [],
                colorStrategy: {
                    scheme: 'categorical',
                    palette: 'category10',
                    accessibility: {
                        colorBlindnessSafe: true,
                        contrastRatio: 4.5,
                        alternativeEncodings: [],
                        screenReaderGuidance: 'Default chart',
                    },
                    reasoning: 'Default color strategy',
                },
                aestheticOptimizations: [],
            },
            interactionRecommendations: [],
            alternativeOptions: [],
            performanceConsiderations: {
                dataPointThreshold: 10000,
                aggregationSuggestions: [],
                renderingOptimizations: [],
                memoryConsiderations: [],
            },
        };
    }
    static createFallbackBivariateRecommendation(xColumn, yColumn, defaultChart = 'scatter_plot') {
        return {
            chartType: defaultChart,
            confidence: 0.5,
            statisticalJustification: 'Default bivariate recommendation',
            dataCharacteristics: ['Bivariate relationship analysis incomplete'],
            visualEncodingStrategy: {
                primaryEncoding: {
                    channel: 'x',
                    dataField: xColumn.columnName,
                    dataType: 'quantitative',
                    scale: { type: 'linear', domain: [0, 100], reasoning: 'Default linear scale' },
                    justification: 'Default x-axis encoding',
                },
                secondaryEncodings: [
                    {
                        channel: 'y',
                        dataField: yColumn.columnName,
                        dataType: 'quantitative',
                        scale: { type: 'linear', domain: [0, 100], reasoning: 'Default linear scale' },
                        justification: 'Default y-axis encoding',
                    },
                ],
                colorStrategy: {
                    scheme: 'categorical',
                    palette: 'category10',
                    accessibility: {
                        colorBlindnessSafe: true,
                        contrastRatio: 4.5,
                        alternativeEncodings: [],
                        screenReaderGuidance: 'Default bivariate chart',
                    },
                    reasoning: 'Default color strategy',
                },
                aestheticOptimizations: [],
            },
            interactionRecommendations: [],
            alternativeOptions: [],
            performanceConsiderations: {
                dataPointThreshold: 10000,
                aggregationSuggestions: [],
                renderingOptimizations: [],
                memoryConsiderations: [],
            },
        };
    }
}
exports.StatisticalChartSelector = StatisticalChartSelector;
//# sourceMappingURL=statistical-chart-selector.js.map