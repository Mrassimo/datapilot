import { OutputManager } from '../../src/cli/output-manager';

describe('OutputManager', () => {
  let outputManager: OutputManager;

  beforeEach(() => {
    outputManager = new OutputManager({
      output: 'txt',
      verbose: false,
      quiet: false
    });
  });

  describe('Constructor', () => {
    it('should create OutputManager instance with options', () => {
      expect(outputManager).toBeDefined();
      expect(outputManager).toBeInstanceOf(OutputManager);
    });

    it('should handle different output formats', () => {
      const jsonManager = new OutputManager({ output: 'json' });
      const yamlManager = new OutputManager({ output: 'yaml' });
      const mdManager = new OutputManager({ output: 'markdown' });
      
      expect(jsonManager).toBeInstanceOf(OutputManager);
      expect(yamlManager).toBeInstanceOf(OutputManager);
      expect(mdManager).toBeInstanceOf(OutputManager);
    });
  });

  describe('Output Methods', () => {
    it('should have section output methods', () => {
      expect(typeof outputManager.outputSection1).toBe('function');
      expect(typeof outputManager.outputSection2).toBe('function');
      expect(typeof outputManager.outputSection3).toBe('function');
      expect(typeof outputManager.outputSection4).toBe('function');
      expect(typeof outputManager.outputSection5).toBe('function');
      expect(typeof outputManager.outputSection6).toBe('function');
    });

    it('should have combine functionality', () => {
      expect(typeof outputManager.startCombinedOutput).toBe('function');
      expect(typeof outputManager.addToCombinedOutput).toBe('function');
      expect(typeof outputManager.outputCombined).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof outputManager.outputValidation).toBe('function');
      expect(typeof outputManager.outputFileInfo).toBe('function');
      expect(typeof OutputManager.showFormats).toBe('function');
    });
  });

  describe('Basic Functionality', () => {
    it('should have working combine functionality', () => {
      expect(() => {
        outputManager.startCombinedOutput();
      }).not.toThrow();

      expect(() => {
        outputManager.addToCombinedOutput('test content');
      }).not.toThrow();

      expect(() => {
        outputManager.outputCombined('test.csv');
      }).not.toThrow();
    });

    it('should handle validation output', () => {
      expect(() => {
        outputManager.outputValidation('test.csv', true, []);
      }).not.toThrow();

      expect(() => {
        outputManager.outputValidation('test.csv', false, ['Error 1', 'Error 2']);
      }).not.toThrow();
    });

    it('should handle file info output', () => {
      const mockMetadata = {
        originalFilename: 'test.csv',
        fileSizeMB: 1.5,
        encoding: 'utf-8',
        mimeType: 'text/csv'
      };

      expect(() => {
        outputManager.outputFileInfo(mockMetadata);
      }).not.toThrow();
    });
  });

  describe('Options Handling', () => {
    it('should respect output format options', () => {
      const txtManager = new OutputManager({ output: 'txt' });
      const jsonManager = new OutputManager({ output: 'json' });
      
      expect(txtManager).toBeDefined();
      expect(jsonManager).toBeDefined();
    });

    it('should handle quiet and verbose modes', () => {
      const quietManager = new OutputManager({ quiet: true });
      const verboseManager = new OutputManager({ verbose: true });
      
      expect(quietManager).toBeDefined();
      expect(verboseManager).toBeDefined();
    });
  });
});