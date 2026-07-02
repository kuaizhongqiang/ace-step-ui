#!/usr/bin/env node

/**
 * ACE-Step UI CLI — Entry point for `npx ace-step-ui` / `npm start`
 *
 * Starts the Express backend server in production mode.
 * The built frontend (dist/) is served as static content by the server.
 *
 * SCOPE: This is the lightweight npx launcher — it starts the server and
 * exits. It is NOT the full site-management CLI planned in Issue #1
 * (start/stop/status/health/logs). That lives in a separate bin/* file
 * when implemented.
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Ensure the frontend has been built
const distIndex = resolve(root, 'dist', 'index.html');
if (!existsSync(distIndex)) {
  console.error('');
  console.error('  ⚠  Frontend build not found at dist/index.html');
  console.error('     Run `npm run build` before starting, or use `npm run dev` for development.');
  console.error('');
  process.exit(1);
}

const { spawn } = await import('child_process');

console.error('');
console.error('  🎵 ACE-Step UI');
console.error('  ──────────────');
console.error(`  Mode : production`);
console.error('');

// Start the Express server via tsx (handles TypeScript at runtime)
const serverEntry = resolve(root, 'server', 'src', 'index.ts');

// Use the local node_modules tsx binary directly (platform-aware resolution)
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const tsxPath = require.resolve('tsx/cli');

const proc = spawn(process.execPath, [tsxPath, serverEntry], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
});

// Forward signals for graceful shutdown
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(signal, () => {
    proc.kill(signal);
  });
}

proc.on('exit', (code) => {
  process.exit(code ?? 0);
});
