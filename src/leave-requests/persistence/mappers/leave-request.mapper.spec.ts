import { LeaveRequestMapper } from '@/leave-requests/persistence/mappers/leave-request.mapper';
import { LeaveRequestEntity } from '@/leave-requests/persistence/entities/leave-request.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/** Minimal raw entity for mapper tests. */
function rawEntity(overrides: Partial<LeaveRequestEntity> = {}): LeaveRequestEntity {
  return {
    id: 1,
    employee_id: 12,
    leave_type: 'vacation',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    reason: null,
    status: 'pending_l1',
    submitted_at: new Date('2026-05-30T10:00:00.000Z'),
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
    created_at: new Date('2026-05-30T10:00:00.000Z'),
    updated_at: new Date('2026-05-30T10:00:00.000Z'),
    deleted_at: null,
    ...overrides,
  } as LeaveRequestEntity;
}

describe('LeaveRequestMapper.toListItem', () => {
  it('derives employee_name from the joined employee relation', () => {
    const raw = rawEntity({
      employee: { first_name: 'Ada', last_name: 'Lovelace' } as UserEntity,
    });
    const item = LeaveRequestMapper.toListItem(raw);
    expect(item.employee_name).toBe('Ada Lovelace');
    expect(item.id).toBe(1);
    expect(item.leave_type).toBe('vacation');
  });

  it('falls back to null when the employee relation is not loaded', () => {
    const item = LeaveRequestMapper.toListItem(rawEntity());
    expect(item.employee_name).toBeNull();
  });
});
