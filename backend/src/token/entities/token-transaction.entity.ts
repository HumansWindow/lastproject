import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  BURN = 'burn',
  AIRDROP = 'airdrop',
  REFERRAL_REWARD = 'referral_reward',
}

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Standard user_id field to reference the primary user (usually sender)
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'sender_id' })
  @Index()
  senderId: string;

  @Column({ name: 'receiver_id', nullable: true })
  @Index()
  receiverId?: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.TRANSFER,
  })
  @Index()
  type: TransactionType;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Main user relationship (typically the transaction creator)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
