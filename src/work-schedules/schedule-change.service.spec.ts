import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ScheduleChangeService } from '@/work-schedules/schedule-change.service';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
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

function live(over: Partial<WorkScheduleRecord> = {}): WorkScheduleRecord {
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
  } as WorkScheduleRecord;
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
const updateOnly = {
  id: 6,
  system_admin: false,
  role: { permissions: [{ code: 'SCHEDULE:Update' }] },
} as unknown as User;

describe('ScheduleChangeService.preview', () => {
  let service: TestService;
  let schedules: jest.Mocked<Pick<BaseWorkScheduleRepository, 'findActiveForEmployeeDay'>>;
  let leaves: jest.Mocked<
    Pick<BaseLeaveRequestRepository, 'findActiveCandidatesForScheduleChange'>
  >;
  let corrections: jest.Mocked<
    Pick<BaseTimeCorrectionRequestRepository, 'findActiveCandidatesForScheduleChange'>
  >;

  beforeEach(() => {
    schedules = { findActiveForEmployeeDay: jest.fn().mockResolvedValue(live()) } as never;
    leaves = { findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]) } as never;
    corrections = {
      findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]),
    } as never;
    service = new TestService(
      schedules as never,
      leaves as never,
      corrections as never,
      {} as never,
    );
  });

  it('rejects an effective_from in the past', async () => {
    await expect(
      service.preview(intent({ effective_from: '2026-06-01' }), admin),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
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
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([
      leaveRow({ working_days: 2, end_date: '2026-07-08' }),
    ] as never);
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

describe('ScheduleChangeService.apply', () => {
  let service: TestService;
  let schedules: {
    findActiveForEmployeeDay: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    softDelete: jest.Mock;
  };
  let leaves: {
    findActiveCandidatesForScheduleChange: jest.Mock;
    systemCancel: jest.Mock;
  };
  let corrections: {
    findActiveCandidatesForScheduleChange: jest.Mock;
    systemCancel: jest.Mock;
  };
  // Runs the transaction callback immediately with a sentinel manager.
  const dataSource = { transaction: jest.fn((cb: (m: unknown) => unknown) => cb('MGR')) };

  beforeEach(() => {
    dataSource.transaction.mockClear();
    schedules = {
      findActiveForEmployeeDay: jest.fn().mockResolvedValue(live()),
      update: jest.fn().mockResolvedValue(live()),
      create: jest.fn().mockResolvedValue(live({ id: 99, effective_from: '2026-06-24' })),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    leaves = {
      findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]),
      systemCancel: jest.fn().mockResolvedValue(0),
    };
    corrections = {
      findActiveCandidatesForScheduleChange: jest.fn().mockResolvedValue([]),
      systemCancel: jest.fn().mockResolvedValue(0),
    };
    service = new TestService(
      schedules as never,
      leaves as never,
      corrections as never,
      dataSource as never,
    );
  });

  it('end_and_create: ends the live row at X-1 and creates the new row', async () => {
    const result = await service.apply(intent(), admin, []);
    expect(schedules.update).toHaveBeenCalledWith(
      88,
      expect.objectContaining({ effective_to: '2026-06-23' }),
      'MGR',
    );
    expect(schedules.create).toHaveBeenCalledWith(
      expect.objectContaining({ effective_from: '2026-06-24', day_of_week: FUTURE_W }),
      'MGR',
    );
    expect(result.created_row?.id).toBe(99);
  });

  it('C1 replace: soft-deletes an un-started live row instead of ending it', async () => {
    schedules.findActiveForEmployeeDay.mockResolvedValue(live({ effective_from: '2026-06-24' }));
    await service.apply(intent(), admin, []);
    expect(schedules.softDelete).toHaveBeenCalledWith(88, admin.id, 'MGR');
    expect(schedules.update).not.toHaveBeenCalled();
    expect(schedules.create).toHaveBeenCalled();
  });

  it('cancels the affected leave inside the transaction', async () => {
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([leaveRow()]);
    await service.apply(intent({ mode: 'remove' }), admin, [
      { kind: 'leave', id: 1, status: 'approved' },
    ]);
    expect(leaves.systemCancel).toHaveBeenCalledWith(
      [1],
      admin.id,
      expect.stringContaining('auto-cancelled'),
      'MGR',
    );
  });

  it('409s when the affected set drifted from the preview snapshot', async () => {
    leaves.findActiveCandidatesForScheduleChange.mockResolvedValue([leaveRow()]);
    // preview snapshot is empty, but recompute now finds a cancel → drift
    await expect(service.apply(intent({ mode: 'remove' }), admin, [])).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(schedules.update).not.toHaveBeenCalled();
    expect(schedules.softDelete).not.toHaveBeenCalled();
  });
});
