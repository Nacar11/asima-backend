import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { ScheduleChangeService } from '@/work-schedules/schedule-change.service';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { ScheduleChangeIntent } from '@/work-schedules/domain/schedule-change';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { weekdayOf } from '@/utils/helpers/dates';
import { User } from '@/users/domain/user';

const TODAY = '2026-06-22';
const FUTURE_W = weekdayOf('2026-07-01') as DayOfWeek;

class TestService extends ScheduleChangeService {
  protected today(): string {
    return TODAY;
  }
}

function live(over: Partial<WorkSchedule> = {}): WorkSchedule {
  return {
    id: 88,
    employee_id: 12,
    day_of_week: FUTURE_W,
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
    break_start: '12:00:00',
    effective_from: '2026-01-01',
    effective_to: null,
    created_by: 1,
    updated_by: null,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...over,
  } as WorkSchedule;
}

function intent(over: Partial<ScheduleChangeIntent> = {}): ScheduleChangeIntent {
  return {
    employee_id: 12,
    day_of_week: FUTURE_W,
    effective_from: '2026-06-24',
    mode: 'modify',
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
    break_start: '12:00:00',
    ...over,
  };
}

function leaveRow(over: Record<string, unknown> = {}) {
  return {
    id: 1,
    employee_id: 12,
    start_date: '2026-07-01',
    end_date: '2026-07-01',
    day_portion: 'full',
    status: 'approved',
    leave_type: 'vacation',
    working_days: 1,
    ...over,
  };
}

function correctionRow(over: Record<string, unknown> = {}) {
  return { id: 1, employee_id: 12, work_date: '2026-07-01', status: 'approved', ...over };
}

const admin = { id: 5, system_admin: true } as User;
const updateOnly = { id: 6, system_admin: false, role: { permissions: [{ code: 'SCHEDULE:Update' }] } } as unknown as User;

describe('ScheduleChangeService.preview', () => {
  let service: TestService;
  let schedules: jest.Mocked<Pick<BaseWorkScheduleRepository, 'findActiveForEmployeeDay'>>;
  let leaves: jest.Mocked<Pick<BaseLeaveRequestRepository, 'findActiveCandidatesForScheduleChange'>>;
  let corrections: jest.Mocked<Pick<BaseTimeCorrectionRequestRepository, 'findActiveCandidatesForScheduleChange'>>;

  beforeEach(() => {
    schedules = { findActiveForEmployeeDay: jest.fn().mockResolvedValue(live()) } as never;
    leaves = { findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]) } as never;
    corrections = { findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]) } as never;
    service = new TestService(schedules as never, leaves as never, corrections as never);
  });

  it('rejects an effective_from in the past', async () => {
    await expect(service.preview(intent({ effective_from: '2026-06-01' }), admin)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('rejects a remove without SCHEDULE:Delete', async () => {
    await expect(service.preview(intent({ mode: 'remove' }), updateOnly)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('modify with no live row → versioning create, no cascade', async () => {
    schedules.findActiveForEmployeeDay.mockResolvedValue(null);
    const out = await service.preview(intent(), admin);
    expect(out.versioning).toBe('create');
    expect(out.affected_leaves).toHaveLength(0);
    expect(leaves.findActiveCandidatesForScheduleChange).not.toHaveBeenCalled();
  });

  it('remove with no live row → 404', async () => {
    schedules.findActiveForEmployeeDay.mockResolvedValue(null);
    await expect(service.preview(intent({ mode: 'remove' }), admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('full-day future leave is NOT cancelled by a pure window change', async () => {
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([leaveRow()] as never);
    const out = await service.preview(intent({ expected_in: '10:00:00' }), admin);
    expect(out.affected_leaves).toHaveLength(0);
    expect(out.freed_leave_days).toBe(0);
  });

  it('removal cancels a full-day future leave and frees its days', async () => {
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([leaveRow({ working_days: 2, end_date: '2026-07-08' })] as never);
    const out = await service.preview(intent({ mode: 'remove' }), admin);
    expect(out.affected_leaves).toHaveLength(1);
    expect(out.affected_leaves[0].trigger_dates).toContain('2026-07-01');
    expect(out.freed_leave_days).toBe(2);
  });

  it('window change cancels a half-day future leave', async () => {
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([
      leaveRow({ day_portion: 'first_half', working_days: 0.5 }),
    ] as never);
    const out = await service.preview(intent({ expected_in: '10:00:00' }), admin);
    expect(out.affected_leaves).toHaveLength(1);
    expect(out.freed_leave_days).toBe(0.5);
  });

  it('approved in-progress leave is kept (not cancelled) on removal', async () => {
    // range spans TODAY; governed future date on the changed weekday
    const inProgressW = weekdayOf('2026-06-27') as DayOfWeek;
    schedules.findActiveForEmployeeDay.mockResolvedValue(live({ day_of_week: inProgressW }));
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([
      leaveRow({ start_date: '2026-06-20', end_date: '2026-06-29' }),
    ] as never);
    const out = await service.preview(
      intent({ mode: 'remove', day_of_week: inProgressW, effective_from: '2026-06-22' }),
      admin,
    );
    expect(out.affected_leaves).toHaveLength(0);
  });

  it('window change cancels a future correction', async () => {
    corrections.findActiveCandidatesForScheduleChange.mockResolvedValue([correctionRow()] as never);
    const out = await service.preview(intent({ expected_out: '17:00:00' }), admin);
    expect(out.affected_corrections).toHaveLength(1);
    expect(out.affected_corrections[0].kind).toBe('time_correction');
  });
});
