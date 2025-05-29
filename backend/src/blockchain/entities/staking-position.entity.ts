import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StakingStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN_EARLY = 'withdrawn_early',
}

@Entity('staking_positions')
export class StakingPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  @Column({ name: 'user_id' })

  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'wallet_address', length: 42 })
  @Index()
  @Column({ name: 'wallet_address' })

  walletAddress: string;

  @Column({ name: 'position_id', type: 'int' })
  positionId: number;

  @Column({ name: 'amount', type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ name: 'lock_period', type: 'int' })
  lockPeriod: number;

  @Column({ name: 'apy_rate', type: 'decimal', precision: 5, scale: 2 })
  apyRate: number;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp with time zone', nullable: true })
  endTime: Date;

  @Column({ name: 'accumulated_rewards', type: 'decimal', precision: 36, scale: 18, default: '0' })
  accumulatedRewards: string;

  @Column({ name: 'last_claim_time', type: 'timestamp with time zone', nullable: true })
  lastClaimTime: Date;

  @Column({ name: 'auto_compound', type: 'boolean', default: false })
  autoCompound: boolean;

  @Column({ name: 'auto_claim_enabled', type: 'boolean', default: false })
  autoClaimEnabled: boolean;

  @Column({ name: 'status', type: 'enum', enum: StakingStatus, default: StakingStatus.ACTIVE })
  status: StakingStatus;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @Column({ name: 'withdrawal_transaction_hash', nullable: true })
  withdrawalTransactionHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'withdrawn_at', type: 'timestamp with time zone', nullable: true })
  withdrawnAt: Date;
}