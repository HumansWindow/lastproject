import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

@Entity({ name: 'user_sessions' })
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  // Removed problematic field userIdDirect that was causing column error

  @ManyToOne(() => User, user => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  // Add relationship with UserDevice entity
  @ManyToOne(() => UserDevice)
  @JoinColumn({ name: 'device_id', referencedColumnName: 'id' })
  device: UserDevice;

  @Column({ length: 500, nullable: true })
  token: string;

  @Column({ name: 'ip_address', length: 100, nullable: true })
  ipAddress: string;
  
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
