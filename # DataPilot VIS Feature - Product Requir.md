# DataPilot VIS Feature - Product Requirements Document

## Executive Summary

The Visualisation (VIS) feature transforms from basic chart recommendations into a comprehensive Visual Intelligence System. Based on scientific visualisation theory and perceptual research, it automatically analyses data patterns and prescribes optimal visualisations with specific implementation details, all without configuration flags.

## Design Philosophy

1. **Zero Configuration**: Run `datapilot vis file.csv` - automatic visual intelligence
2. **Scientific Foundation**: Based on Cleveland, Tufte, and modern research
3. **Grammar of Graphics**: Systematic approach to visual encoding
4. **Perceptual Optimisation**: Recommendations based on human visual system
5. **Implementation Ready**: Specific enough to build exactly what's recommended

## Feature Overview

### Current State
- Basic chart type suggestions
- Simple axis recommendations
- Generic insight callouts

### Expanded Capabilities
- Perceptual effectiveness ranking
- Statistical graphic design
- Visual encoding optimisation
- Interaction design patterns
- Accessibility specifications
- Anti-pattern detection
- Dashboard composition
- Storytelling sequences
- Colour theory application
- Implementation specifications

## Detailed Feature Specifications

### 1. Intelligent Visual Analysis

The system automatically determines optimal visualisations:

```javascript
Visual Priority Logic:
- Primary Task: What question does the data answer?
- Data Types: Continuous, discrete, ordered, categorical
- Cardinality: Number of unique values per dimension
- Data Density: Points per pixel considerations
- Relationships: Correlations, hierarchies, time series
- Audience: Technical vs executive vs public
```

### 2. Core Visualisation Framework

#### 2.1 Task-Based Recommendation Engine

Maps data patterns to visual tasks:

```
VISUAL TASK ANALYSIS:

Primary Task Detected: Trend Analysis
- Temporal pattern strength: 0.89
- Seasonality detected: Monthly cycle
- Recommendation: Connected scatterplot with trend overlay

Secondary Tasks:
1. Part-to-whole comparison (5 categories = 100%)
2. Correlation exploration (3 key relationships)
3. Outlier identification (2.3% extreme values)
4. Distribution understanding (multimodal detected)

Task Priority Ranking:
1. Show change over time → Line/Area chart
2. Compare categories → Bar/Column chart  
3. Show relationships → Scatterplot
4. Show distribution → Histogram/Density
5. Show composition → Stacked/Pie (only if <5 parts)
```

#### 2.2 Perceptual Effectiveness Framework

Based on Cleveland & McGill's hierarchy:

```
PERCEPTUAL ENCODING EFFECTIVENESS:

For Your Data (sales_amount by region):
1. Position along scale ★★★★★ (Most accurate)
   → Bar chart: Regions on Y, sales on X
   
2. Length ★★★★☆ (Very accurate)
   → Column chart: Height encodes sales
   
3. Angle ★★☆☆☆ (Less accurate)
   ✗ Avoid: Pie chart for 8 regions
   
4. Area ★★☆☆☆ (Difficult to compare)
   ✗ Avoid: Bubble chart for precise values

Recommended Encoding:
- Primary: Position (horizontal bar chart)
- Secondary: Colour (profit margin)
- Interaction: Details on hover

Why This Works:
- Position: ±5% error rate in perception
- Angle: ±15% error rate (3x worse)
- Sorted bars: Enable easy ranking
- Horizontal: Better label readability
```

### 3. Advanced Visualisation Modules

#### 3.1 Statistical Graphics Intelligence

Sophisticated statistical visualisations:

```
STATISTICAL GRAPHICS RECOMMENDATIONS:

[VISUALISATION 1] Distribution Analysis
Data: customer_age (n=10,542, range: 18-95)

Recommended: Violin Plot with Embedded Box Plot
Why not histogram? Bin size sensitivity
Why not density? Need to show outliers

Specific Design:
- Kernel: Gaussian, bandwidth: 2.3 (Silverman's rule)
- Y-axis: Age (continuous)
- X-axis: Customer segment (categorical)
- Violin width: Proportional to density
- Embedded elements:
  * White dot: Median
  * Thick bar: IQR
  * Thin line: 1.5×IQR
  * Points: Outliers beyond 1.5×IQR

Statistical Annotations:
- Mean: 42.3 years (dashed line)
- Median: 41.0 years (solid line)
- Skewness: 0.34 (slight right skew)
- Modality: Unimodal with shoulder at 65

Implementation:
```python
sns.violinplot(data=df, x='segment', y='age', 
               inner='box', cut=0, scale='width')
