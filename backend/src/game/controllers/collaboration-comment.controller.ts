import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CollaborationCommentService } from '../services/collaboration-comment.service';
import { CollaborationComment } from '../entities/collaboration-comment.entity';
import { CreateCollaborationCommentDto, UpdateCollaborationCommentDto, CollaborationCommentDto, CommentQueryDto } from '../dto/collaboration-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('content-collaboration')
@Controller('game/content-collaboration')
@UseGuards(AuthGuard('jwt'))
export class CollaborationCommentController {
  constructor(private readonly commentService: CollaborationCommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all collaboration comments with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns all comments that match filters' })
  async findAll(@Query() query: CommentQueryDto): Promise<CollaborationComment[]> {
    return this.commentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Returns the comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id') id: string): Promise<CollaborationComment> {
    return this.commentService.findOne(id);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get replies for a comment' })
  @ApiParam({ name: 'id', description: 'Parent comment ID' })
  @ApiResponse({ status: 200, description: 'Returns replies to the comment' })
  async findReplies(@Param('id') id: string): Promise<CollaborationComment[]> {
    return this.commentService.findReplies(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new comment' })
  @ApiBody({ type: CreateCollaborationCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(@Body() createDto: CreateCollaborationCommentDto, @Req() req: RequestWithUser): Promise<CollaborationComment> {
    return this.commentService.create(createDto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: UpdateCollaborationCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollaborationCommentDto,
    @Req() req: RequestWithUser
  ): Promise<CollaborationComment> {
    return this.commentService.update(id, updateDto, req.user.id);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment resolved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async resolve(@Param('id') id: string, @Req() req: RequestWithUser): Promise<CollaborationComment> {
    return this.commentService.resolveComment(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async delete(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.commentService.delete(id, req.user.id);
  }

  @Get('content/:contentId/stats')
  @ApiOperation({ summary: 'Get comment statistics for specific content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Returns comment statistics for the content' })
  async getContentStats(@Param('contentId') contentId: string): Promise<any> {
    return this.commentService.getContentCommentStats(contentId);
  }
}