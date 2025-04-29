#!/bin/bash
# Database Trigger Audit Script
# Created: April 26, 2025
# This script checks for inconsistencies in database trigger naming conventions

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
  echo "Error: Missing required environment variables."
  echo "Please make sure DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD are set."
  exit 1
fi

# Create a temporary file for the SQL script
TEMP_FILE=$(mktemp)

# Write the SQL script to audit triggers
cat > "$TEMP_FILE" << 'EOSQL'
-- SQL script to audit database triggers for naming inconsistencies

-- Create temporary table to store audit results
CREATE TEMP TABLE trigger_audit_results (
    issue_type VARCHAR(50),
    schema_name VARCHAR(50),
    table_name VARCHAR(100),
    trigger_name VARCHAR(100),
    function_name VARCHAR(100),
    issue_description TEXT
);

-- Audit trigger naming conventions
INSERT INTO trigger_audit_results
SELECT 
    'NAMING_CONVENTION' AS issue_type,
    t.trigger_schema AS schema_name,
    t.event_object_table AS table_name,
    t.trigger_name,
    p.proname AS function_name,
    'Trigger name does not follow snake_case convention (trigger_action_table)' AS issue_description
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_schema = 'public'
AND t.trigger_name !~ '^trigger_[a-z_]+$'
AND t.trigger_name !~ '^RI_ConstraintTrigger';

-- Audit function naming conventions
INSERT INTO trigger_audit_results
SELECT 
    'NAMING_CONVENTION' AS issue_type,
    t.trigger_schema AS schema_name,
    t.event_object_table AS table_name,
    t.trigger_name,
    p.proname AS function_name,
    'Function name does not follow snake_case convention' AS issue_description
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_schema = 'public'
AND p.proname !~ '^[a-z_]+$'
AND p.proname !~ '^RI_FKey';

-- Audit for potential camelCase/snake_case inconsistencies in function bodies
INSERT INTO trigger_audit_results
SELECT DISTINCT
    'FIELD_REFERENCE' AS issue_type,
    t.trigger_schema AS schema_name,
    t.event_object_table AS table_name,
    t.trigger_name,
    p.proname AS function_name,
    'Function may reference camelCase field names (contains "Id")' AS issue_description
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
JOIN pg_proc p ON p.oid = pt.tgfoid
WHERE t.trigger_schema = 'public'
AND (
    -- Look for potential camelCase field references
    pg_get_functiondef(p.oid) LIKE '%"userId"%'
    OR pg_get_functiondef(p.oid) LIKE '%NEW."userId"%'
    OR pg_get_functiondef(p.oid) LIKE '%OLD."userId"%'
    OR pg_get_functiondef(p.oid) LIKE '%"deviceId"%'
    OR pg_get_functiondef(p.oid) LIKE '%"profileId"%'
    OR pg_get_functiondef(p.oid) LIKE '%"walletId"%'
    OR pg_get_functiondef(p.oid) LIKE '%"sessionId"%'
    OR pg_get_functiondef(p.oid) LIKE '%"createdAt"%'
    OR pg_get_functiondef(p.oid) LIKE '%"updatedAt"%'
    OR pg_get_functiondef(p.oid) LIKE '%"expiresAt"%'
);

-- Output results with table headers
SELECT 
    '=== DATABASE TRIGGER AUDIT RESULTS ===' AS "";

-- Print the general statistics
SELECT 
    COUNT(*) AS "Total Triggers",
    COUNT(DISTINCT event_object_table) AS "Tables with Triggers"
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Print the trigger audit results if any issues found
SELECT 
    issue_type AS "Issue Type",
    table_name AS "Table",
    trigger_name AS "Trigger",
    function_name AS "Function",
    issue_description AS "Description"
FROM trigger_audit_results
ORDER BY table_name, trigger_name;

-- If no issues found, show success message
SELECT 
    CASE WHEN COUNT(*) = 0 
        THEN 'No issues found. All database triggers follow naming conventions.'
        ELSE 'Issues found! Please fix the reported problems.'
    END AS "Audit Status"
FROM trigger_audit_results;
EOSQL

# Execute the SQL script and format the output
echo "Running database trigger audit..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$TEMP_FILE" -X --pset="expanded=auto" --pset="border=2"

# Check for issues and set exit code
ISSUE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM trigger_audit_results;")
if [ "$ISSUE_COUNT" -gt 0 ]; then
    echo "⚠️  Found $ISSUE_COUNT issues with database triggers. See above for details."
    echo "Please fix these issues to ensure database operations work correctly."
    EXIT_CODE=1
else
    echo "✅ All database triggers passed the audit checks."
    EXIT_CODE=0
fi

# Clean up
rm "$TEMP_FILE"
exit $EXIT_CODE