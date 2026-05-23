import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { WorkSchedulesService } from './work-schedules.service';
import { BaseWorkScheduleRepository } from './persistence/base-work-schedule.repository';
import { WorkSchedule } from './domain/work-schedule';
import { DAY_OF_WEEK } from './work-schedules.constants';

describe('WorkSchedulesService', () => {
  let service: WorkSchedulesService;
  let repo: jest.Mocked<BaseWorkScheduleRepository>;

  const fakeActive: WorkSchedule = {
    id: 50,
    employee_id: 12,
    day_of_week: DAY_OF_WEEK.MONDAY,
    expected_in: '09:00:00',
    expected_out: '18:00:00',
    break_minutes: 60,
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
    service = new WorkSchedulesService(repo);
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
          effective_from: '2026-06-01',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates when no active row exists for that (employee, day)', async () => {
      repo.findActiveForEmployeeDay.mockResolvedValue(null);
      repo.create.mockResolvedValue(fakeActive);
      const result = await service.create({
        employee_id: 12,
        day_of_week: DAY_OF_WEEK.MONDAY,
        expected_in: '09:00:00',
        expected_out: '18:00:00',
        break_minutes: 60,
        effective_from: '2026-05-23',
        created_by: 1,
      });
      expect(result).toBe(fakeActive);
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
