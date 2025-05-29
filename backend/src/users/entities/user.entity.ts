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
  OneToOne,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { ReferralCode } from '../../referral/entities/referral-code.entity';
import { UserDevice } from './user-device.entity';
import { UserSession } from './user-session.entity';
import { Exclude } from 'class-transformer';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Diary } from '../../diary/entities/diary.entity';
import { Profile } from '../../profile/entities/profile.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User relation was removed - it was causing the error with duplicate user_id field
  
  // Email and password are now moved to Profile entity
  // Adding getters/setters for backward compatibility
  get email(): string | undefined {
    return this.profile?.email;
  }

  set email(value: string | undefined) {
    if (!this.profile) {
      this.profile = new Profile();
      this.profile.userId = this.id;
    }
    this.profile.email = value;
  }

  get password(): string | undefined {
    return this.profile?.password;
  }

  set password(value: string | undefined) {
    if (!this.profile) {
      this.profile = new Profile();
      this.profile.userId = this.id;
    }
    this.profile.password = value;
  }

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'is_verified' })
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

  @Column({ name: 'referrer_id', nullable: true })
  referrerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referrer_id' })
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

  @Column({ name: 'wallet_address', nullable: true, unique: true })
  @Index() // Add index for better query performance
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

  // Diary relationship
  @OneToMany(() => Diary, (diary) => diary.user)
  diaries: Diary[];

  // Add relation to Profile
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // Remove password-related methods since password is now in Profile
}
