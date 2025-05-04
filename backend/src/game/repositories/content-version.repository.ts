import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentVersionEntity } from '../entities/content-version.entity';

@Injectable()
export class ContentVersionRepository {
  constructor(
    @InjectRepository(ContentVersionEntity)
    private readonly repository: Repository<ContentVersionEntity>,
  ) {}

  async createVersion(
    contentId: string,
    contentData: any,
    changedBy: string,
    changeDescription?: string,
  ): Promise<ContentVersionEntity> {
    // Get the latest version number for this content
    const latestVersion = await this.repository.findOne({
      where: { contentId },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create a new version record
    const newVersion = this.repository.create({
      contentId,
      contentData,
      changedBy,
      changeDescription,
      versionNumber,
    });

    return this.repository.save(newVersion);
  }

  async getVersionHistory(contentId: string): Promise<ContentVersionEntity[]> {
    return this.repository.find({
      where: { contentId },
      order: { versionNumber: 'DESC' },
    });
  }

  async getVersion(versionId: string): Promise<ContentVersionEntity> {
    return this.repository.findOne({
      where: { id: versionId },
    });
  }

  async getVersionByNumber(contentId: string, versionNumber: number): Promise<ContentVersionEntity> {
    return this.repository.findOne({
      where: { contentId, versionNumber },
    });
  }

  async deleteVersionsForContent(contentId: string): Promise<void> {
    await this.repository.delete({ contentId });
  }
}