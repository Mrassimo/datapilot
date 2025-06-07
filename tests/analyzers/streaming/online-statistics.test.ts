import { 
  OnlineStatistics, 
  P2Quantile, 
  ReservoirSampler, 
  OnlineCovariance,
  BoundedFrequencyCounter 
} from '../../../src/analyzers/streaming/online-statistics';

describe('OnlineStatistics', () => {
  describe('Basic Statistical Calculations', () => {
    it('should calculate mean and variance correctly', () => {
      const stats = new OnlineStatistics();
      const values = [1, 2, 3, 4, 5];
      
      values.forEach(v => stats.update(v));
      
      expect(stats.getCount()).toBe(5);
      expect(stats.getMean()).toBe(3);
      expect(stats.getSum()).toBe(15);
      expect(stats.getMin()).toBe(1);
      expect(stats.getMax()).toBe(5);
      expect(stats.getVariance()).toBe(2); // Population variance
      expect(stats.getStandardDeviation()).toBeCloseTo(1.41, 2); // sqrt(2)
    });

    it('should handle single value correctly', () => {
      const stats = new OnlineStatistics();
      stats.update(42);
      
      expect(stats.getMean()).toBe(42);
      expect(stats.getVariance()).toBe(0);
      expect(stats.getStandardDeviation()).toBe(0);
    });

    it('should calculate higher moments correctly', () => {
      const stats = new OnlineStatistics();
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      values.forEach(v => stats.update(v));
      
      expect(stats.getSkewness()).toBeCloseTo(0, 1); // Symmetric distribution
      expect(stats.getKurtosis()).toBeCloseTo(-1.2, 1); // Uniform distribution
    });

    it('should merge two OnlineStatistics correctly', () => {
      const stats1 = new OnlineStatistics();
      const stats2 = new OnlineStatistics();
      
      [1, 2, 3].forEach(v => stats1.update(v));
      [4, 5, 6].forEach(v => stats2.update(v));
      
      const merged = stats1.merge(stats2);
      
      expect(merged.getCount()).toBe(6);
      expect(merged.getMean()).toBe(3.5);
      expect(merged.getSum()).toBe(21);
    });
  });
});

describe('ReservoirSampler', () => {
  describe('Deterministic Sampling', () => {
    it('should produce identical results with same seed', () => {
      const sampler1 = new ReservoirSampler<number>(5, 42);
      const sampler2 = new ReservoirSampler<number>(5, 42);
      
      const values = Array.from({ length: 20 }, (_, i) => i + 1);
      
      values.forEach(v => {
        sampler1.sample(v);
        sampler2.sample(v);
      });
      
      const sample1 = sampler1.getSample();
      const sample2 = sampler2.getSample();
      
      expect(sample1).toEqual(sample2);
      expect(sample1).toHaveLength(5);
    });

    it('should produce different results with different seeds', () => {
      const sampler1 = new ReservoirSampler<number>(5, 42);
      const sampler2 = new ReservoirSampler<number>(5, 123);
      
      const values = Array.from({ length: 20 }, (_, i) => i + 1);
      
      values.forEach(v => {
        sampler1.sample(v);
        sampler2.sample(v);
      });
      
      const sample1 = sampler1.getSample();
      const sample2 = sampler2.getSample();
      
      expect(sample1).not.toEqual(sample2);
      expect(sample1).toHaveLength(5);
      expect(sample2).toHaveLength(5);
    });

    it('should maintain sample size limit', () => {
      const sampler = new ReservoirSampler<string>(3, 42);
      
      ['a', 'b', 'c', 'd', 'e', 'f'].forEach(v => sampler.sample(v));
      
      expect(sampler.getSample()).toHaveLength(3);
      expect(sampler.getCount()).toBe(6);
    });

    it('should work without seed (using Math.random)', () => {
      const sampler = new ReservoirSampler<number>(3);
      
      [1, 2, 3, 4, 5].forEach(v => sampler.sample(v));
      
      expect(sampler.getSample()).toHaveLength(3);
      expect(sampler.getCount()).toBe(5);
    });
  });
});

