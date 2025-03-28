#!/bin/bash

# PostgreSQL connection info
PG_HOST="localhost"
PG_PORT="5432"
DB_NAME="Alive-Db"
USERNAME="Aliveadmin"
PASSWORD="FbGlTyAhQl#+&}#\`"  # Note the escaped backtick

# Connect to PostgreSQL as postgres user
echo "Creating PostgreSQL user and database..."

# Create the user if it doesn't exist
sudo -u postgres psql -c "CREATE USER \"$USERNAME\" WITH PASSWORD '$PASSWORD';" || echo "User already exists"

# Create the database if it doesn't exist 
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";" || echo "Database already exists"

# Grant privileges to the user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$USERNAME\";"

# Make the user the owner of the database
sudo -u postgres psql -c "ALTER DATABASE \"$DB_NAME\" OWNER TO \"$USERNAME\";"

echo "PostgreSQL setup completed!"
