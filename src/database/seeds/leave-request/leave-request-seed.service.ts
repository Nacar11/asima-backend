import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ApprovalChainEntity } from '@/approval-chains/persistence/entities/approval-chain.entity';
import { LeaveRequestEntity } from '@/leave-requests/persistence/entities/leave-request.entity';
import { AttachmentService } from '@/storage/attachment.service';
import { buildLeaveRows, LeaveRowSpec } from './leave-rows';

const BASE_DATE = '2025-03-03'; // a Monday — all generated dates are weekdays in the past

/**
 * Seeds a spread of leave requests per employee (pending in approver inboxes +
 * approved/rejected/cancelled history). Row generation is the pure
 * `buildLeaveRows`; this service sources approvers from the seeded chains (I1),
 * is idempotent by `(employee_id, leave_type, start_date)`, and — for ~1/3 of
 * employees — attaches a **per-employee** placeholder image to the
 * sick/bereavement rows (R1). Attachments are best-effort: no placeholder file
 * or a failed upload simply omits those rows (R5); `npm run seed` never breaks.
 */
@Injectable()
export class LeaveRequestSeedService {
  private readonly logger = new Logger(LeaveRequestSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ApprovalChainEntity)
    private readonly chainRepo: Repository<ApprovalChainEntity>,
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRepo: Repository<LeaveRequestEntity>,
    private readonly attachments: AttachmentService,
    private readonly dataSource: DataSource,
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

    const placeholder = this.loadPlaceholder();
    const employees = users.filter((u) => chainByEmp.has(u.id)).sort((a, b) => a.id - b.id);

    let inserted = 0;
    let skipped = 0;
    let skippedNoAttachment = 0;
    let attachmentIndex = 0;

    for (const emp of employees) {
      const chain = chainByEmp.get(emp.id)!;
      if (chain.l1 == null) continue;

      const wantAttachment = placeholder != null && attachmentIndex % 3 === 0;
      attachmentIndex += 1;

      const rows = buildLeaveRows({
        employee_id: emp.id,
        l1_approver_id: chain.l1,
        l2_approver_id: chain.l2,
        admin_id: adminId,
        base_date: BASE_DATE,
        with_attachment_types: wantAttachment,
      });

      const missing: LeaveRowSpec[] = [];
      for (const r of rows) {
        const exists = await this.leaveRepo.findOne({
          where: { employee_id: r.employee_id, leave_type: r.leave_type, start_date: r.start_date },
        });
        if (!exists) missing.push(r);
      }
      if (missing.length === 0) {
        skipped += rows.length;
        continue;
      }

      // Upload the per-employee placeholder only when a missing row needs it
      // (so a re-run with everything present never re-uploads — R4).
      let attachmentId: number | null = null;
      if (placeholder != null && missing.some((r) => r.requires_attachment)) {
        try {
          attachmentId = await this.uploadPlaceholder(emp.id, placeholder, adminId);
        } catch (err) {
          this.logger.warn(
            `Placeholder upload failed for employee ${emp.id} (${(err as Error).message}); ` +
              `skipping their attachment-required rows.`,
          );
        }
      }

      for (const r of missing) {
        if (r.requires_attachment && attachmentId == null) {
          skippedNoAttachment += 1; // R5: never seed sick/bereavement with a null attachment_id
          continue;
        }
        await this.leaveRepo.save(
          this.leaveRepo.create({
            employee_id: r.employee_id,
            leave_type: r.leave_type,
            start_date: r.start_date,
            end_date: r.end_date,
            working_days: r.working_days,
            day_portion: r.day_portion,
            start_time: null,
            end_time: null,
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
            attachment_id: r.requires_attachment ? attachmentId : null,
            created_by: r.created_by,
            updated_by: r.created_by,
          }),
        );
        inserted += 1;
      }
    }

    this.logger.log(
      `LeaveRequests seed complete: ${inserted} inserted, ${skipped} already existed` +
        (skippedNoAttachment ? `, ${skippedNoAttachment} skipped (no attachment)` : ''),
    );
  }

  /** Upload + persist one per-employee placeholder attachment; returns its id. */
  private async uploadPlaceholder(
    ownerId: number,
    buffer: Buffer,
    actorId: number | null,
  ): Promise<number> {
    const prepared = await this.attachments.uploadForOwner({
      file: { buffer, originalname: 'seed-attachment-placeholder.png' },
      owner_id: ownerId,
      actor_id: actorId ?? ownerId,
    });
    try {
      return await this.dataSource.transaction(
        async (m) => (await this.attachments.persist(prepared, m)).id,
      );
    } catch (err) {
      await this.attachments.cleanup(prepared);
      throw err;
    }
  }

  private loadPlaceholder(): Buffer | null {
    const file =
      process.env.SEED_ATTACHMENT_PLACEHOLDER ??
      path.join(process.cwd(), '..', 'public', 'seed-attachment-placeholder.png');
    try {
      return fs.readFileSync(file);
    } catch {
      this.logger.warn(
        `No seed attachment placeholder at ${file}; seeding leave without sick/bereavement rows.`,
      );
      return null;
    }
  }
}
