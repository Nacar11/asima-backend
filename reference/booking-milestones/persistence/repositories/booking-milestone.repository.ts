import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseBookingMilestoneRepository } from '../base-booking-milestone.repository';
import { BookingMilestoneEntity } from '../entities/booking-milestone.entity';
import { BookingMilestone } from '@/booking-milestones/domain/booking-milestone';
import { BookingMilestoneMapper } from '../mappers/booking-milestone.mapper';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { DevExtremePaginatedResponseDto } from '@/devextreme/dto/paginated-response';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Concrete implementation of booking milestone repository.
 *
 * Handles database operations for booking milestones using TypeORM.
 * Maps between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingMilestoneRepository extends BaseBookingMilestoneRepository {
  constructor(
    @InjectRepository(BookingMilestoneEntity)
    private readonly repository: Repository<BookingMilestoneEntity>,
  ) {
    super();
  }

  /**
   * Create a new booking milestone.
   *
   * @param milestone - Booking milestone domain model to create
   * @returns Promise<BookingMilestone> - Created booking milestone
   */
  async create(milestone: BookingMilestone): Promise<BookingMilestone> {
    const persistenceEntity = BookingMilestoneMapper.toPersistence(milestone);
    const savedEntity = await this.repository.save(persistenceEntity);

    // Fetch with relations
    return this.findById(savedEntity.id) as Promise<BookingMilestone>;
  }

  /**
   * Find booking milestones with DevExtreme support.
   *
   * @param loadOptions - DevExtreme query parameters
   * @returns Promise<DevExtremePaginatedResponseDto<BookingMilestone>>
   */
  async findByMany(
    loadOptions: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<BookingMilestone>> {
    const { skip = 0, take = 20 } = loadOptions;

    const [entities, totalCount] = await this.repository.findAndCount({
      relations: [
        'booking',
        'template',
        'approved_by_user',
        'created_by',
        'updated_by',
      ],
      order: { sequence_order: 'ASC', created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data: entities.map((entity) => BookingMilestoneMapper.toDomain(entity)),
      totalCount,
    };
  }

  /**
   * Find all booking milestones with standard pagination.
   *
   * @param options - Filter and pagination options
   * @returns Promise<IPaginatedResult<BookingMilestone>>
   */
  async findAllWithPagination(options: {
    filterQuery?: any;
    paginationOptions: IPaginationOptions;
  }): Promise<IPaginatedResult<BookingMilestone>> {
    const { paginationOptions } = options;
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    // Add filter logic here if needed

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      relations: [
        'booking',
        'template',
        'approved_by_user',
        'created_by',
        'updated_by',
      ],
      order: { sequence_order: 'ASC', created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => BookingMilestoneMapper.toDomain(entity)),
      totalResults: total,
    };
  }

  /**
   * Find a booking milestone by ID.
   *
   * @param id - The booking milestone ID
   * @returns Promise<BookingMilestone | null> - Milestone if found, null otherwise
   */
  async findById(id: number): Promise<BookingMilestone | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'booking',
        'booking.seller',
        'booking.service',
        'template',
        'approved_by_user',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return entity ? BookingMilestoneMapper.toDomain(entity) : null;
  }

  /**
   * Find booking milestones by booking ID.
   *
   * @param bookingId - The booking ID
   * @returns Promise<BookingMilestone[]> - Array of milestones for the booking
   */
  async findByBookingId(bookingId: number): Promise<BookingMilestone[]> {
    const entities = await this.repository.find({
      where: { booking_id: bookingId },
      relations: [
        'booking',
        'template',
        'approved_by_user',
        'created_by',
        'updated_by',
      ],
      order: { sequence_order: 'ASC' },
    });

    return entities.map((entity) => BookingMilestoneMapper.toDomain(entity));
  }

  /**
   * Update a booking milestone.
   *
   * @param id - The booking milestone ID
   * @param payload - Partial milestone data to update
   * @returns Promise<BookingMilestone> - Updated booking milestone
   */
  async update(
    id: number,
    payload: Partial<BookingMilestone>,
  ): Promise<BookingMilestone> {
    const existingEntity = await this.repository.findOne({ where: { id } });

    if (!existingEntity) {
      throw new Error(`Booking milestone with ID ${id} not found`);
    }

    const updateData = BookingMilestoneMapper.toPersistence({
      ...BookingMilestoneMapper.toDomain(existingEntity),
      ...payload,
    });

    // Update specific fields
    Object.assign(existingEntity, updateData);
    await this.repository.save(existingEntity);

    return this.findById(id) as Promise<BookingMilestone>;
  }

  /**
   * Soft delete a booking milestone.
   *
   * @param id - The booking milestone ID
   * @returns Promise<void>
   */
  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
