# DataPilot Business Value Test Plan

## Objective
Evaluate DataPilot's ability to deliver actionable business insights, not just statistical outputs.

## Success Criteria
1. **Accuracy**: Do the insights match the actual data?
2. **Relevance**: Are the findings business-relevant, not just statistical?
3. **Actionability**: Can a business user make decisions based on the output?
4. **Clarity**: Is the output understandable by non-technical stakeholders?
5. **Completeness**: Does it catch the important patterns a human analyst would find?

## Test Scenarios

### 1. Insurance Risk Analysis (insurance.csv)
**Business Context**: Insurance company needs to understand pricing factors
**Key Questions**:
- What drives insurance charges?
- Are there clear customer segments?
- Is the current pricing fair?
- What are the risk factors?

### 2. Real Estate Investment (melbourne_housing.csv)
**Business Context**: Property investor analyzing market opportunities
**Key Questions**:
- Which suburbs offer best value?
- What features drive property prices?
- Are there market anomalies to exploit?
- When is the best time to buy/sell?

### 3. Quality Control (wine.csv)
**Business Context**: Wine producer ensuring product quality
**Key Questions**:
- What chemical properties indicate quality?
- Are there quality clusters?
- Which metrics should we monitor?
- How consistent is our production?

### 4. Sales Performance (test_sales.csv)
**Business Context**: Sales manager optimizing team performance
**Key Questions**:
- What are the sales trends?
- Which products/regions perform best?
- Are there seasonal patterns?
- Where should we focus efforts?

## Evaluation Framework

### A. Insight Quality (1-10 scale)
- Statistical Accuracy (matches data)
- Business Relevance (addresses real needs)
- Actionability (clear next steps)
- Surprise Factor (finds non-obvious patterns)

### B. Output Usability
- Executive Summary Quality
- Technical Detail Balance
- Visualization Recommendations
- LLM Prompt Effectiveness

### C. Gap Analysis
- What insights were missed?
- What questions remain unanswered?
- What would a human analyst add?
- Where does it fall short?

## Test Execution Process
1. Run command and capture output
2. Manually verify 3-5 key insights against raw data
3. Evaluate business relevance of findings
4. Identify missing insights
5. Rate overall usefulness
6. Document improvement opportunities