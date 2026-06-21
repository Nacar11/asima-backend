import { buildCorrectionRows, BuildCorrectionInput, SeedEntry } from './correction-rows';

const entries: SeedEntry[] = [
  {
    id: 100,
    work_date: '2025-03-03',
    time_in: new Date('2025-03-03T09:00:00Z'),
    time_out: new Date('2025-03-03T18:00:00Z'),
  },
  {
    id: 101,
    work_date: '2025-03-04',
    time_in: new Date('2025-03-04T09:00:00Z'),
    time_out: new Date('2025-03-04T18:00:00Z'),
  },
  {
    id: 102,
    work_date: '2025-03-05',
    time_in: new Date('2025-03-05T09:00:00Z'),
    time_out: new Date('2025-03-05T18:00:00Z'),
  },
];

const withL2: BuildCorrectionInput = {
  employee_id: 13,
  l1_approver_id: 5,
  l2_approver_id: 8,
  admin_id: 1,
  entries,
};
const noL2: BuildCorrectionInput = {
  ...withL2,
  employee_id: 14,
  l1_approver_id: 2,
  l2_approver_id: null,
};
const oneEntry: BuildCorrectionInput = { ...withL2, employee_id: 15, entries: [entries[0]!] };

describe('buildCorrectionRows', () => {
  const rowsA = buildCorrectionRows(withL2);

  it('emits a pending_l1 referencing a seeded entry, decision fields null', () => {
    const p = rowsA.find((r) => r.status === 'pending_l1')!;
    expect(p.target_entry_id).toBe(100);
    expect(p.decided_by).toBeNull();
    expect(p.decision_path).toBeNull();
  });

  it('an approved row records the final approver + decided_at + chain path (I5)', () => {
    expect(rowsA.find((r) => r.status === 'approved')!.decided_by).toBe(8);
    expect(rowsA.find((r) => r.status === 'approved')!.decision_path).toBe('chain');
    expect(buildCorrectionRows(noL2).find((r) => r.status === 'approved')!.decided_by).toBe(2);
  });

  it('emits a "missing punch" row with null target and null proposed_time_out (R8)', () => {
    const m = rowsA.find((r) => r.target_entry_id === null)!;
    expect(m).toBeDefined();
    expect(m.proposed_time_out).toBeNull();
  });

  it('respects the CHECK: proposed_time_out > proposed_time_in when present', () => {
    for (const r of rowsA) {
      if (r.proposed_time_out) {
        expect(r.proposed_time_out.getTime()).toBeGreaterThan(r.proposed_time_in.getTime());
      }
    }
  });

  it('always sets a non-empty reason (NOT NULL, R7)', () => {
    for (const r of rowsA) expect(r.reason.length).toBeGreaterThan(0);
  });

  it('uses distinct work_dates (idempotency key never collides)', () => {
    const dates = rowsA.map((r) => r.work_date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('snapshots l2_approver_id and degrades to fewer rows with fewer entries', () => {
    for (const r of rowsA) expect(r.l2_approver_id).toBe(8);
    const one = buildCorrectionRows(oneEntry);
    expect(one).toHaveLength(1);
    expect(one[0]!.status).toBe('pending_l1');
  });
});
