import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSection } from '../entities/game-section.entity';
import { GameModule } from '../entities/game-module.entity';
import { SectionCheckpointService } from './section-checkpoint.service';
import { GameSectionsService } from './game-sections.service';
import { GameSectionDto, SectionWithContentDto, NavigationResultDto, SectionType } from '../dto/section.dto';

@Injectable()
export class SectionNavigationService {
  constructor(
    @InjectRepository(GameSection)
    private readonly sectionRepository: Repository<GameSection>,
    @InjectRepository(GameModule)
    private readonly moduleRepository: Repository<GameModule>,
    private readonly checkpointService: SectionCheckpointService,
    private readonly sectionService: GameSectionsService
  ) {}

  /**
   * Navigate to a specific section with validation
   * @param userId User ID
   * @param sectionId Section ID to navigate to
   * @returns Section with content if navigation is allowed
   */
  async navigateToSection(
    userId: string,
    sectionId: string
  ): Promise<SectionWithContentDto> {
    // Verify section exists
    const section = await this.sectionRepository.findOne({ 
      where: { id: sectionId },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // If this is the first section in the module, allow access
    const isFirstSection = await this.isFirstSectionInModule(sectionId, section.moduleId);
    
    if (!isFirstSection) {
      // Get previous section
      const previousSection = await this.sectionRepository.findOne({
        where: {
          moduleId: section.moduleId,
          orderIndex: section.orderIndex - 1,
          isActive: true
        }
      });
      
      if (previousSection) {
        // Check if previous section is completed
        const isCompleted = await this.checkpointService.isSectionCompleted(
          userId, 
          previousSection.id
        );
        
        if (!isCompleted) {
          throw new ForbiddenException(
            `Cannot access section ${sectionId}: previous section ${previousSection.id} is not completed`
          );
        }
      }
    }
    
    // If we get here, navigation is allowed, get section with content
    return this.sectionService.findWithContent(sectionId);
  }

  /**
   * Get navigation info for sections in a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Array of sections with navigation status
   */
  async getModuleNavigationInfo(
    userId: string,
    moduleId: string
  ): Promise<NavigationResultDto> {
    // Verify module exists
    const module = await this.moduleRepository.findOne({ 
      where: { id: moduleId } 
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Get all sections in the module
    const sections = await this.sectionRepository.find({
      where: { 
        moduleId: moduleId,
        isActive: true
      },
      order: { orderIndex: 'ASC' }
    });
    
    if (sections.length === 0) {
      return {
        moduleId,
        moduleTitle: module.title,
        sections: [],
        currentSectionId: null,
        nextSectionId: null,
        previousSectionId: null
      };
    }
    
    // Process sections to determine navigation status
    const navigationInfo = await Promise.all(sections.map(async (section) => {
      const checkpointStatus = await this.checkpointService.getSectionCompletionStatus(
        userId, 
        section.id
      );
      
      let accessStatus: 'accessible' | 'locked' | 'completed' = 'locked';
      
      if (checkpointStatus.isCompleted) {
        accessStatus = 'completed';
      } else {
        // Check if this section is accessible
        const isFirstSection = section.orderIndex === 0;
        
        if (isFirstSection) {
          accessStatus = 'accessible';
        } else {
          // Check if previous section is completed
          const previousSection = sections.find(s => s.orderIndex === section.orderIndex - 1);
          
          if (previousSection) {
            const prevCompleted = await this.checkpointService.isSectionCompleted(
              userId, 
              previousSection.id
            );
            
            if (prevCompleted) {
              accessStatus = 'accessible';
            }
          }
        }
      }
      
      return {
        id: section.id,
        title: section.title,
        orderIndex: section.orderIndex,
        sectionType: section.sectionType as SectionType,
        accessStatus,
        completionPercentage: checkpointStatus.completionPercentage
      };
    }));
    
    // Find current section (first accessible non-completed section)
    const currentSection = navigationInfo.find(
      section => section.accessStatus === 'accessible'
    ) || navigationInfo[0];
    
    // Get previous and next section IDs
    const currentIndex = navigationInfo.findIndex(
      section => section.id === currentSection.id
    );
    
    const previousSectionId = currentIndex > 0 ? 
      navigationInfo[currentIndex - 1].id : null;
    
    const nextSectionId = currentIndex < navigationInfo.length - 1 ? 
      navigationInfo[currentIndex + 1].id : null;
    
    return {
      moduleId,
      moduleTitle: module.title,
      sections: navigationInfo,
      currentSectionId: currentSection.id,
      nextSectionId,
      previousSectionId
    };
  }

  /**
   * Navigate to the next section
   * @param userId User ID
   * @param currentSectionId Current section ID
   * @returns Next section with content if navigation is allowed
   */
  async navigateToNextSection(
    userId: string,
    currentSectionId: string
  ): Promise<SectionWithContentDto> {
    // Verify current section exists
    const currentSection = await this.sectionRepository.findOne({ 
      where: { id: currentSectionId } 
    });
    
    if (!currentSection) {
      throw new NotFoundException(`Game section with ID ${currentSectionId} not found`);
    }
    
    // Check if user can proceed to next section
    const navigationCheck = await this.checkpointService.canProceedToNextSection(
      userId, 
      currentSectionId
    );
    
    if (!navigationCheck.canProceed) {
      throw new ForbiddenException(
        `Cannot navigate to next section: ${navigationCheck.reason}`
      );
    }
    
    if (!navigationCheck.nextSectionId) {
      throw new NotFoundException('There is no next section in this module');
    }
    
    // If we get here, navigation is allowed
    return this.sectionService.findWithContent(navigationCheck.nextSectionId);
  }

  /**
   * Navigate to the previous section
   * @param userId User ID
   * @param currentSectionId Current section ID
   * @returns Previous section with content
   */
  async navigateToPreviousSection(
    userId: string,
    currentSectionId: string
  ): Promise<SectionWithContentDto> {
    // Verify current section exists
    const currentSection = await this.sectionRepository.findOne({ 
      where: { id: currentSectionId } 
    });
    
    if (!currentSection) {
      throw new NotFoundException(`Game section with ID ${currentSectionId} not found`);
    }
    
    // Get previous section
    const previousSection = await this.sectionRepository.findOne({
      where: {
        moduleId: currentSection.moduleId,
        orderIndex: currentSection.orderIndex - 1,
        isActive: true
      }
    });
    
    if (!previousSection) {
      throw new NotFoundException('There is no previous section in this module');
    }
    
    // Always allow navigation to previous sections
    return this.sectionService.findWithContent(previousSection.id);
  }

  /**
   * Check if a section is the first in its module
   * @param sectionId Section ID
   * @param moduleId Module ID
   * @returns Boolean indicating if section is first
   * @private
   */
  private async isFirstSectionInModule(sectionId: string, moduleId: string): Promise<boolean> {
    const firstSection = await this.sectionRepository.findOne({
      where: { 
        moduleId: moduleId,
        isActive: true
      },
      order: { orderIndex: 'ASC' }
    });
    
    return firstSection?.id === sectionId;
  }
}