import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BaseLeaveRequestRepository,
  WorkingDaySums,
} from '@/leave-requests/persistence/base-leave-request.repository';
import { LeaveRequestEntity } from '@/leave-requests/persistence/entities/leave-request.entity';
import { LeaveRequestMapper } from '@/leave-requests/persistence/mappers/leave-request.mapper';
import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestSearchCriteria } from '@/leave-requests/domain/leave-request-search-criteria';
import { FindAllLeaveRequest } from '@/leave-requests/domain/find-all-leave-request';
import {
  DecisionPath,
  LEAVE_REQUEST_STATUSES,
  LeaveRequestStatus,
  LeaveType,
  PENDING_STATUSES,
} from '@/leave-requests/leave-requests.constants';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';

@Injectable()
export class LeaveRequestRepository extends BaseLeaveRequestRepository {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly repo: Repository<LeaveRequestEntity>,
  ) {
    super();
  }

  async findAll(criteria: LeaveRequestSearchCriteria): Promise<FindAllLeaveRequest> {
    const page = criteria.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(
      criteria.limit ?? PAGINATION_DEFAULTS.limit,
      PAGINATION_DEFAULTS.maxLimit,
    );

    const qb = this.repo
      .createQueryBuilder('lr')
      // 1:1 ManyToOne — no row multiplication, so pagination stays correct.
      // Joins the requester so the list resolves employee_name in one trip.
      .leftJoinAndSelect('lr.employee', 'employee')
      .orderBy('lr.submitted_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!criteria.includeDeleted) qb.andWhere('lr.deleted_at IS NULL');
    if (criteria.employee_id !== undefined)
      qb.andWhere('lr.employee_id = :eid', { eid: criteria.employee_id });
    if (criteria.status && criteria.status.length > 0)
      qb.andWhere('lr.status IN (:...statuses)', { statuses: criteria.status });
    if (criteria.leave_type !== undefined)
      qb.andWhere('lr.leave_type = :lt', { lt: criteria.leave_type });
    if (criteria.from !== undefined) qb.andWhere('lr.end_date >= :from', { from: criteria.from });
    if (criteria.to !== undefined) qb.andWhere('lr.start_date <= :to', { to: criteria.to });

    const [entities, total] = await qb.getManyAndCount();
    return {
      data: entities.map(LeaveRequestMapper.toListItem),
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async findById(id: number): Promise<LeaveRequest | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LeaveRequestMapper.toDomain(entity) : null;
  }

  async findOverlapping(
    employee_id: number,
    start_date: string,
    end_date: string,
  ): Promise<LeaveRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('lr')
      .where('lr.employee_id = :eid', { eid: employee_id })
      .andWhere('lr.deleted_at IS NULL')
      .andWhere('lr.status IN (:...statuses)', {
        statuses: ['pending_l1', 'pending_l2', 'approved'],
      })
      // Two ranges overlap unless one ends before the other starts.
      .andWhere('NOT (lr.end_date < :start OR lr.start_date > :end)', {
        start: start_date,
        end: end_date,
      })
      .getMany();
    return entities.map(LeaveRequestMapper.toDomain);
  }

  async findPendingForApprover(approver_id: number): Promise<LeaveRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('lr')
      .where('lr.deleted_at IS NULL')
      .andWhere(
        "(lr.status = 'pending_l1' AND lr.l1_approver_id = :uid) OR (lr.status = 'pending_l2' AND lr.l2_approver_id = :uid)",
        { uid: approver_id },
      )
      .orderBy('lr.submitted_at', 'ASC')
      .getMany();
    return entities.map(LeaveRequestMapper.toDomain);
  }

  async findAllPending(): Promise<LeaveRequest[]> {
    const entities = await this.repo
      .createQueryBuilder('lr')
      .where('lr.deleted_at IS NULL')
      .andWhere('lr.status IN (:...statuses)', { statuses: PENDING_STATUSES })
      .orderBy('lr.submitted_at', 'ASC')
      .getMany();
    return entities.map(LeaveRequestMapper.toDomain);
  }

  async create(
    input: {
      employee_id: number;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      working_days: number;
      reason?: string | null;
      status: LeaveRequestStatus;
      l1_approver_id: number;
      l2_approver_id: number | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<LeaveRequest> {
    // When a manager is passed, the insert (and its reload) join that
    // transaction — required for reserve-on-submit (plan C3).
    const repo = manager ? manager.getRepository(LeaveRequestEntity) : this.repo;
    const entity = repo.create({
      employee_id: input.employee_id,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      working_days: input.working_days,
      reason: input.reason ?? null,
      status: input.status,
      l1_approver_id: input.l1_approver_id,
      l2_approver_id: input.l2_approver_id,
      created_by: input.created_by ?? null,
      updated_by: input.created_by ?? null,
    });
    const saved = await repo.save(entity);
    const reloaded = await repo.findOneOrFail({ where: { id: saved.id } });
    return LeaveRequestMapper.toDomain(reloaded);
  }

  async workingDaySumsByEmployee(employee_id: number): Promise<WorkingDaySums> {
    const rows = await this.repo
      .createQueryBuilder('lr')
      .select('lr.leave_type', 'leave_type')
      .addSelect('lr.status', 'status')
      .addSelect('COALESCE(SUM(lr.working_days), 0)', 'sum')
      .where('lr.employee_id = :employee_id', { employee_id })
      .andWhere('lr.deleted_at IS NULL')
      .andWhere('lr.status IN (:...statuses)', {
        statuses: [LEAVE_REQUEST_STATUSES.approved, ...PENDING_STATUSES],
      })
      .groupBy('lr.leave_type')
      .addGroupBy('lr.status')
      .getRawMany<{ leave_type: LeaveType; status: LeaveRequestStatus; sum: string }>();

    const out: WorkingDaySums = {};
    for (const row of rows) {
      const bucket = (out[row.leave_type] ??= { used: 0, reserved: 0 });
      if (row.status === LEAVE_REQUEST_STATUSES.approved) bucket.used += Number(row.sum);
      else bucket.reserved += Number(row.sum);
    }
    return out;
  }

  async sumConsumedForEmployeeType(
    manager: EntityManager,
    employee_id: number,
    leave_type: LeaveType,
  ): Promise<number> {
    const raw = await manager
      .getRepository(LeaveRequestEntity)
      .createQueryBuilder('lr')
      .select('COALESCE(SUM(lr.working_days), 0)', 'sum')
      .where('lr.employee_id = :employee_id', { employee_id })
      .andWhere('lr.leave_type = :leave_type', { leave_type })
      .andWhere('lr.deleted_at IS NULL')
      .andWhere('lr.status IN (:...statuses)', {
        statuses: [LEAVE_REQUEST_STATUSES.approved, ...PENDING_STATUSES],
      })
      .getRawOne<{ sum: string }>();
    return Number(raw?.sum ?? 0);
  }

  async update(
    id: number,
    patch: {
      leave_type?: LeaveType;
      start_date?: string;
      end_date?: string;
      reason?: string | null;
      status?: LeaveRequestStatus;
      decided_at?: Date | null;
      decided_by?: number | null;
      decision_note?: string | null;
      decision_path?: DecisionPath | null;
      cancelled_at?: Date | null;
      cancelled_by?: number | null;
      updated_by?: number | null;
    },
  ): Promise<LeaveRequest> {
    const existing = await this.repo.findOneOrFail({ where: { id } });
    Object.assign(existing, patch);
    await this.repo.save(existing);
    return this.requireById(id);
  }

  private async requireById(id: number): Promise<LeaveRequest> {
    const entity = await this.repo.findOneOrFail({ where: { id } });
    return LeaveRequestMapper.toDomain(entity);
  }
}
