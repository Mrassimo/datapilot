/**
 * CART (Classification and Regression Trees) Specialized Analyzer
 * Provides detailed analysis of decision tree methodology and interpretation
 */

import type {
  ModelingTask,
  AlgorithmRecommendation,
  CARTAnalysis,
  StoppingCriterion,
  PruningStrategy,
  TreeInterpretation,
  DecisionPath,
  FeatureImportance,
} from './types';
import { logger } from '../../utils/logger';

export class CARTAnalyzer {
  /**
   * Generate comprehensive CART analysis
   */
  async generateCARTAnalysis(
    tasks: ModelingTask[],
    treeAlgorithms: AlgorithmRecommendation[],
  ): Promise<CARTAnalysis> {
    logger.info('Generating CART (Decision Tree) analysis');

    const primaryTask = tasks[0]; // Focus on primary task
    const isRegression = primaryTask?.taskType === 'regression';

    return {
      methodology: this.generateMethodologyDescription(isRegression),
      splittingCriterion: this.determineSplittingCriterion(isRegression),
      stoppingCriteria: this.generateStoppingCriteria(primaryTask),
      pruningStrategy: this.generatePruningStrategy(isRegression),
      treeInterpretation: this.generateTreeInterpretation(primaryTask),
      featureImportance: this.generateFeatureImportanceGuidance(primaryTask),
      visualizationRecommendations: this.generateVisualizationRecommendations(isRegression),
    };
  }

  /**
   * Generate methodology description for CART
   */
  private generateMethodologyDescription(isRegression: boolean): string {
    const taskType = isRegression ? 'regression' : 'classification';
    const criterion = isRegression ? 'variance reduction' : 'Gini impurity or information gain';

    return `CART (Classification and Regression Trees) methodology for ${taskType}:

**Core Algorithm:**
1. **Recursive Binary Partitioning:** The algorithm recursively splits the dataset into two subsets based on feature values that optimize the splitting criterion.

2. **Splitting Criterion:** Uses ${criterion} to evaluate potential splits. For each possible split on each feature, the algorithm calculates the improvement in the criterion and selects the best split.

3. **Greedy Approach:** At each node, CART makes the locally optimal choice without considering future splits, which makes it computationally efficient but potentially suboptimal globally.

4. **Binary Splits Only:** Unlike other decision tree algorithms, CART produces only binary splits, which simplifies the tree structure and interpretation.

**Mathematical Foundation:**
${isRegression ? this.getRegressionMathematicalFoundation() : this.getClassificationMathematicalFoundation()}

**Key Advantages:**
- Non-parametric: No assumptions about data distribution
- Handles mixed data types naturally (numerical and categorical)
- Automatic feature selection through recursive splitting
- Robust to outliers (splits based on order, not exact values)
- Highly interpretable through visual tree structure
- Can capture non-linear relationships and feature interactions

**Limitations to Consider:**
- High variance: Small changes in data can lead to very different trees
- Bias toward features with many possible splits
- Can easily overfit without proper pruning
- Instability: Sensitive to data perturbations`;
  }

  private getRegressionMathematicalFoundation(): string {
    return `For regression trees, the splitting criterion is variance reduction:

**Variance Reduction = Variance(parent) - [weighted_avg(Variance(left_child), Variance(right_child))]**

Where:
- Variance(S) = Σ(yi - ȳ)² / |S|
- ȳ is the mean target value in set S
- Weights are proportional to the number of samples in each child

**Prediction:** For a leaf node, prediction = mean of target values in that leaf`;
  }

  private getClassificationMathematicalFoundation(): string {
    return `For classification trees, common splitting criteria include:

**Gini Impurity:** Gini(S) = 1 - Σ(pi)²
where pi is the proportion of samples belonging to class i

**Information Gain (Entropy):** 
- Entropy(S) = -Σ(pi * log2(pi))
- Information Gain = Entropy(parent) - weighted_avg(Entropy(children))

**Prediction:** For a leaf node, prediction = majority class in that leaf
**Probability Estimation:** P(class i) = proportion of class i samples in leaf`;
  }

  /**
   * Determine optimal splitting criterion
   */
  private determineSplittingCriterion(
    isRegression: boolean,
  ): 'gini' | 'entropy' | 'variance_reduction' {
    if (isRegression) {
      return 'variance_reduction';
    }

    // For classification, Gini is generally preferred for speed and performance
    return 'gini';
  }

