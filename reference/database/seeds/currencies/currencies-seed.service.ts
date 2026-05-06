import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Service for seeding currencies
 */
@Injectable()
export class CurrenciesSeedService implements ISeedService {
  constructor(
    @InjectRepository(CurrencyEntity)
    private repository: Repository<CurrencyEntity>,
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
        console.error('❌ No user found. Cannot proceed to seed currencies.');
        return;
      }

      const currencies = [
        {
          code: 'PHP',
          name: 'Philippine Peso',
          symbol: '₱',
          exchange_rate_to_php: 1.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          exchange_rate_to_php: 56.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          exchange_rate_to_php: 60.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'GBP',
          name: 'British Pound',
          symbol: '£',
          exchange_rate_to_php: 70.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'JPY',
          name: 'Japanese Yen',
          symbol: '¥',
          exchange_rate_to_php: 0.38,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'AUD',
          name: 'Australian Dollar',
          symbol: 'A$',
          exchange_rate_to_php: 37.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'SGD',
          name: 'Singapore Dollar',
          symbol: 'S$',
          exchange_rate_to_php: 41.0,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
        {
          code: 'HKD',
          name: 'Hong Kong Dollar',
          symbol: 'HK$',
          exchange_rate_to_php: 7.2,
          is_active: true,
          created_by: user,
          updated_by: user,
        },
      ];

      await this.repository.save(
        currencies.map((currency) => this.repository.create(currency)),
      );

      console.log(`✅ ${currencies.length} currencies seeded successfully`);
    }
  }
}
