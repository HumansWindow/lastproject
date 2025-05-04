import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SectionNavigationService } from '../services/section-navigation.service';
import { NavigationResultDto, SectionWithContentDto } from '../dto/section.dto';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('Section Navigation')
@Controller('game/navigation')
@UseGuards(AuthGuard('jwt'))
export class SectionNavigationController {
  constructor(
    private readonly navigationService: SectionNavigationService
  ) {}

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Get navigation information for all sections in a module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Navigation information retrieved successfully',
    type: NavigationResultDto,
  })
  async getModuleNavigationInfo(
    @Req() req: RequestWithUser,
    @Param('moduleId') moduleId: string
  ): Promise<NavigationResultDto> {
    try {
      return await this.navigationService.getModuleNavigationInfo(req.user.id, moduleId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Navigate to a specific section with validation' })
  @ApiParam({ name: 'sectionId', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section retrieved successfully',
    type: SectionWithContentDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Navigation to section not allowed',
  })
  async navigateToSection(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string
  ): Promise<SectionWithContentDto> {
    try {
      return await this.navigationService.navigateToSection(req.user.id, sectionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('section/:sectionId/next')
  @ApiOperation({ summary: 'Navigate to next section with validation' })
  @ApiParam({ name: 'sectionId', description: 'Current Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Next section retrieved successfully',
    type: SectionWithContentDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Navigation to next section not allowed',
  })
  @ApiResponse({
    status: 404,
    description: 'No next section available',
  })
  async navigateToNextSection(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string
  ): Promise<SectionWithContentDto> {
    try {
      return await this.navigationService.navigateToNextSection(req.user.id, sectionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('section/:sectionId/previous')
  @ApiOperation({ summary: 'Navigate to previous section' })
  @ApiParam({ name: 'sectionId', description: 'Current Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Previous section retrieved successfully',
    type: SectionWithContentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No previous section available',
  })
  async navigateToPreviousSection(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string
  ): Promise<SectionWithContentDto> {
    try {
      return await this.navigationService.navigateToPreviousSection(req.user.id, sectionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}