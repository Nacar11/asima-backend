import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerPayoutRepository } from '../base-seller-payout.repository';
import { SellerPayoutEntity } from '../entities/seller-payout.entity';
import { SellerPayout } from '@/seller-payouts/domain/seller-payout';
import { SellerPayoutMapper } from '../mappers/seller-payout.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@Injectable()
export class SellerPayoutRepository extends BaseSellerPayoutRepository {
  constructor(
    @InjectRepository(SellerPayoutEntity)
    private readonly repository: Repository<SellerPayoutEntity>,
  ) {
    super();
  }

  async create(payout: SellerPayout): Promise<SellerPayout> {
    const persistenceEntity = SellerPayoutMapper.toPersistence(payout);
    const savedEntity = await this.repository.save(persistenceEntity);
    return this.findById(savedEntity.id) as Promise<SellerPayout>;
  }

  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerPayout>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: ['seller', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => SellerPayoutMapper.toDomain(entity)),
      totalCount,
    };
  }

  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerPayout>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.filterQuery?.seller_id) {
      whereClause.seller_id = options.filterQuery.seller_id;
    }
    if (options.filterQuery?.status) {
      whereClause.status = options.filterQuery.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: ['seller', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => SellerPayoutMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  async findById(id: number): Promise<SellerPayout | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['seller', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? SellerPayoutMapper.toDomain(entity) : null;
  }

  async findBySellerId(sellerId: number): Promise<SellerPayout[]> {
    const entities = await this.repository.find({
      where: { seller_id: sellerId },
      relations: ['seller', 'currency', 'created_by', 'updated_by'],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => SellerPayoutMapper.toDomain(entity));
  }

  async findByPayoutNumber(payoutNumber: string): Promise<SellerPayout | null> {
    const entity = await this.repository.findOne({
      where: { payout_number: payoutNumber },
      relations: ['seller', 'currency', 'created_by', 'updated_by'],
    });

    return entity ? SellerPayoutMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<SellerPayout>,
  ): Promise<SellerPayout> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Seller payout with ID ${id} not found`);
    }

    const updateData = SellerPayoutMapper.toPersistence({
      ...SellerPayoutMapper.toDomain(existingEntity),
      ...payload,
    });

    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<SellerPayout>;
  }
}
