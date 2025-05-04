import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class RewardTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  transactionHash?: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RewardTransactionListDto {
  @ApiProperty({ type: [RewardTransactionDto] })
  transactions: RewardTransactionDto[];

  @ApiProperty()
  totalCount: number;
}

export class CreateRewardTransactionDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

  @ApiProperty()
  @IsString()
  amount: string;
}

export class UpdateRewardTransactionDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transactionHash?: string;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  processedAt?: Date;
}

export class RewardInfoDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;
  
  @ApiProperty()
  rewardAmount: string;
  
  @ApiProperty()
  transactionId: string;
  
  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;
}

export class RewardClaimResultDto {
  @ApiProperty()
  success: boolean;
  
  @ApiProperty()
  moduleId: string;
  
  @ApiProperty()
  transactionId: string;
  
  @ApiProperty()
  amount: string;
  
  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;
  
  @ApiPropertyOptional()
  message?: string;
}

export class RewardCalculationDto {
  @ApiProperty()
  baseAmount: number;

  @ApiProperty()
  bonusAmount: string;

  @ApiProperty()
  totalAmount: string;
  
  @ApiProperty()
  moduleId: string;
  
  @ApiProperty()
  alreadyClaimed: boolean;
  
  @ApiPropertyOptional()
  transactionId?: string;
}

export class ProcessingResultDto {
  @ApiProperty()
  processedCount: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failedCount: number;
  
  @ApiProperty({ type: [String] })
  transactionIds: string[];
}

export class RewardClaimDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  walletAddress?: string;
}

export class RewardsSummaryDto {
  @ApiProperty()
  totalEarned: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  totalClaimed: number;

  @ApiProperty()
  lastClaimDate?: Date;
}

export class RewardHistoryDto {
  @ApiProperty({ type: [RewardTransactionDto] })
  transactions: RewardTransactionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  totalCompleted: number;
  
  @ApiProperty()
  totalTransactions: number;
}