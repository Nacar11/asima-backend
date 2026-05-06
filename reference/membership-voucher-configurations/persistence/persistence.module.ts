import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { BaseMembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/base-membership-voucher-configuration.repository';
import { MembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/repositories/membership-voucher-configuration.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipVoucherConfigurationEntity])],
  providers: [
    {
      provide: BaseMembershipVoucherConfigurationRepository,
      useClass: MembershipVoucherConfigurationRepository,
    },
  ],
  exports: [BaseMembershipVoucherConfigurationRepository],
})
export class MembershipVoucherConfigurationPersistenceModule {}
