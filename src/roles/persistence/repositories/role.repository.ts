import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { RoleMapper } from '@/roles/persistence/mappers/role.mapper';
import { Role } from '@/roles/domain/role';
import { RoleSearchCriteria } from '@/roles/domain/role-search-criteria';
import { FindAllRole } from '@/roles/domain/find-all-role';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';

@Injectable()
export class RoleRepository extends BaseRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
  ) {
    super();
  }

  async findAll(criteria: RoleSearchCriteria): Promise<FindAllRole> {
    const paging = resolvePaging(criteria);

    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.permissions', 'p')
      .orderBy('r.name', 'ASC')
      .skip(paging.skip)
      .take(paging.limit);

    if (!criteria.includeDeleted) qb.andWhere('r.deleted_at IS NULL');
    if (criteria.search) qb.andWhere('r.name ILIKE :s', { s: `%${criteria.search}%` });

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(RoleMapper.toDomain), total, paging);
  }

  async findById(id: number): Promise<Role | null> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['permissions'] });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const entity = await this.repo.findOne({ where: { name }, relations: ['permissions'] });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async create(input: {
    name: string;
    description?: string | null;
    permission_ids: number[];
    created_by?: number | null;
  }): Promise<Role> {
    const permissions = await this.loadPermissions(input.permission_ids);
    const entity = this.repo.create({
      name: input.name,
      description: input.description ?? null,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
      permissions,
    });
    const saved = await this.repo.save(entity);
    return this.requireById(saved.id);
  }

  async update(
    id: number,
    patch: { name?: string; description?: string | null; updated_by?: number | null },
  ): Promise<Role> {
    const existing = await this.repo.findOneOrFail({
      where: { id },
      relations: ['permissions'],
    });
    if (patch.name !== undefined) existing.name = patch.name;
    if (patch.description !== undefined) existing.description = patch.description;
    if (patch.updated_by !== undefined) existing.updated_by = patch.updated_by;
    const saved = await this.repo.save(existing);
    return RoleMapper.toDomain(saved);
  }

  async setPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    const existing = await this.repo.findOneOrFail({
      where: { id: roleId },
      relations: ['permissions'],
    });
    existing.permissions = await this.loadPermissions(permissionIds);
    await this.repo.save(existing);
    return this.requireById(roleId);
  }

  async softDelete(id: number, deletedBy: number | null): Promise<void> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    existing.deleted_by = deletedBy;
    await this.repo.save(existing);
    await this.repo.softDelete(id);
  }

  private async loadPermissions(ids: number[]): Promise<PermissionEntity[]> {
    if (ids.length === 0) return [];
    const found = await this.permissionRepo.find({ where: { id: In(ids) } });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((i) => !foundIds.has(i));
      throw new Error(`Unknown permission ids: ${missing.join(', ')}`);
    }
    return found;
  }

  private async requireById(id: number): Promise<Role> {
    const entity = await this.repo.findOneOrFail({
      where: { id },
      relations: ['permissions'],
    });
    return RoleMapper.toDomain(entity);
  }
}
