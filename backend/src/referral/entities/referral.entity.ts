import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'referrer_id' })
  referrerId: string;
  
  @Column({ name: 'referred_id' })
  referredId: string;

  @Column({ name: 'created_at' }) 
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

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
