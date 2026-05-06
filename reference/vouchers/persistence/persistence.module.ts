import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseVoucherRepository } from '@/vouchers/persistence/base-voucher.repository';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { VoucherQrTokenEntity } from '@/vouchers/persistence/entities/voucher-qr-token.entity';
import { VoucherGiftLogEntity } from '@/vouchers/persistence/entities/voucher-gift-log.entity';
import { VoucherMapper } from '@/vouchers/persistence/mappers/voucher.mapper';
import { VoucherRepository } from '@/vouchers/persistence/repositories/voucher.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherEntity,
      UserVoucherEntity,
      VoucherQrTokenEntity,
      VoucherGiftLogEntity,
    ]),
  ],
  providers: [
    VoucherMapper,
    VoucherRepository,
    {
      provide: BaseVoucherRepository,
      useClass: VoucherRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    VoucherMapper,
    VoucherRepository,
    BaseVoucherRepository,
  ],
})
export class VoucherPersistenceModule {}
