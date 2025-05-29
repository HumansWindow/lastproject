# Diary System Backend Implementation

This document provides a comprehensive guide for implementing the backend components of the diary system.

## Database Schema

### DiaryEntry Entity

```typescript
// src/modules/diary/entities/diary-entry.entity.ts
import { User } from '../../users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum DiaryPrivacyLevel {
  PRIVATE = 'private',
  FRIENDS = 'friends',
  PUBLIC = 'public',
}

@Entity('diary_entries')
export class DiaryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  mediaUrls: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({
    type: 'enum',
    enum: DiaryPrivacyLevel,
    default: DiaryPrivacyLevel.PRIVATE,
  })
  privacyLevel: DiaryPrivacyLevel;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  mood: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
}
```

### DiaryReminder Entity

```typescript
// src/modules/diary/entities/diary-reminder.entity.ts
import { User } from '../../users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('diary_reminders')
export class DiaryReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'time' })
  reminderTime: string;

  @Column({ type: 'jsonb' })
  daysOfWeek: number[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

## Data Transfer Objects (DTOs)

### Create Diary Entry DTO

```typescript
// src/modules/diary/dto/create-diary-entry.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { DiaryPrivacyLevel } from '../entities/diary-entry.entity';

export class CreateDiaryEntryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(DiaryPrivacyLevel)
  @IsOptional()
  privacyLevel?: DiaryPrivacyLevel;

  @IsString()
  @IsOptional()
  mood?: string;

  @IsObject()
  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}
```

### Update Diary Entry DTO

```typescript
// src/modules/diary/dto/update-diary-entry.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaryEntryDto } from './create-diary-entry.dto';

export class UpdateDiaryEntryDto extends PartialType(CreateDiaryEntryDto) {}
```

### Filter Diary Entry DTO

```typescript
// src/modules/diary/dto/filter-diary-entries.dto.ts
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { DiaryPrivacyLevel } from '../entities/diary-entry.entity';
import { Type } from 'class-transformer';

export class FilterDiaryEntriesDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(DiaryPrivacyLevel)
  privacyLevel?: DiaryPrivacyLevel;

  @IsOptional()
  @IsString()
  mood?: string;
}
```

## Module Definition

```typescript
// src/modules/diary/diary.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryReminder } from './entities/diary-reminder.entity';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryEntry, DiaryReminder]),
    NotificationsModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
