import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ShoppingCartSeedService } from './shopping-cart-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShoppingCartEntity,
      ShoppingCartItemEntity,
      ProductVariantEntity,
      UserEntity,
    ]),
  ],
  providers: [ShoppingCartSeedService],
  exports: [ShoppingCartSeedService],
})
export class ShoppingCartSeedModule {}
