
# Offline Installation Instructions

The package datapilot-cli-1.2.1.tgz contains all dependencies bundled.

## To install on an offline machine:

1. Copy datapilot-cli-1.2.1.tgz to the target machine
2. Run: npm install -g datapilot-cli-1.2.1.tgz
3. Verify: datapilot --version

## Alternative local installation:
1. Extract: tar -xzf datapilot-cli-1.2.1.tgz
2. cd package/  
3. npm install --production --offline
4. npm link (optional, for global access)

## Package contents:
- All source code in dist/
- All dependencies bundled
- No internet connection required for installation
