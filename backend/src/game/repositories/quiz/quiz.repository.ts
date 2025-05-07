import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Quiz } from '../../entities/quiz/quiz.entity';
import { QuizDifficultyEnum } from '../../interfaces/quiz/quiz-types.interface';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async findById(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async findByIdWithQuestions(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async findAllQuizzes(
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    difficulty?: QuizDifficultyEnum,
    isActive?: boolean,
  ): Promise<[Quiz[], number]> {
    const where: FindOptionsWhere<Quiz> = {};
    
    if (searchTerm) {
      where.title = Like(`%${searchTerm}%`);
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    return this.quizRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['questions'],
    });
  }

  async findByModuleId(moduleId: string): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { moduleId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySectionId(sectionId: string): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { sectionId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(quizData: Partial<Quiz>): Promise<Quiz> {
    const quiz = this.quizRepository.create(quizData);
    return this.quizRepository.save(quiz);
  }

  async update(id: string, quizData: Partial<Quiz>): Promise<Quiz> {
    await this.quizRepository.update(id, quizData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.quizRepository.delete(id);
    return result.affected > 0;
  }

  async calculateTotalPoints(quizId: string): Promise<number> {
    const quiz = await this.findByIdWithQuestions(quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return 0;
    }
    
    return quiz.questions.reduce((total, question) => total + question.points, 0);
  }

  async updateTotalPoints(quizId: string): Promise<void> {
    const totalPoints = await this.calculateTotalPoints(quizId);
    await this.quizRepository.update(quizId, { totalPoints });
  }
}