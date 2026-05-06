import { Module, forwardRef } from '@nestjs/common';
import { DisputePersistenceModule } from './persistence/persistence.module';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { DisputeMessagesService } from './dispute-messages.service';
import { DisputeMessagesController } from './dispute-messages.controller';
import { BookingsModule } from '@/bookings/bookings.module';
import { SellersModule } from '@/sellers/sellers.module';
import { EscrowTransactionsModule } from '@/escrow-transactions/escrow-transactions.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { BookingMilestonePersistenceModule } from '@/booking-milestones/persistence/persistence.module';

/**
 * Disputes Module.
 *
 * Provides dispute functionality for customer-initiated disputes
 * on completed bookings. Handles dispute lifecycle, evidence management,
 * provider responses, and admin resolution with escrow integration.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    DisputePersistenceModule,
    BookingMilestonePersistenceModule,
    forwardRef(() => BookingsModule),
    SellersModule,
    forwardRef(() => EscrowTransactionsModule),
    NotificationsModule,
  ],
  controllers: [DisputesController, DisputeMessagesController],
  providers: [DisputesService, DisputeMessagesService],
  exports: [DisputesService, DisputeMessagesService],
})
export class DisputesModule {}
