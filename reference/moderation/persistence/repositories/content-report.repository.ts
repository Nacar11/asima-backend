import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseContentReportRepository } from '../base-content-report.repository';
import { ContentReportEntity } from '../entities/content-report.entity';
import { ContentReport } from '@/moderation/domain/content-report';
import { ContentReportMapper } from '../mappers/content-report.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ReportStatusEnum } from '@/moderation/enums/report-status.enum';

/**
 * Concrete implementation of content report repository.
 *
 * Handles database operations for content reports using TypeORM.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class ContentReportRepository extends BaseContentReportRepository {
  constructor(
    @InjectRepository(ContentReportEntity)
    private readonly repository: Repository<ContentReportEntity>,
  ) {
    super();
  }

  async create(
    report: Omit<ContentReport, 'id' | 'created_at' | 'reporter'>,
  ): Promise<ContentReport> {
    const persistenceEntity = ContentReportMapper.toPersistence(
      report as ContentReport,
    );
    const savedEntity = await this.repository.save(persistenceEntity);

    return this.findById(savedEntity.id) as Promise<ContentReport>;
  }

  async findById(id: number): Promise<NullableType<ContentReport>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['reporter'],
    });

    if (!entity) {
      return null;
    }

    return ContentReportMapper.toDomain(entity);
  }

  async findAll(options: {
    filterQuery?: {
      status?: ReportStatusEnum;
      contentType?: ContentTypeEnum;
      contentId?: number;
    };
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<ContentReport>> {
    const { paginationOptions, filterQuery } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('content_report')
      .leftJoinAndSelect('content_report.reporter', 'reporter');

    if (filterQuery?.status) {
      queryBuilder.andWhere('content_report.status = :status', {
        status: filterQuery.status,
      });
    }

    if (filterQuery?.contentType) {
      queryBuilder.andWhere('content_report.content_type = :contentType', {
        contentType: filterQuery.contentType,
      });
    }

    if (filterQuery?.contentId) {
      queryBuilder.andWhere('content_report.content_id = :contentId', {
        contentId: filterQuery.contentId,
      });
    }

    queryBuilder
      .orderBy('content_report.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      data: entities.map((entity) => ContentReportMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async update(
    id: number,
    payload: Partial<ContentReport>,
  ): Promise<ContentReport> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Content report with ID ${id} not found`);
    }

    const persistencePayload = ContentReportMapper.toPersistence(
      payload as ContentReport,
    );
    Object.assign(entity, persistencePayload);

    const updatedEntity = await this.repository.save(entity);

    return this.findById(updatedEntity.id) as Promise<ContentReport>;
  }
}
