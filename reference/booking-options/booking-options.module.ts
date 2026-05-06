import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingOptionEntity } from '@/booking-options/persistence/entities/booking-option.entity';
import { BookingOptionRepository } from '@/booking-options/persistence/repositories/booking-option.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingOptionEntity])],
  providers: [BookingOptionRepository],
  exports: [BookingOptionRepository],
})
export class BookingOptionsModule {}
