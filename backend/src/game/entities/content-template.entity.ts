import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('content_templates')
export class ContentTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 , name: 'name' })name: string;

  @Column({ type: 'varchar', length: 100 })
  contentType: string;
  
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  template: any;
  
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}