plt.axhline(42.3, ls='--', color='red', alpha=0.5)
```

[VISUALISATION 2] Uncertainty Visualisation
Data: revenue_forecast with confidence intervals

Recommended: Fan Chart (Gradient Uncertainty)
Why? Shows increasing uncertainty over time

Design Specifications:
- X-axis: Time (next 12 months)
- Y-axis: Revenue forecast
- Central line: Median prediction
- Bands: 50%, 80%, 95% prediction intervals
- Colour gradient: Darker = more certain

Visual Encoding:
- Opacity: 0.8 for 50%, 0.5 for 80%, 0.3 for 95%
- Colour: Single hue, varying saturation
- Animation: Gradual reveal left-to-right

Annotation Layer:
- Mark actual vs predicted divergence points
- Highlight confidence interval breaches
- Show prediction error metrics
```

#### 3.2 Multivariate Visualisation Patterns

For complex dimensional data:

```
MULTIVARIATE ANALYSIS:

Data Dimensions: 6 continuous, 3 categorical
Records: 10,542

[OPTION 1] Parallel Coordinates Plot
Best for: Finding patterns across all dimensions
Design:
- Axes: Standardised to [0,1]
- Line opacity: 0.05 (handle overplotting)
- Interaction: Brush to filter
- Colour: Encode primary category
- Axis ordering: By correlation strength

Key Features:
- Detect multivariate outliers
- See dimension correlations
- Identify clusters
- Interactive filtering essential

[OPTION 2] Scatterplot Matrix (SPLOM)
Best for: Pairwise relationship exploration
Enhanced Design:
- Lower triangle: Scatterplots
- Diagonal: Density plots  
- Upper triangle: Correlation values
- Cell highlighting: |r| > 0.5

Perceptual Optimisation:
- Point size: 2px (optimal for density)
- Alpha: 0.3 (see overlaps)
- Regression lines: Only if R² > 0.3
- Brushing: Linked across all plots

[OPTION 3] Dimensionality Reduction Plot
Best for: Overall pattern recognition
Method: UMAP (preserves local structure)
Design:
- 2D projection of 6D space
- Colour: Primary category
- Size: Another metric (optional)
- Contours: Density regions

Annotations:
- Label cluster centres
- Show projection quality metric
- Explain 3 most important dimensions
```

#### 3.3 Time Series Visualisation Suite

Advanced temporal patterns:

```
TIME SERIES VISUALISATION ANALYSIS:

Data Characteristics:
- Frequency: Daily observations
- Duration: 18 months
- Seasonality: Weekly, monthly detected
- Trend: Upward, non-linear

[PRIMARY] Horizon Chart
Why? High data density (540 days) in limited space
Design:
- Bands: 3 positive, 3 negative from baseline
- Baseline: 12-month moving average
- Colour: Blue (+) to red (-) through white
- Height: 3× compression (saves 67% space)

Perceptual Benefits:
- See patterns at multiple scales
- Identify anomalies quickly
- Compare multiple series vertically

[SECONDARY] Connected Scatterplot
Why? Shows path through time, reveals cycles
Design:
- X: Day of week effect
- Y: Detrended values
- Line: Connects chronologically
- Colour gradient: Time progression
- Annotations: Mark key events

Reveals:
- Tuesday spike pattern
- Weekend decline
- Holiday effects
- Operational cycles

[TERTIARY] Calendar Heatmap
Why? Natural time navigation, pattern detection
Design:
- Layout: GitHub contribution style
- Colour: Diverging from median
- Borders: White, 2px (visual separation)
- Tooltips: Exact values + context

Patterns Visible:
- Day-of-week effects (vertical)
- Monthly patterns (blocks)
- Holidays/events (gaps)
- Consistency over time
```

#### 3.4 Composition & Hierarchy Visualisations

For part-to-whole relationships:

