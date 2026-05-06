import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { EscrowTransactionsSeedService } from '@/database/seeds/escrow-transactions/escrow-transactions-seed.service';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';

/**
 * Seed module for escrow transactions
 */
@Module({
  imports: [TypeOrmModule.forFeature([EscrowTransactionEntity, BookingEntity])],
  providers: [EscrowTransactionsSeedService],
  exports: [EscrowTransactionsSeedService],
})
export class EscrowTransactionsSeedModule {}
