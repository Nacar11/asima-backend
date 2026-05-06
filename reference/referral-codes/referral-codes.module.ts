import { Module } from '@nestjs/common';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { ReferralCodesPersistenceModule } from '@/referral-codes/persistence/persistence.module';
import { ReferralCodesService } from '@/referral-codes/referral-codes.service';
import { ReferralCodesSchedulerService } from '@/referral-codes/referral-codes-scheduler.service';
import { ReferralCodesController, PublicReferralCodesController } from '@/referral-codes/referral-codes.controller';
import { ReferralCodeUsagesController } from '@/referral-codes/referral-code-usages.controller';

@Module({
  imports: [ReferralCodesPersistenceModule, VouchersModule],
  providers: [ReferralCodesService, ReferralCodesSchedulerService],
  controllers: [
    ReferralCodesController,
    PublicReferralCodesController,
    ReferralCodeUsagesController,
  ],
  exports: [ReferralCodesService],
})
export class ReferralCodesModule {}
