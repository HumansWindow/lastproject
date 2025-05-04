import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { GameSection } from './game-section.entity';
import { ContentApproval, ApprovalStatus } from './content-approval.entity';
import { CollaborationComment } from './collaboration-comment.entity';

@Entity('section_content')
export class SectionContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => GameSection, section => section.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: GameSection;

  @Column({ name: 'content_type', length: 50 })
  contentType: string; // 'heading', 'text', 'image', 'card', 'timeline-item'

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ name: 'order_index' })
  orderIndex: number;
  
  @Column({ name: 'approval_status', type: 'varchar', default: ApprovalStatus.DRAFT })
  approvalStatus: ApprovalStatus;
  
  @Column({ name: 'created_by', nullable: true })
  createdBy: string;
  
  @Column({ name: 'last_modified_by', nullable: true })
  lastModifiedBy: string;

  @OneToMany(() => ContentApproval, approval => approval.content)
  approvals: ContentApproval[];
  
  @OneToMany(() => CollaborationComment, comment => comment.content)
  comments: CollaborationComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}