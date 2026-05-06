import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingGuestEntity } from '@/booking-guests/persistence/entities/booking-guest.entity';
import { BookingGuestRepository } from '@/booking-guests/persistence/repositories/booking-guest.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingGuestEntity])],
  providers: [BookingGuestRepository],
  exports: [BookingGuestRepository],
})
export class BookingGuestsModule {}
