import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentApprovalRepository } from '../repositories/content-approval.repository';
import { ContentApproval, ApprovalStatus } from '../entities/content-approval.entity';
import { CreateContentApprovalDto, UpdateContentApprovalDto, ReviewDecisionDto, ApprovalQueryDto, SubmitForReviewDto } from '../dto/content-approval.dto';
import { CollaborationCommentRepository } from '../repositories/collaboration-comment.repository';

@Injectable()
export class ContentApprovalService {
  constructor(
    @InjectRepository(ContentApprovalRepository)
    private readonly contentApprovalRepository: ContentApprovalRepository,
    @InjectRepository(CollaborationCommentRepository)
    private readonly collaborationCommentRepository: CollaborationCommentRepository,
  ) {}

  async findAll(query: ApprovalQueryDto): Promise<ContentApproval[]> {
    const { status, submittedBy, reviewerId, latestOnly } = query;
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (submittedBy) {
      where.submittedBy = submittedBy;
    }
    
    if (reviewerId) {
      where.reviewerId = reviewerId;
    }
    
    if (latestOnly !== false) {
      where.isLatestApproval = true;
    }
    
    return this.contentApprovalRepository.find({
      where,
      relations: ['content', 'submitter', 'reviewer'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<ContentApproval> {
    const approval = await this.contentApprovalRepository.findOne({
      where: { id },
      relations: ['content', 'submitter', 'reviewer']
    });
    
    if (!approval) {
      throw new NotFoundException(`Approval record with ID ${id} not found`);
    }
    
    return approval;
  }

  async findByContentId(contentId: string): Promise<ContentApproval[]> {
    return this.contentApprovalRepository.findByContentId(contentId);
  }

  async findLatestApproval(contentId: string): Promise<ContentApproval | undefined> {
    return this.contentApprovalRepository.findLatestApproval(contentId);
  }

  async create(createDto: CreateContentApprovalDto, userId: string): Promise<ContentApproval> {
    // Reset the "latest" flag on all other approval records for this content
    await this.contentApprovalRepository.resetLatestFlag(createDto.contentId);
    
    const approval = this.contentApprovalRepository.create({
      ...createDto,
      submittedBy: userId,
      isLatestApproval: true
    });
    
    return this.contentApprovalRepository.save(approval);
  }

  async update(id: string, updateDto: UpdateContentApprovalDto, userId: string): Promise<ContentApproval> {
    const approval = await this.findOne(id);
    
    // Check if the user is the reviewer or has admin permissions (would need a role check here)
    // For now, simplified check if the user is the reviewer or the submitter
    if (approval.reviewerId !== userId && approval.submittedBy !== userId) {
      throw new ForbiddenException('You do not have permission to update this approval');
    }
    
    Object.assign(approval, updateDto);
    return this.contentApprovalRepository.save(approval);
  }

  async submitForReview(submitDto: SubmitForReviewDto, userId: string): Promise<ContentApproval> {
    const { contentId, comments } = submitDto;
    
    // Check if there's an existing approval in progress
    const existingApproval = await this.contentApprovalRepository.findLatestApproval(contentId);
    if (existingApproval && existingApproval.status === ApprovalStatus.IN_REVIEW) {
      throw new BadRequestException('This content is already under review');
    }
    
    // Create a new approval record
    const approval = await this.create({
      contentId,
      status: ApprovalStatus.IN_REVIEW
    }, userId);
    
    // If there are comments, add them
    if (comments) {
      await this.collaborationCommentRepository.save({
        contentId,
        userId,
        comment: comments,
        commentType: 'feedback'
      });
    }
    
    return approval;
  }

  async reviewContent(approvalId: string, reviewDto: ReviewDecisionDto, reviewerId: string): Promise<ContentApproval> {
    const { decision, rejectionReason, scheduledPublishDate } = reviewDto;
    const approval = await this.findOne(approvalId);
    
    // Verify this content is in review status
    if (approval.status !== ApprovalStatus.IN_REVIEW) {
      throw new BadRequestException('This content is not currently under review');
    }
    
    // Update approval based on decision
    if (decision === 'approved') {
      approval.status = ApprovalStatus.APPROVED;
      if (scheduledPublishDate) {
        approval.scheduledPublishDate = new Date(scheduledPublishDate);
      }
    } else {
      approval.status = ApprovalStatus.REJECTED;
      approval.rejectionReason = rejectionReason;
    }
    
    approval.reviewerId = reviewerId;
    
    return this.contentApprovalRepository.save(approval);
  }

  async publishContent(approvalId: string, userId: string): Promise<ContentApproval> {
    const approval = await this.findOne(approvalId);
    
    // Verify this content is in approved status
    if (approval.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('This content is not approved for publishing');
    }
    
    approval.status = ApprovalStatus.PUBLISHED;
    return this.contentApprovalRepository.save(approval);
  }

  async checkScheduledPublishing(): Promise<ContentApproval[]> {
    const approvals = await this.contentApprovalRepository.findScheduledForPublishing();
    
    // Process each approval that's ready to publish
    const publishedApprovals = [];
    for (const approval of approvals) {
      approval.status = ApprovalStatus.PUBLISHED;
      publishedApprovals.push(await this.contentApprovalRepository.save(approval));
    }
    
    return publishedApprovals;
  }

  async getDashboardStats(): Promise<any> {
    const pendingReviewCount = await this.contentApprovalRepository.count({
      where: { status: ApprovalStatus.IN_REVIEW, isLatestApproval: true }
    });
    
    const approvedCount = await this.contentApprovalRepository.count({
      where: { status: ApprovalStatus.APPROVED, isLatestApproval: true }
    });
    
    const publishedCount = await this.contentApprovalRepository.count({
      where: { status: ApprovalStatus.PUBLISHED, isLatestApproval: true }
    });
    
    const rejectedCount = await this.contentApprovalRepository.count({
      where: { status: ApprovalStatus.REJECTED, isLatestApproval: true }
    });
    
    return {
      pendingReviewCount,
      approvedCount,
      publishedCount,
      rejectedCount
    };
  }
}