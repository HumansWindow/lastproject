import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { UserQuizResponse } from './user-quiz-response.entity';
import { QuizSessionStatus, QuizAttemptResultStatus } from '../../interfaces/quiz/quiz-types.interface';

@Entity('quiz_sessions')
export class QuizSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: QuizSessionStatus, default: QuizSessionStatus.STARTED })
  status: QuizSessionStatus;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'float', default: 0 })
  percentageScore: number;

  @Column({ type: 'enum', enum: QuizAttemptResultStatus, nullable: true })
  resultStatus: QuizAttemptResultStatus;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'int', default: 0 })
  questionsAnswered: number;

  @Column({ type: 'int', default: 0 })
  questionsCorrect: number;

  @Column({ type: 'int', default: 0 })
  totalTimeSpent: number; // In seconds

  @Column({ type: 'jsonb', nullable: true })
  questionOrder: string[]; // Store question IDs in the order presented (for randomized quizzes)

  @Column({ type: 'boolean', default: false })
  isPassed: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string; // General feedback for the entire quiz attempt

  @OneToMany(() => UserQuizResponse, response => response.quizSession)
  responses: UserQuizResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}