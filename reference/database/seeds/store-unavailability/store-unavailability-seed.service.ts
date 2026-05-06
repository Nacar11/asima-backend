import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding store unavailability
 */
@Injectable()
export class StoreUnavailabilitySeedService implements ISeedService {
  constructor(
    @InjectRepository(StoreUnavailabilityEntity)
    private repository: Repository<StoreUnavailabilityEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const user = await this.userRepository.findOne({
        where: {
          id: 1,
        },
      });

      if (!user) {
        console.error(
          '❌ No user found. Cannot proceed to seed store unavailability.',
        );
        return;
      }

      const sellers = await this.sellerRepository.find({ take: 2 });

      if (sellers.length === 0) {
        console.log(
          '⚠️  No sellers found. Skipping store unavailability seed.',
        );
        return;
      }

      // Create a holiday unavailability for next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const holidayDate = nextMonth.toISOString().split('T')[0];

      const unavailabilities = sellers.map((seller) => ({
        seller_id: seller.id,
        unavailable_date: holidayDate,
        start_time: null,
        end_time: null,
        is_full_day: true,
        reason: 'Holiday',
        created_by: user,
        updated_by: user,
      }));

      await this.repository.save(
        unavailabilities.map((unavailability) =>
          this.repository.create(unavailability),
        ),
      );

      console.log(
        `✅ ${unavailabilities.length} store unavailability records seeded successfully`,
      );
    }
  }
}
