import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { ISeedService } from '../seed.interface';

const TARGET_USER_ID = 14;
const TARGET_ITEM_COUNT = 120;

@Injectable()
export class StressTestCartSeedService implements ISeedService {
  constructor(
    @InjectRepository(ShoppingCartEntity)
    private cartRepository: Repository<ShoppingCartEntity>,
    @InjectRepository(ShoppingCartItemEntity)
    private cartItemRepository: Repository<ShoppingCartItemEntity>,
    @InjectRepository(ProductVariantEntity)
    private productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: TARGET_USER_ID },
    });

    if (!user) {
      console.error(
        `❌ User ID ${TARGET_USER_ID} not found. Cannot seed stress-test cart.`,
      );
      return;
    }

    // Find or create cart for this user
    let cart = await this.cartRepository.findOne({
      where: { user_id: TARGET_USER_ID },
    });

    if (cart) {
      const existingCount = await this.cartItemRepository.count({
        where: { shopping_cart_id: cart.id, deleted_at: null as any },
      });

      if (existingCount >= TARGET_ITEM_COUNT) {
        console.log(
          `⚠️  Stress-test cart for user ${TARGET_USER_ID} already has ${existingCount} items, skipping`,
        );
        return;
      }
    } else {
      cart = await this.cartRepository.save({
        user_id: user.id,
        created_by: user,
        updated_by: user,
      });
    }

    const variants = await this.productVariantRepository.find({
      where: { status: 'Active' },
      take: TARGET_ITEM_COUNT,
    });

    if (variants.length === 0) {
      console.error(
        '❌ No active product variants found. Cannot seed stress-test cart items.',
      );
      return;
    }

    const itemCount = variants.length;
    const items: Partial<ShoppingCartItemEntity>[] = variants.map(
      (variant, i) => ({
        shopping_cart_id: cart.id,
        variant_id: variant.id,
        item_type: CartItemTypeEnum.PRODUCT,
        quantity: (i % 5) + 1,
        is_selected: i % 2 === 0,
        created_by: user,
        updated_by: user,
      }),
    );

    await this.cartItemRepository.save(items);

    console.log(
      `✅ Stress-test cart seeded: ${itemCount} items for user ID ${TARGET_USER_ID} (cart ID ${cart.id})`,
    );
    if (itemCount < TARGET_ITEM_COUNT) {
      console.log(
        `   ⚠️  Only ${itemCount} active variants available (target was ${TARGET_ITEM_COUNT}). Add more product variants to reach the target.`,
      );
    }
    console.log(
      `   - Selected: ${items.filter((i) => i.is_selected).length}, Unselected: ${items.filter((i) => !i.is_selected).length}`,
    );
  }
}
