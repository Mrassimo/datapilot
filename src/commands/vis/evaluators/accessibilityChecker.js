export class AccessibilityChecker {
  checkAccessibility(visualizationPlan) {
    const results = {
      score: 0,
      level: '',
      issues: [],
      recommendations: [],
      guidelines: []
    };
    
    // Check each visualization
    visualizationPlan.forEach(viz => {
      const colorIssues = this.checkColorAccessibility(viz);
      const contrastIssues = this.checkContrast(viz);
      const alternativeIssues = this.checkAlternatives(viz);
      const interactionIssues = this.checkInteractionAccessibility(viz);
      const cognitiveIssues = this.checkCognitiveAccessibility(viz);
      
      results.issues.push(...colorIssues, ...contrastIssues, 
                          ...alternativeIssues, ...interactionIssues, 
                          ...cognitiveIssues);
    });
    
    // Calculate overall score
    results.score = this.calculateAccessibilityScore(results.issues);
    results.level = this.determineComplianceLevel(results.score);
    
    // Generate recommendations
    results.recommendations = this.generateRecommendations(results.issues);
    results.guidelines = this.getRelevantGuidelines(visualizationPlan);
    
    return results;
  }
  
  checkColorAccessibility(viz) {
    const issues = [];
    
    // Check if color is sole encoding
    if (viz.encoding === 'color' && !viz.secondaryEncoding) {
      issues.push({
        type: 'color_only_encoding',
        severity: 'critical',
        wcag: '1.4.1',
        chart: viz.type,
        issue: 'Color used as only method of conveying information',
        impact: 'Information inaccessible to colorblind users (8% of males, 0.5% of females)',
        solutions: [
          'Add patterns or textures to colored areas',
          'Use direct labeling on chart elements',
          'Provide shape or position as secondary encoding',
          'Include data table alternative'
        ]
      });
    }
    
    // Check colorblind safety
    if (viz.colors && !this.isColorblindSafe(viz.colors)) {
      issues.push({
        type: 'colorblind_unsafe',
        severity: 'high',
        wcag: '1.4.1',
        chart: viz.type,
        issue: 'Color palette not colorblind safe',
        affectedTypes: this.getAffectedColorblindTypes(viz.colors),
        solutions: [
          'Use colorblind-safe palettes (e.g., Viridis, Cividis)',
          'Test with colorblind simulators',
          'Avoid problematic combinations (red/green, blue/purple)',
          'Use ColorBrewer "colorblind safe" palettes'
        ]
      });
    }
    
    // Check for too many colors
    if (viz.colors && viz.colors.length > 8) {
      issues.push({
        type: 'too_many_colors',
        severity: 'medium',
        wcag: '1.4.1',
        issue: `${viz.colors.length} distinct colors used`,
        impact: 'Difficult to distinguish between similar colors',
        solutions: [
          'Limit to 5-7 distinct colors maximum',
          'Group less important categories as "Other"',
          'Use interactive filtering instead',
          'Consider different chart type'
        ]
      });
    }
    
    return issues;
  }
  
  checkContrast(viz) {
    const issues = [];
    
    // Text contrast
    if (viz.textElements) {
      viz.textElements.forEach(element => {
        const ratio = this.calculateContrastRatio(
          element.color || '#000000',
          element.background || '#FFFFFF'
        );
        
        if (element.size >= 14 && ratio < 4.5) {
          issues.push({
            type: 'insufficient_text_contrast',
            severity: 'high',
            wcag: '1.4.3',
            element: element.type,
            contrastRatio: ratio.toFixed(2),
            required: '4.5:1',
            impact: 'Text difficult to read for low vision users',
            solution: `Darken text to ${this.suggestColor(element.background, 4.5)}`
          });
        } else if (element.size >= 18 && ratio < 3) {
          issues.push({
            type: 'insufficient_large_text_contrast',
            severity: 'medium',
            wcag: '1.4.3',
            element: element.type,
            contrastRatio: ratio.toFixed(2),
            required: '3:1',
            impact: 'Large text difficult to read'
          });
        }
      });
    }
    
    // Non-text contrast (WCAG 2.1)
    if (viz.graphicalElements) {
      viz.graphicalElements.forEach(element => {
        const ratio = this.calculateContrastRatio(
          element.color || '#000000',
          element.background || '#FFFFFF'
        );
        
        if (ratio < 3) {
          issues.push({
            type: 'insufficient_graphic_contrast',
            severity: 'medium',
            wcag: '1.4.11',
            element: element.type,
            contrastRatio: ratio.toFixed(2),
            required: '3:1',
            impact: 'Chart elements difficult to perceive',
            examples: ['Grid lines too faint', 'Data points blend with background']
          });
        }
      });
    }
    
    return issues;
  }
  
  checkAlternatives(viz) {
    const issues = [];
    
    // Check for text alternatives
    if (!viz.altText && !viz.dataTableAlternative) {
      issues.push({
        type: 'missing_text_alternative',
        severity: 'critical',
        wcag: '1.1.1',
        chart: viz.type,
        issue: 'No text alternative provided',
        impact: 'Chart completely inaccessible to screen reader users',
        solutions: [
          'Provide comprehensive alt text describing the data and trends',
          'Include accessible data table alternative',
          'Use ARIA labels and descriptions',
          'Implement sonification for data trends'
        ]
      });
    }
    
    // Check alt text quality
    if (viz.altText && viz.altText.length < 50) {
      issues.push({
        type: 'insufficient_alt_text',
        severity: 'medium',
        wcag: '1.1.1',
        currentLength: viz.altText.length,
        issue: 'Alt text too brief',
        guidelines: [
          'Describe the chart type and purpose',
          'Summarize key data points and trends',
          'Include relevant statistics',
          'Mention any notable patterns or outliers'
        ]
      });
    }
    
    // Complex visualizations need detailed alternatives
    if (['parallel', 'sankey', 'chord', 'network'].includes(viz.type)) {
      issues.push({
        type: 'complex_viz_needs_alternative',
        severity: 'high',
        wcag: '1.1.1',
        chart: viz.type,
        issue: 'Complex visualization requires detailed alternative',
        solutions: [
          'Provide structured data table',
          'Create text summary of relationships',
          'Offer simplified view option',
          'Include guided tour or explanation'
        ]
      });
    }
    
    return issues;
  }
  
  checkInteractionAccessibility(viz) {
    const issues = [];
    
    // Keyboard accessibility
    if (viz.interactive && !viz.keyboardSupport) {
      issues.push({
        type: 'missing_keyboard_support',
        severity: 'critical',
        wcag: '2.1.1',
        issue: 'Interactive elements not keyboard accessible',
        impact: 'Users who cannot use mouse cannot access functionality',
        requirements: [
          'All interactive elements focusable',
          'Tab order logical',
          'Focus indicators visible',
          'Keyboard shortcuts documented'
        ]
      });
    }
    
    // Hover-only information
    if (viz.hoverOnly) {
      issues.push({
        type: 'hover_only_content',
        severity: 'high',
        wcag: '1.4.13',
        issue: 'Information only available on hover',
        impact: 'Touch and keyboard users cannot access',
        solutions: [
          'Provide click/tap alternative',
          'Show key information by default',
          'Use progressive disclosure',
          'Implement focus + Enter pattern'
        ]
      });
    }
    
    // Time limits
    if (viz.animation && !viz.animationControl) {
      issues.push({
        type: 'uncontrolled_animation',
        severity: 'medium',
        wcag: '2.2.2',
        issue: 'Animation without user control',
        impact: 'Distracting for users with attention disorders',
        requirements: [
          'Pause/play controls',
          'Option to disable animations',
          'Reduced motion media query support',
          'Static alternative available'
        ]
      });
    }
    
    return issues;
  }
  
  checkCognitiveAccessibility(viz) {
    const issues = [];
    
    // Complexity
    if (viz.dimensions > 3) {
      issues.push({
        type: 'high_cognitive_load',
        severity: 'medium',
        wcag: '3.1.5',
        dimensions: viz.dimensions,
        issue: 'High dimensional complexity',
        impact: 'Difficult for users with cognitive disabilities',
        solutions: [
          'Progressive disclosure of dimensions',
          'Start with 2D view, add dimensions gradually',
          'Provide guided exploration',
          'Include explanatory text'
        ]
      });
    }
    
    // Consistency
    if (viz.unconventionalDesign) {
      issues.push({
        type: 'unconventional_design',
        severity: 'low',
        wcag: '3.2.4',
        issue: 'Non-standard visualization design',
        impact: 'Learning curve for all users',
        solutions: [
          'Include legend and instructions',
          'Provide familiar alternative view',
          'Use progressive enhancement',
          'Add tutorial or walkthrough'
        ]
      });
    }
    
    // Instructions
    if (viz.complex && !viz.instructions) {
      issues.push({
        type: 'missing_instructions',
        severity: 'medium',
        wcag: '3.3.2',
        issue: 'Complex visualization without instructions',
        impact: 'Users may not understand how to use',
        requirements: [
          'Clear instructions near chart',
          'Example interpretations',
          'Interactive help system',
          'Video tutorial option'
        ]
      });
    }
    
    return issues;
  }
  
  isColorblindSafe(colors) {
    // Simulate common colorblind types
    const problematicPairs = [
      ['#FF0000', '#00FF00'], // Red-Green (Deuteranopia/Protanopia)
      ['#0000FF', '#FF00FF'], // Blue-Purple (Tritanopia)
      ['#FF7F00', '#FFFF00'], // Orange-Yellow
      ['#00FF00', '#FFFF00']  // Green-Yellow
    ];
    
    // Check if any colors are too similar under colorblind simulation
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (this.areColorsSimilarForColorblind(colors[i], colors[j])) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  areColorsSimilarForColorblind(color1, color2) {
    // Simplified check - in practice would use proper color vision simulation
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    // Simulate deuteranopia (most common)
    const sim1 = {
      r: 0.625 * rgb1.r + 0.375 * rgb1.g,
      g: 0.7 * rgb1.g + 0.3 * rgb1.r,
      b: rgb1.b
    };
    
    const sim2 = {
      r: 0.625 * rgb2.r + 0.375 * rgb2.g,
      g: 0.7 * rgb2.g + 0.3 * rgb2.r,
      b: rgb2.b
    };
    
    // Calculate perceptual difference
    const diff = Math.sqrt(
      Math.pow(sim1.r - sim2.r, 2) +
      Math.pow(sim1.g - sim2.g, 2) +
      Math.pow(sim1.b - sim2.b, 2)
    );
    
    return diff < 50; // Threshold for "too similar"
  }
  
  getAffectedColorblindTypes(colors) {
    const types = [];
    
    // Check which types would have issues
    if (colors.includes('#FF0000') && colors.includes('#00FF00')) {
      types.push('Protanopia (1% of males)', 'Deuteranopia (6% of males)');
    }
    
    if (colors.includes('#0000FF') && colors.includes('#FF00FF')) {
      types.push('Tritanopia (0.01% of population)');
    }
    
    return types.length > 0 ? types : ['General color discrimination'];
  }
  
  calculateContrastRatio(foreground, background) {
    const lum1 = this.getRelativeLuminance(foreground);
    const lum2 = this.getRelativeLuminance(background);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  getRelativeLuminance(color) {
    const rgb = this.hexToRgb(color);
    
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  suggestColor(background, targetRatio) {
    // Suggest a foreground color that meets contrast requirements
    const bgLum = this.getRelativeLuminance(background);
    const targetLum = targetRatio * (bgLum + 0.05) - 0.05;
    
    // Simple suggestion - in practice would calculate exact color
    return targetLum > bgLum ? '#000000' : '#FFFFFF';
  }
  
  calculateAccessibilityScore(issues) {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    return Math.max(0, score);
  }
  
  determineComplianceLevel(score) {
    if (score >= 95) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 70) return 'A';
    return 'Non-compliant';
  }
  
  generateRecommendations(issues) {
    const recommendations = [];
    const issueTypes = new Set(issues.map(i => i.type));
    
    // Prioritized recommendations based on issues found
    if (issueTypes.has('color_only_encoding')) {
      recommendations.push({
        priority: 'immediate',
        action: 'Add redundant encodings',
        description: 'Never rely on color alone. Add patterns, shapes, or labels.',
        effort: 'medium'
      });
    }
    
    if (issueTypes.has('missing_text_alternative')) {
      recommendations.push({
        priority: 'immediate',
        action: 'Provide text alternatives',
        description: 'Add comprehensive alt text and data tables for all charts.',
        effort: 'low'
      });
    }
    
    if (issueTypes.has('insufficient_text_contrast')) {
      recommendations.push({
        priority: 'high',
        action: 'Improve contrast ratios',
        description: 'Ensure all text meets WCAG contrast requirements.',
        effort: 'low'
      });
    }
    
    if (issueTypes.has('missing_keyboard_support')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement keyboard navigation',
        description: 'Make all interactive elements keyboard accessible.',
        effort: 'high'
      });
    }
    
    // General best practices
    recommendations.push({
      priority: 'ongoing',
      action: 'Test with assistive technologies',
      description: 'Regular testing with screen readers and keyboard navigation.',
      effort: 'medium'
    });
    
    return recommendations;
  }
  
  getRelevantGuidelines(visualizationPlan) {
    return [
      {
        principle: 'Perceivable',
        guidelines: [
          '1.1.1 - Provide text alternatives',
          '1.4.1 - Don\'t use color alone',
          '1.4.3 - Ensure sufficient contrast',
          '1.4.11 - Non-text contrast (WCAG 2.1)'
        ]
      },
      {
        principle: 'Operable',
        guidelines: [
          '2.1.1 - Keyboard accessible',
          '2.2.2 - Pause, stop, hide animations',
          '2.4.7 - Focus visible'
        ]
      },
      {
        principle: 'Understandable',
        guidelines: [
          '3.1.5 - Reading level',
          '3.2.4 - Consistent identification',
          '3.3.2 - Labels or instructions'
        ]
      },
      {
        principle: 'Robust',
        guidelines: [
          '4.1.2 - Name, role, value',
          '4.1.3 - Status messages (WCAG 2.1)'
        ]
      }
    ];
  }
}