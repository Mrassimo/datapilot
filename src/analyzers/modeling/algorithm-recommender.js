"use strict";
/**
 * Algorithm Recommendation Engine for Section 6
 * Provides intelligent algorithm selection based on data characteristics and task requirements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmRecommender = void 0;
const logger_1 = require("../../utils/logger");
class AlgorithmRecommender {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate algorithm recommendations for a specific modeling task
     */
    async recommendAlgorithms(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        switch (task.taskType) {
            case 'regression':
                recommendations.push(...this.generateRegressionRecommendations(task, section1Result, section3Result, section5Result));
                break;
            case 'binary_classification':
            case 'multiclass_classification':
                recommendations.push(...this.generateClassificationRecommendations(task, section1Result, section3Result, section5Result));
                break;
            case 'clustering':
                recommendations.push(...this.generateClusteringRecommendations(task, section1Result, section3Result, section5Result));
                break;
            case 'time_series_forecasting':
                recommendations.push(...this.generateTimeSeriesRecommendations(task, section1Result, section3Result, section5Result));
                break;
            case 'anomaly_detection':
                recommendations.push(...this.generateAnomalyDetectionRecommendations(task, section1Result, section3Result, section5Result));
                break;
            default:
                logger_1.logger.warn(`Unknown task type: ${task.taskType}`);
        }
        // Sort by suitability score and return top recommendations
        return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 5); // Top 5 recommendations per task
    }
    /**
     * Generate regression algorithm recommendations
     */
    generateRegressionRecommendations(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        const featureCount = task.inputFeatures.length;
        const dataSize = section1Result.overview.structuralDimensions.totalDataRows;
        // Linear Regression (Baseline)
        recommendations.push({
            algorithmName: 'Linear Regression',
            category: 'linear_models',
            suitabilityScore: this.calculateLinearRegressionSuitability(task, section3Result),
            complexity: 'simple',
            interpretability: 'high',
            strengths: [
                'Highly interpretable coefficients',
                'Fast training and prediction',
                'Well-understood statistical properties',
                'Good baseline model',
                'Works well with linear relationships',
            ],
            weaknesses: [
                'Assumes linear relationships',
                'Sensitive to outliers',
                'Requires feature scaling for optimal performance',
                'May underfit complex patterns',
            ],
            dataRequirements: [
                'Linear relationship between features and target',
                'Normally distributed residuals',
                'Independence of observations',
                'Homoscedasticity (constant variance)',
            ],
            hyperparameters: [
                {
                    parameterName: 'fit_intercept',
                    description: 'Whether to calculate intercept',
                    defaultValue: true,
                    recommendedRange: 'true/false',
                    tuningStrategy: 'Based on domain knowledge',
                    importance: 'important',
                },
                {
                    parameterName: 'normalize',
                    description: 'Whether to normalize features',
                    defaultValue: false,
                    recommendedRange: 'true/false',
                    tuningStrategy: 'Use if features have different scales',
                    importance: 'optional',
                },
            ],
            implementationFrameworks: ['scikit-learn', 'statsmodels', 'R', 'Julia'],
            evaluationMetrics: ['R²', 'Adjusted R²', 'RMSE', 'MAE', 'MAPE'],
            reasoningNotes: [
                'Excellent starting point for regression analysis',
                'Provides interpretable baseline for comparison',
                'Essential for understanding linear relationships',
            ],
        });
        // Decision Tree Regressor (User Interest - CART)
        recommendations.push({
            algorithmName: 'Decision Tree Regressor (CART)',
            category: 'tree_based',
            suitabilityScore: this.calculateTreeSuitability(task, section3Result, 'regression'),
            complexity: 'moderate',
            interpretability: 'high',
            strengths: [
                'Handles non-linear relationships naturally',
                'No assumptions about data distribution',
                'Automatic feature selection',
                'Robust to outliers',
                'Easily interpretable decision rules',
                'Can capture feature interactions',
            ],
            weaknesses: [
                'Prone to overfitting without pruning',
                'Can be unstable (high variance)',
                'Biased toward features with many levels',
                'May create overly complex trees',
            ],
            dataRequirements: [
                'Sufficient sample size for reliable splits',
                'Mixed data types acceptable',
                'No strict distributional assumptions',
            ],
            hyperparameters: this.getTreeHyperparameters('regression'),
            implementationFrameworks: ['scikit-learn', 'R (rpart/tree)', 'Weka', 'XGBoost'],
            evaluationMetrics: ['RMSE', 'MAE', 'R²', 'Tree depth', 'Number of leaves'],
            reasoningNotes: [
                'Excellent for discovering non-linear patterns',
                'Provides human-readable decision rules',
                'Foundation for ensemble methods',
            ],
        });
        // Random Forest (if sufficient data)
        if (dataSize > 100 && featureCount >= 3) {
            recommendations.push({
                algorithmName: 'Random Forest Regressor',
                category: 'ensemble_methods',
                suitabilityScore: this.calculateEnsembleSuitability(task, section3Result, dataSize),
                complexity: 'moderate',
                interpretability: 'medium',
                strengths: [
                    'Reduces overfitting compared to single trees',
                    'Handles large datasets efficiently',
                    'Provides feature importance scores',
                    'Robust to noise and outliers',
                    'Good out-of-box performance',
                ],
                weaknesses: [
                    'Less interpretable than single trees',
                    'Can overfit with very noisy data',
                    'Biased toward categorical features with many categories',
                    'Memory intensive for large forests',
                ],
                dataRequirements: [
                    'Sufficient sample size (>100 recommended)',
                    'Multiple features for diversity',
                    'Can handle missing values',
                ],
                hyperparameters: this.getRandomForestHyperparameters(),
                implementationFrameworks: ['scikit-learn', 'randomForest (R)', 'H2O', 'Apache Spark'],
                evaluationMetrics: ['RMSE', 'MAE', 'R²', 'Out-of-bag error', 'Feature importance'],
                reasoningNotes: [
                    'Excellent balance of performance and interpretability',
                    'Robust ensemble method for most regression tasks',
                    'Good for feature selection via importance scores',
                ],
            });
        }
        // Ridge Regression (if multicollinearity suspected)
        if (featureCount > 5) {
            recommendations.push({
                algorithmName: 'Ridge Regression',
                category: 'linear_models',
                suitabilityScore: this.calculateRegularizedRegressionSuitability(task, section3Result, featureCount),
                complexity: 'simple',
                interpretability: 'high',
                strengths: [
                    'Handles multicollinearity well',
                    'Reduces overfitting through regularization',
                    'Stable coefficient estimates',
                    'Works with more features than observations',
                ],
                weaknesses: [
                    'Still assumes linear relationships',
                    'Requires hyperparameter tuning',
                    'Coefficients shrunk toward zero',
                    'Feature scaling required',
                ],
                dataRequirements: [
                    'Linear relationships preferred',
                    'Feature scaling recommended',
                    'Can handle multicollinearity',
                ],
                hyperparameters: [
                    {
                        parameterName: 'alpha',
                        description: 'Regularization strength',
                        defaultValue: 1.0,
                        recommendedRange: '0.001 to 1000 (log scale)',
                        tuningStrategy: 'Cross-validation grid search',
                        importance: 'critical',
                    },
                ],
                implementationFrameworks: ['scikit-learn', 'glmnet (R)', 'statsmodels'],
                evaluationMetrics: ['RMSE', 'MAE', 'R²', 'Cross-validation score'],
                reasoningNotes: [
                    'Ideal when multicollinearity is present',
                    'Good regularized baseline model',
                    'Maintains interpretability with regularization',
                ],
            });
        }
        return recommendations;
    }
    /**
     * Generate classification algorithm recommendations
     */
    generateClassificationRecommendations(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        const featureCount = task.inputFeatures.length;
        const dataSize = section1Result.overview.structuralDimensions.totalDataRows;
        const isBinary = task.targetType === 'binary';
        // Logistic Regression
        recommendations.push({
            algorithmName: isBinary ? 'Logistic Regression' : 'Multinomial Logistic Regression',
            category: 'linear_models',
            suitabilityScore: this.calculateLogisticRegressionSuitability(task, section3Result),
            complexity: 'simple',
            interpretability: 'high',
            strengths: [
                'Probabilistic predictions',
                'Well-understood statistical properties',
                'Fast training and prediction',
                'Good baseline model',
                'Coefficients represent odds ratios',
            ],
            weaknesses: [
                'Assumes linear decision boundary',
                'Sensitive to outliers',
                'May underfit complex patterns',
                'Requires feature scaling',
            ],
            dataRequirements: [
                'Independent observations',
                'No extreme outliers',
                'Sufficient sample size per class',
            ],
            hyperparameters: [
                {
                    parameterName: 'C',
                    description: 'Inverse regularization strength',
                    defaultValue: 1.0,
                    recommendedRange: '0.001 to 1000 (log scale)',
                    tuningStrategy: 'Cross-validation grid search',
                    importance: 'critical',
                },
                {
                    parameterName: 'penalty',
                    description: 'Regularization type',
                    defaultValue: 'l2',
                    recommendedRange: 'l1, l2, elasticnet',
                    tuningStrategy: 'Based on feature selection needs',
                    importance: 'important',
                },
            ],
            implementationFrameworks: ['scikit-learn', 'statsmodels', 'R (glm)', 'H2O'],
            evaluationMetrics: isBinary
                ? ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC AUC', 'Log-loss']
                : ['Accuracy', 'Macro/Micro F1', 'Per-class Precision/Recall', 'Confusion Matrix'],
            reasoningNotes: [
                'Excellent interpretable baseline',
                'Provides probability estimates',
                'Well-suited for linear decision boundaries',
            ],
        });
        // Decision Tree Classifier (CART)
        recommendations.push({
            algorithmName: 'Decision Tree Classifier (CART)',
            category: 'tree_based',
            suitabilityScore: this.calculateTreeSuitability(task, section3Result, 'classification'),
            complexity: 'moderate',
            interpretability: 'high',
            strengths: [
                'Highly interpretable rules',
                'Handles non-linear relationships',
                'No distributional assumptions',
                'Automatic feature selection',
                'Handles mixed data types',
            ],
            weaknesses: [
                'Prone to overfitting',
                'High variance',
                'Biased toward features with many categories',
                'Can create complex trees',
            ],
            dataRequirements: [
                'Sufficient sample size per class',
                'Balanced or manageable class distribution',
            ],
            hyperparameters: this.getTreeHyperparameters('classification'),
            implementationFrameworks: ['scikit-learn', 'R (rpart)', 'C4.5', 'Weka'],
            evaluationMetrics: isBinary
                ? ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Tree depth']
                : ['Accuracy', 'Macro F1', 'Confusion Matrix', 'Tree complexity'],
            reasoningNotes: [
                'Creates interpretable decision rules',
                'Excellent for understanding feature interactions',
                'Good foundation for ensemble methods',
            ],
        });
        // Random Forest Classifier
        if (dataSize > 100) {
            recommendations.push({
                algorithmName: 'Random Forest Classifier',
                category: 'ensemble_methods',
                suitabilityScore: this.calculateEnsembleSuitability(task, section3Result, dataSize),
                complexity: 'moderate',
                interpretability: 'medium',
                strengths: [
                    'High predictive accuracy',
                    'Handles overfitting well',
                    'Provides feature importance',
                    'Works with mixed data types',
                    'Handles class imbalance reasonably',
                ],
                weaknesses: [
                    'Less interpretable than single trees',
                    'Can overfit with noisy data',
                    'Computationally intensive',
                    'Black box compared to single tree',
                ],
                dataRequirements: ['Sufficient sample size', 'Multiple informative features'],
                hyperparameters: this.getRandomForestHyperparameters(),
                implementationFrameworks: ['scikit-learn', 'randomForest (R)', 'H2O'],
                evaluationMetrics: isBinary
                    ? ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC AUC']
                    : ['Accuracy', 'Macro/Micro F1', 'Per-class metrics'],
                reasoningNotes: [
                    'Excellent general-purpose classifier',
                    'Good balance of accuracy and interpretability',
                    'Robust to noise and outliers',
                ],
            });
        }
        return recommendations;
    }
    /**
     * Generate clustering algorithm recommendations
     */
    generateClusteringRecommendations(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        const dataSize = section1Result.overview.structuralDimensions.totalDataRows;
        const featureCount = task.inputFeatures.length;
        // K-Means
        recommendations.push({
            algorithmName: 'K-Means Clustering',
            category: 'unsupervised',
            suitabilityScore: this.calculateKMeansSuitability(task, section3Result, dataSize),
            complexity: 'simple',
            interpretability: 'medium',
            strengths: [
                'Simple and fast algorithm',
                'Works well with spherical clusters',
                'Scalable to large datasets',
                'Well-understood algorithm',
            ],
            weaknesses: [
                'Requires pre-specifying number of clusters',
                'Assumes spherical clusters',
                'Sensitive to initialization',
                'Sensitive to feature scaling',
            ],
            dataRequirements: [
                'Numerical features',
                'Feature scaling recommended',
                'Sufficient sample size',
            ],
            hyperparameters: [
                {
                    parameterName: 'n_clusters',
                    description: 'Number of clusters',
                    defaultValue: 3,
                    recommendedRange: '2 to sqrt(n_samples)',
                    tuningStrategy: 'Elbow method, silhouette analysis',
                    importance: 'critical',
                },
                {
                    parameterName: 'init',
                    description: 'Initialization method',
                    defaultValue: 'k-means++',
                    recommendedRange: 'k-means++, random',
                    tuningStrategy: 'k-means++ usually optimal',
                    importance: 'important',
                },
            ],
            implementationFrameworks: ['scikit-learn', 'R (kmeans)', 'H2O', 'Spark MLlib'],
            evaluationMetrics: ['Silhouette Score', 'Inertia', 'Davies-Bouldin Index'],
            reasoningNotes: [
                'Good starting point for clustering',
                'Fast and scalable',
                'Works well when clusters are roughly spherical',
            ],
        });
        // Hierarchical Clustering
        if (dataSize < 1000) {
            // Computational limitation
            recommendations.push({
                algorithmName: 'Hierarchical Clustering',
                category: 'unsupervised',
                suitabilityScore: this.calculateHierarchicalSuitability(task, section3Result, dataSize),
                complexity: 'moderate',
                interpretability: 'high',
                strengths: [
                    'No need to pre-specify number of clusters',
                    'Produces dendrogram for visualization',
                    'Deterministic results',
                    'Can find nested cluster structures',
                ],
                weaknesses: [
                    'Computationally expensive O(n³)',
                    'Sensitive to noise and outliers',
                    'Difficult to handle large datasets',
                    'Choice of linkage method affects results',
                ],
                dataRequirements: [
                    'Small to medium dataset size',
                    'Distance/similarity metric appropriate',
                ],
                hyperparameters: [
                    {
                        parameterName: 'linkage',
                        description: 'Linkage criterion',
                        defaultValue: 'ward',
                        recommendedRange: 'ward, complete, average, single',
                        tuningStrategy: 'Ward for euclidean distance',
                        importance: 'critical',
                    },
                ],
                implementationFrameworks: ['scikit-learn', 'R (cluster)', 'SciPy'],
                evaluationMetrics: ['Cophenetic correlation', 'Silhouette Score', 'Dendrogram quality'],
                reasoningNotes: [
                    'Excellent for understanding cluster hierarchy',
                    'Visual dendrogram aids interpretation',
                    'Good for small to medium datasets',
                ],
            });
        }
        return recommendations;
    }
    /**
     * Generate time series forecasting recommendations
     */
    generateTimeSeriesRecommendations(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        // ARIMA
        recommendations.push({
            algorithmName: 'ARIMA (AutoRegressive Integrated Moving Average)',
            category: 'linear_models',
            suitabilityScore: 85,
            complexity: 'moderate',
            interpretability: 'medium',
            strengths: [
                'Well-established statistical method',
                'Handles trend and seasonality',
                'Confidence intervals for predictions',
                'Theoretically grounded',
            ],
            weaknesses: [
                'Requires stationary data',
                'Model selection can be complex',
                'Assumes linear relationships',
                'Sensitive to outliers',
            ],
            dataRequirements: [
                'Regular time intervals',
                'Sufficient historical data',
                'Stationary or transformable to stationary',
            ],
            hyperparameters: [
                {
                    parameterName: 'p,d,q',
                    description: 'ARIMA order parameters',
                    defaultValue: '(1,1,1)',
                    recommendedRange: 'Determined by ACF/PACF analysis',
                    tuningStrategy: 'Box-Jenkins methodology',
                    importance: 'critical',
                },
            ],
            implementationFrameworks: ['statsmodels', 'R (forecast)', 'Prophet'],
            evaluationMetrics: ['MAPE', 'RMSE', 'MAE', 'AIC/BIC'],
            reasoningNotes: [
                'Classic approach for time series forecasting',
                'Good baseline for comparison',
                'Well-suited for univariate time series',
            ],
        });
        return recommendations;
    }
    /**
     * Generate anomaly detection recommendations
     */
    generateAnomalyDetectionRecommendations(task, section1Result, section3Result, section5Result) {
        const recommendations = [];
        const dataSize = section1Result.overview.structuralDimensions.totalDataRows;
        // Isolation Forest
        recommendations.push({
            algorithmName: 'Isolation Forest',
            category: 'unsupervised',
            suitabilityScore: 88,
            complexity: 'moderate',
            interpretability: 'low',
            strengths: [
                'Efficient for large datasets',
                'No assumptions about normal data distribution',
                'Works well with high-dimensional data',
                'Linear time complexity',
            ],
            weaknesses: [
                'Difficult to interpret anomaly scores',
                'Parameter tuning can be challenging',
                'May not work well in very high dimensions',
                'Limited explainability',
            ],
            dataRequirements: [
                'Numerical features',
                'Sufficient normal instances',
                'Feature scaling recommended',
            ],
            hyperparameters: [
                {
                    parameterName: 'contamination',
                    description: 'Expected proportion of anomalies',
                    defaultValue: 0.1,
                    recommendedRange: '0.01 to 0.5',
                    tuningStrategy: 'Domain knowledge or validation',
                    importance: 'critical',
                },
            ],
            implementationFrameworks: ['scikit-learn', 'H2O', 'PyOD'],
            evaluationMetrics: ['Precision@K', 'Recall@K', 'AUC-ROC', 'Anomaly Score Distribution'],
            reasoningNotes: [
                'Excellent general-purpose anomaly detector',
                'Scales well to large datasets',
                'Good performance without labeled anomalies',
            ],
        });
        return recommendations;
    }
    // Suitability calculation methods
    calculateLinearRegressionSuitability(task, section3Result) {
        let score = 75; // Base score
        // Adjust based on complexity preference
        if (this.config.complexityPreference === 'simple')
            score += 15;
        if (this.config.interpretabilityRequirement === 'high')
            score += 10;
        return Math.min(100, score);
    }
    calculateTreeSuitability(task, section3Result, taskContext) {
        let score = 80; // Base score
        // Trees are great for interpretability
        if (this.config.interpretabilityRequirement === 'high')
            score += 15;
        if (this.config.complexityPreference === 'moderate')
            score += 5;
        return Math.min(100, score);
    }
    calculateEnsembleSuitability(task, section3Result, dataSize) {
        let score = 85; // Base score
        // Ensembles need sufficient data
        if (dataSize < 100)
            score -= 20;
        if (dataSize > 1000)
            score += 10;
        // Complexity considerations
        if (this.config.complexityPreference === 'simple')
            score -= 10;
        if (this.config.interpretabilityRequirement === 'high')
            score -= 15;
        return Math.min(100, Math.max(0, score));
    }
    calculateLogisticRegressionSuitability(task, section3Result) {
        let score = 80; // Base score
        if (this.config.interpretabilityRequirement === 'high')
            score += 10;
        if (this.config.complexityPreference === 'simple')
            score += 10;
        return Math.min(100, score);
    }
    calculateRegularizedRegressionSuitability(task, section3Result, featureCount) {
        let score = 70; // Base score
        // More features = more beneficial
        if (featureCount > 10)
            score += 15;
        if (featureCount > 20)
            score += 10;
        return Math.min(100, score);
    }
    calculateKMeansSuitability(task, section3Result, dataSize) {
        let score = 80;
        if (dataSize > 1000)
            score += 10;
        if (this.config.complexityPreference === 'simple')
            score += 10;
        return Math.min(100, score);
    }
    calculateHierarchicalSuitability(task, section3Result, dataSize) {
        let score = 75;
        // Penalize for large datasets
        if (dataSize > 500)
            score -= 20;
        if (this.config.interpretabilityRequirement === 'high')
            score += 15;
        return Math.min(100, Math.max(0, score));
    }
    // Hyperparameter generation methods
    getTreeHyperparameters(taskType) {
        return [
            {
                parameterName: 'max_depth',
                description: 'Maximum depth of the tree',
                defaultValue: null,
                recommendedRange: '3 to 20, or None for unlimited',
                tuningStrategy: 'Cross-validation, start with 5-10',
                importance: 'critical',
            },
            {
                parameterName: 'min_samples_split',
                description: 'Minimum samples required to split node',
                defaultValue: 2,
                recommendedRange: '2 to 50',
                tuningStrategy: 'Higher values prevent overfitting',
                importance: 'important',
            },
            {
                parameterName: 'min_samples_leaf',
                description: 'Minimum samples required at leaf node',
                defaultValue: 1,
                recommendedRange: '1 to 20',
                tuningStrategy: 'Higher values create smoother models',
                importance: 'important',
            },
            {
                parameterName: 'criterion',
                description: 'Splitting criterion',
                defaultValue: taskType === 'regression' ? 'squared_error' : 'gini',
                recommendedRange: taskType === 'regression' ? 'squared_error, absolute_error' : 'gini, entropy',
                tuningStrategy: 'Gini usually optimal for classification',
                importance: 'optional',
            },
        ];
    }
    getRandomForestHyperparameters() {
        return [
            {
                parameterName: 'n_estimators',
                description: 'Number of trees in the forest',
                defaultValue: 100,
                recommendedRange: '10 to 1000',
                tuningStrategy: 'More trees generally better, diminishing returns after 100-500',
                importance: 'critical',
            },
            {
                parameterName: 'max_depth',
                description: 'Maximum depth of trees',
                defaultValue: null,
                recommendedRange: '3 to 20, or None',
                tuningStrategy: 'Cross-validation, deeper trees for complex data',
                importance: 'important',
            },
            {
                parameterName: 'min_samples_split',
                description: 'Minimum samples to split node',
                defaultValue: 2,
                recommendedRange: '2 to 20',
                tuningStrategy: 'Higher values reduce overfitting',
                importance: 'important',
            },
            {
                parameterName: 'max_features',
                description: 'Features to consider for best split',
                defaultValue: 'sqrt',
                recommendedRange: 'sqrt, log2, None, or fraction',
                tuningStrategy: 'sqrt for classification, 1/3 for regression',
                importance: 'important',
            },
        ];
    }
}
exports.AlgorithmRecommender = AlgorithmRecommender;
//# sourceMappingURL=algorithm-recommender.js.map