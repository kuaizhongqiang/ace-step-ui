#!/usr/bin/env node

/**
 * ACE-Step UI CLI — thin entry that delegates to ace-step-ui-server
 *
 * When installed via `npm i -g ace-step-ui-cli`, this finds the
 * server package's CLI implementation and runs it.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

try {
  const serverCliPath = require.resolve('ace-step-ui-server/cli.mjs');
  await import(serverCliPath);
} catch (err) {
  console.error('');
  console.error('  ⚠  ace-step-ui-server not found.');
  console.error('     Install it: npm i -g ace-step-ui-server');
  console.error('');
  process.exit(1);
}
