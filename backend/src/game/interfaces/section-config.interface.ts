/**
 * Interface for section configuration used in the GameSection entity
 */

export interface BaseSection {
  title: string;
}

export interface TextImageSection extends BaseSection {
  images: {
    src: string;
    alt?: string;
    caption?: string;
  }[];
  text: string;
  layout: 'image-left' | 'image-right' | 'image-top' | 'image-bottom';
}

export interface CardCarouselSection extends BaseSection {
  cards: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    hasCheckbox?: boolean;
    checkboxLabel?: string;
  }[];
  allowMultipleSelection: boolean;
}

export interface TimelineSection extends BaseSection {
  items: {
    id: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
  }[];
}

export interface QuizSection extends BaseSection {
  description: string;
  passingScore: number;
  showExplanations: boolean;
  allowRetries: boolean;
  maxAttempts?: number;
}

export type SectionConfiguration = 
  | TextImageSection 
  | CardCarouselSection 
  | TimelineSection 
  | QuizSection;

/**
 * Configuration interface for game sections
 */
export interface SectionConfig {
  backgroundColor?: string;
  layout?: 'standard' | 'wide' | 'compact';
  enableAudio?: boolean;
  backgroundImage?: string;
  interactions?: SectionInteractionConfig[];
  themeStyle?: 'default' | 'galaxy' | 'gradient';
  progressTracking?: boolean;
  minTimeSpentSeconds?: number;
  [key: string]: any; // Allow for additional custom configuration properties
}

export interface SectionInteractionConfig {
  type: string;
  id: string;
  required: boolean;
  data?: Record<string, any>;
}

/**
 * Interface for section-specific configuration properties
 * Each section type may have unique configuration options
 */
export interface SectionConfigInterface {
  // Common properties that can exist across different section types
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;

  // Text-Image section specific properties
  imagePosition?: 'left' | 'right' | 'top' | 'bottom' | 'background';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  
  // Card Carousel section specific properties
  cards?: CardConfig[];
  cardStyle?: 'basic' | 'expanded' | 'interactive';
  
  // Timeline section specific properties
  timelineItems?: TimelineItemConfig[];
  timelineStyle?: 'vertical' | 'horizontal';
  
  // Quiz section specific properties
  quizStyle?: 'standard' | 'interactive';
  showResults?: boolean;
  
  // Interactive section specific properties
  interactionType?: string;
  interactionConfig?: Record<string, any>;
  
  // Any other custom properties
  [key: string]: any;
}

interface CardConfig {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  actions?: CardAction[];
}

interface CardAction {
  label: string;
  action: string;
  value?: any;
}

interface TimelineItemConfig {
  id?: string;
  title?: string;
  date?: string;
  content?: string;
  imageUrl?: string;
  position?: 'left' | 'right' | 'center';
}