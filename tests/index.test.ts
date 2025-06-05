import { VERSION, DATAPILOT_ASCII_ART } from '../src/index';

describe('DataPilot Core', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should export ASCII art', () => {
    expect(DATAPILOT_ASCII_ART).toBeDefined();
    expect(DATAPILOT_ASCII_ART).toContain('╔╦╗');
    expect(DATAPILOT_ASCII_ART.length).toBeGreaterThan(0);
  });
});