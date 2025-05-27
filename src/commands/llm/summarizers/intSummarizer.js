/**
 * INT (Data Integrity) Summary Extractor
 * Extracts critical data quality issues and validation insights for LLM context
 */

export function extractIntSummary(intResults, options = {}) {
  const summary = {
    criticalIssues: [],
    businessRules: [],
    automatedFixes: [],
    qualityScore: null,
    validationFailures: []
  };

  // Extract overall quality score
  if (intResults.overallQuality) {
    summary.qualityScore = {
      score: intResults.overallQuality.score,
      grade: intResults.overallQuality.grade,
      trend: intResults.overallQuality.trend || 'stable'
    };
  }

  // Extract critical data quality issues
  const validationResults = Array.isArray(intResults.validationResults) ? 
    intResults.validationResults : 
    (intResults.validationResults ? [intResults.validationResults] : []);
    
  if (validationResults && validationResults.length > 0) {
    const criticalValidations = validationResults
      .filter(v => v && (v.severity === 'critical' || v.failureRate > 0.1))
      .sort((a, b) => (b.recordsAffected || 0) - (a.recordsAffected || 0))
      .slice(0, 5);
    
    summary.criticalIssues.push(...criticalValidations.map(validation => ({
      type: validation.type,
      column: validation.column,
      issue: validation.description,
      impact: formatImpact(validation),
      fixAvailable: validation.autoFixAvailable || false,
      confidence: validation.confidence || 0.95
    })));
  }

  // Extract detected business rules
  const businessRules = Array.isArray(intResults.businessRules) ? 
    intResults.businessRules : 
    (intResults.businessRules ? [intResults.businessRules] : []);
    
  if (businessRules && businessRules.length > 0) {
    const highConfidenceRules = businessRules
      .filter(rule => rule && (rule.confidence || 0) > 0.95)
      .slice(0, 5)
      .map(rule => ({
        rule: rule.description,
        type: rule.type,
        columns: rule.columns,
        violations: rule.violations || 0,
        confidence: rule.confidence
      }));
    
    summary.businessRules = highConfidenceRules;
  }

  // Extract referential integrity issues
  if (intResults.referentialIntegrity && Array.isArray(intResults.referentialIntegrity)) {
    const orphanedRecords = intResults.referentialIntegrity
      .filter(ref => ref && ref.orphanedCount > 0)
      .map(ref => ({
        type: 'referential_integrity',
        column: ref.foreignKey,
        issue: `${ref.orphanedCount} orphaned records without matching ${ref.referencedTable}`,
        impact: `${((ref.orphanedCount / ref.totalRecords) * 100).toFixed(1)}% of data has invalid references`,
        fixAvailable: true,
        confidence: 1.0
      }));
    
    summary.criticalIssues.push(...orphanedRecords);
  }

  // Extract pattern anomalies - handle both array and object formats
  const patternAnomalies = Array.isArray(intResults.patternAnomalies) ? 
    intResults.patternAnomalies : 
    (intResults.patternAnomalies ? [intResults.patternAnomalies] : []);
    
  if (patternAnomalies && patternAnomalies.length > 0) {
    const significantAnomalies = patternAnomalies
      .filter(anomaly => anomaly && (anomaly.severity === 'high' || anomaly.count > 100))
      .slice(0, 3)
      .map(anomaly => ({
        type: 'pattern_anomaly',
        column: anomaly.column,
        issue: anomaly.description || anomaly.issue,
        impact: `${anomaly.count || 0} records deviate from expected pattern`,
        fixAvailable: anomaly.suggestedFix ? true : false,
        confidence: anomaly.confidence || 0.9
      }));
    
    summary.criticalIssues.push(...significantAnomalies);
  }

  // Extract automated fixes available
  const suggestedFixes = Array.isArray(intResults.suggestedFixes) ? 
    intResults.suggestedFixes : 
    (intResults.suggestedFixes ? [intResults.suggestedFixes] : []);
    
  if (suggestedFixes && suggestedFixes.length > 0) {
    const automatedFixes = suggestedFixes
      .filter(fix => fix && fix.automatable && (fix.confidence || 0) > 0.9)
      .slice(0, 5)
      .map(fix => ({
        issue: fix.issue,
        fix: fix.description,
        recordsAffected: fix.recordsAffected,
        estimatedImprovement: fix.qualityImprovement || 'Unknown',
        sqlSnippet: fix.sqlSnippet || null,
        pythonSnippet: fix.pythonSnippet || null
      }));
    
    summary.automatedFixes = automatedFixes;
  }

  // Extract validation dimension failures
  if (intResults.dimensions) {
    const dimensions = ['completeness', 'accuracy', 'consistency', 'validity', 'uniqueness', 'timeliness'];
    
    dimensions.forEach(dimension => {
      if (intResults.dimensions[dimension]) {
        const dimResult = intResults.dimensions[dimension];
        
        if (dimResult.score < 0.8) {
          summary.validationFailures.push({
            dimension,
            score: dimResult.score,
            mainIssue: dimResult.primaryIssue || `Low ${dimension} score`,
            affectedColumns: dimResult.affectedColumns || [],
            recommendation: getdimensionRecommendation(dimension, dimResult)
          });
        }
      }
    });
  }

  // Australian-specific validations
  if (intResults.australianValidation) {
    const auIssues = [];
    
    if (intResults.australianValidation.invalidPostcodes > 0) {
      auIssues.push({
        type: 'australian_format',
        column: 'postcode',
        issue: `${intResults.australianValidation.invalidPostcodes} invalid Australian postcodes`,
        impact: 'Geographic analysis and shipping calculations affected',
        fixAvailable: true,
        confidence: 1.0
      });
    }
    
    if (intResults.australianValidation.invalidPhones > 0) {
      auIssues.push({
        type: 'australian_format',
        column: 'phone',
        issue: `${intResults.australianValidation.invalidPhones} invalid Australian phone numbers`,
        impact: 'Customer contact data compromised',
        fixAvailable: true,
        confidence: 1.0
      });
    }
    
    summary.criticalIssues.push(...auIssues);
  }

  return summary;
}

