import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserQuizResponse } from '../../entities/quiz/user-quiz-response.entity';

@Injectable()
export class UserQuizResponseRepository {
  constructor(
    @InjectRepository(UserQuizResponse)
    private readonly responseRepository: Repository<UserQuizResponse>,
  ) {}

  async findById(id: string): Promise<UserQuizResponse | null> {
    return this.responseRepository.findOne({
      where: { id },
      relations: ['question', 'quizSession'],
    });
  }

  async findByQuestionAndSession(
    questionId: string, 
    sessionId: string
  ): Promise<UserQuizResponse | null> {
    return this.responseRepository.findOne({
      where: { 
        questionId,
        quizSessionId: sessionId
      },
    });
  }

  async findBySession(sessionId: string): Promise<UserQuizResponse[]> {
    return this.responseRepository.find({
      where: { quizSessionId: sessionId },
      relations: ['question'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByQuestion(questionId: string): Promise<UserQuizResponse[]> {
    return this.responseRepository.find({
      where: { questionId },
      relations: ['quizSession'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCorrectAnswerRateByQuestion(questionId: string): Promise<number> {
    const totalResponses = await this.responseRepository.count({
      where: { questionId },
    });
    
    if (!totalResponses) return 0;
    
    const correctResponses = await this.responseRepository.count({
      where: { 
        questionId, 
        isCorrect: true 
      },
    });
    
    return (correctResponses / totalResponses) * 100;
  }

  async findAverageTimeSpentByQuestion(questionId: string): Promise<number> {
    const result = await this.responseRepository
      .createQueryBuilder('response')
      .select('AVG(response.timeSpent)', 'averageTime')
      .where('response.questionId = :questionId', { questionId })
      .getRawOne();
      
    return result && result.averageTime ? Number(result.averageTime) : 0;
  }

  async create(responseData: Partial<UserQuizResponse>): Promise<UserQuizResponse> {
    const response = this.responseRepository.create(responseData);
    return this.responseRepository.save(response);
  }

  async update(id: string, responseData: Partial<UserQuizResponse>): Promise<UserQuizResponse> {
    await this.responseRepository.update(id, responseData);
    return this.findById(id);
  }

  async bulkCreate(responses: Partial<UserQuizResponse>[]): Promise<UserQuizResponse[]> {
    const createdResponses = this.responseRepository.create(responses);
    return this.responseRepository.save(createdResponses);
  }

  async deleteBySession(sessionId: string): Promise<boolean> {
    const result = await this.responseRepository.delete({ quizSessionId: sessionId });
    return result.affected > 0;
  }

  async getResponseStatisticsByQuestion(questionId: string): Promise<{
    totalResponses: number;
    correctResponses: number;
    correctPercentage: number;
    averageTimeSpent: number;
    optionDistribution?: Record<string, number>;
  }> {
    const totalResponses = await this.responseRepository.count({
      where: { questionId },
    });
    
    if (!totalResponses) {
      return {
        totalResponses: 0,
        correctResponses: 0,
        correctPercentage: 0,
        averageTimeSpent: 0,
      };
    }
    
    const correctResponses = await this.responseRepository.count({
      where: { 
        questionId, 
        isCorrect: true 
      },
    });
    
    const averageTimeSpent = await this.findAverageTimeSpentByQuestion(questionId);
    
    // Get distribution of answers for multiple choice questions
    const responses = await this.responseRepository.find({
      where: { questionId },
      select: ['userAnswer'],
    });
    
    const optionDistribution: Record<string, number> = {};
    
    // Try to analyze option distribution if the answers are in a consistent format
    try {
      responses.forEach(response => {
        if (typeof response.userAnswer === 'string') {
          optionDistribution[response.userAnswer] = (optionDistribution[response.userAnswer] || 0) + 1;
        } else if (Array.isArray(response.userAnswer)) {
          response.userAnswer.forEach(option => {
            if (typeof option === 'string') {
              optionDistribution[option] = (optionDistribution[option] || 0) + 1;
            } else if (typeof option === 'object' && option && option.id) {
              optionDistribution[option.id] = (optionDistribution[option.id] || 0) + 1;
            }
          });
        } else if (typeof response.userAnswer === 'object' && response.userAnswer && response.userAnswer.id) {
          optionDistribution[response.userAnswer.id] = (optionDistribution[response.userAnswer.id] || 0) + 1;
        }
      });
    } catch (error) {
      console.error('Error analyzing option distribution:', error);
    }
    
    return {
      totalResponses,
      correctResponses,
      correctPercentage: (correctResponses / totalResponses) * 100,
      averageTimeSpent,
      optionDistribution: Object.keys(optionDistribution).length > 0 ? optionDistribution : undefined,
    };
  }
  
  /**
   * Create a query builder for UserQuizResponse
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<UserQuizResponse> {
    return this.responseRepository.createQueryBuilder(alias);
  }
}