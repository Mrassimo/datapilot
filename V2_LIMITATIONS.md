# V2 Output Known Limitations

## Overview

DataPilot V2 AI-ready output achieves **86.4% size reduction** by removing subjective interpretations and focusing purely on factual data. However, this comes with some current limitations as the V1 analyzers are enhanced to generate the additional factual data needed for complete V2 output.

**Format:** V2 outputs are JSON-only with no markdown narratives.
**Philosophy:** Facts only, zero interpretation, maximum compressibility.
**Use Case:** Designed for AI consumption, not human readability.

---

## Section-by-Section Limitations

### Section 2 (Quality) - Missing Pattern Violation Examples

**Current State:** Pattern violations are reported with counts, but no concrete examples are provided.

**Example V2 Output:**
```json
{
  "pattern_violations": [
    {
      "pattern": "UUID Format",
      "column": "customer_id",
      "violation_count": 5,
      "examples": []  ← EMPTY
    }
  ]
}
```

**Root Cause:** V1 quality analyzer (`src/analyzers/quality/`) doesn't collect violation examples during streaming analysis. It only increments counters.

**Impact:**
- AI agents cannot see actual problematic values
- Users cannot verify if the violation is a false positive
- Harder to understand the nature of the data quality issue

**Workaround:** Run `datapilot quality <file>` with V1 output to see full quality report with examples.

**Roadmap:**
- **Phase 2.1** (8-12 hours): Enhance V1 quality analyzer to collect top 5 examples per violation
- Target: Add `examples: ["C001", "C002", ...]` array to each pattern violation

---

### Section 3 (EDA) - Missing Outlier Examples

**Current State:** Outliers are detected and counted, but the actual outlying values are not included.

**Example V2 Output:**
```json
{
  "outliers": [
    {
      "column": "price",
      "outlier_count": 12,
      "outlier_ratio": 0.024,
      "detection_method": "iqr",
      "examples": []  ← EMPTY
    }
  ]
}
```

**Root Cause:** V1 EDA analyzer (`src/analyzers/eda/`) detects outliers using IQR/Z-score but doesn't store the actual outlying values, only counts them.

**Impact:**
- Cannot verify which values are outliers
- Cannot determine if outliers are data errors or legitimate extreme values
- Missing context for outlier treatment decisions

**Workaround:** Run `datapilot eda <file>` with V1 output to see detailed EDA report.

**Roadmap:**
- **Phase 2.2** (6-8 hours): Enhance V1 EDA analyzer to collect top 10 outliers per numeric column
- Target: Add `examples: [{"value": 9999, "row_index": 42}, ...]` to outlier results

---

### Section 3 (EDA) - Missing Pattern Detection

**Current State:** Text statistics are basic (length, contains_emails, etc.) but no advanced pattern detection.

**Example V2 Output:**
```json
{
  "text_stats": [
    {
      "column": "customer_id",
      "patterns": [],  ← EMPTY
      "contains_urls": false,
      "contains_emails": false
    }
  ]
}
```

**Root Cause:** V1 EDA analyzer doesn't perform regex-based pattern extraction for text columns (e.g., "80% match pattern: C\d{3}").

**Impact:**
- Missing insights about text structure
- Cannot detect common patterns like product codes, account numbers, etc.
- AI agents have less information for schema optimization

**Workaround:** Manually inspect data or use external tools.

**Roadmap:**
- **Phase 2.4** (4-6 hours): Add pattern detection to V1 EDA text analysis
- Target: Extract top 3 patterns per text column with regex and match ratio

---

### Section 5 (Engineering) - Sparse Output

**Current State:** V2 engineering output is minimal, containing mostly type optimization recommendations only.

**Example V2 Output:**
```json
{
  "version": "2.0",
  "type_optimizations": [
    {
      "column": "customer_id",
      "current_type": "string",
      "recommended_type": "category",
      "memory_savings": "60%"
    }
  ],
  "categorical_encoding": [],        ← EMPTY
  "feature_interactions": [],        ← EMPTY
  "binning_candidates": [],          ← EMPTY
  "date_feature_extraction": [],     ← EMPTY
  "text_vectorization": [],          ← EMPTY
  "scaling_recommendations": []      ← EMPTY
}
```

**Root Cause:** V1 engineering analyzer (`src/analyzers/engineering/`) was designed for type optimization only. It doesn't perform advanced feature engineering analysis like:
- Categorical encoding candidate detection (one-hot vs target encoding)
- Feature interaction suggestions (e.g., "price × quantity = total_value")
- Binning recommendations (e.g., "age → age_group")
- Date feature extraction (e.g., "timestamp → day_of_week, hour")
- Text vectorization candidates (TF-IDF, embeddings)
- Scaling recommendations (StandardScaler vs MinMaxScaler)

**Impact:**
- **Severe:** Section 5 is nearly empty, providing minimal value
- AI agents miss critical ML preparation guidance
- Users must manually perform feature engineering analysis

**Workaround:** None available - this is the biggest gap in V2 output.

**Roadmap:**
- **Phase 2.3** (18-24 hours): Major enhancement to V1 engineering analyzer
  - Add categorical encoding detection (cardinality-based heuristics)
  - Add feature interaction detection (correlation-based)
  - Add binning candidate detection (numeric distribution analysis)
  - Add date feature extraction (datetime column detection)
  - Add text vectorization recommendations (text column analysis)
  - Add scaling recommendations (numeric distribution + range analysis)

---

### Section 6 (Modeling) - Limited Feature Candidates

**Current State:** Feature importance/selection candidates are empty.

**Example V2 Output:**
```json
{
  "feature_candidates": []  ← EMPTY
}
```

