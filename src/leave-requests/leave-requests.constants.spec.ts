import { LEAVE_TYPES } from '@/leave-requests/leave-requests.constants';

describe('LEAVE_TYPES', () => {
  it('is exactly vacation, sick, bereavement, birthday, emergency', () => {
    expect(Object.values(LEAVE_TYPES).sort()).toEqual(
      ['bereavement', 'birthday', 'emergency', 'sick', 'vacation'].sort(),
    );
  });

  it('no longer includes the retired annual/unpaid/other types', () => {
    const values = Object.values(LEAVE_TYPES) as string[];
    expect(values).not.toContain('annual');
    expect(values).not.toContain('unpaid');
    expect(values).not.toContain('other');
  });
});
