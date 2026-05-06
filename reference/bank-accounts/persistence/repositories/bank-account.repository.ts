import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { BaseBankAccountRepository } from '@/bank-accounts/persistence/base-bank-account.repository';
import { BankAccountMapper } from '@/bank-accounts/persistence/mappers/bank-account.mapper';
import { BankAccount } from '@/bank-accounts/domain/bank-account';
import { FindAllBankAccount } from '@/bank-accounts/domain/find-all-bank-account';
import { BankAccountSearchCriteria } from '@/bank-accounts/domain/bank-account-search-criteria';

@Injectable()
export class BankAccountRepository implements BaseBankAccountRepository {
  constructor(
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepository: Repository<BankAccountEntity>,
  ) {}

  async create(
    bankAccount: Partial<BankAccount>,
    accountNumberEncrypted: string,
  ): Promise<BankAccount> {
    const persistenceData = BankAccountMapper.toPersistence(bankAccount);
    const entity = this.bankAccountRepository.create({
      ...persistenceData,
      account_number_encrypted: accountNumberEncrypted,
    });
    const savedEntity = await this.bankAccountRepository.save(entity);
    return BankAccountMapper.toDomain(savedEntity);
  }

  async findAll(
    criteria: BankAccountSearchCriteria,
  ): Promise<FindAllBankAccount> {
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? 20;
    const queryBuilder = this.bankAccountRepository
      .createQueryBuilder('bank_account')
      .leftJoinAndSelect('bank_account.bank', 'bank')
      .leftJoin('bank_account.created_by', 'created_by')
      .addSelect([
        'created_by.id',
        'created_by.first_name',
        'created_by.last_name',
      ])
      .leftJoin('bank_account.updated_by', 'updated_by')
      .addSelect([
        'updated_by.id',
        'updated_by.first_name',
        'updated_by.last_name',
      ])
      .where('bank_account.user_id = :userId', { userId: criteria.user_id });
    if (criteria.status) {
      queryBuilder.andWhere('bank_account.status = :status', {
        status: criteria.status,
      });
    }
    if (criteria.is_default !== undefined) {
      queryBuilder.andWhere('bank_account.is_default = :isDefault', {
        isDefault: criteria.is_default,
      });
    }
    if (criteria.search) {
      queryBuilder.andWhere(
        '(bank.bank_name ILIKE :search OR bank_account.account_holder_name ILIKE :search)',
        { search: `%${criteria.search}%` },
      );
    }
    const sortDirection = criteria.sortBy === 'DESC' ? 'DESC' : 'ASC';
    queryBuilder
      .orderBy('bank_account.is_default', 'DESC')
      .addOrderBy('bank_account.created_at', sortDirection);
    queryBuilder.skip(skip).take(take);
    const [entities, totalCount] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((entity) => BankAccountMapper.toDomain(entity)),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<BankAccount | null> {
    const entity = await this.bankAccountRepository.findOne({
      where: { id },
      relations: ['bank', 'created_by', 'updated_by'],
    });
    return entity ? BankAccountMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<BankAccount | null> {
    const entity = await this.bankAccountRepository.findOne({
      where: { id, user_id: userId },
      relations: ['bank', 'created_by', 'updated_by'],
    });
    return entity ? BankAccountMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    bankAccount: Partial<BankAccount>,
  ): Promise<BankAccount> {
    const persistenceData = BankAccountMapper.toPersistence(bankAccount);
    await this.bankAccountRepository.update(id, persistenceData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Bank account not found after update');
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.bankAccountRepository.delete(id);
  }

  async setDefault(id: number, userId: number): Promise<void> {
    await this.bankAccountRepository.update(
      { user_id: userId, is_default: true },
      { is_default: false },
    );
    await this.bankAccountRepository.update(id, { is_default: true });
  }

  async clearDefaults(userId: number): Promise<void> {
    await this.bankAccountRepository.update(
      { user_id: userId, is_default: true },
      { is_default: false },
    );
  }

  async findDuplicateAccount(
    userId: number,
    bankId: number,
    lastFour: string,
  ): Promise<BankAccount | null> {
    const entity = await this.bankAccountRepository.findOne({
      where: {
        user_id: userId,
        bank_id: bankId,
        last_four: lastFour,
      },
      relations: ['bank'],
    });
    return entity ? BankAccountMapper.toDomain(entity) : null;
  }
}
