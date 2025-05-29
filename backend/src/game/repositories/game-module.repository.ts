import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, MoreThan, LessThan } from 'typeorm';
import { GameModule } from '../entities/game-module.entity';
import { CreateGameModuleDto, UpdateGameModuleDto } from '../dto/module.dto';

@Injectable()
export class GameModuleRepository {
  constructor(
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>,
  ) {}

  /**
   * Find a game module by ID or options
   */
  async findOne(idOrOptions: string | object): Promise<GameModule | null> {
    if (typeof idOrOptions === 'string') {
      return this.gameModuleRepository.findOne({
        where: { id: idOrOptions },
      });
    }
    return this.gameModuleRepository.findOne(idOrOptions as any);
  }

  /**
   * Find all game modules
   */
  async findAll(options?: {
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<[GameModule[], number]> {
    const where: FindOptionsWhere<GameModule> = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return this.gameModuleRepository.findAndCount({
      where,
      order: { orderIndex: 'ASC' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Create a new game module
   */
  async create(createGameModuleDto: CreateGameModuleDto): Promise<GameModule> {
    const module = this.gameModuleRepository.create(createGameModuleDto);
    return this.gameModuleRepository.save(module);
  }

  /**
   * Update an existing game module
   */
  async update(
    id: string,
    updateGameModuleDto: UpdateGameModuleDto,
  ): Promise<GameModule> {
    await this.gameModuleRepository.update(id, updateGameModuleDto);
    return this.findOne(id);
  }

  /**
   * Delete a game module
   */
  async remove(id: string): Promise<void> {
    await this.gameModuleRepository.delete(id);
  }

  /**
   * Find next module in sequence (by order index)
   */
  async findNextInSequence(currentModuleId: string): Promise<GameModule | null> {
    const currentModule = await this.findOne(currentModuleId);
    if (!currentModule) return null;

    return this.gameModuleRepository.findOne({
      where: {
        orderIndex: MoreThan(currentModule.orderIndex),
        isActive: true,
      },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Find previous module in sequence (by order index)
   */
  async findPreviousInSequence(currentModuleId: string): Promise<GameModule | null> {
    const currentModule = await this.findOne(currentModuleId);
    if (!currentModule) return null;

    return this.gameModuleRepository.findOne({
      where: {
        orderIndex: LessThan(currentModule.orderIndex),
        isActive: true,
      },
      order: { orderIndex: 'DESC' },
    });
  }

  /**
   * Find first module in sequence
   */
  async findFirst(): Promise<GameModule | null> {
    return this.gameModuleRepository.findOne({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Find modules by IDs
   */
  async findByIds(ids: string[]): Promise<GameModule[]> {
    return this.gameModuleRepository.find({
      where: { id: In(ids) },
    });
  }

  /**
   * Check if a module exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.gameModuleRepository.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Count total number of active modules
   */
  async countActive(): Promise<number> {
    return this.gameModuleRepository.count({
      where: { isActive: true },
    });
  }
  
  /**
   * Find modules that have rewards
   */
  async findWithRewards(): Promise<GameModule[]> {
    return this.gameModuleRepository.find({
      where: {
        rewardAmount: MoreThan(0),
        isActive: true,
      },
    });
  }
}