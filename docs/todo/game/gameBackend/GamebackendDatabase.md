# Learn to Earn Game: Database Schema Design

## Overview

This document outlines the database schema design for the Learn to Earn game system. The schema is designed to support educational content delivery, user progress tracking, quiz functionality, and integration with blockchain rewards.

## Database Tables

### Game Modules

The `game_modules` table stores information about educational modules available in the system.

```sql
CREATE TABLE game_modules (
  id UUID PRIMARY KEY,
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
);
```

**Key features:**
- Self-referential relationship for module prerequisites
- Order tracking to maintain module sequence
- Configurable waiting period between modules
- Reward amount specification for module completion

### Game Sections

The `game_sections` table stores sections within each educational module.

```sql
CREATE TABLE game_sections (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  section_type VARCHAR(50) NOT NULL, -- 'text-image', 'card-carousel', 'timeline'
  order_index INT NOT NULL,
  background_type VARCHAR(50) DEFAULT 'default', -- 'default', 'galaxy', 'gradient'
  configuration JSONB NOT NULL, -- Section-specific configuration
  is_active BOOLEAN DEFAULT TRUE,
  wait_time_hours INT DEFAULT 0, -- Waiting time in hours before next section unlocks
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Foreign key relationship to game modules
- Configurable section types for different learning formats
- JSONB configuration for flexible section metadata
- Customizable visual settings (background)
- Optional waiting period between sections

### Section Content

The `section_content` table stores the actual content items within each section.

```sql
CREATE TABLE section_content (
  id UUID PRIMARY KEY,
  section_id UUID REFERENCES game_sections(id) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'heading', 'text', 'image', 'card', 'timeline-item'
  content JSONB NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Foreign key relationship to game sections
- Multiple content types supported
- JSONB content field for flexible content structure
- Ordered content through order_index

### Media Assets

The `media_assets` table stores metadata about uploaded media files used in the game content.

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  alt_text VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Stores metadata about media files (actual files stored in cloud storage)
- Tracks creator for audit purposes
- Includes accessibility information (alt text)

### User Progress

The `user_progress` table tracks user completion of modules.

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
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
);
```

**Key features:**
- Tracks completion status at the module level
- Records section completion count
- Tracks reward claim status
- Remembers last visited section for resuming progress
- Unique constraint ensures one progress record per user-module pair

### Section Checkpoints

The `section_checkpoints` table tracks detailed user progress through individual sections.

```sql
CREATE TABLE section_checkpoints (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  section_id UUID REFERENCES game_sections(id) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP,
  responses JSONB, -- User responses to any interactive elements
  time_spent INT, -- Time spent in seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, section_id)
);
```

**Key features:**
- Detailed tracking of section completion
- Stores user responses to interactive elements
- Tracks time spent on each section
- Unique constraint ensures one checkpoint per user-section pair

### Quiz Questions

The `quiz_questions` table stores quiz questions associated with sections.

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY,
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
);
```

**Key features:**
- Foreign key relationship to game sections
- Support for different question types
- JSONB field for flexible options storage
- Includes explanations for correct answers
- Point value for scoring

### User Quiz Responses

The `user_quiz_responses` table stores user answers to quiz questions.

```sql
CREATE TABLE user_quiz_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  question_id UUID REFERENCES quiz_questions(id) NOT NULL,
  user_answer VARCHAR(255),
  is_correct BOOLEAN,
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);
```

**Key features:**
- Tracks user answers to specific questions
- Records correctness of answers
- Tracks points awarded for correct answers
- Unique constraint prevents duplicate responses

### Reward Transactions

The `reward_transactions` table tracks blockchain rewards for completed modules.

```sql
CREATE TABLE reward_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  transaction_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Links user, module, and reward amount
- Tracks blockchain transaction hash
- Status tracking for transaction processing
- Timestamps for auditing

### Module Unlock Schedule

The `module_unlock_schedule` table manages the timed unlocking of modules.

```sql
CREATE TABLE module_unlock_schedule (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  previous_module_id UUID REFERENCES game_modules(id),
  unlock_date TIMESTAMP NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);
