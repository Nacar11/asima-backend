import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BaseRatingTemplateRepository } from '@/rating-templates/persistence/base-rating-template.repository';
import { RatingTemplateEntity } from '@/rating-templates/persistence/entities/rating-template.entity';
import { RatingTemplateMapper } from '@/rating-templates/persistence/mappers/rating-template.mapper';
import { RatingTemplate } from '@/rating-templates/domain/rating-template';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class RatingTemplateRepository implements BaseRatingTemplateRepository {
  constructor(
    @InjectRepository(RatingTemplateEntity)
    private readonly repository: Repository<RatingTemplateEntity>,
  ) {}

  async create(
    data: Omit<
      RatingTemplate,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<RatingTemplate> {
    const entity = this.repository.create(RatingTemplateMapper.toEntity(data));
    const saved = await this.repository.save(entity);
    return RatingTemplateMapper.toDomain(saved);
  }

  async findById(id: number): Promise<RatingTemplate | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? RatingTemplateMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<RatingTemplate | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? RatingTemplateMapper.toDomain(entity) : null;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<IPaginatedResult<RatingTemplate>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.isActive !== undefined) {
      whereClause.is_active = options.isActive;
    }

    const [entities, totalCount] = await this.repository.findAndCount({
      where: whereClause,
      order: { sequence_order: 'ASC', id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((e) => RatingTemplateMapper.toDomain(e)),
      totalResults: totalCount,
    };
  }

  async findAllActive(): Promise<RatingTemplate[]> {
    const entities = await this.repository.find({
      where: { is_active: true, deleted_at: IsNull() },
      order: { sequence_order: 'ASC', id: 'ASC' },
    });
    return entities.map((e) => RatingTemplateMapper.toDomain(e));
  }

  async update(
    id: number,
    data: Partial<RatingTemplate>,
  ): Promise<RatingTemplate | null> {
    await this.repository.update(id, RatingTemplateMapper.toEntity(data));
    return this.findById(id);
  }

  async softDelete(id: number, deletedBy?: number): Promise<void> {
    await this.repository.update(id, {
      deleted_by: deletedBy ?? null,
      deleted_at: new Date(),
    });
  }
}
