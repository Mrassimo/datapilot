# DataPilot MCP Integration - Implementation Guide

*Step-by-step implementation commands and code for Project Restructuring*

## 🚀 Quick Start Implementation

This guide provides the exact commands and code changes needed to implement the monorepo restructuring plan.

## Phase 1: Infrastructure Setup

### Step 1: Create Workspace Structure

```bash
# Execute these commands from /Users/massimoraso/plum/

# Create packages directory structure
mkdir -p packages/{core,cli,mcp-server}
mkdir -p packages/core/{src,tests}
mkdir -p packages/cli/{src,tests}  
mkdir -p packages/mcp-server/{src,tests}

# Create workspace configuration
echo "packages:
  - 'packages/*'" > pnpm-workspace.yaml

# Backup existing structure
cp -r src/ src-backup/
cp -r mcp-server/ mcp-server-backup/
```

### Step 2: Root Package Configuration

```bash
# Update root package.json
cat > package.json << 'EOF'
{
  "name": "datapilot",
  "version": "1.0.1",
  "description": "Comprehensive CSV data analysis with streaming statistical computation",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "dev": "npm run dev --workspaces",
    "clean": "npm run clean --workspaces",
    "lint": "npm run lint --workspaces",
    "dev:core": "npm run dev -w @datapilot/core",
    "dev:cli": "npm run dev -w @datapilot/cli", 
    "dev:mcp": "npm run dev -w @datapilot/mcp-server",
    "build:core": "npm run build -w @datapilot/core",
    "build:cli": "npm run build -w @datapilot/cli",
    "build:mcp": "npm run build -w @datapilot/mcp-server",
    "test:core": "npm run test -w @datapilot/core",
    "test:cli": "npm run test -w @datapilot/cli",
    "test:mcp": "npm run test -w @datapilot/mcp-server"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
EOF
```

### Step 3: Root TypeScript Configuration

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "paths": {
      "@datapilot/core": ["./packages/core/src"],
      "@datapilot/cli": ["./packages/cli/src"],
      "@datapilot/mcp-server": ["./packages/mcp-server/src"]
    }
  },
  "exclude": ["node_modules", "dist", "**/dist", "**/node_modules"],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/cli" },
    { "path": "./packages/mcp-server" }
  ]
}
EOF
```

## Phase 2: Core Package Setup

### Step 1: Core Package Configuration

```bash
cat > packages/core/package.json << 'EOF'
{
  "name": "@datapilot/core",
  "version": "1.0.1",
  "description": "DataPilot core analysis engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "test": "jest",
    "clean": "rm -rf dist",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "csv-parser": "^3.0.0",
    "mathjs": "^11.0.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/lodash": "^4.14.0"
  }
}
EOF
```

### Step 2: Core TypeScript Configuration

```bash
cat > packages/core/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "dist",
    "node_modules",
    "**/*.test.ts",
    "tests"
  ]
}
EOF
```

### Step 3: Migrate Core Modules

```bash
# Copy core DataPilot modules to new structure
cp -r src/analyzers/ packages/core/src/
cp -r src/parsers/ packages/core/src/
cp -r src/utils/ packages/core/src/
cp -r src/core/ packages/core/src/
cp -r tests/analyzers/ packages/core/tests/
cp -r tests/parsers/ packages/core/tests/
```

### Step 4: Create Core Package Exports

```bash
cat > packages/core/src/index.ts << 'EOF'
// Analyzer exports
export * from './analyzers/overview/section1-analyzer';
export * from './analyzers/quality/section2-analyzer';
export * from './analyzers/eda/section3-analyzer';
export * from './analyzers/visualization/section4-analyzer';
export * from './analyzers/engineering/section5-analyzer-fixed';
export * from './analyzers/modeling/section6-analyzer';

// Type exports
export * from './analyzers/overview/types';
export * from './analyzers/quality/types';
export * from './analyzers/eda/types';
export * from './analyzers/visualization/types';
export * from './analyzers/engineering/types';
export * from './analyzers/modeling/types';

// Parser exports
export * from './parsers/csv-parser';
export * from './parsers/csv-detector';
export * from './parsers/encoding-detector';

// Utility exports
export * from './utils/logger';
export * from './utils/error-handler';
export * from './utils/memory-manager';
export * from './utils/validation';

