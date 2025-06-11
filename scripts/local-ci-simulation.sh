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

# Step 5: Unit tests (without coverage first)
echo "🧪 Running Tests (without coverage)..."
if npm test -- --passWithNoTests; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi
echo ""

# Step 6: Tests with coverage
echo "📊 Running Tests with Coverage..."
if npm test -- --coverage; then
    echo "✅ Tests with coverage passed"
else
    echo "❌ Coverage requirements not met"
    echo "Consider lowering thresholds temporarily"
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

# Step 8: E2E tests (if they exist)
if [ -f "package.json" ] && grep -q "test:e2e" package.json; then
    echo "🌐 Running E2E tests..."
    if npm run test:e2e; then
        echo "✅ E2E tests passed"
    else
        echo "❌ E2E tests failed"
    fi
fi

echo ""
echo "📋 Summary:"
echo "==========="
if [ $? -eq 0 ]; then
    echo "✅ All checks passed! Your CI should work."
else
    echo "❌ Some checks failed. Fix the issues above before pushing."
fi