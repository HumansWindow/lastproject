import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborationCommentsTable1747965212000 implements MigrationInterface {
  name = 'CreateCollaborationCommentsTable1747965212000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create collaboration_comments table
    await queryRunner.query(`
      CREATE TABLE collaboration_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES section_content(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        comment TEXT NOT NULL,
        comment_type VARCHAR(50) DEFAULT 'feedback',
        parent_comment_id UUID REFERENCES collaboration_comments(id),
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_by VARCHAR(255),
        resolved_at TIMESTAMP,
        context_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await queryRunner.query('CREATE INDEX idx_collaboration_comments_content_id ON collaboration_comments (content_id)');
    await queryRunner.query('CREATE INDEX idx_collaboration_comments_user_id ON collaboration_comments (user_id)');
    await queryRunner.query('CREATE INDEX idx_collaboration_comments_parent_id ON collaboration_comments (parent_comment_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_collaboration_comments_parent_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_collaboration_comments_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_collaboration_comments_content_id');
    await queryRunner.query('DROP TABLE IF EXISTS collaboration_comments');
  }
}
