import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestVenueBookingController } from './guest-venue-booking.controller';
import { SellerGuestVenueBookingController } from './seller-guest-venue-booking.controller';
import { ServiceBookingsController } from './service-bookings.controller';
import { GuestVenueBookingService } from './guest-venue-booking.service';
import { GuestVenueBookingExpirySchedulerService } from './guest-venue-booking-expiry-scheduler.service';
import { ServicesModule } from '@/services/services.module';
import { SellerSchedulesModule } from '@/seller-schedules/seller-schedules.module';
import { UsersModule } from '@/users/users.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { ServiceAddonsModule } from '@/service-addons/service-addons.module';
import { SalesOrderItemAddonsModule } from '@/sales-order-item-addons/sales-order-item-addons.module';
import { SalesOrderPersistenceModule } from '@/sales-orders/persistence/persistence.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';
import { SellersModule } from '@/sellers/sellers.module';
import { StorageModule } from '@/storage/storage.module';
import { MailModule } from '@/mail/mail.module';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingGuestsModule } from '@/booking-guests/booking-guests.module';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { OpenPlayEventEntity } from '@/guest-venue-booking/persistence/entities/open-play-event.entity';
import { OpenPlaySkillLevelEntity } from '@/guest-venue-booking/persistence/entities/open-play-skill-level.entity';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { AvailabilityRealtimeModule } from '@/availability-realtime/availability-realtime.module';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { PickleballMerchantsModule } from '@/pickleball-merchants/pickleball-merchants.module';
import { SellerPaymentProfileEntity } from '@/pickleball-merchants/persistence/entities/seller-payment-profile.entity';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    ServicesModule,
    SellerSchedulesModule,
    UsersModule,
    BookingsModule,
    BookingGuestsModule,
    BookingPersistenceModule,
    CheckoutPaymentsModule,
    ServiceAddonsModule,
    SalesOrderItemAddonsModule,
    SalesOrderPersistenceModule,
    SellersModule,
    MailModule,
    NotificationsModule,
    AvailabilityRealtimeModule,
    VouchersModule,
    PickleballMerchantsModule,
    StorageModule.register(),
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      SalesOrderItemEntity,
      CheckoutPaymentOrderEntity,
      CheckoutPaymentEntity,
      BookingEntity,
      StoreUnavailabilityEntity,
      UserGroupEntity,
      UserAssignmentEntity,
      OpenPlayEventEntity,
      OpenPlaySkillLevelEntity,
      SalesOrderVoucherEntity,
      EdistrictEntity,
      SellerPaymentProfileEntity,
    ]),
  ],
  controllers: [
    GuestVenueBookingController,
    SellerGuestVenueBookingController,
    ServiceBookingsController,
  ],
  providers: [
    GuestVenueBookingService,
    GuestVenueBookingExpirySchedulerService,
  ],
  exports: [GuestVenueBookingService],
})
export class GuestVenueBookingModule {}
