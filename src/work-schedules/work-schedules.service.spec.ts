import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { WorkSchedulesService } from './work-schedules.service';
import { BaseWorkScheduleRepository } from './persistence/base-work-schedule.repository';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { WorkScheduleRecord } from './domain/work-schedule';
import { WorkScheduleCreated, WorkScheduleEnded } from './domain/events/work-schedule-events';
import { DAY_OF_WEEK } from './work-schedules.constants';

describe('WorkSchedulesService', () => {
  let service: WorkSchedulesService;
  let repo: jest.Mocked<BaseWorkScheduleRepository>;
  let publisher: { publish: jest.Mock };

  const fakeActive: WorkScheduleRecord = {
    id: 50,
    employee_id: 12,
    day_of_week: DAY_OF_WEEK.MONDAY,
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
    break_start: '12:00:00',
    effective_from: '2026-05-23',
    effective_to: null,
    created_by: 1,
    updated_by: 1,
    deleted_by: null,
    created_at: new Date('2026-05-23'),
    updated_at: new Date('2026-05-23'),
    deleted_at: null,
  };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findActiveForEmployee: jest.fn(),
      findActiveForEmployeeDay: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    publisher = { publish: jest.fn() };
    service = new WorkSchedulesService(repo, publisher as unknown as DomainEventPublisher);
  });

  describe('create', () => {
    it('rejects expected_out <= expected_in', async () => {
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '18:00:00',
          expected_out: '09:00:00',
          break_minutes: 60,
          effective_from: '2026-05-23',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects negative break_minutes', async () => {
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: -10,
          effective_from: '2026-05-23',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('rejects a second active row for the same (employee, day_of_week)', async () => {
      repo.findActiveForEmployeeDay.mockResolvedValue(fakeActive);
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '08:00:00',
          expected_out: '17:00:00',
          break_minutes: 30,
          break_start: '12:00:00',
          effective_from: '2026-06-01',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects break_minutes > 0 when break_start is missing', async () => {
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: 60,
          effective_from: '2026-05-23',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a break_start earlier than expected_in', async () => {
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: 60,
          break_start: '08:30:00',
          effective_from: '2026-05-23',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('rejects a break that overruns expected_out', async () => {
      await expect(
        service.create({
          employee_id: 12,
          day_of_week: DAY_OF_WEEK.MONDAY,
          expected_in: '09:00:00',
          expected_out: '18:00:00',
          break_minutes: 60,
          break_start: '17:30:00', // 17:30 + 60min = 18:30 > 18:00
          effective_from: '2026-05-23',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('allows break_minutes = 0 with no break_start', async () => {
      repo.findActiveForEmployeeDay.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...fakeActive, break_minutes: 0, break_start: null });
      const result = await service.create({
        employee_id: 12,
        day_of_week: DAY_OF_WEEK.MONDAY,
        expected_in: '09:00:00',
        expected_out: '18:00:00',
        break_minutes: 0,
        effective_from: '2026-05-23',
        created_by: 1,
      });
      expect(result.break_minutes).toBe(0);
    });

    it('creates with a valid break_start inside the window', async () => {
      repo.findActiveForEmployeeDay.mockResolvedValue(null);
      repo.create.mockResolvedValue(fakeActive);
      const result = await service.create({
        employee_id: 12,
        day_of_week: DAY_OF_WEEK.MONDAY,
        expected_in: '09:00:00',
        expected_out: '18:00:00',
        break_minutes: 60,
        break_start: '12:00:00',
        effective_from: '2026-05-23',
        created_by: 1,
      });
      expect(result).toBe(fakeActive);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ break_start: '12:00:00' }),
      );
      expect(publisher.publish).toHaveBeenCalledWith([expect.any(WorkScheduleCreated)]);
    });
  });

  describe('update', () => {
    it('throws NotFoundException for missing id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update(404, { break_minutes: 30 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects expected_out <= expected_in when both supplied', async () => {
      repo.findById.mockResolvedValue(fakeActive);
      await expect(
        service.update(50, { expected_in: '18:00:00', expected_out: '09:00:00' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('applies a valid patch', async () => {
      repo.findById.mockResolvedValue(fakeActive);
      repo.update.mockResolvedValue({ ...fakeActive, break_minutes: 30 });
      const result = await service.update(50, { break_minutes: 30, updated_by: 2 });
      expect(result.break_minutes).toBe(30);
      expect(repo.update).toHaveBeenCalledWith(50, { break_minutes: 30, updated_by: 2 });
      // An admin edit is not a downstream timesheet fact (decision #5/#6).
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('clears break_start to null when the patch sets it to null (=== !== undefined merge)', async () => {
      repo.findById.mockResolvedValue(fakeActive);
      repo.update.mockResolvedValue({ ...fakeActive, break_minutes: 0, break_start: null });

      await service.update(50, { break_minutes: 0, break_start: null });

      expect(repo.update).toHaveBeenCalledWith(50, { break_minutes: 0, break_start: null });
    });

    it('rejects a patched break_start that overruns expected_out', async () => {
      // existing window 09:00–18:00, break 60min; move break to 17:30 → 18:30 > 18:00
      repo.findById.mockResolvedValue(fakeActive);
      await expect(service.update(50, { break_start: '17:30:00' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('endLogically', () => {
    it('sets effective_to to today when ending an active row', async () => {
      repo.findById.mockResolvedValue(fakeActive);
      repo.update.mockResolvedValue({ ...fakeActive, effective_to: '2026-05-30' });
      const result = await service.endLogically(50, '2026-05-30', 1);
      expect(result.effective_to).toBe('2026-05-30');
      expect(repo.update).toHaveBeenCalledWith(50, {
        effective_to: '2026-05-30',
        updated_by: 1,
      });
      const published = publisher.publish.mock.calls[0][0];
      expect(published[0]).toBeInstanceOf(WorkScheduleEnded);
      expect(published[0].work_schedule_id).toBe(50);
    });

    it('refuses to logically end an already-ended row', async () => {
      repo.findById.mockResolvedValue({ ...fakeActive, effective_to: '2026-05-01' });
      await expect(service.endLogically(50, '2026-05-30', 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('softDelete', () => {
    it('delegates to repo after existence check', async () => {
      repo.findById.mockResolvedValue(fakeActive);
      repo.softDelete.mockResolvedValue(undefined);
      await service.softDelete(50, 1);
      expect(repo.softDelete).toHaveBeenCalledWith(50, 1);
    });

    it('throws NotFoundException for missing id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.softDelete(404, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findActiveForEmployee', () => {
    it('returns the repository result unchanged', async () => {
      repo.findActiveForEmployee.mockResolvedValue([fakeActive]);
      const result = await service.findActiveForEmployee(12);
      expect(result).toEqual([fakeActive]);
    });
  });
});