```

## Service Implementation

```typescript
// src/modules/diary/diary.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { DiaryEntry, DiaryPrivacyLevel } from './entities/diary-entry.entity';
import { DiaryReminder } from './entities/diary-reminder.entity';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { FilterDiaryEntriesDto } from './dto/filter-diary-entries.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry)
    private diaryEntryRepository: Repository<DiaryEntry>,
    
    @InjectRepository(DiaryReminder)
    private diaryReminderRepository: Repository<DiaryReminder>,
    
    private notificationsService: NotificationsService,
  ) {}

  async createEntry(userId: string, createDiaryEntryDto: CreateDiaryEntryDto): Promise<DiaryEntry> {
    const newEntry = this.diaryEntryRepository.create({
      ...createDiaryEntryDto,
      userId,
    });
    
    return this.diaryEntryRepository.save(newEntry);
  }

  async findAllEntries(userId: string, filterDto: FilterDiaryEntriesDto): Promise<DiaryEntry[]> {
    const { searchTerm, tags, startDate, endDate, privacyLevel, mood } = filterDto;
    
    const queryBuilder = this.diaryEntryRepository.createQueryBuilder('diaryEntry')
      .where('diaryEntry.userId = :userId', { userId })
      .andWhere('diaryEntry.isDeleted = false');
    
    if (searchTerm) {
      queryBuilder.andWhere(
        '(diaryEntry.title ILIKE :searchTerm OR diaryEntry.content ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );
    }
    
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('diaryEntry.tags @> :tags', { tags: JSON.stringify(tags) });
    }
    
    if (startDate && endDate) {
      queryBuilder.andWhere('diaryEntry.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('diaryEntry.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('diaryEntry.createdAt <= :endDate', { endDate });
    }
    
    if (privacyLevel) {
      queryBuilder.andWhere('diaryEntry.privacyLevel = :privacyLevel', { privacyLevel });
    }
    
    if (mood) {
      queryBuilder.andWhere('diaryEntry.mood = :mood', { mood });
    }
    
    queryBuilder.orderBy('diaryEntry.createdAt', 'DESC');
    
    return queryBuilder.getMany();
  }

  async findEntryById(id: string, userId: string): Promise<DiaryEntry> {
    const entry = await this.diaryEntryRepository.findOne({ 
      where: { id, isDeleted: false } 
    });
    
    if (!entry) {
      throw new NotFoundException(`Diary entry with ID ${id} not found`);
    }
    
    if (entry.userId !== userId && entry.privacyLevel === DiaryPrivacyLevel.PRIVATE) {
      throw new ForbiddenException('You do not have permission to access this diary entry');
    }
    
    return entry;
  }

  async updateEntry(id: string, userId: string, updateDiaryEntryDto: UpdateDiaryEntryDto): Promise<DiaryEntry> {
    const entry = await this.findEntryById(id, userId);
    
    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this diary entry');
    }
    
    const updatedEntry = {
      ...entry,
      ...updateDiaryEntryDto,
    };
    
    return this.diaryEntryRepository.save(updatedEntry);
  }

  async deleteEntry(id: string, userId: string): Promise<void> {
    const entry = await this.findEntryById(id, userId);
    
    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this diary entry');
    }
    
    // Soft delete
    await this.diaryEntryRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  async setReminder(userId: string, reminderTime: string, daysOfWeek: number[]): Promise<DiaryReminder> {
    const newReminder = this.diaryReminderRepository.create({
      userId,
      reminderTime,
      daysOfWeek,
      isActive: true,
    });
    
    return this.diaryReminderRepository.save(newReminder);
  }

  async getUserReminders(userId: string): Promise<DiaryReminder[]> {
    return this.diaryReminderRepository.find({
      where: { userId, isActive: true },
    });
  }

  async toggleReminder(id: string, userId: string, isActive: boolean): Promise<DiaryReminder> {
    const reminder = await this.diaryReminderRepository.findOne({
      where: { id, userId },
    });
    
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    
    reminder.isActive = isActive;
    return this.diaryReminderRepository.save(reminder);
  }

  async deleteReminder(id: string, userId: string): Promise<void> {
    const result = await this.diaryReminderRepository.delete({ id, userId });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
  }

  async getDiaryStats(userId: string): Promise<any> {
    const totalEntries = await this.diaryEntryRepository.count({
      where: { userId, isDeleted: false },
    });
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const entriesThisMonth = await this.diaryEntryRepository.count({
      where: {
        userId,
        isDeleted: false,
        createdAt: Between(startOfMonth, today),
      },
    });
    
    // Get mood distribution
    const moodDistribution = await this.diaryEntryRepository
      .createQueryBuilder('entry')
      .select('entry.mood', 'mood')
      .addSelect('COUNT(*)', 'count')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.isDeleted = false')
      .andWhere('entry.mood IS NOT NULL')
      .groupBy('entry.mood')
      .getRawMany();
    
    // Get entry streak (consecutive days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = await this.diaryEntryRepository.find({
      where: {
        userId,
        isDeleted: false,
        createdAt: Between(thirtyDaysAgo, today),
      },
      select: ['createdAt'],
      order: { createdAt: 'DESC' },
    });
    
    const entriesByDate = new Map<string, boolean>();
    recentEntries.forEach(entry => {
      const dateStr = new Date(entry.createdAt).toISOString().split('T')[0];
      entriesByDate.set(dateStr, true);
    });
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entriesByDate.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return {
      totalEntries,
      entriesThisMonth,
      currentStreak,
      moodDistribution,
    };
  }
}
```

## Controller Implementation

```typescript
// src/modules/diary/diary.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from './dto/create-diary-entry.dto';
import { UpdateDiaryEntryDto } from './dto/update-diary-entry.dto';
import { FilterDiaryEntriesDto } from './dto/filter-diary-entries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryReminder } from './entities/diary-reminder.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('diary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Create a new diary entry' })
  @ApiResponse({ status: 201, description: 'The diary entry has been created successfully.' })
  async createEntry(
    @Request() req,
    @Body() createDiaryEntryDto: CreateDiaryEntryDto,
  ): Promise<DiaryEntry> {
    return this.diaryService.createEntry(req.user.id, createDiaryEntryDto);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Get all diary entries for the user' })
  async findAllEntries(
    @Request() req,
    @Query() filterDto: FilterDiaryEntriesDto,
  ): Promise<DiaryEntry[]> {
    return this.diaryService.findAllEntries(req.user.id, filterDto);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Get a diary entry by ID' })
  async findEntryById(
    @Request() req,
    @Param('id') id: string,
  ): Promise<DiaryEntry> {
    return this.diaryService.findEntryById(id, req.user.id);
  }

  @Put('entries/:id')
  @ApiOperation({ summary: 'Update a diary entry' })
  async updateEntry(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDiaryEntryDto: UpdateDiaryEntryDto,
  ): Promise<DiaryEntry> {
    return this.diaryService.updateEntry(id, req.user.id, updateDiaryEntryDto);
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete a diary entry (soft delete)' })
  @ApiResponse({ status: 204, description: 'The diary entry has been deleted successfully.' })
  async deleteEntry(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    return this.diaryService.deleteEntry(id, req.user.id);
  }

  @Post('reminders')
  @ApiOperation({ summary: 'Set a diary reminder' })
  async setReminder(
    @Request() req,
    @Body() reminderData: { reminderTime: string; daysOfWeek: number[] },
  ): Promise<DiaryReminder> {
    return this.diaryService.setReminder(
      req.user.id,
      reminderData.reminderTime,
      reminderData.daysOfWeek,
    );
  }

  @Get('reminders')
  @ApiOperation({ summary: 'Get all diary reminders for the user' })
  async getUserReminders(@Request() req): Promise<DiaryReminder[]> {
    return this.diaryService.getUserReminders(req.user.id);
  }

  @Put('reminders/:id/toggle')
  @ApiOperation({ summary: 'Toggle a diary reminder active status' })
  async toggleReminder(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { isActive: boolean },
  ): Promise<DiaryReminder> {
    return this.diaryService.toggleReminder(id, req.user.id, data.isActive);
  }

  @Delete('reminders/:id')
  @ApiOperation({ summary: 'Delete a diary reminder' })
  @ApiResponse({ status: 204, description: 'The diary reminder has been deleted successfully.' })
  async deleteReminder(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    return this.diaryService.deleteReminder(id, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get diary statistics for the user' })
  async getDiaryStats(@Request() req): Promise<any> {
    return this.diaryService.getDiaryStats(req.user.id);
  }
}
```

## Database Migration

```typescript
// src/migrations/1715890000000-CreateDiaryTables.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiaryTables1715890000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for privacy levels
    await queryRunner.query(`
      CREATE TYPE diary_privacy_level_enum AS ENUM ('private', 'friends', 'public');
    `);

    // Create diary entries table
    await queryRunner.query(`
      CREATE TABLE diary_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        media_urls JSONB,
        tags JSONB,
        privacy_level diary_privacy_level_enum NOT NULL DEFAULT 'private',
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at TIMESTAMPTZ,
        mood VARCHAR(255),
        location JSONB,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create index for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_diary_entries_user_id ON diary_entries(user_id);
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_diary_entries_created_at ON diary_entries(created_at);
    `);

    // Create diary reminders table
    await queryRunner.query(`
      CREATE TABLE diary_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        reminder_time TIME NOT NULL,
        days_of_week JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create index for diary reminders
    await queryRunner.query(`
      CREATE INDEX idx_diary_reminders_user_id ON diary_reminders(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_diary_reminders_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS diary_reminders;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_diary_entries_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_diary_entries_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS diary_entries;`);
    await queryRunner.query(`DROP TYPE IF EXISTS diary_privacy_level_enum;`);
  }
}
```

## Implementation Checklist

- [ ] Add entities to TypeORM configuration
- [ ] Create migrations for database tables
- [ ] Implement Diary module, service, and controller
- [ ] Add diary entry privacy control logic
- [ ] Set up diary reminder notification system
- [ ] Implement full-text search for diary entries
- [ ] Add unit tests for diary service
- [ ] Set up integration tests for diary endpoints
- [ ] Add authorization guards for diary endpoints
- [ ] Document API endpoints with Swagger
- [ ] Implement analytic features for diary usage

## Best Practices

1. **Security**: 
   - Ensure privacy levels are properly enforced
   - Validate user ownership of entries before any modification
   - Sanitize content to prevent XSS attacks

2. **Performance**:
   - Use indexes for frequently queried fields
   - Paginate results for large result sets
   - Implement caching for frequently accessed data

3. **Maintainability**:
   - Keep service methods focused on single responsibilities
   - Document complex logic with comments
   - Create comprehensive test coverage