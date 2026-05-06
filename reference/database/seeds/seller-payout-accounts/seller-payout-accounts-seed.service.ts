import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerPayoutAccountEntity } from '@/seller-payout-accounts/persistence/entities/seller-payout-account.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { PayoutAccountTypeEnum } from '@/seller-payout-accounts/enums/payout-account-type.enum';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding seller payout accounts
 */
@Injectable()
export class SellerPayoutAccountsSeedService implements ISeedService {
  constructor(
    @InjectRepository(SellerPayoutAccountEntity)
    private repository: Repository<SellerPayoutAccountEntity>,
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
          '❌ No user found. Cannot proceed to seed seller payout accounts.',
        );
        return;
      }

      const sellers = await this.sellerRepository.find({ take: 2 });

      if (sellers.length === 0) {
        console.log(
          '⚠️  No sellers found. Skipping seller payout accounts seed.',
        );
        return;
      }

      const accounts = sellers.map((seller) => ({
        seller_id: seller.id,
        account_type: PayoutAccountTypeEnum.BANK_TRANSFER,
        account_name: `${seller.store_name} Bank Account`,
        account_number: '1234567890',
        bank_name: 'Sample Bank',
        is_default: true,
        is_verified: false,
        status: 'active',
        created_by: user,
        updated_by: user,
      }));

      await this.repository.save(
        accounts.map((account) => this.repository.create(account)),
      );

      console.log(
        `✅ ${accounts.length} seller payout accounts seeded successfully`,
      );
    }
  }
}
