import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SectionContent } from './section-content.entity';
import { User } from '../../users/entities/user.entity';

@Entity('collaboration_comments')
export class CollaborationComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => SectionContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: SectionContent;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  comment: string;

  @Column({ name: 'comment_type', default: 'feedback' })
  commentType: 'feedback' | 'question' | 'suggestion' | 'resolution';

  @Column({ name: 'parent_comment_id', nullable: true })
  parentCommentId: string;

  @ManyToOne(() => CollaborationComment, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: CollaborationComment;

  @Column({ name: 'is_resolved', default: false })
  isResolved: boolean;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'context_data', type: 'jsonb', nullable: true })
  contextData: Record<string, any>;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}