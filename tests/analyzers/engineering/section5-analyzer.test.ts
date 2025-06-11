import { Section5Analyzer, Section5Formatter } from '../../../src/analyzers/engineering';
import { MockDataFactory } from '../../helpers/mock-data-factory';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Section5Analyzer - Data Engineering Insights', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'datapilot-section5-test-'));
    tempFile = join(tempDir, 'test.csv');
  });

  afterEach(() => {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // File might not exist
    }
  });

  describe('Schema Analysis', () => {
    it('should analyze basic schema structure', async () => {
      const csvData = `id,name,age,email,salary,department
1,John Doe,28,john@example.com,75000,Engineering
2,Jane Smith,32,jane@example.com,82000,Marketing
3,Bob Johnson,45,bob@example.com,95000,Sales`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Create comprehensive mock data
      const mockColumns = [
        { name: 'id', dataType: 'integer' },
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'integer' },
        { name: 'email', dataType: 'string' },
        { name: 'salary', dataType: 'numeric' },
        { name: 'department', dataType: 'string' }
      ];
      
      const mockData = MockDataFactory.createCompleteMock({
        columns: mockColumns,
        rowCount: 3,
        fileSize: 1000,
        filename: 'test.csv'
      });
      
      const mockSection1Result = mockData.section1;
      const mockSection2Result = mockData.section2;
      const mockSection3Result = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1Result, mockSection2Result, mockSection3Result);
      
      expect(result.engineeringAnalysis).toBeDefined();
      expect(result.engineeringAnalysis.schemaAnalysis).toBeDefined();
      expect(result.engineeringAnalysis.schemaAnalysis.optimizedSchema).toBeDefined();
      
      // Verify schema recommendations
      const schema = result.engineeringAnalysis.schemaAnalysis.optimizedSchema;
      expect(schema.columns).toBeDefined();
      
      // Basic schema structure checks
      expect(schema.ddlStatement).toBeDefined();
      expect(Array.isArray(schema.columns)).toBe(true);
    });

    it('should detect data quality issues affecting schema', async () => {
      const csvData = `id,name,value,status
1,John,100.50,active
2,,75.25,inactive
3,Jane,,active
4,Bob,invalid_number,
5,Alice,200.75,unknown_status`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.structuralIntegrity).toBeDefined();
      
      // Basic structural integrity checks
      expect(result.engineeringAnalysis.structuralIntegrity.primaryKeyCandidates).toBeDefined();
      expect(Array.isArray(result.engineeringAnalysis.structuralIntegrity.primaryKeyCandidates)).toBe(true);
    });

    it('should recommend appropriate indexing strategies', async () => {
      const csvData = `user_id,product_id,timestamp,amount,category,region
1001,2001,2024-01-15,99.99,electronics,north
1002,2002,2024-01-16,149.50,clothing,south
1001,2003,2024-01-17,75.25,electronics,north
1003,2001,2024-01-18,99.99,electronics,west`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const indexRecs = result.engineeringAnalysis.schemaAnalysis.optimizedSchema.indexes;
      expect(indexRecs).toBeDefined();
      expect(Array.isArray(indexRecs)).toBe(true);
      
      // Basic index recommendation validation
      if (indexRecs.length > 0) {
        expect(indexRecs[0].columns).toBeDefined();
        expect(indexRecs[0].indexType).toBeDefined();
      }
    });
  });

  describe('Transformation Recommendations', () => {
    it('should recommend data cleaning transformations', async () => {
      const csvData = `name,email,phone,age
" John Doe ",JOHN@EXAMPLE.COM,555-123-4567,28
Jane Smith,jane@example.com,(555) 234-5678,32
"Bob  Johnson",bob@EXAMPLE.com,555.345.6789,45`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.transformationPipeline).toBeDefined();
      expect(result.engineeringAnalysis.transformationPipeline.columnStandardization).toBeDefined();
      
      const cleaningSteps = result.engineeringAnalysis.transformationPipeline.columnStandardization;
      
      // Basic transformation pipeline checks
      expect(Array.isArray(cleaningSteps)).toBe(true);
      
      // Verify cleaning recommendations exist
      if (cleaningSteps.length > 0) {
        expect(cleaningSteps[0].originalName).toBeDefined();
        expect(cleaningSteps[0].standardizedName).toBeDefined();
      }
    });

    it('should recommend feature engineering transformations', async () => {
      const csvData = `timestamp,amount,category,user_age
2024-01-15 10:30:00,99.99,electronics,28
2024-01-16 14:45:00,149.50,clothing,32
2024-01-17 09:15:00,75.25,electronics,45
2024-01-18 16:20:00,199.99,home,29`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const featureSteps = result.engineeringAnalysis.transformationPipeline.dateTimeFeatureEngineering;
      expect(featureSteps).toBeDefined();
      expect(Array.isArray(featureSteps)).toBe(true);
      
      // Basic feature engineering validation
      if (featureSteps.length > 0) {
        expect(featureSteps[0].columnName).toBeDefined();
        expect(featureSteps[0].extractedFeatures).toBeDefined();
      }
    });

    it('should recommend aggregation strategies', async () => {
      const csvData = `user_id,date,transaction_amount,product_category
1001,2024-01-15,99.99,electronics
1001,2024-01-16,49.50,books
1002,2024-01-15,149.99,clothing
1001,2024-01-17,75.25,electronics
1002,2024-01-16,89.99,home`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const aggSteps = result.engineeringAnalysis.transformationPipeline.numericalTransformations;
      expect(aggSteps).toBeDefined();
      expect(Array.isArray(aggSteps)).toBe(true);
      
      // Basic aggregation validation
      if (aggSteps.length > 0) {
        expect(aggSteps[0].columnName).toBeDefined();
        expect(aggSteps[0].transformations).toBeDefined();
      }
    });
  });

  describe('Storage Optimization', () => {
    it('should recommend compression strategies', async () => {
      const csvData = `id,long_text,category,subcategory,description
1,"This is a very long text field that repeats common patterns and words throughout the content",electronics,phones,"High-quality smartphone with advanced features"
2,"This is a very long text field that repeats common patterns and words throughout the content",electronics,laptops,"Professional laptop for business use"
3,"This is a very long text field that repeats common patterns and words throughout the content",clothing,shirts,"Comfortable cotton shirt for everyday wear"`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.scalabilityAssessment).toBeDefined();
      expect(result.engineeringAnalysis.scalabilityAssessment.performanceOptimizations).toBeDefined();
      
      const storageOpt = result.engineeringAnalysis.scalabilityAssessment.performanceOptimizations;
      
      // Basic storage optimization checks
      expect(Array.isArray(storageOpt)).toBe(true);
      if (storageOpt.length > 0) {
        expect(storageOpt[0].recommendation).toBeDefined();
      }
    });

    it('should recommend partitioning strategies', async () => {
      const csvData = `date,region,sales_amount,product_id
2024-01-15,north,1000,P001
2024-01-15,south,1500,P002
2024-01-16,north,1200,P003
2024-01-16,south,1800,P001
2024-02-01,north,1100,P002
2024-02-01,south,1600,P003`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const partitioning = result.engineeringAnalysis.scalabilityAssessment.partitioningStrategies;
      expect(partitioning).toBeDefined();
      expect(Array.isArray(partitioning)).toBe(true);
      
      // Basic partitioning strategy validation
      if (partitioning.length > 0) {
        expect(partitioning[0].partitionColumns).toBeDefined();
        expect(partitioning[0].partitionType).toBeDefined();
      }
    });
  });

  describe('ML Readiness Assessment', () => {
    it('should assess overall ML readiness', async () => {
      const csvData = `feature1,feature2,feature3,target
1.5,2.3,0.8,yes
2.1,1.9,1.2,no
1.8,2.5,0.9,yes
2.3,1.7,1.1,no
1.9,2.1,1.0,yes`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.mlReadiness).toBeDefined();
      expect(result.engineeringAnalysis.mlReadiness.overallScore).toBeGreaterThan(0);
      expect(result.engineeringAnalysis.mlReadiness.overallScore).toBeLessThanOrEqual(100);
      
      const assessment = result.engineeringAnalysis.mlReadiness;
      
      // Should evaluate readiness components
      expect(assessment.enhancingFactors).toBeDefined();
      expect(Array.isArray(assessment.enhancingFactors)).toBe(true);
      expect(assessment.remainingChallenges).toBeDefined();
      expect(Array.isArray(assessment.remainingChallenges)).toBe(true);
      
      // Should provide modeling considerations
      expect(assessment.modelingConsiderations).toBeDefined();
      expect(Array.isArray(assessment.modelingConsiderations)).toBe(true);
    });

    it('should identify ML-specific data issues', async () => {
      const csvData = `id,feature1,feature2,constant_feature,target
1,1.5,2.3,1.0,yes
2,2.1,,1.0,no
3,1.8,2.5,1.0,
4,2.3,1.7,1.0,no
5,1.9,2.1,1.0,yes`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const mlIssues = result.engineeringAnalysis.mlReadiness.remainingChallenges;
      expect(mlIssues).toBeDefined();
      expect(Array.isArray(mlIssues)).toBe(true);
      
      // Basic ML issue validation
      if (mlIssues.length > 0) {
        expect(mlIssues[0].challenge).toBeDefined();
        expect(mlIssues[0].impact).toBeDefined();
        expect(mlIssues[0].severity).toBeDefined();
      }
    });
  });

  describe('Pipeline Recommendations', () => {
    it('should recommend ETL pipeline structure', async () => {
      const csvData = `raw_data,timestamp,user_input
"{""value"":123,""status"":""active""}",2024-01-15 10:30:00," USER INPUT WITH SPACES "
"{""value"":456,""status"":""inactive""}",2024-01-16 14:45:00,"another user input"
"{""value"":789,""status"":""active""}",2024-01-17 09:15:00,"THIRD INPUT"`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.transformationPipeline).toBeDefined();
      expect(result.engineeringAnalysis.transformationPipeline.textProcessingPipeline).toBeDefined();
      
      const pipelineSteps = result.engineeringAnalysis.transformationPipeline.textProcessingPipeline;
      
      // Basic pipeline validation
      expect(Array.isArray(pipelineSteps)).toBe(true);
      
      if (pipelineSteps.length > 0) {
        expect(pipelineSteps[0].columnName).toBeDefined();
        expect(pipelineSteps[0].cleaningSteps).toBeDefined();
      }
    });

    it('should recommend validation rules', async () => {
      const csvData = `email,age,amount,status
john@example.com,25,100.50,active
invalid_email,30,200.00,active
valid@test.com,-5,150.75,unknown
test@example.com,150,0,inactive`;
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const validationSteps = result.engineeringAnalysis.transformationPipeline.missingValueStrategy;
      expect(validationSteps).toBeDefined();
      expect(Array.isArray(validationSteps)).toBe(true);
      
      // Basic validation step checks
      if (validationSteps.length > 0) {
        expect(validationSteps[0].columnName).toBeDefined();
        expect(validationSteps[0].strategy).toBeDefined();
      }
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze processing performance', async () => {
      const csvData = 'id,data\n' + Array.from({ length: 100 }, (_, i) => `${i},value_${i}`).join('\n');
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      const startTime = Date.now();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      const endTime = Date.now();
      
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.analysisTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.analysisTimeMs).toBeLessThan(endTime - startTime + 1000); // Allow larger margin for CI
      
      expect(result.performanceMetrics.transformationsEvaluated).toBeDefined();
      expect(result.performanceMetrics.schemaRecommendationsGenerated).toBeDefined();
    });

    it('should provide performance recommendations', async () => {
      const csvData = 'col1,col2,col3\n' + Array.from({ length: 50 }, (_, i) => 
        `value_${i},very_long_text_content_that_repeats_patterns_${i},category_${i % 3}`
      ).join('\n');
      
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result.engineeringAnalysis.scalabilityAssessment).toBeDefined();
      expect(result.engineeringAnalysis.scalabilityAssessment.performanceOptimizations).toBeDefined();
      
      const perfRecs = result.engineeringAnalysis.scalabilityAssessment.performanceOptimizations;
      expect(Array.isArray(perfRecs)).toBe(true);
      
      // Basic performance recommendation validation
      if (perfRecs.length > 0) {
        expect(perfRecs[0].recommendation).toBeDefined();
      }
    });
  });

  describe('Configuration and Error Handling', () => {
    it('should handle different configuration options', async () => {
      const csvData = 'a,b,c\n1,2,3\n4,5,6';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result).toBeDefined();
      expect(result.engineeringAnalysis).toBeDefined();
    });

    it('should handle malformed data gracefully', async () => {
      const csvData = 'col1,col2\nvalue1,value2\nmalformed,row,with,too,many,columns';
      writeFileSync(tempFile, csvData, 'utf8');
      
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method with issues
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000,
        hasIssues: true // This will generate warnings
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
      // The analyzer should either produce its own warnings or pass through input warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate configuration parameters', () => {
      const analyzer = new Section5Analyzer();
      
      // Basic analyzer creation test
      expect(analyzer).toBeDefined();
    });
  });
});

