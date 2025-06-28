/**
 * Unsupervised Learning Analyzer - Enhanced unsupervised learning and synthetic target generation
 * Addresses GitHub issue #22: Never return "0 modeling tasks" - always find opportunities
 */

import type { Section1Result } from '../overview/types';
import type { Section2Result as QualityResult } from '../quality/types';
import type { Section3Result as EDAResult } from '../eda/types';
import type { Section5Result as EngineeringResult } from '../engineering/types';
import type {
  SyntheticTargetRecommendation,
  UnsupervisedLearningRecommendation,
  AutoMLRecommendation,
  FeatureEngineeringRecipe,
  UnsupervisedAnalysisResult,
  DeploymentConsideration,
  UnsupervisedTechnicalDetails,
  CodeImplementation,
} from './types';

export class UnsupervisedAnalyzer {
  /**
   * Generate comprehensive unsupervised learning recommendations when no obvious targets exist
   */
  async analyzeUnsupervisedOpportunities(
    section1Result: Section1Result,
    section2Result: QualityResult,
    section3Result: EDAResult,
    section5Result: EngineeringResult,
  ): Promise<UnsupervisedAnalysisResult> {
    // Use EDA column analysis for detailed type information, fall back to basic inventory
    const edaUnivariate = section3Result.edaAnalysis?.univariateAnalysis;
    let edaColumns: any[] = [];
    
    // Handle different EDA result structures (array vs object with separate arrays)
    if (Array.isArray(edaUnivariate)) {
      edaColumns = edaUnivariate;
    } else if (edaUnivariate && typeof edaUnivariate === 'object') {
      // Handle test mock structure with separate arrays
      const numerical = (edaUnivariate as any).numericalAnalysis || [];
      const categorical = (edaUnivariate as any).categoricalAnalysis || [];
      const dateTime = (edaUnivariate as any).dateTimeAnalysis || [];
      const boolean = (edaUnivariate as any).booleanAnalysis || [];
      const text = (edaUnivariate as any).textAnalysis || [];
      
      edaColumns = [
        ...numerical.map((col: any) => ({ ...col, detectedDataType: 'numerical_float' })),
        ...categorical.map((col: any) => ({ ...col, detectedDataType: 'categorical' })),
        ...dateTime.map((col: any) => ({ ...col, detectedDataType: 'date_time' })),
        ...boolean.map((col: any) => ({ ...col, detectedDataType: 'boolean' })),
        ...text.map((col: any) => ({ ...col, detectedDataType: 'text_general' })),
      ];
    }
    
    // Fall back to basic columns if no EDA data available
    if (edaColumns.length === 0) {
      edaColumns = section1Result.overview.structuralDimensions.columnInventory.map(col => ({
        columnName: col.name,
        detectedDataType: 'categorical', // Default assumption
        uniqueValues: 10, // Default assumption
      }));
    }
    
    const basicColumns = section1Result.overview.structuralDimensions.columnInventory;
    const qualityScores = section2Result.qualityAudit?.cockpit?.compositeScore?.score || 0.5;
    const correlations = section3Result.edaAnalysis?.bivariateAnalysis?.numericalVsNumerical;
    
    // Generate all types of recommendations
    const syntheticTargets = await this.generateSyntheticTargets(
      edaColumns,
      section2Result,
      section3Result,
      section5Result,
    );
    
    const unsupervisedApproaches = await this.generateUnsupervisedRecommendations(
      edaColumns,
      section2Result,
      section3Result,
    );
    
    const fileSizeMB = section1Result.overview.fileDetails?.fileSizeMB || 1; // Safe fallback for missing fileDetails
    const autoMLRecommendations = await this.generateAutoMLRecommendations(
      edaColumns,
      qualityScores,
      fileSizeMB,
    );
    
    const featureEngineeringRecipes = await this.generateFeatureEngineeringRecipes(
      edaColumns,
      section3Result,
      section5Result,
    );
    
    const deploymentConsiderations = await this.generateDeploymentConsiderations(
      edaColumns,
      fileSizeMB, // Reuse the safe fallback
    );

    return {
      syntheticTargets,
      unsupervisedApproaches,
      autoMLRecommendations,
      featureEngineeringRecipes,
      deploymentConsiderations,
    };
  }

  /**
   * Generate synthetic target variable recommendations
   */
  private async generateSyntheticTargets(
    columns: any[],
    qualityResult: QualityResult,
    edaResult: EDAResult,
    engineeringResult: EngineeringResult,
  ): Promise<SyntheticTargetRecommendation[]> {
    const targets: SyntheticTargetRecommendation[] = [];

    // 1. Clustering-based targets
    targets.push(...this.generateClusteringBasedTargets(columns, edaResult));
    
    // 2. Outlier-based targets
    targets.push(...this.generateOutlierBasedTargets(columns, edaResult));
    
    // 3. Composite targets from feature engineering
    targets.push(...this.generateCompositeTargets(columns, edaResult));
    
    // 4. Temporal targets (if temporal data exists)
    targets.push(...this.generateTemporalTargets(columns, edaResult));
    
    // 5. Domain-derived targets
    targets.push(...this.generateDomainDerivedTargets(columns, qualityResult));

    return targets.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
  }

  /**
   * Generate clustering-based synthetic targets
   */
  private generateClusteringBasedTargets(
    columns: any[],
    edaResult: EDAResult,
  ): SyntheticTargetRecommendation[] {
    const targets: SyntheticTargetRecommendation[] = [];
    
    // Find suitable columns for clustering
    const numericalColumns = columns.filter(col => 
      col.detectedDataType === 'numerical_float' || col.detectedDataType === 'numerical_integer'
    );
    const categoricalColumns = columns.filter(col =>
      col.detectedDataType === 'categorical' && col.uniqueValues <= 50
    );
    
    if (numericalColumns.length >= 2 || categoricalColumns.length >= 1) {
      targets.push({
        targetName: 'customer_segment',
        targetType: 'clustering_based',
        description: 'Customer segmentation based on behavioral and demographic features',
        businessValue: 'Enables targeted marketing campaigns, personalized product recommendations, and customer lifetime value analysis',
        technicalImplementation: 'K-Means clustering with optimal K selection using elbow method and silhouette analysis',
        sourceColumns: [...numericalColumns.slice(0, 4).map(c => c.columnName), ...categoricalColumns.slice(0, 2).map(c => c.columnName)],
        expectedCardinality: 5,
        feasibilityScore: 85,
        codeExample: this.generateClusteringCode(numericalColumns, categoricalColumns),
        validationStrategy: 'Silhouette analysis, Davies-Bouldin index, business interpretation validation',
        useCases: [
          'Marketing campaign targeting',
          'Product recommendation systems',
          'Customer service optimization',
          'Pricing strategy development',
        ],
      });
    }

    if (categoricalColumns.some(col => col.columnName.toLowerCase().includes('country'))) {
      targets.push({
        targetName: 'market_tier',
        targetType: 'clustering_based',
        description: 'Geographic market tiers based on customer density and characteristics',
        businessValue: 'Market prioritization, resource allocation, and expansion planning',
        technicalImplementation: 'Hierarchical clustering of geographic regions based on customer metrics',
        sourceColumns: ['country', ...numericalColumns.slice(0, 2).map(c => c.columnName)],
        expectedCardinality: 3,
        feasibilityScore: 75,
        codeExample: this.generateGeographicClusteringCode(),
        validationStrategy: 'Geographic coherence validation, business metric correlation',
        useCases: [
          'Market expansion strategy',
          'Regional sales team allocation',
          'Localized marketing campaigns',
          'Supply chain optimization',
        ],
      });
    }

    return targets;
  }

  /**
   * Generate outlier-based synthetic targets
   */
  private generateOutlierBasedTargets(
    columns: any[],
    edaResult: EDAResult,
  ): SyntheticTargetRecommendation[] {
    const targets: SyntheticTargetRecommendation[] = [];
    
    const numericalColumns = columns.filter(col => 
      col.detectedDataType === 'numerical_float' || col.detectedDataType === 'numerical_integer'
    );

    if (numericalColumns.length >= 2) {
      targets.push({
        targetName: 'anomaly_score',
        targetType: 'outlier_based',
        description: 'Anomaly detection score for identifying unusual records',
        businessValue: 'Fraud detection, data quality monitoring, and outlier investigation',
        technicalImplementation: 'Isolation Forest algorithm to assign anomaly scores to each record',
        sourceColumns: numericalColumns.map(c => c.columnName),
        feasibilityScore: 80,
        codeExample: this.generateAnomalyDetectionCode(numericalColumns),
        validationStrategy: 'Manual inspection of high-scoring anomalies, domain expert validation',
        useCases: [
          'Fraud detection systems',
          'Data quality monitoring',
          'Outlier investigation',
          'Rare event detection',
        ],
      });

      targets.push({
        targetName: 'data_quality_flag',
        targetType: 'outlier_based',
        description: 'Binary flag indicating records with potential data quality issues',
        businessValue: 'Automated data quality assessment and cleaning prioritization',
        technicalImplementation: 'Binary classification based on anomaly score threshold',
        sourceColumns: numericalColumns.map(c => c.columnName),
        expectedCardinality: 2,
        feasibilityScore: 75,
        codeExample: this.generateDataQualityFlagCode(numericalColumns),
        validationStrategy: 'Precision/recall analysis against manually identified quality issues',
        useCases: [
          'Automated data cleaning',
          'Data quality dashboards',
          'ETL pipeline monitoring',
          'Data validation workflows',
        ],
      });
    }

    return targets;
  }

