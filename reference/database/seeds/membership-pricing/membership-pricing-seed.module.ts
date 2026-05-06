import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPricingSeedService } from '@/database/seeds/membership-pricing/membership-pricing-seed.service';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParameterEntity,
      UserEntity,
      VoucherEntity,
      MembershipVoucherConfigurationEntity,
      MembershipPlanEntity,
      MembershipBillingPeriodEntity,
      MembershipPlanBillingPeriodEntity,
    ]),
  ],
  providers: [MembershipPricingSeedService],
  exports: [MembershipPricingSeedService],
})
export class MembershipPricingSeedModule {}
