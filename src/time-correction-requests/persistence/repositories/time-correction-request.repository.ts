import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';
import { TimeCorrectionRequestMapper } from '@/time-correction-requests/persistence/mappers/time-correction-request.mapper';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestSearchCriteria } from '@/time-correction-requests/domain/time-correction-request-search-criteria';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import {
  TcDecisionPath,
  TC_PENDING_STATUSES,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';

@Injectable()
export class TimeCorrectionRequestRepository extends BaseTimeCorrectionRequestRepository {
  constructor(
    @InjectRepository(TimeCorrectionRequestEntity)
    private readonly repo: Repository<TimeCorrectionRequestEntity>,
  ) {
    super();
  }

  async findAll(
    criteria: TimeCorrectionRequestSearchCriteria,
  ): Promise<FindAllTimeCorrectionRequest> {
    const page = criteria.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(
      criteria.limit ?? PAGINATION_DEFAULTS.limit,
      PAGINATION_DEFAULTS.maxLimit,
    );

    const qb = this.repo
      .createQueryBuilder('tc')
      // 1:1 ManyToOne — no row multiplication, so pagination stays correct.
      // Joins the requester so the list resolves employee_name in one trip.
      .leftJoinAndSelect('tc.employee', 'employee')
      .orderBy('tc.submitted_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!criteria.includeDeleted) qb.andWhere('tc.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('tc.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.status && criteria.status.length > 0)
      qb.andWhere('tc.status IN (:...statuses)', { statuses: criteria.status });
    if (criteria.from !== undefined) qb.andWhere('tc.work_date >= :from', { from: criteria.from });
    if (criteria.to !== undefined) qb.andWhere('tc.work_date <= :to', { to: criteria.to });

    const [entities, total] = await qb.getManyAndCount();
    return {
      data: entities.map(TimeCorrectionRequestMapper.toListItem),
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async findById(id: number): Promise<TimeCorrectionRequest | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TimeCorrectionRequestMapper.toDomain(entity) : null;
  }

  async findActiveForEmployeeDate(
    employee_id: number,
    work_date: string,
  ): Promise<TimeCorrectionRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      .where('tc.employee_id = :eid', { eid: employee_id })
      .andWhere('tc.work_date = :wd', { wd: work_date })
      .andWhere('tc.deleted_at IS NULL')
      .andWhere('tc.status IN (:...statuses)', {
        statuses: ['pending_l1', 'pending_l2', 'approved'],
      })
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async findPendingForApprover(approver_id: number): Promise<TimeCorrectionRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      .where('tc.deleted_at IS NULL')
      .andWhere(
        "(tc.status = 'pending_l1' AND tc.l1_approver_id = :uid) OR (tc.status = 'pending_l2' AND tc.l2_approver_id = :uid)",
        { uid: approver_id },
      )
      .orderBy('tc.submitted_at', 'ASC')
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async findAllPending(): Promise<TimeCorrectionRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      .where('tc.deleted_at IS NULL')
      .andWhere('tc.status IN (:...statuses)', { statuses: TC_PENDING_STATUSES })
      .orderBy('tc.submitted_at', 'ASC')
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async create(input: {
    employee_id: number;
    target_entry_id?: number | null;
    work_date: string;
    proposed_time_in: Date;
    proposed_time_out?: Date | null;
    reason: string;
    status: TimeCorrectionStatus;
    l1_approver_id: number;
    l2_approver_id: number | null;
    created_by?: number | null;
  }): Promise<TimeCorrectionRequest> {
    const entity = this.repo.create({
      employee_id: input.employee_id,
      target_entry_id: input.target_entry_id ?? null,
      work_date: input.work_date,
      proposed_time_in: input.proposed_time_in,
      proposed_time_out: input.proposed_time_out ?? null,
      reason: input.reason,
      status: input.status,
      l1_approver_id: input.l1_approver_id,
      l2_approver_id: input.l2_approver_id,
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
      proposed_time_in?: Date;
      proposed_time_out?: Date | null;
      reason?: string;
      status?: TimeCorrectionStatus;
      decided_at?: Date | null;
      decided_by?: number | null;
      decision_note?: string | null;
      decision_path?: TcDecisionPath | null;
      cancelled_at?: Date | null;
      cancelled_by?: number | null;
      updated_by?: number | null;
    },
  ): Promise<TimeCorrectionRequest> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    Object.assign(existing, patch);
    await this.repo.save(existing);
    return this.requireById(id);
  }

  private async requireById(id: number): Promise<TimeCorrectionRequest> {
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return TimeCorrectionRequestMapper.toDomain(entity);
  }
}
