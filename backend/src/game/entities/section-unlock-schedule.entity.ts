import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameSection } from './game-section.entity';
import { GameModule } from './game-module.entity';

@Entity('section_unlock_schedule')
export class SectionUnlockSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => GameSection, section => section.unlockSchedules)
  @JoinColumn({ name: 'section_id' })
  section: GameSection;

  @Column({ name: 'previous_section_id', nullable: true })
  previousSectionId: string;

  @ManyToOne(() => GameSection, section => section.previousSectionUnlockSchedules, { nullable: true })
  @JoinColumn({ name: 'previous_section_id' })
  previousSection: GameSection;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => GameModule)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ name: 'unlock_date' })
  unlockDate: Date;

  @Column({ name: 'is_unlocked', default: false })
  isUnlocked: boolean;

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}