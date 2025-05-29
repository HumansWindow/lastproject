# Script to directly run TypeORM migrations
# This is a simpler approach than using the NestJS CLI

# Get the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "$SCRIPT_DIR"

echo "=== Running TypeORM migrations directly ==="

# Ensure the database exists
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "${DB_DATABASE:-Alive-Db}" || {
  echo "Creating database ${DB_DATABASE:-Alive-Db}..."
  sudo -u postgres createdb "${DB_DATABASE:-Alive-Db}" -O "${DB_USERNAME:-Aliveadmin}"
}

# Create the uuid-ossp extension
sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Run migrations using TypeORM CLI
echo "Running migrations..."
npx typeorm-ts-node-commonjs migration:run -d src/config/database.config.ts || {
  echo "Failed to run migrations with config at src/config/database.config.ts"
  echo "Trying alternate config location..."
  
  # Try alternate config locations
  npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts || {
    echo "Failed to run migrations with config at typeorm.config.ts"
    echo "Trying src/typeorm.config.ts..."
    
    npx typeorm-ts-node-commonjs migration:run -d src/typeorm.config.ts || {
      echo "All migration attempts failed. Check your configuration files."
      exit 1
    }
  }
}

echo "=== Migrations completed successfully! ==="
