import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';
import { WorkScheduleMapper } from '@/work-schedules/persistence/mappers/work-schedule.mapper';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleSearchCriteria } from '@/work-schedules/domain/work-schedule-search-criteria';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';
import { scopedRepo } from '@/utils/helpers/scoped-repo';

@Injectable()
export class WorkScheduleRepository extends BaseWorkScheduleRepository {
  constructor(
    @InjectRepository(WorkScheduleEntity)
    private readonly repo: Repository<WorkScheduleEntity>,
  ) {
    super();
  }

  /** The bound repository, joined to `manager`'s transaction when one is given. */
  private repoFor(manager?: EntityManager): Repository<WorkScheduleEntity> {
    return scopedRepo(this.repo, manager);
  }

  async findAll(criteria: WorkScheduleSearchCriteria): Promise<FindAllWorkSchedule> {
    const paging = resolvePaging(criteria);

    const qb = this.repo
      .createQueryBuilder('ws')
      .orderBy('ws.employee_id', 'ASC')
      .addOrderBy('ws.day_of_week', 'ASC')
      .skip(paging.skip)
      .take(paging.limit);

    if (!criteria.includeDeleted) qb.andWhere('ws.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('ws.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.day_of_week !== undefined)
      qb.andWhere('ws.day_of_week = :dow', { dow: criteria.day_of_week });
    if (criteria.activeOnly) qb.andWhere('ws.effective_to IS NULL');

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(WorkScheduleMapper.toDomain), total, paging);
  }

  async findById(id: number): Promise<WorkScheduleRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WorkScheduleMapper.toDomain(entity) : null;
  }

  async findActiveForEmployee(employee_id: number): Promise<WorkScheduleRecord[]> {
    const entities = await this.repo.find({
      where: { employee_id, effective_to: IsNull() },
      order: { day_of_week: 'ASC' },
    });
    return entities.map(WorkScheduleMapper.toDomain);
  }

  async findActiveForEmployeeDay(
    employee_id: number,
    day_of_week: DayOfWeek,
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord | null> {
    const entity = await this.repoFor(manager).findOne({
      where: { employee_id, day_of_week, effective_to: IsNull() },
    });
    return entity ? WorkScheduleMapper.toDomain(entity) : null;
  }

  async create(
    input: {
      employee_id: number;
      day_of_week: DayOfWeek;
      expected_in: string;
      expected_out: string;
      break_minutes: number;
      break_start?: string | null;
      effective_from: string;
      effective_to?: string | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord> {
    const repo = this.repoFor(manager);
    const entity = repo.create({
      employee_id: input.employee_id,
      day_of_week: input.day_of_week,
      expected_in: input.expected_in,
      expected_out: input.expected_out,
      break_minutes: input.break_minutes,
      break_start: input.break_start ?? null,
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
      expected_in?: string;
      expected_out?: string;
      break_minutes?: number;
      break_start?: string | null;
      effective_from?: string;
      effective_to?: string | null;
      updated_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord> {
    const repo = this.repoFor(manager);
    const existing = await repo.findOneOrFail({ where: { id } });
    if (patch.expected_in !== undefined) existing.expected_in = patch.expected_in;
    if (patch.expected_out !== undefined) existing.expected_out = patch.expected_out;
    if (patch.break_minutes !== undefined) existing.break_minutes = patch.break_minutes;
    if (patch.break_start !== undefined) existing.break_start = patch.break_start;
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

  private async requireById(id: number, manager?: EntityManager): Promise<WorkScheduleRecord> {
    const entity = await this.repoFor(manager).findOneOrFail({ where: { id } });
    return WorkScheduleMapper.toDomain(entity);
  }
}
