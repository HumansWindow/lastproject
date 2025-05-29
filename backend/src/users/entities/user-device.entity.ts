import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Index 
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_devices' })
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Keep both deviceId and device_id to handle both column names
  // TypeORM will use device_id due to the @Column decorator
  @Column({ name: 'device_id', length: 255 })
  @Index()
  deviceId: string;

  @Column({ name: 'device_type', length: 50, default: 'unknown' })
  deviceType: string;

  // These fields may not exist in the database, use nullable: true
  // and don't use them directly in queries
  @Column({ name: 'name', length: 255, nullable: true })
  name: string;

  @Column({ length: 100, nullable: true })
  platform: string;

  @Column({ length: 100, nullable: true })
  os: string;

  @Column({ name: 'os_version', length: 100, nullable: true })
  osVersion: string;

  @Column({ length: 100, nullable: true })
  browser: string;

  @Column({ name: 'browser_version', length: 100, nullable: true })
  browserVersion: string;

  @Column({ name: 'last_ip_address', length: 100, nullable: true })
  lastIpAddress: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'visit_count', default: 1 })
  visitCount: number;

  @Column({ name: 'last_seen_at', type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @Column({ name: 'first_seen', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  firstSeen: Date;

  @Column({ name: 'last_seen', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Additional fields to better identify devices
  @Column({ length: 100, nullable: true })
  brand: string;
  
  @Column({ length: 100, nullable: true })
  model: string;

  // Flag if this device was manually approved by admin
  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  // Track wallet addresses used with this device
  @Column({ name: 'wallet_addresses', type: 'text', nullable: true })
  walletAddresses: string;

  // Add a method to update the wallet addresses list
  async addWalletAddress(walletAddress: string): Promise<void> {
    if (!walletAddress) return;
    
    // Make sure wallet address is lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Parse existing wallet addresses or initialize as empty array
    const addresses = this.walletAddresses 
      ? JSON.parse(this.walletAddresses) 
      : [];
    
    // Add the address if it's not already there
    if (!addresses.includes(normalizedAddress)) {
      addresses.push(normalizedAddress);
      this.walletAddresses = JSON.stringify(addresses);
    }
  }
}
