import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsString, IsBoolean, IsDate, IsDateString } from 'class-validator';
import { ApprovalStatus } from '../entities/content-approval.entity';

export class ContentApprovalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contentId: string;

  @ApiProperty({ enum: ApprovalStatus, enumName: 'ApprovalStatus' })
  status: ApprovalStatus;

  @ApiProperty()
  submittedBy: string;

  @ApiProperty({ required: false })
  reviewerId?: string;

  @ApiProperty({ required: false })
  rejectionReason?: string;

  @ApiProperty({ required: false })
  scheduledPublishDate?: Date;

  @ApiProperty()
  isLatestApproval: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateContentApprovalDto {
  @ApiProperty()
  @IsUUID()
  contentId: string;

  @ApiProperty({ enum: ApprovalStatus, default: ApprovalStatus.DRAFT })
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  reviewerId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  scheduledPublishDate?: string;
}

export class UpdateContentApprovalDto {
  @ApiProperty({ enum: ApprovalStatus, required: false })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  reviewerId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  scheduledPublishDate?: string;
}

export class SubmitForReviewDto {
  @ApiProperty()
  @IsUUID()
  contentId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class ReviewDecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  scheduledPublishDate?: string;
}

export class ApprovalQueryDto {
  @ApiProperty({ required: false })
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  submittedBy?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  reviewerId?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  latestOnly?: boolean = true;
}