```
HIERARCHICAL DATA VISUALISATION:

Data Structure: 3 levels, 47 total nodes
Total Value: $12.4M

[RECOMMENDED] Sunburst Chart
Why chosen over alternatives:
- Treemap: Poor for 3+ levels
- Pie: Can't show hierarchy
- Icicle: Wastes corner space

Optimised Design:
- Centre: Total with key metric
- Ring width: Equal (not proportional)
- Colour: Diverging by growth rate
- Labels: Only top 2 levels
- Interaction: Click to zoom

Perceptual Enhancements:
- Gap between rings: 2px (clarity)
- Hover: Highlight path to root
- Transition: 300ms ease-in-out
- Sort: Largest segments first

Statistical Integration:
- Size: Revenue (area proportional)
- Colour: YoY growth (diverging)
- Opacity: Confidence (0.5-1.0)
- Pattern: Significant change (stripes)

[ALTERNATIVE] Zoomable Circle Packing
When to use: >100 nodes, exploration focus
Benefits: Shows size AND hierarchy
Interaction: Zoom on click, breadcrumb trail
```

#### 3.5 Correlation & Relationship Visualisations

```
RELATIONSHIP VISUALISATION:

Correlation Matrix: 15 variables

[ANTI-PATTERN WARNING]
✗ Don't use: Basic heatmap (too many cells)
✗ Don't use: 3D surface (distorts perception)

[RECOMMENDED] Hierarchical Clustering Heatmap
Design Decisions:
- Clustering: Variables AND observations
- Distance: 1 - |correlation|
- Colour: Diverging (RdBu) through zero
- Annotations: Values if |r| > 0.5
- Dendrograms: Both axes

Perceptual Optimisation:
- Cell size: Minimum 20×20px
- Colour steps: 9 (discriminable)
- Gridlines: Light grey, 0.5px
- Font: Cell values at 10px

Interactive Features:
- Click dendrogram: Collapse/expand
- Hover: Show scatterplot
- Brush: Highlight related vars
- Export: Correlation matrix

[ENHANCEMENT] Network Graph Overlay
For |r| > 0.7 relationships:
- Nodes: Variables
- Edges: Strong correlations
- Width: Correlation strength
- Colour: Positive (blue) vs negative (red)
- Layout: Force-directed
```

#### 3.6 Dashboard Composition Intelligence

Optimal layout algorithms:

```
DASHBOARD COMPOSITION ANALYSIS:

Content Inventory:
- 1 primary metric (KPI)
- 1 time series (trend)
- 3 comparisons (categories)
- 1 geographic view
- 2 detail tables

[RECOMMENDED LAYOUT]
Based on eye-tracking research & Gestalt principles:

┌─────────────────────────────────────────┐
│ KPI Cards (20%)                         │
│ [Revenue] [Growth] [Customers] [NPS]    │
├─────────────────────────────┬───────────┤
│ Time Series (40%)           │ Geographic│
│ 12-month trend with         │ Heat Map  │
│ forecast shading            │ (30%)     │
├──────────┬──────────────────┴───────────┤
│ Category │ Detailed Table               │
│ Compare  │ Paginated, sortable          │
│ (30%)    │ (40%)                        │
└──────────┴──────────────────────────────┘

Visual Hierarchy Score: 94/100
- Clear primary focus ✓
- F-pattern reading path ✓
- 5±2 components ✓
- Consistent margins ✓

Responsive Breakpoints:
- Desktop: Full layout (>1200px)
- Tablet: Stack geographic under time series
- Mobile: Full vertical stack

Interaction Flow:
1. KPI click → Filter all views
2. Time brush → Update time range
3. Map click → Filter by region
4. Cross-filtering between all components
```

#### 3.7 Colour Theory Application

Scientific colour selection:

```
COLOUR PALETTE ANALYSIS:

Data Characteristics:
- Categories: 5 (optimal for discrimination)
- Values: Revenue (continuous, positive)
- Sentiment: Growth rates (diverging)
- Accessibility: WCAG AAA required

[CATEGORICAL PALETTE]
Selected: ColorBrewer Set2
- Perceptual distance: Maximised
- Colourblind safe: Yes (all types)
- Print safe: Yes
- Cultural neutral: Yes

Specific Colours:
1. #66C2A5 (Teal) - Primary category
2. #FC8D62 (Orange) - Secondary
3. #8DA0CB (Blue) - Tertiary
4. #E78AC3 (Pink) - Quaternary
5. #A6D854 (Green) - Quinary

[SEQUENTIAL PALETTE]
For: Revenue heat map
Selected: Viridis
- Perceptually uniform ✓
- Monotonic brightness ✓
- Colourblind safe ✓
- Works in greyscale ✓

[DIVERGING PALETTE]
For: Growth rate (±%)
Selected: RdBu
- White at zero
- Equal perceptual weight
- Intuitive: Red=negative
- 9 discriminable steps

[ACCESSIBILITY NOTES]
- Contrast ratio: 7:1 minimum
- Never rely on colour alone
- Patterns for critical distinctions
- Direct labels where possible
```

