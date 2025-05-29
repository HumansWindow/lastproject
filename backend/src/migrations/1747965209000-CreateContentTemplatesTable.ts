import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentTemplatesTable1747965209000 implements MigrationInterface {
  name = 'CreateContentTemplatesTable1747965209000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create content_templates table
    await queryRunner.query(`
      CREATE TABLE content_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        description TEXT,
        template JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    await queryRunner.query('CREATE INDEX idx_content_templates_content_type ON content_templates (content_type)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_templates_content_type');
    await queryRunner.query('DROP TABLE IF EXISTS content_templates');
  }
}
