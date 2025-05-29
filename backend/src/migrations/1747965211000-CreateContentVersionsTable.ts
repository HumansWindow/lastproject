import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentVersionsTable1747965211000 implements MigrationInterface {
  name = 'CreateContentVersionsTable1747965211000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create content_versions table
    await queryRunner.query(`
      CREATE TABLE content_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES section_content(id) ON DELETE CASCADE,
        content_data JSONB NOT NULL,
        change_description VARCHAR(255),
        changed_by VARCHAR(255) NOT NULL,
        version_number INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    await queryRunner.query('CREATE INDEX idx_content_versions_content_id ON content_versions (content_id)');
    await queryRunner.query('CREATE INDEX idx_content_versions_version_number ON content_versions (version_number)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_versions_version_number');
    await queryRunner.query('DROP INDEX IF EXISTS idx_content_versions_content_id');
    await queryRunner.query('DROP TABLE IF EXISTS content_versions');
  }
}
