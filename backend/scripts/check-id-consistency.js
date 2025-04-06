#!/usr/bin/env node

/**
 * Script to validate user ID consistency across the codebase
 * This checks:
 * 1. Database schema for proper UUID columns and naming
 * 2. TypeORM entity configurations for proper mapping
 * 3. Service methods for proper typing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s };

// Configuration
const BASE_PATH = path.resolve(__dirname, '..');
const SRC_PATH = path.join(BASE_PATH, 'src');
const ENTITIES_PATTERN = '**/*.entity.ts';

console.log(chalk.blue('========================================'));
console.log(chalk.blue('      User ID Consistency Checker'));
console.log(chalk.blue('========================================'));

// Check if PostgreSQL is accessible
try {
  console.log('\nChecking database connection...');
  if (process.env.DATABASE_URL) {
    execSync('psql $DATABASE_URL -c "SELECT 1"', { stdio: 'ignore' });
  } else {
    // Try with default credentials if DATABASE_URL is not set
    execSync('psql -U postgres -c "SELECT 1"', { stdio: 'ignore' });
  }
  console.log(chalk.green('✓ Database connection successful'));
} catch (error) {
  console.error(chalk.red('✗ Could not connect to database. Skipping database checks.'));
  console.error('  Make sure PostgreSQL is running and credentials are correct.');
}

