import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherRedemptionEntity } from '@/voucher-redemptions/persistence/entities/voucher-redemption.entity';
import { BaseVoucherRedemptionRepository } from '@/voucher-redemptions/persistence/base-voucher-redemption.repository';
import { VoucherRedemptionRepository } from '@/voucher-redemptions/persistence/repositories/voucher-redemption.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherRedemptionEntity])],
  providers: [
    {
      provide: BaseVoucherRedemptionRepository,
      useClass: VoucherRedemptionRepository,
    },
  ],
  exports: [BaseVoucherRedemptionRepository, TypeOrmModule],
})
export class VoucherRedemptionPersistenceModule {}
