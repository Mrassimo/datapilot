#!/bin/bash

echo "🔍 Local CI Simulation"
echo "====================="

# Simulate GitHub Actions environment
export CI=true
export NODE_ENV=test

# Step 1: Version check
echo "📌 Environment Check:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "TypeScript version: $(npx tsc --version)"
echo ""

# Step 2: Clean install (like CI does)
echo "📦 Clean Install (simulating CI)..."
rm -rf node_modules
npm ci
echo ""

# Step 3: TypeScript compilation
echo "🔨 TypeScript Compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "Fix these errors before proceeding!"
    exit 1
fi
echo ""

# Step 4: Linting
echo "📝 Running ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    echo "Run 'npm run lint:fix' to auto-fix"
fi
echo ""

# Step 5: Unit tests (CI job: test)
echo "🧪 Running Unit Tests..."
if npm run test:unit; then
    echo "✅ Unit tests passed"
else
    echo "❌ Unit tests failed"
    exit 1
fi
echo ""

# Step 6: Unit tests with coverage (CI job: test)
echo "📊 Running Unit Tests with Coverage..."
if npm run test:coverage; then
    echo "✅ Unit tests with coverage passed"
else
    echo "❌ Coverage requirements not met"
    echo "This will cause CI to fail!"
fi
echo ""

# Step 7: Build
echo "🏗️  Building project..."
if npm run build; then
    echo "✅ Build successful"
    echo "Output in: ./dist"
else
    echo "❌ Build failed"
fi
echo ""

# Step 8: Integration tests (CI job: integration-test)
echo "🔗 Running Integration tests..."
if npm run test:integration; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed - will cause CI to fail!"
fi
echo ""

# Step 9: E2E tests (CI job: e2e-test)
echo "🌐 Running E2E tests..."
if npm run test:e2e; then
    echo "✅ E2E tests passed"
else
    echo "❌ E2E tests failed - will cause CI to fail!"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo "✅ Core checks completed!"
echo "⚠️  Any failed integration/e2e tests above will cause CI to fail."
echo "💡 Fix failing tests before pushing to ensure CI success."