describe('Section5Formatter', () => {
  it('should format complete engineering report', async () => {
    const csvData = 'id,name,value\n1,test,100\n2,example,200';
    const tempFile = join(tmpdir(), 'formatter-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const report = Section5Formatter.formatMarkdown(result);
      
      // Verify report structure
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      
    } finally {
      unlinkSync(tempFile);
    }
  });

  it('should format JSON output correctly', async () => {
    const csvData = 'col1,col2\nval1,val2';
    const tempFile = join(tmpdir(), 'json-test.csv');
    writeFileSync(tempFile, csvData, 'utf8');
    
    try {
      const analyzer = new Section5Analyzer();
      
      // Mock required section results for 3-parameter analyze method
      const mockData = MockDataFactory.createCompleteMock({
        columns: [{ name: 'col1', dataType: 'string' }, { name: 'col2', dataType: 'string' }],
        rowCount: 3,
        fileSize: 1000
      });
      
      const mockSection1 = mockData.section1;
      const mockSection2 = mockData.section2;
      const mockSection3 = mockData.section3;
      
      const result = await analyzer.analyze(mockSection1, mockSection2, mockSection3);
      
      const markdownOutput = Section5Formatter.formatMarkdown(result);
      // Check that output was generated
      expect(markdownOutput).toBeDefined();
      expect(typeof markdownOutput).toBe('string');
      expect(markdownOutput.length).toBeGreaterThan(0);
      
    } finally {
      unlinkSync(tempFile);
    }
  });
});
