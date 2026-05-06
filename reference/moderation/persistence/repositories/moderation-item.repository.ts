import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseModerationItemRepository } from '../base-moderation-item.repository';
import { ModerationItemEntity } from '../entities/moderation-item.entity';
import { ModerationItem } from '@/moderation/domain/moderation-item';
import { ModerationItemMapper } from '../mappers/moderation-item.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';

/**
 * Concrete implementation of moderation item repository.
 *
 * Handles database operations for moderation items using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ModerationItemRepository extends BaseModerationItemRepository {
  constructor(
    @InjectRepository(ModerationItemEntity)
    private readonly repository: Repository<ModerationItemEntity>,
  ) {
    super();
  }

  async create(
    item: Omit<
      ModerationItem,
      'id' | 'created_at' | 'updated_at' | 'reporter' | 'reviewer'
    >,
  ): Promise<ModerationItem> {
    const persistenceEntity = ModerationItemMapper.toPersistence(
      item as ModerationItem,
    );
    const savedEntity = await this.repository.save(persistenceEntity);

    return this.findById(savedEntity.id) as Promise<ModerationItem>;
  }

  async findById(id: number): Promise<NullableType<ModerationItem>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['reporter', 'reviewer'],
    });

    if (!entity) {
      return null;
    }

    return ModerationItemMapper.toDomain(entity);
  }

  async findByContent(
    contentType: ContentTypeEnum,
    contentId: number,
  ): Promise<ModerationItem[]> {
    const entities = await this.repository.find({
      where: {
        content_type: contentType,
        content_id: contentId,
      },
      relations: ['reporter', 'reviewer'],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => ModerationItemMapper.toDomain(entity));
  }

  async findAll(options: {
    filterQuery?: {
      status?: ModerationStatusEnum;
      contentType?: ContentTypeEnum;
      priority?: ModerationPriorityEnum;
      reportedReason?: string;
      reporterName?: string;
    };
    paginationOptions: IPaginationOptions;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<IPaginatedResult<ModerationItem>> {
    const { paginationOptions, filterQuery } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('moderation_item')
      .leftJoinAndSelect('moderation_item.reporter', 'reporter')
      .leftJoinAndSelect('moderation_item.reviewer', 'reviewer');

    if (filterQuery?.status) {
      queryBuilder.andWhere('moderation_item.status = :status', {
        status: filterQuery.status,
      });
    }

    if (filterQuery?.contentType) {
      queryBuilder.andWhere('moderation_item.content_type = :contentType', {
        contentType: filterQuery.contentType,
      });
    }

    if (filterQuery?.priority) {
      queryBuilder.andWhere('moderation_item.priority = :priority', {
        priority: filterQuery.priority,
      });
    }

    if (filterQuery?.reportedReason) {
      queryBuilder.andWhere(
        'moderation_item.reported_reason ILIKE :reportedReason',
        {
          reportedReason: `%${filterQuery.reportedReason}%`,
        },
      );
    }

    if (filterQuery?.reporterName) {
      queryBuilder.andWhere(
        "(reporter.first_name ILIKE :reporterName OR reporter.last_name ILIKE :reporterName OR CONCAT(reporter.first_name, ' ', reporter.last_name) ILIKE :reporterName)",
        {
          reporterName: `%${filterQuery.reporterName}%`,
        },
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'priority';
    const sortOrder = options.sortOrder || 'DESC';

    // Map sort_by to actual column name
    const sortColumnMap: Record<string, string> = {
      created_at: 'moderation_item.created_at',
      updated_at: 'moderation_item.updated_at',
      priority: 'moderation_item.priority',
      status: 'moderation_item.status',
      content_type: 'moderation_item.content_type',
      reported_by: 'moderation_item.reported_by',
      reported_reason: 'moderation_item.reported_reason',
    };

    const sortColumn = sortColumnMap[sortBy] || 'moderation_item.priority';

    queryBuilder.orderBy(sortColumn, sortOrder);

    // Add secondary sort by created_at if not already sorting by it
    if (sortBy !== 'created_at') {
      queryBuilder.addOrderBy('moderation_item.created_at', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) => ModerationItemMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async update(
    id: number,
    payload: Partial<ModerationItem>,
  ): Promise<ModerationItem> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Moderation item with ID ${id} not found`);
    }

    const persistencePayload = ModerationItemMapper.toPersistence(
      payload as ModerationItem,
    );
    Object.assign(entity, persistencePayload);

    const updatedEntity = await this.repository.save(entity);

    return this.findById(updatedEntity.id) as Promise<ModerationItem>;
  }
}
