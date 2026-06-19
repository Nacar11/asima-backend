import { Injectable, NotFoundException } from '@nestjs/common';
import { unprocessable } from '@/utils/helpers/http-errors';
import { BaseApprovalChainRepository } from '@/approval-chains/persistence/base-approval-chain.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { ApprovalChain } from '@/approval-chains/domain/approval-chain';
import { ApprovalChainSearchCriteria } from '@/approval-chains/domain/approval-chain-search-criteria';
import { FindAllApprovalChain } from '@/approval-chains/domain/find-all-approval-chain';
import {
  ActiveChain,
  BulkAssignInput,
  BulkAssignResult,
  BulkAssignSkip,
  BulkReassignResult,
  ChainInsert,
  SetChainInput,
} from '@/approval-chains/domain/approval-chain-inputs';
import { APPROVAL_STEP, ApprovalStep } from '@/approval-chains/approval-chains.constants';

/**
 * Approval-chain service.
 *
 * Owns the "who approves THIS employee's requests" axis (ADR 0001 — kept
 * orthogonal to role). Reassignment is logical-end + insert, committed
 * atomically by the repository so a (employee, step) is never left with
 * two active approvers.
 *
 * Self-approval is rejected at three layers: this service, the DB CHECK
 * (`approver_id <> employee_id`), and the bulk-reassign skip list.
 */
@Injectable()
export class ApprovalChainsService {
  constructor(
    private readonly repository: BaseApprovalChainRepository,
    private readonly users: BaseUserRepository,
  ) {}

  list(criteria: ApprovalChainSearchCriteria): Promise<FindAllApprovalChain> {
    return this.repository.listEmployeesWithChains(criteria);
  }

  /** Matching employee ids for the given filters (backs "select all"). */
  async listIds(criteria: ApprovalChainSearchCriteria): Promise<{ employee_ids: number[] }> {
    const employee_ids = await this.repository.listEmployeeIds(criteria);
    return { employee_ids };
  }

  /** Active L1/L2 approver ids for an employee (flat lookup). */
  async getActive(employee_id: number): Promise<ActiveChain> {
    const active = await this.repository.findActiveForEmployee(employee_id);
    const byStep = new Map(active.map((r) => [r.step, r]));
    return {
      l1_approver_id: byStep.get(APPROVAL_STEP.L1)?.approver_id ?? null,
      l2_approver_id: byStep.get(APPROVAL_STEP.L2)?.approver_id ?? null,
    };
  }

  /** Active L1/L2 chain rows for an employee (for the admin detail view). */
  async getActiveRows(
    employee_id: number,
  ): Promise<{ employee_id: number; l1: ApprovalChain | null; l2: ApprovalChain | null }> {
    await this.assertEmployeeExists(employee_id);
    const active = await this.repository.findActiveForEmployee(employee_id);
    const byStep = new Map(active.map((r) => [r.step, r]));
    return {
      employee_id,
      l1: byStep.get(APPROVAL_STEP.L1) ?? null,
      l2: byStep.get(APPROVAL_STEP.L2) ?? null,
    };
  }

  /**
   * Set / clear one or both steps for an employee. Tri-state per field:
   * `undefined` leaves the step unchanged, `null` clears it, a number
   * sets it. Validates approvers, enforces "no L2 without L1", then ends
   * superseded rows and inserts new ones in one transaction.
   */
  async setChain(
    employee_id: number,
    input: SetChainInput,
    actor_id: number | null,
  ): Promise<ActiveChain> {
    await this.assertEmployeeExists(employee_id);

    if (input.l1_approver_id != null) {
      await this.assertValidApprover(input.l1_approver_id, employee_id);
    }
    if (input.l2_approver_id != null) {
      await this.assertValidApprover(input.l2_approver_id, employee_id);
    }

    const active = await this.repository.findActiveForEmployee(employee_id);
    const { ends, inserts } = this.computeStepChanges(employee_id, active, input, actor_id);

    if (ends.length > 0 || inserts.length > 0) {
      await this.repository.applyStepChanges({ ends, inserts, actor_id });
    }
    return this.getActive(employee_id);
  }

  /**
   * Pure compute: given an employee's current active rows and a tri-state
   * patch, produce the `ends`/`inserts` needed to reach the desired chain.
   * No repo/DB access — both `setChain` (single employee) and `bulkAssign`
   * (accumulate across many employees, one transaction) call this so the
   * end-superseded-then-insert + no-op + L1-before-L2 rules live in ONE
   * place. Throws 422 if the resulting state would have L2 without L1.
   */
  private computeStepChanges(
    employee_id: number,
    currentRows: ApprovalChain[],
    input: SetChainInput,
    actor_id: number | null,
  ): { ends: number[]; inserts: ChainInsert[] } {
    const byStep = new Map(currentRows.map((r) => [r.step, r]));

    // Resulting state after the patch — used to enforce the L1-before-L2
    // invariant regardless of which fields the caller actually sent.
    const resultingL1 =
      input.l1_approver_id === undefined
        ? (byStep.get(APPROVAL_STEP.L1)?.approver_id ?? null)
        : input.l1_approver_id;
    const resultingL2 =
      input.l2_approver_id === undefined
        ? (byStep.get(APPROVAL_STEP.L2)?.approver_id ?? null)
        : input.l2_approver_id;

    if (resultingL2 !== null && resultingL1 === null) {
      throw unprocessable(
        'l1_approver_id',
        'Cannot assign a Level 2 approver without a Level 1 approver.',
      );
    }

    const ends: number[] = [];
    const inserts: ChainInsert[] = [];

    for (const [step, value] of [
      [APPROVAL_STEP.L1, input.l1_approver_id],
      [APPROVAL_STEP.L2, input.l2_approver_id],
    ] as [ApprovalStep, number | null | undefined][]) {
      if (value === undefined) continue; // unchanged
      const current = byStep.get(step);
      if (value === null) {
        if (current) ends.push(current.id); // clear
        continue;
      }
      if (current && current.approver_id === value) continue; // no-op
      if (current) ends.push(current.id);
      inserts.push({ employee_id, step, approver_id: value, created_by: actor_id });
    }

    return { ends, inserts };
  }

