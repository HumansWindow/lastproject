import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { GameNotificationTemplate } from './game-notification-template.entity';

@Entity('user_notifications')
@Index(['userId', 'read'])
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ default: 'unread' })
  status: 'unread' | 'read' | 'dismissed';

  @Column({ type: 'json', nullable: true })
  customData?: Record<string, any>;

  @ManyToOne(() => GameNotificationTemplate, template => template.notifications)
  @JoinColumn({ name: 'template_id' })
  template: GameNotificationTemplate;

  @Column()
  templateId: string;

  @Column({ nullable: true })
  moduleId: string;

  @Column({ nullable: true })
  scheduleId: string;

  @Column({ nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
