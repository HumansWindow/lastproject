import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MintingType } from '../enums/minting-type.enum';
import { MintingStatus } from '../enums/minting-status.enum';

export enum MintingQueueItemStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum MintingQueueItemType {
  FIRST_TIME = 'first_time',
  ANNUAL = 'annual',
  REFERRAL = 'referral',
  OTHER = 'other',
  ADMIN = 'admin',
}

@Entity('minting_queue_items')
export class MintingQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'wallet_address', length: 42 })
  @Index()
  walletAddress: string;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ type: 'enum', enum: MintingQueueItemType, default: MintingQueueItemType.FIRST_TIME })
  @Index()
  type: MintingQueueItemType;

  @Column({ name: 'amount', type: 'decimal', precision: 36, scale: 18, default: 0 })
  amount: string;

  @Column({ type: 'enum', enum: MintingQueueItemStatus, default: MintingQueueItemStatus.PENDING })
  @Index()
  status: MintingQueueItemStatus;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any>;

  @Column({ name: 'merkle_proof', type: 'text', nullable: true })
  merkleProof: string;

  @Column({ name: 'signature', type: 'text', nullable: true })
  signature: string;

  @Column({ name: 'process_after', type: 'timestamp', nullable: true })
  processAfter: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  @Column({ name: 'processing_started_at', type: 'timestamp', nullable: true })
  processingStartedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'merkle_root', nullable: true })
  merkleRoot: string;

  @Column({ name: 'priority', default: 0 })
  priority: number;
}