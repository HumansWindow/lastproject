import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('nfts')
export class NFT {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_id' })
  tokenId: string;
  
  @Column({ name: 'contract_address' })
  contractAddress: string;

  @Column({ name: 'chain_id' }) chainId: number;

  @Column({ name: 'owner_id' })
  @Index()
  ownerId: string;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @Column({ nullable: true })
  metadataUri: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ default: true })
  @Column({ name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
