import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionContent } from '../entities/section-content.entity';
import { CreateSectionContentDto, UpdateSectionContentDto } from '../dto/section-content.dto';

@Injectable()
export class SectionContentRepository {
  constructor(
    @InjectRepository(SectionContent)
    private readonly repository: Repository<SectionContent>,
  ) {}

  async findAll(): Promise<SectionContent[]> {
    return this.repository.find({
      order: { sectionId: 'ASC', orderIndex: 'ASC' },
    });
  }

  async findBySectionId(sectionId: string): Promise<SectionContent[]> {
    return this.repository.find({
      where: { sectionId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<SectionContent> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findFiltered(sectionId?: string, contentType?: string): Promise<SectionContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content');
    
    if (sectionId) {
      queryBuilder.andWhere('content.sectionId = :sectionId', { sectionId });
    }
    
    if (contentType) {
      queryBuilder.andWhere('content.contentType = :contentType', { contentType });
    }
    
    return queryBuilder.orderBy('content.sectionId', 'ASC')
      .addOrderBy('content.orderIndex', 'ASC')
      .getMany();
  }

  async create(createDto: CreateSectionContentDto): Promise<SectionContent> {
    // If orderIndex is not provided, place at the end
    if (createDto.orderIndex === undefined) {
      const lastContent = await this.repository.findOne({
        where: { sectionId: createDto.sectionId },
        order: { orderIndex: 'DESC' },
      });
      
      createDto.orderIndex = lastContent ? lastContent.orderIndex + 1 : 0;
    }
    
    const entity = this.repository.create({
      sectionId: createDto.sectionId,
      contentType: createDto.contentType,
      content: createDto.content,
      orderIndex: createDto.orderIndex,
    });
    
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: UpdateSectionContentDto): Promise<SectionContent> {
    const entity = await this.findById(id);
    if (!entity) {
      return null;
    }
    
    // Update only the fields that are provided
    if (updateDto.contentType !== undefined) {
      entity.contentType = updateDto.contentType;
    }
    
    if (updateDto.content !== undefined) {
      entity.content = updateDto.content;
    }
    
    if (updateDto.orderIndex !== undefined) {
      entity.orderIndex = updateDto.orderIndex;
    }
    
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async countAll(): Promise<number> {
    return this.repository.count();
  }

  async countBySectionId(sectionId: string): Promise<number> {
    return this.repository.count({ where: { sectionId } });
  }

  async getContentTypeStatistics(): Promise<Array<{
    type: string;
    count: number;
    averageCompletionRate: number;
    averageTimeSpent: number;
  }>> {
    // This is a placeholder implementation that would typically join with checkpoint data
    // For now, we'll use a simpler approach with aggregation
    const stats = await this.repository
      .createQueryBuilder('content')
      .select('content.contentType', 'type')
      .addSelect('COUNT(content.id)', 'count')
      .groupBy('content.contentType')
      .getRawMany();
    
    // Add placeholder data for completion rate and time spent that would typically
    // come from joining with the checkpoint/progress tables
    return stats.map(stat => ({
      type: stat.type,
      count: parseInt(stat.count),
      averageCompletionRate: 0, // This would be calculated from real data
      averageTimeSpent: 0,      // This would be calculated from real data
    }));
  }

  async getViewStatistics(): Promise<{
    mostViewed: { id: string; title: string; viewCount: number } | null;
    leastViewed: { id: string; title: string; viewCount: number } | null;
    highestEngagement: { id: string; title: string; averageTimeSpent: number } | null;
  }> {
    // In a real implementation, this would join with checkpoint/progress tables
    // For now, return placeholder data
    return {
      mostViewed: null,
      leastViewed: null,
      highestEngagement: null,
    };
  }
  
  async reorderContent(sectionId: string, orderedIds: string[]): Promise<void> {
    // Verify that all content IDs belong to the section
    const contentItems = await this.findBySectionId(sectionId);
    const contentMap = new Map(contentItems.map(item => [item.id, item]));
    
    // Check that all IDs in orderedIds exist in the section
    for (const id of orderedIds) {
      if (!contentMap.has(id)) {
        throw new Error(`Content item ${id} does not belong to section ${sectionId}`);
      }
    }
    
    // Update order indices in a transaction
    await this.repository.manager.transaction(async transactionalEntityManager => {
      for (let i = 0; i < orderedIds.length; i++) {
        await transactionalEntityManager.update(
          SectionContent,
          { id: orderedIds[i] },
          { orderIndex: i }
        );
      }
    });
  }
}