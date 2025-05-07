import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// Repositories
import { QuizRepository } from '../../repositories/quiz/quiz.repository';
import { QuizQuestionRepository } from '../../repositories/quiz/quiz-question.repository';
import { QuizSessionRepository } from '../../repositories/quiz/quiz-session.repository';
import { UserQuizResponseRepository } from '../../repositories/quiz/user-quiz-response.repository';

// Entities
import { Quiz } from '../../entities/quiz/quiz.entity';
import { QuizQuestion } from '../../entities/quiz/quiz-question.entity';
import { QuizSession } from '../../entities/quiz/quiz-session.entity';
import { UserQuizResponse } from '../../entities/quiz/user-quiz-response.entity';

// DTOs
import { CreateQuizDto, UpdateQuizDto, QuizDto, PaginatedQuizzesDto, QuizStatisticsDto } from '../../dto/quiz/quiz.dto';
import { CreateQuestionDto, UpdateQuestionDto, QuestionDto, PaginatedQuestionsDto } from '../../dto/quiz/quiz-question.dto';
import { StartQuizSessionDto, QuizSessionDto, SubmitQuizResponsesDto, QuizResultDto } from '../../dto/quiz/quiz-session.dto';

// Types
import { 
  QuizSessionStatus, 
  QuestionTypeEnum,
  QuizDifficultyEnum,
  QuizAttemptResultStatus
} from '../../interfaces/quiz/quiz-types.interface';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly questionRepository: QuizQuestionRepository,
    private readonly sessionRepository: QuizSessionRepository,
    private readonly responseRepository: UserQuizResponseRepository
  ) {}

  /**
   * Quiz Management Methods
   */

  async createQuiz(createQuizDto: CreateQuizDto, userId: string): Promise<QuizDto> {
    // Create new quiz with user as creator
    const newQuiz = await this.quizRepository.create({
      ...createQuizDto,
      createdBy: userId
    });

    // Return the newly created quiz
    return this.mapQuizToDto(newQuiz);
  }

  async updateQuiz(id: string, updateQuizDto: UpdateQuizDto): Promise<QuizDto> {
    // Check if quiz exists
    const existingQuiz = await this.quizRepository.findById(id);
    if (!existingQuiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Update quiz
    const updatedQuiz = await this.quizRepository.update(id, updateQuizDto);
    
    // If total points have changed significantly, recalculate them
    if (updateQuizDto.passingScore !== undefined) {
      await this.quizRepository.updateTotalPoints(id);
    }

    // Return the updated quiz
    return this.mapQuizToDto(updatedQuiz);
  }

  async getQuizById(id: string): Promise<QuizDto> {
    const quiz = await this.quizRepository.findByIdWithQuestions(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return this.mapQuizToDto(quiz);
  }

  async getAllQuizzes(
    page: number = 1, 
    limit: number = 10,
    searchTerm?: string,
    difficulty?: QuizDifficultyEnum,
    isActive?: boolean
  ): Promise<PaginatedQuizzesDto> {
    const [quizzes, total] = await this.quizRepository.findAllQuizzes(
      page,
      limit,
      searchTerm,
      difficulty,
      isActive
    );

    return {
      quizzes: quizzes.map(quiz => this.mapQuizToDto(quiz)),
      total,
      page,
      limit
    };
  }

  async getQuizzesByModule(moduleId: string): Promise<QuizDto[]> {
    const quizzes = await this.quizRepository.findByModuleId(moduleId);
    return quizzes.map(quiz => this.mapQuizToDto(quiz));
  }

  async getQuizzesBySection(sectionId: string): Promise<QuizDto[]> {
    const quizzes = await this.quizRepository.findBySectionId(sectionId);
    return quizzes.map(quiz => this.mapQuizToDto(quiz));
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return this.quizRepository.delete(id);
  }

  async getQuizStatistics(quizId: string): Promise<QuizStatisticsDto> {
    const quiz = await this.quizRepository.findByIdWithQuestions(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    const averageScore = await this.sessionRepository.getAverageScoreByQuiz(quizId);
    const passRate = await this.sessionRepository.getPassRateByQuiz(quizId);
    const averageTimeSpent = await this.sessionRepository.getAverageTimeSpentByQuiz(quizId);

    // Get statistics for each question
    const questionStats = await Promise.all(
      quiz.questions.map(async question => {
        const stats = await this.responseRepository.getResponseStatisticsByQuestion(question.id);
        return {
          questionId: question.id,
          text: question.text,
          correctRate: stats.correctPercentage,
          averageTimeSpent: stats.averageTimeSpent
        };
      })
    );

    // Count total sessions/attempts
    const totalAttempts = await this.sessionRepository.countAttemptsByQuizAndUser(quizId, null);
    const passingScore = quiz.passingScore;
    
    // Calculate pass count based on totalAttempts and passRate
    const passCount = Math.round((passRate / 100) * totalAttempts);

    return {
      quizId,
      title: quiz.title,
      totalAttempts,
      averageScore,
      passCount,
      passRate,
      averageTimeSpent,
      questionStats
    };
  }

  /**
   * Quiz Question Management Methods
   */

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<QuestionDto> {
    // Check if quiz exists
    const quiz = await this.quizRepository.findById(createQuestionDto.quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${createQuestionDto.quizId} not found`);
    }

    // Validate question data based on question type
    this.validateQuestionData(createQuestionDto);

    // Create question
    const newQuestion = await this.questionRepository.create(createQuestionDto);

    // Update total points for the quiz
    await this.quizRepository.updateTotalPoints(createQuestionDto.quizId);

    // Return the newly created question
    return this.mapQuestionToDto(newQuestion);
  }

  async updateQuestion(id: string, updateQuestionDto: UpdateQuestionDto): Promise<QuestionDto> {
    // Check if question exists
    const existingQuestion = await this.questionRepository.findById(id);
    if (!existingQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // If question type is being changed, validate the new data
    if (updateQuestionDto.type && updateQuestionDto.type !== existingQuestion.type) {
      this.validateQuestionData({
        ...existingQuestion,
        ...updateQuestionDto,
        quizId: existingQuestion.quizId
      } as CreateQuestionDto);
    } else if (updateQuestionDto.options || updateQuestionDto.correctAnswer) {
      // Validate updated options and answers if they're changing
      this.validateQuestionData({
        ...existingQuestion,
        ...updateQuestionDto,
        quizId: existingQuestion.quizId
      } as CreateQuestionDto);
    }

    // Update question
    const updatedQuestion = await this.questionRepository.update(id, updateQuestionDto);

    // If points changed, update the quiz's total points
    if (updateQuestionDto.points !== undefined) {
      await this.quizRepository.updateTotalPoints(existingQuestion.quizId);
    }

    // Return the updated question
    return this.mapQuestionToDto(updatedQuestion);
  }

  async getQuestionById(id: string): Promise<QuestionDto> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return this.mapQuestionToDto(question);
  }

  async getQuestionsByQuiz(quizId: string): Promise<QuestionDto[]> {
    const questions = await this.questionRepository.findByQuizId(quizId);
    return questions.map(question => this.mapQuestionToDto(question));
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const result = await this.questionRepository.delete(id);
    
    // Update total points for the quiz
    await this.quizRepository.updateTotalPoints(question.quizId);
    
    return result;
  }

  async reorderQuizQuestions(
    quizId: string, 
    questionOrder: Record<string, number>
  ): Promise<boolean> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Reorder questions
    return this.questionRepository.reorderQuestions(quizId, questionOrder);
  }

  /**
   * Quiz Session Management Methods
   */

  async startQuizSession(userId: string, startDto: StartQuizSessionDto): Promise<QuizSessionDto> {
    const { quizId } = startDto;
    
    // Check if quiz exists and is active
    const quiz = await this.quizRepository.findByIdWithQuestions(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }
    
    if (!quiz.isActive) {
      throw new BadRequestException('This quiz is not currently available');
    }
    
    // Check if user has reached maximum attempts
    const attemptsCount = await this.sessionRepository.countAttemptsByQuizAndUser(quizId, userId);
    if (quiz.maxAttempts > 0 && attemptsCount >= quiz.maxAttempts) {
      throw new BadRequestException(`You have reached the maximum number of attempts (${quiz.maxAttempts}) for this quiz`);
    }
    
    // Check if user already has an active session for this quiz
    const activeSession = await this.sessionRepository.findActiveSession(quizId, userId);
    if (activeSession) {
      return this.mapSessionToDto(activeSession);
    }
    
    // Create new session
    const questionOrder = quiz.randomizeQuestions 
      ? this.shuffleQuestions(quiz.questions).map(q => q.id)
      : quiz.questions.map(q => q.id);
    
    const newSession = await this.sessionRepository.create({
      quizId,
      userId,
      status: QuizSessionStatus.STARTED,
      startTime: new Date(),
      questionOrder,
      attemptNumber: attemptsCount + 1
    });
    
    return this.mapSessionToDto(newSession);
  }

  async getQuizSession(sessionId: string, userId: string): Promise<QuizSessionDto> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Quiz session with ID ${sessionId} not found`);
    }
    
    if (session.userId !== userId) {
      throw new BadRequestException('You do not have access to this quiz session');
    }
    
    return this.mapSessionToDto(session);
  }

  async submitQuizResponses(
    userId: string, 
    submitDto: SubmitQuizResponsesDto
  ): Promise<QuizResultDto> {
    const { sessionId, responses, totalTimeSpent } = submitDto;
    
    // Verify the session exists and belongs to the user
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Quiz session with ID ${sessionId} not found`);
    }
    
    if (session.userId !== userId) {
      throw new BadRequestException('You do not have access to this quiz session');
    }
    
    if (session.status === QuizSessionStatus.COMPLETED) {
      throw new BadRequestException('This quiz session is already completed');
    }
    
    // Get the quiz with its questions
    const quiz = await this.quizRepository.findByIdWithQuestions(session.quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${session.quizId} not found`);
    }
    
    // Create a map of questions for easy lookup
    const questionsMap = new Map<string, QuizQuestion>();
    quiz.questions.forEach(question => questionsMap.set(question.id, question));
    
    // Process each response
    let totalScore = 0;
    let questionsCorrect = 0;
    const userResponses: UserQuizResponse[] = [];
    
    for (const response of responses) {
      // Verify the question belongs to this quiz
      const question = questionsMap.get(response.questionId);
      if (!question) {
        continue; // Skip responses for questions that don't belong to this quiz
      }
      
      // Evaluate the answer
      const isCorrect = this.evaluateAnswer(question, response.answer);
      const score = isCorrect ? question.points : 0;
      
      if (isCorrect) {
        questionsCorrect++;
      }
      
      // Create response record
      userResponses.push({
        quizSessionId: sessionId,
        questionId: response.questionId,
        userAnswer: response.answer,
        isCorrect,
        score,
        timeSpent: response.timeSpent,
        attemptIndex: 0,
        wasSkipped: response.skipped
      } as UserQuizResponse);
      
      totalScore += score;
    }
    
    // Calculate percentage score
    const percentageScore = quiz.totalPoints > 0 
      ? (totalScore / quiz.totalPoints) * 100
      : 0;
    
    // Determine if passed
    const isPassed = percentageScore >= quiz.passingScore;
    
    // Determine result status
    let resultStatus: QuizAttemptResultStatus;
    if (quiz.resultThresholds) {
      if (percentageScore >= quiz.resultThresholds.excellent) {
        resultStatus = QuizAttemptResultStatus.EXCELLENT;
      } else if (percentageScore >= quiz.resultThresholds.good) {
        resultStatus = QuizAttemptResultStatus.GOOD;
      } else if (percentageScore >= quiz.resultThresholds.pass) {
        resultStatus = QuizAttemptResultStatus.PASS;
      } else {
        resultStatus = QuizAttemptResultStatus.FAIL;
      }
    } else {
      resultStatus = isPassed ? QuizAttemptResultStatus.PASS : QuizAttemptResultStatus.FAIL;
    }
    
    // Update session
    const updatedSessionData: Partial<QuizSession> = {
      status: QuizSessionStatus.COMPLETED,
      endTime: new Date(),
      score: totalScore,
      percentageScore,
      resultStatus,
      isPassed,
      questionsAnswered: responses.length,
      questionsCorrect,
      totalTimeSpent
    };
    
    await this.sessionRepository.update(sessionId, updatedSessionData);
    
    // Save responses
    await this.responseRepository.bulkCreate(userResponses);
    
    // Generate quiz result with detailed responses if showCorrectAnswers is enabled
    const questionResults = quiz.showCorrectAnswers ? await this.buildDetailedResults(
      questionsMap,
      userResponses
    ) : undefined;
    
    return {
      sessionId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: totalScore,
      percentageScore,
      totalQuestions: quiz.questions.length,
      correctAnswers: questionsCorrect,
      incorrectAnswers: responses.length - questionsCorrect,
      skippedQuestions: quiz.questions.length - responses.length,
      totalTimeSpent,
      isPassed,
      resultStatus,
      attemptNumber: session.attemptNumber,
      showCorrectAnswers: quiz.showCorrectAnswers,
      questionResults
    };
  }
  
  async getUserQuizHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const [sessions, total] = await this.sessionRepository.findAllUserSessions(userId, page, limit);
    
    return {
      sessions: sessions.map(session => ({
        id: session.id,
        quizId: session.quizId,
        quizTitle: session.quiz.title,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        percentageScore: session.percentageScore,
        isPassed: session.isPassed,
        attemptNumber: session.attemptNumber
      })),
      total,
      page,
      limit
    };
  }

  /**
   * Helper Methods
   */

  private mapQuizToDto(quiz: Quiz): QuizDto {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      moduleId: quiz.moduleId,
      sectionId: quiz.sectionId,
      passingScore: quiz.passingScore,
      totalPoints: quiz.totalPoints,
      timeLimit: quiz.timeLimit,
      difficulty: quiz.difficulty,
      resultThresholds: quiz.resultThresholds,
      showCorrectAnswers: quiz.showCorrectAnswers,
      randomizeQuestions: quiz.randomizeQuestions,
      isActive: quiz.isActive,
      maxAttempts: quiz.maxAttempts,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      createdBy: quiz.createdBy,
      questionCount: quiz.questions?.length || 0
    };
  }

  private mapQuestionToDto(question: QuizQuestion): QuestionDto {
    return {
      id: question.id,
      quizId: question.quizId,
      text: question.text,
      type: question.type,
      points: question.points,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      imageUrl: question.imageUrl,
      orderIndex: question.orderIndex,
      feedback: question.feedback,
      timeLimit: question.timeLimit,
      isActive: question.isActive,
      metadata: question.metadata,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }

  private mapSessionToDto(session: QuizSession): QuizSessionDto {
    return {
      id: session.id,
      quizId: session.quizId,
      userId: session.userId,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      score: session.score,
      percentageScore: session.percentageScore,
      resultStatus: session.resultStatus,
      attemptNumber: session.attemptNumber,
      questionsAnswered: session.questionsAnswered,
      questionsCorrect: session.questionsCorrect,
      totalTimeSpent: session.totalTimeSpent,
      questionOrder: session.questionOrder,
      isPassed: session.isPassed,
      feedback: session.feedback,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }

  private validateQuestionData(question: CreateQuestionDto | QuizQuestion): void {
    switch (question.type) {
      case QuestionTypeEnum.MULTIPLE_CHOICE:
      case QuestionTypeEnum.SINGLE_CHOICE:
        // Validate options exist
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          throw new BadRequestException(`${question.type} questions require at least 2 options`);
        }
        
        // Validate correct answer for single choice
        if (question.type === QuestionTypeEnum.SINGLE_CHOICE) {
          if (typeof question.correctAnswer !== 'string' && typeof question.correctAnswer !== 'object') {
            throw new BadRequestException('Single choice questions require a correctAnswer that is a string ID or option object');
          }
        }
        
        // Validate correct answers for multiple choice
        if (question.type === QuestionTypeEnum.MULTIPLE_CHOICE) {
          if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
            throw new BadRequestException('Multiple choice questions require at least one correct answer in an array');
          }
        }
        break;
        
      case QuestionTypeEnum.TRUE_FALSE:
        // Validate it's a boolean or string boolean
        if (question.correctAnswer !== true && 
            question.correctAnswer !== false && 
            question.correctAnswer !== 'true' && 
            question.correctAnswer !== 'false') {
          throw new BadRequestException('True/False questions require a boolean correctAnswer');
        }
        break;
        
      case QuestionTypeEnum.SHORT_ANSWER:
        // Validate correct answer is a string or array of strings
        if (typeof question.correctAnswer !== 'string' && 
            (!Array.isArray(question.correctAnswer) || 
             !question.correctAnswer.every(ans => typeof ans === 'string'))) {
          throw new BadRequestException('Short answer questions require a string correctAnswer or array of string answers');
        }
        break;
        
      case QuestionTypeEnum.MATCH_PAIRS:
        // Validate options is an array of pair objects
        if (!Array.isArray(question.options) || question.options.length < 2 || 
            !question.options.every(pair => pair.leftItem && pair.rightItem)) {
          throw new BadRequestException('Match pairs questions require at least 2 pairs with leftItem and rightItem');
        }
        break;
        
      case QuestionTypeEnum.FILL_IN_BLANKS:
        // Validate options is an array of text parts with blanks
        if (!Array.isArray(question.options) || 
            !question.options.some(part => part.isBlank === true)) {
          throw new BadRequestException('Fill in blanks questions require at least one blank in the text parts');
        }
        break;
        
      case QuestionTypeEnum.SEQUENCE:
        // Validate options is an array of sequence items
        if (!Array.isArray(question.options) || question.options.length < 2) {
          throw new BadRequestException('Sequence questions require at least 2 items to order');
        }
        
        // Validate correct answer is an array of item IDs in the correct order
        if (!Array.isArray(question.correctAnswer) || 
            question.correctAnswer.length !== question.options.length) {
          throw new BadRequestException('Sequence questions require a correctAnswer array with the correct order of item IDs');
        }
        break;
        
      case QuestionTypeEnum.INTERACTIVE:
        // Validate metadata contains required configuration
        if (!question.metadata || !question.metadata.elementType) {
          throw new BadRequestException('Interactive questions require metadata with elementType');
        }
        
        // Validate correct state exists
        if (!question.correctAnswer || typeof question.correctAnswer !== 'object') {
          throw new BadRequestException('Interactive questions require a correctAnswer object representing the correct state');
        }
        break;
    }
  }

  private evaluateAnswer(question: QuizQuestion, userAnswer: any): boolean {
    switch (question.type) {
      case QuestionTypeEnum.SINGLE_CHOICE:
        // Handle option object or string ID
        const correctId = typeof question.correctAnswer === 'object' 
          ? question.correctAnswer.id 
          : question.correctAnswer;
        
        const userAnswerId = typeof userAnswer === 'object' 
          ? userAnswer.id 
          : userAnswer;
        
        return correctId === userAnswerId;
        
      case QuestionTypeEnum.MULTIPLE_CHOICE:
        // Convert both to arrays of IDs for comparison
        const correctIds = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer.map(answer => typeof answer === 'object' ? answer.id : answer)
          : [typeof question.correctAnswer === 'object' ? question.correctAnswer.id : question.correctAnswer];
        
        const userAnswerIds = Array.isArray(userAnswer)
          ? userAnswer.map(answer => typeof answer === 'object' ? answer.id : answer)
          : [typeof userAnswer === 'object' ? userAnswer.id : userAnswer];
        
        // Check if arrays have same length and same elements (order doesn't matter)
        return correctIds.length === userAnswerIds.length &&
          correctIds.every(id => userAnswerIds.includes(id));
        
      case QuestionTypeEnum.TRUE_FALSE:
        // Convert to boolean for comparison
        const correctBool = question.correctAnswer === true || question.correctAnswer === 'true';
        const userBool = userAnswer === true || userAnswer === 'true';
        return correctBool === userBool;
        
      case QuestionTypeEnum.SHORT_ANSWER:
        // Convert correct answers to array of lowercase strings
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.map(ans => String(ans).toLowerCase().trim())
          : [String(question.correctAnswer).toLowerCase().trim()];
        
        const userAnswerLower = String(userAnswer).toLowerCase().trim();
        
        // Check if user answer matches any of the correct answers
        return correctAnswers.includes(userAnswerLower);
        
      case QuestionTypeEnum.MATCH_PAIRS:
        // Check if user's pairs match the correct pairs
        const correctPairs = question.correctAnswer || question.options;
        
        if (!Array.isArray(userAnswer) || userAnswer.length !== correctPairs.length) {
          return false;
        }
        
        // Each element in userAnswer should be an object with leftId and rightId matching a correct pair
        return userAnswer.every(userPair => {
          return correctPairs.some(correctPair => 
            correctPair.leftId === userPair.leftId && correctPair.rightId === userPair.rightId
          );
        });
        
      case QuestionTypeEnum.FILL_IN_BLANKS:
        // Check if all blanks are filled correctly
        const blanks = question.options.filter(part => part.isBlank);
        
        if (!Array.isArray(userAnswer) || userAnswer.length !== blanks.length) {
          return false;
        }
        
        return blanks.every((blank, index) => {
          const userText = String(userAnswer[index]).toLowerCase().trim();
          
          // Check against correct answer or array of acceptable answers
          if (blank.acceptableAnswers && Array.isArray(blank.acceptableAnswers)) {
            return blank.acceptableAnswers
              .map(ans => String(ans).toLowerCase().trim())
              .includes(userText);
          }
          
          return String(blank.correctAnswer).toLowerCase().trim() === userText;
        });
        
      case QuestionTypeEnum.SEQUENCE:
        // Check if sequence matches exactly
        if (!Array.isArray(userAnswer) || userAnswer.length !== question.correctAnswer.length) {
          return false;
        }
        
        // Compare arrays element by element
        return userAnswer.every((itemId, index) => itemId === question.correctAnswer[index]);
        
      case QuestionTypeEnum.INTERACTIVE:
        // For interactive questions, we need custom evaluation based on the elementType
        // This is a simplified version - actual implementation would be more complex
        try {
          const correctState = question.correctAnswer;
          
          // Compare key properties based on element type
          if (question.metadata?.elementType === 'dragAndDrop') {
            // Check if all items are in the correct positions
            return this.compareObjectArrays(userAnswer.items, correctState.items, ['id', 'position']);
          } else if (question.metadata?.elementType === 'codeEditor') {
            // Run tests on user's code - very simplified here
            return userAnswer.output === correctState.output;
          } else {
            // Generic object comparison for other types
            return JSON.stringify(userAnswer) === JSON.stringify(correctState);
          }
        } catch (error) {
          console.error('Error evaluating interactive question:', error);
          return false;
        }
        
      default:
        return false;
    }
  }

  private shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    // Create a copy to avoid mutating the original array
    const shuffled = [...questions];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  private async buildDetailedResults(
    questionsMap: Map<string, QuizQuestion>,
    userResponses: UserQuizResponse[]
  ): Promise<any[]> {
    return userResponses.map(response => {
      const question = questionsMap.get(response.questionId);
      
      return {
        questionId: response.questionId,
        questionText: question?.text || 'Question not found',
        userAnswer: response.userAnswer,
        correctAnswer: question?.correctAnswer,
        isCorrect: response.isCorrect,
        scoreAwarded: response.score,
        explanation: question?.explanation,
        feedback: response.isCorrect ? question?.feedback?.correctFeedback : question?.feedback?.incorrectFeedback
      };
    });
  }

  private compareObjectArrays(arr1: any[], arr2: any[], keyProps: string[]): boolean {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
    
    // Create maps for faster lookup
    const map1 = new Map();
    const map2 = new Map();
    
    arr1.forEach(item => {
      const key = keyProps.map(prop => item[prop]).join('|');
      map1.set(key, item);
    });
    
    arr2.forEach(item => {
      const key = keyProps.map(prop => item[prop]).join('|');
      map2.set(key, item);
    });
    
    // Check if all keys in map1 exist in map2
    for (const key of map1.keys()) {
      if (!map2.has(key)) return false;
    }
    
    return true;
  }
}