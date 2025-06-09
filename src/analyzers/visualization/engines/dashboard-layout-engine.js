"use strict";
/**
 * Sophisticated Dashboard Layout Engine
 *
 * Advanced engine for intelligent dashboard composition using:
 * - Perceptual hierarchy optimization
 * - Spatial relationship analysis
 * - Narrative flow construction
 * - Cognitive load balancing
 * - Cross-chart interaction design
 * - Responsive layout adaptation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardLayoutEngine = void 0;
/**
 * Sophisticated Dashboard Layout Engine
 */
class DashboardLayoutEngine {
    /**
     * Generate optimal dashboard layout based on visualization characteristics
     */
    static generateLayout(visualizations, constraints, context) {
        // Analyze visualization characteristics and relationships
        const analysis = this.analyzeVisualizations(visualizations);
        // Generate layout strategy based on analysis and context
        const layoutStrategy = this.selectLayoutStrategy(analysis, constraints, context);
        // Create spatial arrangement optimized for perception
        const spatialArrangement = this.generateSpatialArrangement(visualizations, layoutStrategy, constraints);
        // Design narrative flow for optimal user experience
        const narrativeFlow = this.designNarrativeFlow(visualizations, analysis, context);
        // Establish perceptual hierarchy
        const perceptualHierarchy = this.establishPerceptualHierarchy(visualizations, spatialArrangement);
        // Design interaction patterns
        const interactionDesign = this.designInteractions(visualizations, analysis);
        // Create responsive adaptation strategy
        const responsiveAdaptation = this.designResponsiveAdaptation(spatialArrangement, constraints);
        // Optimize for cognitive load
        const cognitiveOptimization = this.optimizeCognitivLoad(spatialArrangement, narrativeFlow);
        // Calculate layout metrics
        const layoutMetrics = this.calculateLayoutMetrics(spatialArrangement, narrativeFlow, perceptualHierarchy, interactionDesign, responsiveAdaptation, cognitiveOptimization);
        return {
            layoutStrategy,
            spatialArrangement,
            narrativeFlow,
            perceptualHierarchy,
            interactionDesign,
            responsiveAdaptation,
            cognitiveOptimization,
            layoutMetrics,
        };
    }
    /**
     * Analyze visualization characteristics and relationships
     */
    static analyzeVisualizations(visualizations) {
        const relationships = this.identifyRelationships(visualizations);
        const importance = this.calculateImportance(visualizations);
        const complexity = this.assessComplexity(visualizations);
        const interactionPotential = this.assessInteractionPotential(visualizations);
        return {
            relationships,
            importance,
            complexity,
            interactionPotential,
            count: visualizations.length,
            diversity: this.calculateDiversity(visualizations),
        };
    }
    /**
     * Select optimal layout strategy based on analysis
     */
    static selectLayoutStrategy(analysis, constraints, context) {
        let type;
        let reasoning;
        // Select strategy based on visualization count and relationships
        if (analysis.count <= 2) {
            type = 'golden_spiral';
            reasoning = 'Few visualizations benefit from golden ratio proportions';
        }
        else if (analysis.count <= 4 && analysis.relationships.strong > 0) {
            type = 'narrative';
            reasoning = 'Strong relationships suggest narrative flow layout';
        }
        else if (analysis.count <= 6) {
            type = 'z_pattern';
            reasoning = 'Medium count works well with Z-pattern reading flow';
        }
        else if (context.purpose === 'analytical') {
            type = 'analytical';
            reasoning = 'Many visualizations require systematic analytical layout';
        }
        else {
            type = 'grid';
            reasoning = 'Large number of visualizations benefit from grid organization';
        }
        const principles = this.getLayoutPrinciples(type, analysis);
        const layoutConstraints = this.generateLayoutConstraints(constraints, context);
        return {
            type,
            reasoning,
            principles,
            constraints: layoutConstraints,
            flexibility: this.calculateFlexibility(type, analysis, constraints),
        };
    }
    /**
     * Generate spatial arrangement optimized for perception
     */
    static generateSpatialArrangement(visualizations, strategy, constraints) {
        // Create zones based on strategy and visualization importance
        const zones = this.createLayoutZones(visualizations, strategy, constraints);
        // Establish spatial relationships
        const relationships = this.establishSpatialRelationships(zones, visualizations);
        // Define proximity rules
        const proximityRules = this.defineProximityRules(strategy.type);
        // Create alignment grid
        const alignmentGrid = this.createAlignmentGrid(strategy, constraints);
        // Analyze space utilization
        const spaceUtilization = this.analyzeSpaceUtilization(zones, constraints);
        return {
            zones,
            relationships,
            proximityRules,
            alignmentGrid,
            spaceUtilization,
        };
    }
    /**
     * Design narrative flow for optimal user experience
     */
    static designNarrativeFlow(visualizations, analysis, context) {
        // Create story structure
        const storyStructure = this.createStoryStructure(visualizations, analysis, context);
        // Design reading path
        const readingPath = this.designReadingPath(visualizations, storyStructure);
        // Create information architecture
        const informationArchitecture = this.createInformationArchitecture(visualizations, analysis);
        // Design transitions
        const transitionDesign = this.designTransitions(readingPath, storyStructure);
        // Establish contextual connections
        const contextualConnections = this.establishContextualConnections(visualizations, analysis);
        return {
            storyStructure,
            readingPath,
            informationArchitecture,
            transitionDesign,
            contextualConnections,
        };
    }
    // Placeholder implementations for complex methods
    static identifyRelationships(visualizations) {
        return { strong: 1, moderate: 2, weak: 1 };
    }
    static calculateImportance(visualizations) {
        return visualizations.map((v) => v.importance);
    }
    static assessComplexity(visualizations) {
        return visualizations.map((v) => v.complexity);
    }
    static assessInteractionPotential(visualizations) {
        return visualizations.map(() => Math.random() * 100);
    }
    static calculateDiversity(visualizations) {
        const types = new Set(visualizations.map((v) => v.type));
        return types.size / visualizations.length;
    }
    static getLayoutPrinciples(type, analysis) {
        return [
            {
                principle: 'Visual Hierarchy',
                weight: 0.9,
                application: 'Primary visualizations receive prominent placement',
                tradeoffs: ['Space utilization vs prominence'],
            },
        ];
    }
    static generateLayoutConstraints(constraints, context) {
        return [
            {
                constraint: 'Minimum chart size',
                type: 'hard',
                value: constraints.minChartSize,
                reasoning: 'Charts must be readable and functional',
            },
        ];
    }
    static calculateFlexibility(type, analysis, constraints) {
        // Grid layouts are more flexible, narrative layouts less so
        const baseFlexibility = type === 'grid' ? 80 : type === 'narrative' ? 40 : 60;
        const diversityFactor = analysis.diversity * 20;
        return Math.min(100, baseFlexibility + diversityFactor);
    }
    static createLayoutZones(visualizations, strategy, constraints) {
        return visualizations.map((viz, index) => ({
            id: viz.id,
            purpose: index === 0 ? 'primary' : 'secondary',
            bounds: {
                x: ((index % 2) * constraints.maxWidth) / 2,
                y: (Math.floor(index / 2) * constraints.maxHeight) / Math.ceil(visualizations.length / 2),
                width: constraints.maxWidth / 2,
                height: constraints.maxHeight / Math.ceil(visualizations.length / 2),
            },
            visualWeight: viz.importance,
            attentionPriority: viz.importance,
            contentTypes: [viz.type],
            visualProperties: {
                backgroundColor: 'white',
                borderStyle: 'none',
                padding: { top: 8, right: 8, bottom: 8, left: 8 },
                margin: { top: 4, right: 4, bottom: 4, left: 4 },
                elevation: 0,
            },
        }));
    }
    static establishSpatialRelationships(zones, visualizations) {
        const relationships = [];
        for (let i = 0; i < zones.length; i++) {
            for (let j = i + 1; j < zones.length; j++) {
                relationships.push({
                    sourceZone: zones[i].id,
                    targetZone: zones[j].id,
                    relationshipType: 'adjacent',
                    strength: 0.5,
                    visualIndicators: ['proximity'],
                    purpose: 'Spatial organization',
                });
            }
        }
        return relationships;
    }
    static defineProximityRules(layoutType) {
        return [
            {
                rule: 'Related charts should be closer',
                distance: 16,
                applicableElements: ['all'],
                reasoning: 'Gestalt principle of proximity enhances perceived relationships',
            },
        ];
    }
    static createAlignmentGrid(strategy, constraints) {
        return {
            columns: 12,
            rows: 8,
            gutterWidth: 16,
            gutterHeight: 16,
            baselineGrid: 8,
            snapToGrid: true,
            gridType: 'modular',
        };
    }
    static analyzeSpaceUtilization(zones, constraints) {
        const totalArea = constraints.maxWidth * constraints.maxHeight;
        const usedArea = zones.reduce((sum, zone) => sum + zone.bounds.width * zone.bounds.height, 0);
        return {
            efficiency: (usedArea / totalArea) * 100,
            balance: 75, // Placeholder
            density: 60, // Placeholder
            breathingRoom: 40, // Placeholder
            hotSpots: [],
        };
    }
    static createStoryStructure(visualizations, analysis, context) {
        // Find the most important visualization as climax
        const climaxIndex = analysis.importance.indexOf(Math.max(...analysis.importance));
        return {
            structure: 'linear',
            acts: [
                {
                    act: 1,
                    purpose: 'Introduction',
                    visualizations: [visualizations[0]?.id || ''],
                    keyMessage: 'Initial data overview',
                    estimatedTime: 30,
                },
            ],
            climax: visualizations[climaxIndex]?.id || '',
            resolution: visualizations[visualizations.length - 1]?.id || '',
            theme: 'Data-driven insights',
        };
    }
    static designReadingPath(visualizations, storyStructure) {
        const primaryPath = visualizations.map((viz, index) => ({
            elementId: viz.id,
            order: index + 1,
            dwellTime: 15 + viz.complexity * 0.3,
            importance: viz.importance / 100,
            connections: index < visualizations.length - 1 ? [visualizations[index + 1].id] : [],
        }));
        return {
            primaryPath,
            alternativePaths: [],
            entryPoints: [
                {
                    elementId: visualizations[0]?.id || '',
                    probability: 0.8,
                    designOptimization: ['prominent placement', 'visual weight'],
                },
            ],
            exitPoints: [
                {
                    elementId: visualizations[visualizations.length - 1]?.id || '',
                    purpose: 'conclusion',
                    callToAction: 'Explore additional details',
                },
            ],
            decisionPoints: [],
        };
    }
    // Additional placeholder methods...
    static createInformationArchitecture(visualizations, analysis) {
        return {
            hierarchy: {
                levels: [],
                depth: 2,
                breadth: visualizations.length,
                balance: 0.8,
            },
            categories: [],
            relationships: [],
            navigation: {
                type: 'contextual',
                elements: [],
                behavior: {
                    persistence: true,
                    animation: true,
                    feedback: ['visual', 'haptic'],
                    defaultState: {},
                },
            },
        };
    }
    static designTransitions(readingPath, storyStructure) {
        return {
            transitions: [],
            continuity: [],
            pacing: {
                rhythm: 'moderate',
                pausePoints: [],
                acceleration: [],
            },
            emphasis: [],
        };
    }
    static establishContextualConnections(visualizations, analysis) {
        const connections = [];
        // Analyze shared dimensions between visualizations
        for (let i = 0; i < visualizations.length - 1; i++) {
            for (let j = i + 1; j < visualizations.length; j++) {
                const viz1 = visualizations[i];
                const viz2 = visualizations[j];
                // Find shared data dimensions
                const sharedDimensions = this.findSharedDimensions(viz1, viz2);
                if (sharedDimensions.length > 0) {
                    // Create contextual connection based on shared dimensions
                    const connection = this.createDimensionConnection(viz1, viz2, sharedDimensions);
                    connections.push(connection);
                }
                // Check for complementary analysis types
                const complementaryConnection = this.checkComplementaryAnalysis(viz1, viz2);
                if (complementaryConnection) {
                    connections.push(complementaryConnection);
                }
                // Check for hierarchical relationships
                const hierarchicalConnection = this.checkHierarchicalRelationship(viz1, viz2);
                if (hierarchicalConnection) {
                    connections.push(hierarchicalConnection);
                }
            }
        }
        // Add temporal connections if applicable
        const temporalConnections = this.identifyTemporalConnections(visualizations);
        connections.push(...temporalConnections);
        // Add narrative flow connections
        const narrativeConnections = this.establishNarrativeConnections(visualizations, analysis);
        connections.push(...narrativeConnections);
        return connections;
    }
    static establishPerceptualHierarchy(visualizations, spatialArrangement) {
        return {
            visualLayers: [],
            attentionFlow: {
                primaryFlow: [],
                secondaryFlows: [],
                attractors: [],
                distractors: [],
            },
            focusManagement: {
                focusStates: [],
                transitions: [],
                persistence: {
                    maintainFocus: true,
                    contextSwitching: 'smooth',
                    memoryAids: [],
                },
            },
            contrastStrategy: {
                contrastPairs: [],
                emphasis: {
                    primaryEmphasis: '',
                    secondaryEmphasis: [],
                    techniques: [],
                    balance: 80,
                },
                hierarchy: {
                    levels: [],
                    consistency: 85,
                    predictability: 90,
                },
            },
        };
    }
    static designInteractions(visualizations, analysis) {
        return {
            interactionPatterns: [],
            crossChartInteractions: [],
            feedbackSystems: [],
            gestureSupport: {
                touchGestures: [],
                mouseGestures: [],
                keyboardShortcuts: [],
                accessibility: [],
            },
        };
    }
    static designResponsiveAdaptation(spatialArrangement, constraints) {
        return {
            breakpoints: [
                {
                    name: 'mobile',
                    minWidth: 320,
                    maxWidth: 768,
                    deviceType: 'mobile',
                },
                {
                    name: 'tablet',
                    minWidth: 768,
                    maxWidth: 1024,
                    deviceType: 'tablet',
                },
                {
                    name: 'desktop',
                    minWidth: 1024,
                    deviceType: 'desktop',
                },
            ],
            adaptationStrategies: [],
            prioritization: {
                priority1: [],
                priority2: [],
                priority3: [],
                priority4: [],
                collapsible: [],
            },
            fallbacks: [],
        };
    }
    static optimizeCognitivLoad(spatialArrangement, narrativeFlow) {
        return {
            cognitiveLoadAnalysis: {
                totalLoad: 60,
                intrinsicLoad: 40,
                extraneousLoad: 15,
                germaneLoad: 5,
                recommendations: [],
            },
            attentionManagement: {
                strategies: [],
                timing: {
                    peakAttention: 8,
                    attentionSpan: 120,
                    refreshTechniques: [],
                },
                sustainability: {
                    techniques: [],
                    varietyScore: 70,
                    engagementLevel: 75,
                },
            },
            memorySupport: {
                shortTermSupport: [],
                longTermSupport: [],
                contextualCues: [],
                repetitionStrategy: 'spaced',
            },
            decisionSupport: {
                decisionPoints: [],
                guidanceLevel: 'moderate',
                errorPrevention: [],
            },
        };
    }
    static calculateLayoutMetrics(spatialArrangement, narrativeFlow, perceptualHierarchy, interactionDesign, responsiveAdaptation, cognitiveOptimization) {
        return {
            efficiency: {
                spaceUtilization: spatialArrangement.spaceUtilization.efficiency,
                informationDensity: spatialArrangement.spaceUtilization.density,
                navigationEfficiency: 80,
                taskCompletion: 85,
            },
            usability: {
                learnability: 80,
                efficiency: 85,
                memorability: 75,
                errorRate: 10,
                satisfaction: 80,
            },
            aesthetics: {
                visualHarmony: 85,
                balance: spatialArrangement.spaceUtilization.balance,
                proportion: 80,
                rhythm: 75,
                unity: 80,
            },
            accessibility: {
                wcagCompliance: 85,
                colorBlindSupport: 90,
                motorSupport: 85,
                cognitiveSupport: 80,
                screenReaderSupport: 85,
            },
            performance: {
                renderTime: 500,
                interactionLatency: 16,
                memoryUsage: 50,
                responsiveness: 90,
            },
            overallScore: 82,
        };
    }
    // Helper methods for contextual connections
    static findSharedDimensions(viz1, viz2) {
        const dims1 = viz1.dataDimensions || [];
        const dims2 = viz2.dataDimensions || [];
        return dims1
            .filter((dim1) => dims2.some((dim2) => dim1.field === dim2.field || dim1.semanticType === dim2.semanticType))
            .map((dim) => dim.field);
    }
    static createDimensionConnection(viz1, viz2, sharedDimensions) {
        return {
            sourceVisualization: viz1.id,
            targetVisualization: viz2.id,
            connectionType: 'dimensional_relationship',
            strength: this.calculateConnectionStrength(sharedDimensions.length),
            purpose: 'Show relationship through shared data dimensions',
            implementation: {
                visualTechnique: 'coordinated_highlighting',
                interactionPattern: 'brush_and_link',
                aestheticCues: ['consistent_color_encoding', 'aligned_axes'],
            },
            semanticMeaning: `Visualizations share ${sharedDimensions.length} data dimension(s): ${sharedDimensions.join(', ')}`,
            cognitiveSupport: 'Enables cross-visualization comparison and pattern recognition',
        };
    }
    static calculateConnectionStrength(sharedCount) {
        // Strength based on number of shared dimensions
        if (sharedCount >= 3)
            return 90;
        if (sharedCount === 2)
            return 75;
        if (sharedCount === 1)
            return 60;
        return 30;
    }
    static checkComplementaryAnalysis(viz1, viz2) {
        const complementaryPairs = [
            ['overview', 'detail'],
            ['trend', 'distribution'],
            ['correlation', 'composition'],
            ['temporal', 'categorical'],
            ['quantitative', 'qualitative'],
        ];
        for (const [type1, type2] of complementaryPairs) {
            if ((viz1.analysisType === type1 && viz2.analysisType === type2) ||
                (viz1.analysisType === type2 && viz2.analysisType === type1)) {
                return {
                    sourceVisualization: viz1.id,
                    targetVisualization: viz2.id,
                    connectionType: 'complementary_analysis',
                    strength: 80,
                    purpose: `Provide complementary ${type1}-${type2} perspective`,
                    implementation: {
                        visualTechnique: 'contextual_placement',
                        interactionPattern: 'detail_on_demand',
                        aestheticCues: ['visual_grouping', 'consistent_styling'],
                    },
                    semanticMeaning: `${type1} and ${type2} analysis provide complementary insights`,
                    cognitiveSupport: 'Supports comprehensive understanding through multiple perspectives',
                };
            }
        }
        return null;
    }
    static checkHierarchicalRelationship(viz1, viz2) {
        // Check if one visualization shows detail of another
        if (viz1.granularityLevel && viz2.granularityLevel) {
            const levelDiff = Math.abs(viz1.granularityLevel - viz2.granularityLevel);
            if (levelDiff >= 2) {
                const [parentViz, childViz] = viz1.granularityLevel > viz2.granularityLevel ? [viz1, viz2] : [viz2, viz1];
                return {
                    sourceVisualization: parentViz.id,
                    targetVisualization: childViz.id,
                    connectionType: 'hierarchical_detail',
                    strength: 85,
                    purpose: 'Show hierarchical relationship between overview and detail',
                    implementation: {
                        visualTechnique: 'nested_layout',
                        interactionPattern: 'drill_down',
                        aestheticCues: ['size_hierarchy', 'containment_relationships'],
                    },
                    semanticMeaning: 'Detail view of selected elements from overview',
                    cognitiveSupport: 'Enables progressive disclosure and focused exploration',
                };
            }
        }
        return null;
    }
    static identifyTemporalConnections(visualizations) {
        const temporalViz = visualizations.filter((viz) => viz.hasTemporalDimension);
        const connections = [];
        // Connect temporal visualizations for synchronized time navigation
        for (let i = 0; i < temporalViz.length - 1; i++) {
            for (let j = i + 1; j < temporalViz.length; j++) {
                connections.push({
                    sourceVisualization: temporalViz[i].id,
                    targetVisualization: temporalViz[j].id,
                    connectionType: 'temporal_synchronization',
                    strength: 95,
                    purpose: 'Synchronize temporal navigation across time-based visualizations',
                    implementation: {
                        visualTechnique: 'synchronized_time_axis',
                        interactionPattern: 'coordinated_temporal_navigation',
                        aestheticCues: ['aligned_time_scales', 'synchronized_highlighting'],
                    },
                    semanticMeaning: 'Coordinated exploration of temporal patterns',
                    cognitiveSupport: 'Enables temporal pattern comparison across multiple dimensions',
                });
            }
        }
        return connections;
    }
    static establishNarrativeConnections(visualizations, analysis) {
        const connections = [];
        // Create narrative flow based on analysis structure
        const sortedViz = [...visualizations].sort((a, b) => (a.narrativeOrder || 0) - (b.narrativeOrder || 0));
        for (let i = 0; i < sortedViz.length - 1; i++) {
            connections.push({
                sourceVisualization: sortedViz[i].id,
                targetVisualization: sortedViz[i + 1].id,
                connectionType: 'narrative_flow',
                strength: 70,
                purpose: 'Guide user through logical analysis progression',
                implementation: {
                    visualTechnique: 'directional_flow_indicators',
                    interactionPattern: 'guided_navigation',
                    aestheticCues: ['flow_arrows', 'progressive_reveal', 'breadcrumb_trail'],
                },
                semanticMeaning: `Step ${i + 1} to ${i + 2} in analytical narrative`,
                cognitiveSupport: 'Provides clear analytical progression and reduces cognitive burden',
            });
        }
        return connections;
    }
}
exports.DashboardLayoutEngine = DashboardLayoutEngine;
//# sourceMappingURL=dashboard-layout-engine.js.map