#### 3.8 Interaction Design Patterns

Based on Shneiderman's mantra:

```
INTERACTION DESIGN SPECIFICATIONS:

Progressive Disclosure Pattern:
1. Overview: All data, aggregated
2. Zoom & Filter: Time range, categories
3. Details on Demand: Tooltips, drill-down

Specific Interactions by Chart Type:

[LINE CHART INTERACTIONS]
- Hover: Vertical line with all values
- Click: Stick tooltip for comparison
- Drag: Brush time range
- Double-click: Reset zoom
- Scroll: Zoom X-axis
- Shift+Scroll: Zoom Y-axis

[BAR CHART INTERACTIONS]  
- Hover: Highlight + tooltip
- Click: Filter other views
- Drag: Reorder categories
- Right-click: Sort options

[SCATTERPLOT INTERACTIONS]
- Hover: Highlight point + details
- Drag: Lasso selection
- Click: Select/deselect
- Zoom: Box zoom
- Pan: Click and drag

Response Time Requirements:
- Hover feedback: <100ms
- Click action: <200ms
- Filter update: <500ms
- Smooth animation: 60fps

Affordance Indicators:
- Cursor changes on hoverable
- Subtle shadows on clickable
- Resize handles visible
- Drag indicators on reorderable
```

#### 3.9 Anti-Pattern Detection

What NOT to do:

```
VISUALISATION ANTI-PATTERNS DETECTED:

[WARNING 1] Pie Chart Overuse
Your data: 12 categories
Problem: >7 slices unreadable
Impact: 40% perception error rate
Alternative: Horizontal bar chart
Benefit: 5% error rate (8× better)

[WARNING 2] Dual Y-Axis Considered
Metrics: Revenue ($) and Units (#)
Problem: Implies correlation that may not exist
Confusion rate: 68% misinterpret
Alternative: Small multiples
Benefit: Clear, unambiguous

[WARNING 3] 3D Effects Temptation
Request: "Make it pop"
Problem: Distorts data encoding
Depth perception: 45% error rate
Alternative: Strong 2D design
- Use whitespace
- Bold colours
- Clear hierarchy

[WARNING 4] Rainbow Colour Scale
Current: 12 different hues
Problem: Non-uniform perception
- Yellow appears brighter
- No logical order
Alternative: Single-hue gradient
Or: ColorBrewer qualitative

[WARNING 5] Overcrowding
Points per pixel: >10
Problem: Overplotting hides patterns
Solutions:
1. Hexbin aggregation
2. Density contours
3. Sampling
4. Transparency

Design Principle Violations:
- Data-ink ratio: 0.2 (target >0.5)
- Chartjunk detected: Grid too heavy
- Lie factor: 1.4 (>1.05 is deceptive)
```

### 4. Output Structure

Complete analysis follows this flow:

```
=== VISUALISATION ANALYSIS ===
Dataset: [filename]
Generated: [timestamp]
Framework: Grammar of Graphics + Cleveland/Tufte Principles

VISUAL PRIORITIES BASED ON DATA
↓
RECOMMENDED VISUALISATION SEQUENCE
↓
[For each visualisation:]
  - Purpose & Task
  - Visual Encoding Specification
  - Perceptual Effectiveness Score
  - Specific Implementation
  - Statistical Enhancements
  - Interaction Design
↓
DASHBOARD COMPOSITION
↓
COLOUR PALETTE SELECTION
↓
INTERACTION SPECIFICATIONS
↓
ACCESSIBILITY REQUIREMENTS
↓
ANTI-PATTERN WARNINGS
↓
EXPORT RECOMMENDATIONS
↓
IMPLEMENTATION EXAMPLES
```

### 5. Implementation Specifications

For each recommended visualisation:

```
IMPLEMENTATION READY SPECIFICATIONS:

[Example: Time Series Visualisation]

Grammar of Graphics Specification:
DATA: sales_data
TRANS: rolling_mean(window=7)
SCALE: x=time(linear), y=revenue(log)
COORD: cartesian
GEOM: line(size=2) + point(size=1)
FACET: ~product_category

D3.js Implementation:
```javascript
const xScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([margin.left, width - margin.right]);

