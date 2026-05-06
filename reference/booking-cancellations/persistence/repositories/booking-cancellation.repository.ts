import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingCancellationEntity } from '@/booking-cancellations/persistence/entities/booking-cancellation.entity';
import { BookingCancellation } from '@/booking-cancellations/domain/booking-cancellation';
import { BookingCancellationMapper } from '@/booking-cancellations/persistence/mappers/booking-cancellation.mapper';
import { BaseBookingCancellationRepository } from '@/booking-cancellations/persistence/base-booking-cancellation.repository';

@Injectable()
export class BookingCancellationRepository extends BaseBookingCancellationRepository {
  constructor(
    @InjectRepository(BookingCancellationEntity)
    protected repository: Repository<BookingCancellationEntity>,
  ) {
    super(repository);
  }

  async findById(id: number): Promise<BookingCancellation | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['booking', 'cancelled_by_user'],
    });
    return entity ? BookingCancellationMapper.toDomain(entity) : null;
  }

  async findByBookingId(
    bookingId: number,
  ): Promise<BookingCancellation | null> {
    const entity = await this.repository.findOne({
      where: { booking_id: bookingId },
      relations: ['booking', 'cancelled_by_user'],
    });
    return entity ? BookingCancellationMapper.toDomain(entity) : null;
  }

  async findAll(options: {
    skip?: number;
    take?: number;
    booking_id?: number;
    cancelled_by?: number;
    cancelled_by_role?: string;
    reason?: string;
    policy_applied?: string;
  }): Promise<{
    data: BookingCancellation[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const {
      skip = 0,
      take = 20,
      booking_id,
      cancelled_by,
      cancelled_by_role,
      reason,
      policy_applied,
    } = options;

    const queryBuilder = this.repository
      .createQueryBuilder('cancellation')
      .leftJoinAndSelect('cancellation.booking', 'booking')
      .leftJoinAndSelect('cancellation.cancelled_by_user', 'cancelled_by_user')
      .where('cancellation.deleted_at IS NULL');

    if (booking_id) {
      queryBuilder.andWhere('cancellation.booking_id = :booking_id', {
        booking_id,
      });
    }

    if (cancelled_by) {
      queryBuilder.andWhere('cancellation.cancelled_by = :cancelled_by', {
        cancelled_by,
      });
    }

    if (cancelled_by_role) {
      queryBuilder.andWhere(
        'cancellation.cancelled_by_role = :cancelled_by_role',
        {
          cancelled_by_role,
        },
      );
    }

    if (reason) {
      queryBuilder.andWhere('cancellation.reason = :reason', { reason });
    }

    if (policy_applied) {
      queryBuilder.andWhere('cancellation.policy_applied = :policy_applied', {
        policy_applied,
      });
    }

    const [entities, totalCount] = await queryBuilder
      .orderBy('cancellation.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const data = entities.map((entity) =>
      BookingCancellationMapper.toDomain(entity),
    );

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async create(domain: BookingCancellation): Promise<BookingCancellation> {
    const entity = BookingCancellationMapper.toEntity(domain);
    const savedEntity = await this.repository.save(entity);
    return BookingCancellationMapper.toDomain(savedEntity);
  }

  async update(
    id: number,
    domain: BookingCancellation,
  ): Promise<BookingCancellation> {
    const entity = BookingCancellationMapper.toEntity(domain);
    entity.id = id;
    const savedEntity = await this.repository.save(entity);
    return BookingCancellationMapper.toDomain(savedEntity);
  }
}
