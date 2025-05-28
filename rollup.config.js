import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import preserveShebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'bin/datapilot.js',
  output: {
    file: 'dist/datapilot.js',
    format: 'es',
    // Inline dynamic imports to create a single file bundle
    inlineDynamicImports: true
  },
  external: [
    // Node.js built-ins
    'fs', 'path', 'os', 'crypto', 'stream', 'util', 'events',
    'readline', 'child_process', 'url', 'querystring', 'http', 'https',
    'zlib', 'buffer', 'string_decoder', 'assert', 'cluster', 'dgram',
    'dns', 'domain', 'net', 'punycode', 'tls', 'tty', 'vm', 'worker_threads',
    
    // Problematic dependencies that cause build issues
    'canvas', 'sharp', 'jimp',
    
    // Optional dependencies
    'fsevents'
  ],
  plugins: [
    preserveShebang(),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'],
      // Skip problematic packages
      skip: ['canvas', 'sharp', 'jimp']
    }),
    commonjs({
      // Handle specific packages that need commonjs transformation
      include: ['node_modules/**'],
      // Exclude problematic packages
      exclude: ['node_modules/canvas/**', 'node_modules/sharp/**', 'node_modules/jimp/**'],
      // Transform specific packages
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto'
    }),
    json()
  ],
  onwarn(warning, warn) {
    // Suppress specific warnings that don't affect functionality
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'UNRESOLVED_IMPORT' && 
        (warning.source.includes('canvas') || 
         warning.source.includes('sharp') || 
         warning.source.includes('jimp'))) {
      return;
    }
    // Suppress unused external import warnings
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
    warn(warning);
  }
}; 