import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    preserveModules: true, // <-- ini penting
    preserveModulesRoot: 'src', // jaga struktur folder
  },
  external: ['express'], // agar tidak dibundel
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: './tsconfig.json' }),
  ]
};
