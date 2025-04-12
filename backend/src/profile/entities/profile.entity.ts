import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relationship with the User entity
  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Personal Information
  @Column({ nullable: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'unique_id', unique: true, nullable: true })
  @Index()
  uniqueId: string;

  // Location information
  @Column({ name: 'country', nullable: true })
  country: string;

  @Column({ name: 'city', nullable: true })
  city: string;

  @Column({ name: 'state', nullable: true })
  state: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ name: 'address', nullable: true })
  address: string;

  // GPS location
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // User preferences
  @Column({ name: 'language', default: 'en' })
  language: string;

  @Column({ name: 'timezone', nullable: true })
  timezone: string;

  @Column({ name: 'date_format', nullable: true, default: 'yyyy-MM-dd' })
  dateFormat: string;

  @Column({ name: 'time_format', nullable: true, default: '24h' })
  timeFormat: string;

  // Contact information
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'website', nullable: true })
  website: string;

  // Social media profiles
  @Column({ name: 'twitter_handle', nullable: true })
  twitterHandle: string;
  
  @Column({ name: 'instagram_handle', nullable: true })
  instagramHandle: string;
  
  @Column({ name: 'linkedin_profile', nullable: true })
  linkedinProfile: string;

  @Column({ name: 'telegram_handle', nullable: true })
  telegramHandle: string;

  // Privacy settings
  @Column({ name: 'location_visibility', default: 'private' })
  locationVisibility: 'public' | 'friends' | 'private';

  @Column({ name: 'profile_visibility', default: 'public' })
  profileVisibility: 'public' | 'friends' | 'private';

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'push_notifications', default: true })
  pushNotifications: boolean;

  // System fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  
  @Column({ name: 'last_location_update', type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;
  
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(attempt, this.password);
  }
}