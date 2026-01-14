import { spawn } from 'node:child_process';
import path from 'node:path';

let demoPath: string;
if (process.cwd().endsWith('ui')) {
  demoPath = path.join(process.cwd(), 'examples/demo.tsx');
} else {
  demoPath = path.join(process.cwd(), 'packages/ui/examples/demo.tsx');
}

// biome-ignore lint/suspicious/noConsole: demo script
console.log(`Starting demo at ${demoPath}...`);

// Spawn bun to run the demo
const child = spawn('bun', ['run', demoPath], {
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
