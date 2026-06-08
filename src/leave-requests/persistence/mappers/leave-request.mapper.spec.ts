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
    working_days: 2,
    day_portion: 'full',
    start_time: null,
    end_time: null,
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

describe('LeaveRequestMapper.toDomain', () => {
  it('maps the day_portion + half-day window snapshot', () => {
    const domain = LeaveRequestMapper.toDomain(
      rawEntity({
        working_days: 0.5,
        day_portion: 'first_half',
        start_time: '09:00:00',
        end_time: '14:00:00',
      }),
    );
    expect(domain.day_portion).toBe('first_half');
    expect(domain.start_time).toBe('09:00:00');
    expect(domain.end_time).toBe('14:00:00');
  });

  it('carries working_days through as a number (0.5 for a half day)', () => {
    const domain = LeaveRequestMapper.toDomain(rawEntity({ working_days: 0.5 }));
    expect(domain.working_days).toBe(0.5);
    expect(typeof domain.working_days).toBe('number');
  });
});
