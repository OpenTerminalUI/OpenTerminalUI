import { spawn } from 'child_process';
import path from 'path';

// Fix path: we are running inside packages/ui usually, or from root?
// process.cwd() is where the command was run.
// If run via `cd packages/ui && bun run demo`, cwd is /app/packages/ui.
// The file is at /app/packages/ui/examples/demo.tsx.
// So path.join(cwd, 'packages/ui/examples/demo.tsx') would be /app/packages/ui/packages/ui/... Wrong.

// Let's resolve relative to THIS file's location.
// But this is TS source.
// We can use import.meta.dir if using Bun, or assume relative path structure.

let demoPath;
if (process.cwd().endsWith('ui')) {
    // We are in packages/ui
    demoPath = path.join(process.cwd(), 'examples/demo.tsx');
} else {
    // We are likely in root
    demoPath = path.join(process.cwd(), 'packages/ui/examples/demo.tsx');
}

console.log(`Starting demo at ${demoPath}...`);

// Spawn bun to run the demo
const child = spawn('bun', ['run', demoPath], {
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
