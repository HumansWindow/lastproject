#!/bin/bash

echo "Fixing PostgreSQL authentication for Aliveadmin user..."

# Find PostgreSQL version and cluster
PG_VERSION=$(pg_lsclusters | grep online | head -1 | awk '{print $1}')
PG_CLUSTER=$(pg_lsclusters | grep online | head -1 | awk '{print $2}')
PG_HBA_PATH="/etc/postgresql/$PG_VERSION/$PG_CLUSTER/pg_hba.conf"

echo "PostgreSQL version: $PG_VERSION, cluster: $PG_CLUSTER"
echo "pg_hba.conf path: $PG_HBA_PATH"

# Add md5 authentication for Aliveadmin
echo "Adding md5 authentication for Aliveadmin..."
sudo bash -c "echo 'local   all             Aliveadmin                                md5' >> $PG_HBA_PATH"
sudo bash -c "echo 'host    all             Aliveadmin          127.0.0.1/32          md5' >> $PG_HBA_PATH"

# Reload PostgreSQL configuration
echo "Reloading PostgreSQL configuration..."
sudo service postgresql reload

echo "Done! Try connecting to the database now."
