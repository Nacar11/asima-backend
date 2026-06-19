import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseUserRepository, UserWithCredentials } from '@/users/persistence/base-user.repository';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';
import { UserSearchCriteria } from '@/users/domain/user-search-criteria';
import { FindAllUser } from '@/users/domain/find-all-user';
import { CreateUserPersistence, UpdateUserPatch } from '@/users/domain/user-inputs';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';

@Injectable()
export class UserRepository extends BaseUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {
    super();
  }

  async findAll(criteria: UserSearchCriteria): Promise<FindAllUser> {
    const paging = resolvePaging(criteria);

    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect('r.permissions', 'p')
      .orderBy('u.created_at', 'DESC')
      .skip(paging.skip)
      .take(paging.limit);

    if (!criteria.includeDeleted) qb.andWhere('u.deleted_at IS NULL');
    if (criteria.search) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.title ILIKE :s)',
        { s: `%${criteria.search}%` },
      );
    }
    if (criteria.email) qb.andWhere('LOWER(u.email) = LOWER(:e)', { e: criteria.email });
    if (criteria.role_id !== undefined) qb.andWhere('u.role_id = :rid', { rid: criteria.role_id });
    if (criteria.is_active !== undefined)
      qb.andWhere('u.is_active = :a', { a: criteria.is_active });

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(UserMapper.toDomain), total, paging);
  }

  async findById(id: number): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.find({
      where: { id: In(ids) },
      relations: ['role', 'role.permissions'],
    });
    return entities.map(UserMapper.toDomain);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect('r.permissions', 'p')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .andWhere('u.deleted_at IS NULL')
      .getOne();
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmailWithCredentials(email: string): Promise<UserWithCredentials | null> {
    const entity = await this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect('r.permissions', 'p')
      .addSelect('u.password_hash')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .andWhere('u.deleted_at IS NULL')
      .getOne();

    if (!entity) return null;
    const password_hash = entity.password_hash;
    const user = UserMapper.toDomain(entity);
    return { user, password_hash };
  }

  async findByIdWithCredentials(id: number): Promise<UserWithCredentials | null> {
    const entity = await this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect('r.permissions', 'p')
      .addSelect('u.password_hash')
      .where('u.id = :id', { id })
      .andWhere('u.deleted_at IS NULL')
      .getOne();

    if (!entity) return null;
    const password_hash = entity.password_hash;
    const user = UserMapper.toDomain(entity);
    return { user, password_hash };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .andWhere('u.deleted_at IS NULL')
      .getCount();
    return count > 0;
  }

  async create(input: CreateUserPersistence): Promise<User> {
    const entity = this.repo.create({
      email: input.email.toLowerCase(),
      password_hash: input.password_hash,
      first_name: input.first_name,
      last_name: input.last_name,
      title: input.title ?? null,
      role_id: input.role_id,
      system_admin: input.system_admin ?? false,
      is_active: input.is_active ?? true,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    });
    const saved = await this.repo.save(entity);
    return this.requireById(saved.id);
  }

  async update(id: number, patch: UpdateUserPatch): Promise<User> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    if (patch.first_name !== undefined) existing.first_name = patch.first_name;
    if (patch.last_name !== undefined) existing.last_name = patch.last_name;
    if (patch.title !== undefined) existing.title = patch.title;
    if (patch.role_id !== undefined) existing.role_id = patch.role_id;
    if (patch.system_admin !== undefined) existing.system_admin = patch.system_admin;
    if (patch.is_active !== undefined) existing.is_active = patch.is_active;
    if (patch.updated_by !== undefined) existing.updated_by = patch.updated_by;
    await this.repo.save(existing);
    return this.requireById(id);
  }

  /**
   * Direct `.update()` bypasses `@UpdateDateColumn` listeners (TypeORM
   * quirk — only `.save()` fires them), so we set `updated_at`
   * explicitly to keep the "last modified" signal honest after a
   * password rotation.
   */
  async updatePasswordHash(
    id: number,
    password_hash: string,
    updated_by: number | null,
  ): Promise<void> {
    await this.repo.update({ id }, { password_hash, updated_by, updated_at: new Date() });
  }

  /**
   * Sets both `last_login_at` and `updated_at`. `.update()` doesn't
   * trigger lifecycle listeners — see `updatePasswordHash`.
   * `updated_by` is intentionally not set: a login has no human actor.
   */
  async recordLogin(id: number, at: Date): Promise<void> {
    await this.repo.update({ id }, { last_login_at: at, updated_at: at });
  }

  /**
   * Atomic soft-delete: one statement sets both `deleted_at` and
   * `deleted_by`. The previous two-call form (`save` then `softDelete`)
   * could leave the row half-deleted if the second call failed.
   */
  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ deleted_at: () => 'NOW()', deleted_by })
      .where('id = :id', { id })
      .execute();
  }

  private async requireById(id: number): Promise<User> {
    const entity = await this.repo.findOneOrFail({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    return UserMapper.toDomain(entity);
  }
}
