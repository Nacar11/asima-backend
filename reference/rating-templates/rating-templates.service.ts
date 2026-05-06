import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BaseRatingTemplateRepository } from '@/rating-templates/persistence/base-rating-template.repository';
import { RatingTemplate } from '@/rating-templates/domain/rating-template';
import { CreateRatingTemplateDto } from '@/rating-templates/dto/create-rating-template.dto';
import { UpdateRatingTemplateDto } from '@/rating-templates/dto/update-rating-template.dto';
import { QueryRatingTemplateDto } from '@/rating-templates/dto/query-rating-template.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Service for managing Rating Templates.
 *
 * Provides business logic for admin-defined rating criteria.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class RatingTemplatesService {
  constructor(
    private readonly ratingTemplateRepository: BaseRatingTemplateRepository,
  ) {}

  /**
   * Create a new rating template.
   *
   * @param input - Template data
   * @param user - Current authenticated user
   * @returns Created template
   */
  async create(
    input: CreateRatingTemplateDto,
    user: User,
  ): Promise<RatingTemplate> {
    // Check for duplicate code
    const existing = await this.ratingTemplateRepository.findByCode(input.code);
    if (existing) {
      throw new ConflictException(
        `Rating template with code '${input.code}' already exists`,
      );
    }

    return this.ratingTemplateRepository.create({
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      rating_type: input.rating_type,
      min_value: input.min_value ?? 1,
      max_value: input.max_value ?? 5,
      is_required: input.is_required ?? true,
      sequence_order: input.sequence_order ?? 0,
      is_active: input.is_active ?? true,
      status: 'Active',
      created_by: user.id,
      updated_by: user.id,
    });
  }

  /**
   * Find all rating templates with pagination.
   *
   * @param query - Query parameters
   * @returns Paginated list of templates
   */
  async findAll(
    query: QueryRatingTemplateDto,
  ): Promise<IPaginatedResult<RatingTemplate>> {
    return this.ratingTemplateRepository.findAll({
      page: query.page,
      limit: query.limit,
      isActive: query.is_active,
    });
  }

  /**
   * Find all active rating templates.
   *
   * @returns List of active templates
   */
  async findAllActive(): Promise<RatingTemplate[]> {
    return this.ratingTemplateRepository.findAllActive();
  }

  /**
   * Find a rating template by ID.
   *
   * @param id - Template ID
   * @returns Template or throws NotFoundException
   */
  async findById(id: number): Promise<RatingTemplate> {
    const template = await this.ratingTemplateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Rating template with ID ${id} not found`);
    }
    return template;
  }

  /**
   * Find a rating template by code.
   *
   * @param code - Template code
   * @returns Template or null
   */
  async findByCode(code: string): Promise<RatingTemplate | null> {
    return this.ratingTemplateRepository.findByCode(code);
  }

  /**
   * Update a rating template.
   *
   * @param id - Template ID
   * @param input - Update data
   * @param user - Current authenticated user
   * @returns Updated template
   */
  async update(
    id: number,
    input: UpdateRatingTemplateDto,
    user: User,
  ): Promise<RatingTemplate> {
    const existing = await this.findById(id);

    // Check for duplicate code if code is being changed
    if (input.code && input.code !== existing.code) {
      const duplicate = await this.ratingTemplateRepository.findByCode(
        input.code,
      );
      if (duplicate) {
        throw new ConflictException(
          `Rating template with code '${input.code}' already exists`,
        );
      }
    }

    const updated = await this.ratingTemplateRepository.update(id, {
      ...input,
      updated_by: user.id,
    });

    if (!updated) {
      throw new NotFoundException(`Rating template with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft delete a rating template.
   *
   * @param id - Template ID
   * @param user - Current authenticated user
   */
  async remove(id: number, user: User): Promise<void> {
    await this.findById(id); // Verify it exists
    await this.ratingTemplateRepository.softDelete(id, user.id);
  }
}
