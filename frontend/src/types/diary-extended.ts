import { Diary, DiaryLocation } from './diary';

// Extended diary types with additional fields used in frontend
export interface ExtendedDiary extends Diary {
  color?: string;
  feeling?: string;
  gameLevel?: number;
  hasMedia?: boolean;
  isStoredLocally?: boolean;
}

// Labels for diary locations
export const DiaryLocationLabels: Record<string, string> = {
  HOME: 'Home',
  WORK: 'Work',
  SCHOOL: 'School',
  TRAVEL: 'Traveling',
  OUTDOORS: 'Outdoors',
  OTHER: 'Other'
};

// Feeling options for diary entries
export const FeelingOptions = [
  { value: 'happy', label: 'Happy', emoji: '😀' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'loving', label: 'Loving', emoji: '❤️' }
];

// Diary location enum values for dropdown options
export enum DiaryLocationEnum {
  HOME = 'HOME',
  WORK = 'WORK',
  SCHOOL = 'SCHOOL',
  TRAVEL = 'TRAVEL',
  OUTDOORS = 'OUTDOORS',
  OTHER = 'OTHER'
}
