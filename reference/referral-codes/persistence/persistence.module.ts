import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';
import { ReferralCodeUsageEntity } from '@/referral-codes/persistence/entities/referral-code-usage.entity';
import { ReferralCodeUsageSelectionEntity } from '@/referral-codes/persistence/entities/referral-code-usage-selection.entity';
import { BaseReferralCodeRepository } from '@/referral-codes/persistence/base-referral-code.repository';
import { BaseReferralCodeUsageRepository } from '@/referral-codes/persistence/base-referral-code-usage.repository';
import { BaseReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/base-referral-code-usage-selection.repository';
import { ReferralCodeRepository } from '@/referral-codes/persistence/repositories/referral-code.repository';
import { ReferralCodeUsageRepository } from '@/referral-codes/persistence/repositories/referral-code-usage.repository';
import { ReferralCodeUsageSelectionRepository } from '@/referral-codes/persistence/repositories/referral-code-usage-selection.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCodeEntity,
      ReferralCodeVoucherEntity,
      ReferralCodeUsageEntity,
      ReferralCodeUsageSelectionEntity,
    ]),
  ],
  providers: [
    ReferralCodeRepository,
    { provide: BaseReferralCodeRepository, useClass: ReferralCodeRepository },
    ReferralCodeUsageRepository,
    { provide: BaseReferralCodeUsageRepository, useClass: ReferralCodeUsageRepository },
    ReferralCodeUsageSelectionRepository,
    {
      provide: BaseReferralCodeUsageSelectionRepository,
      useClass: ReferralCodeUsageSelectionRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseReferralCodeRepository,
    BaseReferralCodeUsageRepository,
    BaseReferralCodeUsageSelectionRepository,
  ],
})
export class ReferralCodesPersistenceModule {}
