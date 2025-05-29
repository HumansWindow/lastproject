// Simple database connection test
require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'Aliveadmin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'Alive-Db'
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Querying database tables...');
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    
    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    console.log('\nChecking if game tables exist:');
    const gameTables = ['game_modules', 'game_sections', 'user_progress', 'section_checkpoints'];
    for (const table of gameTables) {
      try {
        const tableExists = await client.query(`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        )`);
        console.log(`- ${table}: ${tableExists.rows[0].exists ? 'exists' : 'missing'}`);
      } catch (error) {
        console.error(`Error checking ${table}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

testConnection();
