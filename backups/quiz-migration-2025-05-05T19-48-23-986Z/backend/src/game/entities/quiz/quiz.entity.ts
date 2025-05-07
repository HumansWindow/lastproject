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
import { GameModule } from '../../entities/game-module.entity';
import { GameSection } from '../../entities/game-section.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizDifficultyEnum } from '../../interfaces/quiz/quiz-types.interface';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  moduleId: string;

  @ManyToOne(() => GameModule, { nullable: true })
  @JoinColumn({ name: 'moduleId' })
  module: GameModule;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => GameSection, { nullable: true })
  @JoinColumn({ name: 'sectionId' })
  section: GameSection;

  @Column({ type: 'int', default: 0 })
  passingScore: number;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'int', default: 60 })
  timeLimit: number; // Time limit in seconds

  @Column({ type: 'enum', enum: QuizDifficultyEnum, default: QuizDifficultyEnum.MEDIUM })
  difficulty: QuizDifficultyEnum;

  @Column({ type: 'jsonb', nullable: true })
  resultThresholds: {
    excellent: number;
    good: number;
    pass: number;
  };

  @Column({ type: 'boolean', default: true })
  showCorrectAnswers: boolean;

  @Column({ type: 'boolean', default: false })
  randomizeQuestions: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  maxAttempts: number;

  @OneToMany(() => QuizQuestion, question => question.quiz)
  questions: QuizQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;
}