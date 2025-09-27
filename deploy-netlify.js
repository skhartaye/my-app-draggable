#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing for Netlify deployment...');

// Store original files in memory (no backup files created)
const originalPage = fs.readFileSync('app/page.tsx', 'utf8');
const originalHook = fs.readFileSync('hooks/use-realtime-notes.ts', 'utf8');

console.log('📦 Original files stored in memory (no backup files created)');

// Copy Netlify versions
const netlifyPage = fs.readFileSync('app/page-netlify.tsx', 'utf8');
const netlifyHook = fs.readFileSync('hooks/use-notes-netlify.ts', 'utf8');

// Replace main files with Netlify versions
fs.writeFileSync('app/page.tsx', netlifyPage);
fs.writeFileSync('hooks/use-realtime-notes.ts', netlifyHook);

// Remove problematic files that cause linting errors
const filesToRemove = [
  'lib/realtime/broadcast.ts',
  'lib/realtime/simple-websocket.ts',
  'websocket-server.js',
  'test-websocket.html'
];

filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`🗑️ Removed ${file} for Netlify build`);
  }
});

console.log('✅ Switched to Netlify-compatible versions');
console.log('🗑️ Removed problematic files for clean build');
console.log('🔧 Ready for Netlify build!');