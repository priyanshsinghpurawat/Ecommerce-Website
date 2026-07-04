import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * UNIFIED TEST WATCHER
 *
 * This script runs both the Client (Vitest) and Server (Node Test Runner)
 * watchers simultaneously in a single terminal window.
 *
 * It uses 'spawn' to run child processes and prefixes their output so
 * you can easily distinguish between frontend and backend messages.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * Helper to run a command and pipe its output to the main console.
 */
function runCommand(command, args, cwd, label) {
  const process = spawn(command, args, { cwd, stdio: 'pipe', shell: true });

  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`[${label}] ${line.trim()}`);
      }
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`[${label}] ${line.trim()}`);
      }
    });
  });

  return process;
}

console.log('----------------------------------------------------');
console.log('🚀 Starting Client & Server Test Watchers...');
console.log('----------------------------------------------------');

/**
 * SERVER WATCHER:
 * We use '--test-concurrency=1' because our server tests use an in-memory
 * MongoDB. Running them in parallel would cause database connection conflicts.
 */
const serverProcess = runCommand(
  'node',
  ['--test', '--watch', '--test-concurrency=1', 'tests/**/*.test.js'],
  path.join(rootDir, 'server'),
  'SERVER',
);

/**
 * CLIENT WATCHER:
 * Runs Vitest in watch mode.
 */
const clientProcess = runCommand(
  'npm',
  ['run', 'test:watch'],
  path.join(rootDir, 'client'),
  'CLIENT',
);

/**
 * Clean up child processes when the user presses Ctrl+C
 */
process.on('SIGINT', () => {
  console.log('\nStopping test watchers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});
