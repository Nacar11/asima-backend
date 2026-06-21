import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';
import { CompensationEntity } from '@/compensation/persistence/entities/compensation.entity';
import { CompensationMapper } from '@/compensation/persistence/mappers/compensation.mapper';
import { Compensation } from '@/compensation/domain/compensation';
import { CompensationSearchCriteria } from '@/compensation/domain/compensation-search-criteria';
import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';

@Injectable()
export class CompensationRepository extends BaseCompensationRepository {
  constructor(
    @InjectRepository(CompensationEntity)
    private readonly repo: Repository<CompensationEntity>,
  ) {
    super();
  }

  /** The bound repository, joined to `manager`'s transaction when one is given. */
  private repoFor(manager?: EntityManager): Repository<CompensationEntity> {
    return manager ? manager.getRepository(CompensationEntity) : this.repo;
  }

  /**
   * Base query builder that opts the `select: false` money columns back in.
   * Every finder goes through this so pay is loaded explicitly, never by
   * accident. Soft-delete / employee filters are added per finder.
   */
  private baseQb(manager?: EntityManager): SelectQueryBuilder<CompensationEntity> {
    return this.repoFor(manager)
      .createQueryBuilder('c')
      .addSelect(['c.monthly_salary', 'c.hourly_rate']);
  }

  async findAll(criteria: CompensationSearchCriteria): Promise<FindAllCompensation> {
    const paging = resolvePaging(criteria);
    const qb = this.baseQb()
      .orderBy('c.employee_id', 'ASC')
      .addOrderBy('c.effective_from', 'DESC')
      .skip(paging.skip)
      .take(paging.limit);

    if (!criteria.includeDeleted) qb.andWhere('c.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('c.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.activeOnly) qb.andWhere('c.effective_to IS NULL');

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(CompensationMapper.toDomain), total, paging);
  }

  async findById(id: number): Promise<Compensation | null> {
    const entity = await this.baseQb()
      .where('c.id = :id', { id })
      .andWhere('c.deleted_at IS NULL')
      .getOne();
    return entity ? CompensationMapper.toDomain(entity) : null;
  }

  async findHistoryForEmployee(employee_id: number): Promise<Compensation[]> {
    const entities = await this.baseQb()
      .where('c.employee_id = :eid', { eid: employee_id })
      .andWhere('c.deleted_at IS NULL')
      .orderBy('c.effective_from', 'DESC')
      .getMany();
    return entities.map(CompensationMapper.toDomain);
  }

  async findRateOnDate(employee_id: number, date: string): Promise<Compensation | null> {
    const entity = await this.baseQb()
      .where('c.employee_id = :eid', { eid: employee_id })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.effective_from <= :date', { date })
      .andWhere('(c.effective_to IS NULL OR c.effective_to >= :date)', { date })
      .orderBy('c.effective_from', 'DESC')
      .getOne();
    return entity ? CompensationMapper.toDomain(entity) : null;
  }

  async findRatesOnDate(employee_ids: number[], date: string): Promise<Compensation[]> {
    if (employee_ids.length === 0) return [];
    // Effective-dating is non-overlapping by construction, so at most one row
    // per employee matches — a single IN-query, riding (employee_id, effective_to).
    const entities = await this.baseQb()
      .where('c.employee_id IN (:...ids)', { ids: employee_ids })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.effective_from <= :date', { date })
      .andWhere('(c.effective_to IS NULL OR c.effective_to >= :date)', { date })
      .getMany();
    return entities.map(CompensationMapper.toDomain);
  }

  async findActiveForEmployee(
    employee_id: number,
    manager?: EntityManager,
  ): Promise<Compensation | null> {
    const entity = await this.baseQb(manager)
      .where('c.employee_id = :eid', { eid: employee_id })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.effective_to IS NULL')
      .getOne();
    return entity ? CompensationMapper.toDomain(entity) : null;
  }

  async findPreviousForEmployee(
    employee_id: number,
    before_effective_from: string,
    manager?: EntityManager,
  ): Promise<Compensation | null> {
    const entity = await this.baseQb(manager)
      .where('c.employee_id = :eid', { eid: employee_id })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.effective_from < :before', { before: before_effective_from })
      .orderBy('c.effective_from', 'DESC')
      .getOne();
    return entity ? CompensationMapper.toDomain(entity) : null;
  }

  async create(
    input: {
      employee_id: number;
      monthly_salary: number;
      hourly_rate: number;
      hourly_rate_is_overridden: boolean;
      effective_from: string;
      effective_to?: string | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<Compensation> {
    const repo = this.repoFor(manager);
    const entity = repo.create({
      employee_id: input.employee_id,
      monthly_salary: input.monthly_salary,
      hourly_rate: input.hourly_rate,
      hourly_rate_is_overridden: input.hourly_rate_is_overridden,
      effective_from: input.effective_from,
      effective_to: input.effective_to ?? null,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    });
    const saved = await repo.save(entity);
    return this.requireById(saved.id, manager);
  }

  async update(
    id: number,
    patch: {
      monthly_salary?: number;
      hourly_rate?: number;
      hourly_rate_is_overridden?: boolean;
      effective_from?: string;
      effective_to?: string | null;
      updated_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<Compensation> {
    const repo = this.repoFor(manager);
    const existing = await repo.findOneOrFail({ where: { id } });
    if (patch.monthly_salary !== undefined) existing.monthly_salary = patch.monthly_salary;
    if (patch.hourly_rate !== undefined) existing.hourly_rate = patch.hourly_rate;
    if (patch.hourly_rate_is_overridden !== undefined)
      existing.hourly_rate_is_overridden = patch.hourly_rate_is_overridden;
    if (patch.effective_from !== undefined) existing.effective_from = patch.effective_from;
    if (patch.effective_to !== undefined) existing.effective_to = patch.effective_to;
    if (patch.updated_by !== undefined) existing.updated_by = patch.updated_by;
    await repo.save(existing);
    return this.requireById(id, manager);
  }

  async softDelete(id: number, deleted_by: number | null, manager?: EntityManager): Promise<void> {
    const repo = this.repoFor(manager);
    const existing = await repo.findOneOrFail({ where: { id } });
    existing.deleted_by = deleted_by;
    await repo.save(existing);
    await repo.softDelete(id);
  }

  private async requireById(id: number, manager?: EntityManager): Promise<Compensation> {
    const entity = await this.baseQb(manager).where('c.id = :id', { id }).getOneOrFail();
    return CompensationMapper.toDomain(entity);
  }
}
