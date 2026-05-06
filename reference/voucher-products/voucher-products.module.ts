import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';

/**
 * Voucher products module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VoucherProductEntity])],
  exports: [TypeOrmModule],
})
export class VoucherProductsModule {}
