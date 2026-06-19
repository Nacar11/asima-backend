import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { assertBreakOk, assertWindowOk } from '@/work-schedules/work-schedules.service';
import {
  ScheduleChangeImpact,
  ScheduleChangeIntent,
} from '@/work-schedules/domain/schedule-change';
import { evaluateCorrection, evaluateLeave, planVersioning } from '@/work-schedules/domain/cascade-policy';
import { businessDateString } from '@/utils/helpers/dates';
import { unprocessable } from '@/utils/helpers/http-errors';
import { hasPermission } from '@/users/domain/user-permissions';
import { User } from '@/users/domain/user';

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
  ) {}

  /** Dry-run: compute the impact of a change without writing anything. */
  async preview(intent: ScheduleChangeIntent, caller: User): Promise<ScheduleChangeImpact> {
    this.validate(intent, caller);
    return this.computeImpact(intent, this.today());
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
        throw unprocessable('expected_in', 'expected_in, expected_out and break_minutes are required for a modify');
      }
      assertWindowOk(intent.expected_in, intent.expected_out);
      assertBreakOk(intent.break_minutes, intent.break_start ?? null, intent.expected_in, intent.expected_out);
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
  ): Promise<ScheduleChangeImpact> {
    const live = await this.schedules.findActiveForEmployeeDay(
      intent.employee_id,
      intent.day_of_week,
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
    );
    for (const lv of leaveCandidates) {
      const a = evaluateLeave(lv, live, intent, today);
      if (a && a.decision === 'cancel') impact.affected_leaves.push(a);
    }

    const tcCandidates = await this.corrections.findActiveCandidatesForScheduleChange(
      intent.employee_id,
      intent.effective_from,
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
