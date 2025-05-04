import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGameTables1746283625000 implements MigrationInterface {
  name = 'CreateGameTables1746283625000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create game_modules table
    await queryRunner.query(`
      CREATE TABLE game_modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        prerequisite_module_id UUID REFERENCES game_modules(id) NULL,
        time_to_complete INT, -- Estimated time in minutes
        wait_time_hours INT DEFAULT 0, -- Waiting time in hours before next module unlocks
        reward_amount DECIMAL(18,8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game_sections table
    await queryRunner.query(`
      CREATE TABLE game_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        section_type VARCHAR(50) NOT NULL, -- 'text-image', 'card-carousel', 'timeline'
        order_index INT NOT NULL,
        background_type VARCHAR(50) DEFAULT 'default', -- 'default', 'galaxy', 'gradient'
        configuration JSONB NOT NULL, -- Section-specific configuration
        is_active BOOLEAN DEFAULT TRUE,
        wait_time_hours INT DEFAULT 0, -- Waiting time in hours before next section unlocks (default: no waiting)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create section_content table
    await queryRunner.query(`
      CREATE TABLE section_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        section_id UUID REFERENCES game_sections(id) NOT NULL,
        content_type VARCHAR(50) NOT NULL, -- 'heading', 'text', 'image', 'card', 'timeline-item'
        content JSONB NOT NULL,
        order_index INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create media_assets table
    await queryRunner.query(`
      CREATE TABLE media_assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(512) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        alt_text VARCHAR(255),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_progress table
    await queryRunner.query(`
      CREATE TABLE user_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        sections_completed INT DEFAULT 0,
        is_completed BOOLEAN DEFAULT FALSE,
        completion_date TIMESTAMP,
        reward_claimed BOOLEAN DEFAULT FALSE,
        reward_claim_date TIMESTAMP,
        last_section_id UUID REFERENCES game_sections(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id)
      )
    `);

    // Create section_checkpoints table
    await queryRunner.query(`
      CREATE TABLE section_checkpoints (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        section_id UUID REFERENCES game_sections(id) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completion_date TIMESTAMP,
        responses JSONB, -- User responses to any interactive elements
        time_spent INT, -- Time spent in seconds
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, section_id)
      )
    `);

    // Create quiz_questions table
    await queryRunner.query(`
      CREATE TABLE quiz_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        section_id UUID REFERENCES game_sections(id) NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL, -- 'multiple-choice', 'true-false', 'text'
        options JSONB,
        correct_answer VARCHAR(255),
        explanation TEXT,
        points INT DEFAULT 1,
        order_index INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_quiz_responses table
    await queryRunner.query(`
      CREATE TABLE user_quiz_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        question_id UUID REFERENCES quiz_questions(id) NOT NULL,
        user_answer VARCHAR(255),
        is_correct BOOLEAN,
        points_awarded INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, question_id)
      )
    `);

    // Create reward_transactions table
    await queryRunner.query(`
      CREATE TABLE reward_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        amount DECIMAL(18,8) NOT NULL,
        transaction_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create module_unlock_schedule table
    await queryRunner.query(`
      CREATE TABLE module_unlock_schedule (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        previous_module_id UUID REFERENCES game_modules(id),
        unlock_date TIMESTAMP NOT NULL,
        is_unlocked BOOLEAN DEFAULT FALSE,
        notification_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id)
      )
    `);

    // Create section_unlock_schedule table
    await queryRunner.query(`
      CREATE TABLE section_unlock_schedule (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        section_id UUID REFERENCES game_sections(id) NOT NULL,
        previous_section_id UUID REFERENCES game_sections(id),
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        unlock_date TIMESTAMP NOT NULL,
        is_unlocked BOOLEAN DEFAULT FALSE,
        notification_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, section_id)
      )
    `);

    // Create game_notification_templates table
    await queryRunner.query(`
      CREATE TABLE game_notification_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'achievement', 'unlock', 'expedited_unlock', 'custom'
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create module_notification_schedule table
    await queryRunner.query(`
      CREATE TABLE module_notification_schedule (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        template_id UUID REFERENCES game_notification_templates(id) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL, -- 'time_after_completion', 'specific_time', 'before_unlock'
        trigger_hours INT, -- Hours after previous module completion or before unlock (can be NULL for specific_time)
        trigger_time TIME, -- Specific time of day (can be NULL for hour-based triggers)
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_notifications table
    await queryRunner.query(`
      CREATE TABLE user_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) NOT NULL,
        module_id UUID REFERENCES game_modules(id) NOT NULL,
        template_id UUID REFERENCES game_notification_templates(id),
        schedule_id UUID REFERENCES module_notification_schedule(id),
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        scheduled_for TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indices for better query performance
    await queryRunner.query('CREATE INDEX idx_game_sections_module_id ON game_sections (module_id)');
    await queryRunner.query('CREATE INDEX idx_section_content_section_id ON section_content (section_id)');
    await queryRunner.query('CREATE INDEX idx_user_progress_user_id ON user_progress (user_id)');
    await queryRunner.query('CREATE INDEX idx_user_progress_module_id ON user_progress (module_id)');
    await queryRunner.query('CREATE INDEX idx_section_checkpoints_user_id ON section_checkpoints (user_id)');
    await queryRunner.query('CREATE INDEX idx_section_checkpoints_section_id ON section_checkpoints (section_id)');
    await queryRunner.query('CREATE INDEX idx_quiz_questions_section_id ON quiz_questions (section_id)');
    await queryRunner.query('CREATE INDEX idx_user_quiz_responses_user_id ON user_quiz_responses (user_id)');
    await queryRunner.query('CREATE INDEX idx_user_quiz_responses_question_id ON user_quiz_responses (question_id)');
    await queryRunner.query('CREATE INDEX idx_reward_transactions_user_id ON reward_transactions (user_id)');
    await queryRunner.query('CREATE INDEX idx_module_unlock_schedule_user_id ON module_unlock_schedule (user_id)');
    await queryRunner.query('CREATE INDEX idx_module_unlock_schedule_module_id ON module_unlock_schedule (module_id)');
    await queryRunner.query('CREATE INDEX idx_section_unlock_schedule_user_id ON section_unlock_schedule (user_id)');
    await queryRunner.query('CREATE INDEX idx_section_unlock_schedule_section_id ON section_unlock_schedule (section_id)');
    await queryRunner.query('CREATE INDEX idx_section_unlock_schedule_module_id ON section_unlock_schedule (module_id)');
    await queryRunner.query('CREATE INDEX idx_user_notifications_user_id ON user_notifications (user_id)');
    await queryRunner.query('CREATE INDEX idx_user_notifications_module_id ON user_notifications (module_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query('DROP TABLE IF EXISTS user_notifications');
    await queryRunner.query('DROP TABLE IF EXISTS module_notification_schedule');
    await queryRunner.query('DROP TABLE IF EXISTS game_notification_templates');
    await queryRunner.query('DROP TABLE IF EXISTS section_unlock_schedule');
    await queryRunner.query('DROP TABLE IF EXISTS module_unlock_schedule');
    await queryRunner.query('DROP TABLE IF EXISTS reward_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS user_quiz_responses');
    await queryRunner.query('DROP TABLE IF EXISTS quiz_questions');
    await queryRunner.query('DROP TABLE IF EXISTS section_checkpoints');
    await queryRunner.query('DROP TABLE IF EXISTS user_progress');
    await queryRunner.query('DROP TABLE IF EXISTS section_content');
    await queryRunner.query('DROP TABLE IF EXISTS game_sections');
    await queryRunner.query('DROP TABLE IF EXISTS game_modules');
    await queryRunner.query('DROP TABLE IF EXISTS media_assets');
  }
}