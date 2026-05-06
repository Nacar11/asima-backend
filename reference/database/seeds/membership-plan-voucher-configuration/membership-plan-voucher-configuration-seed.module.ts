import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlanVoucherConfigurationSeedService } from './membership-plan-voucher-configuration-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      VoucherEntity,
      MembershipVoucherConfigurationEntity,
      MembershipPlanEntity,
    ]),
  ],
  providers: [MembershipPlanVoucherConfigurationSeedService],
  exports: [MembershipPlanVoucherConfigurationSeedService],
})
export class MembershipPlanVoucherConfigurationSeedModule {}
