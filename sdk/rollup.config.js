const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');
const nodePolyfills = require('rollup-plugin-polyfill-node');

module.exports = [
  // CommonJS build
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  // ESM build
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  // Browser build
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.browser.js',
      format: 'iife',
      name: 'LogRaven',
      sourcemap: true,
      globals: {
        'fs': 'fs',
        'path': 'path'
      }
    },
    plugins: [
      nodePolyfills(),
      resolve({ browser: true }),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: ['fs', 'path']
  },
]; 