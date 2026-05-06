import { BadRequestException } from '@nestjs/common';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';

/**
 * TC-WALL-102: Admin debit adjustment must reject when requested amount
 * exceeds available balance, rather than silently capping at available funds.
 *
 * Root cause of the original bug: createAdjustment() used
 *   Math.max(0, balance - amount)
 * which produced a "success" response with a silently reduced amount. The fix
 * throws BadRequestException before any DB write when amount > currentBalance.
 */
describe('WalletTransactionRepository.createAdjustment', () => {
  let repo: WalletTransactionRepository;
  let mockDataSource: any;
  let walletEntityRepo: any;
  let txEntityRepo: any;

  const WALLET_ID = 1;
  const AVAILABLE_BALANCE = 896;

  const makeWallet = (balance: number) => ({ id: WALLET_ID, balance });

  beforeEach(() => {
    walletEntityRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(makeWallet(AVAILABLE_BALANCE)),
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    txEntityRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue({ id: 99 }),
    };

    const mockManager = {
      query: jest.fn().mockResolvedValue([{ next: 1 }]),
      getRepository: jest.fn().mockImplementation((entityClass: any) => {
        if (entityClass === WalletEntity) return walletEntityRepo;
        if (entityClass === WalletTransactionEntity) return txEntityRepo;
        return {};
      }),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb: any) => cb(mockManager)),
    };

    repo = new WalletTransactionRepository({} as any);
  });

  // ── TC-WALL-102: over-debit must be rejected ────────────────────────────

  describe('debit — over-balance rejection', () => {
    it('should throw BadRequestException when debit exceeds available balance (TC-WALL-102)', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          9999,
          TransactionDirectionEnum.DEBIT,
          'Test over-debit',
          mockDataSource,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include available and requested amounts in the error message', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          9999,
          TransactionDirectionEnum.DEBIT,
          'Test over-debit',
          mockDataSource,
        ),
      ).rejects.toThrow(/Insufficient balance/);
    });

    it('should throw at balance + 1 (boundary check)', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          AVAILABLE_BALANCE + 1,
          TransactionDirectionEnum.DEBIT,
          'Boundary over-debit',
          mockDataSource,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should NOT write any transaction or update balance when over-debit is rejected', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          9999,
          TransactionDirectionEnum.DEBIT,
          'Test over-debit',
          mockDataSource,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(txEntityRepo.save).not.toHaveBeenCalled();
      expect(walletEntityRepo.update).not.toHaveBeenCalled();
    });
  });

  // ── valid debit (≤ balance) ──────────────────────────────────────────────

  describe('debit — valid amount', () => {
    it('should succeed when debit equals available balance exactly', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          AVAILABLE_BALANCE,
          TransactionDirectionEnum.DEBIT,
          'Full balance debit',
          mockDataSource,
        ),
      ).resolves.toBeUndefined();
    });

    it('should succeed when debit is less than available balance', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          500,
          TransactionDirectionEnum.DEBIT,
          'Partial debit',
          mockDataSource,
        ),
      ).resolves.toBeUndefined();
    });

    it('should create DEBIT transaction with correct balance_after', async () => {
      const DEBIT_AMOUNT = 500;
      await repo.createAdjustment(
        WALLET_ID,
        DEBIT_AMOUNT,
        TransactionDirectionEnum.DEBIT,
        'Partial debit',
        mockDataSource,
      );

      expect(txEntityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wallet_id: WALLET_ID,
          direction: TransactionDirectionEnum.DEBIT,
          transaction_type: TransactionTypeEnum.ADJUSTMENT,
          amount: DEBIT_AMOUNT,
          balance_before: AVAILABLE_BALANCE,
          balance_after: AVAILABLE_BALANCE - DEBIT_AMOUNT,
          status: TransactionStatusEnum.COMPLETED,
        }),
      );
    });
  });

  // ── credit is always allowed ─────────────────────────────────────────────

  describe('credit direction', () => {
    it('should succeed regardless of current balance', async () => {
      await expect(
        repo.createAdjustment(
          WALLET_ID,
          99999,
          TransactionDirectionEnum.CREDIT,
          'Large credit',
          mockDataSource,
        ),
      ).resolves.toBeUndefined();
    });

    it('should create CREDIT transaction with correct balance_after', async () => {
      const CREDIT_AMOUNT = 1000;
      await repo.createAdjustment(
        WALLET_ID,
        CREDIT_AMOUNT,
        TransactionDirectionEnum.CREDIT,
        'Test credit',
        mockDataSource,
      );

      expect(txEntityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wallet_id: WALLET_ID,
          direction: TransactionDirectionEnum.CREDIT,
          transaction_type: TransactionTypeEnum.ADJUSTMENT,
          amount: CREDIT_AMOUNT,
          balance_before: AVAILABLE_BALANCE,
          balance_after: AVAILABLE_BALANCE + CREDIT_AMOUNT,
          status: TransactionStatusEnum.COMPLETED,
        }),
      );
    });
  });

  // ── wallet not found ─────────────────────────────────────────────────────

  it('should return without error when wallet is not found', async () => {
    walletEntityRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      repo.createAdjustment(
        999,
        500,
        TransactionDirectionEnum.DEBIT,
        'Ghost wallet',
        mockDataSource,
      ),
    ).resolves.toBeUndefined();

    expect(txEntityRepo.save).not.toHaveBeenCalled();
  });
});
