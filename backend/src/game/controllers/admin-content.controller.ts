import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { GameModulesService } from '../services/game-modules.service';
import { GameSectionsService } from '../services/game-sections.service';
import { SectionContentService } from '../services/section-content.service';
import { MediaService } from '../services/media.service';
import { CreateGameModuleDto } from '../dto/module.dto';
import { CreateGameSectionDto, UpdateGameSectionDto } from '../dto/section.dto';
import { CreateSectionContentDto, UpdateSectionContentDto } from '../dto/section-content.dto';
import { ContentStatisticsDto } from '../dto/content-statistics.dto';

@ApiTags('admin-game-content')
@Controller('admin/game')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminContentController {
  constructor(
    private readonly gameModulesService: GameModulesService,
    private readonly gameSectionsService: GameSectionsService,
    private readonly sectionContentService: SectionContentService,
    private readonly mediaService: MediaService,
  ) {}

  // Module management
  @Get('modules')
  @ApiOperation({ summary: 'Get all game modules with statistics' })
  @ApiResponse({ status: 200, description: 'Returns all modules with usage statistics' })
  async getAllModules(
    @Query('includeUnpublished') includeUnpublished: boolean = false,
  ) {
    return this.gameModulesService.findAll(!includeUnpublished);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Create a new game module' })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  async createModule(@Body() createModuleDto: CreateGameModuleDto) {
    return this.gameModulesService.create(createModuleDto);
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Update a game module' })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  async updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: CreateGameModuleDto,
  ) {
    return this.gameModulesService.update(id, updateModuleDto);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete a game module' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully' })
  async deleteModule(@Param('id') id: string) {
    return this.gameModulesService.remove(id);
  }

  // Section management
  @Get('sections')
  @ApiOperation({ summary: 'Get all sections with statistics' })
  @ApiResponse({ status: 200, description: 'Returns all sections with usage statistics' })
  async getAllSections(
    @Query('moduleId') moduleId?: string,
    @Query('includeUnpublished') includeUnpublished: boolean = false,
  ) {
    return this.gameSectionsService.getAllSections(moduleId, includeUnpublished);
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  async createSection(@Body() createSectionDto: CreateGameSectionDto) {
    return this.gameSectionsService.create(createSectionDto);
  }

  @Put('sections/:id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async updateSection(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateGameSectionDto,
  ) {
    return this.gameSectionsService.update(id, updateSectionDto);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  async deleteSection(@Param('id') id: string) {
    return this.gameSectionsService.delete(id);
  }

  // Content management
  @Get('content')
  @ApiOperation({ summary: 'Get section content with filtering options' })
  @ApiResponse({ status: 200, description: 'Returns section content' })
  async getSectionContent(
    @Query('sectionId') sectionId?: string,
    @Query('contentType') contentType?: string,
  ) {
    return this.sectionContentService.getFilteredSectionContent(sectionId, contentType);
  }

  @Post('content')
  @ApiOperation({ summary: 'Create new section content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  async createSectionContent(@Body() createContentDto: CreateSectionContentDto) {
    return this.sectionContentService.createSectionContent(createContentDto);
  }

  @Put('content/:id')
  @ApiOperation({ summary: 'Update section content' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  async updateSectionContent(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateSectionContentDto,
  ) {
    return this.sectionContentService.updateSectionContent(id, updateContentDto);
  }

  @Delete('content/:id')
  @ApiOperation({ summary: 'Delete section content' })
  @ApiResponse({ status: 200, description: 'Content deleted successfully' })
  async deleteSectionContent(@Param('id') id: string) {
    return this.sectionContentService.deleteSectionContent(id);
  }

  // Content statistics
  @Get('statistics')
  @ApiOperation({ summary: 'Get content statistics' })
  @ApiResponse({ status: 200, description: 'Returns content statistics' })
  async getContentStatistics(): Promise<ContentStatisticsDto> {
    return this.sectionContentService.getContentStatistics();
  }

  // Content version management
  @Get('content/:id/versions')
  @ApiOperation({ summary: 'Get content version history' })
  @ApiResponse({ status: 200, description: 'Returns content version history' })
  async getContentVersions(@Param('id') contentId: string) {
    return this.sectionContentService.getContentVersionHistory(contentId);
  }

  @Post('content/:id/revert/:versionId')
  @ApiOperation({ summary: 'Revert content to previous version' })
  @ApiResponse({ status: 200, description: 'Content reverted successfully' })
  async revertContentVersion(
    @Param('id') contentId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.sectionContentService.revertToVersion(contentId, versionId);
  }

  // Cache management
  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear content cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearContentCache(
    @Query('sectionId') sectionId?: string,
  ) {
    return this.sectionContentService.clearCache(sectionId);
  }

  // Bulk operations
  @Post('content/bulk-import')
  @ApiOperation({ summary: 'Import content in bulk' })
  @ApiResponse({ status: 201, description: 'Content imported successfully' })
  async bulkImportContent(@Body() contentItems: CreateSectionContentDto[]) {
    return this.sectionContentService.bulkImportContent(contentItems);
  }

  @Post('content/bulk-export')
  @ApiOperation({ summary: 'Export content in bulk' })
  @ApiResponse({ status: 200, description: 'Content exported successfully' })
  async bulkExportContent(
    @Query('sectionId') sectionId?: string,
    @Query('moduleId') moduleId?: string,
  ) {
    return this.sectionContentService.bulkExportContent(sectionId, moduleId);
  }
}