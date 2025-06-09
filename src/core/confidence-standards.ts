/**
 * Confidence Standards Documentation
 * Centralized definitions for confidence metrics across all DataPilot sections
 */

export interface ConfidenceMetric {
  name: string;
  section: string;
  description: string;
  methodology: string;
  scale: string;
  interpretation: {
    high: string;
    medium: string;
    low: string;
  };
  factors: string[];
}

export const CONFIDENCE_STANDARDS: Record<string, ConfidenceMetric> = {
  PARSING_CONFIDENCE: {
    name: 'Parsing Confidence',
    section: 'Section 1 - Overview',
    description: 'Confidence in CSV parsing parameter detection (encoding, delimiter, etc.)',
    methodology: 'Statistical analysis of character patterns and field consistency',
    scale: '0-100% with discrete levels: 95% (High), 75% (Medium), 50% (Low)',
    interpretation: {
      high: '95%+ - Detection based on strong statistical evidence',
      medium: '75-94% - Detection based on moderate evidence with some ambiguity',
      low: '50-74% - Detection based on weak evidence, manual verification recommended',
    },
    factors: ['Character frequency analysis', 'Field consistency scoring', 'Pattern recognition'],
  },

  TYPE_DETECTION_CONFIDENCE: {
    name: 'Type Detection Confidence',
    section: 'Section 3 - EDA',
    description: 'Confidence in data type and semantic type classification',
    methodology: 'Rule-based classification with pattern matching and semantic analysis',
    scale: '0.0-1.0 (decimal) where 1.0 = 100% confidence',
    interpretation: {
      high: '0.85+ - Strong evidence for type classification',
      medium: '0.65-0.84 - Moderate evidence, consider manual review',
      low: '0.0-0.64 - Weak evidence, manual classification recommended',
    },
    factors: [
      'Column name analysis',
      'Value pattern matching',
      'Statistical distribution analysis',
      'Domain knowledge rules',
    ],
  },

  VISUALIZATION_CONFIDENCE: {
    name: 'Visualization Confidence',
    section: 'Section 4 - Visualization',
    description: 'Confidence in chart type and visualization recommendations',
    methodology:
      'Multi-factor scoring based on data characteristics and visualization best practices',
    scale: '0.0-1.0 (decimal) with algorithm-specific weights',
    interpretation: {
      high: '0.9+ - Chart type strongly recommended based on data characteristics',
      medium: '0.7-0.89 - Chart type suitable with minor considerations',
      low: '0.0-0.69 - Chart type may be suitable but requires careful evaluation',
    },
    factors: [
      'Data type compatibility',
      'Variable count',
      'Statistical distribution',
      'Accessibility requirements',
      'Performance considerations',
    ],
  },

  QUALITY_SCORE_CONFIDENCE: {
    name: 'Quality Score Confidence',
    section: 'Section 2 - Quality',
    description: 'Confidence in composite data quality score calculation',
    methodology: 'Weighted average of validated quality dimensions with uncertainty propagation',
    scale: 'Implicit confidence based on completeness of quality dimension analysis',
    interpretation: {
      high: 'All 10 quality dimensions successfully evaluated with concrete metrics',
      medium: '7-9 quality dimensions evaluated, some estimated values',
      low: '<7 quality dimensions evaluated, significant estimation required',
    },
    factors: [
      'Data completeness',
      'Sample size',
      'Quality dimension coverage',
      'Business rule availability',
    ],
  },

  ML_READINESS_CONFIDENCE: {
    name: 'ML Readiness Confidence',
    section: 'Section 5 - Engineering',
    description: 'Confidence in machine learning readiness assessment',
    methodology:
      'Composite scoring based on data quality, feature engineering potential, and technical constraints',
    scale: '0-100 score with implicit confidence based on assessment completeness',
    interpretation: {
      high: 'Complete assessment with all technical factors evaluated',
      medium: 'Most factors assessed, some limitations in evaluation scope',
      low: 'Limited assessment due to data constraints or missing information',
    },
    factors: [
      'Feature count and quality',
      'Data volume',
      'Missing value patterns',
      'Feature correlation structure',
      'Technical infrastructure',
    ],
  },

  MODELING_TASK_CONFIDENCE: {
    name: 'Modeling Task Confidence',
    section: 'Section 6 - Modeling',
    description: 'Confidence in modeling task identification and algorithm recommendations',
    methodology: 'Domain analysis combined with statistical characteristics and business context',
    scale: 'Categorical: very_high, high, medium, low',
    interpretation: {
      high: 'Clear task identification with strong algorithm-data alignment',
      medium: 'Probable task identification with good algorithm suitability',
      low: 'Uncertain task identification requiring domain expert validation',
    },
    factors: [
      'Target variable clarity',
      'Domain context',
      'Data characteristics',
      'Problem type recognition',
      'Algorithm requirements',
    ],
  },
};

/**
 * Utility functions for confidence interpretation
 */
export class ConfidenceInterpreter {
  /**
   * Get confidence explanation for a specific metric
   */
  static explain(metricType: keyof typeof CONFIDENCE_STANDARDS, value: number | string): string {
    const standard = CONFIDENCE_STANDARDS[metricType];
    if (!standard) {
      return 'Unknown confidence metric';
    }

    let level: 'high' | 'medium' | 'low' = 'low';

    if (typeof value === 'number') {
      if (metricType === 'PARSING_CONFIDENCE') {
        level = value >= 95 ? 'high' : value >= 75 ? 'medium' : 'low';
      } else {
        level = value >= 0.85 ? 'high' : value >= 0.65 ? 'medium' : 'low';
      }
    }

    return `${standard.interpretation[level]} (${standard.methodology})`;
  }

  /**
   * Get all confidence standards as formatted documentation
   */
  static getDocumentation(): string {
    const sections = Object.values(CONFIDENCE_STANDARDS).map(
      (metric) =>
        `**${metric.name}** (${metric.section}):
- Description: ${metric.description}
- Methodology: ${metric.methodology}
- Scale: ${metric.scale}
- High: ${metric.interpretation.high}
- Medium: ${metric.interpretation.medium}
- Low: ${metric.interpretation.low}
- Factors: ${metric.factors.join(', ')}`,
    );

    return `# DataPilot Confidence Metrics Documentation

${sections.join('\n\n')}`;
  }
}
