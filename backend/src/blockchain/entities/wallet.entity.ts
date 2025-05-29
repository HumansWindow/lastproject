import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'wallets' })
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'address' }) address: string;

  @Column({ name: 'chain' }) chain: string;

  @ManyToOne(() => User, (user) => user.wallets)
  user: User;
}
