import { EntityRepository, Repository } from 'typeorm';
import { CollaborationComment } from '../entities/collaboration-comment.entity';

@EntityRepository(CollaborationComment)
export class CollaborationCommentRepository extends Repository<CollaborationComment> {
  
  async findByContentId(contentId: string, includeReplies: boolean = true): Promise<CollaborationComment[]> {
    const query = this.createQueryBuilder('comment')
      .where('comment.contentId = :contentId', { contentId })
      .leftJoinAndSelect('comment.user', 'user')
      .orderBy('comment.createdAt', 'DESC');
    
    if (!includeReplies) {
      query.andWhere('comment.parentCommentId IS NULL');
    }
    
    return query.getMany();
  }
  
  async findCommentReplies(commentId: string): Promise<CollaborationComment[]> {
    return this.createQueryBuilder('comment')
      .where('comment.parentCommentId = :commentId', { commentId })
      .leftJoinAndSelect('comment.user', 'user')
      .orderBy('comment.createdAt', 'ASC')
      .getMany();
  }
  
  async findUnresolvedComments(contentId: string): Promise<CollaborationComment[]> {
    return this.createQueryBuilder('comment')
      .where('comment.contentId = :contentId', { contentId })
      .andWhere('comment.isResolved = :isResolved', { isResolved: false })
      .leftJoinAndSelect('comment.user', 'user')
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
  }
  
  async countUnresolvedComments(contentId: string): Promise<number> {
    return this.count({
      where: { 
        contentId, 
        isResolved: false,
        parentCommentId: null // Only count top-level comments
      }
    });
  }
  
  async findByType(contentId: string, commentType: any): Promise<CollaborationComment[]> {
    return this.find({
      where: { contentId, commentType },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }
  
  async markAsResolved(commentId: string, resolvedBy: string): Promise<void> {
    const now = new Date();
    await this.update(commentId, {
      isResolved: true,
      resolvedBy,
      resolvedAt: now
    });
  }
}