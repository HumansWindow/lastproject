// This is a simpler migration runner script using CommonJS
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting migration process...');

// Create a simple script to execute with TypeORM DataSource directly
const migrationRunnerCode = `
const { dataSource } = require('./migration.config.js');

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established successfully.');
    
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    if (migrations.length > 0) {
      console.log(\`Applied \${migrations.length} migrations:\`);
      migrations.forEach(migration => {
        console.log(\`- \${migration.name}\`);
      });
    } else {
      console.log('No pending migrations to run.');
    }
    
    console.log('Checking database tables...');
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Current tables in database:');
    tables.forEach(table => {
      console.log(\`- \${table.table_name}\`);
    });
    
    await dataSource.destroy();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

runMigrations();
`;

// Write a temporary JavaScript file
const fs = require('fs');
const tempFilePath = path.join(__dirname, 'temp-migration-runner.js');
fs.writeFileSync(tempFilePath, migrationRunnerCode);

console.log('Running migrations with TypeORM DataSource directly...');

// Now execute the temporary file with ts-node
const child = spawn('npx', [
  'ts-node',
  '--transpile-only',
  tempFilePath
], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  // Clean up the temporary file
  try {
    fs.unlinkSync(tempFilePath);
  } catch (err) {
    console.error('Error deleting temporary file:', err);
  }
  
  if (code === 0) {
    console.log('Migrations completed successfully!');
  } else {
    console.error(`Migration process exited with code ${code}`);
    process.exit(code);
  }
});
