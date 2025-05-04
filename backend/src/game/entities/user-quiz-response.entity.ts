import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('user_quiz_responses')
export class UserQuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => QuizQuestion, question => question.userResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ name: 'user_answer', nullable: true })
  userAnswer: string;

  @Column({ name: 'is_correct', nullable: true })
  isCorrect: boolean;

  @Column({ name: 'points_awarded', default: 0 })
  pointsAwarded: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}