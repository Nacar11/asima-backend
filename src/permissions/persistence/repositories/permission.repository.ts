import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BasePermissionRepository } from '@/permissions/persistence/base-permission.repository';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';
import { PermissionMapper } from '@/permissions/persistence/mappers/permission.mapper';
import { Permission } from '@/permissions/domain/permission';
import { PermissionSearchCriteria } from '@/permissions/domain/permission-search-criteria';
import { FindAllPermission } from '@/permissions/domain/find-all-permission';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';

@Injectable()
export class PermissionRepository extends BasePermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repo: Repository<PermissionEntity>,
  ) {
    super();
  }

  async findAll(criteria: PermissionSearchCriteria): Promise<FindAllPermission> {
    const paging = resolvePaging(criteria);

    const qb = this.repo.createQueryBuilder('p');
    if (criteria.search) {
      qb.andWhere('(p.code ILIKE :s OR p.description ILIKE :s)', {
        s: `%${criteria.search}%`,
      });
    }
    if (criteria.resource) qb.andWhere('p.resource = :r', { r: criteria.resource });
    if (criteria.action) qb.andWhere('p.action = :a', { a: criteria.action });

    qb.orderBy('p.resource', 'ASC').addOrderBy('p.action', 'ASC');
    qb.skip(paging.skip).take(paging.limit);

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(PermissionMapper.toDomain), total, paging);
  }

  async findById(id: number): Promise<Permission | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Permission | null> {
    const entity = await this.repo.findOne({ where: { code } });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<Permission[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({ where: { id: In(ids) } });
    return entities.map(PermissionMapper.toDomain);
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    if (codes.length === 0) return [];
    const entities = await this.repo.find({ where: { code: In(codes) } });
    return entities.map(PermissionMapper.toDomain);
  }

  async upsertByCode(input: {
    code: string;
    resource: string;
    action: string;
    description: string | null;
  }): Promise<Permission> {
    const existing = await this.repo.findOne({ where: { code: input.code } });
    if (existing) {
      existing.resource = input.resource;
      existing.action = input.action;
      existing.description = input.description;
      const saved = await this.repo.save(existing);
      return PermissionMapper.toDomain(saved);
    }
    const entity = this.repo.create(input);
    const saved = await this.repo.save(entity);
    return PermissionMapper.toDomain(saved);
  }

  async update(id: number, patch: Partial<Permission>): Promise<Permission> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    if (patch.description !== undefined) existing.description = patch.description;
    const saved = await this.repo.save(existing);
    return PermissionMapper.toDomain(saved);
  }
}
