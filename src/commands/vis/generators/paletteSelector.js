export class PaletteSelector {
  constructor() {
    // ColorBrewer palettes - scientifically designed for data visualization
    this.palettes = {
      sequential: {
        Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
        Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
        Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
        Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
        Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
        Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
        // Perceptually uniform
        Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
        Plasma: ['#0d0887', '#4b03a1', '#7d03a8', '#a82296', '#cb4679', '#e56b5d', '#f89441', '#fdc328', '#f0f921'],
        Inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
        Magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#fcfdbf']
      },
      diverging: {
        RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
        RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
        BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
        PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
        PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
        RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
        Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2']
      },
      qualitative: {
        Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
        Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
        Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
        Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'],
        Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
        Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
        Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
        Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928']
      }
    };
    
    // Colorblind safe combinations
    this.colorblindSafePalettes = {
      protanopia: ['#0173B2', '#DE8F05', '#029E73', '#CC78BC', '#CA9161', '#FBAFE4'],
      deuteranopia: ['#0173B2', '#DE8F05', '#029E73', '#CC78BC', '#CA9161', '#FBAFE4'],
      tritanopia: ['#E66100', '#5D3A9B', '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728']
    };
  }
  
  selectPalette(dataCharacteristics, visualizationType, constraints = {}) {
    const paletteType = this.determinePaletteType(dataCharacteristics, visualizationType);
    const numberOfColors = this.determineNumberOfColors(dataCharacteristics, visualizationType);
    
    const recommendation = {
      primary: this.selectPrimaryPalette(paletteType, numberOfColors, constraints),
      alternatives: this.selectAlternatives(paletteType, numberOfColors, constraints),
      specification: this.generateSpecification(paletteType, numberOfColors, dataCharacteristics),
      accessibility: this.generateAccessibilityNotes(constraints),
      implementation: this.generateImplementation(paletteType)
    };
    
    return recommendation;
  }
  
  determinePaletteType(dataCharacteristics, visualizationType) {
    // Sequential data (ordered, numeric progression)
    if (dataCharacteristics.isSequential || 
        ['heatmap', 'choropleth', 'density'].includes(visualizationType)) {
      return 'sequential';
    }
    
    // Diverging data (deviation from a center point)
    if (dataCharacteristics.isDiverging || 
        dataCharacteristics.hasNegativeValues ||
        visualizationType === 'diverging_bar') {
      return 'diverging';
    }
    
    // Categorical data (distinct categories)
    if (dataCharacteristics.isCategorical || 
        ['bar', 'pie', 'donut', 'scatter'].includes(visualizationType)) {
      return 'qualitative';
    }
    
    return 'qualitative'; // Default
  }
  
  determineNumberOfColors(dataCharacteristics, visualizationType) {
    if (visualizationType === 'heatmap' || visualizationType === 'choropleth') {
      return 9; // Standard for continuous scales
    }
    
    if (dataCharacteristics.categories) {
      return Math.min(dataCharacteristics.categories, 12); // Max 12 distinct colors
    }
    
    return 5; // Default
  }
  
  selectPrimaryPalette(paletteType, numberOfColors, constraints) {
    let selectedPalette;
    let colors;
    
    // Handle accessibility constraints
    if (constraints.colorblindSafe) {
      if (paletteType === 'qualitative') {
        selectedPalette = 'Colorblind Safe';
        colors = this.colorblindSafePalettes.deuteranopia.slice(0, numberOfColors);
      } else if (paletteType === 'sequential') {
        selectedPalette = 'Viridis';
        colors = this.interpolatePalette(this.palettes.sequential.Viridis, numberOfColors);
      } else {
        selectedPalette = 'RdBu';
        colors = this.interpolatePalette(this.palettes.diverging.RdBu, numberOfColors);
      }
    } else {
      // Standard selection based on type
      if (paletteType === 'sequential') {
        selectedPalette = constraints.printFriendly ? 'Greys' : 'Blues';
        colors = this.interpolatePalette(this.palettes.sequential[selectedPalette], numberOfColors);
      } else if (paletteType === 'diverging') {
        selectedPalette = 'RdBu';
        colors = this.interpolatePalette(this.palettes.diverging[selectedPalette], numberOfColors);
      } else {
        selectedPalette = numberOfColors <= 8 ? 'Set2' : 'Set3';
        colors = this.palettes.qualitative[selectedPalette].slice(0, numberOfColors);
      }
    }
    
    return {
      name: selectedPalette,
      colors: colors,
      type: paletteType,
      perceptuallyUniform: ['Viridis', 'Plasma', 'Inferno', 'Magma'].includes(selectedPalette),
      colorblindSafe: this.isColorblindSafe(colors),
      printSafe: this.isPrintSafe(colors),
      culturallyNeutral: this.isCulturallyNeutral(selectedPalette)
    };
  }
  
  selectAlternatives(paletteType, numberOfColors, constraints) {
    const alternatives = [];
    const palettesOfType = this.palettes[paletteType];
    
    Object.entries(palettesOfType).forEach(([name, palette]) => {
      const colors = paletteType === 'qualitative' 
        ? palette.slice(0, numberOfColors)
        : this.interpolatePalette(palette, numberOfColors);
      
      const meetsConstraints = this.checkConstraints(colors, constraints);
      
      if (meetsConstraints) {
        alternatives.push({
          name: name,
          colors: colors,
          characteristics: this.analyzePaletteCharacteristics(colors, name)
        });
      }
    });
    
    // Sort by suitability
    return alternatives
      .sort((a, b) => this.scorePalette(b, constraints) - this.scorePalette(a, constraints))
      .slice(0, 3);
  }
  
  interpolatePalette(palette, targetCount) {
    if (palette.length === targetCount) return palette;
    
    if (palette.length > targetCount) {
      // Sample evenly from the palette
      const step = (palette.length - 1) / (targetCount - 1);
      const colors = [];
      for (let i = 0; i < targetCount; i++) {
        colors.push(palette[Math.round(i * step)]);
      }
      return colors;
    }
    
    // If we need more colors than available, interpolate
    // This is simplified - in practice would use proper color interpolation
    return palette.slice(0, targetCount);
  }
  
  checkConstraints(colors, constraints) {
    if (constraints.colorblindSafe && !this.isColorblindSafe(colors)) {
      return false;
    }
    
    if (constraints.printFriendly && !this.isPrintSafe(colors)) {
      return false;
    }
    
    if (constraints.minContrast) {
      const meetsContrast = this.checkMinimumContrast(colors, constraints.minContrast);
      if (!meetsContrast) return false;
    }
    
    return true;
  }
  
  isColorblindSafe(colors) {
    // Simplified check - would use proper simulation in practice
    const problematicCombos = [
      ['#FF0000', '#00FF00'], // Red-Green
      ['#FF0000', '#00FF00'], // Red-Green variations
    ];
    
    // Check if colors are distinguishable under common colorblind conditions
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const distance = this.calculateColorDistance(colors[i], colors[j], 'deuteranopia');
        if (distance < 50) return false;
      }
    }
    
    return true;
  }
  
  isPrintSafe(colors) {
    // Check if colors work in grayscale
    const grayscaleValues = colors.map(color => this.toGrayscale(color));
    
    // Ensure sufficient variation in grayscale
    for (let i = 0; i < grayscaleValues.length; i++) {
      for (let j = i + 1; j < grayscaleValues.length; j++) {
        if (Math.abs(grayscaleValues[i] - grayscaleValues[j]) < 30) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  isCulturallyNeutral(paletteName) {
    // Some palettes have cultural associations to avoid
    const culturallySensitive = {
      'RdBu': 'May imply good/bad in some contexts',
      'RdGn': 'Red=bad, Green=good association',
      'RdYlGn': 'Traffic light association'
    };
    
    return !culturallySensitive[paletteName];
  }
  
  calculateColorDistance(color1, color2, condition = 'normal') {
    // Simplified perceptual distance calculation
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (condition === 'deuteranopia') {
      // Simulate deuteranopia
      rgb1.r = 0.625 * rgb1.r + 0.375 * rgb1.g;
      rgb1.g = 0.7 * rgb1.g + 0.3 * rgb1.r;
      rgb2.r = 0.625 * rgb2.r + 0.375 * rgb2.g;
      rgb2.g = 0.7 * rgb2.g + 0.3 * rgb2.r;
    }
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }
  
  toGrayscale(color) {
    const rgb = this.hexToRgb(color);
    return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  checkMinimumContrast(colors, minContrast) {
    // Check all color pairs meet minimum contrast
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const contrast = this.calculateContrast(colors[i], colors[j]);
        if (contrast < minContrast) return false;
      }
    }
    return true;
  }
  
  calculateContrast(color1, color2) {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
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
  
  analyzePaletteCharacteristics(colors, name) {
    return {
      perceptualDistance: this.calculateAveragePerceptualDistance(colors),
      grayscaleVariation: this.calculateGrayscaleVariation(colors),
      warmthBias: this.calculateWarmthBias(colors),
      saturationLevel: this.calculateAverageSaturation(colors),
      contrastRange: this.calculateContrastRange(colors)
    };
  }
  
  calculateAveragePerceptualDistance(colors) {
    let totalDistance = 0;
    let pairs = 0;
    
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        totalDistance += this.calculateColorDistance(colors[i], colors[j]);
        pairs++;
      }
    }
    
    return pairs > 0 ? totalDistance / pairs : 0;
  }
  
  calculateGrayscaleVariation(colors) {
    const grayscaleValues = colors.map(color => this.toGrayscale(color));
    const min = Math.min(...grayscaleValues);
    const max = Math.max(...grayscaleValues);
    return max - min;
  }
  
  calculateWarmthBias(colors) {
    // Calculate average "warmth" of palette
    const warmth = colors.map(color => {
      const rgb = this.hexToRgb(color);
      return (rgb.r + rgb.g * 0.5) / (rgb.b + 1); // Simplified warmth calculation
    });
    
    return warmth.reduce((a, b) => a + b) / warmth.length;
  }
  
  calculateAverageSaturation(colors) {
    // Simplified saturation calculation
    const saturations = colors.map(color => {
      const rgb = this.hexToRgb(color);
      const max = Math.max(rgb.r, rgb.g, rgb.b);
      const min = Math.min(rgb.r, rgb.g, rgb.b);
      return max === 0 ? 0 : (max - min) / max;
    });
    
    return saturations.reduce((a, b) => a + b) / saturations.length;
  }
  
  calculateContrastRange(colors) {
    let minContrast = Infinity;
    let maxContrast = 0;
    
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const contrast = this.calculateContrast(colors[i], colors[j]);
        minContrast = Math.min(minContrast, contrast);
        maxContrast = Math.max(maxContrast, contrast);
      }
    }
    
    return { min: minContrast, max: maxContrast, range: maxContrast - minContrast };
  }
  
  scorePalette(palette, constraints) {
    let score = 0;
    
    // Base score on characteristics
    score += palette.characteristics.perceptualDistance / 100;
    score += palette.characteristics.grayscaleVariation / 255;
    score += Math.min(palette.characteristics.contrastRange.min / 3, 1);
    
    // Bonus for specific features
    if (constraints.colorblindSafe && this.isColorblindSafe(palette.colors)) {
      score += 2;
    }
    
    if (constraints.printFriendly && this.isPrintSafe(palette.colors)) {
      score += 1;
    }
    
    return score;
  }
  
  generateSpecification(paletteType, numberOfColors, dataCharacteristics) {
    const spec = {
      paletteType: paletteType,
      numberOfColors: numberOfColors,
      usage: {}
    };
    
    if (paletteType === 'sequential') {
      spec.usage = {
        minimum: 'Lightest color',
        maximum: 'Darkest color',
        direction: 'Low to high values',
        nullValue: '#f7f7f7 (light gray)',
        missingData: 'Hatched pattern or distinct gray'
      };
    } else if (paletteType === 'diverging') {
      spec.usage = {
        negative: 'Cool colors (blues)',
        positive: 'Warm colors (reds)',
        center: 'White or light gray',
        extremes: 'Darkest colors at both ends',
        nullValue: '#f7f7f7 (light gray)'
      };
    } else {
      spec.usage = {
        assignment: 'Assign colors by frequency (most common = first color)',
        ordering: 'No implied order between colors',
        emphasis: 'Use saturation/lightness for emphasis',
        grouping: 'Similar categories can use similar hues'
      };
    }
    
    return spec;
  }
  
  generateAccessibilityNotes(constraints) {
    const notes = {
      colorblindness: {
        prevalence: '8% of males, 0.5% of females',
        types: ['Protanopia (red-blind)', 'Deuteranopia (green-blind)', 'Tritanopia (blue-blind)'],
        testing: 'Use colorblind simulators to verify'
      },
      contrast: {
        wcagAA: '4.5:1 for normal text, 3:1 for large text',
        wcagAAA: '7:1 for normal text, 4.5:1 for large text',
        testing: 'Use contrast checking tools'
      },
      alternatives: {
        patterns: 'Add patterns for critical distinctions',
        labels: 'Direct labeling reduces reliance on legends',
        symbols: 'Vary point shapes in addition to colors'
      }
    };
    
    if (constraints.colorblindSafe) {
      notes.verification = 'This palette has been tested for common colorblind conditions';
    }
    
    return notes;
  }
  
  generateImplementation(paletteType) {
    const implementations = {
      css: this.generateCSSImplementation(paletteType),
      javascript: this.generateJSImplementation(paletteType),
      python: this.generatePythonImplementation(paletteType),
      r: this.generateRImplementation(paletteType)
    };
    
    return implementations;
  }
  
  generateCSSImplementation(paletteType) {
    return `/* CSS Custom Properties */
:root {
  --color-primary: var(--color-1);
  --color-secondary: var(--color-2);
  --color-tertiary: var(--color-3);
  /* Add more as needed */
}

/* Usage */
.chart-element {
  fill: var(--color-primary);
  stroke: var(--color-primary);
}`;
  }
  
  generateJSImplementation(paletteType) {
    return `// D3.js implementation
const colorScale = d3.${paletteType === 'sequential' ? 'scaleSequential' : 
                        paletteType === 'diverging' ? 'scaleDiverging' : 
                        'scaleOrdinal'}()
  .domain(${paletteType === 'qualitative' ? 'categories' : '[minValue, maxValue]'})
  .range(paletteColors);

// Usage
selection.style('fill', d => colorScale(d.value));`;
  }
  
  generatePythonImplementation(paletteType) {
    return `# Matplotlib implementation
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

# Create colormap
cmap = mcolors.ListedColormap(palette_colors)

# Usage in plot
plt.scatter(x, y, c=values, cmap=cmap)
plt.colorbar()`;
  }
  
  generateRImplementation(paletteType) {
    return `# ggplot2 implementation
library(ggplot2)

# Define palette
my_palette <- c(${paletteType === 'qualitative' ? 'palette_colors' : ''})

# Usage
ggplot(data, aes(x=x, y=y, ${paletteType === 'qualitative' ? 'fill=category' : 'fill=value'})) +
  geom_point() +
  ${paletteType === 'qualitative' ? 'scale_fill_manual(values=my_palette)' : 
    'scale_fill_gradient(low=palette[1], high=palette[length(palette)])'}`;
  }
}