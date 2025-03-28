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

  @Column()
  @Index()
  senderId: string;

  @Column({ nullable: true })
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
