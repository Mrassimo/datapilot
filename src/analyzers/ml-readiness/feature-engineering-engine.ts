/**
 * Feature Engineering Automation Engine
 * Phase 4: Advanced Analytics Integration
 * 
 * Transforms raw data insights into ML-ready feature recommendations
 */

import { 
  ColumnAnalysis,
  NumericalColumnAnalysis,
  CategoricalColumnAnalysis,
  DateTimeAnalysis,
  BooleanAnalysis,
  TextColumnAnalysis,
  BivariateAnalysis,
  BaseColumnProfile,
  EdaDataType,
  SemanticType
} from '../eda/types';

// Type aliases for compatibility
type ColumnMetadata = BaseColumnProfile & {
  name: string;
  dataType: string;
  semanticType?: string;
};

type UnivariateAnalysis = NumericalColumnAnalysis & {
  count: number;
  min?: number;
  max?: number;
  quartiles?: {
    q1: number;
    q3: number;
  };
  uniqueCount: number;
};

// Compatibility type for bivariate results
type BivariateResult = {
  column1: string;
  column2: string;
  correlationType?: string;
  correlation?: {
    pearson: number;
  };
};

interface FeatureEngineeringRecommendation {
  featureName: string;
  originalColumn: string;
  transformationType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  implementation: {
    method: string;
    parameters: Record<string, any>;
    codeSnippet: string;
  };
  expectedImpact: {
    informationGain: number;
    complexityIncrease: number;
    interpretability: number;
  };
}

interface ScalingStrategy {
  method: 'standard' | 'minmax' | 'robust' | 'quantile' | 'log' | 'none';
  reasoning: string;
  parameters?: Record<string, any>;
  warningsAndCaveats: string[];
}

interface CategoricalEncodingStrategy {
  method: 'onehot' | 'ordinal' | 'target' | 'frequency' | 'binary' | 'embedding';
  reasoning: string;
  parameters?: Record<string, any>;
  highCardinalityHandling?: string;
}

interface FeatureInteraction {
  features: string[];
  interactionType: 'multiplicative' | 'polynomial' | 'ratio' | 'difference' | 'custom';
  statisticalSignificance: number;
  reasoning: string;
  implementation: string;
}

interface FeatureSelectionResults {
  selectedFeatures: string[];
  eliminatedFeatures: string[];
  featureImportanceScores: Record<string, number>;
  selectionMethod: string;
  reasoning: string;
}

export interface FeatureEngineeringResults {
  engineeredFeatures: FeatureEngineeringRecommendation[];
  scalingStrategies: Record<string, ScalingStrategy>;
  categoricalEncodings: Record<string, CategoricalEncodingStrategy>;
  featureInteractions: FeatureInteraction[];
  featureSelection: FeatureSelectionResults;
  mlReadinessScore: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedFeatureCount: number;
  warnings: string[];
  bestPractices: string[];
}

