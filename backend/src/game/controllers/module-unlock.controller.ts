import { ModuleUnlockService } from '../services/module-unlock.service';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { 
  ModuleUnlockListDto, 
  SectionUnlockListDto,
  ModuleAccessResultDto,
  SectionAccessResultDto,
  ExpediteUnlockDto,
  ExpediteResultDto,
  ModuleUnlockUpdateResultDto,
} from '../dto/unlock.dto';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';

@ApiTags('Module Unlocks')
@Controller('game/unlocks')
@UseGuards(AuthGuard('jwt'))
export class ModuleUnlockController {
  constructor(
    private readonly moduleUnlockService: ModuleUnlockService
  ) {}

  @Get()
  @ApiOperation({ summary: "Get user's upcoming module unlocks" })
  @ApiResponse({
    status: 200,
    description: "List of user's upcoming module unlocks",
    type: ModuleUnlockListDto,
  })
  async getUserUnlocks(@Req() req: RequestWithUser): Promise<ModuleUnlockListDto> {
    // return this.moduleUnlockService.getUserModuleUnlocks(req.user.id);
    return { unlocks: [] }; // Placeholder
  }

  @Get(':moduleId')
  @ApiOperation({ summary: 'Get unlock status for a specific module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID to check' })
  @ApiResponse({
    status: 200,
    description: 'Module unlock status',
    type: ModuleAccessResultDto,
  })
  async getModuleUnlockStatus(
    @Req() req: RequestWithUser,
    @Param('moduleId') moduleId: string,
  ): Promise<ModuleAccessResultDto> {
    // return this.moduleUnlockService.checkModuleAccess(req.user.id, moduleId);
    return { canAccess: false }; // Placeholder
  }

  @Post(':moduleId/expedite')
  @ApiOperation({ summary: 'Pay to skip the waiting period for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID to expedite unlock for' })
  @ApiBody({ type: ExpediteUnlockDto })
  @ApiResponse({
    status: 200,
    description: 'Module unlocked successfully',
    type: ExpediteResultDto,
  })
  async expediteModuleUnlock(
    @Req() req: RequestWithUser,
    @Param('moduleId') moduleId: string,
    @Body() expediteUnlockDto: ExpediteUnlockDto,
  ): Promise<ExpediteResultDto> {
    // return this.moduleUnlockService.expediteUnlock(req.user.id, moduleId, expediteUnlockDto);
    return null; // Placeholder
  }

  @Get('sections')
  @ApiOperation({ summary: "Get user's upcoming section unlocks" })
  @ApiQuery({ name: 'moduleId', required: false, description: 'Filter by module ID' })
  @ApiResponse({
    status: 200,
    description: "List of user's upcoming section unlocks",
    type: SectionUnlockListDto,
  })
  async getUserSectionUnlocks(
    @Req() req: RequestWithUser,
    @Query('moduleId') moduleId?: string,
  ): Promise<SectionUnlockListDto> {
    // return this.moduleUnlockService.getUserSectionUnlocks(req.user.id, moduleId);
    return { unlocks: [] }; // Placeholder
  }

  @Get('sections/:sectionId')
  @ApiOperation({ summary: 'Get unlock status for a specific section' })
  @ApiParam({ name: 'sectionId', description: 'Section ID to check' })
  @ApiResponse({
    status: 200,
    description: 'Section unlock status',
    type: SectionAccessResultDto,
  })
  async getSectionUnlockStatus(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string,
  ): Promise<SectionAccessResultDto> {
    // return this.moduleUnlockService.checkSectionAccess(req.user.id, sectionId);
    return { canAccess: false }; // Placeholder
  }

  @Post('sections/:sectionId/expedite')
  @ApiOperation({ summary: 'Pay to skip the waiting period for a section' })
  @ApiParam({ name: 'sectionId', description: 'Section ID to expedite unlock for' })
  @ApiBody({ type: ExpediteUnlockDto })
  @ApiResponse({
    status: 200,
    description: 'Section unlocked successfully',
    type: ExpediteResultDto,
  })
  async expediteSectionUnlock(
    @Req() req: RequestWithUser,
    @Param('sectionId') sectionId: string,
    @Body() expediteUnlockDto: ExpediteUnlockDto,
  ): Promise<ExpediteResultDto> {
    // return this.moduleUnlockService.expediteSectionUnlock(req.user.id, sectionId, expediteUnlockDto);
    return null; // Placeholder
  }

  @Get('check-and-update')
  @ApiOperation({ summary: 'Check and update unlock status for all waiting modules' })
  @ApiResponse({
    status: 200,
    description: 'Modules checked and updated',
    type: ModuleUnlockUpdateResultDto,
  })
  async checkAndUpdateUnlocks(
    @Req() req: RequestWithUser,
  ): Promise<ModuleUnlockUpdateResultDto> {
    // If there's nothing to unlock, return default response
    return this.moduleUnlockService.checkAndUpdateUserModules(req.user.id);
  }

  // Admin endpoints

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all module unlocks (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of all module unlocks',
  })
  async getAllModuleUnlocks(): Promise<any> {
    // return this.moduleUnlockService.getAllModuleUnlocks();
    return { unlocks: [] }; // Placeholder
  }

  @Post('admin/process-unlocks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process all pending module unlocks (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Processing result',
  })
  async processAllUnlocks(): Promise<any> {
    // return this.moduleUnlockService.processAllPendingUnlocks();
    return { processed: 0, failed: 0 }; // Placeholder
  }

  @Put('admin/unlock/:moduleId/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually unlock a module for a user (admin)' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Module manually unlocked',
  })
  async adminUnlockModule(
    @Param('moduleId') moduleId: string,
    @Param('userId') userId: string,
  ): Promise<any> {
    // return this.moduleUnlockService.adminUnlockModule(userId, moduleId);
    return { success: true, message: 'Module unlocked' }; // Placeholder
  }
}