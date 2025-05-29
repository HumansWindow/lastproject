import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'referral_codes' })
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'code' })
  code: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'user_id' })
  referrerId: string;

  // Add userId as an alias for referrerId to maintain compatibility
  // with existing code that uses userId
  get userId(): string {
    return this.referrerId;
  }

  set userId(value: string) {
    this.referrerId = value;
  }

  @ManyToOne(() => User, user => user.referralCodes)
  @JoinColumn({ name: 'user_id' })
  referrer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
