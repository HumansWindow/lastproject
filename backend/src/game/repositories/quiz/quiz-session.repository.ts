import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { QuizSession } from '../../entities/quiz/quiz-session.entity';
import { QuizSessionStatus } from '../../interfaces/quiz/quiz-types.interface';

@Injectable()
export class QuizSessionRepository {
  constructor(
    @InjectRepository(QuizSession)
    private readonly sessionRepository: Repository<QuizSession>,
  ) {}

  async findById(id: string): Promise<QuizSession | null> {
    return this.sessionRepository.findOne({
      where: { id },
      relations: ['responses', 'quiz'],
    });
  }

  async findByQuizAndUser(quizId: string, userId: string, withResponses = false): Promise<QuizSession[]> {
    const relations = ['quiz'];
    if (withResponses) {
      relations.push('responses');
    }
    
    return this.sessionRepository.find({
      where: { quizId, userId },
      relations,
      order: { startTime: 'DESC' },
    });
  }

  async findLatestSession(quizId: string, userId: string): Promise<QuizSession | null> {
    return this.sessionRepository.findOne({
      where: { quizId, userId },
      relations: ['responses', 'quiz'],
      order: { startTime: 'DESC' },
    });
  }

  async findActiveSession(quizId: string, userId: string): Promise<QuizSession | null> {
    return this.sessionRepository.findOne({
      where: { 
        quizId, 
        userId, 
        status: QuizSessionStatus.IN_PROGRESS 
      },
      relations: ['responses', 'quiz'],
    });
  }

  async findCompletedSessions(quizId: string, userId: string): Promise<QuizSession[]> {
    return this.sessionRepository.find({
      where: { 
        quizId, 
        userId, 
        status: QuizSessionStatus.COMPLETED 
      },
      relations: ['quiz'],
      order: { endTime: 'DESC' },
    });
  }

  async findAllUserSessions(userId: string, page = 1, limit = 10): Promise<[QuizSession[], number]> {
    return this.sessionRepository.findAndCount({
      where: { userId },
      relations: ['quiz'],
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countAttemptsByQuizAndUser(quizId: string, userId: string): Promise<number> {
    return this.sessionRepository.count({
      where: { quizId, userId },
    });
  }

  async findSessionsInDateRange(
    startDate: Date,
    endDate: Date,
    quizId?: string,
  ): Promise<QuizSession[]> {
    const where: any = {
      startTime: Between(startDate, endDate),
    };
    
    if (quizId) {
      where.quizId = quizId;
    }
    
    return this.sessionRepository.find({
      where,
      relations: ['quiz'],
    });
  }

  async create(sessionData: Partial<QuizSession>): Promise<QuizSession> {
    const session = this.sessionRepository.create(sessionData);
    return this.sessionRepository.save(session);
  }

  async update(id: string, sessionData: Partial<QuizSession>): Promise<QuizSession> {
    await this.sessionRepository.update(id, sessionData);
    return this.findById(id);
  }

  async getAverageScoreByQuiz(quizId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('AVG(session.percentageScore)', 'averageScore')
      .where('session.quizId = :quizId', { quizId })
      .andWhere('session.status = :status', { status: QuizSessionStatus.COMPLETED })
      .getRawOne();
      
    return result && result.averageScore ? Number(result.averageScore) : 0;
  }

  async getPassRateByQuiz(quizId: string): Promise<number> {
    const completedSessions = await this.sessionRepository.count({
      where: { 
        quizId, 
        status: QuizSessionStatus.COMPLETED 
      }
    });
    
    if (!completedSessions) return 0;
    
    const passedSessions = await this.sessionRepository.count({
      where: { 
        quizId, 
        status: QuizSessionStatus.COMPLETED,
        isPassed: true
      }
    });
    
    return (passedSessions / completedSessions) * 100;
  }

  async getAverageTimeSpentByQuiz(quizId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('AVG(session.totalTimeSpent)', 'averageTime')
      .where('session.quizId = :quizId', { quizId })
      .andWhere('session.status = :status', { status: QuizSessionStatus.COMPLETED })
      .getRawOne();
      
    return result && result.averageTime ? Number(result.averageTime) : 0;
  }
}