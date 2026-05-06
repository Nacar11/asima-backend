import { Module, forwardRef } from '@nestjs/common';
import { EscrowTransactionPersistenceModule } from './persistence/persistence.module';
import { EscrowTransactionsService } from './escrow-transactions.service';
import { EscrowTransactionsController } from './escrow-transactions.controller';
import { BookingsModule } from '@/bookings/bookings.module';
import { BookingMilestonesModule } from '@/booking-milestones/booking-milestones.module';
import { BookingMilestonePersistenceModule } from '@/booking-milestones/persistence/persistence.module';
import { NotificationsModule } from '@/notifications/notifications.module';

/**
 * Escrow Transactions Module.
 *
 * Provides escrow transaction functionality for booking payments.
 * Handles deposits, releases, refunds, and dispute holds.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    EscrowTransactionPersistenceModule,
    forwardRef(() => BookingsModule),
    forwardRef(() => BookingMilestonesModule),
    BookingMilestonePersistenceModule,
    NotificationsModule,
  ],
  controllers: [EscrowTransactionsController],
  providers: [EscrowTransactionsService],
  exports: [EscrowTransactionsService],
})
export class EscrowTransactionsModule {}
