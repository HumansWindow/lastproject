import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CollaborationCommentRepository } from '../repositories/collaboration-comment.repository';
import { CollaborationComment } from '../entities/collaboration-comment.entity';
import { CreateCollaborationCommentDto, UpdateCollaborationCommentDto, CommentQueryDto } from '../dto/collaboration-comment.dto';
import { UsersService } from '../../users/users.service';

@Injectable()
export class CollaborationCommentService {
  constructor(
    @InjectRepository(CollaborationCommentRepository)
    private readonly commentRepository: CollaborationCommentRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: CommentQueryDto): Promise<CollaborationComment[]> {
    const { contentId, userId, commentType, unresolved, includeReplies } = query;
    
    // Build query conditions
    const where: any = {};
    
    if (contentId) {
      where.contentId = contentId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (commentType) {
      where.commentType = commentType;
    }
    
    if (unresolved) {
      where.isResolved = false;
    }
    
    // Handle parent comments vs. replies
    if (!includeReplies) {
      where.parentCommentId = null;
    }
    
    return this.commentRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<CollaborationComment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user']
    });
    
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return comment;
  }

  async findReplies(commentId: string): Promise<CollaborationComment[]> {
    return this.commentRepository.findCommentReplies(commentId);
  }

  async create(createDto: CreateCollaborationCommentDto, userId: string): Promise<CollaborationComment> {
    // Verify this is not a reply to a non-existent comment
    if (createDto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createDto.parentCommentId }
      });
      
      if (!parentComment) {
        throw new BadRequestException(`Parent comment with ID ${createDto.parentCommentId} not found`);
      }
    }
    
    // Create the comment
    const comment = this.commentRepository.create({
      ...createDto,
      userId
    });
    
    return this.commentRepository.save(comment);
  }

  async update(id: string, updateDto: UpdateCollaborationCommentDto, userId: string): Promise<CollaborationComment> {
    const comment = await this.findOne(id);
    
    // Only the comment author can update it
    if (comment.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this comment');
    }
    
    // Update the comment
    Object.assign(comment, updateDto);
    
    return this.commentRepository.save(comment);
  }

  async resolveComment(id: string, userId: string): Promise<CollaborationComment> {
    const comment = await this.findOne(id);
    
    // Mark the comment as resolved
    comment.isResolved = true;
    comment.resolvedBy = userId;
    comment.resolvedAt = new Date();
    
    return this.commentRepository.save(comment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);
    
    // Only the comment author can delete it
    if (comment.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }
    
    await this.commentRepository.remove(comment);
  }

  async getContentCommentStats(contentId: string): Promise<any> {
    // Get total count of comments
    const totalCount = await this.commentRepository.count({
      where: { contentId }
    });
    
    // Get count of unresolved comments
    const unresolvedCount = await this.commentRepository.count({
      where: { contentId, isResolved: false }
    });
    
    // Get count by comment type
    const feedbackCount = await this.commentRepository.count({
      where: { contentId, commentType: 'feedback' }
    });
    
    const questionCount = await this.commentRepository.count({
      where: { contentId, commentType: 'question' }
    });
    
    const suggestionCount = await this.commentRepository.count({
      where: { contentId, commentType: 'suggestion' }
    });
    
    const resolutionCount = await this.commentRepository.count({
      where: { contentId, commentType: 'resolution' }
    });
    
    // Get count of top-level comments vs replies
    const topLevelCount = await this.commentRepository.count({
      where: { contentId, parentCommentId: null }
    });
    
    const replyCount = totalCount - topLevelCount;
    
    return {
      totalCount,
      unresolvedCount,
      resolvedCount: totalCount - unresolvedCount,
      byType: {
        feedback: feedbackCount,
        question: questionCount,
        suggestion: suggestionCount,
        resolution: resolutionCount
      },
      topLevelCount,
      replyCount
    };
  }
}