import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { BaseServiceCategoryRepository } from '@/service-categories/persistence/base-service-category.repository';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ServiceCategoryMapper } from '@/service-categories/persistence/mappers/service-category.mapper';
import { ServiceCategory } from '@/service-categories/domain/service-category';
import { QueryServiceCategoryDto } from '@/service-categories/dto/query-service-category.dto';

@Injectable()
export class ServiceCategoryRepository
  implements BaseServiceCategoryRepository
{
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private readonly repo: Repository<ServiceCategoryEntity>,
  ) {}

  async create(data: ServiceCategory): Promise<ServiceCategory> {
    const exists = await this.repo.findOne({ where: { code: data.code } });
    if (exists) {
      throw new ConflictException('Code already exists');
    }
    const saved = await this.repo.save(
      this.repo.create(ServiceCategoryMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['created_by', 'updated_by', 'deleted_by', 'parent'],
    });
    return ServiceCategoryMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceCategoryDto,
  ): Promise<{ data: ServiceCategory[]; totalCount: number }> {
    const skipNum = Number(query.skip);
    const takeNum = Number(query.take);
    const skip = Number.isFinite(skipNum) && skipNum >= 0 ? skipNum : 0;
    const take = Number.isFinite(takeNum) && takeNum > 0 ? takeNum : 20;

    const baseWhere: FindOptionsWhere<ServiceCategoryEntity> = {};

    if (query.parent_id !== undefined) {
      baseWhere.parent_id = query.parent_id;
    }
    if (query.is_active !== undefined) {
      baseWhere.is_active = query.is_active;
    }
    if (query.is_featured !== undefined) {
      baseWhere.is_featured = query.is_featured;
    }
    if (query.status !== undefined) {
      baseWhere.status = query.status;
    }
    if (query.name !== undefined) {
      baseWhere.name = ILike(`%${query.name}%`);
    }
    // Filter by creator (created_by user ID)
    if (query.createdBy !== undefined) {
      baseWhere.created_by = { id: query.createdBy };
    }

    const where: FindOptionsWhere<ServiceCategoryEntity>[] = [];
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      // Search creates OR conditions (name OR code), but still applies other filters
      where.push({ ...baseWhere, name: like });
      where.push({ ...baseWhere, code: like });
    } else {
      where.push(baseWhere);
    }

    // Build order clause
    const sortField = query.sortField || 'display_order';
    const sortBy = query.sortBy || 'ASC';
    const order: Record<string, 'ASC' | 'DESC'> = {};

    // Primary sort field
    order[sortField] = sortBy;

    // Secondary sorts for consistency
    // Add display_order as secondary sort (if not primary)
    if (sortField !== 'display_order') {
      order['display_order'] = 'ASC';
    }
    // Add name as tertiary sort (if not primary)
    if (sortField !== 'name') {
      order['name'] = 'ASC';
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order,
      relations: ['created_by', 'updated_by', 'deleted_by', 'parent'],
    });

    return {
      data: entities.map((e) => ServiceCategoryMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceCategory | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by', 'parent'],
    });
    return entity ? ServiceCategoryMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<ServiceCategory | null> {
    const entity = await this.repo.findOne({
      where: { code },
      relations: ['created_by', 'updated_by', 'deleted_by', 'parent'],
    });
    return entity ? ServiceCategoryMapper.toDomain(entity) : null;
  }

  async findFeatured(
    limit = 10,
  ): Promise<{ data: ServiceCategory[]; totalCount: number }> {
    const rows = await this.repo.find({
      where: { is_featured: true, deleted_at: IsNull() },
      order: { display_order: 'ASC', name: 'ASC' },
      take: limit,
      relations: ['parent'],
    });
    return {
      data: rows.map(ServiceCategoryMapper.toDomain),
      totalCount: rows.length,
    };
  }

  async lookup(
    search?: string,
    take = 20,
    skip = 0,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    const qb = this.repo
      .createQueryBuilder('c')
      .select(['c.id AS id', 'c.code AS code', 'c.name AS name'])
      .where('c.deleted_at IS NULL');

    if (search) {
      qb.andWhere(
        '(LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)',
        {
          search: `%${search.toLowerCase()}%`,
        },
      );
    }

    qb.orderBy('c.display_order', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .offset(skip)
      .limit(take);

    const [rows, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);

    return {
      data: rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
      })),
      totalCount: total,
    };
  }

  async update(
    id: number,
    payload: Partial<ServiceCategory>,
  ): Promise<ServiceCategory> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service category not found');

    if (payload.code && payload.code !== existing.code) {
      const dup = await this.repo.findOne({ where: { code: payload.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException('Code already exists');
      }
    }

    const updated = await this.repo.save(
      this.repo.create(
        ServiceCategoryMapper.toPersistence({
          ...ServiceCategoryMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['created_by', 'updated_by', 'deleted_by', 'parent'],
    });
    return ServiceCategoryMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service category not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      is_active: false,
      status: 'Inactive',
    });
  }
}
