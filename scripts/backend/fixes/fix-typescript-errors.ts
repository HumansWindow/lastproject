import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const BACKEND_DIR = path.join(__dirname, '..', '..', '..', 'backend');
const GAME_MODULE_DIR = path.join(BACKEND_DIR, 'src', 'game');

// Snake case to camel case conversion
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Camel case to snake case conversion
function camelToSnake(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

// Fix entity files by adding proper @Column decorators
function fixEntityFiles() {
  console.log('Fixing entity files...');
  
  // Get all entity files
  const entityFiles = glob.sync('entities/*.entity.ts', { cwd: GAME_MODULE_DIR, absolute: true });
  
  entityFiles.forEach(filePath => {
    console.log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if proper TypeORM import exists
    if (!content.includes('import { Entity, Column') && content.includes('import { Entity')) {
      content = content.replace(
        /import { Entity/,
        'import { Entity, Column'
      );
    } else if (!content.includes('import {')) {
      content = 'import { Entity, Column, PrimaryGeneratedColumn } from \'typeorm\';\n' + content;
    }
    
    // Find properties that need @Column decorators
    const propertyPattern = /(\s+)([a-zA-Z_][a-zA-Z0-9_]*): ([a-zA-Z<>[\]{}|]+);/g;
    const replacedContent = content.replace(propertyPattern, (match, space, propName, type) => {
      // Skip if already has a decorator
      if (content.includes(`@Column(`) && content.includes(`${propName}:`)) {
        return match;
      }
      
      // Skip id field which usually has its own decorator
      if (propName === 'id') {
        return match;
      }
      
      // Generate snake_case version if it's in camelCase
      const hasUppercase = /[A-Z]/.test(propName);
      let dbColumnName = hasUppercase ? camelToSnake(propName) : propName;
      
      // If the property is already snake_case, convert it to camelCase
      const camelPropName = snakeToCamel(propName);
      let newPropName = propName;
      
      if (propName.includes('_')) {
        newPropName = camelPropName;
        dbColumnName = propName; // Keep the original snake_case as column name
      }
      
      // Add @Column decorator
      return `${space}@Column({ name: '${dbColumnName}' })
${space}${newPropName}: ${type};`;
    });
    
    // Save changes if different
    if (content !== replacedContent) {
      // Create backup
      fs.writeFileSync(`${filePath}.bak`, content);
      
      // Write updated file
      fs.writeFileSync(filePath, replacedContent);
      console.log(`  ✅ Updated ${path.basename(filePath)}`);
    } else {
      console.log(`  ⏭️ No changes needed for ${path.basename(filePath)}`);
    }
  });
  
  console.log('Entity files processing completed.');
}

// Fix property access in service files (snake_case to camelCase)
function fixServiceFiles() {
  console.log('\nFixing service files...');
  
  // Get all service files
  const serviceFiles = glob.sync('services/*.service.ts', { cwd: GAME_MODULE_DIR, absolute: true });
  
  // Common snake_case properties to replace
  const snakeCaseProps = [
    'user_id', 'module_id', 'section_id', 'order_index', 'wait_time_hours', 
    'is_active', 'created_at', 'updated_at', 'completed_at', 'section_type',
    'question_text', 'question_type', 'correct_answer', 'user_answer',
    'points_awarded', 'is_correct', 'is_unlocked', 'unlock_date',
    'transaction_hash', 'processed_at', 'prerequisite_module_id',
    'file_path', 'alt_text'
  ];
  
  serviceFiles.forEach(filePath => {
    console.log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace snake_case property access with camelCase
    let hasChanges = false;
    snakeCaseProps.forEach(prop => {
      const camelProp = snakeToCamel(prop);
      const propPattern = new RegExp(`\\b${prop}\\b`, 'g');
      
      // Only replace property access, not string literals
      const tempContent = content.replace(propPattern, match => {
        // Skip if it's in a string literal
        const prevChar = content.charAt(content.lastIndexOf(match) - 1);
        if (prevChar === "'" || prevChar === '"') {
          return match;
        }
        
        hasChanges = true;
        return camelProp;
      });
      
      content = tempContent;
    });
    
    // Fix TypeORM query conditions
    const wherePattern = /where:\s*{\s*([^}]+)\s*}/g;
    content = content.replace(wherePattern, (match) => {
      // Replace snake_case in where conditions
      snakeCaseProps.forEach(prop => {
        const camelProp = snakeToCamel(prop);
        const propPattern = new RegExp(`${prop}\\s*:`, 'g');
        match = match.replace(propPattern, `${camelProp}:`);
      });
      
      hasChanges = true;
      return match;
    });
    
    // Save changes if different from original
    if (hasChanges) {
      // Create backup
      fs.writeFileSync(`${filePath}.bak`, fs.readFileSync(filePath));
      
      // Write updated file
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${path.basename(filePath)}`);
    } else {
      console.log(`  ⏭️ No changes needed for ${path.basename(filePath)}`);
    }
  });
  
  console.log('Service files processing completed.');
}

// Fix repository files
function fixRepositoryFiles() {
  console.log('\nFixing repository files...');
  
  // Get all repository files
  const repoFiles = glob.sync('repositories/*.repository.ts', { cwd: GAME_MODULE_DIR, absolute: true });
  
  repoFiles.forEach(filePath => {
    console.log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix TypeORM method parameters (FindOptions)
    const findOptionsPattern = /find(One|By|Many)Options\s*=\s*{\s*([^}]+)\s*}/g;
    content = content.replace(findOptionsPattern, (match) => {
      // Convert snake_case property names in queries to camelCase
      const snakeCaseProps = [
        'user_id', 'module_id', 'section_id', 'order_index', 'is_active',
        'prerequisite_module_id', 'is_unlocked'
      ];
      
      snakeCaseProps.forEach(prop => {
        const camelProp = snakeToCamel(prop);
        const propPattern = new RegExp(`${prop}\\s*:`, 'g');
        match = match.replace(propPattern, `${camelProp}:`);
      });
      
      return match;
    });
    
    // Save changes if different from original
    if (content !== originalContent) {
      // Create backup
      fs.writeFileSync(`${filePath}.bak`, originalContent);
      
      // Write updated file
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${path.basename(filePath)}`);
    } else {
      console.log(`  ⏭️ No changes needed for ${path.basename(filePath)}`);
    }
  });
  
  console.log('Repository files processing completed.');
}

