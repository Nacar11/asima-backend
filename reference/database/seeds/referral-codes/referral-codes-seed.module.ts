import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';
import { ReferralCodeSeedService } from '@/database/seeds/referral-codes/referral-codes-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

/**
 * Seed module for referral codes
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCodeEntity,
      ReferralCodeVoucherEntity,
      UserEntity,
      VoucherEntity,
    ]),
  ],
  providers: [ReferralCodeSeedService],
  exports: [ReferralCodeSeedService],
})
export class ReferralCodeSeedModule {}
