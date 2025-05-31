import { UIEngine } from '../../../src/commands/ui/engine.js';
import { ErrorBoundary } from '../../../src/commands/ui/errorBoundary.js';
import { StateMachine } from '../../../src/commands/ui/stateMachine.js';
import { InputValidator } from '../../../src/commands/ui/inputValidator.js';
import { PerformanceMonitor } from '../../../src/commands/ui/performanceMonitor.js';
import blessed from 'blessed';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive unit tests for UI Engine and related components
 */

// Test utilities
class TestScreen {
  constructor() {
    this.rendered = false;
    this.destroyed = false;
    this.keyHandlers = new Map();
    this.children = [];
  }
  
  render() {
    this.rendered = true;
  }
  
  destroy() {
    this.destroyed = true;
  }
  
  key(keys, handler) {
    keys.forEach(key => {
      this.keyHandlers.set(key, handler);
    });
  }
  
  append(child) {
    this.children.push(child);
  }
  
  remove(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
  
  simulateKey(key) {
    const handler = this.keyHandlers.get(key);
    if (handler) {
      handler();
    }
  }
}

// Test suite
export async function runEngineTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test helper
  function test(name, fn) {
    try {
      fn();
      results.passed++;
      results.tests.push({ name, status: 'passed' });
      console.log(`✓ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
      console.error(`✗ ${name}`);
      console.error(`  ${error.message}`);
    }
  }
  
  // Assertion helper
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
  
  function assertDeepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Objects are not equal`);
    }
  }
  
  console.log('\n=== UI Engine Unit Tests ===\n');
  
  // ErrorBoundary Tests
  console.log('\n--- ErrorBoundary Tests ---');
  
