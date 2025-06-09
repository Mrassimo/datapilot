"use strict";
/**
 * Section 4: Visualization Intelligence Types
 * Comprehensive type definitions for intelligent chart recommendations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREDEFINED_PALETTES = exports.BivariatePurpose = exports.RelationshipType = exports.ColorPaletteType = exports.AntiPatternSeverity = exports.AntiPatternType = exports.RecommendationType = exports.PerformanceLevel = exports.InteractivityLevel = exports.FilterType = exports.ResponsivenessLevel = exports.InteractionType = exports.DataSize = exports.ComplexityLevel = exports.AccessibilityLevel = exports.RecommendationPriority = exports.ChartPurpose = exports.ChartType = void 0;
// ===== CORE ENUMS =====
var ChartType;
(function (ChartType) {
    // Univariate Numerical
    ChartType["HISTOGRAM"] = "histogram";
    ChartType["BOX_PLOT"] = "box_plot";
    ChartType["VIOLIN_PLOT"] = "violin_plot";
    ChartType["VIOLIN_WITH_BOX"] = "violin_with_box";
    ChartType["DENSITY_PLOT"] = "density_plot";
    ChartType["DOT_PLOT"] = "dot_plot";
    ChartType["Q_Q_PLOT"] = "q_q_plot";
    // Univariate Categorical
    ChartType["BAR_CHART"] = "bar_chart";
    ChartType["HORIZONTAL_BAR"] = "horizontal_bar";
    ChartType["PIE_CHART"] = "pie_chart";
    ChartType["DONUT_CHART"] = "donut_chart";
    ChartType["WAFFLE_CHART"] = "waffle_chart";
    ChartType["TREEMAP"] = "treemap";
    ChartType["SUNBURST"] = "sunburst";
    ChartType["LOLLIPOP_CHART"] = "lollipop_chart";
    // Bivariate Numerical vs Numerical
    ChartType["SCATTER_PLOT"] = "scatter_plot";
    ChartType["LINE_CHART"] = "line_chart";
    ChartType["BUBBLE_CHART"] = "bubble_chart";
    ChartType["REGRESSION_PLOT"] = "regression_plot";
    ChartType["RESIDUAL_PLOT"] = "residual_plot";
    ChartType["HEX_BIN"] = "hex_bin";
    ChartType["CONTOUR_PLOT"] = "contour_plot";
    // Bivariate Numerical vs Categorical
    ChartType["GROUPED_BAR"] = "grouped_bar";
    ChartType["STACKED_BAR"] = "stacked_bar";
    ChartType["BOX_PLOT_BY_GROUP"] = "box_plot_by_group";
    ChartType["VIOLIN_BY_GROUP"] = "violin_by_group";
    ChartType["STRIP_CHART"] = "strip_chart";
    ChartType["SWARM_PLOT"] = "swarm_plot";
    // Bivariate Categorical vs Categorical
    ChartType["STACKED_BAR_CATEGORICAL"] = "stacked_bar_categorical";
    ChartType["GROUPED_BAR_CATEGORICAL"] = "grouped_bar_categorical";
    ChartType["HEATMAP"] = "heatmap";
    ChartType["MOSAIC_PLOT"] = "mosaic_plot";
    ChartType["ALLUVIAL_DIAGRAM"] = "alluvial_diagram";
    ChartType["CHORD_DIAGRAM"] = "chord_diagram";
    // Time Series
    ChartType["TIME_SERIES_LINE"] = "time_series_line";
    ChartType["TIME_SERIES_AREA"] = "time_series_area";
    ChartType["CALENDAR_HEATMAP"] = "calendar_heatmap";
    ChartType["SEASONAL_PLOT"] = "seasonal_plot";
    ChartType["LAG_PLOT"] = "lag_plot";
    ChartType["GANTT_CHART"] = "gantt_chart";
    // Multivariate
    ChartType["PARALLEL_COORDINATES"] = "parallel_coordinates";
    ChartType["RADAR_CHART"] = "radar_chart";
    ChartType["CORRELATION_MATRIX"] = "correlation_matrix";
    ChartType["SCATTERPLOT_MATRIX"] = "scatterplot_matrix";
    ChartType["PCA_BIPLOT"] = "pca_biplot";
    ChartType["ANDREWS_PLOT"] = "andrews_plot";
    // Advanced Statistical
    ChartType["VIOLIN_MATRIX"] = "violin_matrix";
    ChartType["MARGINAL_PLOT"] = "marginal_plot";
    ChartType["PAIR_PLOT"] = "pair_plot";
    ChartType["FACET_GRID"] = "facet_grid";
    // Specialized
    ChartType["GEOGRAPHIC_MAP"] = "geographic_map";
    ChartType["CHOROPLETH_MAP"] = "choropleth_map";
    ChartType["NETWORK_DIAGRAM"] = "network_diagram";
    ChartType["SANKEY_DIAGRAM"] = "sankey_diagram";
    ChartType["FUNNEL_CHART"] = "funnel_chart";
    ChartType["GAUGE_CHART"] = "gauge_chart";
    ChartType["WORD_CLOUD"] = "word_cloud";
})(ChartType || (exports.ChartType = ChartType = {}));
var ChartPurpose;
(function (ChartPurpose) {
    ChartPurpose["DISTRIBUTION"] = "distribution";
    ChartPurpose["COMPARISON"] = "comparison";
    ChartPurpose["RELATIONSHIP"] = "relationship";
    ChartPurpose["COMPOSITION"] = "composition";
    ChartPurpose["TREND"] = "trend";
    ChartPurpose["RANKING"] = "ranking";
    ChartPurpose["OUTLIER_DETECTION"] = "outlier_detection";
    ChartPurpose["PATTERN_RECOGNITION"] = "pattern_recognition";
})(ChartPurpose || (exports.ChartPurpose = ChartPurpose = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["PRIMARY"] = "primary";
    RecommendationPriority["SECONDARY"] = "secondary";
    RecommendationPriority["ALTERNATIVE"] = "alternative";
    RecommendationPriority["NOT_RECOMMENDED"] = "not_recommended";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var AccessibilityLevel;
(function (AccessibilityLevel) {
    AccessibilityLevel["EXCELLENT"] = "excellent";
    AccessibilityLevel["GOOD"] = "good";
    AccessibilityLevel["ADEQUATE"] = "adequate";
    AccessibilityLevel["POOR"] = "poor";
    AccessibilityLevel["INACCESSIBLE"] = "inaccessible";
})(AccessibilityLevel || (exports.AccessibilityLevel = AccessibilityLevel = {}));
var ComplexityLevel;
(function (ComplexityLevel) {
    ComplexityLevel["SIMPLE"] = "simple";
    ComplexityLevel["MODERATE"] = "moderate";
    ComplexityLevel["COMPLEX"] = "complex";
    ComplexityLevel["ADVANCED"] = "advanced";
})(ComplexityLevel || (exports.ComplexityLevel = ComplexityLevel = {}));
var DataSize;
(function (DataSize) {
    DataSize["SMALL"] = "small";
    DataSize["MEDIUM"] = "medium";
    DataSize["LARGE"] = "large";
    DataSize["VERY_LARGE"] = "very_large";
})(DataSize || (exports.DataSize = DataSize = {}));
var InteractionType;
(function (InteractionType) {
    InteractionType["HOVER"] = "hover";
    InteractionType["CLICK"] = "click";
    InteractionType["BRUSH"] = "brush";
    InteractionType["ZOOM"] = "zoom";
    InteractionType["PAN"] = "pan";
    InteractionType["FILTER"] = "filter";
    InteractionType["SORT"] = "sort";
    InteractionType["HIGHLIGHT"] = "highlight";
    InteractionType["DRILL_DOWN"] = "drill_down";
    InteractionType["TOOLTIP"] = "tooltip";
})(InteractionType || (exports.InteractionType = InteractionType = {}));
var ResponsivenessLevel;
(function (ResponsivenessLevel) {
    ResponsivenessLevel["STATIC"] = "static";
    ResponsivenessLevel["RESPONSIVE"] = "responsive";
    ResponsivenessLevel["ADAPTIVE"] = "adaptive";
})(ResponsivenessLevel || (exports.ResponsivenessLevel = ResponsivenessLevel = {}));
var FilterType;
(function (FilterType) {
    FilterType["RANGE"] = "range";
    FilterType["CATEGORICAL"] = "categorical";
    FilterType["DATE_RANGE"] = "date_range";
    FilterType["TEXT_SEARCH"] = "text_search";
    FilterType["MULTI_SELECT"] = "multi_select";
})(FilterType || (exports.FilterType = FilterType = {}));
var InteractivityLevel;
(function (InteractivityLevel) {
    InteractivityLevel["STATIC"] = "static";
    InteractivityLevel["BASIC"] = "basic";
    InteractivityLevel["INTERACTIVE"] = "interactive";
    InteractivityLevel["HIGHLY_INTERACTIVE"] = "highly_interactive";
})(InteractivityLevel || (exports.InteractivityLevel = InteractivityLevel = {}));
var PerformanceLevel;
(function (PerformanceLevel) {
    PerformanceLevel["FAST"] = "fast";
    PerformanceLevel["MODERATE"] = "moderate";
    PerformanceLevel["INTENSIVE"] = "intensive";
})(PerformanceLevel || (exports.PerformanceLevel = PerformanceLevel = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["UNIVARIATE"] = "univariate";
    RecommendationType["BIVARIATE"] = "bivariate";
    RecommendationType["MULTIVARIATE"] = "multivariate";
    RecommendationType["DASHBOARD"] = "dashboard";
    RecommendationType["ACCESSIBILITY"] = "accessibility";
    RecommendationType["PERFORMANCE"] = "performance";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
// ===== ANTI-PATTERN DETECTION =====
var AntiPatternType;
(function (AntiPatternType) {
    AntiPatternType["PIE_CHART_TOO_MANY_CATEGORIES"] = "pie_chart_too_many_categories";
    AntiPatternType["Y_AXIS_NOT_ZERO"] = "y_axis_not_zero";
    AntiPatternType["CHART_JUNK"] = "chart_junk";
    AntiPatternType["INAPPROPRIATE_CHART_TYPE"] = "inappropriate_chart_type";
    AntiPatternType["MISLEADING_SCALE"] = "misleading_scale";
    AntiPatternType["POOR_COLOR_CHOICE"] = "poor_color_choice";
    AntiPatternType["OVERCOMPLICATED_VISUALIZATION"] = "overcomplicated_visualization";
    AntiPatternType["MISSING_CONTEXT"] = "missing_context";
})(AntiPatternType || (exports.AntiPatternType = AntiPatternType = {}));
var AntiPatternSeverity;
(function (AntiPatternSeverity) {
    AntiPatternSeverity["CRITICAL"] = "critical";
    AntiPatternSeverity["HIGH"] = "high";
    AntiPatternSeverity["MEDIUM"] = "medium";
    AntiPatternSeverity["LOW"] = "low";
    AntiPatternSeverity["INFO"] = "info";
})(AntiPatternSeverity || (exports.AntiPatternSeverity = AntiPatternSeverity = {}));
// ===== COLOR SCIENCE & PALETTES =====
var ColorPaletteType;
(function (ColorPaletteType) {
    ColorPaletteType["QUALITATIVE"] = "qualitative";
    ColorPaletteType["SEQUENTIAL"] = "sequential";
    ColorPaletteType["DIVERGING"] = "diverging";
    ColorPaletteType["SINGLE_HUE"] = "single_hue";
    ColorPaletteType["CYCLIC"] = "cyclic";
})(ColorPaletteType || (exports.ColorPaletteType = ColorPaletteType = {}));
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["LINEAR_POSITIVE"] = "linear_positive";
    RelationshipType["LINEAR_NEGATIVE"] = "linear_negative";
    RelationshipType["NON_LINEAR"] = "non_linear";
    RelationshipType["CATEGORICAL_ASSOCIATION"] = "categorical_association";
    RelationshipType["TEMPORAL_CORRELATION"] = "temporal_correlation";
    RelationshipType["NO_RELATIONSHIP"] = "no_relationship";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var BivariatePurpose;
(function (BivariatePurpose) {
    BivariatePurpose["EXPLORE_RELATIONSHIP"] = "explore_relationship";
    BivariatePurpose["COMPARE_DISTRIBUTIONS"] = "compare_distributions";
    BivariatePurpose["SHOW_CORRELATION"] = "show_correlation";
    BivariatePurpose["IDENTIFY_CLUSTERS"] = "identify_clusters";
    BivariatePurpose["DETECT_OUTLIERS"] = "detect_outliers";
    BivariatePurpose["SHOW_COMPOSITION"] = "show_composition";
})(BivariatePurpose || (exports.BivariatePurpose = BivariatePurpose = {}));
// ===== PREDEFINED COLOR PALETTES =====
exports.PREDEFINED_PALETTES = {
    TABLEAU_10: {
        name: 'Tableau 10',
        type: ColorPaletteType.QUALITATIVE,
        colors: [
            '#4E79A7',
            '#F28E2B',
            '#E15759',
            '#76B7B2',
            '#59A14F',
            '#EDC948',
            '#AF7AA1',
            '#FF9D9A',
            '#9C755F',
            '#BAB0AC',
        ],
        usage: {
            maxCategories: 10,
            minCategories: 2,
            bestFor: ['categorical data', 'qualitative comparisons', 'distinct groups'],
            avoidFor: ['sequential data', 'continuous variables'],
        },
        accessibility: {
            contrastRatio: 4.5,
            alternativeEncoding: 'pattern',
            wcagLevel: 'AA',
            colorBlindSupport: true,
            colorBlindSafe: {
                protanopia: true,
                deuteranopia: true,
                tritanopia: true,
                severity: 'safe',
            },
            contrastRatios: [],
            alternativeEncodings: ['pattern', 'shape', 'texture'],
        },
        printSafety: {
            grayscaleCompatible: true,
            printFriendly: true,
            monochromeDistinguishable: true,
            recommendedPrintColors: ['#4E79A7', '#E15759', '#76B7B2', '#59A14F'],
        },
        context: {
            cultural: [],
            domain: [],
            emotional: [],
        },
    },
    VIRIDIS: {
        name: 'Viridis',
        type: ColorPaletteType.SEQUENTIAL,
        colors: ['#440154', '#31688E', '#35B779', '#FDE725'],
        usage: {
            maxCategories: 256,
            minCategories: 2,
            bestFor: ['continuous data', 'heatmaps', 'sequential values'],
            avoidFor: ['categorical data', 'qualitative comparisons'],
        },
        accessibility: {
            contrastRatio: 4.5,
            alternativeEncoding: 'size',
            wcagLevel: 'AA',
            colorBlindSupport: true,
            colorBlindSafe: {
                protanopia: true,
                deuteranopia: true,
                tritanopia: true,
                severity: 'safe',
            },
            contrastRatios: [],
            alternativeEncodings: ['opacity', 'size'],
        },
        printSafety: {
            grayscaleCompatible: true,
            printFriendly: true,
            monochromeDistinguishable: true,
            recommendedPrintColors: ['#440154', '#31688E', '#FDE725'],
        },
        context: {
            cultural: [],
            domain: [],
            emotional: [],
        },
    },
    RD_BU: {
        name: 'Red-Blue Diverging',
        type: ColorPaletteType.DIVERGING,
        colors: ['#B2182B', '#EF8A62', '#FDDBC7', '#F7F7F7', '#D1E5F0', '#67A9CF', '#2166AC'],
        usage: {
            maxCategories: 11,
            minCategories: 3,
            bestFor: ['diverging data', 'data with central reference', 'correlation matrices'],
            avoidFor: ['categorical data', 'sequential data'],
        },
        accessibility: {
            contrastRatio: 3.0,
            alternativeEncoding: 'pattern',
            wcagLevel: 'A',
            colorBlindSupport: false,
            colorBlindSafe: {
                protanopia: false,
                deuteranopia: false,
                tritanopia: true,
                severity: 'caution',
            },
            contrastRatios: [],
            alternativeEncodings: ['pattern', 'shape', 'value'],
        },
        printSafety: {
            grayscaleCompatible: false,
            printFriendly: false,
            monochromeDistinguishable: false,
            recommendedPrintColors: ['#B2182B', '#F7F7F7', '#2166AC'],
        },
        context: {
            cultural: [],
            domain: [],
            emotional: [],
        },
    },
};
//# sourceMappingURL=types.js.map