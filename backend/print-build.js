#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
  const buildPath = path.join(__dirname, 'build.sh');
  if (fs.existsSync(buildPath)) {
    const buildScript = fs.readFileSync(buildPath, 'utf8');
    console.log('Contents of build.sh:');
    console.log('------------------');
    console.log(buildScript);
    console.log('------------------');
  } else {
    console.log('build.sh does not exist');
  }
} catch (error) {
  console.error(`Error reading build.sh: ${error.message}`);
}
