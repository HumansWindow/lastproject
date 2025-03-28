const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== TypeScript Debugging Build ===');

// Create a simpler tsconfig for diagnostics
const debugTsConfigPath = path.join(__dirname, '..', 'tsconfig.debug.json');
const baseTsConfigPath = path.join(__dirname, '..', 'tsconfig.json');

// Read the base tsconfig
const baseConfig = JSON.parse(fs.readFileSync(baseTsConfigPath, 'utf8'));

// Create a simplified config for diagnostics
const debugConfig = {
  ...baseConfig,
  compilerOptions: {
    ...baseConfig.compilerOptions,
    skipLibCheck: true,
    noEmit: true, // Just check for errors, don't generate files
  },
  include: ['src/**/*.ts'],
};

// Write the debug config
fs.writeFileSync(debugTsConfigPath, JSON.stringify(debugConfig, null, 2));
console.log('Created debug TypeScript config');

// Run TypeScript with detailed error output
console.log('Running TypeScript diagnostics...');
const tscResult = spawnSync('npx', ['tsc', '-p', debugTsConfigPath, '--listFiles'], {
  stdio: 'inherit',
  shell: true
});

if (tscResult.status !== 0) {
  console.error('TypeScript compilation failed with errors');
  process.exit(1);
}

// Clean up
fs.unlinkSync(debugTsConfigPath);
console.log('Diagnostics complete');
