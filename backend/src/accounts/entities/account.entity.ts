import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'user_id' })
  userId: string;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @Column({ name: 'wallet_address' }) walletAddress: string;
  
  @Column({ default: 'ETH' })
  chainType: string;
  
  @Column({ type: 'varchar', length: 100, default: 'active' })
  status: 'active' | 'inactive' | 'frozen' | 'banned';
  
  @Column({ default: false })
  isPrimary: boolean;
  
  @Column({ nullable: true })
  signature: string;
  
  @Column({ nullable: true })
  nonce: string;
  
  @Column({ nullable: true })
  lastSignatureDate: Date;
  
  @Column({ nullable: true, type: 'simple-json' })
  metadata: Record<string, any>;
  
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}