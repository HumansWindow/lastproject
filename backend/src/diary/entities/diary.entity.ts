import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DiaryLocation {
  IN_DREAM = 'in_dream',
  IN_SLEEP = 'in_sleep',
  IN_MEMORIES = 'in_memories',
  IN_AWAKING = 'in_awaking',
  IN_MEDITATION = 'in_meditation',
  IN_CONVERSATION = 'in_conversation',
  OTHER = 'other',
}

@Entity('diaries')
export class Diary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'int' })
  gameLevel: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'varchar',
    default: DiaryLocation.OTHER,
  })
  location: DiaryLocation;

  @Column({ nullable: true })
  feeling: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'has_media', default: false })
  hasMedia: boolean;

  @Column({ name: 'media_paths', type: 'simple-array', nullable: true })
  mediaPaths: string[];

  @Column({ name: 'is_stored_locally', default: false })
  isStoredLocally: boolean;

  @Column({ name: 'encryption_key', nullable: true })
  encryptionKey: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.diaries)
  @JoinColumn({ name: 'user_id' })
  user: User;
}