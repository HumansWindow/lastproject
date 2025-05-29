#!/usr/bin/env node

/**
 * Fix Diary Types Script
 * 
 * This script addresses TypeScript errors in the diary components by:
 * 1. Enhancing the ExtendedDiary interface with missing properties
 * 2. Creating missing type exports like DiaryLocationLabels and FeelingOptions
 * 3. Ensuring type compatibility between DiaryEntry and ExtendedDiary
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend');
const SRC_DIR = path.join(FRONTEND_ROOT, 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/frontend', `diary-fixes-${new Date().toISOString().replace(/[:.]/g, '-')}`);

// File content updates
const fileUpdates = {
  // Update the diary extended types to include all required fields
  'src/types/diaryExtended.ts': `// Comprehensive diary types with all required fields for components
import { DiaryEntry } from '../services/api/modules/diary';

// Possible locations for diary entries
export enum DiaryLocationEnum {
  HOME = 'HOME',
  WORK = 'WORK',
  SCHOOL = 'SCHOOL',
  OUTDOORS = 'OUTDOORS',
  TRAVELING = 'TRAVELING',
  OTHER = 'OTHER'
}

// Labels for diary locations (for UI display)
export const DiaryLocationLabels = {
  [DiaryLocationEnum.HOME]: 'Home',
  [DiaryLocationEnum.WORK]: 'Work',
  [DiaryLocationEnum.SCHOOL]: 'School',
  [DiaryLocationEnum.OUTDOORS]: 'Outdoors',
  [DiaryLocationEnum.TRAVELING]: 'Traveling',
  [DiaryLocationEnum.OTHER]: 'Other'
};

// Feeling options for diary entries
export const FeelingOptions = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'angry', label: 'Angry', emoji: '😡' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' }
];

// Basic diary location type
export type DiaryLocation = {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  latitude?: number;
  longitude?: number;
};

// Core diary interface
export interface Diary {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  location: DiaryLocation | string;
}

// Extended diary interface with additional UI-specific properties
export interface ExtendedDiary extends Diary {
  // Game-related properties
  gameLevel?: number;
  
  // UI/UX properties
  color?: string;
  feeling?: string;
  
  // Media-related properties
  hasMedia?: boolean;
  isStoredLocally?: boolean;
  mediaUrls?: {
    audio?: string;
    video?: string;
    images?: string[];
  };
}

// Make DiaryEntry compatible with ExtendedDiary
export { DiaryEntry };

// Helper function to get location display name
export const getLocationLabel = (location: DiaryLocation | string | undefined): string => {
  if (!location) return DiaryLocationLabels[DiaryLocationEnum.OTHER];
  if (typeof location === 'string') {
    return DiaryLocationLabels[location as DiaryLocationEnum] || location;
  }
  return location.name || DiaryLocationLabels[DiaryLocationEnum.OTHER];
};
`,

  // Create a Bell icon component
  'src/icons/Bell.tsx': `import React from 'react';

export interface BellIconProps {
  className?: string;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const BellIcon: React.FC<BellIconProps> = ({ 
  className = '',
  color = 'currentColor',
  size = 24,
  style = {},
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
};
`
};

// Stats tracking
const stats = {
  filesUpdated: 0,
  filesCreated: 0,
  errors: []
};

/**
 * Create backup of a file
 */
async function backupFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    const relativePath = path.relative(FRONTEND_ROOT, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    
    // Create directory structure
    await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Copy file
    await fs.promises.copyFile(filePath, backupPath);
  } catch (err) {
    console.error(`Failed to backup ${filePath}:`, err);
  }
}

/**
 * Update or create a file
 */
async function updateFile(relativePath, content) {
  try {
    const filePath = path.join(FRONTEND_ROOT, relativePath);
    const exists = fs.existsSync(filePath);
    
    // Backup existing file
    await backupFile(filePath);
    
    if (!DRY_RUN) {
      // Create directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file content
      await writeFile(filePath, content, 'utf8');
      
      if (exists) {
        console.log(`Updated file: ${relativePath}`);
        stats.filesUpdated++;
      } else {
        console.log(`Created file: ${relativePath}`);
        stats.filesCreated++;
      }
    } else {
      if (exists) {
        console.log(`[DRY RUN] Would update file: ${relativePath}`);
      } else {
        console.log(`[DRY RUN] Would create file: ${relativePath}`);
      }
    }
    
    return true;
  } catch (err) {
    stats.errors.push(`Error updating ${relativePath}: ${err.message}`);
    console.error(`Error updating ${relativePath}:`, err);
    return false;
  }
}

/**
 * Update all specified files
 */
async function updateFiles() {
  for (const [relativePath, content] of Object.entries(fileUpdates)) {
    await updateFile(relativePath, content);
  }
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(PROJECT_ROOT, `frontend-diary-fixes-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  
  let report = `# Frontend Diary Component Fixes Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Files updated: ${stats.filesUpdated}\n`;
  report += `- Files created: ${stats.filesCreated}\n\n`;
  
  if (stats.errors.length > 0) {
    report += `## Errors\n\n`;
    for (const error of stats.errors) {
      report += `- ${error}\n`;
    }
    report += '\n';
  }
  
  report += `## Changes Made\n\n`;
  report += `### ExtendedDiary Interface\n\n`;
  report += `- Added missing properties (feeling, color, gameLevel, hasMedia, isStoredLocally)\n`;
  report += `- Created DiaryLocationLabels and FeelingOptions exports\n`;
  report += `- Added helper function for location display\n\n`;
  
  report += `### Components\n\n`;
  report += `- Created Bell icon component\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport written to: ${reportPath}`);
  } else {
    console.log('\n=== Report Preview ===\n');
    console.log(report);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Frontend Diary Component Fixes ${DRY_RUN ? '(DRY RUN)' : ''}\n`);
  
  // Create backup directory
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
  
  try {
    await updateFiles();
    generateReport();
    
    console.log(`\nDone! Updated ${stats.filesUpdated} files, created ${stats.filesCreated} files.`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});