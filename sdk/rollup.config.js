import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default [
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
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
  },
]; 