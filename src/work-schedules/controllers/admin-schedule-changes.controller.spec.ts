import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/permissions/permissions.decorator';
import { AdminScheduleChangesController, toIntent } from './admin-schedule-changes.controller';
import { ScheduleChangeDto } from '@/work-schedules/dto/admin/schedule-change.dto';

describe('AdminScheduleChangesController — route gating', () => {
  const reflector = new Reflector();
  const meta = (fn: (...args: never[]) => unknown) => reflector.get(PERMISSIONS_KEY, fn);

  it('preview is gated by SCHEDULE:Update (remove also needs Delete, checked in the service)', () => {
    expect(meta(AdminScheduleChangesController.prototype.preview)).toEqual({ SCHEDULE: 'Update' });
  });
});

describe('toIntent', () => {
  it('maps the DTO to the domain intent and defaults break_start to null', () => {
    const dto: ScheduleChangeDto = {
      employee_id: 12,
      day_of_week: 1,
      effective_from: '2026-06-24',
      mode: 'remove',
    } as ScheduleChangeDto;
    expect(toIntent(dto)).toEqual({
      employee_id: 12,
      day_of_week: 1,
      effective_from: '2026-06-24',
      mode: 'remove',
      expected_in: undefined,
      expected_out: undefined,
      break_minutes: undefined,
      break_start: null,
    });
  });
});
