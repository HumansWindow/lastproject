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
 * RefreshToken entity - supports both camelCase and snake_case column naming
 * The database has triggers that keep userId and user_id columns synchronized
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  /**
   * ExpiresAt field - supports both camelCase and snake_case in DB
   * TypeScript property is always camelCase
   */
  @Column({ name: 'expiresAt' })
  expiresAt: Date;

  /**
   * UserId field - supports both camelCase and snake_case in DB
   * Database triggers keep userId and user_id in sync
   */
  @Column({ name: 'userId' })
  userId: string;

  /**
   * Relation to User entity
   * We reference the userId column which syncs with user_id via triggers
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  /**
   * CreatedAt timestamp - supports both camelCase and snake_case in DB
   */
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