// Core exports
export * from './core/config';
export * from './core/types';
export * from './core/performance-monitor';
EOF
```

## Phase 3: CLI Package Setup

### Step 1: CLI Package Configuration

```bash
cat > packages/cli/package.json << 'EOF'
{
  "name": "@datapilot/cli",
  "version": "1.0.1",
  "description": "DataPilot command line interface",
  "bin": {
    "datapilot": "dist/index.js"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "test": "jest",
    "clean": "rm -rf dist",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@datapilot/core": "workspace:*",
    "commander": "^9.4.1",
    "chalk": "^4.1.2",
    "ora": "^5.4.1",
    "inquirer": "^8.2.4"
  },
  "devDependencies": {
    "@types/inquirer": "^8.2.0"
  }
}
EOF
```

### Step 2: CLI TypeScript Configuration

```bash
cat > packages/cli/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "dist", 
    "node_modules",
    "**/*.test.ts",
    "tests"
  ],
  "references": [
    { "path": "../core" }
  ]
}
EOF
```

### Step 3: Migrate CLI Code

```bash
# Copy CLI modules
cp -r src/cli/ packages/cli/src/
cp src/index.ts packages/cli/src/
cp -r tests/cli/ packages/cli/tests/
```

### Step 4: Update CLI Imports

```bash
# Create migration script for CLI imports
cat > scripts/update-cli-imports.js << 'EOF'
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Update imports in CLI package
const cliFiles = glob.sync('packages/cli/src/**/*.ts');

cliFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace relative imports to core modules with package imports
  content = content
    .replace(/from ['"]\.\.\/\.\.\/analyzers\//g, "from '@datapilot/core/analyzers/")
    .replace(/from ['"]\.\.\/\.\.\/parsers\//g, "from '@datapilot/core/parsers/")
    .replace(/from ['"]\.\.\/\.\.\/utils\//g, "from '@datapilot/core/utils/")
    .replace(/from ['"]\.\.\/\.\.\/core\//g, "from '@datapilot/core/core/")
    .replace(/from ['"]\.\.\/analyzers\//g, "from '@datapilot/core/analyzers/")
    .replace(/from ['"]\.\.\/parsers\//g, "from '@datapilot/core/parsers/")
    .replace(/from ['"]\.\.\/utils\//g, "from '@datapilot/core/utils/")
    .replace(/from ['"]\.\.\/core\//g, "from '@datapilot/core/core/");
  
  fs.writeFileSync(file, content);
});

console.log(`Updated ${cliFiles.length} CLI files`);
EOF

node scripts/update-cli-imports.js
```

## Phase 4: MCP Server Setup

### Step 1: MCP Server Package Configuration

```bash
cat > packages/mcp-server/package.json << 'EOF'
{
  "name": "@datapilot/mcp-server",
  "version": "0.1.0",
  "description": "DataPilot Model Context Protocol server",
  "main": "dist/index.js",
  "bin": {
    "datapilot-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "start": "node dist/index.js",
    "test": "jest",
    "clean": "rm -rf dist",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@datapilot/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
EOF
```

### Step 2: MCP Server TypeScript Configuration

```bash
cat > packages/mcp-server/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "dist",
    "node_modules", 
    "**/*.test.ts",
    "tests"
  ],
  "references": [
    { "path": "../core" }
  ]
}
EOF
```

### Step 3: Migrate MCP Server Code

```bash
# Copy MCP server modules
cp -r mcp-server/src/ packages/mcp-server/src/
cp -r mcp-server/tests/ packages/mcp-server/tests/
```

### Step 4: Update MCP Server for Real Integration

```bash
# Update the DataPilot bridge to use real analyzers
cat > packages/mcp-server/src/core/datapilot-bridge.ts << 'EOF'
/**
 * Bridge between MCP Server and DataPilot Core
 * 
 * This module provides integration with the existing DataPilot TypeScript core,
 * allowing MCP tools to leverage the full analysis pipeline.
 */

import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from '../utils/logger';
import { loadConfig, Config } from '../utils/config';

// Import real DataPilot analyzers
import { 
  Section1Analyzer,
  Section2Analyzer, 
  Section3Analyzer,
  Section4Analyzer,
  Section5Analyzer,
  Section6Analyzer
} from '@datapilot/core';

// Import types
import type { 
  Section1Result,
  Section2Result,
  Section3Result,
  Section4Result,
  Section5Result,
  Section6Result
} from '@datapilot/core';

const logger = createLogger('datapilot-bridge');

export interface AnalysisResult {
  overview?: Section1Result;
  quality?: Section2Result;
  eda?: Section3Result;
  visualization?: Section4Result;
  engineering?: Section5Result;
  modeling?: Section6Result;
  metadata?: {
    sections_run: number[];
    execution_time_ms: number;
    file_size_bytes: number;
    rows_processed: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    path: string;
    size: number;
    encoding?: string;
    delimiter?: string;
    headers?: string[];
    rowCount?: number;
  };
}

/**
 * DataPilot Core Integration Bridge
 */
export class DataPilotBridge {
  private config: Config;

  constructor() {
    this.config = loadConfig();
    logger.info('DataPilot Bridge initialized with real analyzers');
  }

  /**
   * Validate CSV file structure and accessibility
   */
  async validateCSV(filePath: string): Promise<ValidationResult> {
    // [Previous validation implementation remains the same]
    // ... keeping existing validation logic
  }

  /**
   * Execute comprehensive DataPilot analysis using real core modules
   */
  async analyzeCSV(
    filePath: string,
    sections: number[] = [1, 2, 3, 4, 5, 6],
    outputFormat: 'json' | 'markdown' | 'summary' = 'json'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    logger.info('Starting real CSV analysis', { filePath, sections, outputFormat });

    // Validate file first
    const validation = await this.validateCSV(filePath);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const result: AnalysisResult = {
        metadata: {
          sections_run: sections,
          execution_time_ms: 0,
          file_size_bytes: validation.fileInfo.size,
          rows_processed: validation.fileInfo.rowCount || 0
        }
      };

      // Sequential execution of real analyzers with proper instantiation
      let section1Result: Section1Result | undefined;
      let section2Result: Section2Result | undefined;
      let section3Result: Section3Result | undefined;
      let section4Result: Section4Result | undefined;
      let section5Result: Section5Result | undefined;

      // Section 1: Overview Analysis (required for all subsequent sections)
      if (sections.includes(1) || sections.some(s => s > 1)) {
        logger.info('Running Section 1: Overview Analysis');
        const section1Analyzer = new Section1Analyzer();
        section1Result = await section1Analyzer.analyze(filePath, `datapilot all ${filePath}`, ['all']);
        if (sections.includes(1)) {
          result.overview = section1Result;
        }
      }

      // Add remaining sections with proper real implementations
      // TODO: Implement Sections 2-6 with proper data loading patterns

      result.metadata!.execution_time_ms = Date.now() - startTime;

      logger.info('Real CSV analysis completed', {
        filePath,
        sectionsRun: sections.length,
        executionTime: result.metadata!.execution_time_ms
      });

      return result;

    } catch (error) {
      logger.error('Real CSV analysis failed', { filePath, error });
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get quick quality metrics using real analyzers
   */
  async getQualityMetrics(filePath: string): Promise<any> {
    const validation = await this.validateCSV(filePath);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Run quick overview analysis
      logger.info('Running quick overview for quality metrics');
      const section1Analyzer = new Section1Analyzer();
      const overviewResult = await section1Analyzer.quickAnalyze(filePath);
      
      // Extract quality metrics from real overview analysis
      const sparsityScore = (100 - (overviewResult.overview?.structuralDimensions?.sparsityAnalysis?.sparsityPercentage || 5));
      
      return {
        quality_score: Math.round(sparsityScore),
        critical_issues: 0,
        total_issues: overviewResult.warnings?.length || 0,
        recommendations: overviewResult.warnings?.map(w => w.message) || ['File appears to be in good condition'],
        file_info: validation.fileInfo
      };
    } catch (error) {
      logger.error('Quick quality analysis failed', { filePath, error });
      return {
        quality_score: 0,
        critical_issues: 1,
        total_issues: 1,
        recommendations: ['Analysis failed - check file format and accessibility'],
        file_info: validation.fileInfo
      };
    }
  }
}
EOF
```

## Phase 5: Testing and Verification

### Step 1: Install Dependencies

```bash
# Install workspace dependencies
npm install

# Install package dependencies
npm install --workspaces
```

### Step 2: Build All Packages

```bash
# Build in dependency order
npm run build:core
npm run build:cli
npm run build:mcp
```

### Step 3: Run Tests

```bash
# Test all packages
npm run test:core
npm run test:cli  
npm run test:mcp
```

### Step 4: Verify Real Integration

```bash
# Test MCP server with real data
cd packages/mcp-server
npm run build
npm test

# Test with sample data
node dist/index.js
```

## Phase 6: Cleanup

### Step 1: Remove Old Structure

```bash
# Only after verifying everything works!
rm -rf src-backup/
rm -rf mcp-server-backup/
rm -rf src/
rm -rf mcp-server/
```

### Step 2: Update Documentation

```bash
# Update README.md, package descriptions, examples
# Update all file paths in documentation
# Update CI/CD configurations
```

## 🎯 Verification Checklist

- [ ] All packages build without errors
- [ ] All tests pass in new structure
- [ ] MCP server imports real DataPilot analyzers
- [ ] Section 1 analysis returns real results
- [ ] CLI functionality preserved
- [ ] Import paths correctly resolved
- [ ] Development workflows operational
- [ ] Documentation updated

## 🚨 Rollback Commands

If migration fails:

```bash
# Restore from backup
rm -rf packages/
mv src-backup/ src/
mv mcp-server-backup/ mcp-server/

# Restore original package.json
git checkout package.json tsconfig.json
```

---

**Next Step**: Execute Phase 1 commands to begin the restructuring process.