import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ContentTemplateService } from '../services/content-template.service';
import { ContentTemplateEntity } from '../entities/content-template.entity';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';

class CreateTemplateDto {
  name: string;
  contentType: string;
  description?: string;
  template: any;
}

class UpdateTemplateDto {
  name?: string;
  description?: string;
  template?: any;
  isActive?: boolean;
}

@ApiTags('content-templates')
@Controller('game/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentTemplateController {
  constructor(
    private readonly templateService: ContentTemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all content templates' })
  @ApiResponse({ status: 200, description: 'Returns all content templates' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllTemplates(
    @Query('includeInactive') includeInactive: boolean = false,
  ): Promise<ContentTemplateEntity[]> {
    return this.templateService.getAllTemplates(includeInactive);
  }

  @Get('type/:contentType')
  @ApiOperation({ summary: 'Get templates by content type' })
  @ApiResponse({ status: 200, description: 'Returns templates for the specified content type' })
  @ApiParam({ name: 'contentType', description: 'Content type to get templates for' })
  async getTemplatesByType(
    @Param('contentType') contentType: string,
  ): Promise<ContentTemplateEntity[]> {
    return this.templateService.getTemplatesByType(contentType);
  }

  @Get('default/:contentType')
  @ApiOperation({ summary: 'Get default template for content type' })
  @ApiResponse({ status: 200, description: 'Returns the default template for the specified content type' })
  @ApiParam({ name: 'contentType', description: 'Content type to get default template for' })
  async getDefaultTemplateForType(
    @Param('contentType') contentType: string,
  ): Promise<any> {
    return this.templateService.getDefaultTemplateForType(contentType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content template by ID' })
  @ApiResponse({ status: 200, description: 'Returns the requested template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async getTemplateById(
    @Param('id') id: string,
  ): Promise<ContentTemplateEntity> {
    return this.templateService.findTemplateById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new content template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async createTemplate(
    @Body() createDto: CreateTemplateDto,
    @GetUser() user: User,
  ): Promise<ContentTemplateEntity> {
    return this.templateService.createTemplate({
      ...createDto,
      createdBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id,
      isActive: true,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a content template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ): Promise<ContentTemplateEntity> {
    return this.templateService.updateTemplate(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @Roles(UserRole.ADMIN)
  async deleteTemplate(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const result = await this.templateService.deleteTemplate(id);
    return { success: result };
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a content template' })
  @ApiResponse({ status: 200, description: 'Template deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deactivateTemplate(
    @Param('id') id: string,
  ): Promise<ContentTemplateEntity> {
    return this.templateService.softDeleteTemplate(id);
  }

  @Get('validation/:contentType')
  @ApiOperation({ summary: 'Get validation rules for a content type' })
  @ApiResponse({ status: 200, description: 'Returns validation rules for the specified content type' })
  @ApiParam({ name: 'contentType', description: 'Content type to get validation rules for' })
  async getValidationRules(
    @Param('contentType') contentType: string,
  ): Promise<any[]> {
    return this.templateService.getValidationRulesForType(contentType);
  }
}