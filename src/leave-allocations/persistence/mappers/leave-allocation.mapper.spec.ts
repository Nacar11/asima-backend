import { LeaveAllocationMapper } from '@/leave-allocations/persistence/mappers/leave-allocation.mapper';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';

describe('LeaveAllocationMapper', () => {
  const raw: LeaveAllocationEntity = {
    id: 7,
    employee_id: 12,
    leave_type: 'vacation',
    amount: 10,
    source: 'default',
    reason: null,
    granted_by: null,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    created_at: new Date('2026-05-31T00:00:00Z'),
    updated_at: new Date('2026-05-31T00:00:00Z'),
    deleted_at: null,
  } as LeaveAllocationEntity;

  it('toDomain maps every field', () => {
    const domain = LeaveAllocationMapper.toDomain(raw);
    expect(domain).toMatchObject({
      id: 7,
      employee_id: 12,
      leave_type: 'vacation',
      amount: 10,
      source: 'default',
      granted_by: null,
    });
  });

  it('toPersistence sets only the provided fields (append-only create)', () => {
    const entity = LeaveAllocationMapper.toPersistence({
      employee_id: 12,
      leave_type: 'emergency',
      amount: 3,
      source: 'admin_grant',
      granted_by: 5,
    });
    expect(entity.employee_id).toBe(12);
    expect(entity.leave_type).toBe('emergency');
    expect(entity.amount).toBe(3);
    expect(entity.source).toBe('admin_grant');
    expect(entity.granted_by).toBe(5);
    expect(entity.id).toBeUndefined();
  });
});
