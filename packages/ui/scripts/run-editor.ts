import { spawn } from 'child_process';
import path from 'path';

let demoPath;
if (process.cwd().endsWith('ui')) {
    demoPath = path.join(process.cwd(), 'examples/editor.tsx');
} else {
    demoPath = path.join(process.cwd(), 'packages/ui/examples/editor.tsx');
}

console.log(`Starting Editor Demo at ${demoPath}...`);

const child = spawn('bun', ['run', demoPath], {
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
