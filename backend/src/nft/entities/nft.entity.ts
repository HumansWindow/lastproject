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

  @Column()
  @Index()
  tokenId: string;

  @Column()
  @Index()
  contractAddress: string;

  @Column()
  chainId: number;

  @Column()
  @Index()
  ownerId: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: true })
  metadataUri: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
