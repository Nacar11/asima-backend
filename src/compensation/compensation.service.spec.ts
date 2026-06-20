import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { CompensationService } from './compensation.service';
import { BaseCompensationRepository } from './persistence/base-compensation.repository';
import { Compensation } from './domain/compensation';
import { deriveHourlyRate, COMPENSATION_MONTHLY_HOURS_DIVISOR } from './compensation.constants';

const PG_UNIQUE_VIOLATION = '23505';

function fakeRow(over: Partial<Compensation> = {}): Compensation {
  return {
    id: 1,
    employee_id: 12,
    monthly_salary: 50000,
    hourly_rate: deriveHourlyRate(50000),
    hourly_rate_is_overridden: false,
    effective_from: '2000-01-01',
    effective_to: null,
    created_by: 1,
    updated_by: 1,
    deleted_by: null,
    created_at: new Date('2000-01-01'),
    updated_at: new Date('2000-01-01'),
    deleted_at: null,
    ...over,
  };
}

describe('CompensationService', () => {
  let service: CompensationService;
  let repo: jest.Mocked<BaseCompensationRepository>;
  // Runs the transaction callback immediately with a sentinel manager.
  const dataSource = { transaction: jest.fn((cb: (m: unknown) => unknown) => cb('MGR')) };

  beforeEach(() => {
    dataSource.transaction.mockClear();
    repo = {
      findActiveForEmployee: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((input) => Promise.resolve(fakeRow(input))),
      update: jest.fn().mockResolvedValue(fakeRow()),
    };
    service = new CompensationService(repo, dataSource as never);
  });

  describe('deriveHourlyRate', () => {
    it('rounds monthly / divisor to 4 dp', () => {
      expect(deriveHourlyRate(50000)).toBeCloseTo(50000 / COMPENSATION_MONTHLY_HOURS_DIVISOR, 4);
      // 4-dp rounding is exact, not just close
      expect(deriveHourlyRate(50000).toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4);
    });
  });

  describe('create', () => {
    it('derives the hourly rate and marks it not-overridden when omitted', async () => {
      await service.create({
        employee_id: 12,
        monthly_salary: 50000,
        effective_from: '2000-06-01',
        created_by: 1,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hourly_rate: deriveHourlyRate(50000),
          hourly_rate_is_overridden: false,
        }),
        'MGR',
      );
    });

    it('honors an explicit hourly_rate override and flags it', async () => {
      await service.create({
        employee_id: 12,
        monthly_salary: 50000,
        hourly_rate: 300,
        effective_from: '2000-06-01',
        created_by: 1,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ hourly_rate: 300, hourly_rate_is_overridden: true }),
        'MGR',
      );
    });

    it('end-dates the prior active row at the day before, inside the transaction', async () => {
      repo.findActiveForEmployee.mockResolvedValue(
        fakeRow({ id: 7, effective_from: '2000-01-01' }),
      );

      await service.create({
        employee_id: 12,
        monthly_salary: 60000,
        effective_from: '2000-06-01',
        created_by: 1,
      });

      expect(repo.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ effective_to: '2000-05-31' }),
        'MGR',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ effective_from: '2000-06-01' }),
        'MGR',
      );
    });

    it('does not touch any prior row when none is active', async () => {
      await service.create({
        employee_id: 12,
        monthly_salary: 50000,
        effective_from: '2000-06-01',
        created_by: 1,
      });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('rejects a future-dated effective_from (422)', async () => {
      await expect(
        service.create({
          employee_id: 12,
          monthly_salary: 50000,
          effective_from: '2999-12-31',
          created_by: 1,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects effective_from on or before the prior row (422)', async () => {
      repo.findActiveForEmployee.mockResolvedValue(
        fakeRow({ id: 7, effective_from: '2000-06-01' }),
      );
      await expect(
        service.create({
          employee_id: 12,
          monthly_salary: 60000,
          effective_from: '2000-06-01',
          created_by: 1,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('maps a unique-violation (concurrent active row) to 409', async () => {
      repo.create.mockRejectedValue({ code: PG_UNIQUE_VIOLATION });
      await expect(
        service.create({
          employee_id: 12,
          monthly_salary: 50000,
          effective_from: '2000-06-01',
          created_by: 1,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