export class FeatureEngineeringEngine {
  /**
   * Main entry point for feature engineering automation
   */
  static analyzeFeatureEngineering(
    columns: ColumnMetadata[],
    univariateResults: Map<string, UnivariateAnalysis>,
    bivariateResults: BivariateResult[],
    pcaResults?: any, // From multivariate analysis
    targetColumn?: string
  ): FeatureEngineeringResults {
    const engineeredFeatures: FeatureEngineeringRecommendation[] = [];
    const scalingStrategies: Record<string, ScalingStrategy> = {};
    const categoricalEncodings: Record<string, CategoricalEncodingStrategy> = {};
    const featureInteractions: FeatureInteraction[] = [];
    const warnings: string[] = [];
    const bestPractices: string[] = [];

    // Analyze each column for feature engineering opportunities
    columns.forEach(column => {
      const univariate = univariateResults.get(column.name);
      if (!univariate) return;

      // Numerical feature engineering
      if (column.dataType === 'numerical_int' || column.dataType === 'numerical_float') {
        // Detect and handle skewness
        if (Math.abs(univariate.skewness || 0) > 1) {
          engineeredFeatures.push(this.createSkewnessTransform(column, univariate));
        }

        // Detect polynomial features for non-linear relationships
        if (targetColumn) {
          const targetCorrelation = this.findTargetCorrelation(column.name, targetColumn, bivariateResults);
          if (targetCorrelation && Math.abs(targetCorrelation) < 0.3) {
            engineeredFeatures.push(this.createPolynomialFeatures(column, univariate));
          }
        }

        // Binning for continuous variables with specific patterns
        if (this.shouldBinVariable(univariate)) {
          engineeredFeatures.push(this.createBinningTransform(column, univariate));
        }

        // Scaling strategy
        scalingStrategies[column.name] = this.determineScalingStrategy(univariate);
      }

      // Categorical feature engineering
      if (column.dataType === 'string' || column.semanticType === 'categorical') {
        categoricalEncodings[column.name] = this.determineCategoricalEncoding(
          column, 
          univariate,
          targetColumn
        );

        // High cardinality handling
        if (univariate.uniqueCount > 50) {
          engineeredFeatures.push(this.createCardinalityReduction(column, univariate));
        }
      }

      // Date/time feature extraction
      if (column.semanticType === 'datetime') {
        engineeredFeatures.push(...this.createDateTimeFeatures(column));
      }
    });

    // Detect feature interactions
    featureInteractions.push(...this.detectFeatureInteractions(bivariateResults, pcaResults));

    // Perform feature selection
    const featureSelection = this.performFeatureSelection(
      columns,
      univariateResults,
      bivariateResults,
      pcaResults
    );

    // Calculate ML readiness score
    const mlReadinessScore = this.calculateMLReadinessScore(
      columns,
      engineeredFeatures,
      scalingStrategies,
      categoricalEncodings,
      featureSelection
    );

    // Add warnings and best practices
    this.addWarningsAndBestPractices(
      columns,
      engineeredFeatures,
      warnings,
      bestPractices
    );

    return {
      engineeredFeatures,
      scalingStrategies,
      categoricalEncodings,
      featureInteractions,
      featureSelection,
      mlReadinessScore,
      implementationComplexity: this.assessImplementationComplexity(engineeredFeatures),
      estimatedFeatureCount: this.estimateFeatureCount(
        columns,
        engineeredFeatures,
        categoricalEncodings
      ),
      warnings,
      bestPractices
    };
  }

  private static createSkewnessTransform(
    column: ColumnMetadata,
    univariate: UnivariateAnalysis
  ): FeatureEngineeringRecommendation {
    const skewness = univariate.skewness || 0;
    const hasZeros = (univariate.min || 0) <= 0;
    
    let method = 'log1p';
    let codeSnippet = `df['${column.name}_log'] = np.log1p(df['${column.name}'])`;
    
    if (hasZeros || univariate.min! < 0) {
      method = 'box-cox';
      codeSnippet = `from scipy.stats import boxcox\ndf['${column.name}_boxcox'], lambda_param = boxcox(df['${column.name}'] + abs(df['${column.name}'].min()) + 1)`;
    } else if (Math.abs(skewness) > 3) {
      method = 'yeo-johnson';
      codeSnippet = `from sklearn.preprocessing import PowerTransformer\npt = PowerTransformer(method='yeo-johnson')\ndf['${column.name}_yeojohnson'] = pt.fit_transform(df[['${column.name}']])`;
    }

    return {
      featureName: `${column.name}_transformed`,
      originalColumn: column.name,
      transformationType: 'skewness_correction',
      priority: Math.abs(skewness) > 2 ? 'high' : 'medium',
      reasoning: `High skewness (${skewness.toFixed(2)}) detected. ${method} transformation recommended to normalize distribution`,
      implementation: {
        method,
        parameters: { skewness },
        codeSnippet
      },
      expectedImpact: {
        informationGain: 0.7,
        complexityIncrease: 0.3,
        interpretability: 0.6
      }
    };
  }

  private static createPolynomialFeatures(
    column: ColumnMetadata,
    univariate: UnivariateAnalysis
  ): FeatureEngineeringRecommendation {
    return {
      featureName: `${column.name}_squared`,
      originalColumn: column.name,
      transformationType: 'polynomial',
      priority: 'medium',
      reasoning: 'Low linear correlation with target suggests non-linear relationship',
      implementation: {
        method: 'polynomial_degree_2',
        parameters: { degree: 2 },
        codeSnippet: `df['${column.name}_squared'] = df['${column.name}'] ** 2`
      },
      expectedImpact: {
        informationGain: 0.6,
        complexityIncrease: 0.2,
        interpretability: 0.8
      }
    };
  }

