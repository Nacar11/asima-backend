import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { BaseBankRepository } from '@/banks/persistence/base-bank.repository';
import { BankMapper } from '@/banks/persistence/mappers/bank.mapper';
import { Bank } from '@/banks/domain/bank';
import { FindAllBank } from '@/banks/domain/find-all-bank';
import { BankSearchCriteria } from '@/banks/domain/bank-search-criteria';

/**
 * Concrete repository implementation for banks
 */
@Injectable()
export class BankRepository implements BaseBankRepository {
  constructor(
    @InjectRepository(BankEntity)
    private readonly bankRepository: Repository<BankEntity>,
  ) {}

  async create(bank: Partial<Bank>): Promise<Bank> {
    const persistenceData = BankMapper.toPersistence(bank);
    const entity = this.bankRepository.create({
      ...persistenceData,
      created_by: bank.created_by as any,
      updated_by: bank.updated_by as any,
    });
    const savedEntity = await this.bankRepository.save(entity);
    const reloaded = await this.bankRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['created_by', 'updated_by'],
    });
    return BankMapper.toDomain(reloaded ?? savedEntity);
  }

  async findAll(criteria: BankSearchCriteria): Promise<FindAllBank> {
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? 20;
    const sortOrder = criteria.sortOrder ?? 'ASC';
    const queryBuilder = this.bankRepository
      .createQueryBuilder('bank')
      .leftJoinAndSelect('bank.created_by', 'created_by')
      .leftJoinAndSelect('bank.updated_by', 'updated_by');
    if (criteria.search) {
      queryBuilder.andWhere(
        '(bank.bank_code ILIKE :search OR bank.bank_name ILIKE :search)',
        { search: `%${criteria.search}%` },
      );
    }
    if (criteria.bankCode) {
      queryBuilder.andWhere('bank.bank_code = :bankCode', {
        bankCode: criteria.bankCode,
      });
    }
    if (criteria.isActive !== undefined) {
      queryBuilder.andWhere('bank.is_active = :isActive', {
        isActive: criteria.isActive,
      });
    }
    queryBuilder
      .orderBy('bank.display_order', sortOrder)
      .addOrderBy('bank.bank_name', 'ASC')
      .skip(skip)
      .take(take);
    const [entities, totalCount] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map(BankMapper.toDomain),
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<Bank | null> {
    const entity = await this.bankRepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });
    if (!entity) {
      return null;
    }
    return BankMapper.toDomain(entity);
  }

  async findByCode(bankCode: string): Promise<Bank | null> {
    const entity = await this.bankRepository.findOne({
      where: { bank_code: bankCode },
      relations: ['created_by', 'updated_by'],
    });
    if (!entity) {
      return null;
    }
    return BankMapper.toDomain(entity);
  }

  async update(id: number, bank: Partial<Bank>): Promise<Bank> {
    const persistenceData = BankMapper.toPersistence(bank);
    await this.bankRepository.update(id, {
      ...persistenceData,
      updated_by: bank.updated_by as any,
    });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Bank with id ${id} not found after update`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.bankRepository.softDelete(id);
  }

  async findActiveBanks(): Promise<Bank[]> {
    const entities = await this.bankRepository.find({
      where: { is_active: true },
      order: { display_order: 'ASC', bank_name: 'ASC' },
    });
    return entities.map(BankMapper.toDomain);
  }
}
