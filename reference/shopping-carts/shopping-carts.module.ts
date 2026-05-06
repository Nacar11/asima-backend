import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCartsController } from './shopping-carts.controller';
import { ShoppingCartsService } from './shopping-carts.service';
import { ShoppingCartPersistenceModule } from './persistence/persistence.module';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { InventoryStocksModule } from '@/inventory-stocks/inventory-stocks.module';
import { ServicesModule } from '@/services/services.module';
import { ServicePackagesModule } from '@/service-packages/service-packages.module';
import { UserAddressesModule } from '@/user-addresses/user-addresses.module';
import { ServiceAreasModule } from '@/service-areas/service-areas.module';
import { SellerSchedulesModule } from '@/seller-schedules/seller-schedules.module';
import { CartItemAddonsModule } from '@/cart-item-addons/cart-item-addons.module';
import { CartItemOptionsModule } from '@/cart-item-options/cart-item-options.module';
import { ServiceAddonsModule } from '@/service-addons/service-addons.module';
import { ServiceOptionValuesModule } from '@/service-option-values/service-option-values.module';
import { ServiceOptionGroupsModule } from '@/service-option-groups/service-option-groups.module';
import { ServiceOptionPricingRulesModule } from '@/service-option-pricing-rules/service-option-pricing-rules.module';
import { SellersModule } from '@/sellers/sellers.module';
import { RedisHelper } from '@/utils/helpers/redis.helper';

/**
 * Shopping carts module.
 *
 * Provides shopping cart functionality for the e-commerce platform.
 * Handles cart operations including adding, updating, and removing items.
 * Integrates with product variants, products, services, and service packages for validation.
 * Includes service area (location) validation and availability checking.
 *
 * @version 3
 * @since 1.0.0
 */
@Module({
  imports: [
    ShoppingCartPersistenceModule,
    TypeOrmModule.forFeature([ProductVariantEntity, ProductEntity]),
    InventoryStocksModule,
    ServicesModule,
    ServicePackagesModule,
    UserAddressesModule,
    ServiceAreasModule,
    SellerSchedulesModule,
    CartItemAddonsModule,
    CartItemOptionsModule,
    ServiceAddonsModule,
    ServiceOptionValuesModule,
    ServiceOptionGroupsModule,
    ServiceOptionPricingRulesModule,
    SellersModule,
  ],
  controllers: [ShoppingCartsController],
  providers: [ShoppingCartsService, RedisHelper],
  exports: [ShoppingCartsService],
})
export class ShoppingCartsModule {}
