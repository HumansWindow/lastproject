const { exec } = require('child_process');
require('dotenv').config();

console.log('Running migrations with TypeScript support...');

// Run ts-node command to execute migrations
const command = 'npx ts-node --transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d typeorm.config.ts';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing migrations: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Migrations completed successfully!');
});
