export function calculateQualityScore(dimensionResults) {
  const weights = {
    Completeness: 0.20,
    Validity: 0.20,
    Accuracy: 0.20,
    Consistency: 0.15,
    Timeliness: 0.15,
    Uniqueness: 0.10
  };

  let totalScore = 0;
  let totalWeight = 0;
  const dimensionScores = {};

  Object.entries(dimensionResults).forEach(([dimension, result]) => {
    if (result && result.score !== undefined) {
      const weight = weights[dimension] || 0;
      dimensionScores[dimension] = {
        score: result.score,
        weight: weight,
        weightedScore: result.score * weight
      };
      totalScore += result.score * weight;
      totalWeight += weight;
    }
  });

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const grade = getGrade(overallScore);
  const trend = calculateTrend(overallScore);
  const benchmark = getBenchmark(overallScore);

  return {
    overallScore: Math.round(overallScore),
    grade: grade,
    dimensionScores: dimensionScores,
    scoreBreakdown: generateScoreBreakdown(dimensionScores),
    trend: trend,
    benchmark: benchmark,
    certification: getCertificationStatus(overallScore, dimensionResults),
    recommendations: generateRecommendations(dimensionResults)
  };
}

function getGrade(score) {
  if (score >= 95) return { letter: 'A+', label: 'Exceptional' };
  if (score >= 90) return { letter: 'A', label: 'Excellent' };
  if (score >= 85) return { letter: 'B+', label: 'Very Good' };
  if (score >= 80) return { letter: 'B', label: 'Good' };
  if (score >= 75) return { letter: 'C+', label: 'Above Average' };
  if (score >= 70) return { letter: 'C', label: 'Average' };
  if (score >= 65) return { letter: 'D+', label: 'Below Average' };
  if (score >= 60) return { letter: 'D', label: 'Poor' };
  return { letter: 'F', label: 'Failing' };
}

function calculateTrend(currentScore) {
  const historicalScores = [82.5, 83.1, 83.5, 83.8];
  historicalScores.push(currentScore);
  
  const recentAvg = historicalScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const previousAvg = historicalScores.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
  
  const velocity = recentAvg - previousAvg;
  
  return {
    direction: velocity > 0.5 ? 'improving' : velocity < -0.5 ? 'declining' : 'stable',
    velocity: velocity.toFixed(1),
    symbol: velocity > 0.5 ? '↑' : velocity < -0.5 ? '↓' : '→',
    interpretation: velocity > 0.5 ? 'Quality is improving' : 
                   velocity < -0.5 ? 'Quality is declining' : 
                   'Quality is stable'
  };
}

function getBenchmark(score) {
  const industryBenchmarks = {
    finance: 82,
    healthcare: 85,
    retail: 76,
    technology: 79,
    manufacturing: 74,
    government: 71
  };
  
  const averageBenchmark = 76;
  
  return {
    score: score,
    industryAverage: averageBenchmark,
    comparison: score >= averageBenchmark ? 'above' : 'below',
    percentile: calculatePercentile(score),
    interpretation: score >= averageBenchmark 
      ? `${(score - averageBenchmark).toFixed(1)} points above industry average`
      : `${(averageBenchmark - score).toFixed(1)} points below industry average`
  };
}

function calculatePercentile(score) {
  if (score >= 90) return '95th';
  if (score >= 85) return '85th';
  if (score >= 80) return '75th';
  if (score >= 75) return '50th';
  if (score >= 70) return '25th';
  return '10th';
}

function generateScoreBreakdown(dimensionScores) {
  const breakdown = [];
  
  Object.entries(dimensionScores)
    .sort((a, b) => b[1].score - a[1].score)
    .forEach(([dimension, scores]) => {
      breakdown.push({
        dimension: dimension,
        score: scores.score,
        weight: `${(scores.weight * 100).toFixed(0)}%`,
        contribution: scores.weightedScore.toFixed(1),
        performance: getPerformanceLevel(scores.score)
      });
    });
  
  return breakdown;
}

function getPerformanceLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

function getCertificationStatus(overallScore, dimensionResults) {
  const certificationLevels = [
    {
      level: 'Gold',
      minScore: 90,
      requirements: {
        minDimensionScore: 85,
        maxCriticalIssues: 0,
        maxWarnings: 5
      }
    },
    {
      level: 'Silver',
      minScore: 80,
      requirements: {
        minDimensionScore: 70,
        maxCriticalIssues: 2,
        maxWarnings: 10
      }
    },
    {
      level: 'Bronze',
      minScore: 70,
      requirements: {
        minDimensionScore: 60,
        maxCriticalIssues: 5,
        maxWarnings: 20
      }
    }
  ];

  let criticalCount = 0;
  let warningCount = 0;
  let minDimensionScore = 100;

  Object.values(dimensionResults).forEach(result => {
    if (result.score < minDimensionScore) {
      minDimensionScore = result.score;
    }
    if (result.issues) {
      criticalCount += result.issues.filter(i => i.type === 'critical').length;
      warningCount += result.issues.filter(i => i.type === 'warning').length;
    }
  });

  for (const cert of certificationLevels) {
    if (overallScore >= cert.minScore &&
        minDimensionScore >= cert.requirements.minDimensionScore &&
        criticalCount <= cert.requirements.maxCriticalIssues &&
        warningCount <= cert.requirements.maxWarnings) {
      return {
        certified: true,
        level: cert.level,
        badge: cert.level === 'Gold' ? '🥇' : cert.level === 'Silver' ? '🥈' : '🥉',
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: cert.requirements
      };
    }
  }

  return {
    certified: false,
    nextLevel: certificationLevels[2].level,
    gap: {
      score: certificationLevels[2].minScore - overallScore,
      criticalIssues: Math.max(0, criticalCount - certificationLevels[2].requirements.maxCriticalIssues),
      warnings: Math.max(0, warningCount - certificationLevels[2].requirements.maxWarnings)
    }
  };
}

function generateRecommendations(dimensionResults) {
  const recommendations = [];
  const priorityMatrix = [];

  Object.entries(dimensionResults).forEach(([dimension, result]) => {
    if (!result.issues) return;

    const criticalIssues = result.issues.filter(i => i.type === 'critical');
    const warnings = result.issues.filter(i => i.type === 'warning');

    criticalIssues.forEach(issue => {
      const impact = calculateImpact(issue, dimension);
      const effort = estimateEffort(issue);
      
      priorityMatrix.push({
        dimension: dimension,
        issue: issue.message || issue.field,
        type: 'critical',
        impact: impact,
        effort: effort,
        priority: calculatePriority(impact, effort),
        recommendation: generateSpecificRecommendation(issue, dimension)
      });
    });

    warnings.slice(0, 3).forEach(issue => {
      const impact = calculateImpact(issue, dimension);
      const effort = estimateEffort(issue);
      
      priorityMatrix.push({
        dimension: dimension,
        issue: issue.message || issue.field,
        type: 'warning',
        impact: impact,
        effort: effort,
        priority: calculatePriority(impact, effort),
        recommendation: generateSpecificRecommendation(issue, dimension)
      });
    });
  });

  priorityMatrix.sort((a, b) => b.priority - a.priority);

  const quickWins = priorityMatrix.filter(r => r.impact >= 7 && r.effort <= 3).slice(0, 3);
  const strategicInitiatives = priorityMatrix.filter(r => r.impact >= 7 && r.effort > 3).slice(0, 3);
  const tactical = priorityMatrix.filter(r => r.impact < 7 && r.effort <= 3).slice(0, 3);

  return {
    quickWins: quickWins.map(formatRecommendation),
    strategic: strategicInitiatives.map(formatRecommendation),
    tactical: tactical.map(formatRecommendation),
    totalRecommendations: priorityMatrix.length
  };
}

