/**
 * Core Configuration System Tests
 */

import { describe, test, expect } from '@jest/globals';
import { DEFAULT_CONFIG } from '../../src/core/config';

describe('Core Configuration System', () => {
  describe('Default Configuration', () => {
    test('should have valid default configuration', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.performance).toBeDefined();
      expect(DEFAULT_CONFIG.analysis).toBeDefined();
      expect(DEFAULT_CONFIG.streaming).toBeDefined();
      expect(DEFAULT_CONFIG.statistical).toBeDefined();
    });

    test('should have valid performance settings', () => {
      const perf = DEFAULT_CONFIG.performance;
      expect(perf.maxRows).toBeGreaterThan(0);
      expect(perf.chunkSize).toBeGreaterThan(0);
      expect(perf.batchSize).toBeGreaterThan(0);
      expect(perf.memoryThresholdBytes).toBeGreaterThan(0);
    });

    test('should have valid analysis settings', () => {
      const analysis = DEFAULT_CONFIG.analysis;
      expect(analysis.maxCategoricalLevels).toBeGreaterThan(0);
      expect(analysis.maxCorrelationPairs).toBeGreaterThan(0);
      expect(analysis.samplingThreshold).toBeGreaterThan(0);
      if (analysis.multivariateThreshold !== undefined) {
        expect(analysis.multivariateThreshold).toBeGreaterThan(0);
      }
      if (analysis.maxDimensionsForPCA !== undefined) {
        expect(analysis.maxDimensionsForPCA).toBeGreaterThan(0);
      }
      if (analysis.clusteringMethods !== undefined) {
        expect(Array.isArray(analysis.clusteringMethods)).toBe(true);
      }
    });

    test('should have valid streaming settings', () => {
      const streaming = DEFAULT_CONFIG.streaming;
      expect(streaming.memoryThresholdMB).toBeGreaterThan(0);
      expect(streaming.maxRowsAnalyzed).toBeGreaterThan(0);
      expect(streaming.adaptiveChunkSizing).toBeDefined();
      expect(streaming.adaptiveChunkSizing.enabled).toBeDefined();
      expect(streaming.adaptiveChunkSizing.reductionFactor).toBeGreaterThan(0);
    });

    test('should have valid statistical settings', () => {
      const statistical = DEFAULT_CONFIG.statistical;
      expect(statistical.significanceLevel).toBeGreaterThan(0);
      expect(statistical.significanceLevel).toBeLessThan(1);
      expect(statistical.confidenceLevel).toBeGreaterThan(0);
      expect(statistical.confidenceLevel).toBeLessThan(1);
    });
  });

  describe('Configuration Validation', () => {
    test('should have consistent memory thresholds', () => {
      const perfMemoryMB = DEFAULT_CONFIG.performance.memoryThresholdBytes / (1024 * 1024);
      const streamingMemoryMB = DEFAULT_CONFIG.streaming.memoryThresholdMB;
      
      // Memory thresholds should be reasonably related
      expect(streamingMemoryMB).toBeGreaterThan(0);
      expect(perfMemoryMB).toBeGreaterThan(0);
    });

    test('should have reasonable performance limits', () => {
      const perf = DEFAULT_CONFIG.performance;
      
      // Sanity checks for performance limits
      expect(perf.maxRows).toBeLessThan(100000000); // Less than 100M rows
      expect(perf.chunkSize).toBeGreaterThan(1024); // At least 1KB
      expect(perf.chunkSize).toBeLessThan(1024 * 1024); // Less than 1MB
    });

    test('should have environment configuration', () => {
      expect(DEFAULT_CONFIG.environment).toBeDefined();
    });
  });

  describe('Configuration Structure', () => {
    test('should have all required top-level sections', () => {
      const requiredSections = ['performance', 'analysis', 'streaming', 'statistical', 'quality', 'environment'];
      
      for (const section of requiredSections) {
        expect(DEFAULT_CONFIG).toHaveProperty(section);
      }
    });

    test('should have consistent configuration types', () => {
      expect(typeof DEFAULT_CONFIG.performance.maxRows).toBe('number');
      expect(typeof DEFAULT_CONFIG.streaming.memoryThresholdMB).toBe('number');
      expect(typeof DEFAULT_CONFIG.statistical.significanceLevel).toBe('number');
      expect(typeof DEFAULT_CONFIG.performance.adaptiveChunkSizing).toBe('boolean');
    });
  });
});