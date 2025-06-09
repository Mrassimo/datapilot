"use strict";
/**
 * Advanced Chart Composition Engine
 *
 * Sophisticated engine for multi-dimensional data encoding and aesthetic optimization:
 * - Multi-dimensional visual encoding strategies
 * - Perceptual optimization based on human visual cognition
 * - Data-driven color theory and aesthetic decisions
 * - Advanced visual hierarchy and composition principles
 * - Cross-cultural and accessibility considerations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartComposer = void 0;
/**
 * Advanced Chart Composition Engine
 */
class ChartComposer {
    /**
     * Generate comprehensive composition profile for a visualization
     */
    static composeVisualization(chartType, dimensions, dataCharacteristics, contextualRequirements = {}) {
        const visualEncoding = this.optimizeMultiDimensionalEncoding(dimensions, chartType);
        const aestheticProfile = this.generateAestheticProfile(chartType, dataCharacteristics, contextualRequirements);
        const perceptualOptimization = this.optimizePerception(visualEncoding, aestheticProfile);
        const accessibilityCompliance = this.ensureAccessibility(visualEncoding, aestheticProfile);
        const culturalAdaptation = this.adaptForCulture(contextualRequirements.culture || 'en-US');
        const compositionPrinciples = this.applyCompositionPrinciples(chartType, visualEncoding);
        const qualityMetrics = this.assessVisualQuality(visualEncoding, aestheticProfile, perceptualOptimization, accessibilityCompliance);
        return {
            visualEncoding,
            aestheticProfile,
            perceptualOptimization,
            accessibilityCompliance,
            culturalAdaptation,
            compositionPrinciples,
            qualityMetrics,
        };
    }
    /**
     * Optimize multi-dimensional encoding for maximum effectiveness
     */
    static optimizeMultiDimensionalEncoding(dimensions, chartType) {
        // Rank channels by perceptual effectiveness (Cleveland & McGill hierarchy)
        const channelRanking = this.getChannelEffectivenessRanking();
        // Optimize channel assignment based on data importance and perceptual accuracy
        const optimizedDimensions = this.optimizeChannelAssignment(dimensions, channelRanking);
        // Calculate encoding efficiency and cognitive load
        const efficiency = this.calculateEncodingEfficiency(optimizedDimensions);
        const cognitiveLoad = this.calculateCognitiveLoad(optimizedDimensions, chartType);
        const informationDensity = this.calculateInformationDensity(optimizedDimensions);
        // Add redundant encodings for accessibility and emphasis
        const redundantEncodings = this.generateRedundantEncodings(optimizedDimensions);
        // Create visual hierarchy
        const hierarchicalStructure = this.createVisualHierarchy(optimizedDimensions, chartType);
        const primaryDimensions = optimizedDimensions.filter((d) => d.encodingStrength > 0.7);
        const secondaryDimensions = optimizedDimensions.filter((d) => d.encodingStrength <= 0.7);
        return {
            primaryDimensions,
            secondaryDimensions,
            encodingEfficiency: efficiency,
            cognitiveLoad,
            informationDensity,
            redundantEncodings,
            hierarchicalStructure,
        };
    }
    /**
     * Generate comprehensive aesthetic profile
     */
    static generateAestheticProfile(chartType, dataCharacteristics, contextualRequirements) {
        const colorHarmony = this.generateColorHarmony(dataCharacteristics, contextualRequirements);
        const typographySystem = this.designTypographySystem(chartType, contextualRequirements);
        const spatialRhythm = this.establishSpatialRhythm(chartType);
        const visualBalance = this.calculateVisualBalance(chartType);
        const proportionSystem = this.selectProportionSystem(chartType, contextualRequirements);
        const styleConsistency = this.ensureStyleConsistency(colorHarmony, typographySystem, spatialRhythm);
        return {
            colorHarmony,
            typographySystem,
            spatialRhythm,
            visualBalance,
            proportionSystem,
            styleConsistency,
        };
    }
    /**
     * Optimize for human visual perception
     */
    static optimizePerception(visualEncoding, aestheticProfile) {
        const gestaltPrinciples = this.applyGestaltPrinciples(visualEncoding);
        const cognitiveLoad = this.analyzeCognitiveLoad(visualEncoding, aestheticProfile);
        const attentionFlow = this.analyzeAttentionFlow(visualEncoding, aestheticProfile);
        const memorability = this.assessMemorability(visualEncoding, aestheticProfile);
        const usabilityMetrics = this.calculateUsabilityMetrics(visualEncoding, aestheticProfile);
        return {
            gestaltPrinciples,
            cognitiveLoad,
            attentionFlow,
            memorability,
            usabilityMetrics,
        };
    }
    // Helper methods for channel effectiveness ranking (Cleveland & McGill)
    static getChannelEffectivenessRanking() {
        const ranking = new Map();
        // Position channels (most effective)
        ranking.set('position_x', 1.0);
        ranking.set('position_y', 1.0);
        // Length/size channels
        ranking.set('size_length', 0.9);
        ranking.set('size_area', 0.8);
        // Angle and slope
        ranking.set('position_angle', 0.7);
        // Color channels
        ranking.set('color_lightness', 0.6);
        ranking.set('color_saturation', 0.5);
        ranking.set('color_hue', 0.4);
        // Other channels (least effective for quantitative data)
        ranking.set('shape', 0.3);
        ranking.set('texture', 0.2);
        ranking.set('motion', 0.1);
        return ranking;
    }
    static optimizeChannelAssignment(dimensions, channelRanking) {
        // Sort dimensions by importance/variance and assign most effective channels
        const sortedDimensions = [...dimensions].sort((a, b) => b.encodingStrength - a.encodingStrength);
        return sortedDimensions.map((dim, index) => {
            const effectiveness = channelRanking.get(dim.channel) || 0.1;
            return {
                ...dim,
                perceptualAccuracy: effectiveness,
                discriminability: this.calculateDiscriminability(dim, effectiveness),
                orderingPreservation: this.calculateOrderingPreservation(dim, effectiveness),
                optimization: this.optimizeChannel(dim, effectiveness),
            };
        });
    }
    static calculateEncodingEfficiency(dimensions) {
        const totalEncodingPower = dimensions.reduce((sum, dim) => sum + dim.encodingStrength, 0);
        const redundancy = this.calculateRedundancy(dimensions);
        return Math.max(0, Math.min(100, (totalEncodingPower / dimensions.length) * 100 * (1 - redundancy)));
    }
    static calculateCognitiveLoad(dimensions, chartType) {
        const baseLoad = dimensions.length * 10; // Each dimension adds cognitive load
        const interactionLoad = this.getInteractionComplexity(chartType) * 5;
        const perceptualLoad = dimensions.reduce((sum, dim) => sum + (1 - dim.perceptualAccuracy) * 10, 0);
        return Math.min(100, baseLoad + interactionLoad + perceptualLoad);
    }
    static calculateInformationDensity(dimensions) {
        const informationBits = dimensions.reduce((sum, dim) => {
            // Calculate information content based on data type and encoding effectiveness
            let bits = 1;
            if (dim.dataType === 'quantitative')
                bits = 8;
            else if (dim.dataType === 'ordinal')
                bits = 4;
            else if (dim.dataType === 'nominal')
                bits = 2;
            return sum + bits * dim.encodingStrength;
        }, 0);
        // Normalize to 0-100 scale
        return Math.min(100, informationBits * 5);
    }
    static generateColorHarmony(dataCharacteristics, contextualRequirements) {
        // Select base color based on context and data
        const baseColor = this.selectBaseColor(dataCharacteristics, contextualRequirements);
        // Generate harmonious color scheme
        const scheme = this.selectColorScheme(dataCharacteristics);
        const harmony = this.generateHarmoniousColors(baseColor, scheme.type);
        // Create comprehensive palette
        const palette = this.generateComprehensivePalette(harmony, dataCharacteristics);
        // Assess psychological impact
        const psychologicalImpact = this.assessPsychologicalImpact(harmony);
        // Create semantic mappings
        const semanticMapping = this.createSemanticColorMappings(dataCharacteristics);
        // Calculate harmony score
        const harmonyScore = this.calculateHarmonyScore(harmony, palette);
        return {
            scheme,
            palette,
            psychologicalImpact,
            semanticMapping,
            harmonyScore,
        };
    }
    // Placeholder implementations for complex methods
    static calculateDiscriminability(dim, effectiveness) {
        return effectiveness * 0.9; // Simplified calculation
    }
    static calculateOrderingPreservation(dim, effectiveness) {
        if (dim.dataType === 'quantitative' || dim.dataType === 'ordinal') {
            return effectiveness;
        }
        return 0.5; // Nominal data doesn't preserve ordering
    }
    static optimizeChannel(dim, effectiveness) {
        return {
            scalingFunction: dim.dataType === 'quantitative' ? 'linear' : 'ordinal',
            domainOptimization: {
                zeroBehavior: 'include',
                outlierHandling: 'clip',
                domainPadding: 0.1,
                symmetryPreservation: false,
            },
            rangeOptimization: {
                minValue: 0,
                maxValue: 100,
                resolution: 1,
                perceptualUniformity: true,
                physicalConstraints: [],
            },
            perceptualCorrection: {
                gammaCorrection: 2.2,
                luminanceAdjustment: 1.0,
                contrastEnhancement: 1.0,
                colorBlindnessCompensation: {
                    protanopia: 1.0,
                    deuteranopia: 1.0,
                    tritanopia: 1.0,
                    achromatopsia: 1.0,
                },
            },
        };
    }
    static calculateRedundancy(dimensions) {
        // Simplified redundancy calculation
        return Math.max(0, (dimensions.length - 3) * 0.1);
    }
    static getInteractionComplexity(chartType) {
        const complexityMap = {
            scatter_plot: 2,
            line_chart: 1,
            bar_chart: 1,
            heatmap: 3,
            parallel_coordinates: 4,
            sankey: 4,
        };
        return complexityMap[chartType] || 2;
    }
    // Additional placeholder implementations...
    static generateRedundantEncodings(dimensions) {
        const redundancies = [];
        // Add pattern redundancy for color-blind accessibility
        dimensions.forEach((dim) => {
            if (dim.channel === 'color_hue' || dim.channel === 'color_saturation') {
                redundancies.push({
                    primaryChannel: dim.channel,
                    redundantChannel: 'shape',
                    redundancyLevel: 85,
                    purpose: 'accessibility',
                    effectiveness: 90,
                });
                // Add texture redundancy for important categorical data
                if (dim.dataType === 'nominal' && dim.encodingStrength > 0.7) {
                    redundancies.push({
                        primaryChannel: dim.channel,
                        redundantChannel: 'texture',
                        redundancyLevel: 70,
                        purpose: 'emphasis',
                        effectiveness: 75,
                    });
                }
            }
            // Add size redundancy for important quantitative data
            if (dim.channel === 'position_y' &&
                dim.dataType === 'quantitative' &&
                dim.encodingStrength > 0.8) {
                redundancies.push({
                    primaryChannel: dim.channel,
                    redundantChannel: 'size_area',
                    redundancyLevel: 60,
                    purpose: 'emphasis',
                    effectiveness: 80,
                });
            }
        });
        return redundancies;
    }
    static createVisualHierarchy(dimensions, chartType) {
        // Sort dimensions by importance (encoding strength)
        const sortedDimensions = [...dimensions].sort((a, b) => b.encodingStrength - a.encodingStrength);
        // Create hierarchy levels based on encoding strength
        const levels = [
            {
                level: 1,
                elements: sortedDimensions.slice(0, 1).map((d) => d.dataField),
                visualWeight: 100,
                precedence: 1,
            },
            {
                level: 2,
                elements: sortedDimensions.slice(1, 3).map((d) => d.dataField),
                visualWeight: 75,
                precedence: 2,
            },
            {
                level: 3,
                elements: sortedDimensions.slice(3).map((d) => d.dataField),
                visualWeight: 50,
                precedence: 3,
            },
        ].filter((level) => level.elements.length > 0);
        // Create focus points for most important dimensions
        const focusPoints = sortedDimensions.slice(0, 2).map((dim, index) => ({
            element: dim.dataField,
            attentionWeight: 100 - index * 25,
            visualTechniques: index === 0
                ? ['primary_color', 'large_size', 'central_position']
                : ['secondary_color', 'moderate_size'],
            cognitiveReasoning: index === 0
                ? 'Primary data dimension requiring immediate attention'
                : 'Secondary dimension providing context',
        }));
        // Create visual flow based on chart type
        const visualFlow = this.generateVisualFlow(sortedDimensions, chartType);
        // Create attention guides
        const attentionGuides = [
            {
                technique: 'color_contrast',
                target: sortedDimensions[0]?.dataField || 'primary',
                effectiveness: 90,
                subtlety: 30,
            },
            {
                technique: 'size_progression',
                target: 'hierarchy',
                effectiveness: 85,
                subtlety: 60,
            },
        ];
        return {
            levels,
            focusPoints,
            visualFlow,
            attentionGuides,
        };
    }
    static selectBaseColor(dataCharacteristics, contextualRequirements) {
        // Analyze data sentiment and domain context
        const domain = contextualRequirements?.domain || 'general';
        const sentiment = this.analyzeDataSentiment(dataCharacteristics);
        const brandColors = contextualRequirements?.brandColors;
        // If brand colors are provided, use primary brand color
        if (brandColors && brandColors.length > 0) {
            return this.hexToHSL(brandColors[0]);
        }
        // Domain-specific color selection
        const domainColorMap = {
            education: { hue: 220, saturation: 65, lightness: 55 }, // Trustworthy blue
            healthcare: { hue: 160, saturation: 55, lightness: 50 }, // Calming green-blue
            finance: { hue: 200, saturation: 75, lightness: 45 }, // Professional blue
            marketing: { hue: 280, saturation: 70, lightness: 60 }, // Creative purple
            technology: { hue: 210, saturation: 80, lightness: 50 }, // Tech blue
            environment: { hue: 120, saturation: 60, lightness: 45 }, // Natural green
            social: { hue: 340, saturation: 65, lightness: 55 }, // Warm red-pink
            general: { hue: 220, saturation: 60, lightness: 50 }, // Neutral blue
        };
        const baseColor = domainColorMap[domain] || domainColorMap['general'];
        // Adjust based on data sentiment
        if (sentiment === 'positive') {
            baseColor.saturation = Math.min(90, baseColor.saturation + 15);
            baseColor.lightness = Math.min(70, baseColor.lightness + 10);
        }
        else if (sentiment === 'negative') {
            baseColor.saturation = Math.max(30, baseColor.saturation - 10);
            baseColor.lightness = Math.max(30, baseColor.lightness - 10);
        }
        // Adjust for data complexity
        const complexity = this.calculateDataComplexity(dataCharacteristics);
        if (complexity > 0.7) {
            // Use more muted colors for complex data to reduce cognitive load
            baseColor.saturation = Math.max(40, baseColor.saturation - 20);
        }
        return baseColor;
    }
    static selectColorScheme(dataCharacteristics) {
        return {
            type: 'analogous',
            baseColor: { hue: 220, saturation: 70, lightness: 50 },
            harmony: [],
            reasoning: 'Analogous scheme provides harmony while maintaining distinction',
        };
    }
    static generateHarmoniousColors(baseColor, schemeType) {
        // Implementation would generate colors based on color theory
        return [baseColor];
    }
    static generateComprehensivePalette(harmony, dataCharacteristics) {
        return {
            categorical: harmony,
            sequential: harmony,
            diverging: harmony,
            specialPurpose: new Map(),
            accessibilityScore: 85,
        };
    }
    static assessPsychologicalImpact(harmony) {
        return {
            emotion: 'professional',
            energy: 60,
            trust: 80,
            professionalism: 85,
            clarity: 90,
        };
    }
    static createSemanticColorMappings(dataCharacteristics) {
        const mappings = [];
        // Analyze data for semantic meaning
        const fields = dataCharacteristics.fields || [];
        fields.forEach((field) => {
            const fieldName = field.name?.toLowerCase() || '';
            const fieldType = field.type || 'unknown';
            // Performance/success indicators
            if (fieldName.includes('success') ||
                fieldName.includes('positive') ||
                fieldName.includes('good')) {
                mappings.push({
                    concept: 'success',
                    color: { hue: 120, saturation: 70, lightness: 50 }, // Green
                    culturalRelevance: 90,
                    universalRecognition: 95,
                });
            }
            // Warning/caution indicators
            if (fieldName.includes('warning') ||
                fieldName.includes('caution') ||
                fieldName.includes('moderate')) {
                mappings.push({
                    concept: 'warning',
                    color: { hue: 45, saturation: 85, lightness: 55 }, // Orange
                    culturalRelevance: 85,
                    universalRecognition: 90,
                });
            }
            // Error/danger indicators
            if (fieldName.includes('error') ||
                fieldName.includes('danger') ||
                fieldName.includes('bad') ||
                fieldName.includes('negative')) {
                mappings.push({
                    concept: 'danger',
                    color: { hue: 0, saturation: 75, lightness: 50 }, // Red
                    culturalRelevance: 85,
                    universalRecognition: 95,
                });
            }
            // Information/neutral indicators
            if (fieldName.includes('info') ||
                fieldName.includes('neutral') ||
                fieldName.includes('standard')) {
                mappings.push({
                    concept: 'information',
                    color: { hue: 210, saturation: 60, lightness: 55 }, // Blue
                    culturalRelevance: 90,
                    universalRecognition: 85,
                });
            }
            // Temporal mappings
            if (fieldType === 'temporal' || fieldName.includes('time') || fieldName.includes('date')) {
                mappings.push({
                    concept: 'temporal',
                    color: { hue: 260, saturation: 50, lightness: 60 }, // Purple
                    culturalRelevance: 70,
                    universalRecognition: 70,
                });
            }
            // Financial mappings
            if (fieldName.includes('profit') ||
                fieldName.includes('revenue') ||
                fieldName.includes('income')) {
                mappings.push({
                    concept: 'financial_positive',
                    color: { hue: 140, saturation: 65, lightness: 45 }, // Forest green
                    culturalRelevance: 80,
                    universalRecognition: 75,
                });
            }
            if (fieldName.includes('loss') ||
                fieldName.includes('cost') ||
                fieldName.includes('expense')) {
                mappings.push({
                    concept: 'financial_negative',
                    color: { hue: 15, saturation: 70, lightness: 45 }, // Red-orange
                    culturalRelevance: 80,
                    universalRecognition: 75,
                });
            }
        });
        // Add default semantic mappings if none found
        if (mappings.length === 0) {
            mappings.push({
                concept: 'primary',
                color: { hue: 220, saturation: 70, lightness: 50 },
                culturalRelevance: 90,
                universalRecognition: 85,
            }, {
                concept: 'secondary',
                color: { hue: 45, saturation: 60, lightness: 55 },
                culturalRelevance: 80,
                universalRecognition: 80,
            });
        }
        return mappings;
    }
    static calculateHarmonyScore(harmony, palette) {
        if (harmony.length === 0)
            return 0;
        let score = 0;
        let factors = 0;
        // Factor 1: Hue distribution (0-25 points)
        const hues = harmony.map((c) => c.hue);
        const hueSpread = this.calculateHueSpread(hues);
        const hueScore = Math.min(25, (hueSpread / 360) * 100);
        score += hueScore;
        factors++;
        // Factor 2: Saturation consistency (0-25 points)
        const saturations = harmony.map((c) => c.saturation);
        const saturationVariance = this.calculateVariance(saturations);
        const saturationScore = Math.max(0, 25 - saturationVariance / 100);
        score += saturationScore;
        factors++;
        // Factor 3: Lightness distribution (0-25 points)
        const lightnesses = harmony.map((c) => c.lightness);
        const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);
        const lightnessScore = Math.min(25, (lightnessRange / 80) * 25); // Good range is 0-80
        score += lightnessScore;
        factors++;
        // Factor 4: Color theory compliance (0-25 points)
        const theoryScore = this.evaluateColorTheoryCompliance(hues, palette.harmonyType);
        score += theoryScore;
        factors++;
        // Bonus factors
        // Accessibility bonus (0-10 points)
        const accessibilityBonus = this.calculateAccessibilityBonus(harmony);
        score += accessibilityBonus;
        // Cultural appropriateness bonus (0-5 points)
        const culturalBonus = this.calculateCulturalBonus(harmony);
        score += culturalBonus;
        // Normalize to 0-100 scale
        const baseScore = (score / factors) * (100 / 25);
        const bonusPoints = accessibilityBonus + culturalBonus;
        return Math.min(100, Math.max(0, baseScore + bonusPoints));
    }
    static designTypographySystem(chartType, contextualRequirements) {
        return {
            hierarchy: {
                levels: [],
                scaleRatio: 1.25,
                baselineGrid: 16,
                verticalRhythm: 1.5,
            },
            readability: {
                contrastRatio: 4.5,
                optimalReadingDistance: 60,
                cognitiveLoad: 20,
                scanability: 80,
            },
            personality: {
                formality: 70,
                friendliness: 60,
                authority: 75,
                creativity: 40,
            },
            technicalOptimization: {
                hinting: true,
                subpixelRendering: true,
                optimalSizes: [12, 14, 16, 18, 24],
                performanceImpact: 5,
            },
        };
    }
    static establishSpatialRhythm(chartType) {
        return {
            gridSystem: {
                type: 'modular',
                columns: 12,
                gutters: 16,
                margins: { top: 24, right: 24, bottom: 24, left: 24 },
                breakpoints: [],
            },
            spacingScale: {
                baseUnit: 8,
                scale: [4, 8, 16, 24, 32, 48, 64],
                semanticSpacing: new Map(),
                opticalAdjustments: [],
            },
            alignmentPrinciples: [],
            proximityRules: [],
        };
    }
    static calculateVisualBalance(chartType) {
        return {
            type: 'asymmetrical',
            weight: {
                distribution: [],
                center: { x: 0.5, y: 0.5 },
                moments: [],
            },
            tension: [],
            stability: 80,
        };
    }
    static selectProportionSystem(chartType, contextualRequirements) {
        return {
            system: 'golden_ratio',
            ratios: [1.618, 1.414, 1.333],
            applications: [],
            aestheticScore: 80,
        };
    }
    static ensureStyleConsistency(colorHarmony, typographySystem, spatialRhythm) {
        return {
            consistencyScore: 85,
            deviations: [],
            unifyingElements: ['color palette', 'typography scale', 'spacing system'],
            brandAlignment: 80,
        };
    }
    static applyGestaltPrinciples(visualEncoding) {
        const applications = [];
        // Proximity: Group related data elements
        if (visualEncoding.primaryDimensions.length > 1) {
            applications.push({
                principle: 'proximity',
                application: 'Group related data points using spatial proximity to show relationships',
                effectiveness: 85,
                cognitiveSupport: 'Reduces cognitive load by naturally grouping related information',
            });
        }
        // Similarity: Use consistent visual properties for similar data
        const categoricalDimensions = visualEncoding.primaryDimensions.filter((d) => d.dataType === 'nominal');
        if (categoricalDimensions.length > 0) {
            applications.push({
                principle: 'similarity',
                application: 'Use consistent colors, shapes, or patterns for data elements in the same category',
                effectiveness: 90,
                cognitiveSupport: 'Enables rapid categorization and pattern recognition',
            });
        }
        // Closure: Complete implied shapes and patterns
        applications.push({
            principle: 'closure',
            application: 'Use implied connections and boundaries to group data without explicit lines',
            effectiveness: 75,
            cognitiveSupport: 'Reduces visual clutter while maintaining data relationships',
        });
        // Continuity: Create visual flow through data
        const temporalDimensions = visualEncoding.primaryDimensions.filter((d) => d.dataType === 'temporal');
        if (temporalDimensions.length > 0) {
            applications.push({
                principle: 'continuity',
                application: 'Create smooth visual transitions and flow in temporal data visualization',
                effectiveness: 80,
                cognitiveSupport: 'Supports natural reading patterns and temporal understanding',
            });
        }
        // Figure-ground: Establish clear hierarchy
        applications.push({
            principle: 'figure_ground',
            application: 'Use contrast and visual weight to distinguish primary data from background context',
            effectiveness: 95,
            cognitiveSupport: 'Enables immediate focus on most important information',
        });
        // Common fate: Show data relationships through movement or transformation
        if (visualEncoding.informationDensity > 60) {
            applications.push({
                principle: 'common_fate',
                application: 'Use coordinated animations or transformations to show data relationships',
                effectiveness: 70,
                cognitiveSupport: 'Reveals hidden patterns and connections in complex datasets',
            });
        }
        return applications;
    }
    static analyzeCognitiveLoad(visualEncoding, aestheticProfile) {
        return {
            intrinsicLoad: visualEncoding.cognitiveLoad * 0.4,
            extraneousLoad: visualEncoding.cognitiveLoad * 0.3,
            germaneLoad: visualEncoding.cognitiveLoad * 0.3,
            totalLoad: visualEncoding.cognitiveLoad,
            recommendations: [],
        };
    }
    static analyzeAttentionFlow(visualEncoding, aestheticProfile) {
        return {
            entryPoints: [],
            flowPath: [],
            exitPoints: [],
            distractions: [],
            flowEfficiency: 75,
        };
    }
    static assessMemorability(visualEncoding, aestheticProfile) {
        return {
            distinctiveness: 70,
            meaningfulness: 80,
            simplicity: 75,
            emotionalImpact: 60,
            overallMemorability: 71,
        };
    }
    static calculateUsabilityMetrics(visualEncoding, aestheticProfile) {
        return {
            learnability: 80,
            efficiency: 85,
            memorability: 75,
            errorPrevention: 90,
            satisfaction: 80,
            overall: 82,
        };
    }
    static ensureAccessibility(visualEncoding, aestheticProfile) {
        return {
            wcagLevel: 'AA',
            colorBlindnessSupport: {
                protanopia: 85,
                deuteranopia: 85,
                tritanopia: 90,
                achromatopsia: 80,
                alternativeEncodings: ['pattern', 'texture', 'shape'],
            },
            contrastCompliance: {
                minimumContrast: 4.5,
                enhancedContrast: 7.0,
                graphicalObjectContrast: 3.0,
                complianceLevel: 'AA',
            },
            motorImpairmentSupport: {
                minimumTargetSize: 44,
                spacing: 8,
                dragAlternatives: ['click', 'keyboard'],
                keyboardNavigation: true,
            },
            cognitiveSupport: {
                complexityReduction: ['clear labeling', 'consistent patterns'],
                memoryAids: ['persistent legends', 'contextual help'],
                consistentPatterns: ['uniform interactions', 'predictable behavior'],
                errorPrevention: ['input validation', 'clear feedback'],
            },
            screenReaderCompatibility: {
                ariaCompliance: true,
                textAlternatives: true,
                structuralMarkup: true,
                focusManagement: true,
            },
            complianceScore: 85,
        };
    }
    static adaptForCulture(culture) {
        return {
            readingDirection: 'ltr',
            colorCulturalMeaning: [],
            symbolismAdaptation: [],
            numeralSystem: 'western',
            dateFormat: 'ISO',
            localizations: [],
        };
    }
    static applyCompositionPrinciples(chartType, visualEncoding) {
        return [
            {
                principle: 'Visual Hierarchy',
                application: 'Primary data elements use stronger visual weight',
                strength: 85,
                visualImpact: 'Guides user attention to most important information',
                reasoning: 'Establishes clear information priority',
            },
        ];
    }
    static assessVisualQuality(visualEncoding, aestheticProfile, perceptualOptimization, accessibilityCompliance) {
        const aestheticScore = aestheticProfile.styleConsistency.consistencyScore;
        const functionalScore = visualEncoding.encodingEfficiency;
        const accessibilityScore = accessibilityCompliance.complianceScore;
        const usabilityScore = perceptualOptimization.usabilityMetrics.overall;
        // Calculate originality score based on encoding innovation and visual uniqueness
        const originalityScore = this.calculateOriginalityScore(visualEncoding, aestheticProfile);
        const overallQuality = (aestheticScore + functionalScore + accessibilityScore + usabilityScore + originalityScore) /
            5;
        // Identify improvement areas based on scores
        const improvementAreas = this.identifyImprovementAreas({
            aestheticScore,
            functionalScore,
            accessibilityScore,
            usabilityScore,
            originalityScore,
        });
        return {
            aestheticScore,
            functionalScore,
            accessibilityScore,
            usabilityScore,
            originalityScore,
            overallQuality,
            improvementAreas,
        };
    }
    // Helper methods for enhanced implementations
    static generateVisualFlow(dimensions, chartType) {
        const flow = [];
        if (dimensions.length < 2)
            return flow;
        // Create flow based on encoding strength
        for (let i = 0; i < dimensions.length - 1; i++) {
            const strengthDiff = dimensions[i].encodingStrength - dimensions[i + 1].encodingStrength;
            if (strengthDiff > 0.2) {
                flow.push({
                    from: dimensions[i].dataField,
                    to: dimensions[i + 1].dataField,
                    strength: Math.min(100, strengthDiff * 100),
                    technique: this.selectFlowTechnique(dimensions[i], dimensions[i + 1]),
                });
            }
        }
        return flow;
    }
    static selectFlowTechnique(from, to) {
        if (from.channel.includes('color') || to.channel.includes('color')) {
            return 'color_gradient';
        }
        else if (from.channel.includes('size') || to.channel.includes('size')) {
            return 'size_progression';
        }
        else if (from.channel.includes('position') || to.channel.includes('position')) {
            return 'position_flow';
        }
        else {
            return 'line_connection';
        }
    }
    static analyzeDataSentiment(dataCharacteristics) {
        const fields = dataCharacteristics.fields || [];
        let positiveCount = 0;
        let negativeCount = 0;
        fields.forEach((field) => {
            const name = field.name?.toLowerCase() || '';
            if (name.includes('positive') ||
                name.includes('success') ||
                name.includes('good') ||
                name.includes('profit') ||
                name.includes('growth') ||
                name.includes('improvement')) {
                positiveCount++;
            }
            else if (name.includes('negative') ||
                name.includes('error') ||
                name.includes('bad') ||
                name.includes('loss') ||
                name.includes('decline') ||
                name.includes('problem')) {
                negativeCount++;
            }
        });
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount)
            return 'negative';
        return 'neutral';
    }
    static calculateDataComplexity(dataCharacteristics) {
        const fieldCount = dataCharacteristics.fields?.length || 0;
        const recordCount = dataCharacteristics.recordCount || 0;
        const categoricalFields = dataCharacteristics.categoricalColumns || 0;
        const numericalFields = dataCharacteristics.numericalColumns || 0;
        // Normalize complexity factors
        const fieldComplexity = Math.min(1, fieldCount / 20);
        const recordComplexity = Math.min(1, recordCount / 10000);
        const typeComplexity = Math.min(1, (categoricalFields + numericalFields) / 15);
        return (fieldComplexity + recordComplexity + typeComplexity) / 3;
    }
    static hexToHSL(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        // Parse RGB values
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        if (diff !== 0) {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / diff + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / diff + 2;
                    break;
                case b:
                    h = (r - g) / diff + 4;
                    break;
            }
            h /= 6;
        }
        return {
            hue: Math.round(h * 360),
            saturation: Math.round(s * 100),
            lightness: Math.round(l * 100),
        };
    }
    static calculateHueSpread(hues) {
        if (hues.length < 2)
            return 0;
        // Sort hues and calculate maximum spread
        const sortedHues = [...hues].sort((a, b) => a - b);
        let maxSpread = 0;
        for (let i = 0; i < sortedHues.length - 1; i++) {
            const spread = sortedHues[i + 1] - sortedHues[i];
            maxSpread = Math.max(maxSpread, spread);
        }
        // Check wrap-around spread
        const wrapSpread = 360 - sortedHues[sortedHues.length - 1] + sortedHues[0];
        maxSpread = Math.max(maxSpread, wrapSpread);
        return maxSpread;
    }
    static evaluateColorTheoryCompliance(hues, harmonyType) {
        if (hues.length < 2)
            return 0;
        switch (harmonyType) {
            case 'analogous':
                return this.checkAnalogousCompliance(hues);
            case 'complementary':
                return this.checkComplementaryCompliance(hues);
            case 'triadic':
                return this.checkTriadicCompliance(hues);
            case 'tetradic':
                return this.checkTetradicCompliance(hues);
            case 'monochromatic':
                return this.checkMonochromaticCompliance(hues);
            default:
                return 15; // Base score for unknown types
        }
    }
    static checkAnalogousCompliance(hues) {
        // Analogous colors should be within 30-60 degrees of each other
        let totalCompliance = 0;
        let comparisons = 0;
        for (let i = 0; i < hues.length - 1; i++) {
            for (let j = i + 1; j < hues.length; j++) {
                const diff = Math.abs(hues[i] - hues[j]);
                const circularDiff = Math.min(diff, 360 - diff);
                if (circularDiff >= 15 && circularDiff <= 60) {
                    totalCompliance += 25;
                }
                else if (circularDiff <= 90) {
                    totalCompliance += 15;
                }
                else {
                    totalCompliance += 5;
                }
                comparisons++;
            }
        }
        return comparisons > 0 ? totalCompliance / comparisons : 0;
    }
    static checkComplementaryCompliance(hues) {
        // Look for hues approximately 180 degrees apart
        for (let i = 0; i < hues.length - 1; i++) {
            for (let j = i + 1; j < hues.length; j++) {
                const diff = Math.abs(hues[i] - hues[j]);
                const circularDiff = Math.min(diff, 360 - diff);
                if (Math.abs(circularDiff - 180) <= 30) {
                    return 25; // Perfect complementary
                }
            }
        }
        return 10; // No complementary found
    }
    static checkTriadicCompliance(hues) {
        if (hues.length < 3)
            return 0;
        // Check if any three hues form a triadic relationship (120 degrees apart)
        for (let i = 0; i < hues.length - 2; i++) {
            for (let j = i + 1; j < hues.length - 1; j++) {
                for (let k = j + 1; k < hues.length; k++) {
                    const sorted = [hues[i], hues[j], hues[k]].sort((a, b) => a - b);
                    const diff1 = sorted[1] - sorted[0];
                    const diff2 = sorted[2] - sorted[1];
                    const diff3 = 360 - sorted[2] + sorted[0];
                    if (Math.abs(diff1 - 120) <= 30 &&
                        Math.abs(diff2 - 120) <= 30 &&
                        Math.abs(diff3 - 120) <= 30) {
                        return 25;
                    }
                }
            }
        }
        return 8;
    }
    static checkTetradicCompliance(hues) {
        if (hues.length < 4)
            return 0;
        // Simplified: check if hues are reasonably distributed
        const averageSpacing = 360 / hues.length;
        const idealSpacing = 90; // For tetradic
        if (Math.abs(averageSpacing - idealSpacing) <= 30) {
            return 25;
        }
        return 12;
    }
    static checkMonochromaticCompliance(hues) {
        // All hues should be very similar
        const hueRange = Math.max(...hues) - Math.min(...hues);
        if (hueRange <= 15)
            return 25;
        if (hueRange <= 30)
            return 18;
        if (hueRange <= 45)
            return 10;
        return 5;
    }
    static calculateAccessibilityBonus(harmony) {
        let bonus = 0;
        // Check contrast potential
        const lightnesses = harmony.map((c) => c.lightness);
        const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);
        if (lightnessRange >= 50)
            bonus += 5; // Good contrast potential
        if (lightnessRange >= 70)
            bonus += 3; // Excellent contrast potential
        // Check color-blind friendliness (avoid red-green combinations with similar lightness)
        const hasProblematicRedGreen = this.checkRedGreenProblems(harmony);
        if (!hasProblematicRedGreen)
            bonus += 2;
        return Math.min(10, bonus);
    }
    static checkRedGreenProblems(harmony) {
        for (let i = 0; i < harmony.length - 1; i++) {
            for (let j = i + 1; j < harmony.length; j++) {
                const color1 = harmony[i];
                const color2 = harmony[j];
                // Check if one is red-ish and one is green-ish with similar lightness
                const isRed1 = color1.hue >= 330 || color1.hue <= 30;
                const isGreen1 = color1.hue >= 90 && color1.hue <= 150;
                const isRed2 = color2.hue >= 330 || color2.hue <= 30;
                const isGreen2 = color2.hue >= 90 && color2.hue <= 150;
                if ((isRed1 && isGreen2) || (isGreen1 && isRed2)) {
                    const lightnessDiff = Math.abs(color1.lightness - color2.lightness);
                    if (lightnessDiff < 20) {
                        return true; // Problematic combination
                    }
                }
            }
        }
        return false;
    }
    static calculateCulturalBonus(harmony) {
        // Simplified cultural appropriateness check
        // Avoid culturally sensitive color combinations
        let bonus = 5; // Base cultural bonus
        // Check for balance - avoid overly aggressive colors
        const highSaturationCount = harmony.filter((c) => c.saturation > 85).length;
        if (highSaturationCount / harmony.length < 0.5) {
            bonus += 2; // Moderate saturation is generally more culturally appropriate
        }
        return Math.min(5, bonus);
    }
    static calculateOriginalityScore(visualEncoding, aestheticProfile) {
        let originalityScore = 50; // Base score
        // Reward innovative encoding combinations
        const uniqueChannels = new Set(visualEncoding.primaryDimensions
            .concat(visualEncoding.secondaryDimensions)
            .map((d) => d.channel)).size;
        if (uniqueChannels >= 4)
            originalityScore += 20; // Diverse channel usage
        if (uniqueChannels >= 6)
            originalityScore += 10; // Very diverse
        // Reward effective use of redundant encodings
        if (visualEncoding.redundantEncodings.length > 0) {
            const avgEffectiveness = visualEncoding.redundantEncodings.reduce((sum, enc) => sum + enc.effectiveness, 0) /
                visualEncoding.redundantEncodings.length;
            originalityScore += Math.min(15, (avgEffectiveness / 100) * 15);
        }
        // Reward sophisticated hierarchy
        const hierarchyComplexity = visualEncoding.hierarchicalStructure.levels.length;
        if (hierarchyComplexity >= 3)
            originalityScore += 10;
        // Penalize overly complex solutions
        if (visualEncoding.cognitiveLoad > 80)
            originalityScore -= 20;
        if (visualEncoding.cognitiveLoad > 90)
            originalityScore -= 10;
        // Reward high information density without complexity
        if (visualEncoding.informationDensity > 70 && visualEncoding.cognitiveLoad < 60) {
            originalityScore += 15;
        }
        return Math.max(0, Math.min(100, originalityScore));
    }
    static identifyImprovementAreas(scores) {
        const areas = [];
        const threshold = 75; // Scores below this need improvement
        if (scores.aestheticScore < threshold) {
            areas.push({
                area: 'Aesthetic Design',
                currentScore: scores.aestheticScore,
                potentialScore: Math.min(95, scores.aestheticScore + 20),
                recommendations: [
                    'Improve color harmony and consistency',
                    'Enhance visual balance and proportion',
                    'Refine typography system',
                ],
                priority: scores.aestheticScore < 50 ? 'critical' : scores.aestheticScore < 65 ? 'high' : 'medium',
            });
        }
        if (scores.functionalScore < threshold) {
            areas.push({
                area: 'Functional Efficiency',
                currentScore: scores.functionalScore,
                potentialScore: Math.min(95, scores.functionalScore + 15),
                recommendations: [
                    'Optimize encoding channel assignment',
                    'Reduce cognitive load while maintaining information density',
                    'Improve data-to-visualization mapping',
                ],
                priority: scores.functionalScore < 50 ? 'critical' : 'high',
            });
        }
        if (scores.accessibilityScore < threshold) {
            areas.push({
                area: 'Accessibility Compliance',
                currentScore: scores.accessibilityScore,
                potentialScore: Math.min(98, scores.accessibilityScore + 23),
                recommendations: [
                    'Enhance color contrast and alternative encodings',
                    'Improve screen reader compatibility',
                    'Add motor impairment support features',
                ],
                priority: scores.accessibilityScore < 60 ? 'critical' : 'high',
            });
        }
        if (scores.usabilityScore < threshold) {
            areas.push({
                area: 'User Experience',
                currentScore: scores.usabilityScore,
                potentialScore: Math.min(92, scores.usabilityScore + 17),
                recommendations: [
                    'Simplify interaction patterns',
                    'Improve learnability and memorability',
                    'Enhance user satisfaction through better feedback',
                ],
                priority: scores.usabilityScore < 55 ? 'critical' : 'high',
            });
        }
        if (scores.originalityScore < threshold) {
            areas.push({
                area: 'Visual Innovation',
                currentScore: scores.originalityScore,
                potentialScore: Math.min(90, scores.originalityScore + 15),
                recommendations: [
                    'Explore innovative encoding combinations',
                    'Balance complexity with clarity',
                    'Implement sophisticated visual hierarchies',
                ],
                priority: 'medium',
            });
        }
        return areas;
    }
}
exports.ChartComposer = ChartComposer;
//# sourceMappingURL=chart-composer.js.map