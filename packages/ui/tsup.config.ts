import { defineConfig } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['solid-js', 'yoga-layout', '@openterminal-ui/core'],
  esbuildPlugins: [
    solidPlugin({ solid: { generate: 'universal', moduleName: '@openterminal-ui/ui' } }),
  ],
});
