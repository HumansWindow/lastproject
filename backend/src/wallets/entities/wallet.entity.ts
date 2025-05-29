import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'wallets' })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'address' })
  address: string;

  @Column({ nullable: true, name: 'private_key' })
  privateKey?: string;

  @Column({ default: 'ETH' })
  chain: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.wallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) 
  user: User;
}
