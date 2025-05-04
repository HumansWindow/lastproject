import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MediaType, MediaCategory } from '../dto/media.dto';
import { GameSection } from './game-section.entity';
import { GameModule } from './game-module.entity';

@Entity('media_assets')
export class MediaAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'file_path', length: 512 })
  filePath: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'alt_text', length: 255, nullable: true })
  altText: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: MediaType,
    default: MediaType.OTHER
  })
  mediaType: MediaType;

  @Column({
    name: 'category',
    type: 'enum',
    enum: MediaCategory,
    default: MediaCategory.SECTION_CONTENT,
    nullable: true
  })
  category: MediaCategory;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string;

  @ManyToOne(() => GameSection, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: GameSection;

  @Column({ name: 'module_id', nullable: true })
  moduleId: string;

  @ManyToOne(() => GameModule, { nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: GameModule;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}