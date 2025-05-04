import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SectionContent } from './section-content.entity';

@Entity('content_versions')
export class ContentVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @ManyToOne(() => SectionContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: SectionContent;

  @Column({ type: 'jsonb' })
  contentData: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeDescription: string;

  @Column({ type: 'varchar', length: 255 })
  changedBy: string;

  @Column({ type: 'int', default: 1 })
  versionNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}