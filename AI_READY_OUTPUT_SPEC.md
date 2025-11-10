# AI-Ready Output Specification

## Philosophy
DataPilot extracts **facts**, AI interprets **meaning**.

## Design Principles

### ✅ INCLUDE (Facts)
- Raw numbers (counts, percentages, scores)
- Detected patterns (regex, frequencies)
- Anomaly flags (boolean indicators)
- Statistical measures (mean, median, correlation)
- Examples (actual data samples)

### ❌ REMOVE (Interpretations)
- Subjective labels ("Good", "Poor", "Excellent")
- Verbose descriptions ("This indicates...")
- Recommendations ("You should...")
- Estimated effort/time
- Severity ratings
- Impact assessments
- Explanatory prose

---

## Current Output (BLOAT) vs New Output (LEAN)

### Example: Quality Dimension

#### ❌ CURRENT (1.1MB for 1,318 rows)
```json
{
  "completeness": {
    "score": 91.27,
    "interpretation": "Good",
    "details": "93.15% of cells contain data"
  },
  "topWeaknesses": [
    {
      "description": "accuracy quality needs attention (36% score)",
      "severity": "critical",
      "priority": 10,
      "estimatedEffort": "8-16 hours"
    }
  ],
  "suggestedImputation": {
    "method": "Mode imputation recommended",
    "rationale": "Low percentage of missing categorical values, mode imputation appropriate",
    "confidence": 75
  }
}
```

**Problems:**
- "Good" is subjective
- "needs attention" is interpretation
- "critical" is judgment
- "8-16 hours" is a guess
- Verbose descriptions

#### ✅ NEW (Estimated ~200KB)
```json
{
  "completeness": {
    "cells_with_data": 0.9315,
    "cells_empty": 0.0685
  },
  "accuracy": {
    "rule_violations": 1673,
    "critical_violations": 0,
    "score": 0.36
  },
  "imputation_candidates": {
    "mode_applicable": ["Owner", "Country.of.Origin"],
    "median_applicable": ["Cupper.Points", "Total.Cup.Points"],
    "requires_domain_knowledge": ["Farm.Name", "Altitude"]
  }
}
```

**Benefits:**
- Just numbers
- AI decides if 0.36 is "bad"
- AI decides what's "critical"
- AI estimates effort based on row count

---

## Section-by-Section Redesign

### Section 1: Overview (Metadata)

#### ❌ REMOVE
```json
{
  "summary": "This CSV file contains 1,318 rows and 43 columns...",
  "recommendation": "Dataset is ready for analysis",
  "qualityAssessment": "Good structure detected"
}
```

#### ✅ NEW
```json
{
  "dimensions": { "rows": 1318, "columns": 43 },
  "file_stats": { "size_bytes": 649856, "encoding": "utf-8" },
  "parse_confidence": 0.95,
  "delimiter": ",",
  "has_header": true,
  "header_row": 0,
  "data_start_row": 1
}
```

---

### Section 2: Quality

#### ❌ REMOVE
```json
{
  "cockpit": {
    "compositeScore": {
      "score": 76.85,
      "interpretation": "Fair",
      "details": "Weighted average of 10 quality dimensions"
    },
    "technicalDebt": {
      "timeEstimate": "24 hours estimated cleanup",
      "complexityLevel": "High"
    }
  }
}
```

#### ✅ NEW
```json
{
  "quality_scores": {
    "completeness": 0.9127,
    "accuracy": 0.36,
    "consistency": 0.50,
    "uniqueness": 0.95,
    "validity": 0.9846
  },
  "missing_data": {
    "total_cells_missing": 3951,
    "rows_with_missing": 0.9008,
    "columns_with_missing": 0.4318
  },
  "duplicates": {
    "exact_duplicates": 0,
    "fuzzy_duplicates": 0
  },
  "violations": {
    "rule_violations": 1673,
    "critical_violations": 0,
    "pattern_violations": 20
  }
}
```

---

### Section 3: EDA (Statistical Analysis)

#### ❌ REMOVE
```json
{
  "Altitude": {
    "dataQualityFlag": "Good",
    "inferredSemanticType": "category",
    "interpretation": "This column appears to be categorical",
    "recommendation": "Consider encoding as categorical variable"
  }
}
```

#### ✅ NEW
```json
{
  "Altitude": {
    "stats": {
      "total": 1318,
      "unique": 98,
      "empty_string": 217,
      "null": 19
    },
    "patterns": [
      { "regex": "^\\d+$", "count": 234, "examples": ["1200", "1400"] },
      { "regex": "^\\d+-\\d+$", "count": 89, "examples": ["1950-2200"] },
      { "regex": ".*ft.*", "count": 12, "examples": ["2000 ft"] },
      { "regex": ".*msnm.*", "count": 45, "examples": ["1600 msnm"] }
    ],
    "anomalies": [
      { "type": "url_detected", "count": 11, "examples": ["cafeorganico.mx"] },
      { "type": "company_name_detected", "count": 20, "examples": ["taiwan coffee laboratory"] }
    ],
    "unit_indicators": ["ft", "m", "msnm", "meters"],
    "numeric_percentage": 0.15
  }
}
```

---

### Section 4: Visualization

#### ❌ REMOVE
```json
{
  "recommendedCharts": [
    {
      "chartType": "scatter",
      "description": "A scatter plot would effectively show the relationship between...",
      "reasoning": "This visualization choice is optimal because..."
    }
  ]
}
```

