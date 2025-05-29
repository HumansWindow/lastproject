import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';
import { QuizSession } from './quiz-session.entity';

@Entity({ name: 'user_quiz_responses' })
export class UserQuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizSessionId: string;

  @ManyToOne(() => QuizSession, session => session.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizSessionId' })
  quizSession: QuizSession;

  @Column({ type: 'uuid' })
  questionId: string;

  @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: QuizQuestion;

  @Column({ type: 'jsonb' })
  userAnswer: any; // Format depends on question type

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'float', default: 0 })
  score: number; // Points awarded for this answer

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // Time spent on this question in seconds

  @Column({ type: 'int' })
  attemptIndex: number; // Index of attempt within the session (for re-attempts)

  @Column({ type: 'boolean', default: false })
  wasSkipped: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string; // Feedback specific to this response
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional data about the response

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}