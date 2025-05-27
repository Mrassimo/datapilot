import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import preserveShebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'bin/datapilot.js',
  output: {
    file: 'dist/datapilot.js',
    format: 'es',
    inlineDynamicImports: true
  },
  external: [
    // ONLY keep Node.js built-ins external - bundle ALL npm dependencies for Windows compatibility
    'fs', 'path', 'url', 'stream', 'util', 'events', 'crypto', 'os', 'readline', 'process',
    // Exclude problematic packages that have bundling issues
    'figlet'
  ],
  plugins: [
    preserveShebang(),
    resolve({
      preferBuiltins: true,
      exportConditions: ['node'],
      browser: false
    }),
    commonjs(),
    json()
  ]
};