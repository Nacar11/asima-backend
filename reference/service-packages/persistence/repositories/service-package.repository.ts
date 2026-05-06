import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BaseServicePackageRepository } from '@/service-packages/persistence/base-service-package.repository';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { ServicePackageMapper } from '@/service-packages/persistence/mappers/service-package.mapper';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { QueryServicePackageDto } from '@/service-packages/dto/query-service-package.dto';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';

@Injectable()
export class ServicePackageRepository implements BaseServicePackageRepository {
  constructor(
    @InjectRepository(ServicePackageEntity)
    private readonly repo: Repository<ServicePackageEntity>,
  ) {}

  async create(data: ServicePackage): Promise<ServicePackage> {
    const saved = await this.repo.save(
      this.repo.create(ServicePackageMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return ServicePackageMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServicePackageDto,
  ): Promise<{ data: ServicePackage[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<ServicePackageEntity>[] = [];
    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.push({ name: like });
    }
    if (query.service_id !== undefined)
      where.push({ service_id: query.service_id });
    if (query.status !== undefined) where.push({ status: query.status });
    if (query.is_popular !== undefined)
      where.push({ is_popular: query.is_popular });
    if (where.length === 0) where.push({});

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
    // Add created_at as tertiary sort (if not primary)
    if (sortField !== 'created_at') {
      order['created_at'] = 'DESC';
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order,
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });

    return {
      data: entities.map((e) => ServicePackageMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServicePackage | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return entity ? ServicePackageMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServicePackage>,
  ): Promise<ServicePackage> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Package not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServicePackageMapper.toPersistence({
          ...ServicePackageMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['service', 'created_by', 'updated_by', 'deleted_by'],
    });
    return ServicePackageMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Service Package not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: ServicePackageStatusEnum.INACTIVE,
    });
  }
}
