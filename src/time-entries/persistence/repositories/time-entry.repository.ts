import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTimeEntryRepository } from '@/time-entries/persistence/base-time-entry.repository';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import { TimeEntryMapper } from '@/time-entries/persistence/mappers/time-entry.mapper';
import { TimeEntry } from '@/time-entries/domain/time-entry';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import {
  TIME_ENTRY_STATUSES,
  TimeEntrySource,
  TimeEntryStatus,
} from '@/time-entries/time-entries.constants';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';

@Injectable()
export class TimeEntryRepository extends BaseTimeEntryRepository {
  constructor(
    @InjectRepository(TimeEntryEntity)
    private readonly repo: Repository<TimeEntryEntity>,
  ) {
    super();
  }

  async findAll(criteria: TimeEntrySearchCriteria): Promise<FindAllTimeEntry> {
    const page = criteria.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(
      criteria.limit ?? PAGINATION_DEFAULTS.limit,
      PAGINATION_DEFAULTS.maxLimit,
    );

    const qb = this.repo
      .createQueryBuilder('te')
      .orderBy('te.work_date', 'DESC')
      .addOrderBy('te.time_in', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!criteria.includeDeleted) qb.andWhere('te.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('te.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.from) qb.andWhere('te.work_date >= :from', { from: criteria.from });
    if (criteria.to) qb.andWhere('te.work_date <= :to', { to: criteria.to });
    if (criteria.status) qb.andWhere('te.status = :status', { status: criteria.status });

    const [entities, total] = await qb.getManyAndCount();
    return {
      data: entities.map(TimeEntryMapper.toDomain),
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async findById(id: number): Promise<TimeEntry | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TimeEntryMapper.toDomain(entity) : null;
  }

  async findOpenForEmployee(employee_id: number): Promise<TimeEntry | null> {
    const entity = await this.repo.findOne({
      where: { employee_id, status: TIME_ENTRY_STATUSES.open },
    });
    return entity ? TimeEntryMapper.toDomain(entity) : null;
  }

  async existsForEmployeeDate(employee_id: number, work_date: string): Promise<boolean> {
    // `findOne` honors the entity's @DeleteDateColumn, so soft-deleted rows
    // are excluded automatically.
    const count = await this.repo.count({ where: { employee_id, work_date } });
    return count > 0;
  }

  async create(input: {
    employee_id: number;
    work_date: string;
    time_in: Date;
    time_out?: Date | null;
    source: TimeEntrySource;
    status: TimeEntryStatus;
    notes?: string | null;
    created_by?: number | null;
  }): Promise<TimeEntry> {
    const entity = this.repo.create({
      employee_id: input.employee_id,
      work_date: input.work_date,
      time_in: input.time_in,
      time_out: input.time_out ?? null,
      source: input.source,
      status: input.status,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    });
    const saved = await this.repo.save(entity);
    return this.requireById(saved.id);
  }

  async update(
    id: number,
    patch: {
      work_date?: string;
      time_in?: Date;
      time_out?: Date | null;
      source?: TimeEntrySource;
      status?: TimeEntryStatus;
      notes?: string | null;
      updated_by?: number | null;
    },
  ): Promise<TimeEntry> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    if (patch.work_date !== undefined) existing.work_date = patch.work_date;
    if (patch.time_in !== undefined) existing.time_in = patch.time_in;
    if (patch.time_out !== undefined) existing.time_out = patch.time_out;
    if (patch.source !== undefined) existing.source = patch.source;
    if (patch.status !== undefined) existing.status = patch.status;
    if (patch.notes !== undefined) existing.notes = patch.notes;
    if (patch.updated_by !== undefined) existing.updated_by = patch.updated_by;
    await this.repo.save(existing);
    return this.requireById(id);
  }

  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    existing.deleted_by = deleted_by;
    await this.repo.save(existing);
    await this.repo.softDelete(id);
  }

  private async requireById(id: number): Promise<TimeEntry> {
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return TimeEntryMapper.toDomain(entity);
  }
}
