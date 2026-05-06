/**
 * Bug regression: creditPendingEarning must be idempotent.
 *
 * A duplicate Maya webhook (or any retry) must NOT create a second EARNING
 * transaction for the same sales order.  The fix inserts an existence check
 * inside the locked transaction before writing the new row.
 */

import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';

// ─── helpers ────────────────────────────────────────────────────────────────

const mockWallet = { id: 1, balance: 0, pending_balance: 0 };
const SELLER_ID = 10;
const ORDER_ID = 99;

/**
 * Build a WalletTransactionService whose dataSource.transaction runs the
 * callback synchronously with a controllable EntityManager.
 */
function buildService(existingEarning: object | null) {
  const walletRepo: any = {
    createIfNotExists: jest.fn().mockResolvedValue(undefined),
    findBySellerIdWithLock: jest.fn().mockResolvedValue(mockWallet),
    findAdminWalletWithLock: jest.fn().mockResolvedValue(null),
  };

  const txRepo: any = {
    createTransaction: jest.fn().mockResolvedValue({}),
  };

  // The manager returned inside the transaction callback
  const manager: any = {
    query: jest.fn().mockResolvedValue([{ next: 1 }]),
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(existingEarning),
      update: jest.fn().mockResolvedValue({}),
    }),
  };

  const dataSource: any = {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ s_user_id: 1 }),
      }),
    }),
    transaction: jest.fn().mockImplementation((cb: any) => cb(manager)),
  };

  const notificationsService: any = {};

  const service = new WalletTransactionService(
    walletRepo,
    txRepo,
    dataSource,
    notificationsService,
  );

  return { service, txRepo, manager };
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('creditPendingEarning — idempotency guard', () => {
  it('credits pending earning on first call', async () => {
    const { service, txRepo } = buildService(null);

    await service.creditPendingEarning({
      sellerId: SELLER_ID,
      salesOrderId: ORDER_ID,
      grossAmount: 1000,
      commissionRate: 10,
    });

    expect(txRepo.createTransaction).toHaveBeenCalledTimes(1);
    expect(txRepo.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_type: TransactionTypeEnum.EARNING,
        reference_type: 'sales_order',
        reference_id: ORDER_ID,
        status: TransactionStatusEnum.PENDING,
      }),
      expect.anything(),
    );
  });

  it('skips duplicate credit when PENDING earning already exists for the same order', async () => {
    const existingPending = {
      id: 5,
      transaction_type: TransactionTypeEnum.EARNING,
      status: TransactionStatusEnum.PENDING,
      reference_id: ORDER_ID,
    };
    const { service, txRepo } = buildService(existingPending);

    await service.creditPendingEarning({
      sellerId: SELLER_ID,
      salesOrderId: ORDER_ID,
      grossAmount: 1000,
      commissionRate: 10,
    });

    expect(txRepo.createTransaction).not.toHaveBeenCalled();
  });

  it('skips duplicate credit when COMPLETED earning already exists for the same order', async () => {
    const existingCompleted = {
      id: 6,
      transaction_type: TransactionTypeEnum.EARNING,
      status: TransactionStatusEnum.COMPLETED,
      reference_id: ORDER_ID,
    };
    const { service, txRepo } = buildService(existingCompleted);

    await service.creditPendingEarning({
      sellerId: SELLER_ID,
      salesOrderId: ORDER_ID,
      grossAmount: 1000,
      commissionRate: 10,
    });

    expect(txRepo.createTransaction).not.toHaveBeenCalled();
  });
});
