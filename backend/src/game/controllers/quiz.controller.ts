import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';

// Services
import { QuizService } from '../services/quiz/quiz.service';

// DTOs
import { CreateQuizDto, UpdateQuizDto, QuizDto, PaginatedQuizzesDto, QuizStatisticsDto } from '../dto/quiz/quiz.dto';
import { CreateQuestionDto, UpdateQuestionDto, QuestionDto, PaginatedQuestionsDto } from '../dto/quiz/quiz-question.dto';
import { StartQuizSessionDto, QuizSessionDto, SubmitQuizResponsesDto, QuizResultDto } from '../dto/quiz/quiz-session.dto';

// Types
import { QuizDifficultyEnum } from '../interfaces/quiz/quiz-types.interface';

// Request with user interface (assume imported from shared types)
interface RequestWithUser extends Request {
  user: { id: string; roles?: string[] };
}

@ApiTags('Quizzes')
@Controller('game/quizzes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * Quiz Management Endpoints
   */
  @Post()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({ status: 201, description: 'Quiz created successfully', type: QuizDto })
  async createQuiz(
    @Body(ValidationPipe) createQuizDto: CreateQuizDto,
    @Req() request: RequestWithUser
  ): Promise<QuizDto> {
    return this.quizService.createQuiz(createQuizDto, request.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for quiz title' })
  @ApiQuery({ name: 'difficulty', required: false, enum: QuizDifficultyEnum, description: 'Filter by difficulty' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of quizzes', type: PaginatedQuizzesDto })
  async getAllQuizzes(
    @Query('page', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) page?: number,
    @Query('limit', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) limit?: number,
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: QuizDifficultyEnum,
    @Query('isActive') isActive?: string,
  ): Promise<PaginatedQuizzesDto> {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.quizService.getAllQuizzes(page, limit, search, difficulty, isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific quiz by ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Returns the quiz', type: QuizDto })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<QuizDto> {
    return this.quizService.getQuizById(id);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Get all quizzes for a specific module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Returns quizzes for the module', type: [QuizDto] })
  async getQuizzesByModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string
  ): Promise<QuizDto[]> {
    return this.quizService.getQuizzesByModule(moduleId);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all quizzes for a specific section' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiResponse({ status: 200, description: 'Returns quizzes for the section', type: [QuizDto] })
  async getQuizzesBySection(
    @Param('sectionId', ParseUUIDPipe) sectionId: string
  ): Promise<QuizDto[]> {
    return this.quizService.getQuizzesBySection(sectionId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiBody({ type: UpdateQuizDto })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully', type: QuizDto })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async updateQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateQuizDto: UpdateQuizDto
  ): Promise<QuizDto> {
    return this.quizService.updateQuiz(id, updateQuizDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async deleteQuiz(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ success: boolean }> {
    const success = await this.quizService.deleteQuiz(id);
    return { success };
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get statistics for a quiz' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz statistics', type: QuizStatisticsDto })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizStatistics(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<QuizStatisticsDto> {
    return this.quizService.getQuizStatistics(id);
  }

  /**
   * Quiz Question Management Endpoints
   */
  @Post('questions')
  @ApiOperation({ summary: 'Create a new quiz question' })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ status: 201, description: 'Question created successfully', type: QuestionDto })
  async createQuestion(
    @Body(ValidationPipe) createQuestionDto: CreateQuestionDto
  ): Promise<QuestionDto> {
    return this.quizService.createQuestion(createQuestionDto);
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Update a quiz question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully', type: QuestionDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateQuestionDto: UpdateQuestionDto
  ): Promise<QuestionDto> {
    return this.quizService.updateQuestion(id, updateQuestionDto);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get a specific question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Returns the question', type: QuestionDto })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<QuestionDto> {
    return this.quizService.getQuestionById(id);
  }

  @Get(':quizId/questions')
  @ApiOperation({ summary: 'Get all questions for a specific quiz' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Returns questions for the quiz', type: [QuestionDto] })
  async getQuestionsByQuiz(
    @Param('quizId', ParseUUIDPipe) quizId: string
  ): Promise<QuestionDto[]> {
    return this.quizService.getQuestionsByQuiz(quizId);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete a quiz question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestion(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ success: boolean }> {
    const success = await this.quizService.deleteQuestion(id);
    return { success };
  }

  @Put(':quizId/questions/reorder')
  @ApiOperation({ summary: 'Reorder questions in a quiz' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiBody({ description: 'Object mapping question IDs to their new order indices', type: 'object' })
  @ApiResponse({ status: 200, description: 'Questions reordered successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async reorderQuizQuestions(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() orderMap: Record<string, number>
  ): Promise<{ success: boolean }> {
    const success = await this.quizService.reorderQuizQuestions(quizId, orderMap);
    return { success };
  }

  /**
   * Quiz Session Endpoints
   */
  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a new quiz session' })
  @ApiBody({ type: StartQuizSessionDto })
  @ApiResponse({ status: 201, description: 'Session started successfully', type: QuizSessionDto })
  @ApiResponse({ status: 400, description: 'Invalid quiz ID or user already has an active session' })
  async startQuizSession(
    @Body(ValidationPipe) startDto: StartQuizSessionDto,
    @Req() request: RequestWithUser
  ): Promise<QuizSessionDto> {
    return this.quizService.startQuizSession(request.user.id, startDto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a quiz session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Returns the quiz session', type: QuizSessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getQuizSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser
  ): Promise<QuizSessionDto> {
    return this.quizService.getQuizSession(id, request.user.id);
  }

  @Post('sessions/submit')
  @ApiOperation({ summary: 'Submit quiz responses and complete a session' })
  @ApiBody({ type: SubmitQuizResponsesDto })
  @ApiResponse({ status: 200, description: 'Responses submitted successfully', type: QuizResultDto })
  @ApiResponse({ status: 400, description: 'Invalid session ID or session already completed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(HttpStatus.OK)
  async submitQuizResponses(
    @Body(ValidationPipe) submitDto: SubmitQuizResponsesDto,
    @Req() request: RequestWithUser
  ): Promise<QuizResultDto> {
    return this.quizService.submitQuizResponses(request.user.id, submitDto);
  }

  @Get('user/history')
  @ApiOperation({ summary: 'Get quiz history for the current user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starting from 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of user\'s quiz sessions' })
  async getUserQuizHistory(
    @Req() request: RequestWithUser,
    @Query('page', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) page?: number,
    @Query('limit', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) limit?: number
  ): Promise<any> {
    return this.quizService.getUserQuizHistory(request.user.id, page, limit);
  }
}