# DataPilot MCP Integration - Project Restructuring Plan

*Comprehensive analysis and implementation strategy for Option 1: Project Restructuring*

## 🎯 Executive Summary

**Objective**: Resolve TypeScript rootDir constraint preventing MCP server from importing parent DataPilot modules by restructuring the project architecture.

**Current Problem**: MCP server in `/mcp-server/` subdirectory cannot import from `../src/` due to TypeScript configuration limitations.

**Recommended Solution**: Monorepo restructuring with workspace-based package management for maximum flexibility, maintainability, and future scalability.

## 📊 Approach Analysis Matrix

| Approach | Complexity | Risk | Future-Proof | Recommended |
|----------|------------|------|--------------|-------------|
| **A. Move MCP to Root** | Low | Medium | Low | ❌ |
| **B. Monorepo Structure** | High | Medium | High | ✅ **RECOMMENDED** |
| **C. Flatten Structure** | Medium | High | Medium | ⚠️ |
| **D. Fix TypeScript Config** | Low | High | Low | ❌ |

## 🏗️ Recommended Architecture: Monorepo Structure

### Target Structure
```
/Users/massimoraso/plum/
├── packages/
│   ├── core/                     # @datapilot/core
│   │   ├── src/
│   │   │   ├── analyzers/        # All 6 analysis sections
│   │   │   ├── parsers/          # CSV parsing logic
│   │   │   ├── utils/            # Shared utilities
│   │   │   └── core/             # Configuration, types
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                      # @datapilot/cli
│   │   ├── src/
│   │   │   ├── index.ts          # CLI entry point
│   │   │   ├── commands/         # CLI command handlers
│   │   │   └── output/           # Formatters, reporters
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mcp-server/               # @datapilot/mcp-server
│       ├── src/
│       │   ├── index.ts          # MCP server entry
│       │   ├── core/             # DataPilot bridge
│       │   ├── handlers/         # Tool handlers
│       │   ├── tools/            # Tool definitions
│       │   └── utils/            # MCP-specific utils
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
├── docs/                         # Project documentation
├── test-datasets/                # Shared test data
├── examples/                     # Usage examples
├── scripts/                      # Build/dev scripts
├── package.json                  # Root workspace manager
├── tsconfig.json                 # Root TypeScript config
├── pnpm-workspace.yaml           # Workspace configuration
└── README.md                     # Updated project overview
```

### Package Dependencies
```
@datapilot/core
├── Independent foundation package
└── No internal dependencies

@datapilot/cli
├── Dependencies: @datapilot/core
└── External: commander, chalk, etc.

@datapilot/mcp-server
├── Dependencies: @datapilot/core
└── External: @modelcontextprotocol/sdk, zod
```

## 🔄 Migration Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)
**Goal**: Create new structure without breaking existing functionality

#### Day 1-2: Workspace Configuration
1. **Create package structure**
   ```bash
   mkdir -p packages/{core,cli,mcp-server}
   mkdir -p packages/core/{src,tests}
   mkdir -p packages/cli/{src,tests}
   mkdir -p packages/mcp-server/{src,tests}
   ```

2. **Configure workspace management**
   ```json
   // Root package.json
   {
     "name": "datapilot",
     "workspaces": [
       "packages/*"
     ],
     "scripts": {
       "build": "npm run build --workspaces",
       "test": "npm run test --workspaces",
       "dev:core": "npm run dev -w @datapilot/core",
       "dev:cli": "npm run dev -w @datapilot/cli",
       "dev:mcp": "npm run dev -w @datapilot/mcp-server"
     }
   }
   ```

3. **Create individual package.json files**
   ```json
   // packages/core/package.json
   {
     "name": "@datapilot/core",
     "version": "1.0.0",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "dependencies": {
       // Core dependencies only
     }
   }
   ```

