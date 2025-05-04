import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SectionCheckpointService } from '../services/section-checkpoint.service';
import { CheckpointCompletionDto, SectionCompletionResultDto } from '../dto/progress.dto';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('Section Checkpoints')
@Controller('game/checkpoints')
@UseGuards(AuthGuard('jwt'))
export class SectionCheckpointController {
  constructor(
    private readonly checkpointService: SectionCheckpointService
  ) {}

  @Post(':sectionId/complete')
  @ApiOperation({ summary: 'Mark a section as completed' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        responses: { type: 'object' },
        timeSpent: { type: 'number' } 
      } 
    } 
  })
  @ApiResponse({
    status: 200,
    description: 'Section completed successfully with next section info',
    type: SectionCompletionResultDto,
  })
  async completeSection(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string,
    @Body() data: { responses?: Record<string, any>; timeSpent?: number }
  ): Promise<SectionCompletionResultDto> {
    try {
      return await this.checkpointService.completeSection(
        req.user.id,
        sectionId,
        data
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':sectionId/checkpoint')
  @ApiOperation({ summary: 'Record a checkpoint completion for a section' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiBody({ type: CheckpointCompletionDto })
  @ApiResponse({
    status: 200,
    description: 'Checkpoint recorded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        checkpoint: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            checkpointType: { type: 'string' },
            isCompleted: { type: 'boolean' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async completeCheckpoint(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string,
    @Body() checkpointData: Omit<CheckpointCompletionDto, 'sectionId'>
  ) {
    const fullData: CheckpointCompletionDto = {
      sectionId,
      ...checkpointData
    };
    
    try {
      return await this.checkpointService.completeCheckpoint(req.user.id, fullData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':sectionId/status')
  @ApiOperation({ summary: 'Get detailed checkpoint status for a section' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Checkpoint status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sectionProgress: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              isCompleted: { type: 'boolean' },
              completedAt: { type: 'string', format: 'date-time' },
              timeSpent: { type: 'number' }
            }
          }
        },
        completionStats: {
          type: 'object',
          properties: {
            isCompleted: { type: 'boolean' },
            totalCheckpoints: { type: 'number' },
            completedCheckpoints: { type: 'number' },
            completionPercentage: { type: 'number' }
          }
        }
      }
    }
  })
  async getCheckpointStatus(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string
  ) {
    try {
      return await this.checkpointService.getCheckpointStatus(req.user.id, sectionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':sectionId/can-proceed')
  @ApiOperation({ summary: 'Check if user can proceed to next section' })
  @ApiParam({ name: 'sectionId', description: 'Current Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Navigation check result',
    schema: {
      type: 'object',
      properties: {
        canProceed: { type: 'boolean' },
        reason: { type: 'string' },
        currentSectionCompleted: { type: 'boolean' },
        nextSectionId: { type: 'string' }
      }
    }
  })
  async canProceedToNextSection(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string
  ) {
    try {
      return await this.checkpointService.canProceedToNextSection(req.user.id, sectionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}