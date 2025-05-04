const fs = require('fs');
const path = require('path');

// Constants
const BACKEND_DIR = path.join(__dirname, '..', '..', '..', '..', 'backend');
const SERVICE_PATH = path.join(
  BACKEND_DIR,
  'src',
  'game',
  'services',
  'game-achievements.service.ts'
);
const BACKUP_PATH = `${SERVICE_PATH}.bak`;

// Snake case to camel case conversion
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Check if the file exists
if (!fs.existsSync(SERVICE_PATH)) {
  console.error(`Error: File not found at ${SERVICE_PATH}`);
  process.exit(1);
}

console.log(`Starting fixes for game-achievements.service.ts file...`);

// Create a backup of the original file
console.log('Creating backup...');
fs.copyFileSync(SERVICE_PATH, BACKUP_PATH);
console.log(`Backup created at ${BACKUP_PATH}`);

// Read file content
console.log('Reading file content...');
let content = fs.readFileSync(SERVICE_PATH, 'utf8');
const originalContent = content;

// List of snake_case properties that need to be replaced with camelCase
const snakeCaseProps = [
  'user_id',
  'achievement_id',
  'achievement_type',
  'unlocked_at',
  'points_awarded',
  'is_unlocked',
  'is_active',
];

// Fix entity class name references (remove Entity suffix)
const entityFixReplacements = [
  {
    pattern: /GameAchievementEntity/g,
    replacement: 'GameAchievement'
  },
  {
    pattern: /UserAchievementEntity/g,
    replacement: 'UserAchievement'
  }
];

// Fix repository injection and usage patterns
const repositoryFixReplacements = [
  {
    pattern: /@InjectRepository\(GameAchievementEntity\)/g,
    replacement: '@InjectRepository(GameAchievement)'
  },
  {
    pattern: /@InjectRepository\(UserAchievementEntity\)/g,
    replacement: '@InjectRepository(UserAchievement)'
  }
];