  /**
   * Generate composite synthetic targets
   */
  private generateCompositeTargets(
    columns: any[],
    edaResult: EDAResult,
  ): SyntheticTargetRecommendation[] {
    const targets: SyntheticTargetRecommendation[] = [];
    
    // Look for email columns to create email domain quality target
    const emailColumns = columns.filter(col => 
      col.columnName.toLowerCase().includes('email')
    );
    
    if (emailColumns.length > 0) {
      targets.push({
        targetName: 'email_domain_quality',
        targetType: 'composite',
        description: 'Classification of email domains as corporate vs personal',
        businessValue: 'Lead quality assessment, B2B vs B2C customer segmentation',
        technicalImplementation: 'Rule-based classification using domain patterns and known corporate/personal email providers',
        sourceColumns: [emailColumns[0].columnName],
        expectedCardinality: 2,
        feasibilityScore: 90,
        codeExample: this.generateEmailDomainQualityCode(emailColumns[0].columnName),
        validationStrategy: 'Manual validation against known corporate domains, accuracy testing',
        useCases: [
          'Lead scoring systems',
          'B2B marketing targeting',
          'Customer acquisition cost optimization',
          'Sales pipeline qualification',
        ],
      });
    }

    // Look for name columns to create completeness score
    const nameColumns = columns.filter(col => 
      col.columnName.toLowerCase().includes('name') ||
      col.columnName.toLowerCase().includes('first') ||
      col.columnName.toLowerCase().includes('last')
    );
    
    if (nameColumns.length > 0) {
      targets.push({
        targetName: 'profile_completeness_score',
        targetType: 'composite',
        description: 'Percentage score of profile completeness based on filled important fields',
        businessValue: 'User engagement optimization, onboarding funnel analysis',
        technicalImplementation: 'Weighted percentage of non-null values across important profile fields',
        sourceColumns: columns.slice(0, 8).map(c => c.columnName),
        feasibilityScore: 85,
        codeExample: this.generateProfileCompletenessCode(columns),
        validationStrategy: 'Correlation analysis with user engagement metrics',
        useCases: [
          'User onboarding optimization',
          'Engagement prediction models',
          'Profile completion campaigns',
          'Data collection prioritization',
        ],
      });
    }

    return targets;
  }

  /**
   * Generate temporal synthetic targets
   */
  private generateTemporalTargets(
    columns: any[],
    edaResult: EDAResult,
  ): SyntheticTargetRecommendation[] {
    const targets: SyntheticTargetRecommendation[] = [];
    
    const dateColumns = columns.filter(col => 
      col.detectedDataType === 'date_time' || 
      col.columnName.toLowerCase().includes('date') ||
      col.columnName.toLowerCase().includes('time')
    );

    if (dateColumns.length > 0) {
      targets.push({
        targetName: 'customer_lifetime_days',
        targetType: 'temporal',
        description: 'Days since customer first interaction or subscription',
        businessValue: 'Customer lifetime value analysis, churn prediction, retention modeling',
        technicalImplementation: 'Calculate days between first recorded date and reference date',
        sourceColumns: [dateColumns[0].columnName],
        feasibilityScore: 80,
        codeExample: this.generateCustomerLifetimeCode(dateColumns[0].columnName),
        validationStrategy: 'Business logic validation, outlier analysis',
        useCases: [
          'Customer lifetime value models',
          'Churn prediction systems',
          'Retention campaign targeting',
          'Customer journey analysis',
        ],
      });

      targets.push({
        targetName: 'subscription_quarter',
        targetType: 'temporal',
        description: 'Quarter of year when customer subscribed (seasonal analysis)',
        businessValue: 'Seasonal trend analysis, marketing campaign timing optimization',
        technicalImplementation: 'Extract quarter from subscription date',
        sourceColumns: [dateColumns[0].columnName],
        expectedCardinality: 4,
        feasibilityScore: 75,
        codeExample: this.generateSeasonalityCode(dateColumns[0].columnName),
        validationStrategy: 'Seasonal pattern validation, business cycle correlation',
        useCases: [
          'Seasonal marketing campaigns',
          'Resource planning',
          'Budget allocation',
          'Trend analysis',
        ],
      });
    }

    return targets;
  }

  /**
   * Generate domain-derived synthetic targets
   */
  private generateDomainDerivedTargets(
    columns: any[],
    qualityResult: QualityResult,
  ): SyntheticTargetRecommendation[] {
    const targets: SyntheticTargetRecommendation[] = [];
    
    // Look for high-cardinality categorical columns that could be grouped
    const highCardinalityColumns = columns.filter(col => 
      col.detectedDataType === 'categorical' && 
      col.uniqueValues > 20 &&
      col.uniqueValues < 1000
    );

    if (highCardinalityColumns.length > 0) {
      const col = highCardinalityColumns[0];
      targets.push({
        targetName: `${col.columnName}_category`,
        targetType: 'domain_derived',
        description: `Grouped categories from high-cardinality ${col.columnName} field`,
        businessValue: 'Simplify analysis by grouping related categories, enable pattern recognition',
        technicalImplementation: 'Frequency-based grouping: top N categories + "Other" group',
        sourceColumns: [col.columnName],
        expectedCardinality: Math.min(10, Math.ceil(col.uniqueValues / 10)),
        feasibilityScore: 70,
        codeExample: this.generateCategoryGroupingCode(col.columnName),
        validationStrategy: 'Business logic review of groupings, frequency distribution analysis',
        useCases: [
          'Simplified reporting',
          'Category-based analysis',
          'Market segmentation',
          'Product grouping',
        ],
      });
    }

    return targets;
  }

  /**
   * Generate enhanced unsupervised learning recommendations
   */
  private async generateUnsupervisedRecommendations(
    columns: any[],
    qualityResult: QualityResult,
    edaResult: EDAResult,
  ): Promise<UnsupervisedLearningRecommendation[]> {
    const recommendations: UnsupervisedLearningRecommendation[] = [];
    
    const numericalColumns = columns.filter(col => 
      col.detectedDataType === 'numerical_float' || col.detectedDataType === 'numerical_integer'
    );
    const categoricalColumns = columns.filter(col =>
      col.detectedDataType === 'categorical'
    );

    // 1. Clustering recommendations
    recommendations.push(...this.generateClusteringRecommendations(numericalColumns, categoricalColumns));
    
    // 2. Dimensionality reduction recommendations
    if (numericalColumns.length >= 4) {
      recommendations.push(...this.generateDimensionalityReductionRecommendations(numericalColumns));
    }
    
    // 3. Association rule mining (for categorical data)
    if (categoricalColumns.length >= 3) {
      recommendations.push(...this.generateAssociationMiningRecommendations(categoricalColumns));
    }
    
    // 4. Anomaly detection recommendations
    if (numericalColumns.length >= 2) {
      recommendations.push(...this.generateAnomalyDetectionRecommendations(numericalColumns));
    }

    return recommendations;
  }

