import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTemplateEntity } from '../entities/content-template.entity';

@Injectable()
export class ContentTemplateRepository {
  constructor(
    @InjectRepository(ContentTemplateEntity)
    private readonly repository: Repository<ContentTemplateEntity>,
  ) {}

  async findAll(onlyActive: boolean = true): Promise<ContentTemplateEntity[]> {
    return this.repository.find({
      where: onlyActive ? { isActive: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findByType(contentType: string, onlyActive: boolean = true): Promise<ContentTemplateEntity[]> {
    return this.repository.find({
      where: {
        contentType,
        ...(onlyActive ? { isActive: true } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<ContentTemplateEntity> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(templateData: Partial<ContentTemplateEntity>): Promise<ContentTemplateEntity> {
    const template = this.repository.create(templateData);
    return this.repository.save(template);
  }

  async update(id: string, templateData: Partial<ContentTemplateEntity>): Promise<ContentTemplateEntity> {
    await this.repository.update({ id }, templateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<ContentTemplateEntity> {
    const template = await this.findById(id);
    if (template) {
      template.isActive = false;
      return this.repository.save(template);
    }
    return null;
  }
}