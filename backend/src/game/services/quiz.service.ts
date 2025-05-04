import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { UserQuizResponse } from '../entities/user-quiz-response.entity';
import { GameSection } from '../entities/game-section.entity';
import { 
  QuizQuestionDto, 
  CreateQuizQuestionDto, 
  UpdateQuizQuestionDto,
  QuizQuestionListDto,
  SubmitQuizAnswerDto,
  QuizResultDto,
  SectionQuizDto,
  QuestionType
} from '../dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepository: Repository<QuizQuestion>,
    @InjectRepository(UserQuizResponse)
    private readonly userQuizResponseRepository: Repository<UserQuizResponse>,
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>
  ) {}

  /**
   * Get all quiz questions for a section
   * @param sectionId Section ID
   * @returns Promise with quiz questions list
   */
  async getSectionQuiz(sectionId: string): Promise<SectionQuizDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({ where: { id: sectionId } });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    if (section.sectionType !== 'quiz') {
      throw new BadRequestException(`Section ${sectionId} is not a quiz section`);
    }
    
    // Get questions for this section
    const questions = await this.quizQuestionRepository.find({
      where: { sectionId: sectionId },
      order: { orderIndex: 'ASC' }
    });
    
    return {
      sectionId,
      sectionTitle: section.title,
      title: section.title, // Add title to match SectionQuizDto
      totalQuestions: questions.length, // Add totalQuestions
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0), // Add totalPoints
      questions: questions.map(q => this.mapQuestionToDto(q, false))
    };
  }

  /**
   * Get a specific quiz question
   * @param questionId Question ID
   * @returns Promise with quiz question DTO
   */
  async getQuestionById(questionId: string): Promise<QuizQuestionDto> {
    const question = await this.quizQuestionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${questionId} not found`);
    }
    
    return this.mapQuestionToDto(question);
  }

  /**
   * Create a new quiz question
   * @param createDto DTO with question data
   * @returns Promise with created quiz question DTO
   */
  async createQuestion(createDto: CreateQuizQuestionDto): Promise<QuizQuestionDto> {
    // Verify section exists
    const sectionExists = await this.gameSectionRepository.count({ 
      where: { id: createDto.sectionId } 
    });
    
    if (!sectionExists) {
      throw new NotFoundException(`Game section with ID ${createDto.sectionId} not found`);
    }
    
    // Get highest order index and add 1 for new question
    let orderIndex = createDto.orderIndex;
    if (orderIndex === undefined) {
      const lastQuestion = await this.quizQuestionRepository.findOne({
        where: { sectionId: createDto.sectionId },
        order: { orderIndex: 'DESC' }
      });
      
      orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;
    }
    
    const question = this.quizQuestionRepository.create({
      sectionId: createDto.sectionId,
      questionText: createDto.questionText,
      questionType: createDto.questionType,
      options: createDto.options || [],
      correctAnswer: createDto.correctAnswer,
      explanation: createDto.explanation,
      points: createDto.points || 1,
      orderIndex: orderIndex
    });
    
    const savedQuestion = await this.quizQuestionRepository.save(question);
    return this.mapQuestionToDto(savedQuestion);
  }

  /**
   * Update an existing quiz question
   * @param questionId Question ID
   * @param updateDto DTO with question data to update
   * @returns Promise with updated quiz question DTO
   */
  async updateQuestion(
    questionId: string, 
    updateDto: UpdateQuizQuestionDto
  ): Promise<QuizQuestionDto> {
    const question = await this.quizQuestionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${questionId} not found`);
    }
    
    // Update question properties
    if (updateDto.questionText !== undefined) question.questionText = updateDto.questionText;
    if (updateDto.questionType !== undefined) question.questionType = updateDto.questionType;
    if (updateDto.options !== undefined) question.options = updateDto.options;
    if (updateDto.correctAnswer !== undefined) question.correctAnswer = updateDto.correctAnswer;
    if (updateDto.explanation !== undefined) question.explanation = updateDto.explanation;
    if (updateDto.points !== undefined) question.points = updateDto.points;
    if (updateDto.orderIndex !== undefined) question.orderIndex = updateDto.orderIndex;
    
    const savedQuestion = await this.quizQuestionRepository.save(question);
    return this.mapQuestionToDto(savedQuestion);
  }

  /**
   * Delete a quiz question
   * @param questionId Question ID
   */
  async deleteQuestion(questionId: string): Promise<void> {
    const question = await this.quizQuestionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${questionId} not found`);
    }
    
    await this.quizQuestionRepository.remove(question);
  }

  /**
   * Submit an answer to a quiz question
   * @param userId User ID
   * @param answerDto DTO with answer data
   * @returns Promise with submission result
   */
  async submitAnswer(
    userId: string,
    answerDto: SubmitQuizAnswerDto
  ): Promise<{ isCorrect: boolean; points: number; explanation?: string }> {
    const { questionId, userAnswer } = answerDto; // Fix: Use userAnswer instead of answer
    
    // Verify question exists
    const question = await this.quizQuestionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${questionId} not found`);
    }
    
    // Check if user has already answered this question
    const existingResponse = await this.userQuizResponseRepository.findOne({
      where: { 
        userId: userId, 
        questionId: questionId  // Fix: Use questionId instead of question_id
      }
    });
    
    // Evaluate answer
    const isCorrect = this.evaluateAnswer(question, userAnswer);
    const points = isCorrect ? question.points : 0;
    
    // Create or update response
    if (existingResponse) {
      existingResponse.userAnswer = userAnswer;
      existingResponse.isCorrect = isCorrect;
      existingResponse.pointsAwarded = points;
      await this.userQuizResponseRepository.save(existingResponse);
    } else {
      const response = this.userQuizResponseRepository.create({
        userId: userId,
        questionId: questionId, // Fix: Use questionId instead of question_id
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        pointsAwarded: points
      });
      await this.userQuizResponseRepository.save(response);
    }
    
    return {
      isCorrect,
      points,
      explanation: question.explanation
    };
  }

  /**
   * Get quiz results for a section
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with quiz results
   */
  async getSectionResults(userId: string, sectionId: string): Promise<QuizResultDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({ where: { id: sectionId } });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get all questions for this section
    const questions = await this.quizQuestionRepository.find({
      where: { sectionId: sectionId },
      order: { orderIndex: 'ASC' }
    });
    
    if (questions.length === 0) {
      return {
        id: '', // Add missing required properties
        userId,
        sectionId,
        questionId: '',
        answer: '',
        isCorrect: false,
        points: 0,
        createdAt: new Date(),
        totalQuestions: 0,
        answeredQuestions: 0,
        correctAnswers: 0,
        totalPoints: 0,
        earnedPoints: 0,
        percentageScore: 0
      };
    }
    
    // Get user responses for these questions
    const questionIds = questions.map(q => q.id);
    const responses = await this.userQuizResponseRepository.find({
      where: { 
        userId: userId, 
        questionId: In(questionIds)  // Fix: Use In operator from TypeORM for array of IDs
      }
    });
    
    // Calculate statistics
    const totalQuestions = questions.length;
    const answeredQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = responses.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const percentageScore = totalPoints > 0 
      ? Math.round((earnedPoints / totalPoints) * 100) 
      : 0;
    
    // Use first question/response for base data if available
    const firstQuestion = questions[0];
    const firstResponse = responses.length > 0 ? responses[0] : null;
    
    return {
      id: firstResponse?.id || '',
      userId,
      sectionId,
      questionId: firstQuestion?.id || '',
      answer: firstResponse?.userAnswer || '',
      isCorrect: firstResponse?.isCorrect || false,
      points: firstResponse?.pointsAwarded || 0,
      createdAt: firstResponse?.createdAt || new Date(),
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      totalPoints,
      earnedPoints,
      percentageScore
    };
  }

  /**
   * Reorder quiz questions within a section
   * @param sectionId Section ID
   * @param questionIds Array of question IDs in the desired order
   * @returns Promise with updated question list
   */
  async reorderQuestions(sectionId: string, questionIds: string[]): Promise<QuizQuestionListDto> {
    // Verify section exists
    const sectionExists = await this.gameSectionRepository.count({
      where: { id: sectionId }
    });
    
    if (!sectionExists) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Verify all questions belong to the section
    const questions = await this.quizQuestionRepository.find({
      where: { sectionId: sectionId }
    });
    
    const sectionQuestionIds = new Set(questions.map(q => q.id));
    const invalidIds = questionIds.filter(id => !sectionQuestionIds.has(id));
    
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `The following question IDs do not belong to the section: ${invalidIds.join(', ')}`
      );
    }
    
    // Update order indices
    await Promise.all(questionIds.map(async (id, index) => {
      await this.quizQuestionRepository.update(id, { orderIndex: index });
    }));
    
    // Get updated questions
    const updatedQuestions = await this.quizQuestionRepository.find({
      where: { sectionId: sectionId },
      order: { orderIndex: 'ASC' }
    });
    
    return {
      sectionId,
      questions: updatedQuestions.map(q => this.mapQuestionToDto(q)),
      totalCount: updatedQuestions.length // Add totalCount to match QuizQuestionListDto
    };
  }

  /**
   * Map question entity to DTO
   * @param question Question entity
   * @param includeCorrectAnswer Whether to include the correct answer in the DTO
   * @returns Quiz question DTO or QuizQuestionWithAnswerDto
   */
  private mapQuestionToDto(
    question: QuizQuestion, 
    includeCorrectAnswer = true
  ): any {
    // Convert string questionType to enum
    const questionTypeEnum = this.stringToQuestionType(question.questionType);
    
    const baseDto = {
      id: question.id,
      sectionId: question.sectionId,
      questionText: question.questionText,
      questionType: questionTypeEnum,
      options: Array.isArray(question.options) ? question.options : [], // Ensure options is an array
      points: question.points,
      orderIndex: question.orderIndex,
      explanation: question.explanation
    };
    
    if (includeCorrectAnswer) {
      // Return with correctAnswer for QuizQuestionWithAnswerDto
      return {
        ...baseDto,
        correctAnswer: question.correctAnswer
      };
    } else {
      // Return without correctAnswer for regular QuizQuestionDto
      return baseDto;
    }
  }
  
  /**
   * Convert string question type to enum
   * @param questionType String question type
   * @returns QuestionType enum value
   */
  private stringToQuestionType(questionType: string): QuestionType {
    switch (questionType) {
      case 'multiple-choice':
        return QuestionType.MULTIPLE_CHOICE;
      case 'true-false':
        return QuestionType.TRUE_FALSE;
      case 'text':
        return QuestionType.TEXT_INPUT;
      default:
        return QuestionType.SINGLE_CHOICE;
    }
  }

  /**
   * Evaluate if an answer is correct
   * @param question Question entity
   * @param answer User answer
   * @returns Boolean indicating if the answer is correct
   */
  private evaluateAnswer(question: QuizQuestion, answer: string): boolean {
    if (!question.correctAnswer || !answer) {
      return false;
    }
    
    if (question.questionType === 'multiple-choice' || question.questionType === 'single-choice' || question.questionType === 'true-false') {
      // Perform exact match for choice questions
      return question.correctAnswer === answer;
    }
    
    if (question.questionType === 'text') {
      // For text questions, do case-insensitive comparison
      const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
      const normalizedAnswer = answer.toLowerCase().trim();
      return normalizedCorrect === normalizedAnswer;
    }
    
    return false;
  }
}