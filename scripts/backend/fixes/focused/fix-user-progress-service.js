const fs = require('fs');
const path = require('path');

// Constants
const BACKEND_DIR = path.join(__dirname, '..', '..', '..', '..', 'backend');
const USER_PROGRESS_SERVICE_PATH = path.join(
  BACKEND_DIR,
  'src',
  'game',
  'services',
  'user-progress.service.ts'
);
const BACKUP_PATH = `${USER_PROGRESS_SERVICE_PATH}.bak`;

// Snake case to camel case conversion
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Check if the file exists
if (!fs.existsSync(USER_PROGRESS_SERVICE_PATH)) {
  console.error(`Error: File not found at ${USER_PROGRESS_SERVICE_PATH}`);
  process.exit(1);
}

console.log(`Starting fixes for user-progress.service.ts file...`);

// Create a backup of the original file
console.log('Creating backup...');
fs.copyFileSync(USER_PROGRESS_SERVICE_PATH, BACKUP_PATH);
console.log(`Backup created at ${BACKUP_PATH}`);

// Read file content
console.log('Reading file content...');
let content = fs.readFileSync(USER_PROGRESS_SERVICE_PATH, 'utf8');
const originalContent = content;

// List of snake_case properties that need to be replaced with camelCase
const snakeCaseProps = [
  'user_id',
  'module_id',
  'section_id',
  'started_at',
  'completed_at',
  'updated_at',
  'checkpoint_type',
  'progress_id',
  'is_active',
  'order_index',
  'is_completed',
];