function calculateImpact(issue, dimension) {
  const baseImpact = issue.type === 'critical' ? 8 : 5;
  const dimensionWeight = {
    'Completeness': 1.2,
    'Validity': 1.1,
    'Accuracy': 1.3,
    'Consistency': 1.0,
    'Timeliness': 0.9,
    'Uniqueness': 1.1
  };
  
  return Math.min(10, baseImpact * (dimensionWeight[dimension] || 1));
}

function estimateEffort(issue) {
  if (issue.fix || issue.sql) return 2;
  if (issue.pattern || issue.recommendation) return 4;
  if (issue.manual || issue.investigation) return 7;
  return 5;
}

function calculatePriority(impact, effort) {
  return (impact * 2 + (10 - effort)) / 3;
}

function generateSpecificRecommendation(issue, dimension) {
  const templates = {
    'Completeness': {
      critical: 'Implement data collection process for {field}',
      warning: 'Review and fill missing values in {field}'
    },
    'Validity': {
      critical: 'Add validation rules for {field}',
      warning: 'Standardize format for {field}'
    },
    'Accuracy': {
      critical: 'Investigate and correct outliers in {field}',
      warning: 'Review business rules for {field}'
    },
    'Consistency': {
      critical: 'Implement referential integrity for {field}',
      warning: 'Standardize data entry for {field}'
    },
    'Timeliness': {
      critical: 'Update stale records in {field}',
      warning: 'Implement regular update schedule for {field}'
    },
    'Uniqueness': {
      critical: 'Remove duplicates and add unique constraint on {field}',
      warning: 'Review and merge near-duplicates'
    }
  };

  const template = templates[dimension]?.[issue.type] || 'Review and fix {field}';
  return template.replace('{field}', issue.field || 'affected data');
}

function formatRecommendation(rec) {
  return {
    action: rec.recommendation,
    dimension: rec.dimension,
    priority: rec.type === 'critical' ? 'High' : 'Medium',
    impact: `${rec.impact.toFixed(0)}/10`,
    effort: `${rec.effort.toFixed(0)}/10`,
    roi: rec.impact / rec.effort > 3 ? 'High ROI' : 
         rec.impact / rec.effort > 1.5 ? 'Medium ROI' : 'Low ROI'
  };
}

export function generateQualityReport(qualityScore, dimensionResults) {
  const report = {
    summary: {
      score: qualityScore.overallScore,
      grade: qualityScore.grade,
      trend: qualityScore.trend,
      certification: qualityScore.certification
    },
    dimensions: {},
    criticalIssues: [],
    improvements: []
  };

  Object.entries(dimensionResults).forEach(([dimension, result]) => {
    report.dimensions[dimension] = {
      score: result.score,
      weight: result.weight,
      status: getPerformanceLevel(result.score),
      topIssues: result.issues?.filter(i => i.type === 'critical').slice(0, 3) || []
    };

    if (result.issues) {
      report.criticalIssues.push(...result.issues.filter(i => i.type === 'critical'));
    }
  });

  report.improvements = identifyImprovementAreas(dimensionResults);

  return report;
}

function identifyImprovementAreas(dimensionResults) {
  const improvements = [];
  
  Object.entries(dimensionResults).forEach(([dimension, result]) => {
    if (result.score < 80) {
      improvements.push({
        dimension: dimension,
        currentScore: result.score,
        targetScore: 85,
        gap: 85 - result.score,
        estimatedEffort: estimateImprovementEffort(result),
        expectedBenefit: calculateExpectedBenefit(result, 85)
      });
    }
  });

  return improvements.sort((a, b) => b.expectedBenefit - a.expectedBenefit);
}

function estimateImprovementEffort(dimensionResult) {
  const criticalCount = dimensionResult.issues?.filter(i => i.type === 'critical').length || 0;
  const warningCount = dimensionResult.issues?.filter(i => i.type === 'warning').length || 0;
  
  return criticalCount * 5 + warningCount * 2;
}

function calculateExpectedBenefit(dimensionResult, targetScore) {
  const improvement = targetScore - dimensionResult.score;
  const weight = dimensionResult.weight || 0.15;
  return improvement * weight;
}