import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentApprovalsTable1747965210000 implements MigrationInterface {
  name = 'CreateContentApprovalsTable1747965210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for approval status
    await queryRunner.query(`CREATE TYPE approval_status_enum AS ENUM ('draft', 'in_review', 'approved', 'rejected', 'published')`);
    
    // Create content_approvals table
    await queryRunner.query(`
      CREATE TABLE content_approvals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES section_content(id) ON DELETE CASCADE,
        status approval_status_enum DEFAULT 'draft',
        submitted_by UUID NOT NULL REFERENCES users(id),
        reviewer_id UUID REFERENCES users(id),
        rejection_reason TEXT,
        scheduled_publish_date TIMESTAMP,
        comments JSONB,
        version_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    await queryRunner.query('CREATE INDEX idx_content_approvals_content_id ON content_approvals (content_id)');
    await queryRunner.query('CREATE INDEX idx_content_approvals_status ON content_approvals (status)');
    await queryRunner.query('CREATE INDEX idx_content_approvals_submitted_by ON content_approvals (submitted_by)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_approvals_submitted_by');
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_approvals_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_approvals_content_id');
    await queryRunner.query('DROP TABLE IF EXISTS content_approvals');
    await queryRunner.query('DROP TYPE IF EXISTS approval_status_enum');
  }
}
