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

  it('toDomain preserves the field order that drives JSON wire parity (S2)', () => {
    const domain = LeaveAllocationMapper.toDomain(raw);
    expect(Object.keys(domain)).toEqual([
      'id',
      'employee_id',
      'leave_type',
      'amount',
      'source',
      'reason',
      'granted_by',
      'created_by',
      'updated_by',
      'deleted_by',
      'created_at',
      'updated_at',
      'deleted_at',
    ]);
  });
});
