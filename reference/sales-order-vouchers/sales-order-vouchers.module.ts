import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';

/**
 * Sales-order vouchers module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SalesOrderVoucherEntity])],
  exports: [TypeOrmModule],
})
export class SalesOrderVouchersModule {}
