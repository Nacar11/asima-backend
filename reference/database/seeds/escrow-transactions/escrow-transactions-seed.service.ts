import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';

/**
 * Service for seeding escrow transactions
 */
@Injectable()
export class EscrowTransactionsSeedService implements ISeedService {
  constructor(
    @InjectRepository(EscrowTransactionEntity)
    private repository: Repository<EscrowTransactionEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const bookings = await this.bookingRepository.find({ take: 1 });

      if (bookings.length === 0) {
        console.log(
          '⚠️  No bookings found. Skipping escrow transactions seed.',
        );
        return;
      }

      // Escrow transactions require bookings, so we'll skip seeding for now
      // They should be created through the normal payment flow
      console.log(
        '⚠️  Escrow transactions seed skipped. They should be created through the normal payment flow.',
      );
    }
  }
}
