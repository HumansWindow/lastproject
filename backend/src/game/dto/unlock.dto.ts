import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TimeRemainingDto {
  @ApiProperty()
  hours: number;

  @ApiProperty()
  minutes: number;

  @ApiProperty()
  seconds: number;
}

export class SectionUnlockDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  sectionTitle: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  unlockDate: Date;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  timeRemaining: TimeRemainingDto;
}

export class ModuleUnlockDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;

  @ApiProperty()
  unlockDate: Date;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  timeRemaining: TimeRemainingDto;
}

export class ModuleUnlockScheduleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiPropertyOptional()
  previousModuleId?: string;

  @ApiProperty()
  unlockDate: Date;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  notificationSent: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SectionUnlockScheduleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  sectionId: string;

  @ApiPropertyOptional()
  previousSectionId?: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  unlockDate: Date;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  notificationSent: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ModuleUnlockInfoDto {
  @ApiProperty()
  hasNextModule: boolean;

  @ApiPropertyOptional()
  nextModuleId?: string;

  @ApiPropertyOptional()
  nextModuleTitle?: string;

  @ApiPropertyOptional()
  unlockDate?: Date;

  @ApiPropertyOptional()
  waitTimeHours?: number;
}

export class SectionUnlockInfoDto {
  @ApiProperty()
  hasNextSection: boolean;

  @ApiPropertyOptional()
  nextSectionId?: string;

  @ApiPropertyOptional()
  nextSectionTitle?: string;

  @ApiPropertyOptional()
  unlockDate?: Date;

  @ApiPropertyOptional()
  waitTimeHours?: number;
}

export class ModuleUnlockListDto {
  @ApiProperty({ type: [ModuleUnlockDto] })
  unlocks: ModuleUnlockDto[];
}

export class SectionUnlockListDto {
  @ApiProperty({ type: [SectionUnlockDto] })
  unlocks: SectionUnlockDto[];
}

export class ModuleAccessResultDto {
  @ApiProperty()
  canAccess: boolean;

  @ApiPropertyOptional()
  reason?: 'PREREQUISITE_NOT_COMPLETED' | 'WAITING_PERIOD' | string;

  @ApiPropertyOptional()
  prerequisiteModuleId?: string;

  @ApiPropertyOptional()
  unlockDate?: Date;

  @ApiPropertyOptional()
  timeRemaining?: TimeRemainingDto;
}

export class SectionAccessResultDto {
  @ApiProperty()
  canAccess: boolean;

  @ApiPropertyOptional()
  reason?: 'PREVIOUS_SECTION_NOT_COMPLETED' | 'SECTION_WAITING_PERIOD' | string;

  @ApiPropertyOptional()
  previousSectionId?: string;

  @ApiPropertyOptional()
  previousSectionTitle?: string;

  @ApiPropertyOptional()
  unlockDate?: Date;

  @ApiPropertyOptional()
  timeRemaining?: TimeRemainingDto;

  @ApiPropertyOptional()
  details?: ModuleAccessResultDto;
  
  @ApiPropertyOptional()
  moduleAccessDetails?: ModuleAccessResultDto;
}

export class PaymentInfoDto {
  @ApiProperty()
  @IsString()
  paymentToken: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

export class ExpediteUnlockDto {
  @ApiProperty()
  @IsString()
  paymentToken: string;
  
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;
}

export class ExpediteResultDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  alreadyUnlocked?: boolean;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  newUnlockDate?: Date;

  @ApiPropertyOptional()
  transactionId?: string;
  
  @ApiPropertyOptional()
  timeSkipped?: TimeRemainingDto;
}

export class ModuleUnlockUpdateResultDto {
  @ApiProperty()
  unlockedModules: {
    moduleId: string;
    moduleTitle: string;
  }[];
  
  @ApiProperty()
  unlockedSections: {
    sectionId: string;
    sectionTitle: string;
    moduleId: string;
  }[];
  
  @ApiProperty()
  checkedModules: number;
}