// Script to analyze and fix ID field inconsistencies in TypeORM entity files
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob'; // We'll need to install this dependency

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const DRY_RUN = process.argv.includes('--dry-run'); // Use --dry-run to preview changes without applying them
const VERBOSE = process.argv.includes('--verbose'); // Use --verbose for more detailed output

interface EntityIssue {
  file: string;
  line: number;
  issue: string;
  suggestion?: string;
}

// Track stats of issues found and fixed
const stats = {
  filesAnalyzed: 0,
  entitiesFound: 0,
  issuesDetected: 0,
  issuesFixed: 0,
  skipped: 0,
};

// Regex patterns to identify issues
const PATTERNS = {
  entityDeclaration: /@Entity\s*\(\s*['"](\w+)['"]\s*\)/,
  primaryKeyId: /@PrimaryGeneratedColumn\s*\(\s*['"]uuid['"]\s*\)\s*(\w+)\s*:\s*string;/,
  nonSnakeCaseColumn: /@Column\s*\(\s*(?!.*name:).*\)\s*(user[iI]d|[a-z]+[A-Z][a-z]*[iI]d)\s*:/,
  inconsistentJoinColumn: /@JoinColumn\s*\(\s*\{?\s*name:\s*['"](\w+)['"].*\}\s*\)\s*(\w+)\s*:/,
  userIdField: /(\w*)user[iI]d\s*:\s*string/i,
  redundantIdField: /(user|wallet|profile)Id.*?,.*?.*?@JoinColumn.*?{.*?name.*?:.*?['"](user|wallet|profile)_id['"].*?}/is,
};

/**
 * Find all TypeORM entity files in the project
 */
function findEntityFiles(): string[] {
  try {
    // Find all *.entity.ts files in the src directory
    const files = glob.sync('**/*.entity.ts', { cwd: SRC_DIR });
    return files.map(file => path.join(SRC_DIR, file));
  } catch (error) {
    console.error('Error finding entity files:', error);
    return [];
  }
}

/**
 * Analyze an entity file for ID field inconsistencies
 */
function analyzeEntityFile(filePath: string): EntityIssue[] {
  const issues: EntityIssue[] = [];
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return issues;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Track entity name to check for related issues
    let entityName = '';
    
    // Track if this is a self-referencing entity (like User)
    let isSelfReferencing = false;
    
    // Check each line for potential issues
    lines.forEach((line, index) => {
      // Extract entity name if this is an @Entity declaration
      const entityMatch = line.match(PATTERNS.entityDeclaration);
      if (entityMatch) {
        entityName = entityMatch[1];
        stats.entitiesFound++;
        
        // Check if the entity name is mentioned again in relationships
        isSelfReferencing = content.includes(`@ManyToOne(() => ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`) || 
                           content.includes(`@OneToOne(() => ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`);
      }
      
      // Check for primary key that doesn't match our standard
      const primaryKeyMatch = line.match(PATTERNS.primaryKeyId);
      if (primaryKeyMatch && primaryKeyMatch[1] !== 'id') {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: `Non-standard primary key name: ${primaryKeyMatch[1]}`,
          suggestion: 'Rename to standard "id" field'
        });
      }
      
      // Check for columns that should have name property
      const columnMatch = line.match(PATTERNS.nonSnakeCaseColumn);
      if (columnMatch) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: `Column without explicit 'name' property: ${columnMatch[1]}`,
          suggestion: `Add 'name' property with snake_case: @Column({ name: '${columnMatch[1].replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}' })`
        });
      }
      
      // Check for inconsistent JoinColumn names
      const joinColumnMatch = line.match(PATTERNS.inconsistentJoinColumn);
      if (joinColumnMatch) {
        const dbColumnName = joinColumnMatch[1];
        const propName = joinColumnMatch[2];
        
        // Check if the property name matches the snake_case convention
        const expectedPropName = dbColumnName.replace(/_([a-z])/g, (match, g1) => g1.toUpperCase());
        if (propName !== expectedPropName && !isSelfReferencing) {
          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Inconsistent JoinColumn property name: DB uses "${dbColumnName}" but prop is "${propName}"`,
            suggestion: `Consider standardizing to property name "${expectedPropName}"`
          });
        }
      }
    });
    
    // Check for redundant ID fields in the entire file content
    const redundantMatch = content.match(PATTERNS.redundantIdField);
    if (redundantMatch && entityName.toLowerCase() === redundantMatch[1].toLowerCase()) {
      issues.push({
        file: filePath,
        line: 1, // We don't know the exact line, so mark it at the beginning
        issue: `Potentially redundant ID field in ${entityName} entity`,
        suggestion: 'Consider using a more specific name for self-references or checking if this field is needed'
      });
    }
    
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
  }
  
  return issues;
}

/**
 * Apply fixes to an entity file
 */
function applyFixes(filePath: string, issues: EntityIssue[]): void {
  if (issues.length === 0 || DRY_RUN) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Group issues by line to avoid conflicts when making changes
    const issuesByLine = issues.reduce((acc, issue) => {
      const line = issue.line;
      if (!acc[line]) acc[line] = [];
      acc[line].push(issue);
      return acc;
    }, {} as Record<number, EntityIssue[]>);
    
    // Apply the fixes in reverse line order to avoid messing up line numbers
    const lineNumbers = Object.keys(issuesByLine).map(Number).sort((a, b) => b - a);
    
    for (const lineNum of lineNumbers) {
      if (lineNum <= 0 || lineNum > lines.length) continue; // Skip invalid line numbers
      
      const lineIssues = issuesByLine[lineNum];
      let line = lines[lineNum - 1];
      
      for (const issue of lineIssues) {
        if (issue.suggestion) {
          // Apply specific fixes based on the issue type
          if (issue.issue.includes('without explicit')) {
            // Add name property to Column decorator
            const fieldMatch = issue.issue.match(/:\s*(\w+)$/);
            if (fieldMatch && fieldMatch[1]) {
              const snakeCaseName = fieldMatch[1].replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
              line = line.replace(
                /@Column\s*\(/,
                `@Column({ name: '${snakeCaseName}' }`
              );
              stats.issuesFixed++;
            } else {
              stats.skipped++;
            }
          } else if (issue.issue.includes('Inconsistent JoinColumn')) {
            // We'll skip complex JoinColumn fixes for now as they require more context
            stats.skipped++;
          } else {
            // Default case - we can't automatically fix without more specific logic
            stats.skipped++;
          }
        }
      }
      
      lines[lineNum - 1] = line;
    }
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ Applied fixes to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error applying fixes to ${filePath}:`, error);
  }
}

/**
 * Main function to run the script
 */
function main() {
  console.log(`🔍 Analyzing entity files${DRY_RUN ? ' (DRY RUN)' : ''}`);
  
  // Check that src directory exists
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }
  
  const entityFiles = findEntityFiles();
  console.log(`Found ${entityFiles.length} entity files`);
  
  if (entityFiles.length === 0) {
    console.warn('⚠️ No entity files found. Check if the path is correct.');
    process.exit(0);
  }
  
  let allIssues: { file: string; issues: EntityIssue[] }[] = [];
  
  for (const file of entityFiles) {
    const issues = analyzeEntityFile(file);
    stats.filesAnalyzed++;
    
    if (issues.length > 0) {
      stats.issuesDetected += issues.length;
      allIssues.push({ file, issues });
      
      if (VERBOSE) {
        console.log(`\n📄 ${path.relative(SRC_DIR, file)}`);
        issues.forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.issue}`);
          if (issue.suggestion) console.log(`    Suggestion: ${issue.suggestion}`);
        });
      }
      
      if (!DRY_RUN) {
        applyFixes(file, issues);
      }
    }
  }
  
  console.log('\n📊 Summary');
  console.log(`Files analyzed: ${stats.filesAnalyzed}`);
  console.log(`Entities found: ${stats.entitiesFound}`);
  console.log(`Issues detected: ${stats.issuesDetected}`);
  
  if (!DRY_RUN) {
    console.log(`Issues fixed: ${stats.issuesFixed}`);
    console.log(`Issues skipped (need manual attention): ${stats.skipped}`);
  }
  
  // Generate report file
  const report = {
    date: new Date().toISOString(),
    stats,
    issues: allIssues.map(({ file, issues }) => ({
      file: path.relative(SRC_DIR, file),
      issues: issues.map(({ line, issue, suggestion }) => ({ line, issue, suggestion }))
    }))
  };
  
  const reportFileName = `id-consistency-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
  console.log(`\n📝 Report generated: ${reportFileName}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️ This was a dry run. No files were modified. Run without --dry-run to apply fixes.');
  }
}

// Run the script
main();