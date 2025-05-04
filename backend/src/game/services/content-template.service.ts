import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentTemplateRepository } from '../repositories/content-template.repository';
import { ContentTemplateEntity } from '../entities/content-template.entity';
import { SectionContentTypeEnum } from '../interfaces/content-types.interface';

interface ContentValidationRule {
  field: string;
  validations: Array<{
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'enum' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
  }>;
}

@Injectable()
export class ContentTemplateService {
  // Define validation rules for each content type
  private contentValidationRules: Map<SectionContentTypeEnum, ContentValidationRule[]> = new Map(
    Object.entries({
      [SectionContentTypeEnum.HEADING]: [
        {
          field: 'text',
          validations: [
            { type: 'required' as const, message: 'Heading text is required' },
            { type: 'maxLength' as const, value: 200, message: 'Heading text cannot exceed 200 characters' },
          ],
        },
        {
          field: 'level',
          validations: [
            { type: 'required' as const, message: 'Heading level is required' },
            { 
              type: 'enum' as const, 
              value: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], 
              message: 'Heading level must be one of: h1, h2, h3, h4, h5, h6' 
            },
          ],
        },
      ],
      [SectionContentTypeEnum.PARAGRAPH]: [
        {
          field: 'text',
          validations: [
            { type: 'required' as const, message: 'Paragraph text is required' },
          ],
        },
      ],
      [SectionContentTypeEnum.IMAGE]: [
        {
          field: 'assetId',
          validations: [
            { type: 'required' as const, message: 'Image asset ID is required' },
          ],
        },
        {
          field: 'caption',
          validations: [
            { type: 'maxLength' as const, value: 300, message: 'Image caption cannot exceed 300 characters' },
          ],
        },
      ],
      [SectionContentTypeEnum.VIDEO]: [
        {
          field: 'assetId',
          validations: [
            { type: 'required' as const, message: 'Video asset ID is required' },
          ],
        },
        {
          field: 'poster',
          validations: [
            { type: 'maxLength' as const, value: 500, message: 'Poster URL cannot exceed 500 characters' },
          ],
        },
      ],
      [SectionContentTypeEnum.QUIZ]: [
        {
          field: 'questions',
          validations: [
            { type: 'required' as const, message: 'Quiz questions are required' },
            { 
              type: 'custom' as const,
              message: 'Quiz must have at least one question',
              validator: (value) => Array.isArray(value) && value.length > 0,
            },
          ],
        },
      ],
      [SectionContentTypeEnum.INTERACTIVE]: [
        {
          field: 'type',
          validations: [
            { type: 'required' as const, message: 'Interactive element type is required' },
            { 
              type: 'enum' as const, 
              value: ['flashcard', 'dragdrop', 'hotspot', 'timeline', 'sortable'], 
              message: 'Interactive type must be one of the supported types' 
            },
          ],
        },
        {
          field: 'content',
          validations: [
            { type: 'required' as const, message: 'Interactive content is required' },
          ],
        },
      ],
    }).map(([key, value]) => [key as unknown as SectionContentTypeEnum, value as ContentValidationRule[]])
  );

  // Default templates for each content type
  private defaultTemplates: { [key: string]: any } = {
    [SectionContentTypeEnum.HEADING]: {
      text: 'New Section Title',
      level: 'h2',
    },
    [SectionContentTypeEnum.PARAGRAPH]: {
      text: 'Enter your content here. You can format text with **bold**, *italic*, or create [links](https://example.com).',
    },
    [SectionContentTypeEnum.IMAGE]: {
      assetId: '',
      caption: 'Image caption',
      altText: 'Descriptive alternative text',
      displayStyle: 'fullWidth', // fullWidth, centered, floating
    },
    [SectionContentTypeEnum.VIDEO]: {
      assetId: '',
      caption: 'Video caption',
      autoplay: false,
      controls: true,
      loop: false,
      muted: false,
    },
    [SectionContentTypeEnum.QUIZ]: {
      questions: [
        {
          text: 'Question text goes here?',
          type: 'single', // single, multiple, true-false
          options: [
            { text: 'Option 1', isCorrect: false },
            { text: 'Option 2', isCorrect: true },
            { text: 'Option 3', isCorrect: false },
          ],
          explanation: 'Explanation for the correct answer',
        }
      ],
      shuffleOptions: false,
      passingScore: 80,
    },
    [SectionContentTypeEnum.INTERACTIVE]: {
      type: 'flashcard',
      title: 'Interactive Element Title',
      instructions: 'Instructions for interacting with this element',
      content: {},
    },
  };

  constructor(private readonly templateRepository: ContentTemplateRepository) {
    // Initialize the system with default templates if needed
    this.ensureDefaultTemplates();
  }

  private async ensureDefaultTemplates(): Promise<void> {
    // For each content type, check if we have at least one default template
    for (const contentType of Object.values(SectionContentTypeEnum)) {
      const templates = await this.templateRepository.findByType(contentType);
      
      // If no templates exist for this type, create a default one
      if (templates.length === 0 && this.defaultTemplates[contentType]) {
        await this.templateRepository.create({
          name: `Default ${contentType} Template`,
          contentType,
          description: `System-generated default template for ${contentType}`,
          template: this.defaultTemplates[contentType],
          createdBy: 'system',
          isActive: true,
        });
      }
    }
  }

  async getTemplatesByType(contentType: string): Promise<ContentTemplateEntity[]> {
    return this.templateRepository.findByType(contentType);
  }

  async getAllTemplates(includeInactive: boolean = false): Promise<ContentTemplateEntity[]> {
    return this.templateRepository.findAll(!includeInactive);
  }

  async getDefaultTemplateForType(contentType: string): Promise<any> {
    // Try to get a user-created default template
    const templates = await this.templateRepository.findByType(contentType);
    if (templates.length > 0) {
      return templates[0].template;
    }
    
    // Fall back to system default if exists
    if (this.defaultTemplates[contentType]) {
      return this.defaultTemplates[contentType];
    }
    
    // No template found
    throw new NotFoundException(`No template found for content type: ${contentType}`);
  }

  async createTemplate(templateData: Partial<ContentTemplateEntity>): Promise<ContentTemplateEntity> {
    // Validate that the template matches the expected structure for the content type
    this.validateContentByType(templateData.contentType, templateData.template);
    
    return this.templateRepository.create(templateData);
  }

  async updateTemplate(
    id: string,
    templateData: Partial<ContentTemplateEntity>,
  ): Promise<ContentTemplateEntity> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // If updating the template content, validate it
    if (templateData.template) {
      const contentType = templateData.contentType || template.contentType;
      this.validateContentByType(contentType, templateData.template);
    }

    return this.templateRepository.update(id, templateData);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return this.templateRepository.delete(id);
  }

  async softDeleteTemplate(id: string): Promise<ContentTemplateEntity> {
    const template = await this.templateRepository.softDelete(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Validates content based on its type using predefined rules
   * @param contentType The type of content to validate
   * @param content The content data to validate
   * @throws BadRequestException if validation fails
   */
  validateContentByType(contentType: string, content: any): void {
    // Convert string to enum if needed
    const contentTypeEnum = contentType as SectionContentTypeEnum;
    
    // Get validation rules for this content type
    const rules = this.contentValidationRules.get(contentTypeEnum);
    if (!rules) {
      // No validation rules defined for this type - consider it valid
      return;
    }

    const errors: string[] = [];

    // Validate against each rule
    for (const rule of rules) {
      const { field, validations } = rule;
      const value = content[field];

      for (const validation of validations) {
        switch (validation.type) {
          case 'required':
            if (value === undefined || value === null || value === '') {
              errors.push(validation.message);
            }
            break;
          case 'minLength':
            if (value && typeof value === 'string' && value.length < validation.value) {
              errors.push(validation.message);
            }
            break;
          case 'maxLength':
            if (value && typeof value === 'string' && value.length > validation.value) {
              errors.push(validation.message);
            }
            break;
          case 'pattern':
            if (value && !new RegExp(validation.value).test(value)) {
              errors.push(validation.message);
            }
            break;
          case 'enum':
            if (value && !validation.value.includes(value)) {
              errors.push(validation.message);
            }
            break;
          case 'custom':
            if (validation.validator && !validation.validator(value)) {
              errors.push(validation.message);
            }
            break;
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Content validation failed',
        errors,
      });
    }
  }

  /**
   * Find a template by ID
   * @param id Template ID
   * @returns Promise with template entity
   */
  async findTemplateById(id: string): Promise<ContentTemplateEntity> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  /**
   * Create content from a template
   * @param templateId The template ID to use
   * @param overrides Values to override in the template
   */
  async createContentFromTemplate(
    templateId: string,
    overrides: Record<string, any> = {},
  ): Promise<any> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Merge template with overrides
    const content = { ...template.template, ...overrides };

    // Validate the resulting content
    this.validateContentByType(template.contentType, content);

    return content;
  }

  /**
   * Get the validation rules for a content type
   * @param contentType The content type to get rules for
   */
  getValidationRulesForType(contentType: string): ContentValidationRule[] {
    const contentTypeEnum = contentType as SectionContentTypeEnum;
    return this.contentValidationRules.get(contentTypeEnum) || [];
  }
}