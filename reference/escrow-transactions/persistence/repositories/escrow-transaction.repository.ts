import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseEscrowTransactionRepository } from '../base-escrow-transaction.repository';
import { EscrowTransactionEntity } from '../entities/escrow-transaction.entity';
import { EscrowTransaction } from '@/escrow-transactions/domain/escrow-transaction';
import { EscrowTransactionMapper } from '../mappers/escrow-transaction.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { EscrowTransactionTypeEnum } from '../../enums/escrow-transaction-type.enum';

/**
 * Concrete implementation of escrow transaction repository.
 *
 * Handles database operations for escrow transactions using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class EscrowTransactionRepository extends BaseEscrowTransactionRepository {
  constructor(
    @InjectRepository(EscrowTransactionEntity)
    private readonly repository: Repository<EscrowTransactionEntity>,
  ) {
    super();
  }

  /**
   * Create a new escrow transaction.
   *
   * @param transaction - Escrow transaction domain model to create
   * @returns Promise<EscrowTransaction> - Created escrow transaction
   */
  async create(transaction: EscrowTransaction): Promise<EscrowTransaction> {
    const persistenceEntity =
      EscrowTransactionMapper.toPersistence(transaction);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<EscrowTransaction>;
  }

  /**
   * Find escrow transactions with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<EscrowTransaction>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<EscrowTransaction>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => EscrowTransactionMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all escrow transactions with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<EscrowTransaction>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<EscrowTransaction>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (options.filterQuery?.booking_id) {
      whereClause.booking_id = options.filterQuery.booking_id;
    }
    if (options.filterQuery?.milestone_id) {
      whereClause.milestone_id = options.filterQuery.milestone_id;
    }
    if (options.filterQuery?.transaction_type) {
      whereClause.transaction_type = options.filterQuery.transaction_type;
    }
    if (options.filterQuery?.status) {
      whereClause.status = options.filterQuery.status;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => EscrowTransactionMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find an escrow transaction by ID.
   *
   * @param id - The escrow transaction ID
   * @returns Promise<EscrowTransaction | null> - Transaction if found, null otherwise
   */
  async findById(id: number): Promise<EscrowTransaction | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? EscrowTransactionMapper.toDomain(entity) : null;
  }

  /**
   * Find escrow transactions by booking ID.
   *
   * @param bookingId - The booking ID
   * @returns Promise<EscrowTransaction[]> - Array of transactions for the booking
   */
  async findByBookingId(bookingId: number): Promise<EscrowTransaction[]> {
    const entities = await this.repository.find({
      where: { booking_id: bookingId },
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => EscrowTransactionMapper.toDomain(entity));
  }

  /**
   * Find escrow transactions by milestone ID.
   *
   * @param milestoneId - The milestone ID
   * @returns Promise<EscrowTransaction[]> - Array of transactions for the milestone
   */
  async findByMilestoneId(milestoneId: number): Promise<EscrowTransaction[]> {
    const entities = await this.repository.find({
      where: { milestone_id: milestoneId },
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => EscrowTransactionMapper.toDomain(entity));
  }

  /**
   * Find escrow transactions by transaction type.
   *
   * @param type - The transaction type
   * @param bookingId - Optional booking ID to filter by
   * @returns Promise<EscrowTransaction[]> - Array of transactions matching the type
   */
  async findByTransactionType(
    type: EscrowTransactionTypeEnum,
    bookingId?: number,
  ): Promise<EscrowTransaction[]> {
    const whereClause: any = { transaction_type: type };
    if (bookingId) {
      whereClause.booking_id = bookingId;
    }

    const entities = await this.repository.find({
      where: whereClause,
      relations: [
        'booking',
        'milestone',
        'currency',
        'released_to_user',
        'processed_by_user',
        'created_by',
        'updated_by',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => EscrowTransactionMapper.toDomain(entity));
  }

  /**
   * Update an escrow transaction.
   *
   * @param id - The escrow transaction ID
   * @param payload - Partial transaction data to update
   * @returns Promise<EscrowTransaction> - Updated transaction
   */
  async update(
    id: number,
    payload: Partial<EscrowTransaction>,
  ): Promise<EscrowTransaction> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Escrow transaction with ID ${id} not found`);
    }

    const updateData = EscrowTransactionMapper.toPersistence({
      ...EscrowTransactionMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<EscrowTransaction>;
  }
}
