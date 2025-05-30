import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { GameNotificationTemplate } from './game-notification-template.entity';
import { GameModule } from './game-module.entity';
import { TriggerType } from '../interfaces/notification-types.interface';

@Entity('module_notification_schedules')
export class ModuleNotificationSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notification_template_id' })
  templateId: string;

  @Column({ name: 'module_id' })moduleId: string;

  @ManyToOne(() => GameModule, module => module.notificationSchedules)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ nullable: true })
  moduleName: string;

  @Column({ nullable: true })
  eventName: string;

  @Column({ type: 'varchar', nullable: true })
  cronExpression?: string;

  @Column({ type: 'varchar', nullable: true })
  triggerType: TriggerType;

  @Column({ type: 'int', nullable: true })
  triggerHours: number;

  @Column({ type: 'varchar', nullable: true })
  triggerTime: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ default: true })
  @Column({ name: 'is_active' })

  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  conditions?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => GameNotificationTemplate, template => template.schedules)
  @JoinColumn({ name: 'notification_template_id' })
  notificationTemplate: GameNotificationTemplate;

  @Column({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