  private static createBinningTransform(
    column: ColumnMetadata,
    univariate: UnivariateAnalysis
  ): FeatureEngineeringRecommendation {
    const bins = this.determineBinCount(univariate);
    
    return {
      featureName: `${column.name}_binned`,
      originalColumn: column.name,
      transformationType: 'discretization',
      priority: 'medium',
      reasoning: 'Binning can capture non-linear patterns and reduce noise',
      implementation: {
        method: 'quantile_binning',
        parameters: { bins },
        codeSnippet: `df['${column.name}_binned'] = pd.qcut(df['${column.name}'], q=${bins}, labels=False, duplicates='drop')`
      },
      expectedImpact: {
        informationGain: 0.5,
        complexityIncrease: 0.4,
        interpretability: 0.9
      }
    };
  }

  private static determineScalingStrategy(univariate: UnivariateAnalysis): ScalingStrategy {
    const hasOutliers = this.detectOutliers(univariate);
    const distribution = this.detectDistribution(univariate);
    
    if (hasOutliers) {
      return {
        method: 'robust',
        reasoning: 'Robust scaling recommended due to presence of outliers',
        parameters: { with_centering: true, with_scaling: true },
        warningsAndCaveats: [
          'RobustScaler uses median and IQR, less sensitive to outliers',
          'May not fully normalize extreme outliers'
        ]
      };
    }
    
    if (distribution === 'normal' || distribution === 'approximately_normal') {
      return {
        method: 'standard',
        reasoning: 'StandardScaler recommended for normally distributed data',
        parameters: { with_mean: true, with_std: true },
        warningsAndCaveats: [
          'Assumes data is normally distributed',
          'Sensitive to outliers'
        ]
      };
    }
    
    if (distribution === 'uniform') {
      return {
        method: 'minmax',
        reasoning: 'MinMaxScaler suitable for uniformly distributed data',
        parameters: { feature_range: [0, 1] },
        warningsAndCaveats: [
          'Bounded to specified range',
          'Very sensitive to outliers'
        ]
      };
    }
    
    return {
      method: 'quantile',
      reasoning: 'Quantile transformation for unknown or complex distributions',
      parameters: { n_quantiles: 1000, output_distribution: 'uniform' },
      warningsAndCaveats: [
        'Non-linear transformation',
        'May distort linear relationships'
      ]
    };
  }

  private static determineCategoricalEncoding(
    column: ColumnMetadata,
    univariate: UnivariateAnalysis,
    targetColumn?: string
  ): CategoricalEncodingStrategy {
    const cardinality = univariate.uniqueCount;
    
    if (cardinality === 2) {
      return {
        method: 'binary',
        reasoning: 'Binary encoding for two-category variable',
        parameters: { positive_label: univariate.topValues?.[0]?.value }
      };
    }
    
    if (cardinality <= 10) {
      return {
        method: 'onehot',
        reasoning: 'One-hot encoding suitable for low cardinality',
        parameters: { drop_first: true, handle_unknown: 'ignore' }
      };
    }
    
    if (cardinality <= 50 && targetColumn) {
      return {
        method: 'target',
        reasoning: 'Target encoding for medium cardinality with known target',
        parameters: { smoothing: 1.0 },
        highCardinalityHandling: 'Use cross-validation to prevent overfitting'
      };
    }
    
    if (cardinality > 50) {
      return {
        method: 'embedding',
        reasoning: 'Embedding recommended for high cardinality categorical',
        parameters: { embedding_dim: Math.min(50, Math.ceil(cardinality / 2)) },
        highCardinalityHandling: 'Consider frequency-based filtering or grouping rare categories'
      };
    }
    
    return {
      method: 'ordinal',
      reasoning: 'Ordinal encoding as fallback for unknown structure',
      parameters: { handle_unknown: 'use_encoded_value', unknown_value: -1 }
    };
  }

