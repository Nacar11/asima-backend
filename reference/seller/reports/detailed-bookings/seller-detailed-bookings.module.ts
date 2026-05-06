import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { OpenPlayEventEntity } from '@/guest-venue-booking/persistence/entities/open-play-event.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { StorageModule } from '@/storage/storage.module';
import { AvailabilityRealtimeModule } from '@/availability-realtime/availability-realtime.module';
import { SellerDetailedBookingsController } from './seller-detailed-bookings.controller';
import { SellerServiceBookingsController } from './seller-service-bookings.controller';
import { SellerDetailedBookingsService } from './seller-detailed-bookings.service';

@Module({
  imports: [
    StorageModule.register(),
    AvailabilityRealtimeModule,
    TypeOrmModule.forFeature([
      BookingEntity,
      EscrowTransactionEntity,
      SalesOrderEntity,
      SalesOrderItemEntity,
      CheckoutPaymentEntity,
      CheckoutPaymentOrderEntity,
      StoreUnavailabilityEntity,
      OpenPlayEventEntity,
      UserEntity,
      SalesOrderVoucherEntity,
    ]),
  ],
  controllers: [
    SellerDetailedBookingsController,
    SellerServiceBookingsController,
  ],
  providers: [SellerDetailedBookingsService],
  exports: [SellerDetailedBookingsService],
})
export class SellerDetailedBookingsModule {}
