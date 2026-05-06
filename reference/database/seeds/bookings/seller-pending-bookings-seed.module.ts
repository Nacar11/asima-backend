import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SellerPendingBookingsSeedService } from '@/database/seeds/bookings/seller-pending-bookings-seed.service';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';

/**
 * Seed module for seller pending bookings
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      CheckoutOrderEntity,
      ServiceEntity,
      UserEntity,
      SellerEntity,
      SellerMemberEntity,
      UserAddressEntity,
    ]),
  ],
  providers: [SellerPendingBookingsSeedService],
  exports: [SellerPendingBookingsSeedService],
})
export class SellerPendingBookingsSeedModule {}
