import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseDisputeRepository } from '../base-dispute.repository';
import { DisputeEntity } from '../entities/dispute.entity';
import { Dispute } from '@/disputes/domain/dispute';
import { DisputeMapper } from '../mappers/dispute.mapper';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

const DISPUTE_RELATIONS = [
  'booking',
  'customer',
  'seller',
  'resolved_by_user',
  'created_by',
  'updated_by',
];

/**
 * Concrete implementation of dispute repository.
 *
 * Handles database operations for disputes using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class DisputeRepository extends BaseDisputeRepository {
  constructor(
    @InjectRepository(DisputeEntity)
    private readonly repository: Repository<DisputeEntity>,
  ) {
    super();
  }

  /**
   * Create a new dispute.
   */
  async create(dispute: Dispute): Promise<Dispute> {
    const persistenceEntity = DisputeMapper.toPersistence(dispute);
    const savedEntity = await this.repository.save(persistenceEntity);
    return this.findById(savedEntity.id) as Promise<Dispute>;
  }

  /**
   * Find all disputes with standard pagination.
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<Dispute>> {
    const { filterQuery, paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (filterQuery?.status) {
      whereClause.status = filterQuery.status;
    }
    if (filterQuery?.booking_id) {
      whereClause.booking_id = filterQuery.booking_id;
    }
    if (filterQuery?.customer_id) {
      whereClause.customer_id = filterQuery.customer_id;
    }
    if (filterQuery?.seller_id) {
      whereClause.seller_id = filterQuery.seller_id;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: DISPUTE_RELATIONS,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => DisputeMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find a dispute by ID.
   */
  async findById(id: number): Promise<Dispute | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: DISPUTE_RELATIONS,
    });
    return entity ? DisputeMapper.toDomain(entity) : null;
  }

  /**
   * Find a dispute by booking ID.
   */
  async findByBookingId(bookingId: number): Promise<Dispute | null> {
    const entity = await this.repository.findOne({
      where: { booking_id: bookingId },
      relations: DISPUTE_RELATIONS,
      order: { created_at: 'DESC' },
    });
    return entity ? DisputeMapper.toDomain(entity) : null;
  }

  /**
   * Find disputes by customer ID with pagination.
   */
  async findByCustomerId(
    customerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string },
  ): Promise<IPaginatedResult<Dispute>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = { customer_id: customerId };
    if (filterOptions?.status) {
      whereClause.status = filterOptions.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: DISPUTE_RELATIONS,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => DisputeMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find disputes by seller ID with pagination.
   */
  async findBySellerId(
    sellerId: number,
    paginationOptions: IPaginationOptions,
    filterOptions?: { status?: string },
  ): Promise<IPaginatedResult<Dispute>> {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = { seller_id: sellerId };
    if (filterOptions?.status) {
      whereClause.status = filterOptions.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: DISPUTE_RELATIONS,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => DisputeMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Update a dispute.
   */
  async update(id: number, payload: Partial<Dispute>): Promise<Dispute> {
    await this.repository.update(id, payload as any);
    return this.findById(id) as Promise<Dispute>;
  }
}
