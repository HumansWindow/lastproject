import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionCheckpoint } from '../entities/section-checkpoint.entity';

@Injectable()
export class SectionCheckpointRepository {
  constructor(
    @InjectRepository(SectionCheckpoint)
    private readonly repository: Repository<SectionCheckpoint>,
  ) {}

  /**
   * Get the underlying repository instance - for internal service use only
   */
  public getRepository(): Repository<SectionCheckpoint> {
    return this.repository;
  }

  /**
   * Create a new section checkpoint
   * @param data Section checkpoint data
   * @returns The created section checkpoint
   */
  async create(data: Partial<SectionCheckpoint>): Promise<SectionCheckpoint> {
    const checkpoint = this.repository.create(data);
    return this.repository.save(checkpoint);
  }

  /**
   * Find checkpoints by progress ID
   * @param progressId Progress ID
   * @returns Array of checkpoints
   */
  async findByProgressId(progressId: string): Promise<SectionCheckpoint[]> {
    return this.repository.find({
      where: { progressId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Find checkpoints by section ID and user ID
   * @param sectionId Section ID
   * @param userId User ID
   * @returns Array of checkpoints
   */
  async findByUserAndSection(userId: string, sectionId: string): Promise<SectionCheckpoint[]> {
    return this.repository.find({
      where: { userId, sectionId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Find a specific checkpoint type for a section
   * @param userId User ID
   * @param sectionId Section ID
   * @param checkpointType Checkpoint type
   * @returns The checkpoint or null if not found
   */
  async findByTypeAndSection(
    userId: string, 
    sectionId: string, 
    checkpointType: string
  ): Promise<SectionCheckpoint | null> {
    return this.repository.findOne({
      where: { userId, sectionId, checkpointType }
    });
  }
  
  /**
   * Find checkpoint by ID
   * @param id Checkpoint ID
   * @returns The checkpoint or null if not found
   */
  async findById(id: string): Promise<SectionCheckpoint | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Check if a section is completed by a user
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Boolean indicating if section is completed
   */
  async isCompleted(userId: string, sectionId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { 
        userId, 
        sectionId, 
        isCompleted: true,
        checkpointType: 'section_complete'
      }
    });
    
    return count > 0;
  }

  /**
   * Mark a checkpoint as completed
   * @param checkpointId Checkpoint ID
   * @param completedAt Completion date
   * @returns Updated checkpoint
   */
  async markAsCompleted(
    checkpointId: string, 
    completedAt: Date = new Date()
  ): Promise<SectionCheckpoint> {
    const checkpoint = await this.findById(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint with ID ${checkpointId} not found`);
    }
    
    checkpoint.isCompleted = true;
    checkpoint.completedAt = completedAt;
    
    return this.repository.save(checkpoint);
  }

  /**
   * Mark a section as completed
   * @param userId User ID
   * @param sectionId Section ID
   * @param progressId Progress ID
   * @param data Additional checkpoint data
   * @returns The section completion checkpoint
   */
  async markSectionAsCompleted(
    userId: string, 
    sectionId: string,
    progressId: string,
    data: {
      responses?: Record<string, any>;
      timeSpent?: number;
    } = {}
  ): Promise<SectionCheckpoint> {
    // Look for existing section completion checkpoint
    let checkpoint = await this.findByTypeAndSection(
      userId, 
      sectionId, 
      'section_complete'
    );
    
    const now = new Date();
    
    if (!checkpoint) {
      // Create new checkpoint
      checkpoint = this.repository.create({
        userId,
        sectionId,
        progressId,
        checkpointType: 'section_complete',
        isCompleted: true,
        completedAt: now,
        completionDate: now,
        responses: data.responses,
        timeSpent: data.timeSpent
      });
    } else {
      // Update existing checkpoint
      checkpoint.isCompleted = true;
      checkpoint.completedAt = now;
      checkpoint.completionDate = now;
      if (data.responses) {
        checkpoint.responses = data.responses;
      }
      if (data.timeSpent) {
        checkpoint.timeSpent = data.timeSpent;
      }
    }
    
    return this.repository.save(checkpoint);
  }

  /**
   * Get completion status for all section checkpoints
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Object with completion status and details
   */
  async getSectionCompletionStatus(userId: string, sectionId: string): Promise<{
    isCompleted: boolean;
    totalCheckpoints: number;
    completedCheckpoints: number;
    completionPercentage: number;
    checkpoints: {
      type: string;
      isCompleted: boolean;
      completedAt: Date | null;
    }[];
  }> {
    const checkpoints = await this.findByUserAndSection(userId, sectionId);
    
    const completedCheckpoints = checkpoints.filter(cp => cp.isCompleted).length;
    const totalCheckpoints = checkpoints.length;
    const completionPercentage = totalCheckpoints > 0 
      ? Math.floor((completedCheckpoints / totalCheckpoints) * 100)
      : 0;
    
    const sectionCompleteCheckpoint = checkpoints.find(
      cp => cp.checkpointType === 'section_complete'
    );
    
    return {
      isCompleted: sectionCompleteCheckpoint?.isCompleted || false,
      totalCheckpoints,
      completedCheckpoints,
      completionPercentage,
      checkpoints: checkpoints.map(cp => ({
        type: cp.checkpointType || 'unknown',
        isCompleted: cp.isCompleted,
        completedAt: cp.completedAt
      }))
    };
  }
}