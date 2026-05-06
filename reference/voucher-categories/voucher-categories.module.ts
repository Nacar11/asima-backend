import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';

/**
 * Voucher categories module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VoucherCategoryEntity])],
  exports: [TypeOrmModule],
})
export class VoucherCategoriesModule {}
