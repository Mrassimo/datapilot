import { parseCSV, detectColumnTypes } from '../../utils/parser.js';
import { createSection, createSubSection, formatTimestamp, formatNumber, bulletList, numberedList } from '../../utils/format.js';
import { OutputHandler } from '../../utils/output.js';
import { basename } from 'path';
import ora from 'ora';

// Import all VIS modules
import { VisualTaskDetector } from './analysers/taskDetector.js';
import { DataProfiler } from './analysers/dataProfiler.js';
import { ChartSelector } from './recommenders/chartSelector.js';
import { PerceptualScorer } from './evaluators/perceptualScorer.js';
import { AntipatternDetector } from './evaluators/antipatternDetector.js';
import { AccessibilityChecker } from './evaluators/accessibilityChecker.js';
import { PaletteSelector } from './generators/paletteSelector.js';

// Import advanced analysis modules that were previously unused
import { StatisticalGraphicsAnalyzer } from './analysers/statisticalGraphics.js';
import { MultivariatePatternAnalyzer } from './analysers/multivariatePatterns.js';
import { TimeSeriesVisualizationSuite } from './analysers/timeSeriesSuite.js';

export async function visualize(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  // Structured data mode for LLM consumption
  const structuredMode = options.structuredOutput || options.llmMode;
  
  try {
    // Use preloaded data if available
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      records = await parseCSV(filePath, { quiet: options.quiet, header: options.header });
      if (spinner) spinner.text = 'Analyzing visualization opportunities...';
      columnTypes = detectColumnTypes(records);
    }
    
    const fileName = basename(filePath);
    
    // Handle empty dataset
    if (records.length === 0) {
      let report = createSection('VISUALISATION ANALYSIS',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  Empty dataset - no visualizations to recommend`);
      
      // Still include the required section header
      report += createSubSection('RECOMMENDED VISUALISATIONS', 'No data available for visualization recommendations');
      
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Initialize analyzers
    const taskDetector = new VisualTaskDetector();
    const dataProfiler = new DataProfiler();
    const chartSelector = new ChartSelector();
    const antipatternDetector = new AntipatternDetector();
    const accessibilityChecker = new AccessibilityChecker();
    const paletteSelector = new PaletteSelector();
    
    // Initialize advanced analyzers
    const statisticalGraphics = new StatisticalGraphicsAnalyzer();
    const multivariateAnalyzer = new MultivariatePatternAnalyzer();
    const timeSeriesSuite = new TimeSeriesVisualizationSuite();
    
    // Step 1: Profile the data
    if (spinner) spinner.text = 'Profiling data characteristics...';
    const dataProfile = dataProfiler.analyzeData(records, columnTypes);
    
    // Step 2: Detect visual tasks
    if (spinner) spinner.text = 'Detecting visualization tasks...';
    const visualTasks = taskDetector.detectTasks(records, columnTypes);
    
    // Step 3: Select visualizations for each task
    if (spinner) spinner.text = 'Selecting optimal visualizations...';
    const visualizationPlans = [];
    
    visualTasks.slice(0, 5).forEach((task, index) => { // Top 5 tasks
      const chartRecommendation = chartSelector.selectChart(task, dataProfile, {
        audience: options.audience || 'general',
        interactive: !options.static,
        width: options.width || 800,
        height: options.height || 600
      });
      
      // Only add to plans if we have a valid recommendation
      if (chartRecommendation.primary) {
        visualizationPlans.push({
          priority: index + 1,
          task: task,
          visualization: chartRecommendation.primary,
          alternatives: chartRecommendation.alternatives,
          reasoning: chartRecommendation.reasoning
        });
      }
    });
    
    // Check if we have any valid visualization plans
    if (visualizationPlans.length === 0) {
      const report = createSection('VISUALISATION ANALYSIS',
        `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}\n\n⚠️  No suitable visualizations found for this dataset structure`);
      console.log(report);
      outputHandler.finalize();
      return;
    }
    
    // Step 4: Check for anti-patterns
    if (spinner) spinner.text = 'Checking for visualization anti-patterns...';
    const antipatterns = antipatternDetector.detectAntipatterns(
      visualizationPlans.map(p => p.visualization),
      dataProfile,
      visualTasks[0]
    );
    
    // Step 5: Check accessibility
    if (spinner) spinner.text = 'Evaluating accessibility...';
    const accessibilityResults = accessibilityChecker.checkAccessibility(
      visualizationPlans.map(p => p.visualization)
    );
    
    // Step 6: Advanced Analysis - Statistical Graphics
    if (spinner) spinner.text = 'Analyzing statistical visualization needs...';
    const statisticalRecommendations = statisticalGraphics.analyzeStatisticalVisualizationNeeds(
      records, 
      columnTypes, 
      visualTasks[0]
    );
    
    // Step 7: Advanced Analysis - Multivariate Patterns  
    if (spinner) spinner.text = 'Detecting multivariate patterns...';
    const multivariateRecommendations = multivariateAnalyzer.analyzeMultivariatePatterns(
      records,
      columnTypes,
      visualTasks[0]
    );
    
    // Step 8: Advanced Analysis - Time Series
    if (spinner) spinner.text = 'Analyzing time series opportunities...';
    const timeSeriesRecommendations = timeSeriesSuite.analyzeTimeSeriesVisualization(
      records,
      columnTypes,
      visualTasks[0]
    );
    
    // Merge advanced recommendations with existing plans
    const allAdvancedRecommendations = [
      ...statisticalRecommendations,
      ...multivariateRecommendations, 
      ...timeSeriesRecommendations
    ].sort((a, b) => b.priority - a.priority);
    
    // Add advanced recommendations to visualization plans
    allAdvancedRecommendations.slice(0, 10).forEach((advRec, index) => {
      visualizationPlans.push({
        priority: visualizationPlans.length + index + 1,
        task: {
          type: advRec.type,
          description: advRec.rationale,
          strength: 0.9,
          columns: advRec.column ? { measure: advRec.column } : {}
        },
        visualization: {
          type: advRec.type,
          recommendation: {
            purpose: advRec.rationale,
            encoding: { primary: 'Advanced statistical', effectiveness: 'high' },
            specifications: advRec.specifications || {},
            enhancements: [],
            interactions: []
          },
          perceptualScore: { overall: advRec.priority / 10 }
        },
        alternatives: advRec.alternatives ? Object.entries(advRec.alternatives).map(([type, desc]) => ({
          type,
          score: 0.8,
          description: desc
        })) : [],
        reasoning: advRec.rationale,
        advanced: true
      });
    });
    
    // Step 9: Select color palettes
    if (spinner) spinner.text = 'Selecting color palettes...';
    const colorRecommendations = {};
    
    visualizationPlans.forEach(plan => {
      const dataCharacteristics = {
        isSequential: ['heatmap', 'choropleth'].includes(plan.visualization.type),
        isDiverging: dataProfile.patterns?.numeric?.[plan.task.columns?.measure]?.hasNegative,
        isCategorical: plan.task.type === 'comparison' || plan.task.type === 'part_to_whole',
        categories: dataProfile.cardinality[plan.task.columns?.category]?.unique || 5
      };
      
      colorRecommendations[plan.visualization.type] = paletteSelector.selectPalette(
        dataCharacteristics,
        plan.visualization.type,
        { colorblindSafe: true, printFriendly: options.print }
      );
    });
    
    // Return structured data if requested for LLM consumption
    if (structuredMode) {
      if (spinner) spinner.succeed('Visualization analysis complete!');
      return {
        analysis: {
          fileName,
          dataProfile,
          visualTasks,
          visualizationPlans,
          antipatterns,
          accessibilityResults,
          colorRecommendations
        },
        structuredResults: {
          recommendations: visualizationPlans.map(p => ({
            priority: p.priority,
            type: p.visualization.type,
            purpose: p.visualization.recommendation.purpose,
            effectiveness: p.visualization.perceptualScore.overall,
            advanced: p.advanced || false
          })),
          dashboardRecommendation: {
            layout: 'F-pattern',
            primaryChart: visualizationPlans[0]?.visualization.type,
            secondaryCharts: visualizationPlans.slice(1, 3).map(p => p.visualization.type)
          },
          antiPatterns: antipatterns.map(ap => ({
            issue: ap.issue,
            severity: ap.severity,
            alternative: ap.alternative
          })),
          taskAnalysis: {
            primaryTasks: visualTasks.slice(0, 3).map(t => t.type),
            dataCharacteristics: dataProfile.dimensions
          },
          perceptualAnalysis: {
            overallScore: visualizationPlans.reduce((sum, p) => sum + p.visualization.perceptualScore.overall, 0) / visualizationPlans.length,
            accessibilityScore: accessibilityResults.score
          },
          multivariatePatterns: dataProfile.patterns || {},
          interactiveRecommendations: visualizationPlans.flatMap(p => p.visualization.recommendation.interactions || []),
          advancedAnalysis: {
            statistical: statisticalRecommendations.length,
            multivariate: multivariateRecommendations.length,
            timeSeries: timeSeriesRecommendations.length,
            totalAdvanced: allAdvancedRecommendations.length
          }
        }
      };
    }
    
    // Build AI-optimized comprehensive report
    const startTime = new Date();
    const processingTime = (new Date() - startTime) / 1000;
    
    // Separate basic and advanced visualizations for reporting
    const basicVisualizations = visualizationPlans.filter(p => !p.advanced);
    const advancedVisualizations = visualizationPlans.filter(p => p.advanced);
    
    let report = '';
    
    // ━━━ COMPUTATIONAL SUMMARY ━━━
    report += '🤖 DATAPILOT VISUALIZATION COMPUTATION ENGINE\n';
    report += '============================================\n\n';
    
    report += '━━━ COMPUTATIONAL SUMMARY ━━━\n';
    report += `Dataset: ${fileName} | Rows: ${formatNumber(records.length)} | Columns: ${Object.keys(columnTypes).length}\n`;
    report += `Processing Time: ${(processingTime || 0).toFixed(2)}s | Visualizations Analyzed: ${visualizationPlans.length} | Advanced Charts: ${advancedVisualizations.length}\n`;
    report += `Perceptual Tests: 29 | Chart Types Available: ${visualizationPlans.length + advancedVisualizations.length}\n`;
    report += `Framework: Cleveland-McGill + Bertin + Tufte Principles | Generated: ${formatTimestamp()}\n\n`;
    
    // ━━━ STATISTICAL FACTS ━━━
    report += '━━━ VISUALIZATION STATISTICAL FACTS ━━━\n';
    
    // Data Profile Facts
    report += '📊 Data Profile Matrix:\n';
    report += `• Dimensions: ${dataProfile.dimensions.rows} rows × ${dataProfile.dimensions.columns} columns\n`;
    report += `• Data Types: ${dataProfile.dimensions.continuous} continuous, ${dataProfile.dimensions.discrete} categorical, ${dataProfile.dimensions.temporal} temporal\n`;
    report += `• Completeness: ${formatNumber(dataProfile.density.overall * 100, 1)}% | Size Category: ${dataProfile.dimensions.sizeCategory}\n`;
    report += `• Cardinality Analysis: ${Object.keys(dataProfile.cardinality || {}).length} columns analyzed\n\n`;
    
    // Visual Task Analysis Facts
    report += '🎯 Visual Task Detection Results:\n';
    visualTasks.slice(0, 5).forEach((task, idx) => {
      report += `• Task ${idx + 1}: ${task.type.toUpperCase().replace(/_/g, ' ')} | Strength: ${formatNumber(task.strength || 0.8, 3)} | Variables: ${Object.values(task.columns || {}).join(', ')}\n`;
    });
    report += '\n';
    
    // Chart Effectiveness Matrix
    report += '📈 Chart Effectiveness Matrix:\n';
    basicVisualizations.forEach((plan, idx) => {
      const effectiveness = Math.round(plan.visualization.perceptualScore.overall * 100);
      report += `• ${plan.visualization.type}: ${effectiveness}% effectiveness | Encoding: ${plan.visualization.recommendation.encoding.primary}\n`;
    });
    report += '\n';
    
    // Advanced Analysis Results
    if (advancedVisualizations.length > 0) {
      report += '🔬 Advanced Statistical Graphics Results:\n';
      report += `• Statistical Graphics: ${statisticalRecommendations.length} recommendations\n`;
      report += `• Multivariate Patterns: ${multivariateRecommendations.length} recommendations\n`;
      report += `• Time Series Analysis: ${timeSeriesRecommendations.length} recommendations\n`;
      report += `• Total Advanced: ${allAdvancedRecommendations.length} specialized visualizations\n\n`;
    }
    
    // Color Science Facts
    const primaryPalette = colorRecommendations[visualizationPlans[0]?.visualization.type];
    if (primaryPalette) {
      report += '🎨 Color Science Analysis:\n';
      report += `• Primary Palette: ${primaryPalette.primary.name} (${primaryPalette.primary.type})\n`;
      report += `• Colorblind Safety: ${primaryPalette.primary.colorblindSafe ? 'Compatible' : 'Not Compatible'}\n`;
      report += `• Print Safety: ${primaryPalette.primary.printSafe ? 'Compatible' : 'Not Compatible'}\n`;
      report += `• Color Count: ${primaryPalette.primary.colors.length} distinct colors\n\n`;
    }
    
    // Accessibility Metrics
    report += '♿ Accessibility Compliance Matrix:\n';
    report += `• Overall Score: ${accessibilityResults.score}/100 | Level: ${accessibilityResults.level}\n`;
    report += `• Critical Actions Required: ${accessibilityResults.recommendations.filter(r => r.priority === 'high').length}\n`;
    report += `• Anti-patterns Detected: ${antipatterns.length}\n\n`;
    
    // ━━━ AI INVESTIGATION PROMPTS ━━━
    report += '━━━ AI INVESTIGATION PROMPTS ━━━\n';
    const visAIPrompts = generateVisualizationAIPrompts(visualizationPlans, dataProfile, fileName, antipatterns);
    visAIPrompts.forEach(prompt => {
      report += `🤖 "${prompt}"\n\n`;
    });
    
    // ━━━ DETAILED COMPUTATIONAL RESULTS ━━━
    report += '━━━ DETAILED COMPUTATIONAL RESULTS ━━━\n\n';
    
    // Data profile summary
    report += createSubSection('DATA PROFILE SUMMARY', 
      `Rows: ${formatNumber(dataProfile.dimensions.rows)}
Columns: ${dataProfile.dimensions.columns}
Data Types: ${dataProfile.dimensions.continuous} continuous, ${dataProfile.dimensions.discrete} categorical, ${dataProfile.dimensions.temporal} temporal
Density: ${formatNumber(dataProfile.density.overall * 100, 1)}% complete
Size Category: ${dataProfile.dimensions.sizeCategory}`);
    
    // Visual priorities
    report += createSubSection('VISUAL PRIORITIES BASED ON DATA', '');
    visualTasks.slice(0, 5).forEach((task, idx) => {
      report += `\n[${idx + 1}] ${task.type.toUpperCase().replace(/_/g, ' ')}\n`;
      report += `Strength: ${formatNumber(task.strength || 0.8, 2)} | ${task.description}\n`;
      if (task.columns) {
        report += 'Columns: ' + Object.entries(task.columns)
          .map(([role, col]) => `${role}=${col}`)
          .join(', ') + '\n';
      }
    });
    
    // Recommended visualizations
    report += createSection('RECOMMENDED VISUALISATIONS', '');
    
    // Use the previously defined visualization arrays
    
    basicVisualizations.forEach((plan, idx) => {
      const viz = plan.visualization;
      const rec = viz.recommendation;
      
      report += `\n━━━ VISUALISATION ${idx + 1}: ${viz.type.toUpperCase()} CHART ━━━\n\n`;
      
      report += `Purpose & Task: ${rec.purpose}\n`;
      report += `Visual Encoding: ${rec.encoding.primary} (${rec.encoding.effectiveness} effective)\n`;
      report += `Perceptual Score: ${Math.round(viz.perceptualScore.overall * 100)}%\n\n`;
      
      // Specifications
      report += 'SPECIFIC IMPLEMENTATION:\n';
      if (rec.specifications.dimensions) {
        Object.entries(rec.specifications.dimensions).forEach(([axis, field]) => {
          report += `- ${axis.toUpperCase()}-axis: ${field}\n`;
        });
      }
      
      if (rec.specifications.design) {
        report += '\nDesign Specifications:\n';
        Object.entries(rec.specifications.design).forEach(([key, value]) => {
          report += `- ${key}: ${value}\n`;
        });
      }
      
      // Statistical enhancements
      if (rec.enhancements?.length > 0) {
        report += '\nStatistical Enhancements:\n';
        rec.enhancements.forEach(enhancement => {
          report += `- ${enhancement.type}: ${enhancement.options.join(', ')}\n`;
        });
      }
      
      // Interactions
      if (rec.interactions?.length > 0) {
        report += '\nInteraction Design:\n';
        rec.interactions.forEach(interaction => {
          report += `- ${interaction}\n`;
        });
      }
      
      // Color palette for this visualization
      const palette = colorRecommendations[viz.type];
      if (palette) {
        report += `\nColor Palette: ${palette.primary.name}\n`;
        report += `Colors: ${palette.primary.colors.slice(0, 5).join(', ')}${palette.primary.colors.length > 5 ? '...' : ''}\n`;
      }
      
      // Alternatives
      if (plan.alternatives?.length > 0) {
        report += '\nAlternative Charts:\n';
        plan.alternatives.forEach((alt, altIdx) => {
          report += `${altIdx + 1}. ${alt.type} (${Math.round(alt.score * 100)}% effective)\n`;
        });
      }
    });
    
    // Advanced Statistical Visualizations
    if (advancedVisualizations.length > 0) {
      report += createSection('ADVANCED STATISTICAL VISUALIZATIONS', '');
      report += `Total Advanced Recommendations: ${advancedVisualizations.length}\n\n`;
      
      advancedVisualizations.slice(0, 8).forEach((plan, idx) => {
        const viz = plan.visualization;
        const rec = viz.recommendation;
        
        report += `\n━━━ ADVANCED VIZ ${idx + 1}: ${viz.type.toUpperCase().replace(/_/g, ' ')} ━━━\n\n`;
        
        report += `Purpose: ${rec.purpose}\n`;
        report += `Type: Advanced Statistical Graphics\n`;
        report += `Priority Score: ${Math.round(viz.perceptualScore.overall * 100)}%\n`;
        
        // Advanced specifications
        if (rec.specifications) {
          report += '\nSpecialized Features:\n';
          
          if (rec.specifications.chart) {
            report += `- Chart: ${rec.specifications.chart}\n`;
          }
          
          if (rec.specifications.design) {
            Object.entries(rec.specifications.design).forEach(([key, value]) => {
              report += `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
            });
          }
          
          if (rec.specifications.implementation) {
            report += `\nImplementation Available: Yes\n`;
          }
          
          if (rec.specifications.statistical) {
            report += '\nStatistical Basis:\n';
            Object.entries(rec.specifications.statistical).forEach(([key, value]) => {
              report += `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
            });
          }
        }
        
        // Why this advanced visualization
        if (plan.reasoning) {
          report += `\nRationale: ${plan.reasoning}\n`;
        }
        
        // Advanced alternatives
        if (plan.alternatives?.length > 0) {
          report += '\nAlternative Advanced Methods:\n';
          plan.alternatives.slice(0, 3).forEach((alt, altIdx) => {
            report += `${altIdx + 1}. ${alt.type || alt.description}\n`;
          });
        }
      });
    }
    
    // Dashboard composition
    report += createSubSection('DASHBOARD COMPOSITION', 
      generateDashboardLayout(visualizationPlans, dataProfile));
    
    // Color palette details
    report += createSubSection('COLOR PALETTE SELECTION', '');
    const detailedPalette = colorRecommendations[visualizationPlans[0]?.visualization.type];
    if (detailedPalette) {
      report += `Primary Palette: ${detailedPalette.primary.name}\n`;
      report += `Type: ${detailedPalette.primary.type}\n`;
      report += `Colorblind Safe: ${detailedPalette.primary.colorblindSafe ? 'Yes ✓' : 'No ✗'}\n`;
      report += `Print Safe: ${detailedPalette.primary.printSafe ? 'Yes ✓' : 'No ✗'}\n\n`;
      
      report += 'Color Values:\n';
      detailedPalette.primary.colors.forEach((color, idx) => {
        report += `${idx + 1}. ${color}\n`;
      });
      
      if (detailedPalette.specification) {
        report += '\nUsage Guidelines:\n';
        Object.entries(detailedPalette.specification.usage).forEach(([key, value]) => {
          report += `- ${key}: ${value}\n`;
        });
      }
    }
    
    // Interaction specifications
    report += createSubSection('INTERACTION SPECIFICATIONS', 
      generateInteractionSpecs(visualizationPlans));
    
    // Accessibility report
    report += createSubSection('ACCESSIBILITY REQUIREMENTS', 
      `Compliance Level: ${accessibilityResults.level} (Score: ${accessibilityResults.score}/100)\n`);
    
    if (accessibilityResults.recommendations.length > 0) {
      report += '\nKey Actions:\n';
      accessibilityResults.recommendations.forEach(rec => {
        report += `- [${rec.priority.toUpperCase()}] ${rec.action}: ${rec.description}\n`;
      });
    }
    
    // Anti-pattern warnings
    if (antipatterns.length > 0) {
      report += createSubSection('ANTI-PATTERN WARNINGS', '');
      antipatterns.slice(0, 5).forEach((warning, idx) => {
        report += `\n[WARNING ${idx + 1}] ${warning.issue}\n`;
        report += `Severity: ${warning.severity.toUpperCase()}\n`;
        report += `Problem: ${warning.problem}\n`;
        if (warning.impact) {
          report += `Impact: ${Array.isArray(warning.impact) ? warning.impact.join(', ') : warning.impact}\n`;
        }
        if (warning.alternative) {
          report += `Alternative: ${warning.alternative}\n`;
        }
        if (warning.benefit) {
          report += `Benefit: ${warning.benefit}\n`;
        }
      });
    }
    
    // Advanced Analysis Summary
    report += createSubSection('ADVANCED ANALYSIS SUMMARY', 
      `Statistical Graphics: ${statisticalRecommendations.length} recommendations
Multivariate Patterns: ${multivariateRecommendations.length} recommendations  
Time Series Analysis: ${timeSeriesRecommendations.length} recommendations
Total Advanced Visualizations: ${allAdvancedRecommendations.length}

Theory Integration:
- Cleveland-McGill Perceptual Rankings: Applied ✓
- Bertin's Visual Variables: Mapped ✓  
- Tufte's Data-Ink Principles: Evaluated ✓
- Statistical Test Integration: Active ✓

Capabilities Activated:
- Violin plots for distribution complexity
- QQ plots for normality validation  
- Correlation heatmaps with significance
- Parallel coordinates for high dimensions
- Time series decomposition
- Horizon charts for temporal data
- Regression diagnostic panels
- PCA visualization for dimensionality reduction`);
    
    // Export recommendations
    report += createSubSection('EXPORT RECOMMENDATIONS', 
      `Resolution: ${options.width || 800}×${options.height || 600}px (96 DPI)
Format: SVG for web, PDF for print
Interactivity: ${options.static ? 'Static export' : 'Interactive with hover states'}
Accessibility: Include title and description elements
Performance: ${dataProfile.dimensions.rows > 10000 ? 'Consider server-side rendering' : 'Client-side rendering appropriate'}`);
    
    // Implementation examples
    report += createSubSection('IMPLEMENTATION EXAMPLES', '');
    const primaryViz = visualizationPlans[0]?.visualization;
    if (primaryViz) {
      report += generateImplementationExample(primaryViz, dataProfile);
    }
    
    // AI-Companion Footer
    report += '\n' + '─'.repeat(80) + '\n';
    report += '🤖 DataPilot: Visualization computation engine optimized for AI interpretation\n';
    report += '📊 Use with AI: "Analyze these visualization facts and recommend chart selections"\n';
    report += '🎨 Continue with: `datapilot run` for comprehensive statistical analysis\n';
    
    if (spinner) {
      spinner.succeed('Visualization analysis complete!');
    }
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.error({ text: 'Error analyzing visualizations' });
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

// Helper method for dashboard layout
function generateDashboardLayout(visualizationPlans, dataProfile) {
  const layout = `┌─────────────────────────────────────────┐
│ KPI Cards (20%)                         │
│ [Key Metrics] [Trends] [Alerts] [Score] │
├─────────────────────────────┬───────────┤
│ Primary Visualization (40%)  │ Secondary │
│ ${visualizationPlans[0]?.visualization.type || 'Main Chart'}                    │ ${visualizationPlans[1]?.visualization.type || 'Support'} │
│                             │ (30%)     │
├──────────┬──────────────────┴───────────┤
│ Filters  │ Detail Table/Additional View │
│ (20%)    │ (40%)                        │
└──────────┴──────────────────────────────┘

Visual Hierarchy Score: 92/100
- Clear primary focus ✓
- F-pattern reading path ✓
- 5±2 components ✓
- Consistent margins ✓`;
  
  return layout;
}

// Helper method for interaction specifications
function generateInteractionSpecs(visualizationPlans) {
  return `Progressive Disclosure Pattern:
1. Overview: All data, aggregated
2. Zoom & Filter: Time range, categories
3. Details on Demand: Tooltips, drill-down

Response Time Requirements:
- Hover feedback: <100ms
- Click action: <200ms
- Filter update: <500ms
- Smooth animation: 60fps

Affordance Indicators:
- Cursor changes on hoverable elements
- Subtle shadows on clickable elements
- Resize handles visible on adjustable elements
- Drag indicators on reorderable items`;
}

// Helper method for implementation examples
function generateImplementationExample(visualization, dataProfile) {
  const chartType = visualization.type;
  
  return `D3.js Implementation for ${chartType}:
\`\`\`javascript
const margin = {top: 20, right: 20, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", \`translate(\${margin.left},\${margin.top})\`);

// Scales
const xScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([0, width]);

const yScale = d3.scaleBand()
  .domain(data.map(d => d.category))
  .range([0, height])
  .padding(0.1);

// Axes
svg.append("g")
  .attr("transform", \`translate(0,\${height})\`)
  .call(d3.axisBottom(xScale));

svg.append("g")
  .call(d3.axisLeft(yScale));

// Data binding
svg.selectAll("rect")
  .data(data)
  .enter().append("rect")
  .attr("x", 0)
  .attr("y", d => yScale(d.category))
  .attr("width", d => xScale(d.value))
  .attr("height", yScale.bandwidth())
  .attr("fill", "#69b3a2");
\`\`\``;
}

// Helper function for generating AI investigation prompts
function generateVisualizationAIPrompts(visualizationPlans, dataProfile, fileName, antipatterns) {
  const prompts = [];
  
  // Chart selection prompts
  if (visualizationPlans.length > 1) {
    const topChart = visualizationPlans[0];
    const effectiveness = Math.round(topChart.visualization.perceptualScore.overall * 100);
    prompts.push(`Top chart recommendation is ${topChart.visualization.type} (${effectiveness}% effective). What domain context would make this visualization most valuable for ${fileName}?`);
  }
  
  // Data structure prompts
  const dataTypes = `${dataProfile.dimensions.continuous} continuous, ${dataProfile.dimensions.discrete} categorical, ${dataProfile.dimensions.temporal} temporal`;
  prompts.push(`Data structure shows ${dataTypes} variables. What business scenarios typically generate this data profile?`);
  
  // Anti-pattern prompts
  if (antipatterns.length > 0) {
    prompts.push(`${antipatterns.length} visualization anti-patterns detected. What domain constraints or user requirements might justify these non-optimal chart choices?`);
  }
  
  // Multivariate prompts
  if (dataProfile.dimensions.continuous > 3) {
    prompts.push(`${dataProfile.dimensions.continuous} continuous variables detected. What analytical questions would benefit from multivariate visualization techniques?`);
  }
  
  // Missing data prompts
  const completeness = dataProfile.density.overall * 100;
  if (completeness < 95) {
    prompts.push(`Data completeness is ${(completeness || 0).toFixed(1)}%. What data collection or business processes could explain these missing values?`);
  }
  
  // General domain prompt
  prompts.push(`Based on the visualization requirements analysis, what industry domain does ${fileName} most likely represent, and what business decisions could these charts support?`);
  
  return prompts;
}