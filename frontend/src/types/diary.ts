// Diary types

export interface DiaryLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

// Extended type for location to handle both string enum values and location objects
export type DiaryLocationField = DiaryLocation | string;

export interface Diary {
  id: string;
  title: string;
  content: string;
  location?: DiaryLocationField;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}
