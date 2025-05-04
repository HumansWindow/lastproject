import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { GameSection } from './game-section.entity';
import { UserProgress } from './user-progress.entity';
import { RewardTransaction } from './reward-transaction.entity';
import { GameNotificationTemplate } from './game-notification-template.entity';
import { ModuleNotificationSchedule } from './module-notification-schedule.entity';
import { ModuleUnlockSchedule } from './module-unlock-schedule.entity';

@Entity('game_modules')
export class GameModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'prerequisite_module_id', nullable: true })
  prerequisiteModuleId: string;

  @ManyToOne(() => GameModule, { nullable: true })
  @JoinColumn({ name: 'prerequisite_module_id' })
  prerequisiteModule: GameModule;

  @Column({ name: 'time_to_complete', nullable: true })
  timeToComplete: number;

  @Column({ name: 'wait_time_hours', default: 0 })
  waitTimeHours: number;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 18, scale: 8, default: 0 })
  rewardAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => GameSection, section => section.module)
  sections: GameSection[];

  @OneToMany(() => UserProgress, progress => progress.module)
  userProgress: UserProgress[];

  @OneToMany(() => RewardTransaction, transaction => transaction.module)
  rewardTransactions: RewardTransaction[];

  @OneToMany(() => GameNotificationTemplate, template => template.module)
  notificationTemplates: GameNotificationTemplate[];

  @OneToMany(() => ModuleNotificationSchedule, schedule => schedule.module)
  notificationSchedules: ModuleNotificationSchedule[];

  @OneToMany(() => ModuleUnlockSchedule, unlockSchedule => unlockSchedule.module)
  moduleUnlockSchedules: ModuleUnlockSchedule[];

  @OneToMany(() => ModuleUnlockSchedule, unlockSchedule => unlockSchedule.previousModule)
  previousModuleUnlockSchedules: ModuleUnlockSchedule[];
}