// Specific method and property pattern replacements
const specificReplacements = [
  // Fix property access patterns
  {
    pattern: /achievement\.achievement_type/g,
    replacement: 'achievement.achievementType'
  },
  {
    pattern: /userAchievement\.unlocked_at/g,
    replacement: 'userAchievement.unlockedAt'
  },
  {
    pattern: /userAchievement\.points_awarded/g,
    replacement: 'userAchievement.pointsAwarded'
  },
  {
    pattern: /userAchievement\.is_unlocked/g,
    replacement: 'userAchievement.isUnlocked'
  },
  // Fix TypeORM query patterns
  {
    pattern: /\.findOne\({ where: { achievement_id:/g,
    replacement: '.findOne({ where: { achievementId:'
  },
  {
    pattern: /\.findOne\({ where: { user_id:/g,
    replacement: '.findOne({ where: { userId:'
  },
  {
    pattern: /\.find\({ where: { user_id:/g,
    replacement: '.find({ where: { userId:'
  },
  // Fix achievement event parameters
  {
    pattern: /new AchievementUnlockedEvent\(([^)]*)\)/g,
    replacement: (match, params) => {
      // Convert any snake_case parameter names to camelCase in the event constructor
      return match
        .replace(/user_id:/g, 'userId:')
        .replace(/achievement_id:/g, 'achievementId:')
        .replace(/achievement_type:/g, 'achievementType:')
        .replace(/unlocked_at:/g, 'unlockedAt:')
        .replace(/points_awarded:/g, 'pointsAwarded:');
    }
  }
];

// Entity creation and update fixes
const createMethodFixes = [
  // Fix userAchievementRepository.create() parameters
  {
    pattern: /userAchievementRepository\.create\({[\s\S]*?}\)/g,
    replacement: (match) => {
      return match
        .replace(/user_id:/g, 'userId:')
        .replace(/achievement_id:/g, 'achievementId:')
        .replace(/unlocked_at:/g, 'unlockedAt:')
        .replace(/points_awarded:/g, 'pointsAwarded:')
        .replace(/is_unlocked:/g, 'isUnlocked:');
    }
  },
  // Fix achievementRepository.create() parameters
  {
    pattern: /achievementRepository\.create\({[\s\S]*?}\)/g,
    replacement: (match) => {
      return match
        .replace(/achievement_type:/g, 'achievementType:')
        .replace(/is_active:/g, 'isActive:');
    }
  }
];

// Fix DTO mapping in return objects
const dtoMappingFixes = [
  {
    pattern: /(return|map\s*\(\s*achievement\s*=>\s*)\(\s*{[\s\S]*?achievement_type:\s*achievement\.achievement_type[\s\S]*?}\s*\)/g,
    replacement: (match) => {
      return match
        .replace(/achievement_type:\s*achievement\.achievement_type/g, 'achievementType: achievement.achievementType');
    }
  },
  {
    pattern: /(return|map\s*\(\s*userAchievement\s*=>\s*)\(\s*{[\s\S]*?unlocked_at:\s*userAchievement\.unlocked_at[\s\S]*?}\s*\)/g,
    replacement: (match) => {
      return match
        .replace(/unlocked_at:\s*userAchievement\.unlocked_at/g, 'unlockedAt: userAchievement.unlockedAt')
        .replace(/points_awarded:\s*userAchievement\.points_awarded/g, 'pointsAwarded: userAchievement.pointsAwarded')
        .replace(/is_unlocked:\s*userAchievement\.is_unlocked/g, 'isUnlocked: userAchievement.isUnlocked');
    }
  }
];

// Apply the fixes
console.log('Fixing entity class name references...');
entityFixReplacements.forEach(replacement => {
  content = content.replace(replacement.pattern, replacement.replacement);
});

console.log('Fixing repository injections...');
repositoryFixReplacements.forEach(replacement => {
  content = content.replace(replacement.pattern, replacement.replacement);
});

console.log('Replacing snake_case properties with camelCase...');
// 1. Replace general snake_case property accesses with camelCase
snakeCaseProps.forEach(prop => {
  const camelProp = snakeToCamel(prop);
  const propPattern = new RegExp(`\\b${prop}\\b`, 'g');
  
  content = content.replace(propPattern, match => {
    // Skip if it's in a string literal
    const pos = content.lastIndexOf(match);
    if (pos >= 0) {
      const prevChar = content.charAt(pos - 1);
      if (prevChar === "'" || prevChar === '"') {
        return match;
      }
    }
    
    return camelProp;
  });
});

// 2. Apply specific targeted replacements
specificReplacements.forEach(replacement => {
  content = content.replace(replacement.pattern, replacement.replacement);
});

// 3. Fix entity creation with proper camelCase properties
createMethodFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 4. Fix DTO mappings
dtoMappingFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 5. Fix import statements
content = content.replace(
  /import {[\s\S]*?} from ['"]\.\.\/entities\/[^'"]+['"]/g,
  match => {
    return match
      .replace(/GameAchievementEntity/g, 'GameAchievement')
      .replace(/UserAchievementEntity/g, 'UserAchievement');
  }
);

// 6. Update repository types in constructor
content = content.replace(
  /private readonly (\w+)Repository: Repository<(\w+)Entity>/g,
  'private readonly $1Repository: Repository<$2>'
);

// Check and fix AchievementUnlockedEvent imports
if (content.includes('AchievementUnlockedEvent') && !content.includes('import { AchievementUnlockedEvent }')) {
  content = content.replace(
    /import {/,
    'import { AchievementUnlockedEvent } from \'../events/achievement-unlocked.event\';\nimport {'
  );
}

// Save the file if changes were made
if (content !== originalContent) {
  console.log('Saving fixed file...');
  fs.writeFileSync(SERVICE_PATH, content);
  console.log(`✅ Successfully fixed game-achievements.service.ts file`);

  // Stats about replacements
  const replacementsMade = content.split('\n').length - originalContent.split('\n').length;
  console.log(`Made approximately ${replacementsMade} changes`);
} else {
  console.log('⚠️ No changes were needed in the file');
}

console.log('Done!');