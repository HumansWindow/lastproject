import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SectionContent } from './section-content.entity';
import { User } from '../../users/entities/user.entity';

// Enum for approval status
export enum ApprovalStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

@Entity('content_approvals')
export class ContentApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => SectionContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: SectionContent;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.DRAFT
  })
  status: ApprovalStatus;

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submitter: User;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'scheduled_publish_date', nullable: true })
  scheduledPublishDate: Date;

  @Column({ default: false })
  isLatestApproval: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}