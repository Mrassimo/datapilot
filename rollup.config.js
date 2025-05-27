import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import preserveShebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'bin/datapilot.js',
  output: {
    file: 'dist/datapilot.js',
    format: 'es'
  },
  external: [
    // Keep Node.js built-ins external
    'fs', 'path', 'url', 'stream', 'util', 'events', 'crypto', 'os',
    // Keep heavy dependencies external to reduce bundle size
    'csv-parse', 'commander', 'chardet', 'chalk', 'ora',
    // ML libraries that have complex exports
    'ml-cart', 'ml-kmeans', 'simple-statistics', 'regression', 'jstat',
    // Other problematic dependencies
    'fuzzyset.js', 'validator', 'libphonenumber-js', 'js-yaml', 'glob'
  ],
  plugins: [
    preserveShebang(),
    resolve({
      preferBuiltins: true,
      exportConditions: ['node']
    }),
    commonjs(),
    json()
  ]
};