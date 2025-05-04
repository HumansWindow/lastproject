/**
 * Enum defining the types of content available in game sections
 */
export enum SectionContentType {
  HEADING = 'heading',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CARD = 'card',
  TIMELINE_ITEM = 'timeline-item',
  QUIZ_QUESTION = 'quiz-question',
  INTERACTIVE_ELEMENT = 'interactive-element',
  EMBED = 'embed',
  SEPARATOR = 'separator',
  CALLOUT = 'callout'
}

/**
 * Enum defining all supported section content types
 */
export enum SectionContentTypeEnum {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  CODE = 'code',
  QUOTE = 'quote',
  LIST = 'list',
  TABLE = 'table',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive',
  EMBED = 'embed',
  SEPARATOR = 'separator',
  CUSTOM = 'custom',
}

/**
 * Interactive element types supported in the game
 */
export enum InteractiveElementTypeEnum {
  FLASHCARD = 'flashcard',
  DRAGDROP = 'dragdrop',
  HOTSPOT = 'hotspot',
  TIMELINE = 'timeline',
  SORTABLE = 'sortable',
}

/**
 * Quiz question types
 */
export enum QuizQuestionTypeEnum {
  SINGLE_CHOICE = 'single',
  MULTIPLE_CHOICE = 'multiple',
  TRUE_FALSE = 'true-false',
  FILL_BLANK = 'fill-blank',
  MATCHING = 'matching',
  ORDERING = 'ordering',
  ESSAY = 'essay',
}

/**
 * Display styles for media content
 */
export enum ContentDisplayStyleEnum {
  FULL_WIDTH = 'fullWidth',
  CENTERED = 'centered',
  FLOATING_LEFT = 'floatingLeft',
  FLOATING_RIGHT = 'floatingRight',
}

/**
 * Interface for dynamic placeholder resolution
 */
export interface ContentPlaceholder {
  type: 'user' | 'system' | 'variable' | 'dynamic';
  key: string;
  defaultValue?: string;
  format?: string;
}

/**
 * Interface for representing a dynamic content field
 */
export interface DynamicContentField {
  static: boolean;
  value: string | number | boolean | object | any[];
  placeholders?: ContentPlaceholder[];
}

/**
 * Interface for generic section content
 */
export interface SectionContentBase {
  type: SectionContentType;
  orderIndex: number;
}

export interface HeadingContent extends SectionContentBase {
  type: SectionContentType.HEADING;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right';
}

export interface TextContent extends SectionContentBase {
  type: SectionContentType.TEXT;
  text: string;
  formatting?: 'plain' | 'markdown' | 'html';
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface ImageContent extends SectionContentBase {
  type: SectionContentType.IMAGE;
  url: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  assetId?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface VideoContent extends SectionContentBase {
  type: SectionContentType.VIDEO;
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  width?: number;
  height?: number;
  thumbnail?: string;
  assetId?: string;
  externalUrl?: string;
  caption?: string;
}

export interface AudioContent extends SectionContentBase {
  type: SectionContentType.AUDIO;
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  assetId?: string;
  externalUrl?: string;
  caption?: string;
}

export interface CardContent extends SectionContentBase {
  type: SectionContentType.CARD;
  title: string;
  body: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  tags?: string[];
  subtitle?: string;
  content?: string;
  imageAssetId?: string;
  imageAlt?: string;
  actions?: {
    label: string;
    action: string;
    value?: any;
  }[];
}

export interface TimelineItemContent extends SectionContentBase {
  type: SectionContentType.TIMELINE_ITEM;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
  content: string;
  imageAssetId?: string;
  imageAlt?: string;
  position?: 'left' | 'right' | 'center';
}

export interface QuizQuestionContent extends SectionContentBase {
  type: SectionContentType.QUIZ_QUESTION;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'text';
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points?: number;
}

export interface InteractiveElementContent extends SectionContentBase {
  type: SectionContentType.INTERACTIVE_ELEMENT;
  elementType: string;
  data: Record<string, any>;
  required?: boolean;
}

export interface EmbedContent extends SectionContentBase {
  type: SectionContentType.EMBED;
  html: string;
  height?: number;
}

export interface CalloutContent extends SectionContentBase {
  type: SectionContentType.CALLOUT;
  title?: string;
  content: string;
  calloutType: 'info' | 'warning' | 'success' | 'error' | 'note';
  icon?: string;
}

export type SectionContent =
  | HeadingContent
  | TextContent
  | ImageContent
  | VideoContent
  | AudioContent
  | CardContent
  | TimelineItemContent
  | QuizQuestionContent
  | InteractiveElementContent
  | EmbedContent
  | CalloutContent;