import { TimeCorrectionRequestMapper } from '@/time-correction-requests/persistence/mappers/time-correction-request.mapper';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

function rawEntity(
  overrides: Partial<TimeCorrectionRequestEntity> = {},
): TimeCorrectionRequestEntity {
  return {
    id: 7,
    employee_id: 12,
    target_entry_id: 88,
    work_date: '2026-06-10',
    proposed_time_in: new Date('2026-06-10T09:00:00.000Z'),
    proposed_time_out: null,
    reason: 'x',
    status: 'pending_l1',
    submitted_at: new Date('2026-06-10T19:00:00.000Z'),
    decided_at: null,
    decided_by: null,
    decision_note: null,
    decision_path: null,
    cancelled_at: null,
    cancelled_by: null,
    l1_approver_id: 5,
    l2_approver_id: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-06-10T19:00:00.000Z'),
    updated_at: new Date('2026-06-10T19:00:00.000Z'),
    deleted_at: null,
    ...overrides,
  } as TimeCorrectionRequestEntity;
}

describe('TimeCorrectionRequestMapper.toListItem', () => {
  it('derives employee_name from the joined employee relation', () => {
    const item = TimeCorrectionRequestMapper.toListItem(
      rawEntity({ employee: { first_name: 'Ada', last_name: 'Lovelace' } as UserEntity }),
    );
    expect(item.employee_name).toBe('Ada Lovelace');
    expect(item.id).toBe(7);
  });

  it('falls back to null when the employee relation is not loaded', () => {
    expect(TimeCorrectionRequestMapper.toListItem(rawEntity()).employee_name).toBeNull();
  });

  it('derives l1/l2 approver names from the joined approver relations', () => {
    const item = TimeCorrectionRequestMapper.toListItem(
      rawEntity({
        l1_approver: { first_name: 'Jane', last_name: 'Cruz' } as UserEntity,
        l2_approver: { first_name: 'Bob', last_name: 'Lim' } as UserEntity,
      }),
    );
    expect(item.l1_approver_name).toBe('Jane Cruz');
    expect(item.l2_approver_name).toBe('Bob Lim');
  });

  it('leaves approver names null when those relations are not loaded', () => {
    const item = TimeCorrectionRequestMapper.toListItem(rawEntity());
    expect(item.l1_approver_name).toBeNull();
    expect(item.l2_approver_name).toBeNull();
  });
});
