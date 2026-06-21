import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';
import { buildCorrectionRows, SeedEntry } from './correction-rows';

/**
 * Seeds a spread of time-correction requests per employee (pending in approver
 * inboxes + approved/rejected history). Row generation is the pure
 * `buildCorrectionRows`; this service sources approvers from the seeded chains
 * (I1) and the targets from the seeded time entries (I4), and is idempotent by
 * `(employee_id, work_date)`. Runs after the approval-chain + time-entry seeds.
 */
@Injectable()
export class TimeCorrectionSeedService {
  private readonly logger = new Logger(TimeCorrectionSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ApprovalChainEntity)
    private readonly chainRepo: Repository<ApprovalChainEntity>,
    @InjectRepository(TimeEntryEntity)
    private readonly entryRepo: Repository<TimeEntryEntity>,
    @InjectRepository(TimeCorrectionRequestEntity)
    private readonly tcRepo: Repository<TimeCorrectionRequestEntity>,
  ) {}

  async run(): Promise<void> {
    const users = await this.userRepo.find();
    const adminId = users.find((u) => u.system_admin)?.id ?? null;

    const chains = await this.chainRepo.find({ where: { ended_at: IsNull() } });
    const chainByEmp = new Map<number, { l1: number | null; l2: number | null }>();
    for (const c of chains) {
      const e = chainByEmp.get(c.employee_id) ?? { l1: null, l2: null };
      if (c.step === 1) e.l1 = c.approver_id;
      if (c.step === 2) e.l2 = c.approver_id;
      chainByEmp.set(c.employee_id, e);
    }

    const allEntries = await this.entryRepo.find({ order: { work_date: 'ASC' } });
    const entriesByEmp = new Map<number, SeedEntry[]>();
    for (const e of allEntries) {
      const list = entriesByEmp.get(e.employee_id) ?? [];
      list.push({ id: e.id, work_date: e.work_date, time_in: e.time_in, time_out: e.time_out });
      entriesByEmp.set(e.employee_id, list);
    }

    const employees = users.filter((u) => chainByEmp.has(u.id)).sort((a, b) => a.id - b.id);

    let inserted = 0;
    let skipped = 0;
    for (const emp of employees) {
      const chain = chainByEmp.get(emp.id)!;
      if (chain.l1 == null) continue;
      const entries = (entriesByEmp.get(emp.id) ?? []).slice(0, 3);
      if (entries.length === 0) continue;

      const rows = buildCorrectionRows({
        employee_id: emp.id,
        l1_approver_id: chain.l1,
        l2_approver_id: chain.l2,
        admin_id: adminId,
        entries,
      });

      for (const r of rows) {
        const exists = await this.tcRepo.findOne({
          where: { employee_id: r.employee_id, work_date: r.work_date },
        });
        if (exists) {
          skipped += 1;
          continue;
        }
        await this.tcRepo.save(
          this.tcRepo.create({
            employee_id: r.employee_id,
            target_entry_id: r.target_entry_id,
            work_date: r.work_date,
            proposed_time_in: r.proposed_time_in,
            proposed_time_out: r.proposed_time_out,
            reason: r.reason,
            status: r.status,
            submitted_at: r.submitted_at,
            decided_at: r.decided_at,
            decided_by: r.decided_by,
            decision_note: r.decision_note,
            decision_path: r.decision_path,
            cancelled_at: r.cancelled_at,
            cancelled_by: r.cancelled_by,
            l1_approver_id: r.l1_approver_id,
            l2_approver_id: r.l2_approver_id,
            created_by: r.created_by,
            updated_by: r.created_by,
          }),
        );
        inserted += 1;
      }
    }

    this.logger.log(
      `TimeCorrectionRequests seed complete: ${inserted} inserted, ${skipped} already existed`,
    );
  }
}
