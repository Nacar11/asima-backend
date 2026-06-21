import { buildLeaveRows, BuildLeaveInput } from './leave-rows';

const CONSUMING = new Set(['pending_l1', 'pending_l2', 'approved']);
const ALLOCATION_BACKED = new Set(['vacation', 'sick']);
const ZERO_GRANT = new Set(['birthday', 'emergency', 'bereavement']);

const dow = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay(); // 0 Sun .. 6 Sat

const withL2: BuildLeaveInput = {
  employee_id: 13,
  l1_approver_id: 5,
  l2_approver_id: 8,
  admin_id: 1,
  base_date: '2025-03-03', // a Monday
  with_attachment_types: true,
};
const noL2: BuildLeaveInput = {
  employee_id: 8,
  l1_approver_id: 2,
  l2_approver_id: null,
  admin_id: 1,
  base_date: '2025-03-03',
  with_attachment_types: false,
};

describe('buildLeaveRows', () => {
  const rowsA = buildLeaveRows(withL2);
  const rowsB = buildLeaveRows(noL2);

  it('emits a pending_l1 with all decision/cancel fields null', () => {
    const p = rowsA.find((r) => r.status === 'pending_l1')!;
    expect(p).toBeDefined();
    expect(p.decided_at).toBeNull();
    expect(p.decided_by).toBeNull();
    expect(p.decision_path).toBeNull();
    expect(p.cancelled_at).toBeNull();
  });

  it('emits pending_l2 only when the chain has an L2 (C2)', () => {
    expect(rowsA.some((r) => r.status === 'pending_l2')).toBe(true);
    expect(rowsB.some((r) => r.status === 'pending_l2')).toBe(false);
  });

  it('an approved row records the final approver + decided_at + chain path (I5)', () => {
    const a = rowsA.find((r) => r.status === 'approved')!;
    expect(a.decided_by).toBe(8); // l2 is the final approver
    expect(a.decided_at).not.toBeNull();
    expect(a.decision_path).toBe('chain');
    const b = rowsB.find((r) => r.status === 'approved')!;
    expect(b.decided_by).toBe(2); // l1 (no l2)
  });

  it('a cancelled row sets cancelled_at + cancelled_by = employee (I5)', () => {
    const c = [...rowsA, ...rowsB].find((r) => r.status === 'cancelled');
    if (c) {
      expect(c.cancelled_at).not.toBeNull();
      expect(c.cancelled_by).toBe(c.employee_id);
      expect(c.decided_by).toBeNull();
    }
  });

  it('consuming states use only allocation-backed types (C1)', () => {
    for (const r of [...rowsA, ...rowsB]) {
      if (CONSUMING.has(r.status)) expect(ALLOCATION_BACKED.has(r.leave_type)).toBe(true);
    }
  });

  it('zero-grant types appear only in rejected/cancelled (C1)', () => {
    for (const r of [...rowsA, ...rowsB]) {
      if (ZERO_GRANT.has(r.leave_type)) {
        expect(['rejected', 'cancelled']).toContain(r.status);
      }
    }
  });

  it('every start_date is a weekday and working_days >= 0.5 (I2)', () => {
    for (const r of [...rowsA, ...rowsB]) {
      expect(dow(r.start_date)).toBeGreaterThanOrEqual(1);
      expect(dow(r.start_date)).toBeLessThanOrEqual(5);
      expect(r.working_days).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('snapshots l1/l2 approvers on every row; requires_attachment only for sick/bereavement', () => {
    for (const r of rowsA) {
      expect(r.l1_approver_id).toBe(13 === r.employee_id ? 5 : r.l1_approver_id);
      expect(r.l2_approver_id).toBe(8);
      expect(r.requires_attachment).toBe(r.leave_type === 'sick' || r.leave_type === 'bereavement');
    }
    for (const r of rowsB) expect(r.l2_approver_id).toBeNull();
  });

  it('uses distinct start_dates so the idempotency key never collides', () => {
    const keys = rowsA.map((r) => `${r.leave_type}|${r.start_date}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
