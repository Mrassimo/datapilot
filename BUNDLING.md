# DataPilot Bundling Guide

DataPilot is now a self-contained package! This means you can clone the repository and run the tool without needing to install dependencies.

## How It Works

The project uses Rollup to bundle the core application logic into a single JavaScript file (`dist/datapilot.js`) while keeping heavy dependencies external. This approach provides:

- **Fast startup**: No need to resolve hundreds of node_modules files
- **Self-contained**: Works with just the bundled file + external dependencies
- **Portable**: Easy to distribute and deploy
- **Maintainable**: Still uses standard npm dependencies for development

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot

# Install dependencies (needed for external libraries)
npm install

# Use the bundled version directly
node dist/datapilot.js help

# Or install globally to use anywhere
npm install -g .
datapilot help
```

## Development Workflow

```bash
# Install development dependencies
npm install

# Make changes to source code in src/
# Rebuild the bundle
npm run build

# Test the bundled version
node dist/datapilot.js eda your-data.csv

# Run tests
npm test
```

## Bundle Configuration

The bundling is configured in `rollup.config.js`:

- **Entry point**: `bin/datapilot.js`
- **Output**: `dist/datapilot.js` (ES modules format)
- **External dependencies**: Heavy libraries like `csv-parse`, `ml-cart`, etc. remain external
- **Bundled code**: All DataPilot logic, utilities, and lightweight dependencies

## Bundle Size

- **Bundled file**: ~760KB (includes all DataPilot logic)
- **External dependencies**: ~50MB node_modules (industry-standard ML/data libraries)
- **Memory footprint**: Significantly reduced due to optimized imports

## Deployment Options

### Option 1: Full Package (Recommended)
```bash
# Include both bundled code and node_modules
npm install
npm run build
# Deploy entire folder
```

### Option 2: Bundled + Dependencies
```bash
# Just the essentials
npm install --production
npm run build
# Deploy with minimal node_modules
```

### Option 3: Container Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist/ ./dist/
COPY bin/ ./bin/
CMD ["node", "dist/datapilot.js"]
```

## Benefits

1. **Performance**: Faster startup time, reduced I/O
2. **Reliability**: Less complexity in module resolution
3. **Distribution**: Easier to package and deploy
4. **Development**: Standard npm workflow maintained
5. **Self-contained**: Works immediately after cloning

## External Dependencies

These libraries remain external for optimal bundle size:
- `csv-parse` - Fast CSV parsing
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ml-cart`, `ml-kmeans` - Machine learning
- `simple-statistics`, `jstat` - Statistics
- Other data science libraries

They're automatically installed with `npm install` and required at runtime.