// Function to check database schema
async function checkDatabaseSchema() {
  console.log('\nChecking database schema...');
  
  try {
    // Query to find all user_id columns and their types
    const query = `
      SELECT 
        table_name, 
        column_name,
        data_type,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        column_name IN ('user_id', 'userId')
        AND table_schema = 'public'
      ORDER BY 
        table_name, column_name;
    `;
    
    // Execute query
    const result = execSync(`psql -U postgres -t -c "${query}"`, { encoding: 'utf8' });
    
    const issues = [];
    const lines = result.trim().split('\n');
    
    lines.forEach(line => {
      const [tableName, columnName, dataType, isNullable] = line.trim().split('|').map(s => s.trim());
      
      // Check for non-UUID columns
      if (dataType !== 'uuid' && dataType !== 'USER-DEFINED') {
        issues.push(`Table "${tableName}" has column "${columnName}" with non-UUID type: ${dataType}`);
      }
      
      // Check for inconsistent naming (camelCase in database)
      if (columnName === 'userId') {
        issues.push(`Table "${tableName}" uses camelCase "userId" instead of snake_case "user_id"`);
      }
    });
    
    if (issues.length === 0) {
      console.log(chalk.green('✓ All user ID columns in database use consistent naming and UUID type'));
    } else {
      console.log(chalk.red(`✗ Found ${issues.length} database schema issues:`));
      issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log(chalk.yellow('\nRun the standardization migration to fix these issues:'));
      console.log('  npx typeorm migration:run -d src/config/data-source.ts');
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to check database schema:'), error.message);
  }
}

// Function to find and check entity files
function checkEntityFiles() {
  console.log('\nChecking entity files...');
  
  try {
    // Use glob pattern to find all entity files
    const entityFilesCmd = `find ${SRC_PATH} -name "*.entity.ts" | grep -v "node_modules"`;
    const entityFiles = execSync(entityFilesCmd, { encoding: 'utf8' }).trim().split('\n');
    
    const issues = [];
    let entityIssueCount = 0;
    let checkedEntityCount = 0;
    
    entityFiles.forEach(file => {
      if (!file) return;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip files that don't reference users
      if (!content.includes('user') && !content.includes('User')) {
        return;
      }
      
      checkedEntityCount++;
      
      // Check for @Column with userId but without name: 'user_id'
      const hasIncorrectUserIdColumn = 
        /\@Column\([^)]*\)\s+userId\s*:/i.test(content) && 
        !/\@Column\([^)]*name\s*:\s*['"]user_id['"]/i.test(content);
      
      // Check for @JoinColumn with incorrect name
      const hasIncorrectJoinColumn = 
        content.includes('@JoinColumn') && 
        content.includes('user') &&
        !/\@JoinColumn\([^)]*name\s*:\s*['"]user_id['"]/i.test(content);
      
      // Check type annotations for user ID
      const hasNonStringUserIdType = 
        /userId\s*:\s*(number|int|integer)/i.test(content);
      
      if (hasIncorrectUserIdColumn || hasIncorrectJoinColumn || hasNonStringUserIdType) {
        entityIssueCount++;
        const relativePath = path.relative(BASE_PATH, file);
        
        if (hasIncorrectUserIdColumn) {
          issues.push(`Entity ${relativePath}: Missing 'name: "user_id"' in @Column for userId property`);
        }
        
        if (hasIncorrectJoinColumn) {
          issues.push(`Entity ${relativePath}: Missing or incorrect 'name: "user_id"' in @JoinColumn for user relation`);
        }
        
        if (hasNonStringUserIdType) {
          issues.push(`Entity ${relativePath}: Using non-string type for userId property`);
        }
      }
    });
    
    if (issues.length === 0) {
      console.log(chalk.green(`✓ Checked ${checkedEntityCount} entity files - all user ID columns are properly configured`));
    } else {
      console.log(chalk.red(`✗ Found ${entityIssueCount} entities with user ID configuration issues:`));
      issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log(chalk.yellow('\nPlease update these entity files to follow the ID consistency guidelines.'));
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to check entity files:'), error.message);
  }
}

// Function to check service files for proper user ID handling
function checkServiceFiles() {
  console.log('\nChecking service files...');
  
  try {
    // Find service files
    const serviceFilesCmd = `find ${SRC_PATH} -name "*.service.ts" | grep -v "node_modules"`;
    const serviceFiles = execSync(serviceFilesCmd, { encoding: 'utf8' }).trim().split('\n');
    
    const issues = [];
    let serviceIssueCount = 0;
    let checkedServiceCount = 0;
    
    serviceFiles.forEach(file => {
      if (!file) return;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip files that don't reference users
      if (!content.includes('userId') && !content.includes('user_id')) {
        return;
      }
      
      checkedServiceCount++;
      
      // Check for method parameters that accept userId as number
      const hasNumberTypeParam = /function\s+\w+\(\s*.*userId\s*:\s*(number|int|integer)/i.test(content);
      
      // Check for parseInt/Number casting of user IDs
      const hasParseInt = /(parseInt|Number)\s*\(\s*(userId|user_id|["']user_id["'])\s*\)/i.test(content);
      
      // Check for direct comparisons that might not consider types
      const hasLooseComparison = /userId\s*==\s/i.test(content);
      
      if (hasNumberTypeParam || hasParseInt || hasLooseComparison) {
        serviceIssueCount++;
        const relativePath = path.relative(BASE_PATH, file);
        
        if (hasNumberTypeParam) {
          issues.push(`Service ${relativePath}: Method parameter types userId as number instead of string`);
        }
        
        if (hasParseInt) {
          issues.push(`Service ${relativePath}: Converting userId with parseInt() or Number() - should keep as string`);
        }
        
        if (hasLooseComparison) {
          issues.push(`Service ${relativePath}: Using loose equality (==) for userId comparison - use strict equality (===)`);
        }
      }
    });
    
    if (issues.length === 0) {
      console.log(chalk.green(`✓ Checked ${checkedServiceCount} service files - all handle user IDs properly as strings`));
    } else {
      console.log(chalk.red(`✗ Found ${serviceIssueCount} services with user ID handling issues:`));
      issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log(chalk.yellow('\nPlease update these service files to follow the ID consistency guidelines.'));
    }
  } catch (error) {
    console.error(chalk.red('✗ Failed to check service files:'), error.message);
  }
}

// Run all checks
async function runChecks() {
  await checkDatabaseSchema();
  checkEntityFiles();
  checkServiceFiles();
  
  console.log('\nID consistency check completed.');
}

runChecks().catch(error => {
  console.error('Error running ID consistency checks:', error);
  process.exit(1);
});