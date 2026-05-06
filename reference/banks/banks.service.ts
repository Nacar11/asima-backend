import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BaseBankRepository } from '@/banks/persistence/base-bank.repository';
import { Bank } from '@/banks/domain/bank';
import { FindAllBank } from '@/banks/domain/find-all-bank';
import { BankSearchCriteria } from '@/banks/domain/bank-search-criteria';
import { CreateBankDto } from '@/banks/dto/create-bank.dto';
import { UpdateBankDto } from '@/banks/dto/update-bank.dto';
import { QueryBankDto } from '@/banks/dto/query-bank.dto';
import { User } from '@/users/domain/user';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';

/**
 * Service for bank business logic
 */
@Injectable()
export class BanksService {
  constructor(private readonly repository: BaseBankRepository) {}

  private getCauser(user: User): Pick<User, 'id' | 'first_name' | 'last_name'> {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }

  private buildSearchCriteriaFromQuery(
    query: QueryBankDto,
  ): BankSearchCriteria {
    const criteria: BankSearchCriteria = {
      search: query.search,
      bankCode: query.bank_code,
      isActive: query.is_active,
      skip: query.skip ?? PAGINATION_DEFAULTS.skip,
      take: query.take ?? PAGINATION_DEFAULTS.take,
      sortOrder: query.sortBy ?? 'ASC',
    };
    return criteria;
  }

  /**
   * Create a new bank
   */
  async create(input: CreateBankDto, causer: User): Promise<Bank> {
    const existingBank = await this.repository.findByCode(input.bank_code);
    if (existingBank) {
      throw new ConflictException(
        `Bank with code ${input.bank_code} already exists`,
      );
    }
    const bank: Partial<Bank> = {
      bank_code: input.bank_code,
      bank_name: input.bank_name,
      logo_url: input.logo_url ?? null,
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
      created_by: this.getCauser(causer),
      updated_by: this.getCauser(causer),
    };
    return this.repository.create(bank);
  }

  /**
   * Get all banks with pagination and filters
   */
  async findAll(query: QueryBankDto): Promise<FindAllBank> {
    const criteria = this.buildSearchCriteriaFromQuery(query);
    return this.repository.findAll(criteria);
  }

  /**
   * Get a bank by ID
   */
  async findById(id: number): Promise<Bank> {
    const bank = await this.repository.findById(id);
    if (!bank) {
      throw new NotFoundException(`Bank with id ${id} not found`);
    }
    return bank;
  }

  /**
   * Get a bank by code
   */
  async findByCode(bankCode: string): Promise<Bank> {
    const bank = await this.repository.findByCode(bankCode);
    if (!bank) {
      throw new NotFoundException(`Bank with code ${bankCode} not found`);
    }
    return bank;
  }

  /**
   * Update a bank
   */
  async update(id: number, input: UpdateBankDto, causer: User): Promise<Bank> {
    await this.findById(id);
    if (input.bank_code) {
      const existingBank = await this.repository.findByCode(input.bank_code);
      if (existingBank && existingBank.id !== id) {
        throw new ConflictException(
          `Bank with code ${input.bank_code} already exists`,
        );
      }
    }
    const partialBank: Partial<Bank> = {
      ...input,
      updated_by: this.getCauser(causer),
    };
    return this.repository.update(id, partialBank);
  }

  /**
   * Soft delete a bank
   */
  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id);
  }

  /**
   * Get all active banks (for dropdowns)
   */
  async findActiveBanks(): Promise<Bank[]> {
    return this.repository.findActiveBanks();
  }
}
