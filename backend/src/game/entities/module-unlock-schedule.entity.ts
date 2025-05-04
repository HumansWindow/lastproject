import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameModule } from './game-module.entity';

@Entity('module_unlock_schedule')
export class ModuleUnlockSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => GameModule, module => module.moduleUnlockSchedules)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ name: 'previous_module_id', nullable: true })
  previousModuleId: string;

  @ManyToOne(() => GameModule, module => module.previousModuleUnlockSchedules, { nullable: true })
  @JoinColumn({ name: 'previous_module_id' })
  previousModule: GameModule;

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