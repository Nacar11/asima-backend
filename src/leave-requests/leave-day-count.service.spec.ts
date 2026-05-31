import { UnprocessableEntityException } from '@nestjs/common';
import { LeaveDayCountService } from '@/leave-requests/leave-day-count.service';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';

/** Build active-schedule rows for a set of weekdays (0=Sun..6=Sat). */
function scheduleFor(...weekdays: number[]): WorkSchedule[] {
  return weekdays.map((d) => ({ day_of_week: d }) as WorkSchedule);
}

describe('LeaveDayCountService', () => {
  let service: LeaveDayCountService;
  let schedules: { findActiveForEmployee: jest.Mock };

  // Mon–Fri worker.
  const MON_TO_FRI = scheduleFor(1, 2, 3, 4, 5);

  beforeEach(() => {
    schedules = { findActiveForEmployee: jest.fn().mockResolvedValue(MON_TO_FRI) };
    service = new LeaveDayCountService(schedules as unknown as BaseWorkScheduleRepository);
  });

  describe('countWorkingDays', () => {
    it('counts a single workday as 1', async () => {
      // 2026-06-01 is a Monday.
      await expect(service.countWorkingDays(12, '2026-06-01', '2026-06-01')).resolves.toBe(1);
    });

    it('counts only the workdays in a range spanning a weekend (Fri→Mon = 2)', async () => {
      // 2026-06-05 Fri → 2026-06-08 Mon: Sat+Sun excluded.
      await expect(service.countWorkingDays(12, '2026-06-05', '2026-06-08')).resolves.toBe(2);
    });

    it('counts a full Mon–Fri week as 5', async () => {
      await expect(service.countWorkingDays(12, '2026-06-01', '2026-06-05')).resolves.toBe(5);
    });
  });

  describe('assertSubmittableRange (D8)', () => {
    beforeEach(() => {
      jest.spyOn(service, 'today').mockReturnValue('2026-06-01');
    });

    it('returns the working-day count for a valid future range', async () => {
      await expect(service.assertSubmittableRange(12, '2026-06-05', '2026-06-08')).resolves.toBe(2);
    });

    it('rejects a start date in the past', async () => {
      await expect(service.assertSubmittableRange(12, '2026-05-30', '2026-05-30')).rejects.toThrow(
        UnprocessableEntityException,
      );
      await service.assertSubmittableRange(12, '2026-05-30', '2026-05-30').catch((e) => {
        expect(e.getResponse().errors.start_date).toMatch(/past/i);
      });
    });

    it('rejects a start date that is not a scheduled workday', async () => {
      // 2026-06-06 is a Saturday.
      await service.assertSubmittableRange(12, '2026-06-06', '2026-06-08').catch((e) => {
        expect(e.getResponse().errors.start_date).toMatch(/working day/i);
      });
    });

    it('rejects an end date that is not a scheduled workday', async () => {
      // start Fri (ok), end Sat (not a workday).
      await service.assertSubmittableRange(12, '2026-06-05', '2026-06-06').catch((e) => {
        expect(e.getResponse().errors.end_date).toMatch(/working day/i);
      });
    });

    it('rejects when the employee has no work schedule at all', async () => {
      schedules.findActiveForEmployee.mockResolvedValue([]);
      await service.assertSubmittableRange(12, '2026-06-01', '2026-06-01').catch((e) => {
        expect(e.getResponse().errors.start_date).toMatch(/working day/i);
      });
      await expect(
        service.assertSubmittableRange(12, '2026-06-01', '2026-06-01'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
