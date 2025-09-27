#!/usr/bin/env node

const fs = require('fs');

console.log('🔄 Restoring local development versions...');

// Check if backup files exist
if (fs.existsSync('app/page.original.tsx') && fs.existsSync('hooks/use-realtime-notes.original.ts')) {
  // Restore original files
  const originalPage = fs.readFileSync('app/page.original.tsx', 'utf8');
  const originalHook = fs.readFileSync('hooks/use-realtime-notes.original.ts', 'utf8');
  
  fs.writeFileSync('app/page.tsx', originalPage);
  fs.writeFileSync('hooks/use-realtime-notes.ts', originalHook);
  
  // Clean up backup files
  fs.unlinkSync('app/page.original.tsx');
  fs.unlinkSync('hooks/use-realtime-notes.original.ts');
  
  console.log('✅ Restored original files with WebSocket support');
  console.log('🔧 Ready for local development!');
} else {
  console.log('❌ No backup files found. Nothing to restore.');
}