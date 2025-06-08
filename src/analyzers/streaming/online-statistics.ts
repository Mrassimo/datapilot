/**
 * Online/Incremental Statistical Algorithms
 * Memory-efficient streaming statistics using proven algorithms
 */

/**
 * Welford's Online Algorithm for Mean, Variance, Skewness, and Kurtosis
 * Computes all four moments incrementally with constant memory
 */
export class OnlineStatistics {
  private count = 0;
  private mean = 0;
  private M2 = 0; // Sum of squares of deviations
  private M3 = 0; // Third moment
  private M4 = 0; // Fourth moment
  private min = Number.POSITIVE_INFINITY;
  private max = Number.NEGATIVE_INFINITY;
  private sum = 0;

  /**
   * Add a new value and update all statistics
   */
  update(value: number): void {
    if (isNaN(value) || !isFinite(value)) return;

    const n = this.count;
    this.count++;
    this.sum += value;

    // Update min/max
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;

    // Welford's algorithm for higher moments
    const delta = value - this.mean;
    const delta_n = delta / this.count;
    const delta_n2 = delta_n * delta_n;
    const term1 = delta * delta_n * n;

    this.mean += delta_n;
    this.M4 +=
      term1 * delta_n2 * (this.count * this.count - 3 * this.count + 3) +
      6 * delta_n2 * this.M2 -
      4 * delta_n * this.M3;
    this.M3 += term1 * delta_n * (this.count - 2) - 3 * delta_n * this.M2;
    this.M2 += term1;
  }

  /**
   * Get basic count (for backward compatibility)
   */
  getCount(): number {
    return this.count;
  }
  
  getSum(): number {
    return this.sum;
  }
  
  getMean(): number {
    return this.count > 0 ? this.mean : 0;
  }
  
  getMin(): number {
    return this.count > 0 ? (this.min === Number.POSITIVE_INFINITY ? 0 : this.min) : 0;
  }
  
  getMax(): number {
    return this.count > 0 ? (this.max === Number.NEGATIVE_INFINITY ? 0 : this.max) : 0;
  }
  
  getRange(): number {
    return this.count > 0 ? this.getMax() - this.getMin() : 0;
  }

  getVariance(): number {
    return this.count < 2 ? 0 : this.M2 / this.count;
  }

  getStandardDeviation(): number {
    return Math.sqrt(this.getVariance());
  }

  getSkewness(): number {
    if (this.count < 3 || this.M2 === 0) return 0;
    return (Math.sqrt(this.count) * this.M3) / Math.pow(this.M2, 1.5);
  }

  getKurtosis(): number {
    if (this.count < 4 || this.M2 === 0) return 0;
    return (this.count * this.M4) / (this.M2 * this.M2) - 3;
  }

  getCoefficientOfVariation(): number {
    const mean = this.getMean();
    return mean !== 0 ? this.getStandardDeviation() / Math.abs(mean) : 0;
  }

  /**
   * Merge with another OnlineStatistics instance
   */
  merge(other: OnlineStatistics): OnlineStatistics {
    if (other.count === 0) return this;
    if (this.count === 0) return other;

    const combined = new OnlineStatistics();
    combined.count = this.count + other.count;
    combined.sum = this.sum + other.sum;
    combined.min = Math.min(this.min, other.min);
    combined.max = Math.max(this.max, other.max);

    const delta = other.mean - this.mean;
    const delta2 = delta * delta;
    const delta3 = delta * delta2;
    const delta4 = delta2 * delta2;

    combined.mean = (this.count * this.mean + other.count * other.mean) / combined.count;

    combined.M2 = this.M2 + other.M2 + (delta2 * this.count * other.count) / combined.count;

    combined.M3 =
      this.M3 +
      other.M3 +
      (delta3 * this.count * other.count * (this.count - other.count)) /
        (combined.count * combined.count) +
      (3 * delta * (this.count * other.M2 - other.count * this.M2)) / combined.count;

    combined.M4 =
      this.M4 +
      other.M4 +
      (delta4 *
        this.count *
        other.count *
        (this.count * this.count - this.count * other.count + other.count * other.count)) /
        (combined.count * combined.count * combined.count) +
      (6 * delta2 * (this.count * this.count * other.M2 + other.count * other.count * this.M2)) /
        (combined.count * combined.count) +
      (4 * delta * (this.count * other.M3 - other.count * this.M3)) / combined.count;

    return combined;
  }
}

