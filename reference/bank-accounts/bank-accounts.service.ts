import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseBankAccountRepository } from './persistence/base-bank-account.repository';
import { BankAccount, BankAccountStatusEnum } from './domain/bank-account';
import { FindAllBankAccount } from './domain/find-all-bank-account';
import { BankAccountSearchCriteria } from './domain/bank-account-search-criteria';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { QueryBankAccountDto } from './dto/query-bank-account.dto';
import { User } from '@/users/domain/user';
import { EncryptionService } from '@/utils/encryption/encryption.service';

@Injectable()
export class BankAccountsService {
  private getCauser(user: User): Pick<User, 'id' | 'first_name' | 'last_name'> {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }
  constructor(
    private readonly bankAccountRepository: BaseBankAccountRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(
    input: CreateBankAccountDto,
    currentUser: User,
  ): Promise<BankAccount> {
    const lastFour = input.account_number.slice(-4);
    const duplicate = await this.bankAccountRepository.findDuplicateAccount(
      currentUser.id,
      input.bank_id,
      lastFour,
    );
    if (duplicate) {
      throw new ConflictException('This bank account is already saved');
    }
    const accountNumberEncrypted = this.encryptAccountNumber(
      input.account_number,
    );
    // Reset other defaults BEFORE creating if this will be default
    if (input.is_default) {
      await this.bankAccountRepository.clearDefaults(currentUser.id);
    }
    const bankAccountData: Partial<BankAccount> = {
      user_id: currentUser.id,
      bank_id: input.bank_id,
      account_holder_name: input.account_holder_name,
      last_four: lastFour,
      account_type: input.account_type ?? null,
      is_default: input.is_default ?? false,
      status: BankAccountStatusEnum.UNVERIFIED,
      created_by: this.getCauser(currentUser),
      updated_by: this.getCauser(currentUser),
    };
    return this.bankAccountRepository.create(
      bankAccountData,
      accountNumberEncrypted,
    );
  }

  async findAll(
    query: QueryBankAccountDto,
    currentUser: User,
  ): Promise<FindAllBankAccount> {
    const criteria: BankAccountSearchCriteria = {
      user_id: currentUser.id,
      status: query.status,
      is_default: query.is_default,
      search: query.search,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
      sortBy: query.sortBy ?? 'DESC',
    };
    return this.bankAccountRepository.findAll(criteria);
  }

  async findById(id: number, currentUser: User): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findByIdAndUserId(
      id,
      currentUser.id,
    );
    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }
    return bankAccount;
  }

  async update(
    id: number,
    input: UpdateBankAccountDto,
    currentUser: User,
  ): Promise<BankAccount> {
    const existing = await this.findById(id, currentUser);
    const updateData: Partial<BankAccount> = {
      ...input,
      updated_by: this.getCauser(currentUser),
    };
    if (input.is_default === true) {
      await this.bankAccountRepository.setDefault(existing.id, currentUser.id);
    }
    return this.bankAccountRepository.update(id, updateData);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    await this.findById(id, currentUser);
    await this.bankAccountRepository.remove(id);
  }

  private encryptAccountNumber(accountNumber: string): string {
    return this.encryptionService.encrypt(accountNumber);
  }
}
