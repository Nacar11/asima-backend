import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingPersistenceModule } from './persistence/persistence.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CheckoutOrdersModule } from '@/checkout-orders/checkout-orders.module';
import { ServicesModule } from '@/services/services.module';
import { ServicePackagesModule } from '@/service-packages/service-packages.module';
import { SellersModule } from '@/sellers/sellers.module';
import { SellerMembersModule } from '@/seller-members/seller-members.module';
import { BookingCancellationsModule } from '@/booking-cancellations/booking-cancellations.module';
import { StoreUnavailabilityModule } from '@/store-unavailability/store-unavailability.module';
import { EscrowTransactionsModule } from '@/escrow-transactions/escrow-transactions.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SalesOrderItemAddonsModule } from '@/sales-order-item-addons/sales-order-item-addons.module';
import { SalesOrderItemOptionsModule } from '@/sales-order-item-options/sales-order-item-options.module';
import { BookingAddonsModule } from '@/booking-addons/booking-addons.module';
import { BookingOptionsModule } from '@/booking-options/booking-options.module';
import { ServiceMilestoneTemplatesModule } from '@/service-milestone-templates/service-milestone-templates.module';
import { BookingMilestonePersistenceModule } from '@/booking-milestones/persistence/persistence.module';
import { FormSubmissionsModule } from '@/form-submissions/form-submissions.module';
import { SellerEarningsModule } from '@/seller-earnings/seller-earnings.module';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { SellerSchedulesModule } from '@/seller-schedules/seller-schedules.module';
import { MailModule } from '@/mail/mail.module';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { VenueBookingSchedulerService } from './venue-booking-scheduler.service';
import { ParametersModule } from '@/parameters/parameters.module';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';

/**
 * Bookings Module.
 *
 * Provides service booking functionality created from checkout orders.
 * Handles booking lifecycle, member assignment, and status transitions.
 * Sends notifications to sellers on new bookings.
 * Automatically creates booking milestones from service milestone templates.
 *
 * @version 2
 * @since 1.0.0
 */
@Module({
  imports: [
    BookingPersistenceModule,
    CheckoutOrdersModule,
    ServicesModule,
    ServicePackagesModule,
    SellersModule,
    SellerMembersModule,
    StoreUnavailabilityModule,
    forwardRef(() => BookingCancellationsModule),
    forwardRef(() => EscrowTransactionsModule),
    NotificationsModule,
    SalesOrderItemAddonsModule,
    SalesOrderItemOptionsModule,
    BookingAddonsModule,
    BookingOptionsModule,
    ServiceMilestoneTemplatesModule,
    BookingMilestonePersistenceModule,
    FormSubmissionsModule,
    SellerEarningsModule,
    VouchersModule,
    SellerSchedulesModule,
    MailModule,
    ParametersModule,
    TypeOrmModule.forFeature([
      UserGroupEntity,
      UserAssignmentEntity,
      SalesOrderVoucherEntity,
      SalesOrderEntity,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, VenueBookingSchedulerService],
  exports: [BookingsService],
})
export class BookingsModule {}
