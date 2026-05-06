import { Module, forwardRef } from '@nestjs/common';
import { GiftedVoucherLogPersistenceModule } from '@/gifted-voucher-logs/persistence/persistence.module';
import { GiftedVoucherLogsService } from '@/gifted-voucher-logs/gifted-voucher-logs.service';
import { AdminGiftedVoucherLogsController } from '@/gifted-voucher-logs/controllers/admin-gifted-voucher-logs.controller';
import { SellerGiftedVoucherLogsController } from '@/gifted-voucher-logs/controllers/seller-gifted-voucher-logs.controller';
import { VouchersModule } from '@/vouchers/vouchers.module';

@Module({
  imports: [
    GiftedVoucherLogPersistenceModule,
    forwardRef(() => VouchersModule),
  ],
  controllers: [
    AdminGiftedVoucherLogsController,
    SellerGiftedVoucherLogsController,
  ],
  providers: [GiftedVoucherLogsService],
  exports: [GiftedVoucherLogsService],
})
export class GiftedVoucherLogsModule {}