  private static createCardinalityReduction(
    column: ColumnMetadata,
    univariate: UnivariateAnalysis
  ): FeatureEngineeringRecommendation {
    return {
      featureName: `${column.name}_grouped`,
      originalColumn: column.name,
      transformationType: 'cardinality_reduction',
      priority: 'high',
      reasoning: `High cardinality (${univariate.uniqueCount} unique values) requires reduction for effective modeling`,
      implementation: {
        method: 'frequency_based_grouping',
        parameters: { 
          min_frequency: 0.01,
          other_category: 'Other'
        },
        codeSnippet: `# Group rare categories
value_counts = df['${column.name}'].value_counts()
rare_categories = value_counts[value_counts < len(df) * 0.01].index
df['${column.name}_grouped'] = df['${column.name}'].replace(rare_categories, 'Other')`
      },
      expectedImpact: {
        informationGain: 0.4,
        complexityIncrease: -0.3,
        interpretability: 0.7
      }
    };
  }

  private static createDateTimeFeatures(column: ColumnMetadata): FeatureEngineeringRecommendation[] {
    const features: FeatureEngineeringRecommendation[] = [];
    
    const timeComponents = [
      { name: 'year', extract: 'dt.year', priority: 'medium' as const },
      { name: 'month', extract: 'dt.month', priority: 'high' as const },
      { name: 'day', extract: 'dt.day', priority: 'medium' as const },
      { name: 'dayofweek', extract: 'dt.dayofweek', priority: 'high' as const },
      { name: 'hour', extract: 'dt.hour', priority: 'high' as const },
      { name: 'quarter', extract: 'dt.quarter', priority: 'medium' as const }
    ];
    
    timeComponents.forEach(component => {
      features.push({
        featureName: `${column.name}_${component.name}`,
        originalColumn: column.name,
        transformationType: 'datetime_extraction',
        priority: component.priority,
        reasoning: `Extract ${component.name} component for temporal patterns`,
        implementation: {
          method: `extract_${component.name}`,
          parameters: {},
          codeSnippet: `df['${column.name}_${component.name}'] = pd.to_datetime(df['${column.name}']).${component.extract}`
        },
        expectedImpact: {
          informationGain: 0.6,
          complexityIncrease: 0.1,
          interpretability: 0.9
        }
      });
    });
    
    // Add cyclical encoding for month and hour
    features.push({
      featureName: `${column.name}_month_sin`,
      originalColumn: column.name,
      transformationType: 'cyclical_encoding',
      priority: 'medium',
      reasoning: 'Cyclical encoding preserves continuity between months',
      implementation: {
        method: 'sine_cosine_encoding',
        parameters: { period: 12 },
        codeSnippet: `df['${column.name}_month_sin'] = np.sin(2 * np.pi * df['${column.name}_month'] / 12)
df['${column.name}_month_cos'] = np.cos(2 * np.pi * df['${column.name}_month'] / 12)`
      },
      expectedImpact: {
        informationGain: 0.5,
        complexityIncrease: 0.2,
        interpretability: 0.6
      }
    });
    
    return features;
  }

  private static detectFeatureInteractions(
    bivariateResults: BivariateResult[],
    pcaResults?: any
  ): FeatureInteraction[] {
    const interactions: FeatureInteraction[] = [];
    
    // Find strongly correlated pairs for ratio features
    bivariateResults.forEach(result => {
      if (result.correlationType === 'numerical_numerical' && 
          result.correlation && 
          Math.abs(result.correlation.pearson) > 0.7) {
        interactions.push({
          features: [result.column1, result.column2],
          interactionType: 'ratio',
          statisticalSignificance: Math.abs(result.correlation.pearson),
          reasoning: 'Strong correlation suggests ratio might capture relationship',
          implementation: `df['${result.column1}_${result.column2}_ratio'] = df['${result.column1}'] / (df['${result.column2}'] + 1e-8)`
        });
      }
    });
    
    // Use PCA results to identify multiplicative interactions
    if (pcaResults?.components) {
      const topComponents = pcaResults.components.slice(0, 3);
      topComponents.forEach((component: any, idx: number) => {
        const topFeatures = component.loadings
          .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, 2);
        
        if (topFeatures.length === 2) {
          interactions.push({
            features: topFeatures.map((f: any) => f.feature),
            interactionType: 'multiplicative',
            statisticalSignificance: component.explainedVariance,
            reasoning: `Features load highly on PC${idx + 1}, suggesting interaction`,
            implementation: `df['${topFeatures[0].feature}_x_${topFeatures[1].feature}'] = df['${topFeatures[0].feature}'] * df['${topFeatures[1].feature}']`
          });
        }
      });
    }
    
