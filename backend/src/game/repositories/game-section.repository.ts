import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, LessThan, MoreThan } from 'typeorm';
import { GameSection } from '../entities/game-section.entity';
import { CreateGameSectionDto, UpdateGameSectionDto, SectionType } from '../dto/section.dto';

@Injectable()
export class GameSectionRepository {
  constructor(
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>,
  ) {}

  /**
   * Find a game section by ID
   */
  async findOne(id: string): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: { id },
      relations: ['module'],
    });
  }

  /**
   * Find sections by module ID
   */
  async findByModuleId(
    moduleId: string,
    options?: {
      isActive?: boolean;
      sectionType?: SectionType;
      skip?: number;
      take?: number;
    },
  ): Promise<[GameSection[], number]> {
    const where: FindOptionsWhere<GameSection> = { moduleId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.sectionType) {
      where.sectionType = options.sectionType;
    }

    return this.gameSectionRepository.findAndCount({
      where,
      order: { orderIndex: 'ASC' },
      skip: options?.skip,
      take: options?.take,
      relations: ['module'],
    });
  }

  /**
   * Find all game sections
   */
  async findAll(options?: {
    isActive?: boolean;
    sectionType?: SectionType;
    skip?: number;
    take?: number;
  }): Promise<[GameSection[], number]> {
    const where: FindOptionsWhere<GameSection> = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.sectionType) {
      where.sectionType = options.sectionType;
    }

    return this.gameSectionRepository.findAndCount({
      where,
      order: {
        moduleId: 'ASC',
        orderIndex: 'ASC',
      },
      skip: options?.skip,
      take: options?.take,
      relations: ['module'],
    });
  }

  /**
   * Create a new game section
   */
  async create(createGameSectionDto: CreateGameSectionDto): Promise<GameSection> {
    const section = this.gameSectionRepository.create(createGameSectionDto);
    return this.gameSectionRepository.save(section);
  }

  /**
   * Update an existing game section
   */
  async update(
    id: string,
    updateGameSectionDto: UpdateGameSectionDto,
  ): Promise<GameSection> {
    await this.gameSectionRepository.update(id, updateGameSectionDto);
    return this.findOne(id);
  }

  /**
   * Delete a game section
   */
  async remove(id: string): Promise<void> {
    await this.gameSectionRepository.delete(id);
  }

  /**
   * Find next section in a module (by order index)
   */
  async findNextInModule(
    moduleId: string,
    currentOrderIndex: number,
  ): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: {
        moduleId,
        orderIndex: MoreThan(currentOrderIndex),
        isActive: true,
      },
      order: { orderIndex: 'ASC' },
      relations: ['module'],
    });
  }

  /**
   * Find previous section in a module (by order index)
   */
  async findPreviousInModule(
    moduleId: string,
    currentOrderIndex: number,
  ): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: {
        moduleId,
        orderIndex: LessThan(currentOrderIndex),
        isActive: true,
      },
      order: { orderIndex: 'DESC' },
      relations: ['module'],
    });
  }

  /**
   * Find first section in a module
   */
  async findFirstInModule(moduleId: string): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: {
        moduleId,
        isActive: true,
      },
      order: { orderIndex: 'ASC' },
      relations: ['module'],
    });
  }

  /**
   * Count sections in a module
   */
  async countByModuleId(moduleId: string, onlyActive = true): Promise<number> {
    const where: FindOptionsWhere<GameSection> = { moduleId };
    
    if (onlyActive) {
      where.isActive = true;
    }
    
    return this.gameSectionRepository.count({
      where,
    });
  }

  /**
   * Find sections by IDs
   */
  async findByIds(ids: string[]): Promise<GameSection[]> {
    return this.gameSectionRepository.find({
      where: { id: In(ids) },
      relations: ['module'],
    });
  }

  /**
   * Check if a section exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.gameSectionRepository.count({
      where: { id },
    });
    return count > 0;
  }
  
  /**
   * Find sections by type
   */
  async findByType(sectionType: SectionType): Promise<GameSection[]> {
    return this.gameSectionRepository.find({
      where: {
        sectionType,
        isActive: true,
      },
      relations: ['module'],
    });
  }
  
  /**
   * Find all quiz sections
   */
  async findQuizSections(): Promise<GameSection[]> {
    return this.findByType(SectionType.QUIZ);
  }
}