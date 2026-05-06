import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingGuest } from '@/booking-guests/domain/booking-guest';
import { BookingGuestEntity } from '@/booking-guests/persistence/entities/booking-guest.entity';
import { BookingGuestMapper } from '@/booking-guests/persistence/mappers/booking-guest.mapper';

@Injectable()
export class BookingGuestRepository {
  constructor(
    @InjectRepository(BookingGuestEntity)
    private readonly repo: Repository<BookingGuestEntity>,
  ) {}

  async createMany(
    data: Omit<
      BookingGuest,
      'id' | 'full_name' | 'created_at' | 'updated_at'
    >[],
  ): Promise<BookingGuest[]> {
    if (data.length === 0) return [];
    const entities = data.map((item) =>
      this.repo.create(BookingGuestMapper.toPersistence(item)),
    );
    const saved = await this.repo.save(entities);
    return saved.map((entity) => BookingGuestMapper.toDomain(entity));
  }

  async findByBookingId(bookingId: number): Promise<BookingGuest[]> {
    const entities = await this.repo.find({
      where: { booking_id: bookingId },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => BookingGuestMapper.toDomain(entity));
  }

  async findByBookingIds(bookingIds: number[]): Promise<BookingGuest[]> {
    if (bookingIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { booking_id: In(bookingIds) },
      order: { booking_id: 'ASC', sort_order: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => BookingGuestMapper.toDomain(entity));
  }

  async removeAllForBooking(bookingId: number): Promise<void> {
    await this.repo.delete({ booking_id: bookingId });
  }
}
