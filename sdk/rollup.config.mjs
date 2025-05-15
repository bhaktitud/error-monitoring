import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';

// Default browserlist yang akan didukung
const BROWSER_TARGETS = [
  'last 2 versions',
  'not dead',
  'not IE 11',
  '> 0.5%',
  'Firefox ESR'
];

// Pisahkan konfigurasi plugin typescript untuk setiap format
const createPlugins = (outputFormat, needsBabel = false) => {
  const plugins = [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: `dist/${outputFormat}/types`,
    }),
  ];

  if (needsBabel) {
    plugins.push(
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: BROWSER_TARGETS,
            useBuiltIns: 'usage',
            corejs: 3,
          }]
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      })
    );
  }

  return plugins;
};

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external: ['express', '@nestjs/common', 'rxjs', 'react', 'react-dom'],
    plugins: createPlugins('esm'),
  },

  // CJS build
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      exports: 'named',
    },
    external: ['express', '@nestjs/common', 'rxjs', 'react', 'react-dom'],
    plugins: createPlugins('cjs'),
  },
  
  // Browser UMD build (transpiled dengan babel)
  {
    input: 'src/browser.ts',
    output: {
      file: 'dist/browser/lograven.min.js',
      format: 'umd',
      name: 'LogRaven',
      sourcemap: true,
    },
    plugins: createPlugins('browser', true),
  },
];
