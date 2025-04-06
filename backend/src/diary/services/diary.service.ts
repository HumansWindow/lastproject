import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diary, DiaryLocation } from '../entities/diary.entity';
import { CreateDiaryDto, UpdateDiaryDto } from '../dto/diary.dto';
import * as crypto from 'crypto';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(Diary)
    private diaryRepository: Repository<Diary>,
  ) {}

  async create(userId: string, createDiaryDto: CreateDiaryDto): Promise<Diary> {
    const diary = this.diaryRepository.create({
      ...createDiaryDto,
      userId: userId, // Keep userId as string
    });

    // Generate encryption key if the diary has media
    if (createDiaryDto.hasMedia) {
      diary.encryptionKey = this.generateEncryptionKey();
    }

    return this.diaryRepository.save(diary);
  }

  async findAll(userId: string): Promise<Diary[]> {
    return this.diaryRepository.find({
      where: { userId: userId }, // Keep userId as string
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Diary> {
    const diary = await this.diaryRepository.findOne({
      where: { id },
    });

    if (!diary) {
      throw new NotFoundException(`Diary with ID ${id} not found`);
    }

    if (diary.userId !== userId) { // Compare strings directly
      throw new UnauthorizedException('You do not have permission to access this diary entry');
    }

    return diary;
  }

  async update(id: string, userId: string, updateDiaryDto: UpdateDiaryDto): Promise<Diary> {
    const diary = await this.findOne(id, userId);
    
    // Generate encryption key if diary now has media and didn't have it before
    if (updateDiaryDto.hasMedia === true && !diary.encryptionKey) {
      updateDiaryDto['encryptionKey'] = this.generateEncryptionKey();
    }
    
    Object.assign(diary, updateDiaryDto);

    return this.diaryRepository.save(diary);
  }

  async remove(id: string, userId: string): Promise<void> {
    const diary = await this.findOne(id, userId);
    await this.diaryRepository.remove(diary);
  }

  async addDiaryLocation(locationName: string): Promise<string> {
    // This is a placeholder. In a real implementation, you would add to the enum
    // or have a separate DiaryLocation entity table that can be extended
    return `Location ${locationName} would be added if this was implemented fully`;
  }

  private generateEncryptionKey(): string {
    // Generate a random 32-byte encryption key for media files
    return crypto.randomBytes(32).toString('hex');
  }
}