```

**Key features:**
- Schedules when modules become available to users
- Tracks the previous module in sequence
- Records whether notifications have been sent
- Unique constraint ensures one unlock record per user-module pair

### Section Unlock Schedule

The `section_unlock_schedule` table manages the timed unlocking of sections.

```sql
CREATE TABLE section_unlock_schedule (
  id UUID PRIMARY KEY,
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
);
```

**Key features:**
- Similar to module unlock but at the section level
- Tracks both module and previous section for context
- Manages granular waiting periods between sections

### Game Notification Templates

The `game_notification_templates` table stores templates for game-related notifications.

```sql
CREATE TABLE game_notification_templates (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'achievement', 'unlock', 'custom'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Templates for different notification types
- Associated with specific modules
- Customizable title and body text

### Module Notification Schedule

The `module_notification_schedule` table configures when notifications should be sent.

```sql
CREATE TABLE module_notification_schedule (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  template_id UUID REFERENCES game_notification_templates(id) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'time_after_completion', 'specific_time', 'before_unlock'
  trigger_hours INT, -- Hours after previous module completion or before unlock
  trigger_time TIME, -- Specific time of day (can be NULL for hour-based triggers)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- Flexible scheduling options
- Links to notification templates
- Different trigger types for notifications

### User Notifications

The `user_notifications` table stores actual notifications for users.

```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  template_id UUID REFERENCES game_notification_templates(id) NOT NULL,
  schedule_id UUID REFERENCES module_notification_schedule(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key features:**
- User-specific notifications
- Tracks read/unread status
- Records scheduled and actual send times
- References original template and schedule

## Entity-Relationship Diagram

```
┌────────────────┐       ┌───────────────┐       ┌────────────────┐
│  game_modules  │       │ game_sections │       │section_content │
├────────────────┤       ├───────────────┤       ├────────────────┤
│ id             │1     *│ id            │1     *│ id             │
│ title          ├───────┤ module_id     │───────┤ section_id     │
│ description    │       │ title         │       │ content_type   │
│ order_index    │       │ section_type  │       │ content (JSONB)│
│ prerequisite_  │       │ order_index   │       │ order_index    │
│  module_id     │◄────┐ │ configuration │       └────────────────┘
└────────────────┘     │ └───────────────┘
                       └─────────────────┐       ┌─────────────────┐
                                         │       │   quiz_questions │
                                         │       ├─────────────────┤
┌───────────────┐       ┌────────────────┤      *│ id              │
│  user_progress │       │section_checkpoints    │ section_id      │
├───────────────┤       ├────────────────┤       │ question_text   │
│ id            │       │ id             │       │ question_type   │
│ user_id       │       │ user_id        │       │ options (JSONB) │
│ module_id     │       │ section_id     │       │ correct_answer  │
│ sections_     │       │ is_completed   │       └─────────────────┘
│  completed    │       │ completion_date│             │
│ is_completed  │       │ responses      │             │
└───────────────┘       └────────────────┘             ▼
        │                      │               ┌────────────────────┐
        │                      │               │  user_quiz_responses│
        │                      │               ├────────────────────┤
        ▼                      │               │ id                 │
┌─────────────────┐            │               │ user_id            │
│reward_transactions          │               │ question_id        │
├─────────────────┤            │               │ user_answer        │
│ id              │            │               │ is_correct         │
│ user_id         │◄───────────┘               │ points_awarded     │
│ module_id       │                            └────────────────────┘
│ amount          │
│ transaction_hash│            ┌─────────────────────┐
│ status          │            │module_unlock_schedule
└─────────────────┘            ├─────────────────────┤
                               │ id                  │
                               │ user_id             │
                               │ module_id           │
                               │ previous_module_id  │
┌──────────────────────┐       │ unlock_date         │
│section_unlock_schedule       │ is_unlocked         │
├──────────────────────┤       └─────────────────────┘
│ id                   │
│ user_id              │       ┌───────────────────────┐
│ section_id           │       │game_notification_templates
│ previous_section_id  │       ├───────────────────────┤
│ module_id            │       │ id                    │
│ unlock_date          │       │ module_id             │
│ is_unlocked          │       │ title                 │
└──────────────────────┘       │ body                  │
        │                      │ notification_type     │
        │                      └───────────────────────┘
        │                                │
        │                                ▼
        │               ┌─────────────────────────────┐
        │               │   module_notification_schedule
        │               ├─────────────────────────────┤
        │               │ id                          │
        │               │ module_id                   │
        │               │ template_id                 │
        │               │ trigger_type                │
        └──────────────▶│ trigger_hours               │
                        └─────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │     user_notifications     │
                        ├───────────────────────────┤
                        │ id                        │
                        │ user_id                   │
                        │ module_id                 │
                        │ template_id               │
                        │ schedule_id               │
                        │ title                     │
                        │ body                      │
                        │ scheduled_for             │
                        │ sent_at                   │
                        │ is_read                   │
                        └───────────────────────────┘
```

## Indexes

To optimize query performance, the following indexes are recommended:

1. **Game Modules**
   - Index on `order_index` for sequence queries
   - Index on `is_active` to filter active modules

2. **Game Sections**
   - Composite index on `(module_id, order_index)` for ordered section queries
   - Index on `section_type` for filtering by type

3. **Section Content**
   - Composite index on `(section_id, order_index)` for ordered content queries

4. **User Progress**
   - Composite index on `(user_id, is_completed)` for finding incomplete modules
   - Index on `last_section_id` for resuming progress

5. **Section Checkpoints**
   - Composite index on `(user_id, is_completed)` for tracking incomplete sections

6. **Quiz Questions**
   - Composite index on `(section_id, order_index)` for ordered question retrieval

7. **Reward Transactions**
   - Index on `status` for filtering by transaction status
   - Composite index on `(user_id, module_id)` for checking reward status

8. **Module/Section Unlock Schedule**
   - Index on `unlock_date` for finding modules due for unlock
   - Composite index on `(user_id, is_unlocked)` for finding locked modules

9. **User Notifications**
   - Index on `scheduled_for` for finding notifications due to be sent
   - Composite index on `(user_id, is_read)` for finding unread notifications

## Data Relationships

### One-to-Many Relationships

1. **Module to Sections**
   - One module contains many sections
   - Foreign key: `module_id` in `game_sections`

2. **Section to Content Items**
   - One section contains many content items
   - Foreign key: `section_id` in `section_content`

3. **Section to Quiz Questions**
   - One section can have many quiz questions
   - Foreign key: `section_id` in `quiz_questions`

4. **Module to Notification Templates**
   - One module can have many notification templates
   - Foreign key: `module_id` in `game_notification_templates`

### Many-to-One Relationships

1. **Sections to Module**
   - Many sections belong to one module
   - Foreign key: `module_id` in `game_sections`

2. **Module to Prerequisite Module**
   - Many modules can have the same prerequisite
   - Foreign key: `prerequisite_module_id` in `game_modules`

### User-Related Relationships

1. **User to Progress Records**
   - One user has many module progress records
   - Foreign key: `user_id` in `user_progress`

2. **User to Checkpoints**
   - One user has many section checkpoints
   - Foreign key: `user_id` in `section_checkpoints`

3. **User to Quiz Responses**
   - One user has many quiz responses
   - Foreign key: `user_id` in `user_quiz_responses`

4. **User to Notifications**
   - One user has many notifications
   - Foreign key: `user_id` in `user_notifications`

## Data Integrity Considerations

### Foreign Key Constraints

All tables with foreign keys have appropriate constraints to maintain referential integrity.

### Uniqueness Constraints

1. `user_progress`: Unique constraint on `(user_id, module_id)` ensures one progress record per user per module.
2. `section_checkpoints`: Unique constraint on `(user_id, section_id)` ensures one checkpoint record per user per section.
3. `user_quiz_responses`: Unique constraint on `(user_id, question_id)` prevents duplicate quiz responses.
4. `module_unlock_schedule`: Unique constraint on `(user_id, module_id)` ensures one unlock schedule per user per module.
5. `section_unlock_schedule`: Unique constraint on `(user_id, section_id)` ensures one unlock schedule per user per section.

### Soft Deletes

While not explicitly included in the schema, consider implementing soft delete functionality for:
- Game modules
- Game sections
- Quiz questions
- Media assets

This can be done by adding an `is_deleted` boolean column and a `deleted_at` timestamp column to these tables.

## Migration Strategy

When implementing this schema, consider the following migration approach:

1. Create base tables without foreign keys first:
   - `game_modules`
   - `users` (if not already existing)
   - `media_assets`

2. Add tables with single foreign key dependencies:
   - `game_sections` (depends on `game_modules`)
   - `game_notification_templates` (depends on `game_modules`)
   - `module_notification_schedule` (depends on two tables)

3. Add tables with multiple foreign key dependencies:
   - `section_content` (depends on `game_sections`)
   - `quiz_questions` (depends on `game_sections`)
   - `user_progress` (depends on `users` and `game_modules`)
   - All remaining tables

4. Add constraints and indexes after all tables are created:
   - Unique constraints
   - Indexes for performance optimization

## Schema Evolution Considerations

1. **Content Versioning**
   - Future addition of versioning tables for modules and sections
   - Addition of `version` and `is_current_version` fields

2. **Enhanced Analytics**
   - Addition of tables for tracking detailed user interaction
   - Consideration of separate analytics schema for reporting

3. **Personalization**
   - Potential addition of tables for personalized learning paths
   - User preference tracking for content tailoring

4. **Localization**
   - Future addition of language fields for multi-language support
   - Consideration of separate localized content tables

## Conclusion

This database schema provides a comprehensive foundation for the Learn to Earn game system, supporting all required functionalities while maintaining good database normalization practices. The schema is designed to be flexible enough to accommodate future enhancements while maintaining data integrity and performance optimization.