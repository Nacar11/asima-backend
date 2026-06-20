import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { assertBreakOk, assertWindowOk } from '@/work-schedules/work-schedules.service';
import {
  AffectedRequest,
  ScheduleChangeImpact,
  ScheduleChangeIntent,
  ScheduleChangeResult,
} from '@/work-schedules/domain/schedule-change';
import {
  evaluateCorrection,
  evaluateLeave,
  planVersioning,
} from '@/work-schedules/domain/cascade-policy';
import { DayOfWeek, scheduleChangeCancelNote } from '@/work-schedules/work-schedules.constants';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { businessDateString, dayBefore } from '@/utils/helpers/dates';
import { unprocessable } from '@/utils/helpers/http-errors';
import { hasPermission } from '@/users/domain/user-permissions';
import { User } from '@/users/domain/user';

/** Snapshot of one request the preview said would cancel — echoed back to apply for the drift guard. */
export interface PreviewedCancel {
  kind: AffectedRequest['kind'];
  id: number;
  status: string;
}

/**
 * Orchestrates the admin schedule-change cascade (plan
 * `2026-06-20-admin-schedule-change-cascade.md`). `preview` is read-only; the
 * transactional `apply` lands in Task 6. The cancel/keep decisions live in the
 * pure `cascade-policy`; this service only loads the live row + candidate
 * requests and assembles the impact.
 *
 * Depends on the leave + time-correction **ports** (one-way: schedule →
 * leave/TC, never the reverse — see plan Architecture decisions).
 */
@Injectable()
export class ScheduleChangeService {
  constructor(
    private readonly schedules: BaseWorkScheduleRepository,
    private readonly leaves: BaseLeaveRequestRepository,
    private readonly corrections: BaseTimeCorrectionRequestRepository,
    private readonly dataSource: DataSource,
  ) {}

  /** Dry-run: compute the impact of a change without writing anything. */
  async preview(intent: ScheduleChangeIntent, caller: User): Promise<ScheduleChangeImpact> {
    this.validate(intent, caller);
    return this.computeImpact(intent, this.today());
  }

  /**
   * Commit the change + cascade atomically. Recomputes the impact **inside** the
   * transaction so the cancel set is current, guards it against the caller's
   * previewed snapshot (S1 — 409 on drift), versions the live row (incl. the C1
   * same-day replace), then system-cancels the affected requests.
   */
  async apply(
    intent: ScheduleChangeIntent,
    caller: User,
    previewed: PreviewedCancel[],
  ): Promise<ScheduleChangeResult> {
    this.validate(intent, caller);
    const today = this.today();
    const note = scheduleChangeCancelNote(intent.day_of_week as DayOfWeek, intent.effective_from);

    return this.dataSource.transaction(async (manager) => {
      const impact = await this.computeImpact(intent, today, manager);
      this.assertNoDrift(impact, previewed);

      const live =
        impact.live_row_id == null
          ? null
          : await this.schedules.findActiveForEmployeeDay(
              intent.employee_id,
              intent.day_of_week as DayOfWeek,
              manager,
            );
      const created_row = await this.applyVersioning(impact, intent, live, caller, manager);

      await this.leaves.systemCancel(
        impact.affected_leaves.map((a) => a.id),
        caller.id,
        note,
        manager,
      );
      await this.corrections.systemCancel(
        impact.affected_corrections.map((a) => a.id),
        caller.id,
        note,
        manager,
      );

      return { ...impact, created_row };
    });
  }

  /** Effect the versioning action decided by `cascade-policy.planVersioning`. */
  private async applyVersioning(
    impact: ScheduleChangeImpact,
    intent: ScheduleChangeIntent,
    live: WorkSchedule | null,
    caller: User,
    manager: EntityManager,
  ): Promise<WorkSchedule | null> {
    const newRow = () =>
      this.schedules.create(
        {
          employee_id: intent.employee_id,
          day_of_week: intent.day_of_week as DayOfWeek,
          expected_in: intent.expected_in as string,
          expected_out: intent.expected_out as string,
          break_minutes: intent.break_minutes as number,
          break_start: intent.break_start ?? null,
          effective_from: intent.effective_from,
          created_by: caller.id,
        },
        manager,
      );

    switch (impact.versioning) {
      case 'create':
        return newRow();
      case 'end_and_create':
        await this.schedules.update(
          live!.id,
          { effective_to: dayBefore(intent.effective_from), updated_by: caller.id },
          manager,
        );
        return newRow();
      case 'replace':
        await this.schedules.softDelete(live!.id, caller.id, manager);
        return newRow();
      case 'end_only':
        await this.schedules.update(
          live!.id,
          { effective_to: dayBefore(intent.effective_from), updated_by: caller.id },
          manager,
        );
        return null;
      case 'delete_only':
        await this.schedules.softDelete(live!.id, caller.id, manager);
        return null;
      default:
        return null; // 'noop' is unreachable — computeImpact already threw
    }
  }

