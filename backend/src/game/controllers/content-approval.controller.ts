import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ContentApprovalService } from '../services/content-approval.service';
import { ContentApproval } from '../entities/content-approval.entity';
import { CreateContentApprovalDto, UpdateContentApprovalDto, ReviewDecisionDto, ContentApprovalDto, ApprovalQueryDto, SubmitForReviewDto } from '../dto/content-approval.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('content-approval')
@Controller('game/content-approval')
@UseGuards(AuthGuard('jwt'))
export class ContentApprovalController {
  constructor(private readonly contentApprovalService: ContentApprovalService) {}

  @Get()
  @ApiOperation({ summary: 'Get all content approvals with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns all content approvals that match filters' })
  async findAll(@Query() query: ApprovalQueryDto): Promise<ContentApproval[]> {
    return this.contentApprovalService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content approval by ID' })
  @ApiParam({ name: 'id', description: 'Content approval ID' })
  @ApiResponse({ status: 200, description: 'Returns the content approval' })
  @ApiResponse({ status: 404, description: 'Content approval not found' })
  async findOne(@Param('id') id: string): Promise<ContentApproval> {
    return this.contentApprovalService.findOne(id);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get all approvals for specific content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Returns approvals for the content' })
  async findByContent(@Param('contentId') contentId: string): Promise<ContentApproval[]> {
    return this.contentApprovalService.findByContentId(contentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new content approval' })
  @ApiBody({ type: CreateContentApprovalDto })
  @ApiResponse({ status: 201, description: 'Content approval created successfully' })
  async create(@Body() createDto: CreateContentApprovalDto, @Req() req: RequestWithUser): Promise<ContentApproval> {
    return this.contentApprovalService.create(createDto, req.user.id);
  }

  @Post('submit-for-review')
  @ApiOperation({ summary: 'Submit content for review' })
  @ApiBody({ type: SubmitForReviewDto })
  @ApiResponse({ status: 201, description: 'Content submitted for review successfully' })
  async submitForReview(@Body() submitDto: SubmitForReviewDto, @Req() req: RequestWithUser): Promise<ContentApproval> {
    return this.contentApprovalService.submitForReview(submitDto, req.user.id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review content (approve or reject)' })
  @ApiParam({ name: 'id', description: 'Content approval ID' })
  @ApiBody({ type: ReviewDecisionDto })
  @ApiResponse({ status: 200, description: 'Content reviewed successfully' })
  @Roles('admin', 'editor', 'reviewer')
  @UseGuards(RolesGuard)
  async review(
    @Param('id') id: string, 
    @Body() reviewDto: ReviewDecisionDto, 
    @Req() req: RequestWithUser
  ): Promise<ContentApproval> {
    return this.contentApprovalService.reviewContent(id, reviewDto, req.user.id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish approved content' })
  @ApiParam({ name: 'id', description: 'Content approval ID' })
  @ApiResponse({ status: 200, description: 'Content published successfully' })
  @Roles('admin', 'editor')
  @UseGuards(RolesGuard)
  async publish(@Param('id') id: string, @Req() req: RequestWithUser): Promise<ContentApproval> {
    return this.contentApprovalService.publishContent(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update content approval' })
  @ApiParam({ name: 'id', description: 'Content approval ID' })
  @ApiBody({ type: UpdateContentApprovalDto })
  @ApiResponse({ status: 200, description: 'Content approval updated successfully' })
  @ApiResponse({ status: 404, description: 'Content approval not found' })
  async update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateContentApprovalDto, 
    @Req() req: RequestWithUser
  ): Promise<ContentApproval> {
    return this.contentApprovalService.update(id, updateDto, req.user.id);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get approval dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns approval statistics' })
  @Roles('admin', 'editor', 'reviewer')
  @UseGuards(RolesGuard)
  async getDashboardStats(): Promise<any> {
    return this.contentApprovalService.getDashboardStats();
  }

  @Post('scheduled-publishing/check')
  @ApiOperation({ summary: 'Check and process scheduled publishing' })
  @ApiResponse({ status: 200, description: 'Scheduled publishing processed' })
  @Roles('admin', 'system')
  @UseGuards(RolesGuard)
  async checkScheduledPublishing(): Promise<ContentApproval[]> {
    return this.contentApprovalService.checkScheduledPublishing();
  }
}