  /**
   * Generate stopping criteria recommendations
   */
  private generateStoppingCriteria(task: ModelingTask | undefined): StoppingCriterion[] {
    const criteria: StoppingCriterion[] = [];

    const featureCount = task?.inputFeatures.length || 5;
    const estimatedSampleSize = this.estimateSampleSize(task);

    // Maximum depth
    criteria.push({
      criterion: 'max_depth',
      recommendedValue: this.recommendMaxDepth(featureCount, estimatedSampleSize),
      reasoning:
        'Limits tree complexity to prevent overfitting. Deeper trees capture more complexity but risk overfitting.',
    });

    // Minimum samples per split
    criteria.push({
      criterion: 'min_samples_split',
      recommendedValue: Math.max(2, Math.floor(estimatedSampleSize * 0.01)),
      reasoning:
        'Ensures each internal node has sufficient samples for reliable splits. Higher values prevent overfitting to noise.',
    });

    // Minimum samples per leaf
    criteria.push({
      criterion: 'min_samples_leaf',
      recommendedValue: Math.max(1, Math.floor(estimatedSampleSize * 0.005)),
      reasoning:
        'Guarantees each leaf has minimum samples for stable predictions. Prevents creation of leaves with very few samples.',
    });

    // Minimum impurity decrease
    criteria.push({
      criterion: 'min_impurity_decrease',
      recommendedValue: 0.0,
      reasoning:
        'Can be used to require minimum improvement for splits. Set to 0.01-0.05 if overfitting is observed.',
    });

    // Maximum leaf nodes
    criteria.push({
      criterion: 'max_leaf_nodes',
      recommendedValue: null,
      reasoning:
        'Alternative to max_depth for controlling tree size. Consider using for very unbalanced trees.',
    });

    return criteria;
  }

  /**
   * Generate pruning strategy
   */
  private generatePruningStrategy(isRegression: boolean): PruningStrategy {
    return {
      method: 'cost_complexity',
      crossValidationFolds: 5,
      complexityParameter: 0.01,
      reasoning: `Cost-complexity pruning (also known as minimal cost-complexity pruning) is the standard CART pruning method:

**Algorithm:**
1. Grow a large tree using stopping criteria
2. For each subtree T, calculate cost-complexity measure: R_α(T) = R(T) + α|T|
   - R(T) = ${isRegression ? 'sum of squared errors' : 'misclassification rate'}
   - |T| = number of leaf nodes
   - α = complexity parameter (cost per leaf)

3. Find sequence of nested subtrees by increasing α
4. Use cross-validation to select optimal α that minimizes ${isRegression ? 'MSE' : 'misclassification rate'}

**Benefits:**
- Theoretically grounded approach
- Automatically determines optimal tree size
- Balances model complexity with predictive accuracy
- Reduces overfitting while maintaining interpretability

**Implementation Notes:**
- Use 5-fold cross-validation to estimate generalization error
- Select α within one standard error of minimum (1-SE rule)
- Monitor both training and validation performance during pruning`,
    };
  }

  /**
   * Generate tree interpretation guidance
   */
  private generateTreeInterpretation(task: ModelingTask | undefined): TreeInterpretation {
    const estimatedDepth = this.estimateTreeDepth(task);
    const estimatedLeaves = Math.pow(2, Math.max(1, estimatedDepth - 1));

    return {
      treeDepth: estimatedDepth,
      numberOfLeaves: estimatedLeaves,
      keyDecisionPaths: this.generateExampleDecisionPaths(task),
      businessRules: this.generateBusinessRules(task),
      visualizationGuidance: this.generateVisualizationGuidance(),
    };
  }

  /**
   * Generate example decision paths
   */
  private generateExampleDecisionPaths(task: ModelingTask | undefined): DecisionPath[] {
    if (!task) return [];

    const paths: DecisionPath[] = [];
    const features = task.inputFeatures.slice(0, 3); // Use first 3 features for examples

    // Example path 1: High-value outcome
    if (features.length >= 2) {
      paths.push({
        pathDescription: 'Path to high-value prediction',
        conditions: [
          `${features[0]} > threshold_1`,
          `${features[1]} <= threshold_2`,
          ...(features[2] ? [`${features[2]} in [category_A, category_B]`] : []),
        ],
        prediction: task.taskType === 'regression' ? 'High numerical value' : 'Positive class',
        supportingInstances: 120,
        businessMeaning: `When ${features[0]} is high and ${features[1]} is moderate, the model predicts ${task.taskType === 'regression' ? 'above-average values' : 'positive outcomes'}`,
      });
    }

    // Example path 2: Low-value outcome
    if (features.length >= 1) {
      paths.push({
        pathDescription: 'Path to low-value prediction',
        conditions: [`${features[0]} <= threshold_1`],
        prediction: task.taskType === 'regression' ? 'Low numerical value' : 'Negative class',
        supportingInstances: 80,
        businessMeaning: `When ${features[0]} is low, the model typically predicts ${task.taskType === 'regression' ? 'below-average values' : 'negative outcomes'} regardless of other features`,
      });
    }

    return paths;
  }

