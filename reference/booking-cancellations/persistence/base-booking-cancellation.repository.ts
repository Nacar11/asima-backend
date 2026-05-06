import { Repository } from 'typeorm';
import { BookingCancellationEntity } from '@/booking-cancellations/persistence/entities/booking-cancellation.entity';
import { BookingCancellation } from '@/booking-cancellations/domain/booking-cancellation';

export abstract class BaseBookingCancellationRepository {
  constructor(protected repository: Repository<BookingCancellationEntity>) {}

  abstract findById(id: number): Promise<BookingCancellation | null>;
  abstract findByBookingId(
    bookingId: number,
  ): Promise<BookingCancellation | null>;
  abstract findAll(options: {
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
  }>;
  abstract create(domain: BookingCancellation): Promise<BookingCancellation>;
  abstract update(
    id: number,
    domain: BookingCancellation,
  ): Promise<BookingCancellation>;
}
