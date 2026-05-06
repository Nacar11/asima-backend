import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerPayoutAccountRepository } from '../base-seller-payout-account.repository';
import { SellerPayoutAccountEntity } from '../entities/seller-payout-account.entity';
import { SellerPayoutAccount } from '@/seller-payout-accounts/domain/seller-payout-account';
import { SellerPayoutAccountMapper } from '../mappers/seller-payout-account.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class SellerPayoutAccountRepository extends BaseSellerPayoutAccountRepository {
  constructor(
    @InjectRepository(SellerPayoutAccountEntity)
    private readonly repository: Repository<SellerPayoutAccountEntity>,
  ) {
    super();
  }

  async create(account: SellerPayoutAccount): Promise<SellerPayoutAccount> {
    const persistenceEntity = SellerPayoutAccountMapper.toPersistence(account);
    const savedEntity = await this.repository.save(persistenceEntity);
    return this.findById(savedEntity.id) as Promise<SellerPayoutAccount>;
  }

  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerPayoutAccount>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: ['seller', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) =>
        SellerPayoutAccountMapper.toDomain(entity),
      ),
      totalCount,
    };
  }

  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerPayoutAccount>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.filterQuery?.seller_id) {
      whereClause.seller_id = options.filterQuery.seller_id;
    }
    if (options.filterQuery?.account_type) {
      whereClause.account_type = options.filterQuery.account_type;
    }
    if (options.filterQuery?.is_default !== undefined) {
      whereClause.is_default = options.filterQuery.is_default;
    }
    if (options.filterQuery?.status) {
      whereClause.status = options.filterQuery.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: ['seller', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) =>
        SellerPayoutAccountMapper.toDomain(entity),
      ),
      totalResults: total,
    };
  }

  async findById(id: number): Promise<SellerPayoutAccount | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['seller', 'created_by', 'updated_by'],
    });

    return entity ? SellerPayoutAccountMapper.toDomain(entity) : null;
  }

  async findBySellerId(sellerId: number): Promise<SellerPayoutAccount[]> {
    const entities = await this.repository.find({
      where: { seller_id: sellerId },
      relations: ['seller', 'created_by', 'updated_by'],
      order: { is_default: 'DESC', created_at: 'DESC' },
    });

    return entities.map((entity) => SellerPayoutAccountMapper.toDomain(entity));
  }

  async findDefaultBySellerId(
    sellerId: number,
  ): Promise<SellerPayoutAccount | null> {
    const entity = await this.repository.findOne({
      where: { seller_id: sellerId, is_default: true },
      relations: ['seller', 'created_by', 'updated_by'],
    });

    return entity ? SellerPayoutAccountMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerPayoutAccount>,
  ): Promise<SellerPayoutAccount> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Seller payout account with ID ${id} not found`);
    }

    const updateData = SellerPayoutAccountMapper.toPersistence({
      ...SellerPayoutAccountMapper.toDomain(existingEntity),
      ...payload,
    });

    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<SellerPayoutAccount>;
  }
}