  /** End one step without replacing it (the chain shrinks). */
  async endStep(
    employee_id: number,
    step: ApprovalStep,
    actor_id: number | null,
  ): Promise<ActiveChain> {
    const active = await this.repository.findActiveForEmployee(employee_id);
    const row = active.find((r) => r.step === step);
    if (!row) {
      throw new NotFoundException(`No active step ${step} assignment for employee ${employee_id}`);
    }
    // Removing L1 while L2 is still assigned would orphan L2.
    if (step === APPROVAL_STEP.L1 && active.some((r) => r.step === APPROVAL_STEP.L2)) {
      throw unprocessable(
        'step',
        'Cannot remove Level 1 while a Level 2 approver is assigned. Remove or reassign Level 2 first.',
      );
    }
    await this.repository.applyStepChanges({ ends: [row.id], inserts: [], actor_id });
    return this.getActive(employee_id);
  }

  /**
   * "Wherever X is an active approver, replace with Y." Skips rows where
   * the employee IS Y (would make them their own approver) and reports
   * the skipped employee_ids. All end+insert pairs commit atomically.
   */
  async bulkReassign(
    from_approver_id: number,
    to_approver_id: number,
    actor_id: number | null,
  ): Promise<BulkReassignResult> {
    if (from_approver_id === to_approver_id) {
      throw unprocessable('to_approver_id', 'from and to approver must differ.');
    }
    await this.assertUserActive(to_approver_id);

    const rows = await this.repository.findActiveByApprover(from_approver_id);
    const ends: number[] = [];
    const inserts: ChainInsert[] = [];
    const skipped: number[] = [];

    for (const row of rows) {
      if (row.employee_id === to_approver_id) {
        skipped.push(row.employee_id);
        continue;
      }
      ends.push(row.id);
      inserts.push({
        employee_id: row.employee_id,
        step: row.step,
        approver_id: to_approver_id,
        created_by: actor_id,
      });
    }

    if (ends.length > 0 || inserts.length > 0) {
      await this.repository.applyStepChanges({ ends, inserts, actor_id });
    }
    return { reassigned: inserts.length, skipped };
  }

  /**
   * Assign an L1 (and optionally L2) approver to a LIST of employees in one
   * atomic operation — the inverse of `bulkReassign` (source is an explicit
   * employee set, not an existing approver). L1 is required (enforced by the
   * DTO), so "L2 without L1" cannot arise. An employee who IS one of the
   * chosen approvers is skipped (would violate the DB CHECK
   * `approver_id <> employee_id`) and reported; everyone else commits
   * through a single `applyStepChanges` transaction.
   */
  async bulkAssign(
    employee_ids: number[],
    input: BulkAssignInput,
    actor_id: number | null,
  ): Promise<BulkAssignResult> {
    const ids = [...new Set(employee_ids)];
    if (ids.length === 0) {
      throw unprocessable('employee_ids', 'Select at least one employee.');
    }

    await this.assertUserActive(input.l1_approver_id);
    if (input.l2_approver_id != null) {
      await this.assertUserActive(input.l2_approver_id);
    }

    const activeRows = await this.repository.findActiveForEmployees(ids);
    const rowsByEmployee = new Map<number, ApprovalChain[]>();
    for (const row of activeRows) {
      const list = rowsByEmployee.get(row.employee_id) ?? [];
      list.push(row);
      rowsByEmployee.set(row.employee_id, list);
    }

    const ends: number[] = [];
    const inserts: ChainInsert[] = [];
    const skipped: BulkAssignSkip[] = [];
    let assigned = 0;

    for (const employee_id of ids) {
      if (employee_id === input.l1_approver_id || employee_id === input.l2_approver_id) {
        skipped.push({ employee_id, reason: 'self_approval' });
        continue;
      }
      const current = rowsByEmployee.get(employee_id) ?? [];
      const change = this.computeStepChanges(employee_id, current, input, actor_id);
      if (change.ends.length > 0 || change.inserts.length > 0) {
        assigned += 1;
        ends.push(...change.ends);
        inserts.push(...change.inserts);
      }
    }

    if (ends.length > 0 || inserts.length > 0) {
      await this.repository.applyStepChanges({ ends, inserts, actor_id });
    }
    return { assigned, skipped };
  }

  // ── validation helpers ────────────────────────────────────────────

  private async assertEmployeeExists(employee_id: number): Promise<void> {
    const employee = await this.users.findById(employee_id);
    if (!employee) {
      throw new NotFoundException(`User with id ${employee_id} not found`);
    }
  }

  private async assertValidApprover(approver_id: number, employee_id: number): Promise<void> {
    if (approver_id === employee_id) {
      throw unprocessable('approver_id', 'An employee cannot be their own approver.');
    }
    await this.assertUserActive(approver_id);
  }

  private async assertUserActive(user_id: number): Promise<void> {
    const user = await this.users.findById(user_id);
    if (!user) {
      throw unprocessable('approver_id', `Approver ${user_id} not found.`);
    }
    if (!user.is_active) {
      throw unprocessable('approver_id', `Approver ${user_id} is inactive.`);
    }
  }
}