function formatImpact(validation) {
  const percentAffected = (validation.recordsAffected / validation.totalRecords) * 100;
  
  if (validation.businessImpact) {
    return validation.businessImpact;
  }
  
  // Generate impact based on validation type
  switch (validation.type) {
    case 'missing_values':
      return `${percentAffected.toFixed(1)}% incomplete data affecting analysis accuracy`;
    
    case 'duplicate_keys':
      return `${validation.recordsAffected} duplicate records inflating metrics`;
    
    case 'referential_integrity':
      return `${percentAffected.toFixed(1)}% orphaned records breaking relationships`;
    
    case 'format_violation':
      return `${validation.recordsAffected} records with invalid format preventing processing`;
    
    case 'business_rule_violation':
      return `${percentAffected.toFixed(1)}% of data violates business constraints`;
    
    case 'outlier':
      return `${validation.recordsAffected} extreme values skewing analysis`;
    
    case 'consistency':
      return `Data inconsistency affecting ${percentAffected.toFixed(1)}% of records`;
    
    default:
      return `${percentAffected.toFixed(1)}% of records affected`;
  }
}

function getdimensionRecommendation(dimension, result) {
  const recommendations = {
    completeness: 'Implement data collection validation and mandatory field enforcement',
    accuracy: 'Add input validation rules and automated correction procedures',
    consistency: 'Standardize data formats and implement consistency checks',
    validity: 'Define clear validation rules and rejection criteria',
    uniqueness: 'Add unique constraints and duplicate detection processes',
    timeliness: 'Implement data freshness monitoring and update schedules'
  };
  
  if (result.specificRecommendation) {
    return result.specificRecommendation;
  }
  
  return recommendations[dimension] || 'Review and improve data quality processes';
}

export function formatIntegrityScore(score) {
  if (score >= 0.95) return { grade: 'A+', label: 'Excellent' };
  if (score >= 0.90) return { grade: 'A', label: 'Very Good' };
  if (score >= 0.85) return { grade: 'B+', label: 'Good' };
  if (score >= 0.80) return { grade: 'B', label: 'Satisfactory' };
  if (score >= 0.75) return { grade: 'C+', label: 'Fair' };
  if (score >= 0.70) return { grade: 'C', label: 'Needs Improvement' };
  if (score >= 0.65) return { grade: 'D', label: 'Poor' };
  return { grade: 'F', label: 'Critical Issues' };
}