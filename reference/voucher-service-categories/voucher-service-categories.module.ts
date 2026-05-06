import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherServiceCategoryEntity } from '@/voucher-service-categories/persistence/entities/voucher-service-category.entity';

/**
 * Voucher service categories module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([VoucherServiceCategoryEntity])],
  exports: [TypeOrmModule],
})
export class VoucherServiceCategoriesModule {}
