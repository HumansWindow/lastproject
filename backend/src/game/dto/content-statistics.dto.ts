import { ApiProperty } from '@nestjs/swagger';

export class ContentTypeStatistics {
  @ApiProperty({ description: 'Content type identifier' })
  type: string;

  @ApiProperty({ description: 'Number of content items of this type' })
  count: number;

  @ApiProperty({ description: 'Average completion rate for this content type' })
  averageCompletionRate: number;

  @ApiProperty({ description: 'Average time spent on this content type (seconds)' })
  averageTimeSpent: number;
}

export class ModuleStatistics {
  @ApiProperty({ description: 'Module identifier' })
  id: string;

  @ApiProperty({ description: 'Module title' })
  title: string;

  @ApiProperty({ description: 'Total number of users who started this module' })
  startedCount: number;
  
  @ApiProperty({ description: 'Total number of users who completed this module' })
  completedCount: number;

  @ApiProperty({ description: 'Average completion rate (percentage)' })
  completionRate: number;
  
  @ApiProperty({ description: 'Average time to complete (minutes)' })
  averageCompletionTime: number;
}

export class ContentStatisticsDto {
  @ApiProperty({ description: 'Total number of modules' })
  totalModules: number;
  
  @ApiProperty({ description: 'Total number of sections' })
  totalSections: number;
  
  @ApiProperty({ description: 'Total number of content items' })
  totalContent: number;
  
  @ApiProperty({ description: 'Total number of media assets' })
  totalMediaAssets: number;
  
  @ApiProperty({ description: 'Average module completion rate' })
  averageModuleCompletionRate: number;

  @ApiProperty({ description: 'Total number of unique users' })
  totalUniqueUsers: number;

  @ApiProperty({ description: 'Content statistics by type', type: [ContentTypeStatistics] })
  contentByType: ContentTypeStatistics[];

  @ApiProperty({ description: 'Module statistics', type: [ModuleStatistics] })
  moduleStatistics: ModuleStatistics[];
  
  @ApiProperty({ description: 'Most viewed content ID' })
  mostViewedContentId: string;
  
  @ApiProperty({ description: 'Most viewed content title' })
  mostViewedContentTitle: string;
  
  @ApiProperty({ description: 'Most viewed content view count' })
  mostViewedContentCount: number;

  @ApiProperty({ description: 'Least viewed content ID' })
  leastViewedContentId: string;
  
  @ApiProperty({ description: 'Least viewed content title' })
  leastViewedContentTitle: string;
  
  @ApiProperty({ description: 'Least viewed content view count' })
  leastViewedContentCount: number;
  
  @ApiProperty({ description: 'Content with highest average time spent (ID)' })
  highestEngagementContentId: string;
  
  @ApiProperty({ description: 'Content with highest average time spent (title)' })
  highestEngagementContentTitle: string;
  
  @ApiProperty({ description: 'Highest average time spent (seconds)' })
  highestEngagementTime: number;
}