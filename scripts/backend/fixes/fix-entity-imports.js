const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BACKEND_DIR = path.join(__dirname, '..', '..', '..', 'backend');
const GAME_MODULE_DIR = path.join(BACKEND_DIR, 'src', 'game');

// Fix import statements referencing entity classes
function fixEntityImports() {
  console.log('Fixing entity import statements...');
  
  // Define entity name mapping
  const entityMapping = {
    'GameModuleEntity': 'GameModule',
    'GameSectionEntity': 'GameSection',
    'SectionContentEntity': 'SectionContent',
    'UserProgressEntity': 'UserProgress',
    'SectionCheckpointEntity': 'SectionCheckpoint',
    'QuizQuestionEntity': 'QuizQuestion',
    'UserQuizResponseEntity': 'UserQuizResponse',
    'RewardTransactionEntity': 'RewardTransaction',
    'ModuleUnlockScheduleEntity': 'ModuleUnlockSchedule',
    'SectionUnlockScheduleEntity': 'SectionUnlockSchedule',
    'GameNotificationTemplateEntity': 'GameNotificationTemplate',
    'ModuleNotificationScheduleEntity': 'ModuleNotificationSchedule',
    'UserNotificationEntity': 'UserNotification',
    'MediaAssetEntity': 'MediaAsset'
  };
  
  // Get all TypeScript files in the game module
  const tsFiles = glob.sync('**/*.ts', { 
    cwd: GAME_MODULE_DIR,
    absolute: true,
    ignore: ['**/*.spec.ts']
  });
  
  let totalFilesFixed = 0;
  
  tsFiles.forEach(filePath => {
    const shortPath = path.relative(GAME_MODULE_DIR, filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;
    
    // Fix import statements
    Object.keys(entityMapping).forEach(oldName => {
      const newName = entityMapping[oldName];
      const importRegex = new RegExp(`import\\s+{[^}]*?\\b${oldName}\\b[^}]*?}\\s+from\\s+['"]([^'"]+)['"]`, 'g');
      
      content = content.replace(importRegex, (match, importPath) => {
        hasChanges = true;
        return match.replace(oldName, newName);
      });
      
      // Fix variable declarations and usage
      const usageRegex = new RegExp(`\\b${oldName}\\b`, 'g');
      content = content.replace(usageRegex, (match) => {
        // Skip if it's already in an import statement that we've handled above
        if (content.includes(`import {`) && content.includes(`} from`) && content.includes(match)) {
          return match;
        }
        hasChanges = true;
        return newName;
      });
    });
    
    // Save changes if different from original
    if (content !== originalContent) {
      fs.writeFileSync(`${filePath}.bak`, originalContent);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed imports in ${shortPath}`);
      totalFilesFixed++;
    }
  });
  
  console.log(`\nFixed entity imports in ${totalFilesFixed} files.`);
  return totalFilesFixed;
}

// Fix DTO inconsistencies - add missing properties
function fixDtoInconsistencies() {
  console.log('\nFixing DTO inconsistencies...');
  
  // Add missing properties to DTOs
  const dtosToFix = {
    // Path to DTO file: [properties to add if missing]
    'dto/progress.dto.ts': [
      { 
        className: 'UserSectionProgressDto',
        properties: [
          '  @ApiPropertyOptional()\n  sectionTitle?: string;',
          '  @ApiPropertyOptional()\n  moduleTitle?: string;'
        ]
      },
      {
        className: 'UserProgressDto',
        properties: [
          '  @ApiPropertyOptional()\n  sectionId?: string;'
        ]
      },
      {
        className: 'UserModuleProgressDto',
        properties: [
          '  @ApiPropertyOptional()\n  userId?: string;'
        ]
      },
      {
        className: 'UserProgressSummaryDto',
        properties: [
          '  @ApiProperty({ type: [UserModuleProgressItemDto] })\n  modules: UserModuleProgressItemDto[];'
        ]
      }
    ],
    'dto/quiz.dto.ts': [
      {
        className: 'QuizResultDto',
        properties: [
          '  @ApiProperty()\n  totalQuestions: number;',
          '  @ApiProperty()\n  answeredQuestions: number;',
          '  @ApiProperty()\n  correctAnswers: number;',
          '  @ApiProperty()\n  totalPoints: number;',
          '  @ApiProperty()\n  earnedPoints: number;',
          '  @ApiProperty()\n  percentageScore: number;'
        ]
      },
      {
        className: 'SectionQuizDto',
        properties: [
          '  @ApiProperty()\n  sectionTitle: string;'
        ]
      },
      {
        className: 'QuizQuestionListDto',
        properties: [
          '  @ApiProperty()\n  sectionId: string;'
        ]
      },
      {
        className: 'SubmitQuizAnswerDto',
        properties: [
          '  @ApiProperty()\n  @IsString()\n  answer: string;'
        ]
      }
    ],
    'dto/reward.dto.ts': [
      {
        className: 'RewardHistoryDto',
        properties: [
          '  @ApiProperty()\n  total: number;'
        ]
      }
    ],
    'dto/notification.dto.ts': [
      {
        className: 'NotificationTemplateDto',
        properties: [
          '  @ApiPropertyOptional()\n  moduleName?: string;'
        ]
      },
      {
        className: 'NotificationScheduleDto',
        properties: [
          '  @ApiPropertyOptional()\n  moduleName?: string;',
          '  @ApiPropertyOptional()\n  templateTitle?: string;'
        ]
      },
      {
        className: 'UserNotificationDto',
        properties: [
          '  @ApiPropertyOptional()\n  moduleName?: string;'
        ]
      }
    ]
  };
  
  let totalDtosFixed = 0;
  
  Object.entries(dtosToFix).forEach(([relPath, classFixList]) => {
    const filePath = path.join(GAME_MODULE_DIR, relPath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ File not found: ${relPath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;
    
    classFixList.forEach(({ className, properties }) => {
      // Find the class definition
      const classRegex = new RegExp(`export\\s+class\\s+${className}\\s*{[^}]*}`, 's');
      const classMatch = content.match(classRegex);
      
      if (classMatch) {
        let classContent = classMatch[0];
        let newClassContent = classContent;
        
        // Add each missing property
        properties.forEach(prop => {
          // Extract the property name more safely
          const propNameMatch = prop.match(/@ApiProperty.*\s+(\w+):/);
          if (!propNameMatch) {
            console.log(`  ⚠️ Could not extract property name from: ${prop}`);
            return;
          }
          
          const propName = propNameMatch[1];
          if (!classContent.includes(`${propName}:`)) {
            // Add property before the closing brace
            newClassContent = newClassContent.replace(/}$/, `${prop}\n}`);
            hasChanges = true;
          }
        });
        
        // Replace the class definition in the content
        if (newClassContent !== classContent) {
          content = content.replace(classContent, newClassContent);
        }
      } else {
        console.log(`  ⚠️ Class ${className} not found in ${relPath}`);
      }
    });
    
    // Save changes if different from original
    if (content !== originalContent) {
      fs.writeFileSync(`${filePath}.bak`, originalContent);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed DTO classes in ${relPath}`);
      totalDtosFixed++;
    }
  });
  
  console.log(`\nFixed ${totalDtosFixed} DTO files.`);
  return totalDtosFixed;
}

