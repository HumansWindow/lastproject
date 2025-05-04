import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { GameSection } from './game-section.entity';
import { UserQuizResponse } from './user-quiz-response.entity';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => GameSection, section => section.quizQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: GameSection;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'question_type', length: 50 })
  questionType: string; // 'multiple-choice', 'true-false', 'text'

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, any>; // For multiple choice, contains options array

  @Column({ name: 'correct_answer', nullable: true })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ default: 1 })
  points: number;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserQuizResponse, response => response.question)
  userResponses: UserQuizResponse[];
}