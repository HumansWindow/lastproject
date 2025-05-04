import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameSection } from './game-section.entity';
import { UserProgress } from './user-progress.entity';

@Entity('section_checkpoints')
export class SectionCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => GameSection, section => section.checkpoints)
  @JoinColumn({ name: 'section_id' })
  section: GameSection;
  
  @Column({ name: 'progress_id', nullable: true })
  progressId: string;
  
  @ManyToOne(() => UserProgress)
  @JoinColumn({ name: 'progress_id' })
  progress: UserProgress;
  
  @Column({ name: 'checkpoint_type', nullable: true })
  checkpointType: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'completion_date', nullable: true })
  completionDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  responses: Record<string, any>;

  @Column({ name: 'time_spent', nullable: true })
  timeSpent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}