#!/bin/bash

echo "🔧 Starting CI/CD simulation process..."

# Exit on any error
set -e

# Step 1: Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
if ! npx tsc --noEmit; then
    echo "❌ TypeScript compilation failed. Please fix the errors above."
    exit 1
fi
echo "✅ TypeScript compilation successful"

# Step 2: Build the project
echo "🏗️  Building project..."
if ! npm run build; then
    echo "❌ Build failed."
    exit 1
fi
echo "✅ Build successful"

# Step 3: Run linting
echo "🎨 Running ESLint..."
if ! npm run lint; then
    echo "⚠️  Linting issues found. Run 'npm run lint:fix' to auto-fix."
    # Don't exit on lint warnings, just report them
fi

# Step 4: Run unit tests (CI job: test)
echo "🧪 Running unit tests..."
if ! npm run test:unit; then
    echo "❌ Unit tests failed. Check the output above."
    exit 1
fi
echo "✅ Unit tests passed"

# Step 5: Run unit tests with coverage (CI job: test)
echo "📊 Running unit tests with coverage..."
if ! npm run test:coverage; then
    echo "⚠️  Coverage tests failed, but continuing..."
fi

# Step 6: Test CLI functionality
echo "🖥️  Testing CLI functionality..."
if ! node dist/cli/index.js --version; then
    echo "❌ CLI version check failed."
    exit 1
fi
echo "✅ CLI is functional"

# Step 7: Test basic CSV analysis
echo "📊 Testing basic CSV analysis..."
if ! node dist/cli/index.js overview examples/sample.csv --output json > /tmp/test-output.json; then
    echo "❌ Basic CSV analysis failed."
    exit 1
fi

if [ ! -s /tmp/test-output.json ]; then
    echo "❌ Output file is empty."
    exit 1
fi
echo "✅ Basic CSV analysis working"

# Step 8: Run integration tests (CI job: integration-test) - OPTIONAL
echo "🔗 Running integration tests (optional)..."
if npm run test:integration; then
    echo "✅ Integration tests passed"
else
    echo "⚠️  Integration tests failed - these may need fixing"
fi

# Step 9: Run E2E tests (CI job: e2e-test) - OPTIONAL
echo "🌐 Running E2E tests (optional)..."
if npm run test:e2e; then
    echo "✅ E2E tests passed"
else
    echo "⚠️  E2E tests failed - these may need fixing"
fi

echo "🎉 Core CI/CD simulation checks passed!"
echo "📋 Summary:"
echo "  ✅ TypeScript compilation"
echo "  ✅ Build process"
echo "  ✅ Unit tests"
echo "  ✅ CLI functionality"
echo "  ✅ Basic analysis"
echo ""
echo "Note: Integration/E2E test failures won't block local development"
echo "but should be fixed before pushing to CI."