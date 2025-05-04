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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import {
  CreateGameSectionDto,
  UpdateGameSectionDto,
  GameSectionDto,
  GameSectionListDto,
  SectionWithContentDto,
  UpdateSectionContentDto,
  SectionContentDto
} from '../dto/section.dto';
import { CreateSectionContentDto } from '../dto/section-content.dto';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';
import { PaginationParamsDto } from '../../shared/dto/pagination-params.dto';
import { GameSectionsService } from '../services/game-sections.service';
import { SectionContentService } from '../services/section-content.service';

@ApiTags('Game Sections')
@Controller('game/sections')
export class GameSectionsController {
  constructor(
    private readonly gameSectionsService: GameSectionsService,
    private readonly sectionContentService: SectionContentService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all sections for a module' })
  @ApiQuery({ name: 'moduleId', description: 'Filter by module ID' })
  @ApiQuery({ name: 'active', description: 'Filter by active status', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of game sections',
    type: GameSectionListDto,
  })
  async findAll(
    @Query('moduleId') moduleId: string,
    @Query('active') active?: boolean,
  ): Promise<GameSectionListDto> {
    return this.gameSectionsService.findAllByModule(moduleId, active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific game section by ID' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'The requested game section',
    type: GameSectionDto,
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async findOne(@Param('id') id: string): Promise<GameSectionDto> {
    return this.gameSectionsService.findOne(id);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Get a section with its content' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section with its associated content',
    type: SectionWithContentDto,
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async getSectionWithContent(@Param('id') id: string): Promise<SectionWithContentDto> {
    return this.gameSectionsService.findWithContent(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new game section' })
  @ApiBody({ type: CreateGameSectionDto })
  @ApiResponse({
    status: 201,
    description: 'The section has been successfully created',
    type: GameSectionDto,
  })
  async create(@Body() createGameSectionDto: CreateGameSectionDto): Promise<GameSectionDto> {
    return this.gameSectionsService.create(createGameSectionDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing game section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiBody({ type: UpdateGameSectionDto })
  @ApiResponse({
    status: 200,
    description: 'The section has been successfully updated',
    type: GameSectionDto,
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async update(
    @Param('id') id: string,
    @Body() updateGameSectionDto: UpdateGameSectionDto,
  ): Promise<GameSectionDto> {
    return this.gameSectionsService.update(id, updateGameSectionDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a game section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({ status: 204, description: 'The section has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.gameSectionsService.remove(id);
    return;
  }
  
  @Get(':id/content/items')
  @ApiOperation({ summary: 'Get all content items for a section with caching' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'List of section content items',
    type: [SectionContentDto],
  })
  async getSectionContent(@Param('id') id: string): Promise<SectionContentDto[]> {
    return this.sectionContentService.getSectionContent(id);
  }

  @Post(':id/content')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create content for a section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiBody({ type: CreateSectionContentDto })
  @ApiResponse({
    status: 201,
    description: 'The content has been successfully created',
    type: SectionContentDto,
  })
  async createContent(
    @Param('id') id: string,
    @Body() createContentDto: CreateSectionContentDto,
  ): Promise<SectionContentDto> {
    // Set the section ID from the route parameter
    createContentDto.sectionId = id;
    return this.sectionContentService.createSectionContent(createContentDto);
  }

  @Put('content/:contentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update section content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiBody({ type: UpdateSectionContentDto })
  @ApiResponse({
    status: 200,
    description: 'The content has been successfully updated',
    type: SectionContentDto,
  })
  async updateContent(
    @Param('contentId') contentId: string,
    @Body() updateContentDto: UpdateSectionContentDto,
  ): Promise<SectionContentDto> {
    return this.sectionContentService.updateSectionContent(contentId, updateContentDto);
  }

  @Delete('content/:contentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete section content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 204, description: 'The content has been successfully deleted' })
  async removeContent(@Param('contentId') contentId: string): Promise<void> {
    await this.sectionContentService.removeSectionContent(contentId);
    return;
  }

  @Post(':id/content/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reorder section content items' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiBody({ schema: { type: 'object', properties: { contentIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({
    status: 200,
    description: 'The content has been successfully reordered',
    type: [SectionContentDto],
  })
  async reorderContent(
    @Param('id') id: string,
    @Body() body: { contentIds: string[] },
  ): Promise<SectionContentDto[]> {
    return this.sectionContentService.reorderSectionContent(id, body.contentIds);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get section content by ID' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'The requested section content',
    type: SectionContentDto,
  })
  async getContentById(@Param('contentId') contentId: string): Promise<SectionContentDto> {
    return this.sectionContentService.getContentById(contentId);
  }

  @Get(':id/next')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get the next section in the module' })
  @ApiParam({ name: 'id', description: 'Current Section ID' })
  @ApiResponse({
    status: 200,
    description: 'The next section in the sequence',
    type: GameSectionDto,
  })
  async getNextSection(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<GameSectionDto | null> {
    const section = await this.gameSectionsService.findOne(id);
    const nextSection = await this.gameSectionsService.findNextInModule(
      section.moduleId,
      section.orderIndex
    );
    
    return nextSection ? this.gameSectionsService.mapToDto(nextSection) : null;
  }

  @Get(':id/previous')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get the previous section in the module' })
  @ApiParam({ name: 'id', description: 'Current Section ID' })
  @ApiResponse({
    status: 200,
    description: 'The previous section in the sequence',
    type: GameSectionDto,
  })
  async getPreviousSection(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<GameSectionDto | null> {
    const section = await this.gameSectionsService.findOne(id);
    const previousSection = await this.gameSectionsService.findPreviousInModule(
      section.moduleId,
      section.orderIndex
    );
    
    return previousSection ? this.gameSectionsService.mapToDto(previousSection) : null;
  }

  @Post(':id/clear-cache')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clear content cache for a section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({ status: 204, description: 'The cache has been successfully cleared' })
  async clearSectionCache(@Param('id') id: string): Promise<void> {
    this.sectionContentService.clearContentCache(id);
    return;
  }

  @Get(':id/content-with-progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get section content with user progress status' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Content items with viewed status',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          contentType: { type: 'string' },
          content: { type: 'object' },
          orderIndex: { type: 'number' },
          viewed: { type: 'boolean' }
        }
      }
    }
  })
  async getSectionContentWithProgress(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ): Promise<Array<SectionContentDto & { viewed: boolean }>> {
    return this.sectionContentService.getSectionContentWithProgress(req.user.id, id);
  }

  @Post(':id/content/:contentId/track')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Track user interaction with content' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiBody({ schema: { type: 'object', properties: { timeSpent: { type: 'number' } } } })
  @ApiResponse({
    status: 200,
    description: 'Content interaction tracked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  async trackContentInteraction(
    @Param('id') id: string,
    @Param('contentId') contentId: string,
    @Body() body: { timeSpent: number },
    @Req() req: RequestWithUser
  ): Promise<{ success: boolean }> {
    return this.sectionContentService.trackContentInteraction(
      req.user.id, 
      id, 
      contentId, 
      body.timeSpent || 0
    );
  }

  @Post(':id/content/mark-all-viewed')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Mark all content in a section as viewed' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'All content marked as viewed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        contentCount: { type: 'number' }
      }
    }
  })
  async markAllContentViewed(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ): Promise<{ success: boolean; contentCount: number }> {
    return this.sectionContentService.markAllContentViewed(req.user.id, id);
  }

  @Get(':id/content-progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get content progress statistics for a section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Content progress statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        viewed: { type: 'number' },
        percentage: { type: 'number' }
      }
    }
  })
  async getContentProgressStats(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ): Promise<{ total: number; viewed: number; percentage: number }> {
    return this.sectionContentService.getContentProgressStats(req.user.id, id);
  }
}