**Root Cause:** V1 modeling analyzer doesn't perform feature importance analysis. This would require:
- Correlation-based feature selection
- Variance threshold analysis
- Mutual information scores
- Or actual model-based feature importance (requires fitting models)

**Impact:**
- Missing guidance on which features to include in models
- No dimensionality reduction recommendations

**Workaround:** Use external feature selection tools (scikit-learn, etc.)

**Roadmap:**
- **Phase 2.3** (part of engineering enhancement): Add correlation-based feature selection to Section 5
- Section 6 can then reference Section 5 feature candidates

---

## Multi-File Analysis Limitations

**Current State:** V2 output is per-file only. Multi-file relationship analysis (Section 5 enhanced mode) is not yet supported in V2.

**Impact:**
- Cannot get V2 output for foreign key detection across multiple files
- Relationship diagrams not available in V2 format

**Roadmap:**
- **Phase 3** (future): Add multi-file V2 support with relationship metadata

---

## CLI and Integration Limitations

### Validation and Error Handling

**Current State:** V2 adapters lack comprehensive error handling and input validation.

**Risk:**
- Malformed V1 data could crash V2 conversion
- Missing fields in V1 output could cause undefined/null values in V2

**Roadmap:**
- **Phase 1.1** (8-12 hours): Add error handling to all adapters
- **Phase 3.3** (8-12 hours): Add Zod schema validation for V1 input

### Testing Coverage

**Current State:** No unit tests for V2 adapters yet.

**Risk:**
- Regression risk when enhancing adapters
- Difficult to verify correctness of conversions

**Roadmap:**
- **Phase 1.2** (12-16 hours): Add comprehensive unit tests for all adapters

---

## Field Naming Inconsistencies

**Current State:** Some V2 fields use inconsistent naming conventions.

**Examples:**
- Section 4: `encoding_recommendation` (snake_case with "recommendation" suffix)
- Other sections: `algorithm_family`, `data_readiness` (no "recommendation" suffix)

**Impact:**
- Slightly harder for AI agents to parse consistently
- Minor schema inconsistency

**Roadmap:**
- **Phase 3.4** (4-6 hours): Standardize all field names to pure nouns (no "recommendation" suffix)

---

## Migration and Documentation

**Current State:** No migration guide exists for users transitioning from V1 to V2.

**Impact:**
- Users may not understand the tradeoffs
- Unclear when to use V1 vs V2

**Roadmap:**
- **Phase 3.5** (3-4 hours): Create `MIGRATION_GUIDE.md` with:
  - V1 vs V2 comparison table
  - Use case recommendations
  - Code examples for parsing both formats
  - FAQ

---

## Summary of Production Readiness

| Section | Completeness | Main Gaps |
|---------|-------------|-----------|
| Section 1 (Overview) | ✅ **Not in V2** | N/A - Overview stays V1 only |
| Section 2 (Quality) | ⚠️ **80%** | Missing pattern violation examples |
| Section 3 (EDA) | ⚠️ **75%** | Missing outlier examples, missing pattern detection |
| Section 4 (Viz) | ✅ **95%** | Minor field naming inconsistency |
| Section 5 (Engineering) | ❌ **20%** | **Critical:** Nearly empty, only type optimizations |
| Section 6 (Modeling) | ✅ **90%** | Missing feature candidates (depends on Section 5) |

**Overall V2 Production Readiness:** **70%** (up from 0% pre-Phase 0)

**After Phase 0 (Critical Fixes):** 70% → **75%**
**After Phase 1 (Foundation):** 75% → **80%** (error handling + tests)
**After Phase 2 (V1 Enhancements):** 80% → **95%** (complete data capture)
**After Phase 3 (Polish):** 95% → **100%** (production-ready)

---

## When to Use V2 vs V1

### Use V2 When:
- ✅ You need minimal file sizes (86% smaller)
- ✅ Feeding data to AI agents or LLMs
- ✅ Building automated ML pipelines
- ✅ You only need factual data, not narratives
- ✅ You're working with Sections 2, 3, 4, 6 (mostly complete)

### Use V1 When:
- ✅ You need human-readable analysis reports
- ✅ You need Section 5 (Engineering) insights (V2 is sparse)
- ✅ You need pattern violation examples (Section 2)
- ✅ You need outlier examples (Section 3)
- ✅ You're presenting results to stakeholders
- ✅ Multi-file relationship analysis

### Use Both:
Generate both V1 and V2 outputs to get comprehensive insights + AI-ready data:

```bash
# Generate V1 (traditional report)
datapilot all customers.csv -o customers_report.json

# Generate V2 (AI-ready facts)
datapilot all customers.csv --output-version=v2 -o customers_v2.json
```

---

## Reporting Issues

If you encounter unexpected behavior with V2 output:

1. Check this limitations document to see if it's a known gap
2. Verify your V1 input is complete (some sections may be missing data)
3. Report issues at: https://github.com/yourusername/datapilot/issues
4. Include both V1 and V2 output samples

---

## Roadmap Timeline

| Phase | Duration | Completion ETA |
|-------|----------|---------------|
| **Phase 0: Critical Fixes** | ✅ **Complete** | Done |
| **Phase 1: Foundation** | 20-28 hours | TBD |
| **Phase 2: V1 Enhancements** | 32-48 hours | TBD |
| **Phase 3: Polish** | 20-26 hours | TBD |

**Total estimated effort to 100%:** 72-102 hours of development time.

---

## Conclusion

V2 AI-ready output is a **production-ready beta** for Sections 2, 3, 4, and 6. The main limitation is **Section 5 (Engineering)** which is currently sparse due to V1 analyzer gaps. Phase 2 will address this by enhancing V1 analyzers to generate the missing factual data.

For most use cases involving data quality assessment (Section 2) and exploratory analysis (Section 3), V2 output provides excellent value at 86% smaller file sizes.
