import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * RefreshToken entity - stores refresh tokens for authenticated users
 */
@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  // Add both variants of the user ID field to accommodate the database trigger
  // The trigger expects both user_id and userId, so we'll include both
  @Column({ name: 'user_id' })
  userId: string;
  
  // Virtual column that will be synchronized by the trigger
  @Column({ name: 'user_id', select: false, insert: false, update: false })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
