#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting wallet authentication database fix...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}PostgreSQL is not running. Please start the database service first.${NC}"
    exit 1
fi

# Get database credentials - using your specific database config
# Default values from your .env file
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="alivehumans@2024"

echo -e "${YELLOW}Using database configuration:${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "(Password hidden)"

# Skip the interactive prompts
echo -e "${YELLOW}Using predefined database credentials from environment...${NC}"

# Create a temporary PGPASSFILE
export PGPASSFILE=$(mktemp)
echo "${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASSWORD}" > $PGPASSFILE
chmod 600 $PGPASSFILE

echo -e "${YELLOW}Applying database schema fixes...${NC}"

# Execute the SQL script
if psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f fix-refresh-token-schema.sql; then
    echo -e "${GREEN}✓ Database schema updated successfully!${NC}"
else
    echo -e "${RED}✗ Error applying database schema updates.${NC}"
    rm -f $PGPASSFILE
    exit 1
fi

# Clean up
rm -f $PGPASSFILE

# Update the database schema documentation
echo -e "${YELLOW}Updating database schema documentation...${NC}"

# Check for node_modules directory
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules directory not found. Creating temporary node setup...${NC}"
    mkdir -p temp_node_test
    cd temp_node_test
    
    # Initialize a temporary Node.js project
    echo '{"name":"db-test","version":"1.0.0","private":true}' > package.json
    
    # Install pg module
    echo -e "${YELLOW}Installing required pg module...${NC}"
    npm install pg --no-save
    
    cd ..
    NODE_MODULES_PATH="./temp_node_test/node_modules"
else
    # Check if pg module is installed
    if [ ! -d "node_modules/pg" ]; then
        echo -e "${YELLOW}pg module not found. Installing temporarily...${NC}"
        npm install pg --no-save
    fi
    NODE_MODULES_PATH="./node_modules"
fi

# Check if the auth service initialization succeeds
echo -e "${YELLOW}Testing wallet auth service...${NC}"
echo "Test connection to verify fix is working..."

# Create temporary test script
TEST_SCRIPT=$(mktemp)
cat > $TEST_SCRIPT << EOF
// Add the node_modules path
process.env.NODE_PATH = '${NODE_MODULES_PATH}';
require('module').Module._initPaths();

const { Pool } = require('pg');

async function testConnection() {
  // Create a connection pool using your specific database config
  const pool = new Pool({
    host: '$DB_HOST',
    port: $DB_PORT,
    database: '$DB_NAME',
    user: '$DB_USER',
    password: '$DB_PASSWORD',
    ssl: false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    
    // Check refresh_tokens table
    const result = await client.query(\`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    \`);
    
    console.log('\nRefresh Tokens Table Schema:');
    console.table(result.rows);
    
    // Try to create a test token
    const testId = '00000000-0000-0000-0000-000000000000';
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    
    try {
      // First delete any existing test token to avoid conflicts
      await client.query(\`DELETE FROM refresh_tokens WHERE user_id = \$1\`, [testId]);
      
      // Try to insert a test token
      const insertResult = await client.query(\`
        INSERT INTO refresh_tokens (token, "expiresAt", user_id)
        VALUES (\$1, \$2, \$3)
        RETURNING id, token
      \`, ['test-token-123', expiryDate, testId]);
      
      if (insertResult.rows.length > 0) {
        console.log('✓ Successfully inserted test token with ID:', insertResult.rows[0].id);
        // Clean up test token
        await client.query(\`DELETE FROM refresh_tokens WHERE user_id = \$1\`, [testId]);
      }
    } catch (insertError) {
      console.error('Error during token insertion:', insertError.message);
      console.log('Trying alternative column name...');
      
      try {
        // Try with expires_at instead of expiresAt
        const insertResult = await client.query(\`
          INSERT INTO refresh_tokens (token, expires_at, user_id)
          VALUES (\$1, \$2, \$3)
          RETURNING id, token
        \`, ['test-token-123', expiryDate, testId]);
        
        if (insertResult.rows.length > 0) {
          console.log('✓ Successfully inserted test token with expires_at column with ID:', insertResult.rows[0].id);
          // Clean up test token
          await client.query(\`DELETE FROM refresh_tokens WHERE user_id = \$1\`, [testId]);
        }
      } catch (altInsertError) {
        console.error('Error with alternative column name:', altInsertError.message);
        throw altInsertError;
      }
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('✗ Database error:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

# Run the test script
if node $TEST_SCRIPT; then
    echo -e "${GREEN}✓ Database schema update verified working!${NC}"
else
    echo -e "${RED}✗ Database tests failed. Please check your schema manually.${NC}"
fi

# Clean up temporary node setup
if [ -d "temp_node_test" ]; then
    echo -e "${YELLOW}Cleaning up temporary node setup...${NC}"
    rm -rf temp_node_test
fi

rm -f $TEST_SCRIPT

echo -e "${GREEN}✓ Fix applied successfully! You can now restart your backend service.${NC}"
echo -e "${YELLOW}To restart the service, run: npm run start:dev${NC}"