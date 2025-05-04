import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GameModule } from './game-module.entity';
import { GameSection } from './game-section.entity';
import { User } from '../../users/entities/user.entity';
import { ProgressStatus } from '../interfaces/progress-status.interface';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => GameModule, module => module.userProgress)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ name: 'section_id', nullable: true })
  sectionId?: string;

  @ManyToOne(() => GameSection, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section?: GameSection;

  @Column({ name: 'sections_completed', default: 0 })
  sectionsCompleted: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'status', default: 'not_started' })
  status: ProgressStatus;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'completion_date', nullable: true })
  completionDate: Date;

  @Column({ name: 'reward_claimed', default: false })
  rewardClaimed: boolean;

  @Column({ name: 'reward_claim_date', nullable: true })
  rewardClaimDate: Date;

  @Column({ name: 'last_section_id', nullable: true })
  lastSectionId: string;

  @ManyToOne(() => GameSection, section => section.userLastVisitedProgress, { nullable: true })
  @JoinColumn({ name: 'last_section_id' })
  lastSection: GameSection;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}