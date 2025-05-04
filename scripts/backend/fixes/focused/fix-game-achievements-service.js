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
  'required_points',
  'badge_tier',
  'reward_type',
  'reward_amount',
  'unlocked_at',
  'is_unlocked',
];

// Fix entity class name references (remove Entity suffix)
const entityFixReplacements = [
  {
    pattern: /AchievementEntity/g,
    replacement: 'Achievement'
  },
  {
    pattern: /UserAchievementEntity/g,
    replacement: 'UserAchievement'
  },
];

// Fix repository injection and usage patterns
const repositoryFixReplacements = [
  {
    pattern: /@InjectRepository\(AchievementEntity\)/g,
    replacement: '@InjectRepository(Achievement)'
  },
  {
    pattern: /@InjectRepository\(UserAchievementEntity\)/g,
    replacement: '@InjectRepository(UserAchievement)'
  },
];

// Fix import statements
const importFixes = [
  {
    pattern: /import { AchievementEntity } from ['"]\.\.\/entities\/achievement\.entity['"]/g,
    replacement: 'import { Achievement } from \'../entities/achievement.entity\''
  },
  {
    pattern: /import { UserAchievementEntity } from ['"]\.\.\/entities\/user-achievement\.entity['"]/g,
    replacement: 'import { UserAchievement } from \'../entities/user-achievement.entity\''
  },
];

// Fix achievement DTO mappings
const dtoMappingFixes = [
  // Fix AchievementDto mapping
  {
    pattern: /return achievements\.map\(achievement => \({\s*id: achievement\.id,\s*name: achievement\.name,\s*description: achievement\.description,\s*requiredPoints: achievement\.required_points,\s*iconUrl: achievement\.iconUrl,\s*category: achievement\.category,\s*badgeTier: achievement\.badge_tier,\s*rewardType: achievement\.reward_type,\s*rewardAmount: achievement\.reward_amount\s*}\)\);/g,
    replacement: (match) => {
      return match
        .replace(/required_points/g, 'requiredPoints')
        .replace(/badge_tier/g, 'badgeTier')
        .replace(/reward_type/g, 'rewardType')
        .replace(/reward_amount/g, 'rewardAmount')
        // Add missing properties required by AchievementDto
        .replace('}))', `
      imageUrl: achievement.imageUrl || achievement.iconUrl,
      points: achievement.requiredPoints,
      requirements: achievement.requirements || [],
      isActive: achievement.isActive === undefined ? true : achievement.isActive
    }))`);
    }
  },
  // Fix UserAchievementDto mapping
  {
    pattern: /return allAchievements\.map\(achievement => \{[\s\S]*?const userAchievement[\s\S]*?return \{[\s\S]*?id: achievement\.id,\s*name: achievement\.name,[\s\S]*?isUnlocked: Boolean\(userAchievement\)\s*};[\s\S]*?}\);/g,
    replacement: (match) => {
      return match
        .replace(/requiredPoints: achievement\.required_points/g, 'requiredPoints: achievement.requiredPoints')
        .replace(/badgeTier: achievement\.badge_tier/g, 'badgeTier: achievement.badgeTier')
        .replace(/rewardType: achievement\.reward_type/g, 'rewardType: achievement.rewardType')
        .replace(/rewardAmount: achievement\.reward_amount/g, 'rewardAmount: achievement.rewardAmount')
        .replace(/unlockedAt: userAchievement\?.unlocked_at/g, 'unlockedAt: userAchievement?.unlockedAt')
        // Replace with correct UserAchievementDto properties
        .replace(/name: achievement\.name,[\s\S]*?isUnlocked: Boolean\(userAchievement\)/g, 
          `userId: userId,
        achievementId: achievement.id,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          requiredPoints: achievement.requiredPoints,
          imageUrl: achievement.imageUrl || achievement.iconUrl,
          category: achievement.category,
          badgeTier: achievement.badgeTier,
          rewardType: achievement.rewardType,
          rewardAmount: achievement.rewardAmount,
          points: achievement.requiredPoints,
          requirements: achievement.requirements || [],
          isActive: achievement.isActive === undefined ? true : achievement.isActive
        },
        unlockedAt: userAchievement?.unlockedAt,
        isUnlocked: Boolean(userAchievement)`);
    }
  }
];

// Fix AchievementUnlockDto
const unlockDtoFixes = [
  {
    pattern: /const { achievementId } = unlockDto;/g,
    replacement: 'const { achievement } = unlockDto;'
  },
  {
    pattern: /const achievement = await this\.achievementRepository\.findOne\({\s*where: { id: achievementId }\s*}\);/g,
    replacement: 'const achievement = await this.achievementRepository.findOne({\n      where: { id: achievement }\n    });'
  },
];

// Fix AchievementUnlockedEvent creation
const eventFixes = [
  {
    pattern: /const event = new AchievementUnlockedEvent\(\);[\s\S]*?event\.userId = userId;[\s\S]*?event\.achievementId = achievementId;[\s\S]*?event\.rewardType = achievement\.reward_type;[\s\S]*?event\.rewardAmount = achievement\.reward_amount;/g,
    replacement: (match) => {
      return 'const event = new AchievementUnlockedEvent({\n      id: uuidv4(),\n      user: { id: userId },\n      userAchievement: userAchievement\n    });';
    }
  },
];

// Fix createUserAchievement method parameters
const createMethodFixes = [
  {
    pattern: /async createUserAchievement\(userId: string, achievementId: string\): Promise<UserAchievementDto>/g,
    replacement: 'async createUserAchievement(userId: string, achievementId: string): Promise<UserAchievementDto>'
  },
  // Fix unlockAchievement parameter
  {
    pattern: /return this.unlockAchievement\(userId, { achievementId: achievement\.id }\);/g,
    replacement: 'return this.unlockAchievement(userId, { achievement: achievement.id });'
  },
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

console.log('Fixing import statements...');
importFixes.forEach(replacement => {
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

// 2. Fix DTO mappings
console.log('Fixing DTO mappings...');
dtoMappingFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 3. Fix unlock DTO usage
console.log('Fixing unlock DTO...');
unlockDtoFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 4. Fix event creation
console.log('Fixing event creation...');
eventFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 5. Fix method parameters
console.log('Fixing method parameters...');
createMethodFixes.forEach(fix => {
  content = content.replace(fix.pattern, fix.replacement);
});

// 6. Add missing import for uuidv4 if not present
if (!content.includes('import { v4 as uuidv4 }')) {
  content = `import { v4 as uuidv4 } from 'uuid';\n${content}`;
}

// 7. Fix AchievementUnlockDto definition
content = content.replace(
  /export class AchievementUnlockDto {[\s\S]*?}/,
  `export class AchievementUnlockDto {
  @ApiProperty({ description: 'Achievement ID to unlock' })
  achievement: string;
}`);

// 8. Fix Repository types in constructor
content = content.replace(
  /private readonly achievementRepository: Repository<AchievementEntity>/g,
  'private readonly achievementRepository: Repository<Achievement>'
);
content = content.replace(
  /private readonly userAchievementRepository: Repository<UserAchievementEntity>/g,
  'private readonly userAchievementRepository: Repository<UserAchievement>'
);

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