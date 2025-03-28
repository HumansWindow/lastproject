#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database reset and server restart process...${NC}"

# Navigate to project directory
cd "$(dirname "$0")"

# Function to check if PostgreSQL is installed and running
check_postgres_installed() {
  if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL client (psql) not found. Please install PostgreSQL first.${NC}"
    echo -e "You can install it on Ubuntu/Debian with: sudo apt install postgresql postgresql-contrib"
    echo -e "On macOS: brew install postgresql"
    return 1
  fi
  
  # Check if PostgreSQL service is running
  if ! pg_isready -q; then
    echo -e "${RED}PostgreSQL service doesn't seem to be running.${NC}"
    echo -e "You can start it on Ubuntu/Debian with: sudo service postgresql start"
    echo -e "On macOS: brew services start postgresql"
    return 1
  fi
  
  return 0
}

# Function to create new database credentials
setup_new_credentials() {
  echo -e "${YELLOW}Setting up new database credentials...${NC}"
  
  # Prompt for database credentials
  read -p "PostgreSQL database name (default: Alive-Db): " DB_NAME
  DB_NAME=${DB_NAME:-Alive-Db}
  
  read -p "PostgreSQL username (default: postgres): " DB_USER
  DB_USER=${DB_USER:-postgres}
  
  read -p "PostgreSQL password: " DB_PASSWORD
  if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Password cannot be empty.${NC}"
    return 1
  fi
  
  read -p "PostgreSQL host (default: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  
  read -p "PostgreSQL port (default: 5432): " DB_PORT
  DB_PORT=${DB_PORT:-5432}
  
  # Create .env file with correct variable names and blockchain config
  cat > .env << EOL
DATABASE_NAME=${DB_NAME}
DATABASE_USER=${DB_USER}
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_HOST=${DB_HOST}
DATABASE_PORT=${DB_PORT}
JWT_SECRET=secret_for_development_only
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
ETH_RPC_URL=https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4
BNB_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey
SOL_RPC_URL=https://api.mainnet-beta.solana.com
MATIC_RPC_URL=https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4
BLOCKCHAIN_RPC_URL=https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4
ENCRYPTION_KEY=default-encryption-key-for-development
EOL

  echo -e "${GREEN}Created .env file.${NC}"
  
  # Copy to backend directory too
  cp .env backend/.env
  
  # Load new environment variables
  export DATABASE_NAME=$DB_NAME
  export DATABASE_USER=$DB_USER
  export DATABASE_PASSWORD=$DB_PASSWORD
  export DATABASE_HOST=$DB_HOST
  export DATABASE_PORT=$DB_PORT
  
  return 0
}

# Check if PostgreSQL is installed
check_postgres_installed || exit 1

# Check if .env file exists or create a new one
if [ ! -f .env ] && [ ! -f backend/.env ]; then
  echo -e "${YELLOW}No .env file found. Creating a default one...${NC}"
  setup_new_credentials || exit 1
