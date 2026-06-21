/**
 * Pure org-model mapping for the approval-chain seed (no DB / Nest imports, so
 * it's unit-testable). Given the seeded users, returns the chain rows
 * `(employee_id, step, approver_id)` per the plan's table:
 *
 *   EMPLOYEE            -> L1 PM (round-robin), L2 TD (round-robin)
 *   PROJECT_MANAGER     -> L1 TD,               L2 HR
 *   TECHNICAL_DIRECTOR  -> L1 HR                (single level)
 *   OPERATIONS_MANAGER  -> L1 HR                (single level)
 *   HR_ADMIN            -> L1 the other HR      (single level)
 *
 * Invariants guaranteed by construction: the system_admin is skipped; every
 * approver is PM/TD/HR (the approve-capable roles — Mary/OPS never approves,
 * review S3); and `approver_id !== employee_id` (the DB CHECK, review C3).
 */
export interface SeedEmployee {
  id: number;
  role_name: string;
  system_admin?: boolean;
}

export interface ChainRow {
  employee_id: number;
  step: number;
  approver_id: number;
}

const ROLE = {
  PM: 'PROJECT_MANAGER',
  TD: 'TECHNICAL_DIRECTOR',
  HR: 'HR_ADMIN',
  OPS: 'OPERATIONS_MANAGER',
  EMP: 'EMPLOYEE',
} as const;

/**
 * First eligible approver across `pools` (tried in order), rotated from `i`
 * for round-robin, skipping `selfId` and `avoid`. Falls back to ignoring
 * `avoid` if nothing else is available, then throws if truly no one fits.
 */
function pick(selfId: number, i: number, pools: number[][], avoid?: number): number {
  for (const allowAvoid of [false, true]) {
    for (const pool of pools) {
      for (let k = 0; k < pool.length; k++) {
        const cand = pool[(i + k) % pool.length];
        if (cand === undefined || cand === selfId) continue;
        if (!allowAvoid && cand === avoid) continue;
        return cand;
      }
    }
  }
  throw new Error(`approval-chain seed: no eligible approver for employee ${selfId}`);
}

export function assignApprovers(employees: SeedEmployee[]): ChainRow[] {
  const active = employees.filter((e) => !e.system_admin).sort((a, b) => a.id - b.id);
  const idsOf = (role: string) => active.filter((e) => e.role_name === role).map((e) => e.id);
  const PM = idsOf(ROLE.PM);
  const TD = idsOf(ROLE.TD);
  const HR = idsOf(ROLE.HR);

  // Each employee's index within its own role group, for round-robin.
  const indexInRole = new Map<number, number>();
  const counters = new Map<string, number>();
  for (const e of active) {
    const n = counters.get(e.role_name) ?? 0;
    indexInRole.set(e.id, n);
    counters.set(e.role_name, n + 1);
  }

  const rows: ChainRow[] = [];
  for (const e of active) {
    const i = indexInRole.get(e.id) ?? 0;
    let l1: number;
    let l2: number | null = null;

    switch (e.role_name) {
      case ROLE.EMP:
        l1 = pick(e.id, i, [PM, TD, HR]);
        l2 = pick(e.id, i, [TD, PM, HR], l1);
        break;
      case ROLE.PM:
        l1 = pick(e.id, i, [TD, HR, PM]);
        l2 = pick(e.id, i, [HR, TD], l1);
        break;
      case ROLE.TD:
      case ROLE.OPS:
        l1 = pick(e.id, i, [HR, TD, PM]);
        break;
      case ROLE.HR:
        l1 = pick(e.id, i, [HR, TD, PM]); // the other HR first
        break;
      default:
        l1 = pick(e.id, i, [PM, TD, HR]);
    }

    rows.push({ employee_id: e.id, step: 1, approver_id: l1 });
    if (l2 != null) rows.push({ employee_id: e.id, step: 2, approver_id: l2 });
  }
  return rows;
}
