import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationCheckoutController } from './quotation-checkout.controller';
import { QuotationCheckoutService } from './quotation-checkout.service';
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';
import { QuotationItemEntity } from '@/quotation-items/persistence/entities/quotation-item.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { BookingsModule } from '@/bookings/bookings.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SalesOrderQuotationSnapshotsModule } from '@/sales-order-quotation-snapshots/sales-order-quotation-snapshots.module';
import { FormSubmissionsModule } from '@/form-submissions/form-submissions.module';
import { ParametersModule } from '@/parameters/parameters.module';

/**
 * Quotation Checkout Module.
 *
 * Provides direct checkout from quotation acceptance (skip cart flow).
 * Creates SalesOrder and manages booking transitions.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRequestEntity,
      QuotationItemEntity,
      BookingEntity,
      SalesOrderEntity,
      SalesOrderItemEntity,
    ]),
    forwardRef(() => BookingsModule),
    NotificationsModule,
    SalesOrderQuotationSnapshotsModule,
    FormSubmissionsModule,
    ParametersModule,
  ],
  controllers: [QuotationCheckoutController],
  providers: [QuotationCheckoutService],
  exports: [QuotationCheckoutService],
})
export class QuotationCheckoutModule {}
