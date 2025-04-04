export enum DiaryLocation {
  IN_DREAM = 'in_dream',
  IN_SLEEP = 'in_sleep',
  IN_MEMORIES = 'in_memories',
  IN_AWAKING = 'in_awaking',
  IN_MEDITATION = 'in_meditation',
  IN_CONVERSATION = 'in_conversation',
  OTHER = 'other',
}

export interface Diary {
  id?: string;
  title: string;
  gameLevel: number;
  createdAt?: Date;
  updatedAt?: Date;
  location: DiaryLocation;
  feeling?: string;
  color?: string;
  content: string;
  hasMedia: boolean;
  mediaPaths?: string[];
  isStoredLocally: boolean;
  userId?: string;
}

export const DiaryLocationLabels: Record<DiaryLocation, string> = {
  [DiaryLocation.IN_DREAM]: 'In Dream',
  [DiaryLocation.IN_SLEEP]: 'In Sleep',
  [DiaryLocation.IN_MEMORIES]: 'In Memories (By Thinking)',
  [DiaryLocation.IN_AWAKING]: 'In Awaking',
  [DiaryLocation.IN_MEDITATION]: 'In Meditation (By Light)',
  [DiaryLocation.IN_CONVERSATION]: 'In a Talking/Conversation',
  [DiaryLocation.OTHER]: 'Other',
};

export const FeelingOptions = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'surprised', label: 'Surprised', emoji: '😲' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'confused', label: 'Confused', emoji: '😕' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
];