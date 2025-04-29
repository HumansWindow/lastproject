#!/bin/bash

# Function to handle errors
handle_error() {
  echo "ERROR: $1"
  exit 1
}

# Set environment variable to disable pager in PostgreSQL
export PAGER=

echo "==== PostgreSQL Password Reset Tool ===="
echo "This script will help you reset PostgreSQL user passwords"

# Check PostgreSQL service status without paging
echo -e "\nChecking PostgreSQL service status..."
sudo service postgresql status | cat

# Check if PostgreSQL is accepting connections
echo -e "\nChecking if PostgreSQL is accepting connections..."
sudo pg_isready || {
  echo "PostgreSQL is not accepting connections. Starting PostgreSQL clusters...";
  sudo pg_ctlcluster 14 main start || sudo pg_ctlcluster 16 main start || sudo pg_ctlcluster 12 main start || handle_error "Failed to start PostgreSQL cluster";
}

# List PostgreSQL clusters
echo -e "\nListing PostgreSQL clusters..."
pg_lsclusters

# Try a simple psql connection first
echo -e "\nTesting basic psql connection..."
sudo -u postgres psql -c "SELECT version();" || handle_error "Cannot connect to PostgreSQL server"

# Reset postgres user password
echo -e "\nResetting postgres user password..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || handle_error "Failed to reset postgres user password"

# Create or reset Aliveadmin user
echo -e "\nCreating or resetting Aliveadmin user..."
sudo -u postgres psql -c "DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'Aliveadmin') THEN
    ALTER USER \"Aliveadmin\" WITH PASSWORD 'new_password';
  ELSE
    CREATE USER \"Aliveadmin\" WITH PASSWORD 'new_password' CREATEDB;
  END IF;
END
\$\$;" || handle_error "Failed to create/reset Aliveadmin user"

# Show user list
echo -e "\nListing all PostgreSQL users..."
sudo -u postgres psql -c "\du"

# Create or reset Alive-Db database
echo -e "\nCreating or resetting Alive-Db database..."
sudo -u postgres psql -c "DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_database WHERE datname = 'Alive-Db') THEN
    RAISE NOTICE 'Database Alive-Db already exists';
  ELSE
    CREATE DATABASE \"Alive-Db\" WITH OWNER \"Aliveadmin\";
  END IF;
END
\$\$;" || handle_error "Failed to create/check Alive-Db database"

# Show database list
echo -e "\nListing all databases..."
sudo -u postgres psql -c "\l"

# Grant privileges
echo -e "\nGranting privileges to Aliveadmin on Alive-Db..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"Alive-Db\" TO \"Aliveadmin\";"

# Ensure the user can connect to the database
echo -e "\nEnsuring Aliveadmin can connect to Alive-Db..."
sudo -u postgres psql -c "ALTER USER \"Aliveadmin\" WITH LOGIN;"

# Update the pg_hba.conf to ensure password authentication is allowed
echo -e "\nChecking PostgreSQL authentication configuration..."
PG_VERSION=$(pg_lsclusters | grep online | head -1 | awk '{print $1}')
PG_CLUSTER=$(pg_lsclusters | grep online | head -1 | awk '{print $2}')
PG_HBA_PATH="/etc/postgresql/$PG_VERSION/$PG_CLUSTER/pg_hba.conf"

echo "PostgreSQL version detected: $PG_VERSION, cluster: $PG_CLUSTER"

# Ensure local connections can use password authentication
if grep -q "^local.*all.*all.*md5" $PG_HBA_PATH; then
  echo "Password authentication for local connections is already enabled."
else
  echo "Updating pg_hba.conf to allow password authentication for local connections..."
  sudo sed -i '/^local.*all.*all.*peer/i local   all             Aliveadmin                                md5' $PG_HBA_PATH
  
  # Reload PostgreSQL to apply the changes
  echo "Reloading PostgreSQL configuration..."
  sudo pg_ctlcluster $PG_VERSION $PG_CLUSTER reload
fi

# Test connection with the new credentials
echo -e "\nTesting connection to Alive-Db with Aliveadmin user..."
PGPASSWORD='new_password' psql -h localhost -U Aliveadmin -d "Alive-Db" -c "SELECT 'Connection successful!' AS status;" || {
  echo "Connection failed. Check the PostgreSQL connection settings:"
  echo "1. Try connecting via socket instead of TCP:"
  PGPASSWORD='new_password' psql -U Aliveadmin -d "Alive-Db" -c "SELECT 'Socket connection successful!' AS status;" || {
    echo "Socket connection failed too. Let's update PostgreSQL authentication method."
    echo "Changing authentication method for Aliveadmin to md5..."
    sudo -u postgres psql -c "ALTER USER \"Aliveadmin\" WITH PASSWORD 'new_password';"
    
    # Show current authentication config
    echo "Current PostgreSQL authentication configuration:"
    sudo grep -v "^#" $PG_HBA_PATH | grep -v "^$"
  }
}

echo -e "\nPassword reset process completed."
echo "Your application should use these credentials:"
echo "DB_USERNAME=Aliveadmin"
echo "DB_PASSWORD=new_password"
echo "DB_DATABASE=Alive-Db"