// Fix missing imports
function fixMissingImports() {
  console.log('\nFixing missing imports...');
  
  // Define imports to add to files
  const importsToAdd = {
    'services/game-modules.service.ts': [
      "import { GameModuleWithSectionsDto } from '../dto/module.dto';"
    ],
    'dto/progress.dto.ts': [
      "import { UserModuleProgressItemDto } from './progress.dto';"
    ]
  };
  
  let totalImportsFixed = 0;
  
  Object.entries(importsToAdd).forEach(([relPath, imports]) => {
    const filePath = path.join(GAME_MODULE_DIR, relPath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ File not found: ${relPath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;
    
    // Add each missing import
    imports.forEach(importStatement => {
      if (!content.includes(importStatement)) {
        // Add after other imports
        const lastImport = content.lastIndexOf('import ');
        const insertPos = content.indexOf(';', lastImport) + 1;
        content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
        hasChanges = true;
      }
    });
    
    // Save changes if different from original
    if (content !== originalContent) {
      fs.writeFileSync(`${filePath}.bak`, originalContent);
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Added imports to ${relPath}`);
      totalImportsFixed++;
    }
  });
  
  console.log(`\nFixed imports in ${totalImportsFixed} files.`);
  return totalImportsFixed;
}

// Apply special specific fixes for certain files that need more targeted changes
function applySpecificFixes() {
  console.log('\nApplying specific fixes to files...');

  // Fix UserProgress entity status field
  const userProgressPath = path.join(GAME_MODULE_DIR, 'entities', 'user-progress.entity.ts');
  if (fs.existsSync(userProgressPath)) {
    let content = fs.readFileSync(userProgressPath, 'utf8');
    if (!content.includes('@Column()') || !content.includes('status:')) {
      // Add status field if missing
      const newContent = content.replace(
        /(isCompleted: boolean;)/,
        '$1\n\n  @Column({ name: \'status\', default: \'not_started\' })\n  status: string;'
      );
      
      if (newContent !== content) {
        fs.writeFileSync(`${userProgressPath}.bak`, content);
        fs.writeFileSync(userProgressPath, newContent);
        console.log('  ✅ Added status field to UserProgress entity');
      }
    }
  }
  
  // Fix SectionCheckpoint entity completedAt field
  const checkpointPath = path.join(GAME_MODULE_DIR, 'entities', 'section-checkpoint.entity.ts');
  if (fs.existsSync(checkpointPath)) {
    let content = fs.readFileSync(checkpointPath, 'utf8');
    if (!content.includes('@Column()') || !content.includes('completedAt:')) {
      // Add completedAt field if missing
      const newContent = content.replace(
        /(isCompleted: boolean;)/,
        '$1\n\n  @Column({ name: \'completed_at\', nullable: true })\n  completedAt: Date;'
      );
      
      if (newContent !== content) {
        fs.writeFileSync(`${checkpointPath}.bak`, content);
        fs.writeFileSync(checkpointPath, newContent);
        console.log('  ✅ Added completedAt field to SectionCheckpoint entity');
      }
    }
  }
  
  // Create any missing files
  const missingFiles = {
    'dto/achievement.dto.ts': `import { ApiProperty } from '@nestjs/swagger';

export class AchievementDto {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  name: string;
  
  @ApiProperty()
  description: string;
  
  @ApiProperty()
  imageUrl: string;
  
  @ApiProperty()
  points: number;
  
  @ApiProperty()
  requirements: string;
  
  @ApiProperty()
  isActive: boolean;
}

export class UserAchievementDto {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  userId: string;
  
  @ApiProperty()
  achievementId: string;
  
  @ApiProperty()
  achievement: AchievementDto;
  
  @ApiProperty()
  unlockedAt: Date;
}

export class AchievementUnlockDto {
  @ApiProperty()
  achievement: AchievementDto;
  
  @ApiProperty()
  isNew: boolean;
  
  @ApiProperty()
  unlockedAt: Date;
}`,
    'entities/achievement.entity.ts': `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('game_achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  name: string;
  
  @Column()
  description: string;
  
  @Column({ name: 'image_url' })
  imageUrl: string;
  
  @Column()
  points: number;
  
  @Column()
  requirements: string;
  
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}`,
    'entities/user-achievement.entity.ts': `import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Achievement } from './achievement.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'user_id' })
  userId: string;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @Column({ name: 'achievement_id' })
  achievementId: string;
  
  @ManyToOne(() => Achievement)
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;
  
  @Column({ name: 'unlocked_at' })
  unlockedAt: Date;
}`,
    'events/achievement-unlocked.event.ts': `import { UserAchievement } from '../entities/user-achievement.entity';

export class AchievementUnlockedEvent {
  constructor(
    public readonly userAchievement: UserAchievement,
    public readonly isNew: boolean = true
  ) {}
}`
  };
  
  Object.entries(missingFiles).forEach(([relPath, content]) => {
    const filePath = path.join(GAME_MODULE_DIR, relPath);
    if (!fs.existsSync(filePath)) {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create the file
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Created missing file: ${relPath}`);
    }
  });
}

// Main execution
try {
  const startTime = new Date();
  console.log('Starting entity import fix script...\n');
  
  // Fix entity import statements first
  const filesWithFixedImports = fixEntityImports();
  
  // Fix DTO inconsistencies
  const dtosFixed = fixDtoInconsistencies();
  
  // Fix missing imports
  const importsFixed = fixMissingImports();
  
  // Apply specific fixes
  applySpecificFixes();
  
  const endTime = new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;
  
  console.log(`\n✅ Fixes applied successfully in ${duration} seconds!`);
  console.log(`- Fixed entity imports in ${filesWithFixedImports} files`);
  console.log(`- Fixed ${dtosFixed} DTO files`);
  console.log(`- Fixed imports in ${importsFixed} files`);
  console.log(`\nPlease run "cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend && npx tsc --noEmit" to check for remaining errors.`);
} catch (error) {
  console.error('Error while applying fixes:', error);
  process.exit(1);
}