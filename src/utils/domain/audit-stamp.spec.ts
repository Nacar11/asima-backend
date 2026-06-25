import { AuditStamp } from '@/utils/domain/audit-stamp';

const base = {
  created_by: 1,
  updated_by: 2,
  deleted_by: null,
  created_at: new Date('2026-06-01T00:00:00Z'),
  updated_at: new Date('2026-06-02T00:00:00Z'),
  deleted_at: null,
};

describe('AuditStamp', () => {
  it('exposes the audit fields', () => {
    const stamp = new AuditStamp(base);
    expect(stamp.created_by).toBe(1);
    expect(stamp.updated_by).toBe(2);
    expect(stamp.deleted_by).toBeNull();
    expect(stamp.created_at).toEqual(new Date('2026-06-01T00:00:00Z'));
  });

  it('is not deleted when deleted_at is null', () => {
    expect(new AuditStamp(base).isDeleted()).toBe(false);
  });

  it('is deleted once deleted_at is set', () => {
    const stamp = new AuditStamp({
      ...base,
      deleted_by: 9,
      deleted_at: new Date('2026-06-03T00:00:00Z'),
    });
    expect(stamp.isDeleted()).toBe(true);
    expect(stamp.deleted_by).toBe(9);
  });
});