// Fix DTO files to resolve duplicates and circular references
function fixDtoFiles() {
  console.log('\nFixing DTO files...');
  
  // Get quiz.dto.ts file to fix duplicate SectionQuizResultDto
  const quizDtoPath = path.join(GAME_MODULE_DIR, 'dto', 'quiz.dto.ts');
  
  if (fs.existsSync(quizDtoPath)) {
    console.log('Processing quiz.dto.ts...');
    
    let content = fs.readFileSync(quizDtoPath, 'utf8');
    
    // Find the duplicate class definition
    const dupePattern = /export class SectionQuizResultDto[\s\S]*?}/g;
    const matches = content.match(dupePattern);
    
    if (matches && matches.length > 1) {
      // Keep only the first definition
      let newContent = content;
      let firstMatch = true;
      
      newContent = content.replace(dupePattern, (match) => {
        if (firstMatch) {
          firstMatch = false;
          return match;
        }
        // Remove the duplicate
        return '// Removed duplicate SectionQuizResultDto';
      });
      
      // Create backup and save
      fs.writeFileSync(`${quizDtoPath}.bak`, content);
      fs.writeFileSync(quizDtoPath, newContent);
      console.log('  ✅ Fixed duplicate SectionQuizResultDto');
    } else {
      console.log('  ⏭️ No duplicate SectionQuizResultDto found');
    }
  }
  
  // Fix unlock.dto.ts circular reference
  const unlockDtoPath = path.join(GAME_MODULE_DIR, 'dto', 'unlock.dto.ts');
  
  if (fs.existsSync(unlockDtoPath)) {
    console.log('Processing unlock.dto.ts...');
    
    let content = fs.readFileSync(unlockDtoPath, 'utf8');
    
    // Check for circular reference between classes
    if (content.includes('ModuleUnlockDto') && content.includes('SectionUnlockDto')) {
      // Create a minimal ExpediteUnlockDto if missing
      if (!content.includes('ExpediteUnlockDto')) {
        content += `\n
export class ExpediteUnlockDto {
  @ApiProperty({ description: 'Amount to pay for expediting unlock' })
  @IsNumber()
  amount: number;
  
  @ApiProperty({ description: 'Payment method or token used' })
  @IsString()
  paymentMethod: string;
}`;
        console.log('  ✅ Added missing ExpediteUnlockDto');
      }
      
      // Fix circular reference by moving class definitions
      const moduleUnlockPattern = /export class ModuleUnlockDto[\s\S]*?}/;
      const sectionUnlockPattern = /export class SectionUnlockDto[\s\S]*?}/;
      
      const moduleUnlockMatch = content.match(moduleUnlockPattern);
      const sectionUnlockMatch = content.match(sectionUnlockPattern);
      
      if (moduleUnlockMatch && sectionUnlockMatch) {
        // Find which one references the other first
        const moduleUnlockPos = content.indexOf('export class ModuleUnlockDto');
        const sectionUnlockPos = content.indexOf('export class SectionUnlockDto');
        
        if (moduleUnlockPos < sectionUnlockPos) {
          // Move SectionUnlockDto before ModuleUnlockDto
          content = content.replace(sectionUnlockPattern, '');
          content = content.replace(moduleUnlockPattern, `${sectionUnlockMatch[0]}\n\n${moduleUnlockMatch[0]}`);
        } else {
          // Move ModuleUnlockDto before SectionUnlockDto
          content = content.replace(moduleUnlockPattern, '');
          content = content.replace(sectionUnlockPattern, `${moduleUnlockMatch[0]}\n\n${sectionUnlockMatch[0]}`);
        }
        
        // Create backup and save
        fs.writeFileSync(`${unlockDtoPath}.bak`, fs.readFileSync(unlockDtoPath));
        fs.writeFileSync(unlockDtoPath, content);
        console.log('  ✅ Fixed circular references in unlock.dto.ts');
      }
    }
  }

  // Create missing media.dto.ts if it doesn't exist
  const mediaDtoPath = path.join(GAME_MODULE_DIR, 'dto', 'media.dto.ts');
  if (!fs.existsSync(mediaDtoPath)) {
    console.log('Creating missing media.dto.ts...');
    
    const mediaDtoContent = `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MediaAssetDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSize: number;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateMediaAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;
}

export class UpdateMediaAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;
}

export class MediaFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class PaginatedMediaAssetsDto {
  @ApiProperty({ type: [MediaAssetDto] })
  items: MediaAssetDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SignedUrlDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  expiresAt: Date;
}
`;
    
    fs.writeFileSync(mediaDtoPath, mediaDtoContent);
    console.log('  ✅ Created new media.dto.ts file');
  }
  
  console.log('DTO files processing completed.');
}

