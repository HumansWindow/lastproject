#!/bin/bash

echo "====================================="
echo "  PostgreSQL Authentication Fixer"
echo "====================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if the postgres service is running
check_postgres_service() {
  if systemctl is-active --quiet postgresql; then
    echo "✓ PostgreSQL service is running"
    return 0
  else
    echo "✗ PostgreSQL service is not running"
    
    # Try to start PostgreSQL
    echo "Attempting to start PostgreSQL service..."
    sudo systemctl start postgresql
    
    if systemctl is-active --quiet postgresql; then
      echo "✓ PostgreSQL service started successfully"
      return 0
    else
      echo "✗ Failed to start PostgreSQL service"
      return 1
    fi
  fi
}

# Function to update pg_hba.conf to use md5 authentication
update_pg_hba_conf() {
  echo "Locating pg_hba.conf..."
  
  # Try to find the pg_hba.conf file
  PG_HBA_CONF=$(sudo -u postgres psql -t -c "SHOW hba_file;" 2>/dev/null | xargs)
  
  if [ -z "$PG_HBA_CONF" ]; then
    echo "Could not determine pg_hba.conf location via SQL. Trying common locations..."
    
    # Try common locations for pg_hba.conf
    for loc in "/etc/postgresql/*/main/pg_hba.conf" "/var/lib/postgresql/*/data/pg_hba.conf"; do
      if [ -f $loc ]; then
        PG_HBA_CONF=$loc
        break
      fi
    done
  fi
  
  if [ -z "$PG_HBA_CONF" ] || [ ! -f "$PG_HBA_CONF" ]; then
    echo "✗ Could not locate pg_hba.conf"
    return 1
  fi
  
  echo "Found pg_hba.conf at: $PG_HBA_CONF"
  
  # Create a backup
  echo "Creating backup of pg_hba.conf..."
  sudo cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup.$(date +%Y%m%d%H%M%S)"
  
  # Update the local connections to use md5 authentication
  echo "Updating pg_hba.conf to use md5 authentication..."
  
  # Create a temporary file for the new configuration
  TMP_HBA_CONF="/tmp/pg_hba.conf.tmp"
  
  sudo grep -v "^local\s\+all\s\+all\s\+peer" "$PG_HBA_CONF" | \
  sudo grep -v "^host\s\+all\s\+all\s\+127.0.0.1/32\s\+peer" | \
  sudo grep -v "^host\s\+all\s\+all\s\+::1/128\s\+peer" > "$TMP_HBA_CONF"
  
  # Add new rules using md5 authentication
  echo "# Modified for project authentication" | sudo tee -a "$TMP_HBA_CONF"
  echo "local   all             all                                     md5" | sudo tee -a "$TMP_HBA_CONF"
  echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a "$TMP_HBA_CONF"
  echo "host    all             all             ::1/128                 md5" | sudo tee -a "$TMP_HBA_CONF"
  
  # Replace the old file with the new one
  sudo mv "$TMP_HBA_CONF" "$PG_HBA_CONF"
  sudo chown postgres:postgres "$PG_HBA_CONF"
  sudo chmod 640 "$PG_HBA_CONF"
  
  echo "✓ Updated pg_hba.conf"
  
  # Reload PostgreSQL to apply changes
  echo "Reloading PostgreSQL configuration..."
  sudo systemctl reload postgresql
  
  return 0
}

# Function to create/reset passwords for project database users
setup_database_users() {
  echo "Setting up database users for the project..."
  
  # Create and update passwords
  sudo -u postgres psql -c "CREATE USER \"Aliveadmin\" WITH PASSWORD 'aliveHumans@2024' SUPERUSER;" 2>/dev/null || \
  sudo -u postgres psql -c "ALTER USER \"Aliveadmin\" WITH PASSWORD 'aliveHumans@2024' SUPERUSER;"
  
  # Create database if it doesn't exist
  sudo -u postgres psql -c "CREATE DATABASE \"Alive-Db\" OWNER \"Aliveadmin\";" 2>/dev/null || \
  sudo -u postgres psql -c "ALTER DATABASE \"Alive-Db\" OWNER TO \"Aliveadmin\";"
  
  # Grant privileges
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"Alive-Db\" TO \"Aliveadmin\";"
  
  echo "✓ Database users setup complete"
  return 0
}

# Function to create a .pgpass file for passwordless authentication
create_pgpass() {
  echo "Creating .pgpass file for easier authentication..."
  
  # Get the current user's home directory
  HOME_DIR=$(eval echo "~$USER")
  PGPASS_FILE="$HOME_DIR/.pgpass"
  
  # Create the file or append to it if it exists
  echo "localhost:5432:Alive-Db:Aliveadmin:aliveHumans@2024" > "$PGPASS_FILE"
  echo "127.0.0.1:5432:Alive-Db:Aliveadmin:aliveHumans@2024" >> "$PGPASS_FILE"
  
  # Set correct permissions - .pgpass must be 0600
  chmod 0600 "$PGPASS_FILE"
  
  echo "✓ Created .pgpass file"
  
  echo "Note: You can now connect to the database without entering password:"
  echo "  psql -U Aliveadmin -d \"Alive-Db\""
  
  # Save details to .env file
  ENV_FILE="$SCRIPT_DIR/backend/.env"
  
  if [ -f "$ENV_FILE" ]; then
    # Update existing .env file
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
      sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgres://Aliveadmin:aliveHumans@2024@localhost:5432/Alive-Db|' "$ENV_FILE"
    else
      echo "DATABASE_URL=postgres://Aliveadmin:aliveHumans@2024@localhost:5432/Alive-Db" >> "$ENV_FILE"
    fi
  else
    # Create new .env file
    echo "DATABASE_URL=postgres://Aliveadmin:aliveHumans@2024@localhost:5432/Alive-Db" > "$ENV_FILE"
  fi
  
  echo "✓ Updated database connection in .env file"
}

# Fix directory permissions
fix_directory_permissions() {
  echo "Fixing directory permissions..."
  
  # Make sure the backend directory is accessible
  find "$SCRIPT_DIR/backend" -type d -exec chmod 755 {} \;
  find "$SCRIPT_DIR/backend" -type f -name "*.sh" -exec chmod +x {} \;
  
  echo "✓ Directory permissions fixed"
}

# Create migrations table if it doesn't exist
create_migrations_table() {
  echo "Ensuring migrations table exists..."
  
  psql -U Aliveadmin -d "Alive-Db" -c "
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      name VARCHAR NOT NULL
    );
  " || {
    echo "✗ Failed to create migrations table"
    return 1
  }
  
  echo "✓ Migrations table ready"
  return 0
}

# Main execution
if check_postgres_service; then
  update_pg_hba_conf
  setup_database_users
  create_pgpass
  fix_directory_permissions
  create_migrations_table
  
  echo ""
  echo "====================================="
  echo "  PostgreSQL authentication fixed!"
  echo "====================================="
  echo ""
  echo "You can now run migrations without authentication issues."
  echo "Run: ./run-backend-commands.sh migration:run"
else
  echo "✗ Failed to fix PostgreSQL authentication"
  echo "Please make sure PostgreSQL is installed and can be started."
fi