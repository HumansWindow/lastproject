/**
 * ID Field Standardization Script
 * 
 * This script helps analyze and fix naming inconsistencies in TypeORM entity files,
 * focusing on standardizing ID field names, UUID usage, and TypeORM decorators.
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = __dirname;
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const SRC_DIR = path.join(BACKEND_DIR, 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const FIX_MODE = process.argv.includes('--fix');

interface EntityIssue {
  file: string;
  line: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
  code?: string;
}

// Track statistics of issues found and fixed
const stats = {
  filesAnalyzed: 0,
  entitiesFound: 0,
  uuidIssuesFound: 0,
  namingIssuesFound: 0,
  columnIssuesFound: 0,
  issuesFixed: 0,
  issuesSkipped: 0
};

// RegExp patterns to identify common issues
const PATTERNS = {
  entityDeclaration: /@Entity\s*\(\s*['"](\w+)['"]\s*\)/,
  primaryKeyId: /@PrimaryGeneratedColumn\s*\(\s*['"]uuid['"]\s*\)\s*(\w+)\s*:\s*string;/,
  nonSnakeCaseColumn: /@Column\s*\(\s*(?!.*name:).*\)\s*((?:user|wallet|device|referrer|profile)[iI]d)\s*:/i,
  inconsistentJoinColumn: /@JoinColumn\s*\(\s*\{?\s*name:\s*['"](\w+)['"].*\}\s*\)\s*(\w+)\s*:/,
  userIdField: /(\w*)user[iI]d\s*:\s*string/i,
  redundantIdField: /(user|wallet|profile|device|referrer)Id.*?,.*?.*?@JoinColumn.*?{.*?name.*?:.*?['"](user|wallet|profile|device|referrer)_id['"].*?}/is,
  idTypeMismatch: /@Column.*?\)\s*(\w+[iI]d)\s*:\s*(?!string|UUID)([\w<>]+)/i,
  inconsistentRelationId: /@(ManyToOne|OneToOne|OneToMany|ManyToMany).*?@JoinColumn.*?name:\s*['"](\w+)['"].*?(\w+):\s*([\w<>]+)/is,
};

/**
 * Find all TypeScript files in the backend src directory
 */
