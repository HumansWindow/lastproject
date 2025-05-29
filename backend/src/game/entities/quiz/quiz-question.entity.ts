import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { GameSection } from '../game-section.entity';
import { QuestionTypeEnum } from '../../interfaces/quiz/quiz-types.interface';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, quiz => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
  
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ManyToOne(() => GameSection, section => section.quizQuestions, { nullable: true })
  @JoinColumn({ name: 'sectionId' })
  section: GameSection;

  @Column({ type: 'varchar', length: 500 })
  text: string;

  @Column({ type: 'enum', enum: QuestionTypeEnum, default: QuestionTypeEnum.SINGLE_CHOICE , name: 'type' })type: QuestionTypeEnum;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'jsonb', nullable: true })
  options: any[]; // Will store options for multiple choice, match pairs, etc.

  @Column({ type: 'jsonb', nullable: true })
  correctAnswer: any; // Format depends on question type

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  feedback: {
    correctFeedback?: string;
    incorrectFeedback?: string;
    partialFeedback?: string;
  };

  @Column({ type: 'int', nullable: true })
  timeLimit: number; // Individual time limit in seconds, null = use quiz default

  @Column({ type: 'boolean', default: true })
  @Column({ name: 'is_active' })

  isActive: boolean;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // For extended question type data
  
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}