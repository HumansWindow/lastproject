import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizQuestion } from '../entities/quiz-question.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly repository: Repository<QuizQuestion>,
  ) {}

  async findById(id: string): Promise<QuizQuestion> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<QuizQuestion[]> {
    return this.repository.find({
      where: { id: { $in: ids } as any },
    });
  }

  async findAll(): Promise<QuizQuestion[]> {
    return this.repository.find();
  }

  async create(data: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const quiz = this.repository.create(data);
    return this.repository.save(quiz);
  }

  async update(id: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async getStatistics(): Promise<{ total: number; active: number }> {
    const total = await this.repository.count();
    // Fix the TypeORM query format
    const active = await this.repository.count({ 
      where: { 
        isActive: true 
      } 
    });
    return { total, active };
  }
}