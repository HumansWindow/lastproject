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

export enum MintingRecordType {
  FIRST_TIME = 'first_time',
  ANNUAL = 'annual',
  REFERRAL = 'referral',
  ADMIN = 'admin',
  OTHER = 'other',
}

@Entity('minting_records')
export class MintingRecord {
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

  @Column({ name: 'amount', type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ name: 'transaction_hash', length: 66 })
  @Index()
  transactionHash: string;

  @Column({ name: 'block_number', type: 'int', nullable: true })
  blockNumber: number;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ type: 'enum', enum: MintingRecordType })
  @Index()
  type: MintingRecordType;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}