  /**
   * Generate clustering recommendations
   */
  private generateClusteringRecommendations(
    numericalColumns: any[],
    categoricalColumns: any[],
  ): UnsupervisedLearningRecommendation[] {
    const recommendations: UnsupervisedLearningRecommendation[] = [];

    if (numericalColumns.length >= 2) {
      // K-Means recommendation
      recommendations.push({
        approach: 'clustering',
        algorithmName: 'K-Means Clustering',
        description: 'Partition data into K clusters based on feature similarity',
        businessValue: 'Customer segmentation, market analysis, behavioral grouping',
        technicalDetails: {
          inputFeatures: numericalColumns.slice(0, 6).map(c => c.columnName),
          preprocessing: ['StandardScaler normalization', 'Handle missing values', 'Remove outliers'],
          hyperparameters: [
            {
              parameterName: 'n_clusters',
              description: 'Number of clusters',
              defaultValue: 5,
              recommendedRange: '3-8 (use elbow method)',
              tuningStrategy: 'Grid search with silhouette score',
              importance: 'critical',
            },
            {
              parameterName: 'random_state',
              description: 'Random seed for reproducibility',
              defaultValue: 42,
              recommendedRange: 'Any integer',
              tuningStrategy: 'Fixed for reproducibility',
              importance: 'important',
            },
          ],
          computationalComplexity: 'O(n * k * i * d) where n=samples, k=clusters, i=iterations, d=dimensions',
          memoryRequirements: 'Low - scales linearly with data size',
          optimalDataSize: '1K-1M records',
        },
        codeImplementation: this.generateKMeansImplementation(numericalColumns),
        evaluationMetrics: ['Silhouette Score', 'Davies-Bouldin Index', 'Calinski-Harabasz Index', 'Inertia'],
        interpretationGuidance: [
          'Analyze cluster centroids to understand group characteristics',
          'Profile each cluster with business metrics',
          'Validate clusters make business sense',
          'Check cluster stability with different random seeds',
        ],
        scalabilityNotes: [
          'Use MiniBatch K-Means for datasets > 100K records',
          'Consider feature selection for high-dimensional data',
          'Parallel processing available for large datasets',
        ],
      });

      // DBSCAN recommendation
      recommendations.push({
        approach: 'clustering',
        algorithmName: 'DBSCAN',
        description: 'Density-based clustering that finds clusters of varying shapes and identifies outliers',
        businessValue: 'Anomaly detection, flexible cluster shapes, automatic outlier identification',
        technicalDetails: {
          inputFeatures: numericalColumns.slice(0, 6).map(c => c.columnName),
          preprocessing: ['StandardScaler normalization', 'Handle missing values'],
          hyperparameters: [
            {
              parameterName: 'eps',
              description: 'Maximum distance between samples in neighborhood',
              defaultValue: 0.5,
              recommendedRange: 'Use k-distance graph to determine',
              tuningStrategy: 'Grid search or k-distance analysis',
              importance: 'critical',
            },
            {
              parameterName: 'min_samples',
              description: 'Minimum samples in neighborhood to form cluster',
              defaultValue: 5,
              recommendedRange: '2 * dimensions',
              tuningStrategy: 'Start with 2*dimensions, adjust based on results',
              importance: 'critical',
            },
          ],
          computationalComplexity: 'O(n log n) with spatial indexing',
          memoryRequirements: 'Moderate - requires distance matrix',
          optimalDataSize: '1K-100K records',
        },
        codeImplementation: this.generateDBSCANImplementation(numericalColumns),
        evaluationMetrics: ['Silhouette Score', 'Number of clusters found', 'Noise points ratio'],
        interpretationGuidance: [
          'Noise points (label -1) are potential outliers',
          'Clusters can have irregular shapes',
          'No need to specify number of clusters in advance',
        ],
        scalabilityNotes: [
          'Memory usage increases with dataset size',
          'Consider sampling for very large datasets',
          'Use approximate nearest neighbor algorithms for speedup',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate dimensionality reduction recommendations
   */
  private generateDimensionalityReductionRecommendations(
    numericalColumns: any[],
  ): UnsupervisedLearningRecommendation[] {
    const recommendations: UnsupervisedLearningRecommendation[] = [];

    // PCA recommendation
    recommendations.push({
      approach: 'dimensionality_reduction',
      algorithmName: 'Principal Component Analysis (PCA)',
      description: 'Linear dimensionality reduction using orthogonal transformation',
      businessValue: 'Feature reduction, visualization, noise reduction, data compression',
      technicalDetails: {
        inputFeatures: numericalColumns.map(c => c.columnName),
        preprocessing: ['StandardScaler normalization', 'Handle missing values'],
        hyperparameters: [
          {
            parameterName: 'n_components',
            description: 'Number of components to keep',
            defaultValue: 'auto',
            recommendedRange: 'Explain 95% of variance',
            tuningStrategy: 'Cumulative explained variance analysis',
            importance: 'critical',
          },
        ],
        computationalComplexity: 'O(n * d^2) where n=samples, d=dimensions',
        memoryRequirements: 'Moderate - requires covariance matrix',
        optimalDataSize: '1K-1M records',
      },
      codeImplementation: this.generatePCAImplementation(numericalColumns),
      evaluationMetrics: ['Explained Variance Ratio', 'Cumulative Variance Explained'],
      interpretationGuidance: [
        'Components are linear combinations of original features',
        'First component explains most variance',
        'Use feature loadings to interpret components',
      ],
      scalabilityNotes: [
        'Incremental PCA available for large datasets',
        'Randomized PCA for faster computation',
        'Sparse PCA for interpretable components',
      ],
    });

    // t-SNE recommendation (for visualization)
    if (numericalColumns.length >= 3) {
      recommendations.push({
        approach: 'dimensionality_reduction',
        algorithmName: 't-SNE',
        description: 'Non-linear dimensionality reduction for visualization',
        businessValue: 'Data visualization, cluster visualization, pattern discovery',
        technicalDetails: {
          inputFeatures: numericalColumns.slice(0, 10).map(c => c.columnName),
          preprocessing: ['StandardScaler normalization', 'Handle missing values', 'Consider PCA preprocessing'],
          hyperparameters: [
            {
              parameterName: 'perplexity',
              description: 'Balance attention between local and global aspects',
              defaultValue: 30,
              recommendedRange: '5-50 (depends on dataset size)',
              tuningStrategy: 'Try multiple values, visualize results',
              importance: 'critical',
            },
            {
              parameterName: 'n_iter',
              description: 'Number of iterations for optimization',
              defaultValue: 1000,
              recommendedRange: '1000-5000',
              tuningStrategy: 'Increase until convergence',
              importance: 'important',
            },
          ],
          computationalComplexity: 'O(n^2) - computationally expensive',
          memoryRequirements: 'High - quadratic with number of samples',
          optimalDataSize: '100-10K records (sample larger datasets)',
        },
        codeImplementation: this.generateTSNEImplementation(numericalColumns),
        evaluationMetrics: ['Visual clustering quality', 'KL divergence', 'Trustworthiness'],
        interpretationGuidance: [
          'Use primarily for visualization, not feature extraction',
          'Distances in t-SNE space may not reflect original distances',
          'Multiple runs may produce different results',
        ],
        scalabilityNotes: [
          'Sample large datasets to <10K records',
          'Use PCA preprocessing for high dimensions',
          'Consider UMAP as faster alternative',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate association mining recommendations
   */
  private generateAssociationMiningRecommendations(
    categoricalColumns: any[],
  ): UnsupervisedLearningRecommendation[] {
    const recommendations: UnsupervisedLearningRecommendation[] = [];

    recommendations.push({
      approach: 'association_mining',
      algorithmName: 'Apriori Algorithm',
      description: 'Find frequent itemsets and association rules in categorical data',
      businessValue: 'Market basket analysis, recommendation systems, cross-selling opportunities',
      technicalDetails: {
        inputFeatures: categoricalColumns.filter(c => c.uniqueValues <= 100).map(c => c.columnName),
        preprocessing: ['One-hot encoding', 'Handle missing values', 'Binary transformation'],
        hyperparameters: [
          {
            parameterName: 'min_support',
            description: 'Minimum support threshold for frequent itemsets',
            defaultValue: 0.01,
            recommendedRange: '0.001-0.1',
            tuningStrategy: 'Start high, lower until meaningful patterns emerge',
            importance: 'critical',
          },
          {
            parameterName: 'min_confidence',
            description: 'Minimum confidence for association rules',
            defaultValue: 0.5,
            recommendedRange: '0.3-0.9',
            tuningStrategy: 'Domain-specific threshold selection',
            importance: 'critical',
          },
        ],
        computationalComplexity: 'Exponential in worst case, depends on data density',
        memoryRequirements: 'High - stores all frequent itemsets',
        optimalDataSize: '1K-100K transactions',
      },
      codeImplementation: this.generateAprioriImplementation(categoricalColumns),
      evaluationMetrics: ['Support', 'Confidence', 'Lift', 'Conviction'],
      interpretationGuidance: [
        'High lift values indicate strong associations',
        'Support shows frequency of itemset occurrence',
        'Confidence measures rule reliability',
      ],
      scalabilityNotes: [
        'Use FP-Growth for larger datasets',
        'Sample data if memory constraints exist',
        'Filter rare items to improve performance',
      ],
    });

    return recommendations;
  }

  /**
   * Generate anomaly detection recommendations
   */
  private generateAnomalyDetectionRecommendations(
    numericalColumns: any[],
  ): UnsupervisedLearningRecommendation[] {
    const recommendations: UnsupervisedLearningRecommendation[] = [];

    recommendations.push({
      approach: 'anomaly_detection',
      algorithmName: 'Isolation Forest',
      description: 'Unsupervised anomaly detection using random forest principles',
      businessValue: 'Fraud detection, quality control, outlier identification, system monitoring',
      technicalDetails: {
        inputFeatures: numericalColumns.map(c => c.columnName),
        preprocessing: ['Handle missing values', 'Optional: StandardScaler'],
        hyperparameters: [
          {
            parameterName: 'contamination',
            description: 'Expected proportion of outliers',
            defaultValue: 0.1,
            recommendedRange: '0.01-0.2',
            tuningStrategy: 'Domain knowledge or exploratory analysis',
            importance: 'critical',
          },
          {
            parameterName: 'n_estimators',
            description: 'Number of isolation trees',
            defaultValue: 100,
            recommendedRange: '50-200',
            tuningStrategy: 'Balance performance vs accuracy',
            importance: 'important',
          },
        ],
        computationalComplexity: 'O(n log n) for training, O(log n) for prediction',
        memoryRequirements: 'Low - tree-based algorithm',
        optimalDataSize: '1K-1M records',
      },
      codeImplementation: this.generateIsolationForestImplementation(numericalColumns),
      evaluationMetrics: ['Anomaly Score', 'Precision', 'Recall', 'F1-Score (if labels available)'],
      interpretationGuidance: [
        'Negative scores indicate anomalies',
        'Score magnitude indicates anomaly strength',
        'Validate results with domain expertise',
      ],
      scalabilityNotes: [
        'Scales well to large datasets',
        'Parallel training available',
        'Real-time scoring possible',
      ],
    });

    return recommendations;
  }

  /**
   * Generate AutoML platform recommendations
   */
  private async generateAutoMLRecommendations(
    columns: any[],
    qualityScore: number,
    fileSizeMB: number,
  ): Promise<AutoMLRecommendation[]> {
    const recommendations: AutoMLRecommendation[] = [];
    
    const numericalColumns = columns.filter(col => 
      col.detectedDataType === 'numerical_float' || col.detectedDataType === 'numerical_integer'
    );
    const categoricalColumns = columns.filter(col =>
      col.detectedDataType === 'categorical'
    );
    const highCardinalityColumns = categoricalColumns.filter(col => col.uniqueValues > 50);

    // H2O AutoML recommendation
    recommendations.push({
      platform: 'H2O_AutoML',
      suitabilityScore: this.calculateH2OSuitability(numericalColumns, categoricalColumns, fileSizeMB),
      strengths: [
        'Excellent handling of mixed data types',
        'Automatic feature engineering',
        'Built-in model interpretation',
        'Scalable to large datasets',
        'Free and open source',
      ],
      limitations: [
        'Requires Java runtime',
        'Learning curve for beginners',
        'Limited deep learning options',
      ],
      dataRequirements: [
        'Minimum 1000 rows recommended',
        'Handles missing values automatically',
        'Automatic encoding of categorical variables',
      ],
      estimatedCost: 'Free (open source)',
      setupComplexity: 'moderate',
      codeExample: this.generateH2OAutoMLCode(columns),
      configurationRecommendations: {
        max_models: fileSizeMB > 100 ? 10 : 20,
        seed: 42,
        exclude_algos: highCardinalityColumns.length > 0 ? ['DeepLearning'] : [],
        max_runtime_secs: fileSizeMB > 50 ? 7200 : 3600,
        stopping_metric: 'AUTO',
        stopping_tolerance: 0.001,
      },
    });

    // AutoGluon recommendation
    recommendations.push({
      platform: 'AutoGluon',
      suitabilityScore: this.calculateAutoGluonSuitability(numericalColumns, categoricalColumns, fileSizeMB),
      strengths: [
        'State-of-the-art ensemble methods',
        'Excellent text feature handling',
        'Multi-modal learning capabilities',
        'Neural network options',
        'Easy to use Python API',
      ],
      limitations: [
        'Higher computational requirements',
        'Longer training times',
        'Memory intensive',
      ],
      dataRequirements: [
        'Works well with smaller datasets',
        'Automatic feature preprocessing',
        'Handles text and categorical data excellently',
      ],
      estimatedCost: 'Free (open source)',
      setupComplexity: 'simple',
      codeExample: this.generateAutoGluonCode(columns),
      configurationRecommendations: {
        presets: fileSizeMB > 50 ? 'medium_quality_faster_train' : 'best_quality',
        time_limit: fileSizeMB > 50 ? 3600 : 7200,
        eval_metric: 'auto',
        auto_stack: true,
      },
    });

    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  /**
   * Generate feature engineering recipes
   */
  private async generateFeatureEngineeringRecipes(
    columns: any[],
    edaResult: EDAResult,
    engineeringResult: EngineeringResult,
  ): Promise<FeatureEngineeringRecipe[]> {
    const recipes: FeatureEngineeringRecipe[] = [];

    // Temporal feature engineering
    const dateColumns = columns.filter(col => 
      col.detectedDataType === 'date_time' || 
      col.columnName.toLowerCase().includes('date')
    );
    
    if (dateColumns.length > 0) {
      recipes.push({
        recipeName: 'Temporal Feature Extraction',
        description: 'Extract meaningful time-based features from date columns',
        applicableColumns: dateColumns.map(c => c.columnName),
        businessRationale: 'Time-based patterns often drive business outcomes (seasonality, trends, cycles)',
        codeImplementation: this.generateTemporalFeatureCode(dateColumns),
        expectedImpact: 'Improved model performance through temporal pattern recognition',
        prerequisites: ['Valid date format', 'Reasonable date range'],
        riskFactors: ['Time zone considerations', 'Missing date handling'],
      });
    }

    // Geographic feature engineering
    const countryColumns = columns.filter(col => 
      col.columnName.toLowerCase().includes('country') ||
      col.columnName.toLowerCase().includes('region')
    );
    
    if (countryColumns.length > 0) {
      recipes.push({
        recipeName: 'Geographic Feature Enrichment',
        description: 'Create derived geographic features from location data',
        applicableColumns: countryColumns.map(c => c.columnName),
        businessRationale: 'Geographic patterns influence customer behavior, market dynamics, and operational efficiency',
        codeImplementation: this.generateGeographicFeatureCode(countryColumns),
        expectedImpact: 'Enhanced geographic insights and regional pattern recognition',
        prerequisites: ['Standardized country/region names', 'Geographic reference data'],
        riskFactors: ['Data quality in geographic fields', 'Changing geographic boundaries'],
      });
    }

    // Text feature engineering
    const textColumns = columns.filter(col => 
      col.detectedDataType === 'text_general' || col.detectedDataType === 'text_address' ||
      (col.detectedDataType === 'categorical' && col.uniqueValues > 100)
    );
    
    if (textColumns.length > 0) {
      recipes.push({
        recipeName: 'Text Feature Engineering',
        description: 'Extract patterns and features from high-cardinality text columns',
        applicableColumns: textColumns.map(c => c.columnName),
        businessRationale: 'Text data contains rich patterns that can improve predictive accuracy',
        codeImplementation: this.generateTextFeatureCode(textColumns),
        expectedImpact: 'Better handling of unstructured text information',
        prerequisites: ['Clean text data', 'Consistent formatting'],
        riskFactors: ['High dimensionality', 'Overfitting risk'],
      });
    }

    return recipes;
  }

  /**
   * Generate deployment considerations
   */
  private async generateDeploymentConsiderations(
    columns: any[],
    fileSizeMB: number,
  ): Promise<DeploymentConsideration[]> {
    const considerations: DeploymentConsideration[] = [];

    // Data pipeline considerations
    considerations.push({
      aspect: 'data_pipeline',
      requirements: [
        'Real-time preprocessing for all input features',
        'Encoding dictionaries for categorical variables',
        'Missing value imputation strategies',
        'Data validation and quality checks',
      ],
      recommendations: [
        'Use pipeline objects for consistent preprocessing',
        'Version control preprocessing steps',
        'Implement data quality monitoring',
        'Cache frequently used transformations',
      ],
      riskFactors: [
        'Data drift affecting preprocessing',
        'Missing values in production data',
        'Categorical values not seen in training',
      ],
      codeTemplates: this.generateDataPipelineTemplates(columns),
    });

    // Monitoring considerations
    considerations.push({
      aspect: 'monitoring',
      requirements: [
        `Monitor distribution drift for ${columns.length} features`,
        'Track prediction confidence scores',
        'Alert on unusual input patterns',
        'Performance metric tracking',
      ],
      recommendations: [
        'Implement statistical drift detection',
        'Set up automated retraining triggers',
        'Monitor model performance degradation',
        'Log all predictions for audit trail',
      ],
      riskFactors: [
        'Concept drift affecting model accuracy',
        'Data quality degradation over time',
        'Unexpected input combinations',
      ],
    });

    // API schema considerations
    considerations.push({
      aspect: 'api_schema',
      requirements: [
        'Input validation for all features',
        'Standardized response format',
        'Error handling for invalid inputs',
        'Documentation and examples',
      ],
      recommendations: [
        'Use JSON schema validation',
        'Provide clear error messages',
        'Include confidence scores in responses',
        'Support batch and single predictions',
      ],
      riskFactors: [
        'Breaking changes in API schema',
        'Performance bottlenecks',
        'Security vulnerabilities',
      ],
      codeTemplates: this.generateAPISchemaTemplates(columns),
    });

    return considerations;
  }

  // Helper methods for code generation
  private generateClusteringCode(numericalColumns: any[], categoricalColumns: any[]): string {
    return `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import silhouette_score
import pandas as pd

# Prepare features
features = ${JSON.stringify([...numericalColumns.slice(0, 4).map(c => c.columnName), ...categoricalColumns.slice(0, 2).map(c => c.columnName)])}

# Encode categorical variables
le = LabelEncoder()
df_encoded = df.copy()
for col in ${JSON.stringify(categoricalColumns.slice(0, 2).map(c => c.columnName))}:
    df_encoded[col + '_encoded'] = le.fit_transform(df[col].astype(str))

# Scale numerical features
scaler = StandardScaler()
X = scaler.fit_transform(df_encoded[features])

# Find optimal number of clusters
silhouette_scores = []
K_range = range(2, 9)
for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42)
    cluster_labels = kmeans.fit_predict(X)
    silhouette_avg = silhouette_score(X, cluster_labels)
    silhouette_scores.append(silhouette_avg)

# Train final model with optimal K
optimal_k = K_range[silhouette_scores.index(max(silhouette_scores))]
kmeans = KMeans(n_clusters=optimal_k, random_state=42)
df['customer_segment'] = kmeans.fit_predict(X)`;
  }

  private generateGeographicClusteringCode(): string {
    return `import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import StandardScaler

# Aggregate metrics by country
country_metrics = df.groupby('country').agg({
    'customer_id': 'count',
    'company': 'nunique'
}).rename(columns={'customer_id': 'customer_count', 'company': 'company_count'})

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(country_metrics)

# Hierarchical clustering
clustering = AgglomerativeClustering(n_clusters=3, linkage='ward')
country_metrics['market_tier'] = clustering.fit_predict(X_scaled)

# Map back to original data
df = df.merge(country_metrics[['market_tier']], left_on='country', right_index=True)`;
  }

  private generateAnomalyDetectionCode(numericalColumns: any[]): string {
    return `from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Prepare numerical features
features = ${JSON.stringify(numericalColumns.map(c => c.columnName))}
X = df[features].fillna(df[features].median())

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Fit Isolation Forest
iso_forest = IsolationForest(contamination=0.1, random_state=42)
df['anomaly_score'] = iso_forest.fit_predict(X_scaled)
df['anomaly_score_raw'] = iso_forest.decision_function(X_scaled)

# Convert to positive scale (higher = more anomalous)
df['anomaly_score_normalized'] = (df['anomaly_score_raw'] - df['anomaly_score_raw'].min()) / (df['anomaly_score_raw'].max() - df['anomaly_score_raw'].min())`;
  }

  private generateDataQualityFlagCode(numericalColumns: any[]): string {
    return `from sklearn.ensemble import IsolationForest

# Use anomaly detection for data quality assessment
features = ${JSON.stringify(numericalColumns.map(c => c.columnName))}
X = df[features].fillna(df[features].median())

iso_forest = IsolationForest(contamination=0.05, random_state=42)
anomaly_scores = iso_forest.decision_function(X)

# Create binary quality flag (1 = good quality, 0 = potential issues)
threshold = np.percentile(anomaly_scores, 5)  # Bottom 5% flagged as quality issues
df['data_quality_flag'] = (anomaly_scores > threshold).astype(int)`;
  }

  private generateEmailDomainQualityCode(emailColumn: string): string {
    return `import re

def classify_email_domain(email):
    if pd.isna(email):
        return 'unknown'
    
    # Extract domain
    domain_match = re.search(r'@([^.]+\\.[^.]+)$', str(email).lower())
    if not domain_match:
        return 'invalid'
    
    domain = domain_match.group(1)
    
    # Personal email providers
    personal_domains = {
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'aol.com', 'icloud.com', 'live.com', 'msn.com'
    }
    
    if domain in personal_domains:
        return 'personal'
    else:
        return 'corporate'

df['email_domain_quality'] = df['${emailColumn}'].apply(classify_email_domain)
df['is_corporate_email'] = (df['email_domain_quality'] == 'corporate').astype(int)`;
  }

  private generateProfileCompletenessCode(columns: any[]): string {
    const importantColumns = columns.slice(0, 8).map(c => c.columnName);
    return `# Define important fields and their weights
important_fields = ${JSON.stringify(importantColumns)}
field_weights = {field: 1.0 for field in important_fields}

def calculate_completeness_score(row):
    total_weight = sum(field_weights.values())
    weighted_score = 0
    
    for field, weight in field_weights.items():
        if pd.notna(row[field]) and str(row[field]).strip() != '':
            weighted_score += weight
    
    return (weighted_score / total_weight) * 100

df['profile_completeness_score'] = df.apply(calculate_completeness_score, axis=1)`;
  }

  private generateCustomerLifetimeCode(dateColumn: string): string {
    return `import pandas as pd
from datetime import datetime

# Convert to datetime
df['${dateColumn}'] = pd.to_datetime(df['${dateColumn}'])

# Calculate customer lifetime in days
reference_date = pd.Timestamp.now()
df['customer_lifetime_days'] = (reference_date - df['${dateColumn}']).dt.days

# Handle negative values (future dates)
df['customer_lifetime_days'] = df['customer_lifetime_days'].clip(lower=0)`;
  }

  private generateSeasonalityCode(dateColumn: string): string {
    return `# Extract temporal features
df['${dateColumn}'] = pd.to_datetime(df['${dateColumn}'])
df['subscription_quarter'] = df['${dateColumn}'].dt.quarter
df['subscription_month'] = df['${dateColumn}'].dt.month
df['subscription_dayofweek'] = df['${dateColumn}'].dt.dayofweek
df['is_weekend_signup'] = df['subscription_dayofweek'].isin([5, 6]).astype(int)`;
  }

  private generateCategoryGroupingCode(columnName: string): string {
    return `# Group high-cardinality categories
def group_categories(series, top_n=10):
    value_counts = series.value_counts()
    top_categories = value_counts.head(top_n).index.tolist()
    
    def categorize(value):
        if pd.isna(value):
            return 'Missing'
        elif value in top_categories:
            return value
        else:
            return 'Other'
    
    return series.apply(categorize)

df['${columnName}_category'] = group_categories(df['${columnName}'], top_n=8)`;
  }

  private generateKMeansImplementation(numericalColumns: any[]): CodeImplementation {
    return {
      framework: 'scikit-learn',
      importStatements: [
        'from sklearn.cluster import KMeans',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.metrics import silhouette_score',
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt'
      ],
      preprocessingCode: [
        `features = ${JSON.stringify(numericalColumns.slice(0, 6).map(c => c.columnName))}`,
        'X = df[features].fillna(df[features].median())',
        'scaler = StandardScaler()',
        'X_scaled = scaler.fit_transform(X)'
      ],
      mainImplementation: [
        '# Find optimal number of clusters using elbow method',
        'inertias = []',
        'silhouette_scores = []',
        'K_range = range(2, 11)',
        '',
        'for k in K_range:',
        '    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)',
        '    cluster_labels = kmeans.fit_predict(X_scaled)',
        '    inertias.append(kmeans.inertia_)',
        '    silhouette_scores.append(silhouette_score(X_scaled, cluster_labels))',
        '',
        '# Select optimal K based on silhouette score',
        'optimal_k = K_range[np.argmax(silhouette_scores)]',
        '',
        '# Train final model',
        'final_kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)',
        'cluster_labels = final_kmeans.fit_predict(X_scaled)',
        'df["cluster"] = cluster_labels'
      ],
      evaluationCode: [
        'silhouette_avg = silhouette_score(X_scaled, cluster_labels)',
        'print(f"Silhouette Score: {silhouette_avg:.3f}")',
        '',
        '# Cluster analysis',
        'cluster_summary = df.groupby("cluster")[features].mean()',
        'print("\\nCluster Centroids:")',
        'print(cluster_summary)'
      ],
      visualizationCode: [
        'plt.figure(figsize=(12, 4))',
        '',
        '# Elbow curve',
        'plt.subplot(1, 2, 1)',
        'plt.plot(K_range, inertias, "bo-")',
        'plt.xlabel("Number of Clusters (K)")',
        'plt.ylabel("Inertia")',
        'plt.title("Elbow Method For Optimal K")',
        '',
        '# Silhouette scores',
        'plt.subplot(1, 2, 2)',
        'plt.plot(K_range, silhouette_scores, "ro-")',
        'plt.xlabel("Number of Clusters (K)")',
        'plt.ylabel("Silhouette Score")',
        'plt.title("Silhouette Analysis")',
        'plt.tight_layout()',
        'plt.show()'
      ]
    };
  }

  private generateDBSCANImplementation(numericalColumns: any[]): CodeImplementation {
    return {
      framework: 'scikit-learn',
      importStatements: [
        'from sklearn.cluster import DBSCAN',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.metrics import silhouette_score',
        'from sklearn.neighbors import NearestNeighbors',
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt'
      ],
      preprocessingCode: [
        `features = ${JSON.stringify(numericalColumns.slice(0, 6).map(c => c.columnName))}`,
        'X = df[features].fillna(df[features].median())',
        'scaler = StandardScaler()',
        'X_scaled = scaler.fit_transform(X)'
      ],
      mainImplementation: [
        '# Determine optimal eps using k-distance graph',
        'k = 4  # Typically 2 * dimensions',
        'neigh = NearestNeighbors(n_neighbors=k)',
        'neigh.fit(X_scaled)',
        'distances, indices = neigh.kneighbors(X_scaled)',
        'distances = np.sort(distances[:, k-1], axis=0)',
        '',
        '# Use knee point as eps (simplified approach)',
        'eps = np.percentile(distances, 90)',
        '',
        '# Apply DBSCAN',
        'dbscan = DBSCAN(eps=eps, min_samples=k)',
        'cluster_labels = dbscan.fit_predict(X_scaled)',
        'df["cluster"] = cluster_labels'
      ],
      evaluationCode: [
        'n_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)',
        'n_noise = list(cluster_labels).count(-1)',
        'print(f"Number of clusters: {n_clusters}")',
        'print(f"Number of noise points: {n_noise}")',
        '',
        'if n_clusters > 1:',
        '    silhouette_avg = silhouette_score(X_scaled, cluster_labels)',
        '    print(f"Silhouette Score: {silhouette_avg:.3f}")'
      ],
      visualizationCode: [
        'plt.figure(figsize=(10, 4))',
        '',
        '# K-distance graph',
        'plt.subplot(1, 2, 1)',
        'plt.plot(distances)',
        'plt.xlabel("Points")',
        'plt.ylabel("4th Nearest Neighbor Distance")',
        'plt.title("K-Distance Graph")',
        'plt.axhline(y=eps, color="r", linestyle="--", label=f"eps={eps:.3f}")',
        'plt.legend()',
        '',
        '# Cluster distribution',
        'plt.subplot(1, 2, 2)',
        'unique, counts = np.unique(cluster_labels, return_counts=True)',
        'plt.bar(unique, counts)',
        'plt.xlabel("Cluster Label (-1 = Noise)")',
        'plt.ylabel("Count")',
        'plt.title("Cluster Distribution")',
        'plt.tight_layout()',
        'plt.show()'
      ]
    };
  }

  private generatePCAImplementation(numericalColumns: any[]): CodeImplementation {
    return {
      framework: 'scikit-learn',
      importStatements: [
        'from sklearn.decomposition import PCA',
        'from sklearn.preprocessing import StandardScaler',
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt'
      ],
      preprocessingCode: [
        `features = ${JSON.stringify(numericalColumns.map(c => c.columnName))}`,
        'X = df[features].fillna(df[features].median())',
        'scaler = StandardScaler()',
        'X_scaled = scaler.fit_transform(X)'
      ],
      mainImplementation: [
        '# Fit PCA to determine optimal number of components',
        'pca_full = PCA()',
        'pca_full.fit(X_scaled)',
        '',
        '# Find number of components for 95% variance',
        'cumsum = np.cumsum(pca_full.explained_variance_ratio_)',
        'n_components = np.argmax(cumsum >= 0.95) + 1',
        '',
        '# Apply PCA with optimal components',
        'pca = PCA(n_components=n_components)',
        'X_pca = pca.fit_transform(X_scaled)',
        '',
        '# Create component dataframe',
        'pca_columns = [f"PC{i+1}" for i in range(n_components)]',
        'df_pca = pd.DataFrame(X_pca, columns=pca_columns, index=df.index)',
        'df = pd.concat([df, df_pca], axis=1)'
      ],
      evaluationCode: [
        'print(f"Original features: {len(features)}")',
        'print(f"PCA components: {n_components}")',
        'print(f"Variance explained: {cumsum[n_components-1]:.3f}")',
        '',
        '# Feature importance in components',
        'feature_importance = pd.DataFrame(',
        '    pca.components_[:3].T,',
        '    columns=[f"PC{i+1}" for i in range(min(3, n_components))],',
        '    index=features',
        ')',
        'print("\\nTop features by component:")',
        'print(feature_importance.abs().sort_values("PC1", ascending=False).head())'
      ],
      visualizationCode: [
        'plt.figure(figsize=(12, 4))',
        '',
        '# Explained variance',
        'plt.subplot(1, 2, 1)',
        'plt.plot(range(1, len(pca_full.explained_variance_ratio_) + 1),',
        '         np.cumsum(pca_full.explained_variance_ratio_), "bo-")',
        'plt.axhline(y=0.95, color="r", linestyle="--", label="95% Variance")',
        'plt.xlabel("Number of Components")',
        'plt.ylabel("Cumulative Explained Variance")',
        'plt.title("PCA Explained Variance")',
        'plt.legend()',
        '',
        '# First two components scatter',
        'if n_components >= 2:',
        '    plt.subplot(1, 2, 2)',
        '    plt.scatter(X_pca[:, 0], X_pca[:, 1], alpha=0.6)',
        '    plt.xlabel(f"PC1 ({pca.explained_variance_ratio_[0]:.2%} variance)")',
        '    plt.ylabel(f"PC2 ({pca.explained_variance_ratio_[1]:.2%} variance)")',
        '    plt.title("PCA Projection")',
        '',
        'plt.tight_layout()',
        'plt.show()'
      ]
    };
  }

  private generateTSNEImplementation(numericalColumns: any[]): CodeImplementation {
    return {
      framework: 'scikit-learn',
      importStatements: [
        'from sklearn.manifold import TSNE',
        'from sklearn.preprocessing import StandardScaler',
        'from sklearn.decomposition import PCA',
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt'
      ],
      preprocessingCode: [
        `features = ${JSON.stringify(numericalColumns.slice(0, 10).map(c => c.columnName))}`,
        'X = df[features].fillna(df[features].median())',
        'scaler = StandardScaler()',
        'X_scaled = scaler.fit_transform(X)',
        '',
        '# Pre-reduce dimensions with PCA if high-dimensional',
        'if X_scaled.shape[1] > 50:',
        '    pca = PCA(n_components=50)',
        '    X_scaled = pca.fit_transform(X_scaled)'
      ],
      mainImplementation: [
        '# Apply t-SNE with different perplexity values',
        'perplexities = [5, 30, 50]',
        'tsne_results = {}',
        '',
        'for perp in perplexities:',
        '    if len(X_scaled) < perp * 3:  # Skip if insufficient data',
        '        continue',
        '        ',
        '    tsne = TSNE(n_components=2, perplexity=perp, ',
        '                random_state=42, n_iter=1000)',
        '    X_tsne = tsne.fit_transform(X_scaled)',
        '    ',
        '    tsne_results[perp] = {',
        '        "coordinates": X_tsne,',
        '        "kl_divergence": tsne.kl_divergence_',
        '    }',
        '',
        '# Use best perplexity result',
        'best_perp = min(tsne_results.keys())',
        'df["tsne_x"] = tsne_results[best_perp]["coordinates"][:, 0]',
        'df["tsne_y"] = tsne_results[best_perp]["coordinates"][:, 1]'
      ],
      evaluationCode: [
        'for perp, result in tsne_results.items():',
        '    print(f"Perplexity {perp}: KL divergence = {result[\\"kl_divergence\\"]:.3f}")',
        '',
        'print(f"\\nUsing perplexity {best_perp} for final embedding")'
      ],
      visualizationCode: [
        'fig, axes = plt.subplots(1, len(tsne_results), figsize=(5*len(tsne_results), 4))',
        'if len(tsne_results) == 1:',
        '    axes = [axes]',
        '',
        'for i, (perp, result) in enumerate(tsne_results.items()):',
        '    coords = result["coordinates"]',
        '    axes[i].scatter(coords[:, 0], coords[:, 1], alpha=0.6)',
        '    axes[i].set_title(f"t-SNE (perplexity={perp})")',
        '    axes[i].set_xlabel("t-SNE 1")',
        '    axes[i].set_ylabel("t-SNE 2")',
        '',
        'plt.tight_layout()',
        'plt.show()'
      ]
    };
  }

  private generateAprioriImplementation(categoricalColumns: any[]): CodeImplementation {
    return {
      framework: 'pandas',
      importStatements: [
        'import pandas as pd',
        'from itertools import combinations',
        'from collections import defaultdict',
        'import numpy as np'
      ],
      preprocessingCode: [
        `# Select categorical columns with reasonable cardinality`,
        `cat_columns = ${JSON.stringify(categoricalColumns.filter(c => c.uniqueValues <= 100).map(c => c.columnName))}`,
        '',
        '# Create transaction format',
        'transactions = []',
        'for idx, row in df.iterrows():',
        '    transaction = []',
        '    for col in cat_columns:',
        '        if pd.notna(row[col]):',
        '            transaction.append(f"{col}_{row[col]}")',
        '    transactions.append(transaction)'
      ],
      mainImplementation: [
        '# Simplified Apriori implementation',
        'def get_support(itemset, transactions):',
        '    count = 0',
        '    for transaction in transactions:',
        '        if set(itemset).issubset(set(transaction)):',
        '            count += 1',
        '    return count / len(transactions)',
        '',
        '# Find frequent items',
        'min_support = 0.01',
        'all_items = set(item for transaction in transactions for item in transaction)',
        '',
        '# 1-itemsets',
        'frequent_1 = {}',
        'for item in all_items:',
        '    support = get_support([item], transactions)',
        '    if support >= min_support:',
        '        frequent_1[frozenset([item])] = support',
        '',
        '# 2-itemsets',
        'frequent_2 = {}',
        'for item1, item2 in combinations(frequent_1.keys(), 2):',
        '    itemset = item1.union(item2)',
        '    support = get_support(list(itemset), transactions)',
        '    if support >= min_support:',
        '        frequent_2[itemset] = support',
        '',
        '# Generate association rules',
        'min_confidence = 0.5',
        'rules = []',
        '',
        'for itemset, support in frequent_2.items():',
        '    items = list(itemset)',
        '    if len(items) == 2:',
        '        # A -> B',
        '        antecedent = frozenset([items[0]])',
        '        consequent = frozenset([items[1]])',
        '        confidence = support / frequent_1[antecedent]',
        '        lift = confidence / frequent_1[consequent]',
        '        ',
        '        if confidence >= min_confidence:',
        '            rules.append({',
        '                "antecedent": items[0],',
        '                "consequent": items[1],',
        '                "support": support,',
        '                "confidence": confidence,',
        '                "lift": lift',
        '            })',
        '',
        'rules_df = pd.DataFrame(rules)',
        'rules_df = rules_df.sort_values("lift", ascending=False)'
      ],
      evaluationCode: [
        'print(f"Frequent 1-itemsets: {len(frequent_1)}")',
        'print(f"Frequent 2-itemsets: {len(frequent_2)}")',
        'print(f"Association rules found: {len(rules)}")',
        '',
        'if len(rules) > 0:',
        '    print("\\nTop association rules by lift:")',
        '    print(rules_df.head(10))'
      ]
    };
  }

  private generateIsolationForestImplementation(numericalColumns: any[]): CodeImplementation {
    return {
      framework: 'scikit-learn',
      importStatements: [
        'from sklearn.ensemble import IsolationForest',
        'from sklearn.preprocessing import StandardScaler',
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt'
      ],
      preprocessingCode: [
        `features = ${JSON.stringify(numericalColumns.map(c => c.columnName))}`,
        'X = df[features].fillna(df[features].median())',
        '',
        '# Optional: scale features (not required for Isolation Forest)',
        '# scaler = StandardScaler()',
        '# X_scaled = scaler.fit_transform(X)'
      ],
      mainImplementation: [
        '# Fit Isolation Forest',
        'contamination = 0.1  # Expected proportion of anomalies',
        'iso_forest = IsolationForest(',
        '    contamination=contamination,',
        '    random_state=42,',
        '    n_estimators=100',
        ')',
        '',
        '# Predict anomalies (-1 for anomaly, 1 for normal)',
        'anomaly_labels = iso_forest.fit_predict(X)',
        'anomaly_scores = iso_forest.decision_function(X)',
        '',
        '# Add results to dataframe',
        'df["anomaly_label"] = anomaly_labels',
        'df["anomaly_score"] = anomaly_scores',
        '',
        '# Convert scores to 0-1 scale (higher = more anomalous)',
        'df["anomaly_score_norm"] = (',
        '    (df["anomaly_score"] - df["anomaly_score"].min()) /',
        '    (df["anomaly_score"].max() - df["anomaly_score"].min())',
        ')',
        'df["anomaly_score_norm"] = 1 - df["anomaly_score_norm"]  # Flip scale'
      ],
      evaluationCode: [
        'n_anomalies = (anomaly_labels == -1).sum()',
        'anomaly_rate = n_anomalies / len(df)',
        'print(f"Anomalies detected: {n_anomalies} ({anomaly_rate:.2%})")',
        '',
        '# Top anomalies',
        'top_anomalies = df[df["anomaly_label"] == -1].nlargest(5, "anomaly_score_norm")',
        'print("\\nTop 5 anomalies:")',
        'print(top_anomalies[features + ["anomaly_score_norm"]])'
      ],
      visualizationCode: [
        'plt.figure(figsize=(12, 4))',
        '',
        '# Anomaly score distribution',
        'plt.subplot(1, 2, 1)',
        'plt.hist(df["anomaly_score_norm"], bins=30, alpha=0.7)',
        'plt.axvline(df[df["anomaly_label"] == -1]["anomaly_score_norm"].min(),',
        '           color="r", linestyle="--", label="Anomaly Threshold")',
        'plt.xlabel("Anomaly Score (Normalized)")',
        'plt.ylabel("Frequency")',
        'plt.title("Anomaly Score Distribution")',
        'plt.legend()',
        '',
        '# Feature comparison: normal vs anomalies',
        'if len(features) >= 2:',
        '    plt.subplot(1, 2, 2)',
        '    normal_points = df[df["anomaly_label"] == 1]',
        '    anomaly_points = df[df["anomaly_label"] == -1]',
        '    ',
        '    plt.scatter(normal_points[features[0]], normal_points[features[1]],',
        '               alpha=0.6, label="Normal", s=20)',
        '    plt.scatter(anomaly_points[features[0]], anomaly_points[features[1]],',
        '               alpha=0.8, label="Anomaly", s=50, color="red")',
        '    plt.xlabel(features[0])',
        '    plt.ylabel(features[1])',
        '    plt.title("Normal vs Anomalous Points")',
        '    plt.legend()',
        '',
        'plt.tight_layout()',
        'plt.show()'
      ]
    };
  }

  private generateH2OAutoMLCode(columns: any[]): string {
    return `import h2o
from h2o.automl import H2OAutoML

# Initialize H2O
h2o.init()

# Convert to H2O frame
h2o_df = h2o.H2OFrame(df)

# Define target variable (use one of the synthetic targets)
target = "customer_segment"  # Or any synthetic target you created
features = h2o_df.columns
features.remove(target)

# Split data
train, test = h2o_df.split_frame(ratios=[0.8], seed=42)

# Run AutoML
aml = H2OAutoML(
    max_models=20,
    seed=42,
    max_runtime_secs=3600,
    exclude_algos=["DeepLearning"],  # Exclude if high cardinality issues
    sort_metric="AUC"  # Adjust based on problem type
)

aml.train(x=features, y=target, training_frame=train)

# Get leaderboard
print(aml.leaderboard.head())

# Best model performance
best_model = aml.leader
performance = best_model.model_performance(test)
print(performance)`;
  }

  private generateAutoGluonCode(columns: any[]): string {
    return `from autogluon.tabular import TabularPredictor

# Prepare data with synthetic target
target = "customer_segment"  # Or any synthetic target you created

# Train AutoGluon model
predictor = TabularPredictor(
    label=target,
    eval_metric="accuracy",  # Adjust based on problem type
    path="./autogluon_models"
)

# Fit the model
predictor.fit(
    train_data=df,
    presets="best_quality",  # Options: fast, good, best
    time_limit=3600,  # 1 hour
    auto_stack=True
)

# Evaluate model
test_performance = predictor.evaluate(df_test)
print(f"Test performance: {test_performance}")

# Feature importance
feature_importance = predictor.feature_importance(df)
print("Feature importance:")
print(feature_importance.head(10))`;
  }

  private generateTemporalFeatureCode(dateColumns: any[]): string[] {
    return [
      `# Temporal feature engineering for ${dateColumns[0].columnName}`,
      `df['${dateColumns[0].columnName}'] = pd.to_datetime(df['${dateColumns[0].columnName}'])`,
      '',
      '# Extract temporal components',
      `df['year'] = df['${dateColumns[0].columnName}'].dt.year`,
      `df['month'] = df['${dateColumns[0].columnName}'].dt.month`,
      `df['quarter'] = df['${dateColumns[0].columnName}'].dt.quarter`,
      `df['day_of_week'] = df['${dateColumns[0].columnName}'].dt.dayofweek`,
      `df['day_of_year'] = df['${dateColumns[0].columnName}'].dt.dayofyear`,
      `df['week_of_year'] = df['${dateColumns[0].columnName}'].dt.isocalendar().week`,
      '',
      '# Business calendar features',
      `df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)`,
      `df['is_month_start'] = df['${dateColumns[0].columnName}'].dt.is_month_start.astype(int)`,
      `df['is_month_end'] = df['${dateColumns[0].columnName}'].dt.is_month_end.astype(int)`,
      `df['is_quarter_start'] = df['${dateColumns[0].columnName}'].dt.is_quarter_start.astype(int)`,
      `df['is_quarter_end'] = df['${dateColumns[0].columnName}'].dt.is_quarter_end.astype(int)`,
      '',
      '# Cyclical encoding for circular features',
      'df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)',
      'df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)',
      'df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)',
      'df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)',
    ];
  }

  private generateGeographicFeatureCode(countryColumns: any[]): string[] {
    return [
      `# Geographic feature engineering for ${countryColumns[0].columnName}`,
      '',
      '# Country-level aggregations',
      'country_stats = df.groupby("country").agg({',
      '    "customer_id": "count",',
      '    "company": "nunique"',
      '}).rename(columns={',
      '    "customer_id": "country_customer_count",',
      '    "company": "country_company_count"',
      '})',
      '',
      'df = df.merge(country_stats, on="country", how="left")',
      '',
      '# Customer density features',
      'df["customer_density_rank"] = df["country_customer_count"].rank(method="dense")',
      'df["is_high_density_country"] = (df["customer_density_rank"] > df["customer_density_rank"].quantile(0.8)).astype(int)',
      '',
      '# Geographic groupings (simplified example)',
      'developed_countries = ["USA", "Canada", "UK", "Germany", "France", "Japan", "Australia"]',
      'df["is_developed_country"] = df["country"].isin(developed_countries).astype(int)',
      '',
      '# Market size categories',
      'df["market_size"] = pd.cut(',
      '    df["country_customer_count"],',
      '    bins=[0, 10, 50, 200, float("inf")],',
      '    labels=["Small", "Medium", "Large", "Huge"]',
      ')',
    ];
  }

  private generateTextFeatureCode(textColumns: any[]): string[] {
    return [
      `# Text feature engineering for high-cardinality columns`,
      '',
      '# Length-based features',
      ...textColumns.map(col => `df['${col.columnName}_length'] = df['${col.columnName}'].str.len().fillna(0)`),
      '',
      '# Word count features',
      ...textColumns.map(col => `df['${col.columnName}_word_count'] = df['${col.columnName}'].str.split().str.len().fillna(0)`),
      '',
      '# Pattern-based features',
      ...textColumns.map(col => [
        `df['${col.columnName}_has_numbers'] = df['${col.columnName}'].str.contains(r'\\d', na=False).astype(int)`,
        `df['${col.columnName}_has_special_chars'] = df['${col.columnName}'].str.contains(r'[^a-zA-Z0-9\\s]', na=False).astype(int)`,
        `df['${col.columnName}_is_uppercase'] = df['${col.columnName}'].str.isupper().fillna(False).astype(int)`,
      ]).flat(),
      '',
      '# Frequency-based encoding',
      ...textColumns.map(col => [
        `${col.columnName}_counts = df['${col.columnName}'].value_counts()`,
        `df['${col.columnName}_frequency'] = df['${col.columnName}'].map(${col.columnName}_counts).fillna(0)`,
        `df['${col.columnName}_frequency_rank'] = df['${col.columnName}_frequency'].rank(method='dense')`,
      ]).flat(),
    ];
  }

  private generateDataPipelineTemplates(columns: any[]): string[] {
    return [
      '# Data pipeline template',
      'from sklearn.pipeline import Pipeline',
      'from sklearn.compose import ColumnTransformer',
      'from sklearn.preprocessing import StandardScaler, OneHotEncoder',
      'from sklearn.impute import SimpleImputer',
      '',
      '# Define column types',
      `numerical_features = ${JSON.stringify(columns.filter(c => c.detectedDataType === 'numerical_float' || c.detectedDataType === 'numerical_integer').map(c => c.columnName))}`,
      `categorical_features = ${JSON.stringify(columns.filter(c => c.detectedDataType === 'categorical').map(c => c.columnName))}`,
      '',
      '# Create preprocessing pipelines',
      'numerical_pipeline = Pipeline([',
      '    ("imputer", SimpleImputer(strategy="median")),',
      '    ("scaler", StandardScaler())',
      '])',
      '',
      'categorical_pipeline = Pipeline([',
      '    ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),',
      '    ("encoder", OneHotEncoder(handle_unknown="ignore", sparse=False))',
      '])',
      '',
      '# Combine preprocessing steps',
      'preprocessor = ColumnTransformer([',
      '    ("num", numerical_pipeline, numerical_features),',
      '    ("cat", categorical_pipeline, categorical_features)',
      '])',
      '',
      '# Full pipeline with model',
      'full_pipeline = Pipeline([',
      '    ("preprocessor", preprocessor),',
      '    ("classifier", YourModel())  # Replace with your model',
      '])',
    ];
  }

  private generateAPISchemaTemplates(columns: any[]): string[] {
    const schemaFields = columns.slice(0, 10).map(col => {
      const fieldType = col.detectedDataType === 'numerical_float' || col.detectedDataType === 'numerical_integer' ? 'number' : 'string';
      return `    "${col.columnName}": {"type": "${fieldType}", "required": true}`;
    });

    return [
      '# API schema template',
      '{',
      '  "input_schema": {',
      '    "type": "object",',
      '    "properties": {',
      ...schemaFields,
      '    }',
      '  },',
      '  "output_schema": {',
      '    "type": "object",',
      '    "properties": {',
      '      "prediction": {"type": "number"},',
      '      "confidence": {"type": "number", "minimum": 0, "maximum": 1},',
      '      "segment": {"type": "string"},',
      '      "prediction_timestamp": {"type": "string", "format": "date-time"}',
      '    }',
      '  },',
      '  "preprocessing_steps": [',
      '    "validate_input",',
      '    "handle_missing_values",',
      '    "encode_categorical_variables",',
      '    "scale_numerical_features"',
      '  ]',
      '}',
    ];
  }

  // Helper methods for suitability scoring
  private calculateH2OSuitability(
    numericalColumns: any[],
    categoricalColumns: any[],
    fileSizeMB: number,
  ): number {
    let score = 70; // Base score
    
    // Bonus for mixed data types (H2O handles well)
    if (numericalColumns.length > 0 && categoricalColumns.length > 0) score += 15;
    
    // Bonus for medium-large datasets
    if (fileSizeMB > 10) score += 10;
    if (fileSizeMB > 100) score += 5;
    
    // Penalty for very high cardinality
    const highCardColumns = categoricalColumns.filter(col => col.uniqueValues > 1000);
    score -= highCardColumns.length * 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private calculateAutoGluonSuitability(
    numericalColumns: any[],
    categoricalColumns: any[],
    fileSizeMB: number,
  ): number {
    let score = 75; // Base score (good default performance)
    
    // Bonus for text-heavy data
    const textColumns = categoricalColumns.filter(col => col.uniqueValues > 100);
    score += textColumns.length * 5;
    
    // Penalty for very large files (memory intensive)
    if (fileSizeMB > 100) score -= 10;
    if (fileSizeMB > 500) score -= 15;
    
    // Bonus for complex mixed data
    if (numericalColumns.length > 5 && categoricalColumns.length > 3) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
}