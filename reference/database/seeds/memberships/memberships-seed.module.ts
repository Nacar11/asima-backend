import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsSeedService } from '@/database/seeds/memberships/memberships-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      MembershipEntity,
      MembershipPaymentEntity,
      MembershipVoucherGrantEntity,
      MembershipPlanEntity,
      MembershipPlanBillingPeriodEntity,
      VoucherEntity,
    ]),
  ],
  providers: [MembershipsSeedService],
  exports: [MembershipsSeedService],
})
export class MembershipsSeedModule {}
