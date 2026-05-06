import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingAddonEntity } from '@/booking-addons/persistence/entities/booking-addon.entity';
import { BookingAddonRepository } from '@/booking-addons/persistence/repositories/booking-addon.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingAddonEntity])],
  providers: [BookingAddonRepository],
  exports: [BookingAddonRepository],
})
export class BookingAddonsModule {}
