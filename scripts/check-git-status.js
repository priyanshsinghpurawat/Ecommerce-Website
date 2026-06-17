#!/usr/bin/env node

/**
 * check-git-status.js
 * 
 * A script to identify and list any files or changes that have not been committed 
 * to a Git repository.
 * 
 * Usage: 
 *   node check-git-status.js
 *   node check-git-status.js --ignore-untracked
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const ignoreUntracked = args.includes('--ignore-untracked');

function run() {
  try {
    // Edge Case Handling 1: Check if inside a git repository
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    console.error('\x1b[31mError:\x1b[0m The current directory is not a Git repository.');
    process.exit(1);
  }

  try {
    // Edge Case Handling 2: Handling ignore untracked flag
    const untrackedFlag = ignoreUntracked ? '-uno' : '-uall';
    const statusOutput = execSync(`git status --porcelain ${untrackedFlag}`, { encoding: 'utf-8' });

    if (!statusOutput.trim()) {
      console.log('\x1b[32mWorking tree clean. No uncommitted changes.\x1b[0m');
      process.exit(0);
    }

    const lines = statusOutput.split('\n').filter(line => line.trim().length > 0);

    const staged = [];
    const unstaged = [];
    const untracked = [];

    const statusMap = {
      'M': 'Modified',
      'A': 'Added',
      'D': 'Deleted',
      'R': 'Renamed',
      'C': 'Copied',
      'U': 'Updated but unmerged'
    };

    lines.forEach(line => {
      // Git status porcelain format: XY PATH
      const x = line[0]; // Staged status
      const y = line[1]; // Unstaged status
      const file = line.substring(3).trim();

      // Untracked files
      if (x === '?' && y === '?') {
        untracked.push(file);
        return;
      }

      // Staged changes
      if (x !== ' ' && x !== '?') {
        const statusText = statusMap[x] || x;
        staged.push(`${file} (${statusText})`);
      }

      // Unstaged changes
      if (y !== ' ' && y !== '?') {
        const statusText = statusMap[y] || y;
        unstaged.push(`${file} (${statusText})`);
      }
    });

    // Output formatted results
    if (staged.length > 0) {
      console.log('\x1b[32m=== Staged Changes ===\x1b[0m');
      staged.forEach(f => console.log(`  - ${f}`));
      console.log('');
    }

    if (unstaged.length > 0) {
      console.log('\x1b[31m=== Unstaged Changes ===\x1b[0m');
      unstaged.forEach(f => console.log(`  - ${f}`));
      console.log('');
    }

    if (untracked.length > 0) {
      console.log('\x1b[36m=== Untracked Files ===\x1b[0m');
      untracked.forEach(f => console.log(`  - ${f}`));
      console.log('');
    }

  } catch (error) {
    console.error('\x1b[31mError executing Git commands:\x1b[0m', error.message);
    process.exit(1);
  }
}

run();
