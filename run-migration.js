const { createConnection } = require('typeorm');
const path = require('path');

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'alivehuman',
      entities: [path.join(__dirname, 'backend/src/**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, 'migrations/*.ts')],
      synchronize: false,
      logging: true
    });

    console.log('Running migrations...');
    await connection.runMigrations({ transaction: 'all' });
    console.log('Migrations completed successfully');

    await connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigration();
