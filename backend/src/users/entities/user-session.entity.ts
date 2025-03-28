import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

@Entity({ name: 'user_sessions' })
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column()
  token: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 1000, nullable: true })
  userAgent?: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  endedAt?: Date;

  @Column({ nullable: true, type: 'integer' })
  duration?: number; // Store duration in seconds instead of interval

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserDevice, { nullable: true })
  @JoinColumn({ name: 'device_id' })
  device?: UserDevice;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
