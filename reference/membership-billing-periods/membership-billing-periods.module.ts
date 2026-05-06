import { Module } from '@nestjs/common';
import { MembershipBillingPeriodPersistenceModule } from './persistence/persistence.module';
import { MembershipBillingPeriodsService } from './membership-billing-periods.service';
import { MembershipBillingPeriodsController } from './controllers/membership-billing-periods.controller';

@Module({
  imports: [MembershipBillingPeriodPersistenceModule],
  controllers: [MembershipBillingPeriodsController],
  providers: [MembershipBillingPeriodsService],
  exports: [MembershipBillingPeriodsService],
})
export class MembershipBillingPeriodsModule {}
