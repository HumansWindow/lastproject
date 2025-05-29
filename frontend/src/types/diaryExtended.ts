// Comprehensive diary types with all required fields for components
import type { DiaryEntry } from "../services/api/modules/diary";

// Possible locations for diary entries
export enum DiaryLocationEnum {
  HOME = 'HOME',
  WORK = 'WORK',
  SCHOOL = 'SCHOOL',
  OUTDOORS = 'OUTDOORS',
  TRAVELING = 'TRAVELING',
  OTHER = 'OTHER'
}

// Labels for diary locations (for UI display) with index signature to allow string indexing
export const DiaryLocationLabels: {[key: string]: string} = {
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
export type { DiaryEntry };

// Helper function to get location display name
export const getLocationLabel = (location: DiaryLocation | string | undefined): string => {
  if (!location) return DiaryLocationLabels[DiaryLocationEnum.OTHER];
  if (typeof location === 'string') {
    return DiaryLocationLabels[location as DiaryLocationEnum] || location;
  }
  return location.name || DiaryLocationLabels[DiaryLocationEnum.OTHER];
};