#### Day 3-4: TypeScript Configuration
1. **Root tsconfig.json** (base configuration)
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "paths": {
         "@datapilot/core": ["./packages/core/src"],
         "@datapilot/cli": ["./packages/cli/src"],
         "@datapilot/mcp-server": ["./packages/mcp-server/src"]
       }
     },
     "exclude": ["node_modules", "dist"]
   }
   ```

2. **Package-specific configurations** extending root config

#### Day 5: Build Pipeline Setup
1. **Individual package build scripts**
2. **Workspace build orchestration**
3. **Development watch modes**
4. **Testing pipeline coordination**

### Phase 2: Core Package Migration (Week 2)
**Goal**: Move analyzers and core functionality to packages/core

#### Day 1-3: Core Module Migration
1. **Move analyzer modules**
   ```bash
   # Systematic migration of each analyzer
   cp -r src/analyzers/ packages/core/src/analyzers/
   cp -r src/parsers/ packages/core/src/parsers/
   cp -r src/utils/ packages/core/src/utils/
   cp -r src/core/ packages/core/src/core/
   ```

2. **Update internal imports**
   - Convert relative imports to package-based imports
   - Use automated tools for consistent updating
   ```typescript
   // Before
   import { Section1Analyzer } from '../analyzers/overview/section1-analyzer';
   
   // After
   import { Section1Analyzer } from '@datapilot/core/analyzers/overview/section1-analyzer';
   ```

3. **Create package exports**
   ```typescript
   // packages/core/src/index.ts
   export * from './analyzers';
   export * from './parsers';
   export * from './utils';
   export * from './core';
   ```

#### Day 4-5: Testing Migration
1. **Move core tests to packages/core/tests/**
2. **Update test imports and paths**
3. **Verify all core tests pass in isolation**

### Phase 3: CLI Package Migration (Week 3)
**Goal**: Migrate CLI functionality to packages/cli

#### Day 1-3: CLI Module Migration
1. **Move CLI-specific code**
   ```bash
   cp -r src/cli/ packages/cli/src/
   cp -r src/index.ts packages/cli/src/
   ```

2. **Update CLI dependencies**
   ```json
   // packages/cli/package.json
   {
     "dependencies": {
       "@datapilot/core": "workspace:*",
       "commander": "^9.0.0",
       "chalk": "^4.1.2"
     }
   }
   ```

3. **Update CLI imports**
   ```typescript
   // Before
   import { Section1Analyzer } from './analyzers/overview/section1-analyzer';
   
   // After  
   import { Section1Analyzer } from '@datapilot/core';
   ```

#### Day 4-5: CLI Testing and Integration
1. **Move CLI tests**
2. **Integration testing with core package**
3. **Verify CLI functionality**

### Phase 4: MCP Server Migration (Week 4)
**Goal**: Migrate MCP server to new structure with real DataPilot integration

#### Day 1-2: MCP Server Migration
1. **Move MCP server code**
   ```bash
   cp -r mcp-server/src/ packages/mcp-server/src/
   cp -r mcp-server/tests/ packages/mcp-server/tests/
   ```

2. **Update MCP dependencies**
   ```json
   // packages/mcp-server/package.json
   {
     "dependencies": {
       "@datapilot/core": "workspace:*",
       "@modelcontextprotocol/sdk": "^0.5.0",
       "zod": "^3.22.0"
     }
   }
   ```

3. **Enable real DataPilot integration**
   ```typescript
   // packages/mcp-server/src/core/datapilot-bridge.ts
   import { 
     Section1Analyzer,
     Section2Analyzer,
     Section3Analyzer 
   } from '@datapilot/core';
   ```

#### Day 3-4: Real Integration Implementation
1. **Replace mock implementations**
2. **Implement proper analyzer instantiation**
3. **Handle data flow between sections**
4. **Error handling and validation**

#### Day 5: MCP Server Testing
1. **Update MCP server tests**
2. **Integration testing with real analyzers**
3. **End-to-end workflow testing**

### Phase 5: Cleanup and Optimization (Week 5)
**Goal**: Remove old structure, optimize build pipeline, comprehensive testing

#### Day 1-2: Legacy Cleanup
1. **Remove old src/ directory structure**
2. **Update all documentation**
3. **Update CI/CD pipelines**
4. **Update README and examples**

#### Day 3-4: Build Optimization
1. **Optimize build performance**
2. **Configure proper watch modes**
3. **Set up development workflows**
4. **Performance testing**

#### Day 5: Final Integration Testing
1. **Complete end-to-end testing**
2. **Performance benchmarking**
3. **Documentation verification**
4. **Deployment testing**

## 🚨 Risk Management

### High-Risk Areas
1. **Import Path Updates**
   - **Risk**: Breaking changes across entire codebase
   - **Mitigation**: Automated tools, systematic approach, comprehensive testing
   - **Rollback**: Git branches for each phase

2. **Build Pipeline Complexity**
   - **Risk**: Build failures, dependency conflicts
   - **Mitigation**: Incremental migration, workspace isolation
   - **Rollback**: Maintain parallel build systems during transition

3. **Dependency Management**
   - **Risk**: Version conflicts, circular dependencies
   - **Mitigation**: Clear dependency hierarchy, workspace constraints
   - **Rollback**: Independent package.json files

### Medium-Risk Areas
1. **TypeScript Configuration**
   - **Risk**: Import resolution issues
   - **Mitigation**: Path mapping, proper base URLs
   - **Rollback**: Revert tsconfig changes

2. **Testing Infrastructure**
   - **Risk**: Test failures, coverage gaps
   - **Mitigation**: Test migration per package, continuous verification
   - **Rollback**: Keep old test structure until verified

### Low-Risk Areas
1. **File Structure Changes**
   - **Risk**: Minimal, mostly organizational
   - **Mitigation**: Systematic file moves
   - **Rollback**: Simple file moves

## 🛠️ Implementation Tools and Automation

### Automated Migration Tools
1. **TypeScript AST manipulation** for import updates
2. **ESLint rules** for import consistency
3. **Bash scripts** for file operations
4. **npm workspace commands** for build orchestration

### Development Tools
1. **Concurrent build watches** for all packages
2. **Link verification** for cross-package dependencies
3. **Integration test suites** for package interaction
4. **Performance monitoring** during migration

### Quality Assurance
1. **Pre-commit hooks** for import validation
2. **CI/CD pipeline updates** for workspace builds
3. **Automated testing** at package and integration levels
4. **Performance benchmarks** to ensure no regression

## 📈 Success Metrics

### Technical Metrics
- [ ] All packages build successfully
- [ ] Zero import resolution errors
- [ ] 100% test coverage maintained
- [ ] Real DataPilot integration working
- [ ] MCP server performance equivalent or better

### Functional Metrics  
- [ ] CLI functionality unchanged
- [ ] MCP server responds with real analysis results
- [ ] All 17 MCP tools working with real data
- [ ] Cross-section dependencies resolved properly

### Quality Metrics
- [ ] Build time not increased >20%
- [ ] Development workflow improved
- [ ] Code organization clearer
- [ ] Documentation accurate and complete

## 🎯 Expected Outcomes

### Immediate Benefits (Post-Migration)
1. **Real DataPilot Integration**: MCP server uses actual analyzers
2. **Statistical Accuracy**: Real analysis results instead of mocks
3. **Maintainable Architecture**: Clear separation of concerns
4. **Development Efficiency**: Better development workflows

### Long-term Benefits
1. **Independent Packaging**: Each component can be published separately
2. **Scalable Architecture**: Easy to add new packages/services
3. **Professional Structure**: Industry-standard monorepo approach
4. **Contributor Friendly**: Clear package boundaries for contributions

### Risk Mitigation
1. **Rollback Strategy**: Each phase can be independently reverted
2. **Parallel Development**: Old structure maintained until verification
3. **Incremental Verification**: Testing at each migration step
4. **Documentation**: Comprehensive migration documentation

## 🚀 Alternative Quick Win Options

If full restructuring proves too complex, these alternatives can provide immediate value:

### Option A: Dynamic Import Solution
```typescript
// Runtime import to bypass TypeScript constraints
const analyzers = await import('../../../src/analyzers/overview/section1-analyzer.js');
const Section1Analyzer = analyzers.Section1Analyzer;
```

### Option B: Build Bridge Pattern
```bash
# Build DataPilot core to dist/
npm run build
# Import from built files in MCP server
import { Section1Analyzer } from '../../../dist/analyzers/overview/section1-analyzer.js';
```

### Option C: Symlink Solution
```bash
# Create symlinks to parent modules
ln -s ../../src packages/mcp-server/src/datapilot-core
```

## 📋 Implementation Checklist

### Pre-Migration Setup
- [ ] Create feature branch for restructuring
- [ ] Back up current state
- [ ] Document current import patterns
- [ ] Identify all cross-module dependencies
- [ ] Set up automated testing pipeline

### Migration Execution
- [ ] Phase 1: Infrastructure (Week 1)
- [ ] Phase 2: Core Package (Week 2)  
- [ ] Phase 3: CLI Package (Week 3)
- [ ] Phase 4: MCP Server (Week 4)
- [ ] Phase 5: Cleanup (Week 5)

### Post-Migration Verification
- [ ] All tests passing
- [ ] Real analysis results in MCP server
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] CI/CD pipelines working
- [ ] Development workflows verified

---

**Recommendation**: Proceed with the Monorepo Structure approach for maximum long-term benefit, implementing in 5 weekly phases with comprehensive testing and rollback capabilities at each stage.