  /**
   * Generate business rules from tree structure
   */
  private generateBusinessRules(task: ModelingTask | undefined): string[] {
    if (!task) return [];

    const rules: string[] = [];
    const taskType = task.taskType;
    const targetVar = task.targetVariable || 'outcome';

    // Generate example business rules
    rules.push(
      `IF-THEN Rule Translation: Decision trees naturally translate to business rules`,
      `Each path from root to leaf represents a complete business rule`,
      `Rules are mutually exclusive and collectively exhaustive`,
      `Example structure: IF (condition1 AND condition2) THEN predict ${targetVar} = value`,
    );

    if (taskType === 'regression') {
      rules.push(
        `For regression: Each leaf provides a numerical prediction (mean of training samples in leaf)`,
        `Rules can be used for segmentation: "High ${targetVar} segment", "Low ${targetVar} segment"`,
        `Confidence intervals can be calculated using standard deviation in each leaf`,
      );
    } else {
      rules.push(
        `For classification: Each leaf provides class prediction and probability estimates`,
        `Rules can include confidence levels based on class purity in leaves`,
        `Probability estimates help with decision thresholds and uncertainty quantification`,
      );
    }

    return rules;
  }

  /**
   * Generate visualization guidance
   */
  private generateVisualizationGuidance(): string {
    return `**Tree Visualization Best Practices:**

**1. Full Tree Diagram:**
- Use hierarchical layout with root at top
- Show splitting conditions at each internal node
- Display prediction values and sample counts at leaves
- Color-code nodes by prediction value or class
- Limit display depth for complex trees (show top 3-4 levels)

**2. Simplified Tree Views:**
- Focus on most important paths (highest sample counts)
- Highlight paths leading to extreme predictions
- Use text-based rule extraction for complex trees

**3. Interactive Visualizations:**
- Collapsible nodes for exploring different depths
- Hover information showing detailed statistics
- Ability to trace specific instances through the tree

**4. Feature Importance Plots:**
- Bar chart of feature importance scores
- Scatter plot of feature values vs. importance
- Comparison across multiple trees (for ensembles)

**5. Decision Boundary Visualization (2D/3D):**
- For datasets with 2-3 key features
- Show rectangular decision regions
- Overlay training data points
- Highlight misclassified instances`;
  }

  /**
   * Generate feature importance guidance
   */
  private generateFeatureImportanceGuidance(task: ModelingTask | undefined): FeatureImportance[] {
    if (!task) return [];

    return task.inputFeatures.slice(0, 5).map((feature, index) => ({
      featureName: feature,
      importance: 0.8 - index * 0.15, // Decreasing importance
      rank: index + 1,
      confidenceInterval: [0.8 - index * 0.15 - 0.1, 0.8 - index * 0.15 + 0.1] as [number, number],
      businessMeaning: `${feature} plays ${index === 0 ? 'a critical' : index < 3 ? 'an important' : 'a moderate'} role in determining ${task.targetVariable || 'outcomes'}`,
    }));
  }

  /**
   * Generate visualization recommendations
   */
  private generateVisualizationRecommendations(isRegression: boolean): string[] {
    const common = [
      'Create tree structure diagram with node labels showing split conditions',
      'Generate feature importance bar chart ranked by Gini importance',
      'Produce scatter plot of actual vs predicted values with leaf node coloring',
      'Create decision path examples showing top 5 most common prediction paths',
    ];

    if (isRegression) {
      return [
        ...common,
        'Plot residuals vs predicted values colored by leaf nodes to check for patterns',
        'Create leaf node boxplots showing target value distributions',
        'Generate partial dependence plots for top 3 most important features',
      ];
    } else {
      return [
        ...common,
        'Create confusion matrix with breakdown by major decision paths',
        'Generate ROC curves for each major leaf node (treat as separate classifiers)',
        'Plot class probability distributions for each leaf node',
        'Create decision boundary visualization for top 2 features (if applicable)',
      ];
    }
  }

  // Helper methods
  private estimateSampleSize(task: ModelingTask | undefined): number {
    // Simplified estimation - would use actual data size in real implementation
    return 1000;
  }

  private recommendMaxDepth(featureCount: number, sampleSize: number): number {
    // Heuristic: deeper trees for more features and larger datasets
    const baseDepth = Math.min(10, Math.max(3, Math.floor(Math.log2(sampleSize / 10))));
    const featureAdjustment = Math.min(5, Math.floor(featureCount / 3));
    return Math.min(15, baseDepth + featureAdjustment);
  }

  private estimateTreeDepth(task: ModelingTask | undefined): number {
    if (!task) return 5;
    const featureCount = task.inputFeatures.length;
    return Math.min(8, Math.max(3, Math.floor(Math.log2(featureCount)) + 3));
  }
}