  test('ErrorBoundary: should create instance', () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen);
    assert(boundary instanceof ErrorBoundary);
    assertEqual(boundary.maxRetries, 3);
  });
  
  test('ErrorBoundary: should wrap function', () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen);
    let called = false;
    
    const wrapped = boundary.wrap(() => {
      called = true;
      return 'result';
    });
    
    const result = wrapped();
    assert(called);
    assertEqual(result, 'result');
  });
  
  test('ErrorBoundary: should catch errors', async () => {
    const screen = new TestScreen();
    let errorHandled = false;
    
    const boundary = new ErrorBoundary(screen, {
      onError: () => {
        errorHandled = true;
      }
    });
    
    const wrapped = boundary.wrap(() => {
      throw new Error('Test error');
    });
    
    await wrapped();
    assert(errorHandled);
  });
  
  test('ErrorBoundary: should retry retryable errors', async () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen, { retryDelay: 10 });
    let attempts = 0;
    
    const wrapped = boundary.wrap(() => {
      attempts++;
      if (attempts < 2) {
        const error = new Error('Retryable error');
        error.retryable = true;
        throw error;
      }
      return 'success';
    });
    
    const result = await wrapped();
    assertEqual(attempts, 2);
    assertEqual(result, 'success');
  });
  
  test('ErrorBoundary: should log errors', () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen);
    
    boundary.logError(new Error('Test error'), 'TestComponent');
    assertEqual(boundary.errorLog.length, 1);
    assertEqual(boundary.errorLog[0].message, 'Test error');
    assertEqual(boundary.errorLog[0].component, 'TestComponent');
  });
  
  test('ErrorBoundary: should get error statistics', () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen);
    
    boundary.logError(new Error('Error 1'), 'Component1');
    boundary.logError(new Error('Error 2'), 'Component1');
    boundary.logError(new Error('Error 3'), 'Component2');
    
    const stats = boundary.getErrorStats();
    assertEqual(stats.total, 3);
    assertEqual(stats.byComponent.Component1, 2);
    assertEqual(stats.byComponent.Component2, 1);
  });
  
  // StateMachine Tests
  console.log('\n--- StateMachine Tests ---');
  
  test('StateMachine: should create instance', () => {
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {}
      },
      transitions: {
        idle: {
          START: 'active'
        },
        active: {
          STOP: 'idle'
        }
      }
    });
    
    assert(machine instanceof StateMachine);
    assertEqual(machine.getState(), 'idle');
  });
  
  test('StateMachine: should validate configuration', () => {
    try {
      new StateMachine({
        initial: 'invalid',
        states: { idle: {} }
      });
      assert(false, 'Should have thrown error');
    } catch (error) {
      assert(error.message.includes('Initial state'));
    }
  });
  
  test('StateMachine: should transition states', async () => {
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {}
      },
      transitions: {
        idle: {
          START: 'active'
        },
        active: {
          STOP: 'idle'
        }
      }
    });
    
    assertEqual(machine.getState(), 'idle');
    await machine.send('START');
    assertEqual(machine.getState(), 'active');
    await machine.send('STOP');
    assertEqual(machine.getState(), 'idle');
  });
  
  test('StateMachine: should execute actions', async () => {
    let actionCalled = false;
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {
          onEntry: ['testAction']
        }
      },
      transitions: {
        idle: {
          START: 'active'
        }
      }
    });
    
    machine.registerAction('testAction', () => {
      actionCalled = true;
    });
    
    await machine.send('START');
    assert(actionCalled);
  });
  
  test('StateMachine: should check guards', async () => {
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {}
      },
      transitions: {
        idle: {
          START: {
            target: 'active',
            guard: 'canStart'
          }
        }
      }
    });
    
    machine.registerGuard('canStart', () => false);
    
    const result = await machine.send('START');
    assert(!result);
    assertEqual(machine.getState(), 'idle');
  });
  
  test('StateMachine: should maintain history', async () => {
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {}
      },
      transitions: {
        idle: {
          START: 'active'
        }
      }
    });
    
    await machine.send('START');
    const history = machine.getHistory();
    assertEqual(history.length, 1);
    assertEqual(history[0].from, 'idle');
    assertEqual(history[0].to, 'active');
    assertEqual(history[0].event, 'START');
  });
  
  test('StateMachine: should notify subscribers', async () => {
    let notified = false;
    let eventData = null;
    
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        active: {}
      },
      transitions: {
        idle: {
          START: 'active'
        }
      }
    });
    
    machine.subscribe((event) => {
      notified = true;
      eventData = event;
    });
    
    await machine.send('START');
    assert(notified);
    assertEqual(eventData.type, 'transition');
    assertEqual(eventData.from, 'idle');
    assertEqual(eventData.to, 'active');
  });
  
  // InputValidator Tests
  console.log('\n--- InputValidator Tests ---');
  
  test('InputValidator: should create instance', () => {
    const validator = new InputValidator();
    assert(validator instanceof InputValidator);
  });
  
  test('InputValidator: should validate required fields', () => {
    const validator = new InputValidator();
    
    let result = validator.validate('', 'required');
    assert(!result.valid);
    assertEqual(result.errors.length, 1);
    
    result = validator.validate('value', 'required');
    assert(result.valid);
    assertEqual(result.errors.length, 0);
  });
  
  test('InputValidator: should validate string length', () => {
    const validator = new InputValidator();
    
    let result = validator.validate('ab', { type: 'minLength', min: 3 });
    assert(!result.valid);
    
    result = validator.validate('abc', { type: 'minLength', min: 3 });
    assert(result.valid);
    
    result = validator.validate('abcdef', { type: 'maxLength', max: 5 });
    assert(!result.valid);
    
    result = validator.validate('abcde', { type: 'maxLength', max: 5 });
    assert(result.valid);
  });
  
  test('InputValidator: should validate patterns', () => {
    const validator = new InputValidator();
    
    let result = validator.validate('test', {
      type: 'pattern',
      regex: /^[0-9]+$/
    });
    assert(!result.valid);
    
    result = validator.validate('123', {
      type: 'pattern',
      regex: /^[0-9]+$/
    });
    assert(result.valid);
  });
  
  test('InputValidator: should validate email', () => {
    const validator = new InputValidator();
    
    let result = validator.validate('invalid', 'email');
    assert(!result.valid);
    
    result = validator.validate('test@example.com', 'email');
    assert(result.valid);
  });
  
  test('InputValidator: should validate numeric values', () => {
    const validator = new InputValidator();
    
    let result = validator.validate('abc', 'numeric');
    assert(!result.valid);
    
    result = validator.validate('123.45', 'numeric');
    assert(result.valid);
    
    result = validator.validate('123.45', 'integer');
    assert(!result.valid);
    
    result = validator.validate('123', 'integer');
    assert(result.valid);
  });
  
  test('InputValidator: should sanitize input', () => {
    const validator = new InputValidator();
    
    assertEqual(validator.sanitize('  test  ', 'trim'), 'test');
    assertEqual(validator.sanitize('TEST', 'lowercase'), 'test');
    assertEqual(validator.sanitize('test', 'uppercase'), 'TEST');
    assertEqual(validator.sanitize('a  b  c', 'normalizeWhitespace'), 'a b c');
  });
  
  test('InputValidator: should validate forms', () => {
    const validator = new InputValidator();
    
    const result = validator.validateForm(
      {
        name: '  John  ',
        email: 'JOHN@EXAMPLE.COM',
        age: '25'
      },
      {
        name: {
          sanitize: 'trim',
          validate: 'required'
        },
        email: {
          sanitize: ['trim', 'lowercase'],
          validate: ['required', 'email']
        },
        age: {
          validate: ['required', 'integer']
        }
      }
    );
    
    assert(result.valid);
    assertEqual(result.data.name, 'John');
    assertEqual(result.data.email, 'john@example.com');
    assertEqual(result.data.age, '25');
  });
  
  // PerformanceMonitor Tests
  console.log('\n--- PerformanceMonitor Tests ---');
  
  test('PerformanceMonitor: should create instance', () => {
    const monitor = new PerformanceMonitor();
    assert(monitor instanceof PerformanceMonitor);
    assert(monitor.enabled);
  });
  
  test('PerformanceMonitor: should mark and measure operations', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.mark('test-operation');
    // Simulate some work
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    const duration = monitor.measure('test-operation');
    
    assert(typeof duration === 'number');
    assert(duration > 0);
  });
  
  test('PerformanceMonitor: should record metrics', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.recordRender(16.5);
    monitor.recordInputLag(50);
    
    const summary = monitor.getSummary();
    assert(summary.renders);
    assertEqual(summary.renders.count, 1);
    assertEqual(summary.renders.avg, 16.5);
    
    assert(summary.inputs);
    assertEqual(summary.inputs.count, 1);
    assertEqual(summary.inputs.avg, 50);
  });
  
  test('PerformanceMonitor: should track violations', () => {
    const monitor = new PerformanceMonitor({
      thresholds: {
        renderTime: 16,
        inputLag: 100
      }
    });
    
    monitor.recordRender(20); // Violation
    monitor.recordInputLag(50); // No violation
    
    assertEqual(monitor.violations.length, 1);
    assertEqual(monitor.violations[0].category, 'renders');
    assertEqual(monitor.violations[0].value, 20);
  });
  
  test('PerformanceMonitor: should record errors', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.recordError(new Error('Test error'), 'test-context');
    
    const summary = monitor.getSummary();
    assertEqual(summary.errors, 1);
    assertEqual(monitor.metrics.errors[0].error, 'Test error');
    assertEqual(monitor.metrics.errors[0].context, 'test-context');
  });
  
  test('PerformanceMonitor: should export metrics', () => {
    const monitor = new PerformanceMonitor();
    
    monitor.recordRender(16);
    monitor.recordInputLag(50);
    
    const exported = monitor.exportMetrics();
    assert(exported.summary);
    assert(exported.metrics);
    assert(exported.timestamp);
  });
  
  test('PerformanceMonitor: should format bytes correctly', () => {
    const monitor = new PerformanceMonitor();
    
    assertEqual(monitor.formatBytes(0), '0 B');
    assertEqual(monitor.formatBytes(1024), '1 KB');
    assertEqual(monitor.formatBytes(1048576), '1 MB');
    assertEqual(monitor.formatBytes(1073741824), '1 GB');
  });
  
  // Integration Tests
  console.log('\n--- Integration Tests ---');
  
  test('ErrorBoundary + StateMachine integration', async () => {
    const screen = new TestScreen();
    const boundary = new ErrorBoundary(screen);
    const machine = new StateMachine({
      initial: 'idle',
      states: {
        idle: {},
        error: {}
      },
      transitions: {
        idle: {
          ERROR: 'error'
        }
      }
    });
    
    // Wrap state machine send method
    const wrappedSend = boundary.wrap(machine.send, machine, 'StateMachine.send');
    
    // This should work
    await wrappedSend('ERROR');
    assertEqual(machine.getState(), 'error');
    
    // This should be caught by error boundary
    await wrappedSend('INVALID_EVENT');
    assertEqual(boundary.errorLog.length, 0); // No error because it returns false
  });
  
  test('InputValidator + Form integration', () => {
    const validator = new InputValidator();
    
    // Create file validator
    const fileRules = validator.createFileValidator({
      required: true,
      extensions: ['csv', 'txt'],
      maxSize: 1024 * 1024 // 1MB
    });
    
    // Validate non-existent file
    let result = validator.validate('/path/to/nonexistent.csv', fileRules);
    assert(!result.valid);
    
    // Create temp file for testing
    const tempFile = path.join(__dirname, 'test.csv');
    fs.writeFileSync(tempFile, 'test,data\n1,2');
    
    try {
      // Validate existing CSV file
      result = validator.validate(tempFile, fileRules);
      assert(result.valid);
      
      // Validate wrong extension
      const wrongFile = path.join(__dirname, 'test.json');
      fs.writeFileSync(wrongFile, '{}');
      
      result = validator.validate(wrongFile, fileRules);
      assert(!result.valid);
      
      fs.unlinkSync(wrongFile);
    } finally {
      // Clean up
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
  
  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Total: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  return results;
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  runEngineTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}