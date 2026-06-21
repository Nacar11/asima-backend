import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';
import { assignApprovers, SeedEmployee } from './chain-assignments';

/**
 * Seeds per-employee approval chains from the org model (see chain-assignments).
 * Idempotent on the active-row key `(employee_id, step) WHERE ended_at IS NULL`
 * — the same predicate as the partial unique index. Must run after the user
 * seed; leave/correction seeders read these chains for their approvers.
 */
@Injectable()
export class ApprovalChainSeedService {
  private readonly logger = new Logger(ApprovalChainSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(ApprovalChainEntity)
    private readonly chainRepo: Repository<ApprovalChainEntity>,
  ) {}

  async run(): Promise<void> {
    const roles = await this.roleRepo.find();
    const roleName = new Map(roles.map((r) => [r.id, r.name]));
    const users = await this.userRepo.find();
    const created_by = users.find((u) => u.system_admin)?.id ?? null;

    const employees: SeedEmployee[] = users.map((u) => ({
      id: u.id,
      role_name: roleName.get(u.role_id) ?? '',
      system_admin: u.system_admin,
    }));

    let inserted = 0;
    let skipped = 0;
    for (const row of assignApprovers(employees)) {
      if (row.approver_id === row.employee_id) continue; // defensive — DB CHECK backstop

      const existing = await this.chainRepo.findOne({
        where: { employee_id: row.employee_id, step: row.step, ended_at: IsNull() },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      await this.chainRepo.save(
        this.chainRepo.create({
          employee_id: row.employee_id,
          step: row.step,
          approver_id: row.approver_id,
          ended_at: null,
          created_by,
          updated_by: created_by,
        }),
      );
      inserted += 1;
    }

    this.logger.log(
      `ApprovalChains seed complete: ${inserted} inserted, ${skipped} already existed`,
    );
  }
}
