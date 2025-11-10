/**
 * Test script: Compare V1 (bloated) vs V2 (lean) output
 * Run: npx ts-node test-v2-output.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Section2Adapter } from './src/analyzers/quality/section2-adapter';
import { Section2FormatterV2 } from './src/analyzers/quality/section2-formatter-v2';
import type { Section2QualityAudit } from './src/analyzers/quality/types';

async function main() {
  console.log('🔬 Testing AI-Ready Output (V2) vs Legacy Output (V1)\n');

  // Read the coffee dataset V1 output
  const v1FilePath = '/tmp/test-datasets/coffee_datapilot_quality.json';

  if (!fs.existsSync(v1FilePath)) {
    console.error(`❌ V1 output not found at: ${v1FilePath}`);
    console.log('💡 Run this first: cd /tmp/test-datasets && node /home/user/datapilot/dist/cli/index.js all coffee.csv');
    process.exit(1);
  }

  console.log('📖 Reading V1 output...');
  const v1Content = fs.readFileSync(v1FilePath, 'utf-8');
  const v1JSON = JSON.parse(v1Content);
  const v1Output: Section2QualityAudit = v1JSON.qualityAudit || v1JSON; // Handle both wrapped and unwrapped

  console.log(`   V1 file size: ${formatBytes(v1Content.length)}`);
  console.log(`   V1 lines: ${v1Content.split('\n').length}`);

  // Convert to V2
  console.log('\n🔄 Converting to V2 (lean) format...');
  const v2Output = Section2Adapter.convertToV2(v1Output);
  const v2Content = Section2FormatterV2.formatJSON(v2Output);

  console.log(`   V2 file size: ${formatBytes(v2Content.length)}`);
  console.log(`   V2 lines: ${v2Content.split('\n').length}`);

  // Calculate reduction
  const reduction = ((v1Content.length - v2Content.length) / v1Content.length) * 100;
  console.log(`   📉 Size reduction: ${reduction.toFixed(1)}%`);

  // Save V2 output
  const v2FilePath = '/tmp/test-datasets/coffee_datapilot_quality_v2.json';
  fs.writeFileSync(v2FilePath, v2Content);
  console.log(`\n💾 V2 output saved to: ${v2FilePath}`);

  // Show summary
  console.log('\n📊 Quality Summary (V2):');
  const summary = Section2FormatterV2.getSummaryLine(v2Output);
  console.log(`   ${summary}`);

  // Show sample of bloat removed
  console.log('\n✂️  Examples of Bloat Removed:');
  console.log('   ❌ "interpretation": "Good"');
  console.log('   ❌ "details": "93.15% of cells contain data"');
  console.log('   ❌ "description": "accuracy quality needs attention"');
  console.log('   ❌ "severity": "critical"');
  console.log('   ❌ "estimatedEffort": "8-16 hours"');
  console.log('   ❌ "rationale": "Low percentage of missing..."');

  console.log('\n✅ What Remains (Facts Only):');
  console.log('   ✓ quality_scores.completeness: 0.9127');
  console.log('   ✓ quality_scores.accuracy: 0.36');
  console.log('   ✓ missing_data.total_cells_missing: 3951');
  console.log('   ✓ violations.rule_violations: 1673');

  console.log('\n🤖 AI Interpretation Example:');
  console.log('   Input: quality_scores.accuracy = 0.36');
  console.log('   Claude: "Your accuracy score of 0.36 is LOW. You have 1,673');
  console.log('           rule violations across the dataset. Focus on cleaning');
  console.log('           the Altitude column which has mixed units and URLs."');

  console.log('\n✨ Test complete!\n');
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
