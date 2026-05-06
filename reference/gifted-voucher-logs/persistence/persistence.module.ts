import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherGiftLogEntity } from '@/vouchers/persistence/entities/voucher-gift-log.entity';
import { BaseGiftedVoucherLogRepository } from '@/gifted-voucher-logs/persistence/base-gifted-voucher-log.repository';
import { GiftedVoucherLogRepository } from '@/gifted-voucher-logs/persistence/repositories/gifted-voucher-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherGiftLogEntity])],
  providers: [
    {
      provide: BaseGiftedVoucherLogRepository,
      useClass: GiftedVoucherLogRepository,
    },
  ],
  exports: [BaseGiftedVoucherLogRepository, TypeOrmModule],
})
export class GiftedVoucherLogPersistenceModule {}