const yScale = d3.scaleLog()
  .domain(d3.extent(data, d => d.revenue))
  .range([height - margin.bottom, margin.top]);

const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.revenue))
  .curve(d3.curveMonotoneX);
```

Python Implementation:
```python
import plotly.graph_objects as go

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=df['date'], 
    y=df['revenue'],
    mode='lines+markers',
    line=dict(width=2),
    marker=dict(size=4)
))
fig.update_yaxis(type='log')
fig.update_layout(height=400, margin=dict(l=50,r=20,t=40,b=40))
```

R/ggplot2 Implementation:
```r
ggplot(data, aes(x=date, y=revenue)) +
  geom_line(size=1.2) +
  geom_point(size=2) +
  scale_y_log10() +
  theme_minimal() +
  theme(panel.grid.minor = element_blank())
```
```

### 6. Performance Considerations

```javascript
Performance Optimisation Rules:
- >1000 points: Consider aggregation
- >10000 points: Implement sampling
- >100000 points: Use WebGL/Canvas
- Dense overlaps: Hexbin or contours
- Animation: RequestAnimationFrame
- Large dashboards: Virtualised scrolling
```

### 7. Technical Implementation

#### 7.1 Dependencies
```json
{
  "dependencies": {
    "simple-statistics": "^7.8.0",  // Statistical calculations
    "colorbrewer": "^1.5.0",        // Colour palettes
    "d3-scale": "^4.0.0",          // Scale calculations
    "cleveland": "^1.0.0",          // Perceptual rankings
    "wcag-contrast": "^3.0.0",      // Accessibility
    "grammar-of-graphics": "^2.0.0" // Visual grammar
  }
}
```

#### 7.2 Module Structure
```
src/commands/vis/
├── index.js                    // Main orchestrator
├── analysers/
│   ├── taskDetector.js        // Visual task identification
│   ├── dataProfiler.js        // Data characteristic analysis
│   ├── patternFinder.js       // Pattern detection
│   └── relationshipMapper.js   // Correlation/hierarchy finding
├── recommenders/
│   ├── chartSelector.js       // Chart type selection
│   ├── encodingOptimiser.js   // Visual encoding choices
│   ├── layoutComposer.js      // Dashboard composition
│   └── interactionDesigner.js // Interaction patterns
├── evaluators/
│   ├── perceptualScorer.js    // Effectiveness rating
│   ├── accessibilityChecker.js // WCAG compliance
│   ├── antipatternDetector.js // Warning generation
│   └── clutterAnalyser.js     // Overplotting detection
├── generators/
│   ├── specGenerator.js       // Grammar of graphics specs
│   ├── codeGenerator.js       // Implementation code
│   ├── paletteSelector.js     // Colour selection
│   └── annotationEngine.js    // Insight annotations
└── utils/
    ├── statistical.js         // Statistical graphics
    └── formatting.js          // Output formatting
```

### 8. Success Metrics

1. **Perceptual Accuracy**: Recommended charts have <10% error rate
2. **Task Alignment**: 90% of visualisations match intended task
3. **Accessibility**: 100% WCAG AA, 95% AAA compliant
4. **Implementation Success**: 95% of specs buildable as-is
5. **Anti-pattern Prevention**: Zero harmful visualisations

### 9. Testing Requirements

1. **Perceptual Validation**:
   - A/B test recommendations vs alternatives
   - Measure task completion accuracy
   - Time to insight metrics

2. **Coverage Testing**:
   - All data type combinations
   - Various cardinalities
   - Edge cases (single point, all same, etc.)

3. **Output Validation**:
   - Code examples execute correctly
   - Specifications complete
   - Accessibility requirements met

### 10. Example Use Cases

1. **Data Scientist**: "What's the best way to show model performance?"
2. **Product Manager**: "How should I present user engagement metrics?"
3. **Executive**: "Design a dashboard for board presentation"
4. **Analyst**: "Visualise customer segmentation results"
5. **Researcher**: "Show experimental results with uncertainty"

## Conclusion

The expanded VIS feature transforms DataPilot into a scientific visualisation advisor. By automatically analysing data patterns and applying perceptual research, it provides specific, implementable visualisation recommendations that are both beautiful and effective. Users simply run `datapilot vis file.csv` and receive comprehensive visual intelligence to create impactful data stories.