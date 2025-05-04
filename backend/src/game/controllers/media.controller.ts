import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { MediaService } from '../services/media.service';
import { 
  MediaAssetDto, 
  CreateMediaAssetDto, 
  UpdateMediaAssetDto, 
  MediaAssetFilterDto,
  MediaAssetListDto,
  BulkDeleteMediaAssetsDto,
  MediaType,
  MediaCategory,
  MediaUploadResponseDto
} from '../dto/media.dto';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('game-media')
@Controller('game/media')
@UseGuards(AuthGuard('jwt'))
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media assets with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of media assets', type: MediaAssetListDto })
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false, description: 'Filter by media type' })
  @ApiQuery({ name: 'category', enum: MediaCategory, required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for filename' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Filter by section ID' })
  @ApiQuery({ name: 'moduleId', required: false, description: 'Filter by module ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  async findAll(@Query() filterDto: MediaAssetFilterDto): Promise<MediaAssetListDto> {
    return this.mediaService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a media asset by ID' })
  @ApiResponse({ status: 200, description: 'Returns the media asset', type: MediaAssetDto })
  @ApiResponse({ status: 404, description: 'Media asset not found' })
  @ApiParam({ name: 'id', description: 'Media asset ID' })
  async findOne(@Param('id') id: string): Promise<MediaAssetDto> {
    return this.mediaService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new media asset by uploading a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file to upload',
        },
        altText: {
          type: 'string',
          description: 'Alternative text for the media',
        },
        category: {
          type: 'string',
          enum: Object.values(MediaCategory),
          description: 'Category of the media asset',
        },
        sectionId: {
          type: 'string',
          description: 'ID of the section to associate with the media',
        },
        moduleId: {
          type: 'string',
          description: 'ID of the module to associate with the media',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media asset created successfully', type: MediaUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createMediaAssetDto: CreateMediaAssetDto,
    @Req() req: RequestWithUser,
  ): Promise<MediaUploadResponseDto> {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const asset = await this.mediaService.create(file, req.user.id, createMediaAssetDto);
      return { asset, success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload media asset', 
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a media asset' })
  @ApiResponse({ status: 200, description: 'Media asset updated successfully', type: MediaAssetDto })
  @ApiResponse({ status: 404, description: 'Media asset not found' })
  @ApiParam({ name: 'id', description: 'Media asset ID' })
  async update(
    @Param('id') id: string,
    @Body() updateMediaAssetDto: UpdateMediaAssetDto,
  ): Promise<MediaAssetDto> {
    return this.mediaService.update(id, updateMediaAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media asset' })
  @ApiResponse({ status: 200, description: 'Media asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media asset not found' })
  @ApiParam({ name: 'id', description: 'Media asset ID' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.mediaService.delete(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple media assets' })
  @ApiResponse({ status: 200, description: 'Media assets deleted successfully' })
  @ApiBody({ type: BulkDeleteMediaAssetsDto })
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteMediaAssetsDto): Promise<{ count: number }> {
    return this.mediaService.bulkDelete(bulkDeleteDto.assetIds);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all media assets for a specific section' })
  @ApiResponse({ status: 200, description: 'Returns a list of media assets for the section', type: [MediaAssetDto] })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  async findBySection(@Param('sectionId') sectionId: string): Promise<MediaAssetDto[]> {
    return this.mediaService.findBySection(sectionId);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Get all media assets for a specific module' })
  @ApiResponse({ status: 200, description: 'Returns a list of media assets for the module', type: [MediaAssetDto] })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  async findByModule(@Param('moduleId') moduleId: string): Promise<MediaAssetDto[]> {
    return this.mediaService.findByModule(moduleId);
  }
}