import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';
import { TimeCorrectionRequestMapper } from '@/time-correction-requests/persistence/mappers/time-correction-request.mapper';
import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request.aggregate';
import { TimeCorrectionRequestSearchCriteria } from '@/time-correction-requests/domain/time-correction-request-search-criteria';
import { FindAllTimeCorrectionRequest } from '@/time-correction-requests/domain/find-all-time-correction-request';
import {
  TC_PENDING_STATUSES,
  TIME_CORRECTION_STATUSES,
  TcDecisionPath,
  TimeCorrectionStatus,
} from '@/time-correction-requests/time-correction-requests.constants';
import { paginate, resolvePaging } from '@/utils/helpers/pagination';

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
    const paging = resolvePaging(criteria);

    const qb = this.repo
      .createQueryBuilder('tc')
      // 1:1 ManyToOne — no row multiplication, so pagination stays correct.
      // Joins the requester so the list resolves employee_name in one trip.
      .leftJoinAndSelect('tc.employee', 'employee')
      // Same 1:1 join for the snapshotted L1/L2 approvers → approver names.
      .leftJoinAndSelect('tc.l1_approver', 'l1_approver')
      .leftJoinAndSelect('tc.l2_approver', 'l2_approver')
      .orderBy('tc.submitted_at', 'DESC')
      .skip(paging.skip)
      .take(paging.limit);

    if (!criteria.includeDeleted) qb.andWhere('tc.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('tc.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.status && criteria.status.length > 0)
      qb.andWhere('tc.status IN (:...statuses)', { statuses: criteria.status });
    if (criteria.from !== undefined) qb.andWhere('tc.work_date >= :from', { from: criteria.from });
    if (criteria.to !== undefined) qb.andWhere('tc.work_date <= :to', { to: criteria.to });

    const [entities, total] = await qb.getManyAndCount();
    return paginate(entities.map(TimeCorrectionRequestMapper.toListItem), total, paging);
  }

  async findById(id: number): Promise<TimeCorrectionRequestRecord | null> {
    // Load the target entry so the detail view can render the original→proposed
    // diff (NULL relation for a new-log correction — handled by the mapper).
    const entity = await this.repo.findOne({
      where: { id },
      relations: { target_entry: true },
    });
    return entity ? TimeCorrectionRequestMapper.toDomain(entity) : null;
  }

  async findAggregateById(id: number): Promise<TimeCorrectionRequest | null> {
    // Write-path load: the aggregate's behavior doesn't read the joined target
    // entry (original_* are read-model only), so no relation join is needed.
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TimeCorrectionRequestMapper.toAggregate(entity) : null;
  }

  async findActiveForEmployeeDate(
    employee_id: number,
    work_date: string,
  ): Promise<TimeCorrectionRequestRecord[]> {
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

  async findActiveForEntry(target_entry_id: number): Promise<TimeCorrectionRequestRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      .where('tc.target_entry_id = :teid', { teid: target_entry_id })
      .andWhere('tc.deleted_at IS NULL')
      .andWhere('tc.status IN (:...statuses)', {
        statuses: ['pending_l1', 'pending_l2', 'approved'],
      })
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async findPendingForApprover(approver_id: number): Promise<TimeCorrectionRequestRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      // Join the target entry → original times for the inbox in/out diff.
      .leftJoinAndSelect('tc.target_entry', 'target_entry')
      .where('tc.deleted_at IS NULL')
      .andWhere(
        "(tc.status = 'pending_l1' AND tc.l1_approver_id = :uid) OR (tc.status = 'pending_l2' AND tc.l2_approver_id = :uid)",
        { uid: approver_id },
      )
      .orderBy('tc.submitted_at', 'ASC')
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async findAllPending(): Promise<TimeCorrectionRequestRecord[]> {
    const entities = await this.repo
      .createQueryBuilder('tc')
      .leftJoinAndSelect('tc.target_entry', 'target_entry')
      .where('tc.deleted_at IS NULL')
      .andWhere('tc.status IN (:...statuses)', { statuses: TC_PENDING_STATUSES })
      .orderBy('tc.submitted_at', 'ASC')
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async findActiveCandidatesForScheduleChange(
    employee_id: number,
    from_date: string,
    manager?: EntityManager,
  ): Promise<TimeCorrectionRequestRecord[]> {
    const repo = manager ? manager.getRepository(TimeCorrectionRequestEntity) : this.repo;
    const entities = await repo
      .createQueryBuilder('tc')
      .where('tc.employee_id = :eid', { eid: employee_id })
      .andWhere('tc.deleted_at IS NULL')
      .andWhere('tc.status IN (:...statuses)', {
        statuses: [TIME_CORRECTION_STATUSES.approved, ...TC_PENDING_STATUSES],
      })
      .andWhere('tc.work_date >= :from', { from: from_date })
      .getMany();
    return entities.map(TimeCorrectionRequestMapper.toDomain);
  }

  async systemCancel(
    ids: number[],
    actor_id: number,
    note: string,
    manager?: EntityManager,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const repo = manager ? manager.getRepository(TimeCorrectionRequestEntity) : this.repo;
    const result = await repo
      .createQueryBuilder()
      .update(TimeCorrectionRequestEntity)
      .set({
        status: TIME_CORRECTION_STATUSES.cancelled,
        cancelled_at: new Date(),
        cancelled_by: actor_id,
        decision_note: note,
        updated_by: actor_id,
      })
      .where('id IN (:...ids)', { ids })
      .andWhere('status IN (:...active)', {
        active: [TIME_CORRECTION_STATUSES.approved, ...TC_PENDING_STATUSES],
      })
      .andWhere('deleted_at IS NULL')
      .execute();
    return result.affected ?? 0;
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
  }): Promise<TimeCorrectionRequestRecord> {
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
  ): Promise<TimeCorrectionRequestRecord> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    Object.assign(existing, patch);
    await this.repo.save(existing);
    return this.requireById(id);
  }

  private async requireById(id: number): Promise<TimeCorrectionRequestRecord> {
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return TimeCorrectionRequestMapper.toDomain(entity);
  }
}