// Fix controller files to use correct service and parameter types
function fixControllerFiles() {
  console.log('\nFixing controller files...');
  
  // Get all controller files
  const controllerFiles = glob.sync('controllers/*.controller.ts', { cwd: GAME_MODULE_DIR, absolute: true });
  
  // Fix the ModuleUnlockService issue in module-unlock.controller.ts
  const moduleUnlockControllerPath = path.join(GAME_MODULE_DIR, 'controllers', 'module-unlock.controller.ts');
  
  if (fs.existsSync(moduleUnlockControllerPath)) {
    console.log('Processing module-unlock.controller.ts...');
    
    let content = fs.readFileSync(moduleUnlockControllerPath, 'utf8');
    
    // Add missing import for ModuleUnlockService
    if (!content.includes("import { ModuleUnlockService }")) {
      content = content.replace(
        /import {/,
        "import { ModuleUnlockService } from '../services/module-unlock.service';\nimport {"
      );
      
      // Create backup and save
      fs.writeFileSync(`${moduleUnlockControllerPath}.bak`, fs.readFileSync(moduleUnlockControllerPath));
      fs.writeFileSync(moduleUnlockControllerPath, content);
      console.log('  ✅ Added missing ModuleUnlockService import');
    } else {
      console.log('  ⏭️ ModuleUnlockService import already exists');
    }
  }
  
  console.log('Controller files processing completed.');
}

// Create a log file for the changes made
function createChangeLog(startTime: Date) {
  const logFile = path.join(BACKEND_DIR, 'typescript-error-fixes.log');
  const endTime = new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;
  
  const logContent = `
TypeScript Error Fix Log
========================
Started: ${startTime.toISOString()}
Finished: ${endTime.toISOString()}
Duration: ${duration} seconds

Changes made by the script:
- Entity files processed to add proper column decorators
- Service files updated to use camelCase property access
- Repository files fixed to use correct FindOptions parameters
- Fixed duplicate SectionQuizResultDto in quiz.dto.ts
- Fixed circular references in unlock.dto.ts
- Added missing ExpediteUnlockDto
- Created media.dto.ts if missing
- Fixed ModuleUnlockService import in module-unlock.controller.ts

Next steps:
1. Run TypeScript compiler to check remaining errors: npx tsc --noEmit
2. Fix any remaining errors manually following the patterns used by this script
3. Update entity imports where Entity suffix was removed
`;

  fs.writeFileSync(logFile, logContent);
  console.log(`\nChange log created at: ${logFile}`);
}

// Main execution
try {
  console.log('Starting TypeScript error fix script...\n');
  const startTime = new Date();
  
  // Fix entity files first (most important)
  fixEntityFiles();
  
  // Fix service files
  fixServiceFiles();
  
  // Fix repository files
  fixRepositoryFiles();
  
  // Fix DTO files
  fixDtoFiles();
  
  // Fix controller files
  fixControllerFiles();
  
  // Create change log
  createChangeLog(startTime);
  
  console.log('\n✅ All fixes applied successfully!');
  console.log('Please run "cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend && npx tsc --noEmit" to check for remaining errors.');
} catch (error) {
  console.error('Error while applying fixes:', error);
  process.exit(1);
}