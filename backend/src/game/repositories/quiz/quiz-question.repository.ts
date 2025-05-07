import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizQuestion } from '../../entities/quiz/quiz-question.entity';
import { QuestionTypeEnum } from '../../interfaces/quiz/quiz-types.interface';

@Injectable()
export class QuizQuestionRepository {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly questionRepository: Repository<QuizQuestion>,
  ) {}

  async findById(id: string): Promise<QuizQuestion | null> {
    return this.questionRepository.findOne({
      where: { id },
    });
  }

  async findByQuizId(quizId: string): Promise<QuizQuestion[]> {
    return this.questionRepository.find({
      where: { quizId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findByQuizIdWithResponses(quizId: string): Promise<QuizQuestion[]> {
    // Include user responses relationship when fetching by quiz ID
    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.quiz', 'quiz')
      .leftJoinAndSelect('question.userResponses', 'responses')
      .where('question.quizId = :quizId', { quizId })
      .orderBy('question.orderIndex', 'ASC')
      .getMany();
  }

  async findByType(quizId: string, type: QuestionTypeEnum): Promise<QuizQuestion[]> {
    return this.questionRepository.find({
      where: { quizId, type },
      order: { orderIndex: 'ASC' },
    });
  }

  async create(questionData: Partial<QuizQuestion>): Promise<QuizQuestion> {
    // If orderIndex is not provided, set it to the highest index + 1
    if (!questionData.orderIndex && questionData.quizId) {
      const highestOrder = await this.getHighestOrderIndex(questionData.quizId);
      questionData.orderIndex = highestOrder + 1;
    }

    const question = this.questionRepository.create(questionData);
    return this.questionRepository.save(question);
  }

  async update(id: string, questionData: Partial<QuizQuestion>): Promise<QuizQuestion> {
    await this.questionRepository.update(id, questionData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.questionRepository.delete(id);
    return result.affected > 0;
  }

  async getHighestOrderIndex(quizId: string): Promise<number> {
    const result = await this.questionRepository
      .createQueryBuilder('question')
      .select('MAX(question.orderIndex)', 'maxOrder')
      .where('question.quizId = :quizId', { quizId })
      .getRawOne();

    return result && result.maxOrder ? Number(result.maxOrder) : 0;
  }

  async reorderQuestions(quizId: string, questionOrderMap: Record<string, number>): Promise<boolean> {
    try {
      // Handle each question update in parallel
      const updatePromises = Object.entries(questionOrderMap).map(([questionId, orderIndex]) => {
        return this.questionRepository.update(questionId, { orderIndex });
      });
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error reordering questions:', error);
      return false;
    }
  }

  async countByQuizId(quizId: string): Promise<number> {
    return this.questionRepository.count({
      where: { quizId },
    });
  }
}