// Define more specific replacement patterns for problematic constructs
const specificReplacements = [
  // Replace specific property patterns with camelCase in UserProgress and related entities
  {
    pattern: /progress\.started_at/g,
    replacement: 'progress.startedAt'
  },
  {
    pattern: /progress\.completedAt/g, // Already camelCase but keeping for consistency check
    replacement: 'progress.completedAt'
  },
  {
    pattern: /progress\.status/g, // Already camelCase but keeping for consistency check
    replacement: 'progress.status'
  },
  {
    pattern: /checkpoint\.checkpoint_type/g,
    replacement: 'checkpoint.checkpointType'
  },
  {
    pattern: /checkpoint\.completedAt/g, // Already camelCase but keeping for consistency check
    replacement: 'checkpoint.completedAt'
  },
  {
    pattern: /\.progress_id/g,
    replacement: '.progressId'
  },
  // Fix TypeORM query where clauses with camelCase properties
  {
    pattern: /where: {\s*userId: userId,\s*moduleId: moduleId,\s*section_id: ([\w\s\(\)?.|&]+)}/g,
    replacement: 'where: { userId: userId, moduleId: moduleId, sectionId: $1}'
  },
  {
    pattern: /where: {\s*user_id: userId,\s*module_id: moduleId,\s*section_id: ([\w\s\(\)?.|&]+)}/g,
    replacement: 'where: { userId: userId, moduleId: moduleId, sectionId: $1}'
  },
  {
    pattern: /where: {\s*progress_id: progress.id,\s*checkpoint_type: checkpointType\s*}/g,
    replacement: 'where: { progressId: progress.id, checkpointType: checkpointType }'
  },
  // Fix repository method parameter naming
  {
    pattern: /this\.checkpointRepository\.findOne\({\s*where: {\s*progress_id: /g,
    replacement: 'this.checkpointRepository.findOne({\n      where: { progressId: '
  },
];

// Property replacement in functions and methods
console.log('Replacing snake_case properties with camelCase...');

// 1. Replace general snake_case property accesses with camelCase
snakeCaseProps.forEach(prop => {
  const camelProp = snakeToCamel(prop);
  const propPattern = new RegExp(`\\b${prop}\\b`, 'g');
  
  content = content.replace(propPattern, match => {
    // Skip if it's in a string literal
    const pos = content.indexOf(match);
    const prevChar = content.charAt(pos - 1);
    if (prevChar === "'" || prevChar === '"') {
      return match;
    }
    
    return camelProp;
  });
});

// 2. Apply specific targeted replacements
specificReplacements.forEach(replacement => {
  content = content.replace(replacement.pattern, replacement.replacement);
});

// 3. Fix entity creation with proper camelCase properties
content = content.replace(
  /this\.userProgressRepository\.create\({[\s\S]*?}\);/g,
  match => {
    return match
      .replace(/user_id: /g, 'userId: ')
      .replace(/module_id: /g, 'moduleId: ')
      .replace(/section_id: /g, 'sectionId: ')
      .replace(/started_at: /g, 'startedAt: ');
  }
);

content = content.replace(
  /this\.checkpointRepository\.create\({[\s\S]*?}\);/g,
  match => {
    return match
      .replace(/progress_id: /g, 'progressId: ')
      .replace(/checkpoint_type: /g, 'checkpointType: ');
  }
);

// 4. Fix TypeORM Query Builder and FindOptions
content = content.replace(
  /findOne\(\{\s*where: {[\s\S]*?}\s*\}\)/g,
  match => {
    return match
      .replace(/user_id: /g, 'userId: ')
      .replace(/module_id: /g, 'moduleId: ')
      .replace(/section_id: /g, 'sectionId: ')
      .replace(/checkpoint_type: /g, 'checkpointType: ')
      .replace(/progress_id: /g, 'progressId: ');
  }
);

content = content.replace(
  /find\(\{\s*where: {[\s\S]*?}\s*\}\)/g,
  match => {
    return match
      .replace(/user_id: /g, 'userId: ')
      .replace(/module_id: /g, 'moduleId: ')
      .replace(/section_id: /g, 'sectionId: ')
      .replace(/checkpoint_type: /g, 'checkpointType: ')
      .replace(/progress_id: /g, 'progressId: ');
  }
);

// 5. Fix return object mapping from UserProgress to DTO
content = content.replace(
  /return {[\s\S]*?userId: savedProgress\.userId,[\s\S]*?moduleId: savedProgress\.moduleId,[\s\S]*?sectionId: savedProgress\.sectionId,[\s\S]*?status: savedProgress\.status[\s\S]*?startedAt: savedProgress\.started_at,[\s\S]*?completedAt: savedProgress\.completedAt,[\s\S]*?updatedAt: savedProgress\.updatedAt[\s\S]*?};/g,
  match => {
    return match.replace(/startedAt: savedProgress\.started_at,/g, 'startedAt: savedProgress.startedAt,');
  }
);

// 6. Fix response transformation for module progress
content = content.replace(
  /startedAt: progressRecord\?\.started_at,/g, 
  'startedAt: progressRecord?.startedAt,'
);
content = content.replace(
  /startedAt: sectionProgress\?\.started_at,/g, 
  'startedAt: sectionProgress?.startedAt,'
);

// 7. Fix checkpoints array mapping
content = content.replace(
  /checkpointType: cp\.checkpoint_type,/g,
  'checkpointType: cp.checkpointType,'
);

// 8. Fix more specific ProgressStatus references
content = content.replace(/"in_progress"/g, 'ProgressStatus.IN_PROGRESS');
content = content.replace(/"completed"/g, 'ProgressStatus.COMPLETED');
content = content.replace(/"not_started"/g, 'ProgressStatus.NOT_STARTED');

// 9. Fix entity creation fixes 
content = content.replace(
  /this\.userProgressRepository\.create\({[\s\S]*?started_at: new Date\(\)[\s\S]*?}\)/g,
  match => {
    return match.replace(/started_at: /g, 'startedAt: ');
  }
);

content = content.replace(
  /progress\.started_at = new Date\(\);/g,
  'progress.startedAt = new Date();'
);

// 10. Fix UpdateProgressDto issue
content = content.replace(
  /UpdateProgressDto/g,
  'UpdateUserProgressDto'
);

// Save the file if changes were made
if (content !== originalContent) {
  console.log('Saving fixed file...');
  fs.writeFileSync(USER_PROGRESS_SERVICE_PATH, content);
  console.log(`✅ Successfully fixed user-progress.service.ts file`);

  // Stats about replacements
  const replacementsMade = content.split('\n').length - originalContent.split('\n').length;
  console.log(`Made approximately ${replacementsMade} changes`);
} else {
  console.log('⚠️ No changes were needed in the file');
}

console.log('Done!');