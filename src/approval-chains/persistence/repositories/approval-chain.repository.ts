import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { BaseApprovalChainRepository } from '@/approval-chains/persistence/base-approval-chain.repository';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';
import { ApprovalChainMapper } from '@/approval-chains/persistence/mappers/approval-chain.mapper';
import { ApprovalChain } from '@/approval-chains/domain/approval-chain';
import { ApprovalChainSearchCriteria } from '@/approval-chains/domain/approval-chain-search-criteria';
import { FindAllApprovalChain } from '@/approval-chains/domain/find-all-approval-chain';
import { EmployeeChainView } from '@/approval-chains/domain/approval-chain-inputs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { PAGINATION_DEFAULTS } from '@/utils/constants/api.constants';

@Injectable()
export class ApprovalChainRepository extends BaseApprovalChainRepository {
  constructor(
    @InjectRepository(ApprovalChainEntity)
    private readonly repo: Repository<ApprovalChainEntity>,
  ) {
    super();
  }

  async findActiveForEmployee(employee_id: number): Promise<ApprovalChain[]> {
    const rows = await this.repo.find({
      where: { employee_id, ended_at: IsNull() },
      order: { step: 'ASC' },
    });
    return rows.map(ApprovalChainMapper.toDomain);
  }

  async findActiveByApprover(approver_id: number): Promise<ApprovalChain[]> {
    const rows = await this.repo.find({
      where: { approver_id, ended_at: IsNull() },
      order: { employee_id: 'ASC', step: 'ASC' },
    });
    return rows.map(ApprovalChainMapper.toDomain);
  }

  async findAllForEmployee(employee_id: number): Promise<ApprovalChain[]> {
    const rows = await this.repo.find({
      where: { employee_id },
      order: { step: 'ASC', effective_at: 'DESC' },
    });
    return rows.map(ApprovalChainMapper.toDomain);
  }

  async listEmployeesWithChains(
    criteria: ApprovalChainSearchCriteria,
  ): Promise<FindAllApprovalChain> {
    const page = criteria.page ?? PAGINATION_DEFAULTS.page;
    const limit = Math.min(
      criteria.limit ?? PAGINATION_DEFAULTS.limit,
      PAGINATION_DEFAULTS.maxLimit,
    );

    // At most one active row per (employee, step), so the joins are 1:1 —
    // no row multiplication, the user count is the true total.
    const base = this.repo.manager
      .createQueryBuilder(UserEntity, 'u')
      .leftJoin(
        ApprovalChainEntity,
        'c1',
        'c1.employee_id = u.id AND c1.step = 1 AND c1.ended_at IS NULL',
      )
      .leftJoin(UserEntity, 'a1', 'a1.id = c1.approver_id')
      .leftJoin(
        ApprovalChainEntity,
        'c2',
        'c2.employee_id = u.id AND c2.step = 2 AND c2.ended_at IS NULL',
      )
      .leftJoin(UserEntity, 'a2', 'a2.id = c2.approver_id')
      .where('u.deleted_at IS NULL')
      .andWhere('u.is_active = true');

    if (criteria.search) {
      base.andWhere('(u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.email ILIKE :s)', {
        s: `%${criteria.search}%`,
      });
    }

    const total = await base.clone().getCount();

    const rows = await base
      .clone()
      .select('u.id', 'employee_id')
      .addSelect("u.first_name || ' ' || u.last_name", 'employee_name')
      .addSelect('u.email', 'employee_email')
      .addSelect('c1.approver_id', 'l1_approver_id')
      .addSelect("a1.first_name || ' ' || a1.last_name", 'l1_approver_name')
      .addSelect('c2.approver_id', 'l2_approver_id')
      .addSelect("a2.first_name || ' ' || a2.last_name", 'l2_approver_name')
      .addSelect('GREATEST(c1.updated_at, c2.updated_at)', 'updated_at')
      .orderBy('u.first_name', 'ASC')
      .addOrderBy('u.last_name', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{
        employee_id: number;
        employee_name: string;
        employee_email: string;
        l1_approver_id: number | null;
        l1_approver_name: string | null;
        l2_approver_id: number | null;
        l2_approver_name: string | null;
        updated_at: Date | null;
      }>();

    const data: EmployeeChainView[] = rows.map((r) => ({
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      employee_email: r.employee_email,
      l1_approver_id: r.l1_approver_id,
      l1_approver_name: r.l1_approver_name,
      l2_approver_id: r.l2_approver_id,
      l2_approver_name: r.l2_approver_name,
      updated_at: r.updated_at,
    }));

    return { data, total, page, limit, has_more: page * limit < total };
  }

  async applyStepChanges(input: {
    ends: number[];
    inserts: {
      employee_id: number;
      step: number;
      approver_id: number;
      created_by: number | null;
    }[];
    actor_id: number | null;
  }): Promise<void> {
    await this.repo.manager.transaction(async (em) => {
      // End old rows FIRST so the partial unique index slot is free
      // before the matching insert lands in the same transaction.
      if (input.ends.length > 0) {
        await em
          .createQueryBuilder()
          .update(ApprovalChainEntity)
          .set({ ended_at: () => 'now()', updated_by: input.actor_id })
          .where({ id: In(input.ends) })
          .execute();
      }

      for (const ins of input.inserts) {
        const entity = em.create(ApprovalChainEntity, {
          employee_id: ins.employee_id,
          step: ins.step,
          approver_id: ins.approver_id,
          created_by: ins.created_by,
          updated_by: ins.created_by,
        });
        await em.save(entity);
      }
    });
  }
}
