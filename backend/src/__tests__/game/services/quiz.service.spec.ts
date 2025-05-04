import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from '../../../game/services/quiz.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizQuestion } from '../../../game/entities/quiz-question.entity';
import { UserQuizResponse } from '../../../game/entities/user-quiz-response.entity';
import { GameSection } from '../../../game/entities/game-section.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  QuizQuestionDto, 
  CreateQuizQuestionDto, 
  UpdateQuizQuestionDto,
  QuizResultDto,
  QuestionType,
  SubmitQuizAnswerDto
} from '../../../game/dto/quiz.dto';

// Define a type for mock repositories to help TypeScript understand Jest mock functions
type MockRepository<T = any> = {
  findOne: jest.Mock;
  find: jest.Mock;
  update: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

// Replace the declaration with a function that creates properly typed mock repositories
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn()
});

describe('QuizService', () => {
  let service: QuizService;
  let quizQuestionRepository: MockRepository<QuizQuestion>;
  let userQuizResponseRepository: MockRepository<UserQuizResponse>;
  let gameSectionRepository: MockRepository<GameSection>;

  // Mock data
  const userId = 'user1';
  
  const mockSections = [
    {
      id: 'section1',
      title: 'Quiz Section',
      sectionType: 'quiz',
      moduleId: 'module1',
      orderIndex: 0,
      isActive: true
    },
    {
      id: 'section2',
      title: 'Content Section',
      sectionType: 'text-image',
      moduleId: 'module1',
      orderIndex: 1,
      isActive: true
    }
  ];

  const mockQuizQuestions = [
    {
      id: 'question1',
      sectionId: 'section1',
      questionText: 'What is 2+2?',
      questionType: 'single-choice',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'Basic arithmetic',
      points: 1,
      orderIndex: 0
    },
    {
      id: 'question2',
      sectionId: 'section1',
      questionText: 'Is the Earth flat?',
      questionType: 'true-false',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'The Earth is approximately spherical',
      points: 2,
      orderIndex: 1
    }
  ];

  const mockUserResponses = [
    {
      id: 'response1',
      userId: 'user1',
      questionId: 'question1',
      userAnswer: '4',
      isCorrect: true,
      pointsAwarded: 1,
      createdAt: new Date('2025-04-01')
    }
  ];

  beforeEach(async () => {
    // Create repositories with our mock utility
    const mockQuizQuestionRepo = createMockRepository<QuizQuestion>();
    const mockUserQuizResponseRepo = createMockRepository<UserQuizResponse>();
    const mockGameSectionRepo = createMockRepository<GameSection>();

    // Add custom behavior as needed
    mockQuizQuestionRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getRepositoryToken(QuizQuestion),
          useValue: mockQuizQuestionRepo,
        },
        {
          provide: getRepositoryToken(UserQuizResponse),
          useValue: mockUserQuizResponseRepo,
        },
        {
          provide: getRepositoryToken(GameSection),
          useValue: mockGameSectionRepo,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    quizQuestionRepository = module.get<MockRepository<QuizQuestion>>(getRepositoryToken(QuizQuestion));
    userQuizResponseRepository = module.get<MockRepository<UserQuizResponse>>(getRepositoryToken(UserQuizResponse));
    gameSectionRepository = module.get<MockRepository<GameSection>>(getRepositoryToken(GameSection));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSectionQuiz', () => {
    it('should return quiz questions for a section', async () => {
      // Setup
      const sectionId = 'section1';
      gameSectionRepository.findOne.mockResolvedValue(mockSections[0]);
      quizQuestionRepository.find.mockResolvedValue(mockQuizQuestions);

      // Execute
      const result = await service.getSectionQuiz(sectionId);

      // Verify
      expect(result.sectionId).toEqual(sectionId);
      expect(result.sectionTitle).toEqual(mockSections[0].title);
      expect(result.totalQuestions).toEqual(mockQuizQuestions.length);
      expect(result.questions.length).toEqual(mockQuizQuestions.length);
      expect(gameSectionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sectionId }
      });
      expect(quizQuestionRepository.find).toHaveBeenCalledWith({
        where: { sectionId },
        order: { orderIndex: 'ASC' }
      });
    });

    it('should throw NotFoundException when section not found', async () => {
      // Setup
      const sectionId = 'nonexistent';
      gameSectionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getSectionQuiz(sectionId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when section is not a quiz section', async () => {
      // Setup
      const sectionId = 'section2';
      gameSectionRepository.findOne.mockResolvedValue(mockSections[1]); // Content section

      // Execute & Verify
      await expect(service.getSectionQuiz(sectionId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getQuestionById', () => {
    it('should return a question by its ID', async () => {
      // Setup
      const questionId = 'question1';
      quizQuestionRepository.findOne.mockResolvedValue(mockQuizQuestions[0]);

      // Execute
      const result = await service.getQuestionById(questionId);

      // Verify
      expect(result.id).toEqual(questionId);
      expect(result.questionText).toEqual(mockQuizQuestions[0].questionText);
      expect(quizQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId }
      });
    });

    it('should throw NotFoundException when question not found', async () => {
      // Setup
      const questionId = 'nonexistent';
      quizQuestionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getQuestionById(questionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createQuestion', () => {
    it('should create a new quiz question', async () => {
      // Setup
      const createDto: CreateQuizQuestionDto = {
        sectionId: 'section1',
        questionText: 'New question?',
        questionType: QuestionType.MULTIPLE_CHOICE,
        options: ['Option 1', 'Option 2'],
        correctAnswer: 'Option 2',
        explanation: 'Explanation',
        points: 3,
        orderIndex: 2
      };
      
      gameSectionRepository.count.mockResolvedValue(1);
      
      const newQuestion = {
        id: 'new-question',
        ...createDto,
        orderIndex: 2
      };
      
      quizQuestionRepository.create.mockReturnValue(newQuestion);
      quizQuestionRepository.save.mockResolvedValue(newQuestion);
      quizQuestionRepository.findOne.mockResolvedValue({ orderIndex: 1 });

      // Execute
      const result = await service.createQuestion(createDto);

      // Verify
      expect(result.id).toEqual('new-question');
      expect(result.questionText).toEqual(createDto.questionText);
      expect(gameSectionRepository.count).toHaveBeenCalledWith({
        where: { id: createDto.sectionId }
      });
      expect(quizQuestionRepository.create).toHaveBeenCalled();
      expect(quizQuestionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when section not found', async () => {
      // Setup
      const createDto: CreateQuizQuestionDto = {
        sectionId: 'nonexistent',
        questionText: 'New question?',
        questionType: QuestionType.MULTIPLE_CHOICE,
        options: ['Option 1', 'Option 2'],
        correctAnswer: 'Option 2',
        explanation: 'Explanation',
        points: 3,
        orderIndex: 1
      };
      
      gameSectionRepository.count.mockResolvedValue(0);

      // Execute & Verify
      await expect(service.createQuestion(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateQuestion', () => {
    it('should update an existing question', async () => {
      // Setup
      const questionId = 'question1';
      const updateDto: UpdateQuizQuestionDto = {
        questionText: 'Updated question text',
        points: 3
      };
      
      const existingQuestion = { ...mockQuizQuestions[0] };
      const updatedQuestion = { 
        ...existingQuestion, 
        questionText: updateDto.questionText,
        points: updateDto.points
      };
      
      quizQuestionRepository.findOne.mockResolvedValue(existingQuestion);
      quizQuestionRepository.save.mockResolvedValue(updatedQuestion);

      // Execute
      const result = await service.updateQuestion(questionId, updateDto);

      // Verify
      expect(result.questionText).toEqual(updateDto.questionText);
      expect(result.points).toEqual(updateDto.points);
      expect(quizQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId }
      });
      expect(quizQuestionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when question not found', async () => {
      // Setup
      const questionId = 'nonexistent';
      const updateDto: UpdateQuizQuestionDto = {
        questionText: 'Updated question text'
      };
      
      quizQuestionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.updateQuestion(questionId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete an existing question', async () => {
      // Setup
      const questionId = 'question1';
      quizQuestionRepository.findOne.mockResolvedValue(mockQuizQuestions[0]);
      quizQuestionRepository.remove.mockResolvedValue(undefined);

      // Execute
      await service.deleteQuestion(questionId);

      // Verify
      expect(quizQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId }
      });
      expect(quizQuestionRepository.remove).toHaveBeenCalledWith(mockQuizQuestions[0]);
    });

    it('should throw NotFoundException when question not found', async () => {
      // Setup
      const questionId = 'nonexistent';
      quizQuestionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.deleteQuestion(questionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitAnswer', () => {
    it('should evaluate correct answer and return result', async () => {
      // Setup
      const answerDto: SubmitQuizAnswerDto = {
        questionId: 'question1',
        userAnswer: '4'
      };
      
      quizQuestionRepository.findOne.mockResolvedValue(mockQuizQuestions[0]);
      userQuizResponseRepository.findOne.mockResolvedValue(null);
      userQuizResponseRepository.create.mockReturnValue({
        userId,
        questionId: answerDto.questionId,
        userAnswer: answerDto.userAnswer,
        isCorrect: true,
        pointsAwarded: mockQuizQuestions[0].points
      });
      userQuizResponseRepository.save.mockResolvedValue({});

      // Execute
      const result = await service.submitAnswer(userId, answerDto);

      // Verify
      expect(result.isCorrect).toBe(true);
      expect(result.points).toEqual(mockQuizQuestions[0].points);
      expect(quizQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerDto.questionId }
      });
      expect(userQuizResponseRepository.create).toHaveBeenCalled();
      expect(userQuizResponseRepository.save).toHaveBeenCalled();
    });

    it('should evaluate incorrect answer and return result', async () => {
      // Setup
      const answerDto: SubmitQuizAnswerDto = {
        questionId: 'question1',
        userAnswer: '5' // Incorrect answer
      };
      
      quizQuestionRepository.findOne.mockResolvedValue(mockQuizQuestions[0]);
      userQuizResponseRepository.findOne.mockResolvedValue(null);
      userQuizResponseRepository.create.mockReturnValue({
        userId,
        questionId: answerDto.questionId,
        userAnswer: answerDto.userAnswer,
        isCorrect: false,
        pointsAwarded: 0
      });
      userQuizResponseRepository.save.mockResolvedValue({});

      // Execute
      const result = await service.submitAnswer(userId, answerDto);

      // Verify
      expect(result.isCorrect).toBe(false);
      expect(result.points).toEqual(0);
    });

    it('should update existing response when user already answered', async () => {
      // Setup
      const answerDto: SubmitQuizAnswerDto = {
        questionId: 'question1',
        userAnswer: '4'
      };
      
      const existingResponse = {
        id: 'response1',
        userId,
        questionId: 'question1',
        userAnswer: '5', // Previous incorrect answer
        isCorrect: false,
        pointsAwarded: 0
      };
      
      quizQuestionRepository.findOne.mockResolvedValue(mockQuizQuestions[0]);
      userQuizResponseRepository.findOne.mockResolvedValue(existingResponse);
      userQuizResponseRepository.save.mockResolvedValue({
        ...existingResponse,
        userAnswer: '4',
        isCorrect: true,
        pointsAwarded: 1
      });

      // Execute
      const result = await service.submitAnswer(userId, answerDto);

      // Verify
      expect(result.isCorrect).toBe(true);
      expect(userQuizResponseRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userAnswer: '4',
        isCorrect: true
      }));
    });
  });

  describe('getSectionResults', () => {
    it('should return quiz results for a section', async () => {
      // Setup
      const sectionId = 'section1';
      gameSectionRepository.findOne.mockResolvedValue(mockSections[0]);
      quizQuestionRepository.find.mockResolvedValue(mockQuizQuestions);
      userQuizResponseRepository.find.mockResolvedValue(mockUserResponses);

      // Execute
      const result = await service.getSectionResults(userId, sectionId);

      // Verify
      expect(result.userId).toEqual(userId);
      expect(result.sectionId).toEqual(sectionId);
      expect(result.totalQuestions).toEqual(mockQuizQuestions.length);
      expect(result.answeredQuestions).toEqual(mockUserResponses.length);
      expect(result.earnedPoints).toEqual(mockUserResponses.reduce((sum, r) => sum + r.pointsAwarded, 0));
    });

    it('should return empty results when no questions exist', async () => {
      // Setup
      const sectionId = 'section1';
      gameSectionRepository.findOne.mockResolvedValue(mockSections[0]);
      quizQuestionRepository.find.mockResolvedValue([]);

      // Execute
      const result = await service.getSectionResults(userId, sectionId);

      // Verify
      expect(result.userId).toEqual(userId);
      expect(result.sectionId).toEqual(sectionId);
      expect(result.totalQuestions).toEqual(0);
      expect(result.earnedPoints).toEqual(0);
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder questions according to the provided order', async () => {
      // Setup
      const sectionId = 'section1';
      const questionIds = ['question2', 'question1']; // Reversed order
      
      gameSectionRepository.count.mockResolvedValue(1);
      quizQuestionRepository.find.mockResolvedValueOnce(mockQuizQuestions) // First call to verify
                                  .mockResolvedValueOnce([ // Second call after reordering
                                    { ...mockQuizQuestions[1], orderIndex: 0 },
                                    { ...mockQuizQuestions[0], orderIndex: 1 }
                                  ]);

      // Execute
      const result = await service.reorderQuestions(sectionId, questionIds);

      // Verify
      expect(result.sectionId).toEqual(sectionId);
      expect(result.questions.length).toEqual(questionIds.length);
      expect(quizQuestionRepository.update).toHaveBeenCalledTimes(2);
      expect(quizQuestionRepository.update).toHaveBeenCalledWith('question2', { orderIndex: 0 });
      expect(quizQuestionRepository.update).toHaveBeenCalledWith('question1', { orderIndex: 1 });
    });

    it('should throw BadRequestException when question IDs do not belong to section', async () => {
      // Setup
      const sectionId = 'section1';
      const questionIds = ['question1', 'invalid-id'];
      
      gameSectionRepository.count.mockResolvedValue(1);
      quizQuestionRepository.find.mockResolvedValue([mockQuizQuestions[0]]); // Only question1 belongs to section

      // Execute & Verify
      await expect(service.reorderQuestions(sectionId, questionIds)).rejects.toThrow(BadRequestException);
    });
  });
});