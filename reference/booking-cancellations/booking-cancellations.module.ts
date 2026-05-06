import { Module, forwardRef } from '@nestjs/common';
import { BookingCancellationsService } from './booking-cancellations.service';
import { BookingCancellationsController } from './booking-cancellations.controller';
import { BookingCancellationPersistenceModule } from './persistence/persistence.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { EscrowTransactionsModule } from '@/escrow-transactions/escrow-transactions.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { BookingMilestonePersistenceModule } from '@/booking-milestones/persistence/persistence.module';

@Module({
  imports: [
    BookingCancellationPersistenceModule,
    BookingMilestonePersistenceModule,
    forwardRef(() => BookingsModule),
    EscrowTransactionsModule,
    NotificationsModule,
    VouchersModule,
  ],
  controllers: [BookingCancellationsController],
  providers: [BookingCancellationsService],
  exports: [BookingCancellationsService],
})
export class BookingCancellationsModule {}
