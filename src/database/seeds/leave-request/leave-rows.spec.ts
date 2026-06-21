import { buildLeaveRows, BuildLeaveInput } from './leave-rows';

const ALLOCATION_BACKED = new Set(['vacation', 'sick']);
const dow = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay(); // 0 Sun .. 6 Sat

const mk = (over: Partial<BuildLeaveInput> = {}): BuildLeaveInput => ({
  employee_id: 13,
  l1_approver_id: 5,
  l2_approver_id: 8,
  admin_id: 1,
  base_date: '2025-03-03', // a Monday
  with_attachment_types: true,
  variant_index: 0,
  ...over,
});

const pendingL1 = (input: BuildLeaveInput) =>
  buildLeaveRows(input).find((r) => r.status === 'pending_l1')!;

describe('buildLeaveRows', () => {
  const rowsA = buildLeaveRows(mk());
  const rowsB = buildLeaveRows(
    mk({ employee_id: 8, l1_approver_id: 2, l2_approver_id: null, with_attachment_types: false }),
  );

  it('emits a pending_l1 with all decision/cancel fields null', () => {
    const p = rowsA.find((r) => r.status === 'pending_l1')!;
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
    expect(a.decided_by).toBe(8);
    expect(a.decision_path).toBe('chain');
    expect(
      buildLeaveRows(mk({ l2_approver_id: null })).find((r) => r.status === 'approved')!.decided_by,
    ).toBe(5);
  });

  it('a cancelled row sets cancelled_at + cancelled_by = employee (I5)', () => {
    const c = [...rowsA, ...rowsB].find((r) => r.status === 'cancelled');
    if (c) {
      expect(c.cancelled_at).not.toBeNull();
      expect(c.cancelled_by).toBe(c.employee_id);
      expect(c.decided_by).toBeNull();
    }
  });

  it('approved rows use only allocation-backed types (C1 — balance stays clean)', () => {
    for (const r of [...rowsA, ...rowsB]) {
      if (r.status === 'approved') expect(ALLOCATION_BACKED.has(r.leave_type)).toBe(true);
    }
  });

  it('makes pending L1 a sick request (with cert) for attachment employees', () => {
    for (const v of [0, 1, 2, 3]) {
      const p = pendingL1(mk({ variant_index: v }));
      expect(p.leave_type).toBe('sick');
      expect(p.requires_attachment).toBe(true);
    }
  });

  it('rotates non-attachment pending L1 across vacation/birthday/emergency (no sick)', () => {
    const noAtt = (v: number) => pendingL1(mk({ with_attachment_types: false, variant_index: v }));
    expect(noAtt(0).leave_type).toBe('vacation');
    expect(noAtt(1).leave_type).toBe('birthday');
    expect(noAtt(2).leave_type).toBe('vacation');
    expect(noAtt(3).leave_type).toBe('emergency');
    expect(noAtt(1).requires_attachment).toBe(false);
  });

  it('produces a half-day (first_half, 0.5d) for a half-eligible pending type', () => {
    const p = pendingL1(mk({ variant_index: 0 })); // vacation, duration slot 0
    expect(p.day_portion).toBe('first_half');
    expect(p.working_days).toBe(0.5);
    expect(p.start_date).toBe(p.end_date);
  });

  it('produces a 2-day range (working_days 2) with a later weekday end_date', () => {
    const p = pendingL1(mk({ variant_index: 1 })); // sick, duration slot 1 -> 2-day
    expect(p.working_days).toBe(2);
    expect(p.day_portion).toBe('full');
    expect(new Date(p.end_date).getTime()).toBeGreaterThan(new Date(p.start_date).getTime());
    expect(dow(p.end_date)).toBeGreaterThanOrEqual(1);
    expect(dow(p.end_date)).toBeLessThanOrEqual(5);
  });

  it('staggers the pending start date across employees', () => {
    expect(pendingL1(mk({ variant_index: 0 })).start_date).not.toBe(
      pendingL1(mk({ variant_index: 5 })).start_date,
    );
  });

  it('every start_date is a weekday and working_days >= 0.5 (I2)', () => {
    for (const r of [...rowsA, ...rowsB]) {
      expect(dow(r.start_date)).toBeGreaterThanOrEqual(1);
      expect(dow(r.start_date)).toBeLessThanOrEqual(5);
      expect(r.working_days).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('snapshots l1/l2 approvers; requires_attachment only for sick/bereavement', () => {
    for (const r of rowsA) {
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