else
  echo -e "${GREEN}Found existing .env file.${NC}"
  
  # Ask if user wants to use existing credentials or create new ones
  read -p "Do you want to update database credentials? (y/n, default: n): " UPDATE_CREDS
  if [[ "$UPDATE_CREDS" =~ ^[Yy]$ ]]; then
    setup_new_credentials || exit 1
  else
    # Load environment variables from .env safely
    if [ -f .env ]; then
      echo -e "${YELLOW}Loading environment variables from .env${NC}"
      # Use grep to filter out comments and empty lines, then use a loop to export valid variables only
      while IFS='=' read -r key value; do
        # Skip empty lines and comments
        if [ -z "$key" ] || [[ "$key" == \#* ]]; then
          continue
        fi
        # Check if the key is a valid identifier (alphanumeric or underscore)
        if [[ $key =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
          export "$key=$value"
        else
          echo -e "${YELLOW}Warning: Skipping invalid environment variable: $key${NC}"
        fi
      done < <(grep -v '^#' .env | grep -v '^\s*$')
    elif [ -f backend/.env ]; then
      echo -e "${YELLOW}Loading environment variables from backend/.env${NC}"
      while IFS='=' read -r key value; do
        # Skip empty lines and comments
        if [ -z "$key" ] || [[ "$key" == \#* ]]; then
          continue
        fi
        # Check if the key is a valid identifier
        if [[ $key =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
          export "$key=$value"
        else
          echo -e "${YELLOW}Warning: Skipping invalid environment variable: $key${NC}"
        fi
      done < <(grep -v '^#' backend/.env | grep -v '^\s*$')
    fi
  fi
fi

# Check if required database variables are set
if [ -z "$DATABASE_NAME" ] || [ -z "$DATABASE_USER" ] || [ -z "$DATABASE_PASSWORD" ]; then
  echo -e "${RED}Missing required database environment variables.${NC}"
  echo -e "${RED}Please make sure DATABASE_NAME, DATABASE_USER and DATABASE_PASSWORD are set in .env file.${NC}"
  exit 1
fi

# Kill any running backend and frontend processes
echo -e "${YELLOW}Stopping any running server processes...${NC}"
pkill -f "node.*backend" || true
pkill -f "node.*frontend" || true
sleep 2

# Export database variables explicitly for child processes
echo -e "${YELLOW}Setting database environment variables...${NC}"
export DATABASE_NAME DATABASE_USER DATABASE_PASSWORD DATABASE_HOST DATABASE_PORT
echo -e "${GREEN}Database connection info:${NC}"
echo -e "    - Host: ${DATABASE_HOST}"
echo -e "    - Port: ${DATABASE_PORT}"
echo -e "    - Database: ${DATABASE_NAME}"
echo -e "    - User: ${DATABASE_USER}"
echo -e "    - Password: (hidden)"

# Export blockchain variables explicitly
export ETH_RPC_URL BNB_RPC_URL SOL_RPC_URL MATIC_RPC_URL BLOCKCHAIN_RPC_URL ENCRYPTION_KEY

# Try to connect to PostgreSQL directly
echo -e "${YELLOW}Testing PostgreSQL connection...${NC}"
if ! PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d postgres -c '\q' 2>/dev/null; then
  echo -e "${RED}Failed to connect to PostgreSQL server with provided credentials.${NC}"
  
  # Try to connect as postgres user (common default)
  echo -e "${YELLOW}Trying to connect as 'postgres' user...${NC}"
  
  # Get superuser password
  read -p "Enter PostgreSQL superuser (postgres) password: " POSTGRES_PASSWORD
  if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Password cannot be empty.${NC}"
    exit 1
  fi
  
  # Test connection with postgres user
  if PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U postgres -c '\q' 2>/dev/null; then
    echo -e "${GREEN}Connected as superuser.${NC}"
    
    echo -e "${YELLOW}Creating database user and database...${NC}"
    
    # Create user if it doesn't exist
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U postgres -c "
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DATABASE_USER') THEN
        CREATE USER \"$DATABASE_USER\" WITH PASSWORD '$DATABASE_PASSWORD';
      ELSE
        ALTER USER \"$DATABASE_USER\" WITH PASSWORD '$DATABASE_PASSWORD';
      END IF;
    END
    \$\$;" 2>/dev/null
    
    # Check if database exists, if not create it
    DB_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME';" 2>/dev/null)
    if [ -z "$DB_EXISTS" ]; then
      echo -e "${YELLOW}Creating database '$DATABASE_NAME'...${NC}"
      PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U postgres -c "CREATE DATABASE \"$DATABASE_NAME\" WITH OWNER = \"$DATABASE_USER\";" 2>/dev/null
    else
      echo -e "${GREEN}Database '$DATABASE_NAME' already exists.${NC}"
    fi
    
    # Grant necessary privileges
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$DATABASE_NAME\" TO \"$DATABASE_USER\";" 2>/dev/null
    
    echo -e "${GREEN}Database setup completed.${NC}"
  else
    echo -e "${RED}Failed to connect as superuser. Please check your PostgreSQL installation and credentials.${NC}"
    echo -e "${YELLOW}Possible solutions:${NC}"
    echo -e "1. Make sure PostgreSQL is installed and running"
    echo -e "2. Check if PostgreSQL is configured to accept password authentication"
    echo -e "3. Verify the host and port settings in your .env file"
    echo -e "4. Make sure you're using the correct superuser password"
    exit 1
  fi
fi

# Now try to connect to the specific database
echo -e "${YELLOW}Testing connection to database '$DATABASE_NAME'...${NC}"
if ! PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -c '\q' 2>/dev/null; then
  echo -e "${RED}Failed to connect to database '$DATABASE_NAME'.${NC}"
  echo -e "${YELLOW}Database might not exist yet. It will be created during setup.${NC}"
fi

# Reset the database
echo -e "${YELLOW}Resetting database...${NC}"
cd backend

# Check if reset-database.ts exists
if [ ! -f src/db/reset-database.ts ]; then
  echo -e "${RED}Database reset script not found at src/db/reset-database.ts${NC}"
  echo -e "${YELLOW}Trying alternative approaches...${NC}"
  
  # Try using TypeORM CLI directly if available
  if [ -f node_modules/.bin/typeorm ]; then
    echo -e "${YELLOW}Using TypeORM CLI to drop and sync schema...${NC}"
    npx typeorm schema:drop && npx typeorm schema:sync
  else
    echo -e "${YELLOW}Creating database tables using migration...${NC}"
  fi
else
  npx ts-node src/db/reset-database.ts
fi

# Check reset-database.ts result
if [ $? -ne 0 ]; then
  echo -e "${RED}Database reset failed.${NC}"
  echo -e "${YELLOW}Trying to run migrations instead...${NC}"
  
  # Run migrations instead
  npm run migration:run || npx typeorm migration:run
  
  # If migrations also failed, try schema sync
  if [ $? -ne 0 ]; then
    echo -e "${RED}Migration failed. Trying to initialize database schema...${NC}"
    # Fallback - try to synchronize database schema
    NODE_ENV=development npx ts-node -r tsconfig-paths/register src/db/initialize-schema.ts
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Database initialization failed. Exiting.${NC}"
      exit 1
    fi
  fi
fi

# Set CORS environment variables
export CORS_ORIGIN="http://localhost:3000"
export CORS_CREDENTIALS="true"

# Start the backend server
echo -e "${YELLOW}Starting backend server...${NC}"
NODE_ENV=development SOL_RPC_URL=https://api.mainnet-beta.solana.com npm run start:dev &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started with PID: $BACKEND_PID${NC}"

# Wait for backend to initialize
echo -e "${YELLOW}Waiting for backend to initialize (15 seconds)...${NC}"
sleep 15

# Start the frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend server started with PID: $FRONTEND_PID${NC}"

echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}All systems are up and running!${NC}"
echo -e "${GREEN}- Backend running on http://localhost:3001${NC}"
echo -e "${GREEN}- Frontend running on http://localhost:3000${NC}"
echo -e "${GREEN}===================================${NC}"
echo -e "${YELLOW}To stop servers, press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID${NC}"

# Keep the script running so it's easy to terminate the servers with Ctrl+C
wait