function findTsFiles(): string[] {
  const result: string[] = [];
  
  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.spec.ts')) {
        result.push(filePath);
      }
    }
  }
  
  try {
    if (fs.existsSync(SRC_DIR)) {
      walk(SRC_DIR);
    } else {
      console.error(`Source directory not found: ${SRC_DIR}`);
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
  
  return result;
}

/**
 * Find TypeORM entity files
 */
function findEntityFiles(): string[] {
  try {
    return findTsFiles().filter(file => 
      file.includes('entity.ts') || 
      fs.readFileSync(file, 'utf8').includes('@Entity')
    );
  } catch (error) {
    console.error('Error finding entity files:', error);
    return [];
  }
}

/**
 * Extract entity name from file path
 */
function getEntityNameFromPath(filePath: string): string {
  const fileName = path.basename(filePath, '.entity.ts');
  return fileName.replace(/-/g, '');
}

/**
 * Analyze an entity file for ID field inconsistencies
 */
function analyzeEntityFile(filePath: string): EntityIssue[] {
  const issues: EntityIssue[] = [];
  
  try {
    if (!fs.existsSync(filePath)) {
      return issues;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Entity metadata
    let entityName = '';
    let isSelfReferencing = false;
    let isPluralTable = false;
    
    // Extract entity name from file content or path
    const entityDeclarationMatch = content.match(PATTERNS.entityDeclaration);
    if (entityDeclarationMatch) {
      entityName = entityDeclarationMatch[1];
      stats.entitiesFound++;
      
      // Check if table name is plural
      isPluralTable = entityName.endsWith('s');
      
      // Check if the entity is self-referencing
      const className = path.basename(filePath, '.entity.ts')
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      
      isSelfReferencing = content.includes(`@ManyToOne(() => ${className}`) || 
                         content.includes(`@OneToOne(() => ${className}`);
    } else {
      // Try to derive entity name from file path
      entityName = getEntityNameFromPath(filePath);
    }
    
    // Check each line for potential issues
    lines.forEach((line, index) => {
      // Check for primary key that doesn't match standard
      const primaryKeyMatch = line.match(PATTERNS.primaryKeyId);
      if (primaryKeyMatch && primaryKeyMatch[1] !== 'id') {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: `Non-standard primary key name: ${primaryKeyMatch[1]}`,
          severity: 'high',
          suggestion: 'Rename to standard "id" field',
          code: line.replace(primaryKeyMatch[1], 'id')
        });
      }
      
      // Check for columns that should have explicit name property
      const columnMatch = line.match(PATTERNS.nonSnakeCaseColumn);
      if (columnMatch) {
        const fieldName = columnMatch[1];
        const snakeCaseName = fieldName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        
        issues.push({
          file: filePath,
          line: index + 1,
          issue: `Column without explicit 'name' property: ${fieldName}`,
          severity: 'medium',
          suggestion: `Add 'name' property with snake_case: @Column({ name: '${snakeCaseName}' })`,
          code: line.replace(/@Column\s*\(/, `@Column({ name: '${snakeCaseName}' }`)
        });
        
        stats.namingIssuesFound++;
      }
      
      // Check for inconsistent JoinColumn names
      const joinColumnMatch = line.match(PATTERNS.inconsistentJoinColumn);
      if (joinColumnMatch) {
        const dbColumnName = joinColumnMatch[1];
        const propName = joinColumnMatch[2];
        
        // Check if the property name matches the snake_case convention
        const expectedPropName = dbColumnName.replace(/_([a-z])/g, (_, g1) => g1.toUpperCase());
        if (propName !== expectedPropName && !isSelfReferencing) {
          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Inconsistent JoinColumn property name: DB uses "${dbColumnName}" but prop is "${propName}"`,
            severity: 'medium',
            suggestion: `Consider standardizing to property name "${expectedPropName}"`,
            code: line.replace(new RegExp(`\\b${propName}\\b:`), `${expectedPropName}:`)
          });
          
          stats.namingIssuesFound++;
        }
      }
      
      // Check for ID fields with non-string/UUID types
      const idTypeMismatchMatch = line.match(PATTERNS.idTypeMismatch);
      if (idTypeMismatchMatch) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: `ID field with non-string type: ${idTypeMismatchMatch[1]}: ${idTypeMismatchMatch[2]}`,
          severity: 'high',
          suggestion: `Change type to string for UUID compatibility`,
          code: line.replace(idTypeMismatchMatch[2], 'string')
        });
        
        stats.uuidIssuesFound++;
      }
    });
    
    // Check for redundant ID fields in the entire file content
    const redundantMatch = content.match(PATTERNS.redundantIdField);
    if (redundantMatch && entityName.toLowerCase().includes(redundantMatch[1].toLowerCase())) {
      // Find the line number for this issue
      const searchPattern = new RegExp(redundantMatch[0].split('\n')[0]);
      const lineIndex = lines.findIndex(line => searchPattern.test(line));
      
      if (lineIndex !== -1) {
        issues.push({
          file: filePath,
          line: lineIndex + 1,
          issue: `Potentially redundant ID field in ${entityName} entity: ${redundantMatch[1]}Id`,
          severity: 'low',
          suggestion: 'Consider using a more specific name for self-references (like "referrerId" instead of "userId")'
        });
        
        stats.namingIssuesFound++;
      }
    }
    
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
  }
  
  return issues;
}

/**
 * Apply fixes to an entity file based on identified issues
 */
function applyFixes(filePath: string, issues: EntityIssue[]): boolean {
  if (issues.length === 0 || DRY_RUN) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let changedLines = 0;
    
    // Group issues by line to avoid conflicts
    const issuesByLine = issues.reduce((acc, issue) => {
      const line = issue.line;
      if (!acc[line]) acc[line] = [];
      acc[line].push(issue);
      return acc;
    }, {} as Record<number, EntityIssue[]>);
    
    // Apply fixes in reverse line order
    const lineNumbers = Object.keys(issuesByLine).map(Number).sort((a, b) => b - a);
    
    for (const lineNum of lineNumbers) {
      if (lineNum <= 0 || lineNum > lines.length) continue;
      
      const lineIssues = issuesByLine[lineNum];
      let line = lines[lineNum - 1];
      let lineChanged = false;
      
      for (const issue of lineIssues) {
        if (issue.code) {
          lines[lineNum - 1] = issue.code;
          lineChanged = true;
          stats.issuesFixed++;
        } else {
          stats.issuesSkipped++;
        }
      }
      
      if (lineChanged) {
        changedLines++;
      }
    }
    
    if (changedLines > 0) {
      if (!FIX_MODE) {
        console.log(`Would fix ${changedLines} lines in ${path.basename(filePath)} (run with --fix to apply)`);
        return false;
      } else {
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`✅ Applied ${changedLines} fixes to ${path.basename(filePath)}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error applying fixes to ${filePath}:`, error);
    return false;
  }
}

/**
 * Generate a standardized column name from TS property
 */
function standardizeColumnName(property: string): string {
  // Convert camelCase to snake_case
  return property.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Create report of all issues
 */
function createReport(allIssues: { file: string; issues: EntityIssue[] }[]): void {
  const reportData = {
    date: new Date().toISOString(),
    stats,
    issues: allIssues.map(({ file, issues }) => ({
      file: path.relative(PROJECT_ROOT, file),
      issues: issues.map(({ line, issue, severity, suggestion }) => ({ 
        line, issue, severity, suggestion 
      }))
    })),
    recommendations: [
      "Use 'string' type consistently for all UUID fields",
      "Always include explicit column name with @Column({ name: 'snake_case_name' })",
      "Use descriptive names for self-referencing entities (e.g., 'referrerId' instead of 'userId')",
      "Ensure all relationships use @JoinColumn with explicit column names",
      "For primary keys, consistently use 'id' as the field name"
    ]
  };
  
  const reportFileName = `id-standardization-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  
  // Create a more readable markdown summary
  const mdReportFileName = 'id-standardization-report.md';
  
  const mdContent = `# ID Field Standardization Report
  
Generated on: ${new Date().toLocaleString()}

## Summary

- Files analyzed: ${stats.filesAnalyzed}
- Entities found: ${stats.entitiesFound}
- UUID issues found: ${stats.uuidIssuesFound}
- Naming issues found: ${stats.namingIssuesFound}
- Column issues found: ${stats.columnIssuesFound}
- Issues fixed: ${stats.issuesFixed}
- Issues requiring manual attention: ${stats.issuesSkipped}

## Issues by Entity

${allIssues.map(({ file, issues }) => `
### ${path.basename(file)}

${issues.map(issue => `- **${issue.severity.toUpperCase()}** (Line ${issue.line}): ${issue.issue}
  ${issue.suggestion ? `  - Suggestion: ${issue.suggestion}` : ''}`).join('\n')}
`).join('\n')}

## Recommendations

1. Use 'string' type consistently for all UUID fields
2. Always include explicit column name with @Column({ name: 'snake_case_name' })
3. Use descriptive names for self-referencing entities (e.g., 'referrerId' instead of 'userId')
4. Ensure all relationships use @JoinColumn with explicit column names
5. For primary keys, consistently use 'id' as the field name

## Next Steps

- Run the script with --fix flag to automatically apply simple fixes
- Manually review and address more complex issues
- Run TypeScript compiler to ensure no new errors were introduced
- Update services and controllers that might be affected by naming changes
- Create and test database migrations for any column renames
`;

  fs.writeFileSync(mdReportFileName, mdContent);
  console.log(`📝 Reports generated:
- ${reportFileName} (detailed JSON)
- ${mdReportFileName} (readable summary)`);
}

/**
 * Main function to run the script
 */
function main() {
  console.log(`
🔍 ID Field Standardization Tool ${DRY_RUN ? '(DRY RUN)' : FIX_MODE ? '(FIX MODE)' : '(ANALYSIS MODE)'}
=============================================
This tool analyzes TypeORM entity files to identify and fix
naming inconsistencies related to ID fields.
`);
  
  // Check that source directory exists
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }
  
  const entityFiles = findEntityFiles();
  console.log(`Found ${entityFiles.length} entity files to analyze`);
  
  if (entityFiles.length === 0) {
    console.warn('⚠️ No entity files found. Check if the path is correct.');
    process.exit(0);
  }
  
  let allIssues: { file: string; issues: EntityIssue[] }[] = [];
  
  // Analyze all files first
  for (const file of entityFiles) {
    const issues = analyzeEntityFile(file);
    stats.filesAnalyzed++;
    
    if (issues.length > 0) {
      allIssues.push({ file, issues });
      
      if (VERBOSE) {
        console.log(`\n📄 ${path.basename(file)}`);
        issues.forEach(issue => {
          console.log(`  Line ${issue.line} [${issue.severity}]: ${issue.issue}`);
          if (issue.suggestion) console.log(`    Suggestion: ${issue.suggestion}`);
        });
      }
    }
  }
  
  // Then apply fixes if requested
  if (FIX_MODE) {
    console.log('\nApplying fixes...');
    for (const { file, issues } of allIssues) {
      applyFixes(file, issues);
    }
  }
  
  // Print summary
  console.log('\n📊 Summary');
  console.log(`Files analyzed: ${stats.filesAnalyzed}`);
  console.log(`Entities found: ${stats.entitiesFound}`);
  console.log(`UUID issues found: ${stats.uuidIssuesFound}`);
  console.log(`Naming issues found: ${stats.namingIssuesFound}`);
  console.log(`Column issues found: ${stats.columnIssuesFound}`);
  
  if (FIX_MODE) {
    console.log(`Issues fixed: ${stats.issuesFixed}`);
    console.log(`Issues skipped (need manual attention): ${stats.issuesSkipped}`);
  }
  
  // Create the report files
  createReport(allIssues);
  
  // Instructions for next steps
  if (DRY_RUN) {
    console.log('\n⚠️ This was a dry run. No files were modified.');
    console.log('Run with --fix to apply the suggested fixes.');
  } else if (!FIX_MODE) {
    console.log('\nTo apply the suggested fixes, run:');
    console.log('  ts-node fix-id-standardization.ts --fix');
  }
}

// Run the script
main();