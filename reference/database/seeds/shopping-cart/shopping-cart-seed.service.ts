import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class ShoppingCartSeedService implements ISeedService {
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
    const count = await this.cartRepository.count();

    if (!count) {
      // Get admin user
      const adminUser = await this.userRepository.findOne({
        where: { id: 1 },
      });

      // Get john.doe user
      const johnDoeUser = await this.userRepository.findOne({
        where: { email: 'john.doe@cody.inc' },
      });

      if (!adminUser) {
        console.error(
          '❌ No admin user found. Cannot proceed to seed shopping carts.',
        );
        return;
      }

      // Get some product variants to add to cart
      const productVariants = await this.productVariantRepository.find({
        take: 10,
        where: { status: 'Active' },
      });

      if (productVariants.length < 2) {
        console.error(
          '❌ Not enough product variants found. Cannot proceed to seed shopping carts.',
        );
        return;
      }

      let totalCartsCreated = 0;
      let totalItemsAdded = 0;

      // Create a shopping cart for admin user
      const adminCart = await this.cartRepository.save({
        user_id: adminUser.id,
        created_by: adminUser,
        updated_by: adminUser,
      });

      // Create cart items for admin - some selected, some not
      const adminCartItems: Partial<ShoppingCartItemEntity>[] = [];

      // First 3 items are selected
      for (let i = 0; i < Math.min(3, productVariants.length); i++) {
        adminCartItems.push({
          shopping_cart_id: adminCart.id,
          variant_id: productVariants[i].id,
          quantity: Math.floor(Math.random() * 3) + 1,
          is_selected: true,
          created_by: adminUser,
          updated_by: adminUser,
        });
      }

      // Next 2 items are not selected
      for (let i = 3; i < Math.min(5, productVariants.length); i++) {
        adminCartItems.push({
          shopping_cart_id: adminCart.id,
          variant_id: productVariants[i].id,
          quantity: Math.floor(Math.random() * 2) + 1,
          is_selected: false,
          created_by: adminUser,
          updated_by: adminUser,
        });
      }

      for (const item of adminCartItems) {
        await this.cartItemRepository.save(item);
      }

      totalCartsCreated++;
      totalItemsAdded += adminCartItems.length;

      console.log(
        `   - Admin cart: ${adminCartItems.length} items (${adminCartItems.filter((i) => i.is_selected).length} selected)`,
      );

      // Create a shopping cart for john.doe user
      if (johnDoeUser) {
        const johnDoeCart = await this.cartRepository.save({
          user_id: johnDoeUser.id,
          created_by: johnDoeUser,
          updated_by: johnDoeUser,
        });

        // Create cart items for john.doe - use different variants
        const johnDoeCartItems: Partial<ShoppingCartItemEntity>[] = [];

        // Select 4 items for john.doe (is_selected: true)
        const startIndex = Math.min(5, productVariants.length);
        for (
          let i = startIndex;
          i < Math.min(startIndex + 4, productVariants.length);
          i++
        ) {
          johnDoeCartItems.push({
            shopping_cart_id: johnDoeCart.id,
            variant_id: productVariants[i].id,
            quantity: Math.floor(Math.random() * 3) + 1,
            is_selected: true,
            created_by: johnDoeUser,
            updated_by: johnDoeUser,
          });
        }

        // If we don't have enough unique variants, reuse some with is_selected: true
        if (johnDoeCartItems.length < 3 && productVariants.length >= 3) {
          for (let i = 0; i < 3 && johnDoeCartItems.length < 3; i++) {
            // Check if this variant is not already in john.doe's cart
            const variantId = productVariants[i].id;
            const alreadyExists = johnDoeCartItems.some(
              (item) => item.variant_id === variantId,
            );
            if (!alreadyExists) {
              johnDoeCartItems.push({
                shopping_cart_id: johnDoeCart.id,
                variant_id: variantId,
                quantity: Math.floor(Math.random() * 2) + 1,
                is_selected: true,
                created_by: johnDoeUser,
                updated_by: johnDoeUser,
              });
            }
          }
        }

        // Add 1 unselected item
        if (productVariants.length > 0) {
          const lastVariant = productVariants[productVariants.length - 1];
          const alreadyExists = johnDoeCartItems.some(
            (item) => item.variant_id === lastVariant.id,
          );
          if (!alreadyExists) {
            johnDoeCartItems.push({
              shopping_cart_id: johnDoeCart.id,
              variant_id: lastVariant.id,
              quantity: 1,
              is_selected: false,
              created_by: johnDoeUser,
              updated_by: johnDoeUser,
            });
          }
        }

        for (const item of johnDoeCartItems) {
          await this.cartItemRepository.save(item);
        }

        totalCartsCreated++;
        totalItemsAdded += johnDoeCartItems.length;

        const selectedCount = johnDoeCartItems.filter(
          (i) => i.is_selected,
        ).length;
        console.log(
          `   - John Doe cart: ${johnDoeCartItems.length} items (${selectedCount} selected)`,
        );
      } else {
        console.log(
          '   ⚠️  john.doe@cody.inc user not found, skipping their cart',
        );
      }

      console.log(`✅ Shopping carts seeded successfully:`);
      console.log(`   - ${totalCartsCreated} carts created`);
      console.log(`   - ${totalItemsAdded} total items added`);
    } else {
      console.log('⚠️  Shopping carts already exist, skipping seed');
    }
  }
}
