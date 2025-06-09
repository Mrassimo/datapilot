/**
 * Online/Incremental Statistical Algorithms
 * Memory-efficient streaming statistics using proven algorithms
 */
/**
 * Welford's Online Algorithm for Mean, Variance, Skewness, and Kurtosis
 * Computes all four moments incrementally with constant memory
 */
export declare class OnlineStatistics {
    private count;
    private mean;
    private M2;
    private M3;
    private M4;
    private min;
    private max;
    private sum;
    /**
     * Add a new value and update all statistics
     */
    update(value: number): void;
    /**
     * Get basic count (for backward compatibility)
     */
    getCount(): number;
    getSum(): number;
    getMean(): number;
    getMin(): number;
    getMax(): number;
    getRange(): number;
    getVariance(): number;
    getStandardDeviation(): number;
    getSkewness(): number;
    getKurtosis(): number;
    getCoefficientOfVariation(): number;
    /**
     * Merge with another OnlineStatistics instance
     */
    merge(other: OnlineStatistics): OnlineStatistics;
}
/**
 * P² Algorithm for Quantile Estimation
 * Estimates any quantile using only 5 markers
 */
export declare class P2Quantile {
    private quantile;
    private markers;
    private positions;
    private desired;
    private count;
    private initialized;
    constructor(quantile: number);
    update(value: number): void;
    private parabolic;
    private linear;
    getQuantile(): number;
}
/**
 * Reservoir Sampling for Representative Samples
 * Maintains a fixed-size random sample with uniform probability
 */
export declare class ReservoirSampler<T> {
    private size;
    private reservoir;
    private count;
    private rng;
    constructor(size: number, seed?: number);
    sample(item: T): void;
    /**
     * Creates a seeded pseudo-random number generator (PRNG).
     * Uses a simple linear congruential generator (LCG) for simplicity.
     */
    private createSeededRandom;
    getSample(): T[];
    getCount(): number;
    clear(): void;
}
/**
 * Online Covariance for Streaming Correlation Calculation
 */
export declare class OnlineCovariance {
    private count;
    private meanX;
    private meanY;
    private C;
    private sumX;
    private sumY;
    private sumXX;
    private sumYY;
    update(x: number, y: number): void;
    getCovariance(): number;
    getCorrelation(): number;
    getCount(): number;
    getMeanX(): number;
    getMeanY(): number;
    getVarianceX(): number;
    getVarianceY(): number;
}
/**
 * Frequency Counter with Memory Bounds
 * Uses a simple map with automatic pruning when memory limit is reached
 */
export declare class BoundedFrequencyCounter<T> {
    private frequencies;
    private maxEntries;
    constructor(maxEntries?: number);
    update(item: T): void;
    private pruneToTopFrequencies;
    getFrequencies(): Map<T, number>;
    getTopK(k: number): Array<[T, number]>;
    getCount(item: T): number;
    getTotalCount(): number;
    clear(): void;
}
//# sourceMappingURL=online-statistics.d.ts.map