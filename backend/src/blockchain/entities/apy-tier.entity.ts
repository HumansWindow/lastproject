import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('apy_tiers')
export class ApyTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'lock_period_days', type: 'int' })
  lockPeriodDays: number;

  @Column({ name: 'apy_rate', type: 'decimal', precision: 5, scale: 2 })
  apyRate: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'min_stake_amount', type: 'decimal', precision: 36, scale: 18, default: '0' })
  minStakeAmount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}