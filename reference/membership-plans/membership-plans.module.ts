import { Module } from '@nestjs/common';
import { MembershipPlanPersistenceModule } from './persistence/persistence.module';
import { MembershipPlansService } from './membership-plans.service';
import { MembershipPlansController } from '@/membership-plans/controllers/membership-plans.controller';
import { MembershipVoucherConfigurationsModule } from '@/membership-voucher-configurations/membership-voucher-configurations.module';
import { MembershipPersistenceModule } from '@/memberships/persistence/persistence.module';

/**
 * Module for membership plans management.
 */
@Module({
  imports: [
    MembershipPlanPersistenceModule,
    MembershipPersistenceModule,
    MembershipVoucherConfigurationsModule,
  ],
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService],
  exports: [MembershipPlansService],
})
export class MembershipPlansModule {}
