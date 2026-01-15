import solid from 'rolldown-plugin-solid';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  platform: 'node',
  external: ['solid-js', 'yoga-layout', '@openterminal-ui/core'],
  plugins: [solid({ solid: { generate: 'universal', moduleName: '@openterminal-ui/ui' } })],
});
