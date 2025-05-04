import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { GameModule } from './game-module.entity';
import { SectionContent } from './section-content.entity';
import { SectionCheckpoint } from './section-checkpoint.entity';
import { QuizQuestion } from './quiz-question.entity';
import { SectionUnlockSchedule } from './section-unlock-schedule.entity';
import { UserProgress } from './user-progress.entity';

@Entity('game_sections')
export class GameSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => GameModule, module => module.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'section_type', length: 50 })
  sectionType: string; // 'text-image', 'card-carousel', 'timeline'

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'background_type', length: 50, default: 'default' })
  backgroundType: string; // 'default', 'galaxy', 'gradient'

  @Column({ type: 'jsonb' })
  configuration: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'wait_time_hours', default: 0 })
  waitTimeHours: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => SectionContent, content => content.section)
  contents: SectionContent[];

  @OneToMany(() => SectionCheckpoint, checkpoint => checkpoint.section)
  checkpoints: SectionCheckpoint[];

  @OneToMany(() => QuizQuestion, question => question.section)
  quizQuestions: QuizQuestion[];

  @OneToMany(() => SectionUnlockSchedule, schedule => schedule.section)
  unlockSchedules: SectionUnlockSchedule[];

  @OneToMany(() => SectionUnlockSchedule, schedule => schedule.previousSection)
  previousSectionUnlockSchedules: SectionUnlockSchedule[];

  @OneToMany(() => UserProgress, progress => progress.lastSection)
  userLastVisitedProgress: UserProgress[];
}