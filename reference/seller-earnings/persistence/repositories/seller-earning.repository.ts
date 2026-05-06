import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSellerEarningRepository } from '../base-seller-earning.repository';
import { SellerEarningEntity } from '../entities/seller-earning.entity';
import { SellerEarning } from '@/seller-earnings/domain/seller-earning';
import { SellerEarningMapper } from '../mappers/seller-earning.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { EarningsStatusEnum } from '../../enums/earnings-status.enum';

/**
 * Concrete implementation of seller earning repository.
 *
 * Handles database operations for seller earnings using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SellerEarningRepository extends BaseSellerEarningRepository {
  constructor(
    @InjectRepository(SellerEarningEntity)
    private readonly repository: Repository<SellerEarningEntity>,
  ) {
    super();
  }

  /**
   * Create a new seller earning record.
   *
   * @param earning - Seller earning domain model to create
   * @returns Promise<SellerEarning> - Created seller earning
   */
  async create(earning: SellerEarning): Promise<SellerEarning> {
    const persistenceEntity = SellerEarningMapper.toPersistence(earning);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<SellerEarning>;
  }

  /**
   * Find seller earnings with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<SellerEarning>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SellerEarning>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: [
        'seller',
        'milestone',
        'currency',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => SellerEarningMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all seller earnings with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<SellerEarning>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<SellerEarning>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.filterQuery?.seller_id) {
      whereClause.seller_id = options.filterQuery.seller_id;
    }
    if (options.filterQuery?.source_type) {
      whereClause.source_type = options.filterQuery.source_type;
    }
    if (options.filterQuery?.source_id) {
      whereClause.source_id = options.filterQuery.source_id;
    }
    if (options.filterQuery?.status) {
      whereClause.status = options.filterQuery.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'seller',
        'milestone',
        'currency',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => SellerEarningMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find a seller earning by ID.
   *
   * @param id - The seller earning ID
   * @returns Promise<SellerEarning | null> - Earning if found, null otherwise
   */
  async findById(id: number): Promise<SellerEarning | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'seller',
        'milestone',
        'currency',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? SellerEarningMapper.toDomain(entity) : null;
  }

  /**
   * Find seller earnings by seller ID.
   *
   * @param sellerId - The seller ID
   * @param status - Optional status filter
   * @returns Promise<SellerEarning[]> - Array of earnings for the seller
   */
  async findBySellerId(
    sellerId: number,
    status?: string,
  ): Promise<SellerEarning[]> {
    const whereClause: any = { seller_id: sellerId };
    if (status) {
      whereClause.status = status;
    }

    const entities = await this.repository.find({
      where: whereClause,
      relations: [
        'seller',
        'milestone',
        'currency',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => SellerEarningMapper.toDomain(entity));
  }

  /**
   * Calculate pending earnings for a seller.
   *
   * @param sellerId - The seller ID
   * @returns Promise<number> - Total pending earnings amount
   */
  async calculatePendingEarnings(sellerId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.net_amount), 0)', 'total')
      .where('earning.seller_id = :sellerId', { sellerId })
      .andWhere('earning.status = :status', {
        status: EarningsStatusEnum.PENDING,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Calculate available earnings for a seller.
   *
   * @param sellerId - The seller ID
   * @returns Promise<number> - Total available earnings amount
   */
  async calculateAvailableEarnings(sellerId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.net_amount), 0)', 'total')
      .where('earning.seller_id = :sellerId', { sellerId })
      .andWhere('earning.status = :status', {
        status: EarningsStatusEnum.AVAILABLE,
      })
      .andWhere('earning.available_at IS NOT NULL')
      .andWhere('earning.available_at <= :now', { now: new Date() })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Calculate earnings for a specific month.
   *
   * @param sellerId - Seller ID
   * @param year - Year (YYYY)
   * @param month - Month (1-12)
   * @returns Promise<number> - Total earnings for the month
   */
  async calculateMonthlyEarnings(
    sellerId: number,
    year: number,
    month: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const result = await this.repository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.net_amount), 0)', 'total')
      .where('earning.seller_id = :sellerId', { sellerId })
      .andWhere('earning.status = :status', {
        status: EarningsStatusEnum.AVAILABLE,
      })
      .andWhere('DATE(earning.created_at) >= :startDate', {
        startDate: startDateStr,
      })
      .andWhere('DATE(earning.created_at) <= :endDate', {
        endDate: endDateStr,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get earnings grouped by day for chart data.
   *
   * @param sellerId - Seller ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise<Array<{ date: string; amount: number }>> - Daily earnings
   */
  async getEarningsByDateRange(
    sellerId: number,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ date: string; amount: number }>> {
    const result = await this.repository
      .createQueryBuilder('earning')
      .select('DATE(earning.created_at)', 'date')
      .addSelect('COALESCE(SUM(earning.net_amount), 0)', 'amount')
      .where('earning.seller_id = :sellerId', { sellerId })
      .andWhere('earning.status = :status', {
        status: EarningsStatusEnum.AVAILABLE,
      })
      .andWhere('DATE(earning.created_at) >= :startDate', { startDate })
      .andWhere('DATE(earning.created_at) <= :endDate', { endDate })
      .groupBy('DATE(earning.created_at)')
      .orderBy('DATE(earning.created_at)', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      amount: Number(row.amount || 0),
    }));
  }

  /**
   * Update a seller earning.
   *
   * @param id - The seller earning ID
   * @param payload - Partial earning data to update
   * @returns Promise<SellerEarning> - Updated earning
   */
  async update(
    id: number,
    payload: Partial<SellerEarning>,
  ): Promise<SellerEarning> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Seller earning with ID ${id} not found`);
    }

    const updateData = SellerEarningMapper.toPersistence({
      ...SellerEarningMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<SellerEarning>;
  }
}