#### ✅ NEW
```json
{
  "chart_candidates": {
    "scatter": {
      "applicable_pairs": [
        ["Cupper.Points", "Total.Cup.Points"],
        ["altitude_mean_meters", "Flavor"]
      ],
      "correlation_scores": [0.87, 0.43]
    },
    "histogram": {
      "applicable_columns": ["Total.Cup.Points", "Cupper.Points"],
      "distribution_types": ["normal", "right_skewed"]
    },
    "bar": {
      "applicable_columns": ["Country.of.Origin", "Species"],
      "category_counts": [53, 9]
    }
  }
}
```

---

### Section 5: Engineering

#### ❌ REMOVE
```json
{
  "schemaOptimization": {
    "recommendation": "Consider converting these columns to more efficient types",
    "reasoning": "This will reduce memory usage and improve performance",
    "estimatedSavings": "40% reduction in memory footprint"
  }
}
```

#### ✅ NEW
```json
{
  "type_optimization": {
    "int_candidates": {
      "columns": ["PassengerId", "Number.of.Bags"],
      "current_type": "text",
      "numeric_percentage": 1.0
    },
    "categorical_candidates": {
      "columns": ["Species", "Country.of.Origin"],
      "unique_ratio": [0.0068, 0.0404]
    }
  },
  "feature_engineering_candidates": {
    "ratio_features": [
      { "numerator": "Flavor", "denominator": "Aroma", "correlation": 0.92 }
    ],
    "binning_candidates": [
      { "column": "altitude_mean_meters", "unique": 287, "range": [890, 3200] }
    ]
  }
}
```

---

### Section 6: Modeling

#### ❌ REMOVE
```json
{
  "recommendedAlgorithms": [
    {
      "algorithm": "Random Forest",
      "reasoning": "Random Forest is well-suited for this problem because...",
      "pros": ["Handles missing values", "Feature importance"],
      "cons": ["Less interpretable", "Slower training"],
      "difficulty": "intermediate",
      "expectedPerformance": "High accuracy expected"
    }
  ]
}
```

#### ✅ NEW
```json
{
  "ml_tasks": [
    {
      "type": "classification",
      "target": "Species",
      "classes": 9,
      "class_balance": { "Arabica": 0.98, "Robusta": 0.02 },
      "feature_count": 42,
      "sample_size": 1318
    },
    {
      "type": "regression",
      "target": "Total.Cup.Points",
      "range": [59.83, 90.58],
      "distribution": "normal",
      "feature_count": 42
    }
  ],
  "algorithm_applicability": {
    "linear_models": { "applicable": true, "feature_collinearity": 0.87 },
    "tree_models": { "applicable": true, "categorical_features": 23 },
    "neural_networks": { "applicable": false, "reason": "small_sample_size" }
  },
  "data_readiness": {
    "missing_data": 0.0685,
    "categorical_encoding_required": true,
    "scaling_required": true,
    "feature_count": 42,
    "sample_size": 1318
  }
}
```

---

## Output Size Comparison

### Current (BLOAT)
- Coffee dataset (1,318 rows, 43 cols)
  - quality.json: 29KB
  - eda.json: 1.1MB
  - modeling.json: 76KB
  - **TOTAL: ~1.2MB**

### New (LEAN) - Estimated
- Coffee dataset (same)
  - quality.json: ~5KB (83% reduction)
  - eda.json: ~150KB (86% reduction)
  - modeling.json: ~12KB (84% reduction)
  - **TOTAL: ~170KB (85% reduction)**

---

## Implementation Priority

### Phase 1: Core Structure
1. Remove all "interpretation", "description", "reasoning" fields
2. Remove all "recommendation" fields
3. Convert scores from 0-100 to 0-1 decimals
4. Remove severity/priority/impact ratings

### Phase 2: Pattern Detection
1. Add regex pattern detection with counts
2. Add anomaly flags (boolean/counts only)
3. Add examples for every pattern
4. Add unit indicators detection

### Phase 3: AI Integration
1. Test with Claude Code on real datasets
2. Validate AI can extract insights
3. Measure time to insight
4. Compare vs current verbose format

---

## Success Metrics

### Quantitative
- ✅ Output size reduced by 80%+
- ✅ Parse time for AI < 1 second
- ✅ JSON depth < 5 levels
- ✅ No strings > 100 characters

### Qualitative
- ✅ Claude can identify all issues we manually found
- ✅ Claude provides better recommendations than current output
- ✅ No loss of critical information
- ✅ Faster insight generation

---

## Migration Strategy

### Backwards Compatibility
- Keep old format in separate branch
- Add version field to output: `"output_version": "2.0"`
- Document breaking changes

### User Communication
- Update README: "AI-First Design"
- Add examples showing Claude consumption
- Create migration guide for existing tools

---

## Next Steps

1. ✅ Create branch: `ai-ready-output-redesign`
2. [ ] Refactor Section 2 formatter (biggest bloat)
3. [ ] Refactor Section 3 formatter (1.1MB → ~150KB)
4. [ ] Test with coffee.csv dataset
5. [ ] Validate with Claude interpretation
6. [ ] Refactor remaining sections
7. [ ] Update all tests
8. [ ] Commit and push
