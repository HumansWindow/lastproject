import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateQuizTables1715475961234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quizzes table
    await queryRunner.createTable(
      new Table({
        name: 'quizzes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'moduleId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sectionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'passingScore',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalPoints',
            type: 'integer',
            default: 0,
          },
          {
            name: 'timeLimit',
            type: 'integer',
            default: 60, // 60 seconds
          },
          {
            name: 'difficulty',
            type: 'enum',
            enum: ['easy', 'medium', 'hard', 'expert'],
            default: "'medium'",
          },
          {
            name: 'resultThresholds',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'showCorrectAnswers',
            type: 'boolean',
            default: true,
          },
          {
            name: 'randomizeQuestions',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'maxAttempts',
            type: 'integer',
            default: 1,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create quiz_questions table
    await queryRunner.createTable(
      new Table({
        name: 'quiz_questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'quizId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'multiple_choice',
              'single_choice',
              'true_false',
              'short_answer',
              'match_pairs',
              'fill_in_blanks',
              'sequence',
              'interactive',
            ],
            default: "'single_choice'",
          },
          {
            name: 'points',
            type: 'integer',
            default: 1,
          },
          {
            name: 'options',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'correctAnswer',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'explanation',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'orderIndex',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'feedback',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timeLimit',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create quiz_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'quiz_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'quizId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['started', 'in_progress', 'completed', 'abandoned', 'expired'],
            default: "'started'",
          },
          {
            name: 'startTime',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'endTime',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'score',
            type: 'integer',
            default: 0,
          },
          {
            name: 'percentageScore',
            type: 'float',
            default: 0,
          },
          {
            name: 'resultStatus',
            type: 'enum',
            enum: ['excellent', 'good', 'pass', 'fail'],
            isNullable: true,
          },
          {
            name: 'attemptNumber',
            type: 'integer',
            default: 1,
          },
          {
            name: 'questionsAnswered',
            type: 'integer',
            default: 0,
          },
          {
            name: 'questionsCorrect',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalTimeSpent',
            type: 'integer',
            default: 0,
          },
          {
            name: 'questionOrder',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isPassed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'feedback',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create user_quiz_responses table
    await queryRunner.createTable(
      new Table({
        name: 'user_quiz_responses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'quizSessionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'questionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userAnswer',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'isCorrect',
            type: 'boolean',
            default: false,
          },
          {
            name: 'score',
            type: 'float',
            default: 0,
          },
          {
            name: 'timeSpent',
            type: 'integer',
            default: 0,
          },
          {
            name: 'attemptIndex',
            type: 'integer',
            default: 0,
          },
          {
            name: 'wasSkipped',
            type: 'boolean',
            default: false,
          },
          {
            name: 'feedback',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'quiz_questions',
      new TableForeignKey({
        columnNames: ['quizId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quizzes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'quiz_sessions',
      new TableForeignKey({
        columnNames: ['quizId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quizzes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_quiz_responses',
      new TableForeignKey({
        columnNames: ['quizSessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quiz_sessions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_quiz_responses',
      new TableForeignKey({
        columnNames: ['questionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quiz_questions',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for performance
    await queryRunner.query('CREATE INDEX "IDX_quiz_questions_quiz_id" ON "quiz_questions" ("quizId")');
    await queryRunner.query('CREATE INDEX "IDX_quiz_sessions_quiz_id" ON "quiz_sessions" ("quizId")');
    await queryRunner.query('CREATE INDEX "IDX_quiz_sessions_user_id" ON "quiz_sessions" ("userId")');
    await queryRunner.query('CREATE INDEX "IDX_user_quiz_responses_session_id" ON "user_quiz_responses" ("quizSessionId")');
    await queryRunner.query('CREATE INDEX "IDX_user_quiz_responses_question_id" ON "user_quiz_responses" ("questionId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryRunner.dropTable('user_quiz_responses', true);
    await queryRunner.dropTable('quiz_sessions', true);
    await queryRunner.dropTable('quiz_questions', true);
    await queryRunner.dropTable('quizzes', true);
  }
}