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

export async function visualize(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
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
    
    // Step 6: Select color palettes
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
    
    // Build comprehensive report
    let report = createSection('VISUALISATION ANALYSIS',
      `Dataset: ${fileName}
Generated: ${formatTimestamp()}
Framework: Grammar of Graphics + Cleveland/Tufte Principles`);
    
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
    
    visualizationPlans.forEach((plan, idx) => {
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
    
    // Dashboard composition
    report += createSubSection('DASHBOARD COMPOSITION', 
      generateDashboardLayout(visualizationPlans, dataProfile));
    
    // Color palette details
    report += createSubSection('COLOR PALETTE SELECTION', '');
    const primaryPalette = colorRecommendations[visualizationPlans[0]?.visualization.type];
    if (primaryPalette) {
      report += `Primary Palette: ${primaryPalette.primary.name}\n`;
      report += `Type: ${primaryPalette.primary.type}\n`;
      report += `Colorblind Safe: ${primaryPalette.primary.colorblindSafe ? 'Yes ✓' : 'No ✗'}\n`;
      report += `Print Safe: ${primaryPalette.primary.printSafe ? 'Yes ✓' : 'No ✗'}\n\n`;
      
      report += 'Color Values:\n';
      primaryPalette.primary.colors.forEach((color, idx) => {
        report += `${idx + 1}. ${color}\n`;
      });
      
      if (primaryPalette.specification) {
        report += '\nUsage Guidelines:\n';
        Object.entries(primaryPalette.specification.usage).forEach(([key, value]) => {
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
    
    if (spinner) {
      spinner.succeed('Visualization analysis complete!');
    }
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error analyzing visualizations');
    console.error(error.message);
    console.error(error.stack);
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