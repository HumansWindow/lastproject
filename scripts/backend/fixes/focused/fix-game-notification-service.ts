const fs = require('fs');
const path = require('path');

// Constants
const BACKEND_DIR = path.join(__dirname, '..', '..', '..', '..', 'backend');
const SERVICE_PATH = path.join(
  BACKEND_DIR,
  'src',
  'game',
  'services',
  'game-notification.service.ts'
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

console.log(`Starting fixes for game-notification.service.ts file...`);

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
  'module_id',
  'template_id',
  'schedule_id',
  'notification_type',
  'trigger_type',
  'trigger_hours',
  'trigger_time',
  'scheduled_for',
  'sent_at',
  'read_at',
  'is_active',
  'is_read',
];

// Fix entity class name references (remove Entity suffix)
const entityFixReplacements = [
  {
    pattern: /GameNotificationTemplateEntity/g,
    replacement: 'GameNotificationTemplate'
  },
  {
    pattern: /ModuleNotificationScheduleEntity/g,
    replacement: 'ModuleNotificationSchedule'
  },
  {
    pattern: /UserNotificationEntity/g,
    replacement: 'UserNotification'
  }
];

// Fix repository injection and usage patterns
const repositoryFixReplacements = [
  {
    pattern: /@InjectRepository\(GameNotificationTemplateEntity\)/g,
    replacement: '@InjectRepository(GameNotificationTemplate)'
  },
  {
    pattern: /@InjectRepository\(ModuleNotificationScheduleEntity\)/g,
    replacement: '@InjectRepository(ModuleNotificationSchedule)'
  },
  {
    pattern: /@InjectRepository\(UserNotificationEntity\)/g,
    replacement: '@InjectRepository(UserNotification)'
  }
];

// Specific method and property pattern replacements
const specificReplacements = [
  // Repository method calls
  {
    pattern: /this\.notificationTemplateRepository\.findOneByType\(moduleId, (['"])([^'"]+)(['"])\)/g,
    replacement: 'this.notificationTemplateRepository.findOneByType(moduleId, $1$2$3)'
  },
  {
    pattern: /\.findOne\({ where: { template_id:/g,
    replacement: '.findOne({ where: { templateId:'
  },
  {
    pattern: /\.findOne\({ where: { user_id:/g,
    replacement: '.findOne({ where: { userId:'
  },
  {
    pattern: /\.findOne\({ where: { module_id:/g,
    replacement: '.findOne({ where: { moduleId:'
  },
  // Fix property access in notification objects
  {
    pattern: /notification\.scheduled_for/g,
    replacement: 'notification.scheduledFor'
  },
  {
    pattern: /notification\.sent_at/g,
    replacement: 'notification.sentAt'
  },
  {
    pattern: /notification\.read_at/g,
    replacement: 'notification.readAt'
  },
  {
    pattern: /notification\.is_read/g,
    replacement: 'notification.isRead'
  },
  // Fix template property access
  {
    pattern: /template\.notification_type/g,
    replacement: 'template.notificationType'
  },
  // Fix schedule property access
  {
    pattern: /schedule\.trigger_type/g,
    replacement: 'schedule.triggerType'
  },
  {
    pattern: /schedule\.trigger_hours/g,
    replacement: 'schedule.triggerHours'
  },
  {
    pattern: /schedule\.trigger_time/g,
    replacement: 'schedule.triggerTime'
  }
];

// Entity creation and update fixes
const createMethodFixes = [
  // Fix create method parameter property names
  {
    pattern: /userNotificationRepository\.create\({[\s\S]*?}\)/g,
    replacement: (match) => {
      return match
        .replace(/user_id:/g, 'userId:')
        .replace(/module_id:/g, 'moduleId:')
        .replace(/template_id:/g, 'templateId:')
        .replace(/schedule_id:/g, 'scheduleId:')
        .replace(/scheduled_for:/g, 'scheduledFor:')
        .replace(/sent_at:/g, 'sentAt:')
        .replace(/is_read:/g, 'isRead:')
        .replace(/read_at:/g, 'readAt:');
    }
  },
  // Fix other repository create methods
  {
    pattern: /notificationTemplateRepository\.create\({[\s\S]*?}\)/g,
    replacement: (match) => {
      return match
        .replace(/module_id:/g, 'moduleId:')
        .replace(/notification_type:/g, 'notificationType:')
        .replace(/is_active:/g, 'isActive:');
    }
  },
  {
    pattern: /notificationScheduleRepository\.create\({[\s\S]*?}\)/g,
    replacement: (match) => {
      return match
        .replace(/module_id:/g, 'moduleId:')
        .replace(/template_id:/g, 'templateId:')
        .replace(/trigger_type:/g, 'triggerType:')
        .replace(/trigger_hours:/g, 'triggerHours:')
        .replace(/trigger_time:/g, 'triggerTime:')
        .replace(/is_active:/g, 'isActive:');
    }
  }
];

// PropertyReplacement in functions and methods
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

// 4. Fix import statements
content = content.replace(
  /import {[\s\S]*?} from ['"]\.\.\/entities\/[^'"]+['"]/g,
  match => {
    return match
      .replace(/GameNotificationTemplateEntity/g, 'GameNotificationTemplate')
      .replace(/ModuleNotificationScheduleEntity/g, 'ModuleNotificationSchedule')
      .replace(/UserNotificationEntity/g, 'UserNotification');
  }
);

// Update repository types in constructor
content = content.replace(
  /private readonly (\w+)Repository: Repository<(\w+)Entity>/g,
  'private readonly $1Repository: Repository<$2>'
);

// Save the file if changes were made
if (content !== originalContent) {
  console.log('Saving fixed file...');
  fs.writeFileSync(SERVICE_PATH, content);
  console.log(`✅ Successfully fixed game-notification.service.ts file`);

  // Stats about replacements
  const replacementsMade = content.split('\n').length - originalContent.split('\n').length;
  console.log(`Made approximately ${replacementsMade} changes`);
} else {
  console.log('⚠️ No changes were needed in the file');
}

console.log('Done!');