    return interactions;
  }

  private static performFeatureSelection(
    columns: ColumnMetadata[],
    univariateResults: Map<string, UnivariateAnalysis>,
    bivariateResults: BivariateAnalysis[],
    pcaResults?: any
  ): FeatureSelectionResults {
    const featureScores: Record<string, number> = {};
    const selectedFeatures: string[] = [];
    const eliminatedFeatures: string[] = [];
    
    // Score features based on multiple criteria
    columns.forEach(column => {
      let score = 0;
      const univariate = univariateResults.get(column.name);
      
      if (!univariate) return;
      
      // Variance-based scoring
      if (univariate.variance && univariate.variance > 0) {
        score += 0.3;
      }
      
      // Uniqueness scoring
      const uniquenessRatio = univariate.uniqueCount / univariate.count;
      if (uniquenessRatio > 0.01 && uniquenessRatio < 0.95) {
        score += 0.2;
      }
      
      // Missing value penalty
      const missingRatio = univariate.missingCount / univariate.count;
      score -= missingRatio * 0.5;
      
      // Correlation bonus (if correlated with other features)
      const correlations = bivariateResults.filter(
        r => r.column1 === column.name || r.column2 === column.name
      );
      const maxCorrelation = Math.max(
        ...correlations.map(c => Math.abs(c.correlation?.pearson || 0))
      );
      if (maxCorrelation > 0.3 && maxCorrelation < 0.95) {
        score += 0.3;
      }
      
      featureScores[column.name] = Math.max(0, Math.min(1, score));
    });
    
    // Select features above threshold
    const threshold = 0.4;
    Object.entries(featureScores).forEach(([feature, score]) => {
      if (score >= threshold) {
        selectedFeatures.push(feature);
      } else {
        eliminatedFeatures.push(feature);
      }
    });
    
    return {
      selectedFeatures,
      eliminatedFeatures,
      featureImportanceScores: featureScores,
      selectionMethod: 'multi_criteria_scoring',
      reasoning: 'Features selected based on variance, uniqueness, missing values, and correlation patterns'
    };
  }

  private static calculateMLReadinessScore(
    columns: ColumnMetadata[],
    engineeredFeatures: FeatureEngineeringRecommendation[],
    scalingStrategies: Record<string, ScalingStrategy>,
    categoricalEncodings: Record<string, CategoricalEncodingStrategy>,
    featureSelection: FeatureSelectionResults
  ): number {
    let score = 0;
    const weights = {
      dataQuality: 0.3,
      featureEngineering: 0.25,
      preprocessing: 0.25,
      featureSelection: 0.2
    };
    
    // Data quality score
    const selectedColumns = columns.filter(c => 
      featureSelection.selectedFeatures.includes(c.name)
    );
    const avgMissingRatio = selectedColumns.reduce((sum, col) => {
      const univariate = col as any; // Would need proper typing
      return sum + (univariate.missingCount || 0) / (univariate.count || 1);
    }, 0) / selectedColumns.length;
    const dataQualityScore = 1 - avgMissingRatio;
    
    // Feature engineering score
    const featureEngineeringScore = Math.min(1, engineeredFeatures.length / 10);
    
    // Preprocessing score
    const preprocessingScore = (
      Object.keys(scalingStrategies).length + 
      Object.keys(categoricalEncodings).length
    ) / columns.length;
    
    // Feature selection score
    const featureSelectionScore = featureSelection.selectedFeatures.length > 0 ? 0.8 : 0;
    
    score = (
      weights.dataQuality * dataQualityScore +
      weights.featureEngineering * featureEngineeringScore +
      weights.preprocessing * preprocessingScore +
      weights.featureSelection * featureSelectionScore
    );
    
    return Math.round(score * 100);
  }

  private static assessImplementationComplexity(
    engineeredFeatures: FeatureEngineeringRecommendation[]
  ): 'low' | 'medium' | 'high' {
    const complexTransforms = engineeredFeatures.filter(f => 
      ['polynomial', 'embedding', 'target', 'custom'].includes(f.transformationType)
    ).length;
    
    if (complexTransforms === 0) return 'low';
    if (complexTransforms <= 3) return 'medium';
    return 'high';
  }

  private static estimateFeatureCount(
    columns: ColumnMetadata[],
    engineeredFeatures: FeatureEngineeringRecommendation[],
    categoricalEncodings: Record<string, CategoricalEncodingStrategy>
  ): number {
    let count = columns.length;
    
    // Add engineered features
    count += engineeredFeatures.length;
    
    // Add one-hot encoded features
    Object.entries(categoricalEncodings).forEach(([col, encoding]) => {
      if (encoding.method === 'onehot') {
        const column = columns.find(c => c.name === col);
        if (column) {
          // Estimate cardinality from metadata
          count += 10; // Conservative estimate
        }
      }
    });
    
    return count;
  }

  private static addWarningsAndBestPractices(
    columns: ColumnMetadata[],
    engineeredFeatures: FeatureEngineeringRecommendation[],
    warnings: string[],
    bestPractices: string[]
  ): void {
    // Check for multicollinearity risk
    const polynomialFeatures = engineeredFeatures.filter(f => 
      f.transformationType === 'polynomial'
    );
    if (polynomialFeatures.length > 3) {
      warnings.push('Multiple polynomial features may introduce multicollinearity');
    }
    
    // Check for high dimensionality
    const estimatedFeatures = this.estimateFeatureCount(columns, engineeredFeatures, {});
    if (estimatedFeatures > 100) {
      warnings.push(`High feature count (${estimatedFeatures}) may require dimensionality reduction`);
    }
    
    // Best practices
    bestPractices.push('Always split data before fitting transformers to prevent leakage');
    bestPractices.push('Use cross-validation for target encoding to avoid overfitting');
    bestPractices.push('Monitor feature importance after training to validate engineering choices');
    bestPractices.push('Consider feature interactions only for top-importance features');
    bestPractices.push('Document all transformations for model reproducibility');
  }

  // Helper methods
  private static findTargetCorrelation(
    column: string,
    target: string,
    bivariateResults: BivariateResult[]
  ): number | null {
    const result = bivariateResults.find(
      r => (r.column1 === column && r.column2 === target) ||
           (r.column1 === target && r.column2 === column)
    );
    return result?.correlation?.pearson || null;
  }

  private static shouldBinVariable(univariate: UnivariateAnalysis): boolean {
    // Bin if distribution is highly skewed or has specific patterns
    return (Math.abs(univariate.skewness || 0) > 2) || 
           (univariate.kurtosis && univariate.kurtosis > 5);
  }

  private static detectOutliers(univariate: UnivariateAnalysis): boolean {
    if (!univariate.quartiles) return false;
    const iqr = univariate.quartiles.q3 - univariate.quartiles.q1;
    const lowerBound = univariate.quartiles.q1 - 1.5 * iqr;
    const upperBound = univariate.quartiles.q3 + 1.5 * iqr;
    return (univariate.min! < lowerBound) || (univariate.max! > upperBound);
  }

  private static detectDistribution(univariate: UnivariateAnalysis): string {
    const skewness = Math.abs(univariate.skewness || 0);
    const kurtosis = univariate.kurtosis || 0;
    
    if (skewness < 0.5 && Math.abs(kurtosis - 3) < 0.5) {
      return 'normal';
    } else if (skewness < 1 && Math.abs(kurtosis - 3) < 2) {
      return 'approximately_normal';
    } else if (kurtosis < 2) {
      return 'uniform';
    }
    return 'unknown';
  }

  private static determineBinCount(univariate: UnivariateAnalysis): number {
    const uniqueValues = univariate.uniqueCount;
    const totalValues = univariate.count;
    
    if (uniqueValues < 10) return uniqueValues;
    if (totalValues < 100) return 5;
    if (totalValues < 1000) return 10;
    return 20;
  }
}