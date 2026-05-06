import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { VouchersSchedulerService } from '@/vouchers/vouchers-scheduler.service';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { VoucherQrTokenEntity } from '@/vouchers/persistence/entities/voucher-qr-token.entity';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';

/**
 * Builds a chainable mock for the TypeORM `createQueryBuilder().update()...execute()`
 * call chain used by `expireStaleUserVouchers`. Every chained method returns the same
 * mock instance so calls can be inspected; `execute` resolves to `{ affected }`.
 */
type ChainableQueryBuilderMock = {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
};

function buildQueryBuilderMock(affected: number): ChainableQueryBuilderMock {
  const queryBuilder = {} as ChainableQueryBuilderMock;
  queryBuilder.update = jest.fn().mockReturnValue(queryBuilder);
  queryBuilder.set = jest.fn().mockReturnValue(queryBuilder);
  queryBuilder.where = jest.fn().mockReturnValue(queryBuilder);
  queryBuilder.andWhere = jest.fn().mockReturnValue(queryBuilder);
  queryBuilder.execute = jest.fn().mockResolvedValue({ affected });
  return queryBuilder;
}

describe('VouchersSchedulerService', () => {
  let service: VouchersSchedulerService;
  let userVoucherRepository: { createQueryBuilder: jest.Mock };
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    userVoucherRepository = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersSchedulerService,
        {
          provide: getRepositoryToken(VoucherQrTokenEntity),
          useValue: { delete: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserVoucherEntity),
          useValue: userVoucherRepository,
        },
      ],
    }).compile();

    service = module.get<VouchersSchedulerService>(VouchersSchedulerService);

    // Spy on the Logger prototype so we capture logs regardless of instance binding.
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('expireStaleUserVouchers', () => {
    it('expires AVAILABLE user vouchers whose expires_at has passed and logs the count', async () => {
      const queryBuilder = buildQueryBuilderMock(3);
      userVoucherRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.expireStaleUserVouchers();

      expect(userVoucherRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(queryBuilder.update).toHaveBeenCalledWith(UserVoucherEntity);
      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: UserVoucherStatusEnum.EXPIRED,
          expired_at: expect.any(Date),
        }),
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('status = :status', {
        status: UserVoucherStatusEnum.AVAILABLE,
      });
      expect(queryBuilder.execute).toHaveBeenCalledTimes(1);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expired 3 stale user voucher(s).'),
      );
    });

    it('builds the WHERE clause with `expires_at IS NOT NULL` so rows with null expiry are skipped', async () => {
      const queryBuilder = buildQueryBuilderMock(0);
      userVoucherRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.expireStaleUserVouchers();

      // The query is built with two andWhere clauses; the first guards against null expiries.
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('expires_at IS NOT NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'expires_at < :now',
        expect.objectContaining({ now: expect.any(Date) }),
      );
    });

    it('does not log the "Expired N" message when zero rows are affected', async () => {
      const queryBuilder = buildQueryBuilderMock(0);
      userVoucherRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.expireStaleUserVouchers();

      expect(queryBuilder.execute).toHaveBeenCalledTimes(1);
      const expiredMessages = loggerLogSpy.mock.calls.filter(([message]) =>
        typeof message === 'string' && message.startsWith('Expired '),
      );
      expect(expiredMessages).toHaveLength(0);
    });

    it('logs the correct count when multiple rows are affected', async () => {
      const queryBuilder = buildQueryBuilderMock(42);
      userVoucherRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.expireStaleUserVouchers();

      expect(loggerLogSpy).toHaveBeenCalledWith('Expired 42 stale user voucher(s).');
    });
  });
});
