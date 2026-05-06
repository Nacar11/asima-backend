import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersService } from '@/vouchers/vouchers.service';
import { VouchersSchedulerService } from '@/vouchers/vouchers-scheduler.service';
import { VoucherPersistenceModule } from '@/vouchers/persistence/persistence.module';
import { AdminVouchersController } from '@/vouchers/controllers/admin-vouchers.controller';
import { SellerVouchersController } from '@/vouchers/controllers/seller-vouchers.controller';
import { CustomerVouchersController } from '@/vouchers/controllers/customer-vouchers.controller';
import { VoucherCategoriesModule } from '@/voucher-categories/voucher-categories.module';
import { VoucherProductsModule } from '@/voucher-products/voucher-products.module';
import { VoucherServiceCategoriesModule } from '@/voucher-service-categories/voucher-service-categories.module';
import { VoucherServicesModule } from '@/voucher-services/voucher-services.module';
import { SalesOrderVouchersModule } from '@/sales-order-vouchers/sales-order-vouchers.module';
import { VoucherRedemptionsModule } from '@/voucher-redemptions/voucher-redemptions.module';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';

@Module({
  imports: [
    JwtModule.register({}),
    VoucherPersistenceModule,
    TypeOrmModule.forFeature([
      ProductEntity,
      CategoryEntity,
      ProductVariantEntity,
      ProductCategoryEntity,
      ServiceEntity,
      ServiceCategoryEntity,
      ShoppingCartEntity,
      ShoppingCartItemEntity,
    ]),
    VoucherRedemptionsModule,
    VoucherCategoriesModule,
    VoucherProductsModule,
    VoucherServiceCategoriesModule,
    VoucherServicesModule,
    SalesOrderVouchersModule,
  ],
  controllers: [
    AdminVouchersController,
    SellerVouchersController,
    CustomerVouchersController,
  ],
  providers: [VouchersService, VouchersSchedulerService],
  exports: [VouchersService],
})
export class VouchersModule {}
