import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ModuleNotificationSchedule } from './module-notification-schedule.entity';
import { UserNotification } from './user-notification.entity';
import { GameModule } from './game-module.entity';
import { NotificationType } from '../interfaces/notification-types.interface';

@Entity('game_notification_templates')
export class GameNotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title' })title: string;

  @Column({ name: 'message' })message: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  actionUrl?: string;

  @Column({ default: 'info' , name: 'type' })type: 'info' | 'success' | 'warning' | 'error';

  @Column({
    type: 'varchar',
    nullable: true
  })
  notificationType: NotificationType;

  @Column({ default: true })
  @Column({ name: 'is_active' })

  isActive: boolean;

  @Column({ nullable: true })
  gameFeature: string;

  @Column({ nullable: true })
  moduleId: string;

  @ManyToOne(() => GameModule, module => module.notificationTemplates)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => ModuleNotificationSchedule, schedule => schedule.notificationTemplate)
  schedules: ModuleNotificationSchedule[];

  @OneToMany(() => UserNotification, notification => notification.template)
  notifications: UserNotification[];
}
