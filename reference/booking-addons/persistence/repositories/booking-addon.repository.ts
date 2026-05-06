import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BookingAddonEntity } from '@/booking-addons/persistence/entities/booking-addon.entity';
import { BookingAddonMapper } from '@/booking-addons/persistence/mappers/booking-addon.mapper';
import { BookingAddon } from '@/booking-addons/domain/booking-addon';

@Injectable()
export class BookingAddonRepository {
  constructor(
    @InjectRepository(BookingAddonEntity)
    private readonly repo: Repository<BookingAddonEntity>,
  ) {}

  async create(
    data: Omit<BookingAddon, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BookingAddon> {
    const saved = await this.repo.save(
      this.repo.create(BookingAddonMapper.toPersistence(data)),
    );
    return BookingAddonMapper.toDomain(saved);
  }

  async createMany(
    data: Omit<BookingAddon, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<BookingAddon[]> {
    if (data.length === 0) return [];
    const entities = data.map((d) =>
      this.repo.create(BookingAddonMapper.toPersistence(d)),
    );
    const saved = await this.repo.save(entities);
    return saved.map((e) => BookingAddonMapper.toDomain(e));
  }

  async findByBookingId(bookingId: number): Promise<BookingAddon[]> {
    const entities = await this.repo.find({
      where: { booking_id: bookingId },
      relations: ['addon'],
    });
    return entities.map((e) => BookingAddonMapper.toDomain(e));
  }

  async findByBookingIds(bookingIds: number[]): Promise<BookingAddon[]> {
    if (bookingIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { booking_id: In(bookingIds) },
      relations: ['addon'],
    });
    return entities.map((e) => BookingAddonMapper.toDomain(e));
  }

  async removeAllForBooking(bookingId: number): Promise<void> {
    await this.repo.delete({ booking_id: bookingId });
  }
}
