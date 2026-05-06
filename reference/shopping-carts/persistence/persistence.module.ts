import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCartEntity } from './entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from './entities/shopping-cart-item.entity';
import { BaseShoppingCartRepository } from './base-shopping-cart.repository';
import { ShoppingCartRepository } from './repositories/shopping-cart.repository';
import { BaseShoppingCartItemRepository } from './base-shopping-cart-item.repository';
import { ShoppingCartItemRepository } from './repositories/shopping-cart-item.repository';
import { ShoppingCartMapper } from './mappers/shopping-cart.mapper';
import { ShoppingCartItemMapper } from './mappers/shopping-cart-item.mapper';

/**
 * Persistence module for shopping carts.
 *
 * Configures TypeORM entities and provides repository implementations
 * for dependency injection. Maps abstract repositories to concrete
 * implementations.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingCartEntity, ShoppingCartItemEntity]),
  ],
  providers: [
    ShoppingCartMapper,
    ShoppingCartItemMapper,
    {
      provide: BaseShoppingCartRepository,
      useClass: ShoppingCartRepository,
    },
    {
      provide: BaseShoppingCartItemRepository,
      useClass: ShoppingCartItemRepository,
    },
  ],
  exports: [
    BaseShoppingCartRepository,
    BaseShoppingCartItemRepository,
    ShoppingCartMapper,
    ShoppingCartItemMapper,
  ],
})
export class ShoppingCartPersistenceModule {}