  /**
   * Guard the in-transaction recompute against what the admin previewed: if the
   * set of `(kind, id, status)` that will cancel changed (a request slipped in,
   * out, or flipped status), abort with 409 so they re-preview.
   */
  private assertNoDrift(impact: ScheduleChangeImpact, previewed: PreviewedCancel[]): void {
    const key = (c: { kind: string; id: number; status: string }) =>
      `${c.kind}:${c.id}:${c.status}`;
    const now = new Set(
      [...impact.affected_leaves, ...impact.affected_corrections].map((a) => key(a)),
    );
    const then = new Set(previewed.map((c) => key(c)));
    const same = now.size === then.size && [...now].every((k) => then.has(k));
    if (!same) {
      throw new ConflictException(
        'The set of affected requests changed since preview. Re-run preview and try again.',
      );
    }
  }

  /** Overridable so specs can pin "today"; prod uses the business timezone. */
  protected today(): string {
    return businessDateString();
  }

  /**
   * Validate the intent shape + authorize a removal. `modify` must carry a
   * coherent window/break; `remove` needs `SCHEDULE:Delete` (C2 — the static
   * `@Permissions` decorator can't gate on the request body).
   */
  protected validate(intent: ScheduleChangeIntent, caller: User): void {
    if (intent.effective_from < this.today()) {
      throw unprocessable('effective_from', 'effective_from must be today or later');
    }
    if (intent.mode === 'modify') {
      if (
        intent.expected_in == null ||
        intent.expected_out == null ||
        intent.break_minutes == null
      ) {
        throw unprocessable(
          'expected_in',
          'expected_in, expected_out and break_minutes are required for a modify',
        );
      }
      assertWindowOk(intent.expected_in, intent.expected_out);
      assertBreakOk(
        intent.break_minutes,
        intent.break_start ?? null,
        intent.expected_in,
        intent.expected_out,
      );
    }
    if (intent.mode === 'remove') {
      const allowed = caller.system_admin === true || hasPermission(caller, 'SCHEDULE:Delete');
      if (!allowed) {
        throw new ForbiddenException('Removing a schedule requires the SCHEDULE:Delete permission');
      }
    }
  }

  /**
   * The shared engine for preview and apply. When `manager` is present the
   * candidate reads join that transaction (apply's in-txn recompute). Reads run
   * sequentially — a single transaction connection can't multiplex queries.
   */
  protected async computeImpact(
    intent: ScheduleChangeIntent,
    today: string,
    manager?: EntityManager,
  ): Promise<ScheduleChangeImpact> {
    const live = await this.schedules.findActiveForEmployeeDay(
      intent.employee_id,
      intent.day_of_week as DayOfWeek,
      manager,
    );
    const versioning = planVersioning(live, intent);
    if (versioning === 'noop') {
      throw new NotFoundException(
        `No active schedule for employee ${intent.employee_id} on day_of_week ${intent.day_of_week} to remove`,
      );
    }

    const impact: ScheduleChangeImpact = {
      versioning,
      live_row_id: live?.id ?? null,
      affected_leaves: [],
      affected_corrections: [],
      freed_leave_days: 0,
    };

    // 'create' (modify with no live row): no prior schedule governs any date,
    // so nothing can be affected — return the empty impact.
    if (live == null) return impact;

    const leaveCandidates = await this.leaves.findActiveCandidatesForScheduleChange(
      intent.employee_id,
      intent.effective_from,
      manager,
    );
    for (const lv of leaveCandidates) {
      const a = evaluateLeave(lv, live, intent, today);
      if (a && a.decision === 'cancel') impact.affected_leaves.push(a);
    }

    const tcCandidates = await this.corrections.findActiveCandidatesForScheduleChange(
      intent.employee_id,
      intent.effective_from,
      manager,
    );
    for (const tc of tcCandidates) {
      const a = evaluateCorrection(tc, live, intent, today);
      if (a && a.decision === 'cancel') impact.affected_corrections.push(a);
    }

    impact.freed_leave_days = impact.affected_leaves.reduce(
      (sum, a) => sum + (a.working_days ?? 0),
      0,
    );
    return impact;
  }
}
