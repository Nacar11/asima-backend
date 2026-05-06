import { Bank } from '@/banks/domain/bank';
import { FindAllBank } from '@/banks/domain/find-all-bank';
import { BankSearchCriteria } from '@/banks/domain/bank-search-criteria';

/**
 * Abstract repository for bank persistence operations
 */
export abstract class BaseBankRepository {
  abstract create(bank: Partial<Bank>): Promise<Bank>;

  abstract findAll(criteria: BankSearchCriteria): Promise<FindAllBank>;

  abstract findById(id: number): Promise<Bank | null>;

  abstract findByCode(bankCode: string): Promise<Bank | null>;

  abstract update(id: number, bank: Partial<Bank>): Promise<Bank>;

  abstract remove(id: number): Promise<void>;

  abstract findActiveBanks(): Promise<Bank[]>;
}
