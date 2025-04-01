import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity'; // Changed from blockchain to wallets
import { ReferralCode } from '../../referral/entities/referral-code.entity';
import { UserDevice } from './user-device.entity';
import { UserSession } from './user-session.entity';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../../auth/dto/refresh-token.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true }) // Make email nullable
  @Index()
  email: string | null;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  @Exclude()
  verificationToken: string;

  @Column({ name: 'reset_password_token', nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  @Column({ nullable: true })
  referrerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referrerId' })
  referrer?: User;

  @OneToMany(() => User, (user) => user.referrer)
  referrals: User[];

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => ReferralCode, (referralCode) => referralCode.referrer)
  referralCodes: ReferralCode[];

  @Column('text', {
    default: 'user',
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value as UserRole,
    },
  })
  role: UserRole;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  @Exclude()
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  @Exclude()
  lastLoginIp: string;

  @OneToMany(() => UserDevice, (device) => device.user)
  devices: UserDevice[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @Column({ nullable: true, unique: true })
  walletAddress?: string;

  // New fields for token minting and expiry tracking
  @Column({ name: 'last_mint_date', type: 'timestamp', nullable: true })
  lastMintDate: Date;

  @Column({ name: 'token_expiry_date', type: 'timestamp', nullable: true })
  tokenExpiryDate: Date;

  @Column({ name: 'minted_amount', type: 'decimal', precision: 18, scale: 8, default: 0 })
  mintedAmount: number;

  @Column({ name: 'has_expired_tokens', default: false })
  hasExpiredTokens: boolean;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }
}
