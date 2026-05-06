import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherRedemptionPersistenceModule } from '@/voucher-redemptions/persistence/persistence.module';
import { VoucherRedemptionsService } from '@/voucher-redemptions/voucher-redemptions.service';
import { AdminVoucherRedemptionsController } from '@/voucher-redemptions/controllers/admin-voucher-redemptions.controller';
import { SellerVoucherRedemptionsController } from '@/voucher-redemptions/controllers/seller-voucher-redemptions.controller';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherServiceEntity } from '@/voucher-services/persistence/entities/voucher-service.entity';
import { VoucherServiceCategoryEntity } from '@/voucher-service-categories/persistence/entities/voucher-service-category.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';

@Module({
  imports: [
    VoucherRedemptionPersistenceModule,
    TypeOrmModule.forFeature([
      VoucherCategoryEntity,
      VoucherProductEntity,
      VoucherServiceEntity,
      VoucherServiceCategoryEntity,
      ProductCategoryEntity,
    ]),
  ],
  controllers: [
    AdminVoucherRedemptionsController,
    SellerVoucherRedemptionsController,
  ],
  providers: [VoucherRedemptionsService],
  exports: [VoucherRedemptionsService, VoucherRedemptionPersistenceModule],
})
export class VoucherRedemptionsModule {}
