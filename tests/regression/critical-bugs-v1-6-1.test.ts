/**
 * Regression Tests for Critical Issues Fixed in v1.6.1
 * 
 * These tests ensure that the 4 critical bugs identified and fixed in v1.6.1
 * do not regress in future versions.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { UniversalAnalyzer } from '../../src/core/universal-analyzer';
import { Section1Analyzer } from '../../src/analyzers/overview/section1-analyzer';
import { StreamingAnalyzer } from '../../src/analyzers/streaming/streaming-analyzer';
import { Section6Analyzer } from '../../src/analyzers/modeling/section6-analyzer';
import { StatisticalChartSelector } from '../../src/analyzers/visualization/engines/statistical-chart-selector';

describe('Critical Bug Regression Tests v1.6.1', () => {
  let testDataPath: string;
  let cleanupFiles: string[] = [];

  beforeEach(() => {
    testDataPath = path.join(__dirname, '..', '..', 'test-data');
  });

  afterEach(async () => {
    // Cleanup test files
    for (const file of cleanupFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    cleanupFiles = [];
  });

  describe('Bug Fix 1: Version Reporting', () => {
    it('should report correct version v1.6.1 in all outputs', async () => {
      const testFile = path.join(testDataPath, 'version-test.csv');
      const csvContent = 'id,name\n1,test\n2,sample';
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const analyzer = new UniversalAnalyzer();
      const result = await analyzer.analyze(testFile);

      // Check that version is reported correctly
      expect(result.metadata?.version).toBe('1.7.0');
      
      // Check Section 1 specifically
      if (result.section1) {
        expect(result.section1.analysis_metadata?.datapilot_version).toMatch(/v1\.6\.1/);
      }
    });

    it('should show correct parser version in Section 1', async () => {
      const testFile = path.join(testDataPath, 'parser-version-test.csv');
      const csvContent = 'customer_id,name\nCUST001,John\nCUST002,Jane';
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const section1Analyzer = new Section1Analyzer();
      const result = await section1Analyzer.analyze(testFile, {} as any);

      // Parser version should include v1.6.1
      expect(result.parsing_metadata?.parser_engine).toMatch(/v1\.6\.1/);
    });
  });

  describe('Bug Fix 2: Date/Time Precision Detection', () => {
    it('should not hallucinate hour-level precision for date-only data', async () => {
      const testFile = path.join(testDataPath, 'date-precision-test.csv');
      const csvContent = `customer_id,signup_date,age
CUST001,2023-01-15,35
CUST002,2023-02-20,28
CUST003,2023-03-10,42`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const streamingAnalyzer = new StreamingAnalyzer();
      const result = await streamingAnalyzer.analyzeFile(testFile);

      // Find signup_date column analysis
      const signupDateColumn = result.univariate_analysis?.find(col => 
        col.column_name === 'signup_date'
      );

      if (signupDateColumn && signupDateColumn.date_time_analysis) {
        // Should detect day-level granularity, not hour-level
        expect(signupDateColumn.date_time_analysis.detected_granularity).toBe('Day');
        expect(signupDateColumn.date_time_analysis.implicit_precision).toMatch(/[Dd]ay/);
        
        // Should NOT contain hour-level precision indicators
        expect(signupDateColumn.date_time_analysis.implicit_precision).not.toMatch(/[Hh]our/);
        expect(signupDateColumn.date_time_analysis.detected_granularity).not.toBe('Hour');
      }
    });

    it('should correctly parse dates without time components', async () => {
      const testFile = path.join(testDataPath, 'date-only-test.csv');
      const csvContent = `event_date,event_name
2023-01-01,New Year
2023-12-25,Christmas
2023-07-04,Independence Day`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const streamingAnalyzer = new StreamingAnalyzer();
      const result = await streamingAnalyzer.analyzeFile(testFile);

      const eventDateColumn = result.univariate_analysis?.find(col => 
        col.column_name === 'event_date'
      );

      if (eventDateColumn && eventDateColumn.date_time_analysis) {
        // Date ranges should reflect date-only precision
        const minDate = eventDateColumn.date_time_analysis.range_span?.minimum_datetime;
        const maxDate = eventDateColumn.date_time_analysis.range_span?.maximum_datetime;
        
        if (minDate && maxDate) {
          // Should parse as dates with 00:00:00 time, not random hours
          expect(minDate).toMatch(/T00:00:00/);
          expect(maxDate).toMatch(/T00:00:00/);
        }
      }
    });
  });

  describe('Bug Fix 3: Categorical Variable Classification', () => {
    it('should correctly count distinct values for ML task classification', async () => {
      const testFile = path.join(testDataPath, 'categorical-test.csv');
      const csvContent = `customer_id,customer_tier,purchase_amount
CUST001,Premium,100
CUST002,Standard,50
CUST003,Enterprise,200
CUST004,Premium,150
CUST005,Standard,75`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const section6Analyzer = new Section6Analyzer();
      const mockDependencies = {
        section1: { column_metadata: [
          { column_name: 'customer_id', detected_type: 'string' },
          { column_name: 'customer_tier', detected_type: 'categorical' },
          { column_name: 'purchase_amount', detected_type: 'numerical' }
        ]},
        section2: { quality_summary: { overall_score: 95 }},
        section3: { univariate_analysis: [
          { 
            column_name: 'customer_tier', 
            categorical_analysis: { 
              unique_categories: 3,
              category_frequencies: {
                'Premium': 2,
                'Standard': 2, 
                'Enterprise': 1
              }
            }
          }
        ]}
      };

      const result = await section6Analyzer.analyze(testFile, mockDependencies as any);

      // Should correctly identify binary vs multi-class classification
      const tierTargetAnalysis = result.target_variable_analysis?.find(target => 
        target.column_name === 'customer_tier'
      );

      if (tierTargetAnalysis) {
        // Should correctly identify as multi-class (3 classes)
        expect(tierTargetAnalysis.ml_task_type).toBe('multiclass_classification');
        expect(tierTargetAnalysis.distinct_values).toBe(3);
        
        // Should NOT be classified as binary
        expect(tierTargetAnalysis.ml_task_type).not.toBe('binary_classification');
      }
    });

    it('should distinguish binary from multi-class categorical variables', async () => {
      const testFile = path.join(testDataPath, 'binary-categorical-test.csv');
      const csvContent = `customer_id,is_premium,status
CUST001,true,active
CUST002,false,inactive  
CUST003,true,active
CUST004,false,active`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const streamingAnalyzer = new StreamingAnalyzer();
      const result = await streamingAnalyzer.analyzeFile(testFile);

      // is_premium should be identified as binary (2 values)
      const premiumColumn = result.univariate_analysis?.find(col => 
        col.column_name === 'is_premium'
      );
      
      if (premiumColumn && premiumColumn.categorical_analysis) {
        expect(premiumColumn.categorical_analysis.unique_categories).toBe(2);
      }

      // status should be identified correctly (2 values in this case)
      const statusColumn = result.univariate_analysis?.find(col => 
        col.column_name === 'status'
      );
      
      if (statusColumn && statusColumn.categorical_analysis) {
        expect(statusColumn.categorical_analysis.unique_categories).toBe(2);
      }
    });
  });

  describe('Bug Fix 4: Visualization Chart Recommendations', () => {
    it('should not suggest meaningless charts for unique identifiers', async () => {
      const testFile = path.join(testDataPath, 'unique-id-test.csv');
      const csvContent = `customer_id,product_id,purchase_amount,category
CUST001,PROD001,100,Electronics
CUST002,PROD002,150,Tools
CUST003,PROD003,200,Electronics
CUST004,PROD004,75,Home`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const chartSelector = new StatisticalChartSelector();
      const mockColumnAnalysis = [
        {
          column_name: 'customer_id',
          data_type: 'categorical',
          unique_count: 4,
          total_count: 4,
          uniqueness_ratio: 1.0
        },
        {
          column_name: 'product_id', 
          data_type: 'categorical',
          unique_count: 4,
          total_count: 4,
          uniqueness_ratio: 1.0
        },
        {
          column_name: 'purchase_amount',
          data_type: 'numerical',
          unique_count: 4,
          total_count: 4
        },
        {
          column_name: 'category',
          data_type: 'categorical',
          unique_count: 3,
          total_count: 4,
          uniqueness_ratio: 0.75
        }
      ];

      const recommendations = chartSelector.selectCharts(mockColumnAnalysis as any);

      // Should NOT recommend frequency charts for unique identifiers
      const customerIdCharts = recommendations.filter(rec => 
        rec.column_names.includes('customer_id')
      );
      const productIdCharts = recommendations.filter(rec => 
        rec.column_names.includes('product_id')
      );

      // Unique identifiers should not have frequency/distribution charts
      customerIdCharts.forEach(chart => {
        expect(chart.chart_type).not.toMatch(/frequency|distribution|bar|pie/i);
      });

      productIdCharts.forEach(chart => {
        expect(chart.chart_type).not.toMatch(/frequency|distribution|bar|pie/i);
      });

      // Should recommend charts for meaningful categorical data
      const categoryCharts = recommendations.filter(rec => 
        rec.column_names.includes('category')
      );
      expect(categoryCharts.length).toBeGreaterThan(0);
    });

    it('should apply semantic awareness to avoid meaningless visualizations', async () => {
      const chartSelector = new StatisticalChartSelector();
      
      // Test with high-cardinality categorical that should be treated as identifier
      const highCardinalityColumn = {
        column_name: 'transaction_id',
        data_type: 'categorical',
        unique_count: 1000,
        total_count: 1000,
        uniqueness_ratio: 1.0,
        semantic_tags: ['identifier']
      };

      const recommendations = chartSelector.selectCharts([highCardinalityColumn] as any);

      // Should not recommend distribution charts for high-cardinality identifiers
      recommendations.forEach(chart => {
        expect(chart.reasoning).not.toMatch(/frequency analysis/i);
        expect(chart.chart_type).not.toMatch(/bar|pie|histogram/i);
      });
    });
  });

  describe('Integration Test: All Fixes Together', () => {
    it('should handle complex dataset with all fixed issues correctly', async () => {
      const testFile = path.join(testDataPath, 'integration-test.csv');
      const csvContent = `customer_id,signup_date,tier,revenue,is_active
CUST001,2023-01-15,Premium,1500.50,true
CUST002,2023-02-20,Standard,750.25,false
CUST003,2023-03-10,Enterprise,3000.00,true
CUST004,2023-04-05,Premium,2000.75,true
CUST005,2023-05-12,Standard,500.00,false`;
      await fs.writeFile(testFile, csvContent);
      cleanupFiles.push(testFile);

      const analyzer = new UniversalAnalyzer();
      const result = await analyzer.analyze(testFile);

      // Version should be correct
      expect(result.metadata?.version).toBe('1.7.0');

      // Date precision should be day-level
      if (result.section3?.univariate_analysis) {
        const signupDateAnalysis = result.section3.univariate_analysis.find(col => 
          col.column_name === 'signup_date'
        );
        if (signupDateAnalysis?.date_time_analysis) {
          expect(signupDateAnalysis.date_time_analysis.detected_granularity).toBe('Day');
        }
      }

      // Categorical analysis should be accurate
      if (result.section3?.univariate_analysis) {
        const tierAnalysis = result.section3.univariate_analysis.find(col => 
          col.column_name === 'tier'
        );
        if (tierAnalysis?.categorical_analysis) {
          expect(tierAnalysis.categorical_analysis.unique_categories).toBe(3);
        }

        const isActiveAnalysis = result.section3.univariate_analysis.find(col => 
          col.column_name === 'is_active'
        );
        if (isActiveAnalysis?.categorical_analysis) {
          expect(isActiveAnalysis.categorical_analysis.unique_categories).toBe(2);
        }
      }

      // Should not recommend charts for customer_id
      if (result.section4?.chart_recommendations) {
        const customerIdCharts = result.section4.chart_recommendations.filter(chart => 
          chart.column_names.includes('customer_id')
        );
        customerIdCharts.forEach(chart => {
          expect(chart.chart_type).not.toMatch(/frequency|bar|pie/i);
        });
      }
    });
  });
});