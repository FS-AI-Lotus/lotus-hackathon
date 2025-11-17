#!/usr/bin/env node

/**
 * Team 4 Progress Tracker
 * 
 * A simple CLI tool to track progress through the 9 iterations
 * Usage: node scripts/progress-tracker.js [command]
 * 
 * Commands:
 *   status    - Show current progress
 *   next      - Show what to do next
 *   check [N] - Mark iteration N as complete (0-8)
 *   reset [N] - Mark iteration N as incomplete
 */

const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, '../.team4-progress.json');
const ITERATIONS = [
  { id: 0, name: 'Repo Recon & Test Harness' },
  { id: 1, name: 'Config, Env Validation & Validation Library' },
  { id: 2, name: 'Asymmetric JWT Security Core (RS256/ES256)' },
  { id: 3, name: 'Attach JWT to Routes + Input Validation & Injection Protection' },
  { id: 4, name: 'Centralized Audit Logging & Correlation IDs' },
  { id: 5, name: 'Monitoring – Prometheus Metrics & `/metrics` Endpoint' },
  { id: 6, name: 'Prometheus & Grafana Config (Dashboards + Alerts)' },
  { id: 7, name: 'Alerts / Notifications, Failure Simulation & Crisis Management' },
  { id: 8, name: 'Final Verification & "How to Run" Guide' },
];

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (e) {
      return { completed: [] };
    }
  }
  return { completed: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function showStatus() {
  const progress = loadProgress();
  const completed = new Set(progress.completed || []);
  
  console.log('\n🎯 Team 4 - Monitoring & Security Progress\n');
  console.log('=' .repeat(60));
  
  ITERATIONS.forEach(iter => {
    const isComplete = completed.has(iter.id);
    const icon = isComplete ? '✅' : '⏳';
    const status = isComplete ? 'COMPLETE' : 'PENDING';
    console.log(`${icon} Iteration ${iter.id}: ${iter.name}`);
    console.log(`   Status: ${status}\n`);
  });
  
  const total = ITERATIONS.length;
  const done = completed.size;
  const percentage = Math.round((done / total) * 100);
  
  console.log('=' .repeat(60));
  console.log(`\n📊 Progress: ${done}/${total} iterations complete (${percentage}%)\n`);
  
  if (done === total) {
    console.log('🎉 All iterations complete! Ready for demo!\n');
  }
}

function showNext() {
  const progress = loadProgress();
  const completed = new Set(progress.completed || []);
  
  const nextIter = ITERATIONS.find(iter => !completed.has(iter.id));
  
  if (!nextIter) {
    console.log('\n🎉 All iterations are complete! You\'re done!\n');
    return;
  }
  
  console.log('\n📋 Next Up:\n');
  console.log(`   Iteration ${nextIter.id}: ${nextIter.name}`);
  console.log(`\n   Read the full details in: docs/team4-iterations.md`);
  console.log(`   Start by reviewing the mission and tasks for Iteration ${nextIter.id}\n`);
}

function checkIteration(id) {
  const numId = parseInt(id, 10);
  
  if (isNaN(numId) || numId < 0 || numId >= ITERATIONS.length) {
    console.error(`\n❌ Invalid iteration number. Must be 0-${ITERATIONS.length - 1}\n`);
    process.exit(1);
  }
  
  const progress = loadProgress();
  const completed = new Set(progress.completed || []);
  
  if (completed.has(numId)) {
    console.log(`\n✅ Iteration ${numId} is already marked as complete\n`);
    return;
  }
  
  completed.add(numId);
  progress.completed = Array.from(completed).sort((a, b) => a - b);
  saveProgress(progress);
  
  const iter = ITERATIONS[numId];
  console.log(`\n✅ Marked Iteration ${numId} as complete: ${iter.name}\n`);
  
  if (completed.size === ITERATIONS.length - 1) {
    console.log('🎉 Only one iteration left! Keep going!\n');
  }
}

function resetIteration(id) {
  const numId = parseInt(id, 10);
  
  if (isNaN(numId) || numId < 0 || numId >= ITERATIONS.length) {
    console.error(`\n❌ Invalid iteration number. Must be 0-${ITERATIONS.length - 1}\n`);
    process.exit(1);
  }
  
  const progress = loadProgress();
  const completed = new Set(progress.completed || []);
  
  if (!completed.has(numId)) {
    console.log(`\n⏳ Iteration ${numId} is already marked as incomplete\n`);
    return;
  }
  
  completed.delete(numId);
  progress.completed = Array.from(completed).sort((a, b) => a - b);
  saveProgress(progress);
  
  const iter = ITERATIONS[numId];
  console.log(`\n⏳ Marked Iteration ${numId} as incomplete: ${iter.name}\n`);
}

// Main CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'next':
    showNext();
    break;
  case 'check':
    if (!arg) {
      console.error('\n❌ Usage: node scripts/progress-tracker.js check [0-8]\n');
      process.exit(1);
    }
    checkIteration(arg);
    break;
  case 'reset':
    if (!arg) {
      console.error('\n❌ Usage: node scripts/progress-tracker.js reset [0-8]\n');
      process.exit(1);
    }
    resetIteration(arg);
    break;
  default:
    console.log('\n🎯 Team 4 Progress Tracker\n');
    console.log('Usage: node scripts/progress-tracker.js [command]\n');
    console.log('Commands:');
    console.log('  status        Show current progress');
    console.log('  next          Show what to do next');
    console.log('  check [N]    Mark iteration N as complete (0-8)');
    console.log('  reset [N]     Mark iteration N as incomplete (0-8)\n');
    console.log('Examples:');
    console.log('  node scripts/progress-tracker.js status');
    console.log('  node scripts/progress-tracker.js next');
    console.log('  node scripts/progress-tracker.js check 0');
    console.log('  node scripts/progress-tracker.js reset 1\n');
    break;
}

