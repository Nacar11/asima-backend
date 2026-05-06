import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';

describe('WalletTransactionService', () => {
  describe('generateTransactionNumber', () => {
    it('should generate WTX-YYYYMMDD-XXXX format', () => {
      const service = new WalletTransactionService(
        null as any,
        null as any,
        null as any,
        null as any,
      );
      const num = (service as any).generateTransactionNumber(1);
      expect(num).toMatch(/^WTX-\d{8}-\d{4}$/);
    });

    it('should zero-pad sequence to 4 digits', () => {
      const service = new WalletTransactionService(
        null as any,
        null as any,
        null as any,
        null as any,
      );
      const num = (service as any).generateTransactionNumber(42);
      expect(num).toMatch(/^WTX-\d{8}-0042$/);
    });
  });

  describe('calculateCommission', () => {
    it('should return 10% of gross for 10% rate', () => {
      const service = new WalletTransactionService(
        null as any,
        null as any,
        null as any,
        null as any,
      );
      expect((service as any).calculateCommission(1000, 10)).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const service = new WalletTransactionService(
        null as any,
        null as any,
        null as any,
        null as any,
      );
      expect((service as any).calculateCommission(1000, 7.5)).toBe(75);
    });

    it('should handle 0% commission rate', () => {
      const service = new WalletTransactionService(
        null as any,
        null as any,
        null as any,
        null as any,
      );
      expect((service as any).calculateCommission(1000, 0)).toBe(0);
    });
  });
});
