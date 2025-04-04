import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  UseGuards, 
  Request,
  HttpStatus
} from '@nestjs/common';
import { DiaryService } from '../services/diary.service';
import { CreateDiaryDto, UpdateDiaryDto, DiaryResponseDto } from '../dto/diary.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DiaryLocation } from '../entities/diary.entity';

@ApiTags('diary')
@Controller('diary')
@ApiBearerAuth()
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new diary entry' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Diary entry created successfully', type: DiaryResponseDto })
  async create(@Request() req, @Body() createDiaryDto: CreateDiaryDto) {
    return this.diaryService.create(req.user.id, createDiaryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all diary entries for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all diary entries', type: [DiaryResponseDto] })
  async findAll(@Request() req) {
    return this.diaryService.findAll(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific diary entry by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the diary entry', type: DiaryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Diary entry not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.diaryService.findOne(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a diary entry' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Diary entry updated successfully', type: DiaryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Diary entry not found' })
  async update(@Request() req, @Param('id') id: string, @Body() updateDiaryDto: UpdateDiaryDto) {
    return this.diaryService.update(id, req.user.id, updateDiaryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a diary entry' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Diary entry deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Diary entry not found' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.diaryService.remove(id, req.user.id);
    return { message: 'Diary entry deleted successfully' };
  }

  @Post('locations/add')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a new diary location (admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Location added successfully' })
  async addLocation(@Request() req, @Body('name') name: string) {
    if (req.user.role !== 'admin') {
      return { message: 'Only admin users can add new locations' };
    }
    return this.diaryService.addDiaryLocation(name);
  }

  @Get('locations/list')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all available diary locations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all available locations' })
  async getLocations() {
    // Convert enum to array for frontend usage
    return Object.values(DiaryLocation);
  }
}