#!/usr/bin/env node
// Apply fixes before starting the app
try {
  require('./fix-websockets');
} catch (error) {
  console.error('Error applying WebSocket fixes:', error);
}

process.env.NODE_PATH = './node_modules';
require('module').Module._initPaths();
require('./dist/main');

