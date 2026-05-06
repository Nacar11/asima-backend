import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { MembershipVoucherConfigurationPersistenceModule } from '@/membership-voucher-configurations/persistence/persistence.module';
import { MembershipVoucherConfigurationsService } from '@/membership-voucher-configurations/membership-voucher-configurations.service';
import { AdminMembershipVoucherConfigurationsController } from '@/membership-voucher-configurations/controllers/admin-membership-voucher-configurations.controller';
import { MembershipVoucherConfigurationsController } from '@/membership-voucher-configurations/controllers/membership-voucher-configurations.controller';

@Module({
  imports: [
    MembershipVoucherConfigurationPersistenceModule,
    TypeOrmModule.forFeature([VoucherEntity]),
  ],
  controllers: [
    AdminMembershipVoucherConfigurationsController,
    MembershipVoucherConfigurationsController,
  ],
  providers: [MembershipVoucherConfigurationsService],
  exports: [MembershipVoucherConfigurationsService],
})
export class MembershipVoucherConfigurationsModule {}