describe('OnlineCovariance', () => {
  describe('Mean and Variance Getters', () => {
    it('should provide access to mean values', () => {
      const cov = new OnlineCovariance();
      
      // Update with some paired values
      cov.update(1, 2);
      cov.update(3, 4);
      cov.update(5, 6);
      
      expect(cov.getCount()).toBe(3);
      expect(cov.getMeanX()).toBe(3); // (1+3+5)/3
      expect(cov.getMeanY()).toBe(4); // (2+4+6)/3
    });

    it('should calculate variance correctly', () => {
      const cov = new OnlineCovariance();
      
      // Update with same value for both x and y (as used in bivariate analysis)
      cov.update(10, 10);
      cov.update(20, 20);
      cov.update(30, 30);
      
      expect(cov.getMeanX()).toBe(20);
      expect(cov.getMeanY()).toBe(20);
      expect(cov.getVarianceX()).toBeCloseTo(100, 2); // Sample variance
      expect(cov.getVarianceY()).toBeCloseTo(100, 2);
    });

    it('should handle single value correctly', () => {
      const cov = new OnlineCovariance();
      cov.update(42, 42);
      
      expect(cov.getMeanX()).toBe(42);
      expect(cov.getMeanY()).toBe(42);
      expect(cov.getVarianceX()).toBe(0); // No variance with single value
      expect(cov.getVarianceY()).toBe(0);
    });

    it('should calculate correlation correctly', () => {
      const cov = new OnlineCovariance();
      
      // Perfect positive correlation
      cov.update(1, 2);
      cov.update(2, 4);
      cov.update(3, 6);
      
      expect(cov.getCorrelation()).toBeCloseTo(1.0, 2);
    });

    it('should handle zero variance edge case', () => {
      const cov = new OnlineCovariance();
      
      // Constant values (zero variance)
      cov.update(5, 10);
      cov.update(5, 15);
      cov.update(5, 20);
      
      expect(cov.getVarianceX()).toBe(0);
      expect(cov.getCorrelation()).toBe(0); // Undefined correlation when one variance is zero
    });
  });
});

describe('P2Quantile', () => {
  it('should estimate median correctly', () => {
    const p50 = new P2Quantile(0.5);
    
    // Add values 1 to 100
    for (let i = 1; i <= 100; i++) {
      p50.update(i);
    }
    
    const median = p50.getQuantile();
    expect(median).toBeCloseTo(50, 2); // Should be close to true median
  });

  it('should estimate quartiles correctly', () => {
    const p25 = new P2Quantile(0.25);
    const p75 = new P2Quantile(0.75);
    
    // Add values 1 to 100
    for (let i = 1; i <= 100; i++) {
      p25.update(i);
      p75.update(i);
    }
    
    expect(p25.getQuantile()).toBeCloseTo(25, 2);
    expect(p75.getQuantile()).toBeCloseTo(74, 2); // P2 algorithm approximation
  });

  it('should handle small datasets correctly', () => {
    const p50 = new P2Quantile(0.5);
    
    [1, 2, 3].forEach(v => p50.update(v));
    
    expect(p50.getQuantile()).toBe(2); // Median of [1,2,3] is 2
  });
});

describe('BoundedFrequencyCounter', () => {
  it('should count frequencies correctly', () => {
    const counter = new BoundedFrequencyCounter<string>(100);
    
    counter.update('a');
    counter.update('b');
    counter.update('a');
    counter.update('c');
    counter.update('a');
    
    expect(counter.getCount('a')).toBe(3);
    expect(counter.getCount('b')).toBe(1);
    expect(counter.getCount('c')).toBe(1);
    expect(counter.getTotalCount()).toBe(5);
  });

  it('should return top K frequencies correctly', () => {
    const counter = new BoundedFrequencyCounter<string>(100);
    
    // Add items with different frequencies
    'aaa'.split('').forEach(c => counter.update('a'));
    'bb'.split('').forEach(c => counter.update('b'));
    'c'.split('').forEach(c => counter.update('c'));
    
    const top2 = counter.getTopK(2);
    expect(top2).toHaveLength(2);
    expect(top2[0][0]).toBe('a'); // Most frequent
    expect(top2[0][1]).toBe(3);
    expect(top2[1][0]).toBe('b'); // Second most frequent
    expect(top2[1][1]).toBe(2);
  });

  it('should prune when exceeding max entries', () => {
    const counter = new BoundedFrequencyCounter<number>(5); // Very small limit
    
    // Add more items than the limit
    for (let i = 0; i < 10; i++) {
      counter.update(i);
    }
    
    const frequencies = counter.getFrequencies();
    expect(frequencies.size).toBeLessThanOrEqual(5);
  });

  it('should clear correctly', () => {
    const counter = new BoundedFrequencyCounter<string>(100);
    
    counter.update('test');
    expect(counter.getTotalCount()).toBe(1);
    
    counter.clear();
    expect(counter.getTotalCount()).toBe(0);
    expect(counter.getFrequencies().size).toBe(0);
  });
});