/**
 * P² Algorithm for Quantile Estimation
 * Estimates any quantile using only 5 markers
 */
export class P2Quantile {
  private markers: number[] = new Array(5);
  private positions: number[] = [1, 2, 3, 4, 5];
  private desired: number[] = new Array(5);
  private count = 0;
  private initialized = false;

  constructor(private quantile: number) {
    // Desired positions for the 5 markers
    this.desired[0] = 1;
    this.desired[1] = 1 + 2 * quantile;
    this.desired[2] = 1 + 4 * quantile;
    this.desired[3] = 3 + 2 * quantile;
    this.desired[4] = 5;
  }

  update(value: number): void {
    if (isNaN(value) || !isFinite(value)) return;

    this.count++;

    if (!this.initialized) {
      // Initialize with first 5 values
      if (this.count <= 5) {
        this.markers[this.count - 1] = value;
        if (this.count === 5) {
          this.markers.sort((a, b) => a - b);
          this.initialized = true;
        }
      }
      return;
    }

    // Find insertion point
    let k = 0;
    if (value < this.markers[0]) {
      this.markers[0] = value;
      k = 1;
    } else if (value >= this.markers[4]) {
      this.markers[4] = value;
      k = 4;
    } else {
      for (let i = 1; i < 5; i++) {
        if (value < this.markers[i]) {
          k = i;
          break;
        }
      }
    }

    // Increment positions
    for (let i = k; i < 5; i++) {
      this.positions[i]++;
    }

    // Update desired positions
    for (let i = 0; i < 5; i++) {
      this.desired[i] += i === 0 || i === 4 ? 0 : this.quantile;
    }

    // Adjust markers
    for (let i = 1; i < 4; i++) {
      const d = this.desired[i] - this.positions[i];
      if (
        (d >= 1 && this.positions[i + 1] - this.positions[i] > 1) ||
        (d <= -1 && this.positions[i - 1] - this.positions[i] < -1)
      ) {
        const sign = d >= 0 ? 1 : -1;
        const qs = this.parabolic(i, sign);

        if (this.markers[i - 1] < qs && qs < this.markers[i + 1]) {
          this.markers[i] = qs;
        } else {
          this.markers[i] = this.linear(i, sign);
        }
        this.positions[i] += sign;
      }
    }
  }

  private parabolic(i: number, d: number): number {
    const qi = this.markers[i];
    const qim1 = this.markers[i - 1];
    const qip1 = this.markers[i + 1];
    const ni = this.positions[i];
    const nim1 = this.positions[i - 1];
    const nip1 = this.positions[i + 1];

    return (
      qi +
      (d / (nip1 - nim1)) *
        (((ni - nim1 + d) * (qip1 - qi)) / (nip1 - ni) +
          ((nip1 - ni - d) * (qi - qim1)) / (ni - nim1))
    );
  }

  private linear(i: number, d: number): number {
    const qi = this.markers[i];
    const q = d > 0 ? this.markers[i + 1] : this.markers[i - 1];
    const ni = this.positions[i];
    const n = d > 0 ? this.positions[i + 1] : this.positions[i - 1];

    return qi + (d * (q - qi)) / (n - ni);
  }

  getQuantile(): number {
    if (!this.initialized) {
      // Fallback for small datasets
      const sorted = [...this.markers.slice(0, this.count)].sort((a, b) => a - b);
      const index = this.quantile * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return sorted[lower] || 0;
      return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
    }
    return this.markers[2]; // Middle marker approximates the quantile
  }
}

/**
 * Reservoir Sampling for Representative Samples
 * Maintains a fixed-size random sample with uniform probability
 */
export class ReservoirSampler<T> {
  private reservoir: T[] = [];
  private count = 0;
  private rng: () => number;

  constructor(
    private size: number,
    seed?: number,
  ) {
    this.rng = seed !== undefined ? this.createSeededRandom(seed) : Math.random;
  }

