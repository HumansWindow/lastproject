import { EntityRepository, Repository, LessThanOrEqual } from 'typeorm';
import { ContentApproval, ApprovalStatus } from '../entities/content-approval.entity';

@EntityRepository(ContentApproval)
export class ContentApprovalRepository extends Repository<ContentApproval> {
  
  async findByContentId(contentId: string): Promise<ContentApproval[]> {
    return this.find({
      where: { contentId },
      order: { createdAt: 'DESC' }
    });
  }

  async findLatestApproval(contentId: string): Promise<ContentApproval | undefined> {
    return this.findOne({
      where: { contentId, isLatestApproval: true }
    });
  }

  async findPendingApprovals(): Promise<ContentApproval[]> {
    return this.find({
      where: { status: ApprovalStatus.IN_REVIEW, isLatestApproval: true },
      relations: ['content', 'submitter']
    });
  }

  async findApprovalsByStatus(status: ApprovalStatus): Promise<ContentApproval[]> {
    return this.find({
      where: { status, isLatestApproval: true },
      relations: ['content', 'submitter', 'reviewer']
    });
  }

  async findByReviewerId(reviewerId: string): Promise<ContentApproval[]> {
    return this.find({
      where: { reviewerId, isLatestApproval: true },
      relations: ['content', 'submitter']
    });
  }

  async findScheduledForPublishing(): Promise<ContentApproval[]> {
    const now = new Date();
    return this.find({
      where: {
        status: ApprovalStatus.APPROVED,
        isLatestApproval: true,
        scheduledPublishDate: LessThanOrEqual(now)
      },
      relations: ['content']
    });
  }
  
  async resetLatestFlag(contentId: string): Promise<void> {
    await this.update({ contentId }, { isLatestApproval: false });
  }
}