import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  privateKey?: string;

  @Column({ default: 'ETH' })
  chain: string;

  // Use user_id column name consistently across the application
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Define the relation with proper column name that matches the database
  @ManyToOne(() => User, user => user.wallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) 
  user: User;
}
