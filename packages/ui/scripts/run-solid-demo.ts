import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from '@babel/core';

const uiPkgDir = process.cwd().endsWith('ui')
  ? process.cwd()
  : path.join(process.cwd(), 'packages/ui');
const rootDir = path.resolve(uiPkgDir, '../..');
const demoPath = path.join(uiPkgDir, 'examples/solid-demo.tsx');
const outPath = path.join(uiPkgDir, '.cache/solid-demo.mjs');

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const source = fs.readFileSync(demoPath, 'utf-8');

const result = transformSync(source, {
  filename: demoPath,
  presets: [
    ['babel-preset-solid', { generate: 'universal', moduleName: '@openterminal-ui/ui' }],
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ],
});

if (!result?.code) {
  process.exit(1);
}

const distPath = path.join(uiPkgDir, 'dist/index.mjs');
const solidPath = path.join(rootDir, 'node_modules/solid-js/dist/solid.js');

const importFixedCode = result.code
  .replace(/from\s+['"]\.\.\/src['"]/g, `from '${distPath}'`)
  .replace(/from\s+['"]@openterminal-ui\/ui['"]/g, `from '${distPath}'`)
  .replace(/from\s+['"]solid-js['"]/g, `from '${solidPath}'`);

fs.writeFileSync(outPath, importFixedCode);

const child = spawn('node', [outPath], {
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
