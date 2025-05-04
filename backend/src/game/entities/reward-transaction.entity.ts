import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameModule } from './game-module.entity';

@Entity('reward_transactions')
export class RewardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => GameModule, module => module.rewardTransactions)
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}