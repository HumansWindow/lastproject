import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string;

  @Column()
  referredId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('referral_uses')
export class ReferralUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string;

  @Column()
  referredId: string;

  @Column({ default: false })
  rewardClaimed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
