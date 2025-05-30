#!/usr/bin/env node

/**
 * Test Safe Knowledge Base Features
 * Tests file locking and backup functionality
 */

import { KnowledgeBase } from '../src/utils/knowledgeBase.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEST_BASE_PATH = path.join(os.tmpdir(), 'datapilot-test');

async function runTests() {
  console.log('🧪 Testing Safe Knowledge Base Features\n');
  
  // Clean up any existing test data
  if (fs.existsSync(TEST_BASE_PATH)) {
    fs.rmSync(TEST_BASE_PATH, { recursive: true, force: true });
  }
  
  const tests = [
    testBasicFunctionality,
    testConcurrentAccess,
    testBackupCreation,
    testErrorRecovery
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Running: ${test.name}`);
      await test();
      console.log(`✅ ${test.name} PASSED`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} FAILED: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  // Cleanup
  if (fs.existsSync(TEST_BASE_PATH)) {
    fs.rmSync(TEST_BASE_PATH, { recursive: true, force: true });
  }
  
  return failed === 0;
}

async function testBasicFunctionality() {
  const kb = new KnowledgeBase(TEST_BASE_PATH);
  
  // Test loading empty knowledge base
  const knowledge = await kb.load();
  if (!knowledge.warehouse || !knowledge.patterns || !knowledge.relationships) {
    throw new Error('Failed to load empty knowledge base structure');
  }
  
  // Test updating knowledge base
  const testAnalysis = {
    likely_purpose: "Test table",
    quality_score: 85,
    tech_debt_hours: 2,
    domain: "Testing",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "string" }
    ]
  };
  
  await kb.update('test_table', testAnalysis);
  
  // Verify the update
  const updatedKnowledge = await kb.load();
  if (!updatedKnowledge.warehouse.table_registry['test_table']) {
    throw new Error('Failed to update knowledge base');
  }
  
  if (updatedKnowledge.warehouse.warehouse_metadata.discovered_tables !== 1) {
    throw new Error('Table count not updated correctly');
  }
}

async function testConcurrentAccess() {
  const kb1 = new KnowledgeBase(TEST_BASE_PATH);
  const kb2 = new KnowledgeBase(TEST_BASE_PATH);
  
  // Create test data
  const analysis1 = {
    likely_purpose: "Table 1",
    quality_score: 80,
    domain: "Testing"
  };
  
  const analysis2 = {
    likely_purpose: "Table 2", 
    quality_score: 90,
    domain: "Testing"
  };
  
  // Test sequential updates (file locking will make them sequential anyway)
  await kb1.update('concurrent_table_1', analysis1);
  await kb2.update('concurrent_table_2', analysis2);
  
  // Verify both updates succeeded
  const knowledge = await kb1.load();
  if (!knowledge.warehouse.table_registry['concurrent_table_1'] || 
      !knowledge.warehouse.table_registry['concurrent_table_2']) {
    throw new Error('Sequential updates failed');
  }
  
  // Test that file locking prevents corruption by trying rapid updates
  const rapidPromises = [];
  for (let i = 0; i < 5; i++) {
    rapidPromises.push(
      kb1.update(`rapid_table_${i}`, {
        likely_purpose: `Rapid table ${i}`,
        quality_score: 50 + i * 10,
        domain: "Testing"
      })
    );
  }
  
  await Promise.all(rapidPromises);
  
  // Verify all rapid updates succeeded
  const finalKnowledge = await kb1.load();
  const tableCount = Object.keys(finalKnowledge.warehouse.table_registry).length;
  
  if (tableCount < 7) { // 2 + 5 rapid updates
    throw new Error(`Only ${tableCount} tables found, expected at least 7`);
  }
  
  console.log(`   ✅ File locking handled ${tableCount} updates correctly`);
}

async function testBackupCreation() {
  const kb = new KnowledgeBase(TEST_BASE_PATH);
  
  // Create initial data
  await kb.update('backup_test', {
    likely_purpose: "Backup test table",
    quality_score: 75,
    domain: "Testing"
  });
  
  // Make another update to trigger backup
  await kb.update('backup_test_2', {
    likely_purpose: "Second backup test table",
    quality_score: 85,
    domain: "Testing"
  });
  
  // Check if backup files were created
  const warehousePath = path.join(TEST_BASE_PATH, 'warehouse_knowledge.yaml');
  const dir = path.dirname(warehousePath);
  const files = fs.readdirSync(dir);
  
  const backupFiles = files.filter(f => f.startsWith('warehouse_knowledge.yaml.backup-'));
  
  if (backupFiles.length === 0) {
    throw new Error('No backup files created');
  }
  
  console.log(`   📁 Created ${backupFiles.length} backup files`);
}

async function testErrorRecovery() {
  const kb = new KnowledgeBase(TEST_BASE_PATH);
  
  // Create valid data first
  await kb.update('recovery_test', {
    likely_purpose: "Recovery test table",
    quality_score: 70,
    domain: "Testing"
  });
  
  // Try to save invalid data (should fail gracefully)
  try {
    await kb.saveYaml(path.join(TEST_BASE_PATH, 'warehouse_knowledge.yaml'), {
      invalid: undefined,
      data: function() { return 'invalid'; }
    });
    
    // If we get here, the validation didn't work
    throw new Error('Invalid data was saved (validation failed)');
  } catch (error) {
    if (error.message.includes('Invalid YAML content generated')) {
      // This is expected - the validation caught the invalid data
      console.log('   ✅ Invalid data correctly rejected');
    } else {
      throw error;
    }
  }
  
  // Verify the original data is still intact
  const knowledge = await kb.load();
  if (!knowledge.warehouse.table_registry['recovery_test']) {
    throw new Error('Original data was corrupted during error recovery test');
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error.message);
      process.exit(1);
    });
}

export { runTests };