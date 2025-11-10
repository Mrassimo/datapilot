/**
 * Comprehensive Test: V1 vs V2 across ALL sections
 * Run: npx ts-node test-all-sections-v2.ts
 */

import * as fs from 'fs';
import { Section2Adapter } from './src/analyzers/quality/section2-adapter';
import { Section2FormatterV2 } from './src/analyzers/quality/section2-formatter-v2';
import { Section3Adapter } from './src/analyzers/eda/section3-adapter';
import { Section3FormatterV2 } from './src/analyzers/eda/section3-formatter-v2';
import { Section4Adapter } from './src/analyzers/visualization/section4-adapter';
import { Section4FormatterV2 } from './src/analyzers/visualization/section4-formatter-v2';
import { Section5Adapter } from './src/analyzers/engineering/section5-adapter';
import { Section5FormatterV2 } from './src/analyzers/engineering/section5-formatter-v2';
import { Section6Adapter } from './src/analyzers/modeling/section6-adapter';
import { Section6FormatterV2 } from './src/analyzers/modeling/section6-formatter-v2';

interface TestResult {
  section: string;
  v1_size: number;
  v2_size: number;
  reduction: number;
  v1_lines: number;
  v2_lines: number;
}

async function main() {
  console.log('🔬 COMPREHENSIVE V1 → V2 TESTING\n');
  console.log('Testing AI-ready output across all sections...\n');

  const baseDir = '/tmp/test-datasets';
  const results: TestResult[] = [];

  // Section 2: Quality
  console.log('📊 Section 2: Quality Analysis');
  const s2Result = await testSection2(baseDir);
  if (s2Result) {
    results.push(s2Result);
    printResult(s2Result);
  }

  // Section 3: EDA
  console.log('\n📊 Section 3: EDA (Exploratory Data Analysis)');
  const s3Result = await testSection3(baseDir);
  if (s3Result) {
    results.push(s3Result);
    printResult(s3Result);
  }

  // Section 4: Visualization
  console.log('\n📊 Section 4: Visualization');
  const s4Result = await testSection4(baseDir);
  if (s4Result) {
    results.push(s4Result);
    printResult(s4Result);
  }

  // Section 5: Engineering
  console.log('\n📊 Section 5: Engineering');
  const s5Result = await testSection5(baseDir);
  if (s5Result) {
    results.push(s5Result);
    printResult(s5Result);
  }

  // Section 6: Modeling
  console.log('\n📊 Section 6: Modeling');
  const s6Result = await testSection6(baseDir);
  if (s6Result) {
    results.push(s6Result);
    printResult(s6Result);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📈 OVERALL RESULTS\n');

  const totalV1 = results.reduce((sum, r) => sum + r.v1_size, 0);
  const totalV2 = results.reduce((sum, r) => sum + r.v2_size, 0);
  const totalReduction = ((totalV1 - totalV2) / totalV1) * 100;

  console.log(`Total V1 size: ${formatBytes(totalV1)}`);
  console.log(`Total V2 size: ${formatBytes(totalV2)}`);
  console.log(`\n🎯 TOTAL REDUCTION: ${totalReduction.toFixed(1)}%\n`);

  // Detailed breakdown
  console.log('Section Breakdown:');
  results.forEach((r) => {
    console.log(`  ${r.section.padEnd(20)} ${formatBytes(r.v1_size).padStart(10)} → ${formatBytes(r.v2_size).padStart(10)} (${r.reduction.toFixed(1)}%)`);
  });

  console.log('\n✨ Test complete!\n');
}

async function testSection2(baseDir: string): Promise<TestResult | null> {
  const v1Path = `${baseDir}/coffee_datapilot_quality.json`;

  if (!fs.existsSync(v1Path)) {
    console.log(`  ⏭️  Skipped (file not found)`);
    return null;
  }

  const v1Content = fs.readFileSync(v1Path, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output = v1JSON.qualityAudit || v1JSON;

  const v2Output = Section2Adapter.convertToV2(v1Output);
  const v2Content = Section2FormatterV2.formatJSON(v2Output);

  const v2Path = `${baseDir}/coffee_datapilot_quality_v2.json`;
  fs.writeFileSync(v2Path, v2Content);

  return {
    section: 'Section 2 (Quality)',
    v1_size: v1Content.length,
    v2_size: v2Content.length,
    reduction: ((v1Content.length - v2Content.length) / v1Content.length) * 100,
    v1_lines: v1Content.split('\n').length,
    v2_lines: v2Content.split('\n').length,
  };
}

async function testSection3(baseDir: string): Promise<TestResult | null> {
  const v1Path = `${baseDir}/coffee_datapilot_eda.json`;

  if (!fs.existsSync(v1Path)) {
    console.log(`  ⏭️  Skipped (file not found)`);
    return null;
  }

  const v1Content = fs.readFileSync(v1Path, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output = v1JSON.edaAnalysis || v1JSON;

  const v2Output = Section3Adapter.convertToV2(v1Output);
  const v2Content = Section3FormatterV2.formatJSON(v2Output);

  const v2Path = `${baseDir}/coffee_datapilot_eda_v2.json`;
  fs.writeFileSync(v2Path, v2Content);

  return {
    section: 'Section 3 (EDA)',
    v1_size: v1Content.length,
    v2_size: v2Content.length,
    reduction: ((v1Content.length - v2Content.length) / v1Content.length) * 100,
    v1_lines: v1Content.split('\n').length,
    v2_lines: v2Content.split('\n').length,
  };
}

async function testSection4(baseDir: string): Promise<TestResult | null> {
  const v1Path = `${baseDir}/coffee_datapilot_visualization.json`;

  if (!fs.existsSync(v1Path)) {
    console.log(`  ⏭️  Skipped (file not found)`);
    return null;
  }

  const v1Content = fs.readFileSync(v1Path, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output = v1JSON.visualizationAnalysis || v1JSON;

  const v2Output = Section4Adapter.convertToV2(v1Output);
  const v2Content = Section4FormatterV2.formatJSON(v2Output);

  const v2Path = `${baseDir}/coffee_datapilot_visualization_v2.json`;
  fs.writeFileSync(v2Path, v2Content);

  return {
    section: 'Section 4 (Visualization)',
    v1_size: v1Content.length,
    v2_size: v2Content.length,
    reduction: ((v1Content.length - v2Content.length) / v1Content.length) * 100,
    v1_lines: v1Content.split('\n').length,
    v2_lines: v2Content.split('\n').length,
  };
}

async function testSection5(baseDir: string): Promise<TestResult | null> {
  const v1Path = `${baseDir}/coffee_datapilot_engineering.json`;

  if (!fs.existsSync(v1Path)) {
    console.log(`  ⏭️  Skipped (file not found)`);
    return null;
  }

  const v1Content = fs.readFileSync(v1Path, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output = v1JSON.engineeringAnalysis || v1JSON;

  const v2Output = Section5Adapter.convertToV2(v1Output);
  const v2Content = Section5FormatterV2.formatJSON(v2Output);

  const v2Path = `${baseDir}/coffee_datapilot_engineering_v2.json`;
  fs.writeFileSync(v2Path, v2Content);

  return {
    section: 'Section 5 (Engineering)',
    v1_size: v1Content.length,
    v2_size: v2Content.length,
    reduction: ((v1Content.length - v2Content.length) / v1Content.length) * 100,
    v1_lines: v1Content.split('\n').length,
    v2_lines: v2Content.split('\n').length,
  };
}

async function testSection6(baseDir: string): Promise<TestResult | null> {
  const v1Path = `${baseDir}/coffee_datapilot_modeling.json`;

  if (!fs.existsSync(v1Path)) {
    console.log(`  ⏭️  Skipped (file not found)`);
    return null;
  }

  const v1Content = fs.readFileSync(v1Path, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output = v1JSON.modelingAnalysis || v1JSON;

  const v2Output = Section6Adapter.convertToV2(v1Output);
  const v2Content = Section6FormatterV2.formatJSON(v2Output);

  const v2Path = `${baseDir}/coffee_datapilot_modeling_v2.json`;
  fs.writeFileSync(v2Path, v2Content);

  return {
    section: 'Section 6 (Modeling)',
    v1_size: v1Content.length,
    v2_size: v2Content.length,
    reduction: ((v1Content.length - v2Content.length) / v1Content.length) * 100,
    v1_lines: v1Content.split('\n').length,
    v2_lines: v2Content.split('\n').length,
  };
}

function printResult(result: TestResult) {
  console.log(`  V1: ${formatBytes(result.v1_size)} (${result.v1_lines} lines)`);
  console.log(`  V2: ${formatBytes(result.v2_size)} (${result.v2_lines} lines)`);
  console.log(`  📉 Reduction: ${result.reduction.toFixed(1)}%`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
