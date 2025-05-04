import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quiz_responses')
export class QuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => QuizQuestion, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ name: 'selected_option', type: 'varchar', nullable: true })
  selectedOption: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string;

  @Column({ name: 'content_id', nullable: true })
  contentId: string;

  @Column({ name: 'points_awarded', type: 'int', nullable: true })
  pointsAwarded: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}