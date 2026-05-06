import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BookingOptionEntity } from '@/booking-options/persistence/entities/booking-option.entity';
import { BookingOptionMapper } from '@/booking-options/persistence/mappers/booking-option.mapper';
import { BookingOption } from '@/booking-options/domain/booking-option';

@Injectable()
export class BookingOptionRepository {
  constructor(
    @InjectRepository(BookingOptionEntity)
    private readonly repo: Repository<BookingOptionEntity>,
  ) {}

  async create(
    data: Omit<BookingOption, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BookingOption> {
    const saved = await this.repo.save(
      this.repo.create(BookingOptionMapper.toPersistence(data)),
    );
    return BookingOptionMapper.toDomain(saved);
  }

  async createMany(
    data: Omit<BookingOption, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<BookingOption[]> {
    if (data.length === 0) return [];
    const entities = data.map((d) =>
      this.repo.create(BookingOptionMapper.toPersistence(d)),
    );
    const saved = await this.repo.save(entities);
    return saved.map((e) => BookingOptionMapper.toDomain(e));
  }

  async findByBookingId(bookingId: number): Promise<BookingOption[]> {
    const entities = await this.repo.find({
      where: { booking_id: bookingId },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => BookingOptionMapper.toDomain(e));
  }

  async findByBookingIds(bookingIds: number[]): Promise<BookingOption[]> {
    if (bookingIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { booking_id: In(bookingIds) },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => BookingOptionMapper.toDomain(e));
  }

  async removeAllForBooking(bookingId: number): Promise<void> {
    await this.repo.delete({ booking_id: bookingId });
  }
}
