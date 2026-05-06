import { BankAccount } from '@/bank-accounts/domain/bank-account';
import { FindAllBankAccount } from '@/bank-accounts/domain/find-all-bank-account';
import { BankAccountSearchCriteria } from '@/bank-accounts/domain/bank-account-search-criteria';

/**
 * Abstract repository for bank account persistence operations
 */
export abstract class BaseBankAccountRepository {
  abstract create(
    bankAccount: Partial<BankAccount>,
    accountNumberEncrypted: string,
  ): Promise<BankAccount>;

  abstract findAll(
    criteria: BankAccountSearchCriteria,
  ): Promise<FindAllBankAccount>;

  abstract findById(id: number): Promise<BankAccount | null>;

  abstract findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<BankAccount | null>;

  abstract update(
    id: number,
    bankAccount: Partial<BankAccount>,
  ): Promise<BankAccount>;

  abstract remove(id: number): Promise<void>;

  abstract setDefault(id: number, userId: number): Promise<void>;

  abstract clearDefaults(userId: number): Promise<void>;

  abstract findDuplicateAccount(
    userId: number,
    bankId: number,
    lastFour: string,
  ): Promise<BankAccount | null>;
}
