import { ApprovalChain } from '@/approval-chains/domain/approval-chain';
import { ApprovalChainSearchCriteria } from '@/approval-chains/domain/approval-chain-search-criteria';
import { FindAllApprovalChain } from '@/approval-chains/domain/find-all-approval-chain';

/**
 * Port for approval-chain persistence. The service depends on this
 * abstract class; the concrete `ApprovalChainRepository` binds to it in
 * the persistence module, and unit tests mock it.
 */
export abstract class BaseApprovalChainRepository {
  /** Active rows (ended_at IS NULL) for one employee, ordered by step. */
  abstract findActiveForEmployee(employee_id: number): Promise<ApprovalChain[]>;

  /** Active rows (ended_at IS NULL) where a given user is the approver. */
  abstract findActiveByApprover(approver_id: number): Promise<ApprovalChain[]>;

  /** Full history (active + ended) for one employee, newest first. */
  abstract findAllForEmployee(employee_id: number): Promise<ApprovalChain[]>;

  /** Paginated list of active employees with their resolved L1/L2 approver. */
  abstract listEmployeesWithChains(
    criteria: ApprovalChainSearchCriteria,
  ): Promise<FindAllApprovalChain>;

  /**
   * Atomically end the given active rows and insert the given new rows in
   * a single transaction. The service computes `ends`/`inserts` from the
   * desired chain state; this method just commits them together so a
   * reassignment can never leave two active rows for one (employee, step).
   */
  abstract applyStepChanges(input: {
    ends: number[];
    inserts: {
      employee_id: number;
      step: number;
      approver_id: number;
      created_by: number | null;
    }[];
    actor_id: number | null;
  }): Promise<void>;
}