  sample(item: T): void {
    this.count++;

    if (this.reservoir.length < this.size) {
      this.reservoir.push(item);
    } else {
      // Replace random element with probability size/count
      const j = Math.floor(this.rng() * this.count);
      if (j < this.size) {
        this.reservoir[j] = item;
      }
    }
  }

  /**
   * Creates a seeded pseudo-random number generator (PRNG).
   * Uses a simple linear congruential generator (LCG) for simplicity.
   */
  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      // LCG parameters from POSIX
      currentSeed = (currentSeed * 1103515245 + 12345) % 2147483648;
      return currentSeed / 2147483648;
    };
  }

  getSample(): T[] {
    return [...this.reservoir];
  }

  getCount(): number {
    return this.count;
  }

  clear(): void {
    this.reservoir = [];
    this.count = 0;
  }
}

/**
 * Online Covariance for Streaming Correlation Calculation
 */
export class OnlineCovariance {
  private count = 0;
  private meanX = 0;
  private meanY = 0;
  private C = 0; // Covariance accumulator
  private sumX = 0;
  private sumY = 0;
  private sumXX = 0;
  private sumYY = 0;

  update(x: number, y: number): void {
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return;

    this.count++;
    this.sumX += x;
    this.sumY += y;
    this.sumXX += x * x;
    this.sumYY += y * y;

    const deltaX = x - this.meanX;
    this.meanX += deltaX / this.count;
    const deltaY = y - this.meanY;
    this.meanY += deltaY / this.count;
    this.C += deltaX * (y - this.meanY);
  }

  getCovariance(): number {
    return this.count < 2 ? 0 : this.C / this.count;
  }

  getCorrelation(): number {
    if (this.count < 2) return 0;

    // Use sample variance formula (n-1 denominator) for consistency
    const n = this.count;
    const varX = (this.sumXX - (this.sumX * this.sumX) / n) / (n - 1);
    const varY = (this.sumYY - (this.sumY * this.sumY) / n) / (n - 1);

    // Handle edge cases for zero variance
    const epsilon = 1e-12;
    if (varX < epsilon || varY < epsilon) {
      // If either variable has effectively zero variance, correlation is undefined
      return 0;
    }

    // Use sample covariance for consistency
    const sampleCovariance = this.count < 2 ? 0 : this.C / (n - 1);
    const correlation = sampleCovariance / Math.sqrt(varX * varY);

    // Clamp to [-1, 1] to handle numerical precision issues
    return Math.max(-1, Math.min(1, correlation));
  }

  getCount(): number {
    return this.count;
  }

  getMeanX(): number {
    return this.meanX;
  }

  getMeanY(): number {
    return this.meanY;
  }

  getVarianceX(): number {
    if (this.count < 2) return 0;
    const n = this.count;
    return (this.sumXX - (this.sumX * this.sumX) / n) / (n - 1);
  }

  getVarianceY(): number {
    if (this.count < 2) return 0;
    const n = this.count;
    return (this.sumYY - (this.sumY * this.sumY) / n) / (n - 1);
  }
}

/**
 * Frequency Counter with Memory Bounds
 * Uses a simple map with automatic pruning when memory limit is reached
 */
export class BoundedFrequencyCounter<T> {
  private frequencies = new Map<T, number>();
  private maxEntries: number;

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
  }

  update(item: T): void {
    const current = this.frequencies.get(item) || 0;
    this.frequencies.set(item, current + 1);

    // Prune if we exceed max entries
    if (this.frequencies.size > this.maxEntries) {
      this.pruneToTopFrequencies();
    }
  }

  private pruneToTopFrequencies(): void {
    // Keep only the top 80% most frequent items
    const keepCount = Math.floor(this.maxEntries * 0.8);
    const sorted = Array.from(this.frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, keepCount);

    this.frequencies.clear();
    sorted.forEach(([key, value]) => {
      this.frequencies.set(key, value);
    });
  }

  getFrequencies(): Map<T, number> {
    return new Map(this.frequencies);
  }

  getTopK(k: number): Array<[T, number]> {
    return Array.from(this.frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);
  }

  getCount(item: T): number {
    return this.frequencies.get(item) || 0;
  }

  getTotalCount(): number {
    return Array.from(this.frequencies.values()).reduce((sum, count) => sum + count, 0);
  }

  clear(): void {
    this.frequencies.clear();
  }
}
