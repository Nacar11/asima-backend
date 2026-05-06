import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { IsNull, Repository } from 'typeorm';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Service for seeding categories
 */
@Injectable()
export class CategorySeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id: 1,
      },
    });
    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed categories.');
      return;
    }
    const seller1 = await this.sellerRepository.findOne({
      where: {
        id: 1,
      },
    });
    const seller2 = await this.sellerRepository.findOne({
      where: {
        id: 2,
      },
    });
    const seller3 = await this.sellerRepository.findOne({
      where: {
        id: 3,
      },
    });
    if (!seller1 || !seller2) {
      console.error('❌ No seller found. Cannot proceed to seed categories.');
      return;
    }
    type EnsureCategoryInput = {
      readonly category_name: string;
      readonly description: string;
      readonly slug: string;
      readonly display_order: number;
      readonly parent_category_id: number | null;
      readonly seller_id: number | null;
    };
    const ensureCategory = async (
      input: EnsureCategoryInput,
    ): Promise<CategoryEntity> => {
      const existing = await this.repository.findOne({
        where: {
          slug: input.slug,
          seller_id: input.seller_id === null ? IsNull() : input.seller_id,
        },
      });
      if (existing) {
        return existing;
      }
      return this.repository.save(
        this.repository.create({
          ...input,
          status: 'Active',
          created_by: user,
          updated_by: user,
        }),
      );
    };
    const globalParentCategories: EnsureCategoryInput[] = [
      {
        category_name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        display_order: 1,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Clothing',
        description: 'Apparel and fashion items',
        slug: 'clothing',
        display_order: 2,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Home & Garden',
        description: 'Home and garden products',
        slug: 'home-garden',
        display_order: 3,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Food & Beverages',
        description: 'Food and beverage items',
        slug: 'food-beverages',
        display_order: 4,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        slug: 'sports-outdoors',
        display_order: 5,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Books & Media',
        description: 'Books, movies, music and digital media',
        slug: 'books-media',
        display_order: 6,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Health & Beauty',
        description: 'Healthcare and beauty products',
        slug: 'health-beauty',
        display_order: 7,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Toys & Games',
        description: 'Toys, games and hobby items',
        slug: 'toys-games',
        display_order: 8,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Coffee Beans',
        description: 'Coffee beans and roasted coffee products',
        slug: 'coffee-beans',
        display_order: 9,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Drinkware',
        description: 'Cups, mugs, tumblers and drinkware accessories',
        slug: 'drinkware',
        display_order: 10,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Equipment',
        description: 'Brewing equipment and coffee tools',
        slug: 'equipment',
        display_order: 11,
        parent_category_id: null,
        seller_id: null,
      },
      {
        category_name: 'Ingredients',
        description: 'Coffee ingredients, syrups, powders and add-ons',
        slug: 'ingredients',
        display_order: 12,
        parent_category_id: null,
        seller_id: null,
      },
    ];
    const seller1ParentCategories: EnsureCategoryInput[] = [
      {
        category_name: 'Artisan Crafts',
        description: 'Handcrafted items and artisan products',
        slug: 'artisan-crafts',
        display_order: 1,
        parent_category_id: null,
        seller_id: seller1.id,
      },
      {
        category_name: 'Local Produce',
        description: 'Fresh local produce and farm products',
        slug: 'local-produce',
        display_order: 2,
        parent_category_id: null,
        seller_id: seller1.id,
      },
      {
        category_name: 'Custom Items',
        description: 'Customizable and personalized items',
        slug: 'custom-items',
        display_order: 3,
        parent_category_id: null,
        seller_id: seller1.id,
      },
    ];
    const seller2ParentCategories: EnsureCategoryInput[] = [
      {
        category_name: 'Fashion Picks',
        description: 'Curated apparel and accessories for this season',
        slug: 'fashion-picks',
        display_order: 1,
        parent_category_id: null,
        seller_id: seller2.id,
      },
      {
        category_name: 'Beauty Essentials',
        description: 'Skincare and personal care favorites',
        slug: 'beauty-essentials',
        display_order: 2,
        parent_category_id: null,
        seller_id: seller2.id,
      },
      {
        category_name: 'Activewear',
        description: 'Workout and outdoor-ready items',
        slug: 'activewear',
        display_order: 3,
        parent_category_id: null,
        seller_id: seller2.id,
      },
    ];
    // Uncle Brew (Seller 3) parent categories
    const seller3ParentCategories: EnsureCategoryInput[] = seller3
      ? [
          {
            category_name: 'Franchise Supplies',
            description: 'Equipment and supplies for Uncle Brew franchisees',
            slug: 'franchise-supplies',
            display_order: 1,
            parent_category_id: null,
            seller_id: seller3.id,
          },
        ]
      : [];
    const savedGlobalParents = new Map<string, number>();
    const savedSeller1Parents = new Map<string, number>();
    const savedSeller3Parents = new Map<string, number>();
    for (const category of globalParentCategories) {
      const saved = await ensureCategory(category);
      savedGlobalParents.set(category.slug, saved.id);
    }
    for (const category of seller1ParentCategories) {
      const saved = await ensureCategory(category);
      savedSeller1Parents.set(category.slug, saved.id);
    }
    for (const category of seller2ParentCategories) {
      await ensureCategory(category);
    }
    for (const category of seller3ParentCategories) {
      const saved = await ensureCategory(category);
      savedSeller3Parents.set(category.slug, saved.id);
    }
    const globalSubCategories: EnsureCategoryInput[] = [
      // Electronics subcategories
      {
        category_name: 'Smartphones',
        description: 'Mobile phones and accessories',
        slug: 'smartphones',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('electronics') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Laptops',
        description: 'Laptop computers and accessories',
        slug: 'laptops',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('electronics') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Audio Equipment',
        description: 'Headphones, speakers and audio devices',
        slug: 'audio-equipment',
        display_order: 3,
        parent_category_id: savedGlobalParents.get('electronics') ?? null,
        seller_id: null,
      },
      // Clothing subcategories
      {
        category_name: 'Clothing for men',
        description: 'Clothing for men',
        slug: 'mens-clothing',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('clothing') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Clothing for women',
        description: 'Clothing for women',
        slug: 'womens-clothing',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('clothing') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Clothing for children',
        description: 'Clothing for children',
        slug: 'kids-clothing',
        display_order: 3,
        parent_category_id: savedGlobalParents.get('clothing') ?? null,
        seller_id: null,
      },
      // Home & Garden subcategories
      {
        category_name: 'Kitchenware',
        description: 'Kitchen tools and cookware',
        slug: 'kitchenware',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('home-garden') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Furniture',
        description: 'Home furniture and decor',
        slug: 'furniture',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('home-garden') ?? null,
        seller_id: null,
      },
      // Food & Beverages subcategories
      {
        category_name: 'Beverages',
        description: 'Drinks and liquid refreshments',
        slug: 'beverages',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('food-beverages') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Snacks',
        description: 'Snack foods and treats',
        slug: 'snacks',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('food-beverages') ?? null,
        seller_id: null,
      },
      // Sports & Outdoors subcategories
      {
        category_name: 'Fitness Equipment',
        description: 'Exercise and fitness gear',
        slug: 'fitness-equipment',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('sports-outdoors') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Outdoor Gear',
        description: 'Camping and outdoor equipment',
        slug: 'outdoor-gear',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('sports-outdoors') ?? null,
        seller_id: null,
      },
      // Books & Media subcategories
      {
        category_name: 'Books',
        description: 'Physical and digital books',
        slug: 'books',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('books-media') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Music',
        description: 'Music albums and instruments',
        slug: 'music',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('books-media') ?? null,
        seller_id: null,
      },
      // Health & Beauty subcategories
      {
        category_name: 'Skincare',
        description: 'Skincare products and treatments',
        slug: 'skincare',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('health-beauty') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Personal Care',
        description: 'Personal hygiene and care products',
        slug: 'personal-care',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('health-beauty') ?? null,
        seller_id: null,
      },
      // Toys & Games subcategories
      {
        category_name: 'Educational Toys',
        description: 'Learning and educational toys',
        slug: 'educational-toys',
        display_order: 1,
        parent_category_id: savedGlobalParents.get('toys-games') ?? null,
        seller_id: null,
      },
      {
        category_name: 'Board Games',
        description: 'Board games and puzzles',
        slug: 'board-games',
        display_order: 2,
        parent_category_id: savedGlobalParents.get('toys-games') ?? null,
        seller_id: null,
      },
    ];
    const sellerSubCategories: EnsureCategoryInput[] = [
      // Artisan Crafts subcategories
      {
        category_name: 'Handmade Jewelry',
        description: 'Handcrafted jewelry items',
        slug: 'handmade-jewelry',
        display_order: 1,
        parent_category_id: savedSeller1Parents.get('artisan-crafts') ?? null,
        seller_id: seller1.id,
      },
      {
        category_name: 'Wood Crafts',
        description: 'Handcrafted wooden items',
        slug: 'wood-crafts',
        display_order: 2,
        parent_category_id: savedSeller1Parents.get('artisan-crafts') ?? null,
        seller_id: seller1.id,
      },
      // Local Produce subcategories
      {
        category_name: 'Fresh Vegetables',
        description: 'Locally grown vegetables',
        slug: 'fresh-vegetables',
        display_order: 1,
        parent_category_id: savedSeller1Parents.get('local-produce') ?? null,
        seller_id: seller1.id,
      },
      {
        category_name: 'Fresh Fruits',
        description: 'Locally grown fruits',
        slug: 'fresh-fruits',
        display_order: 2,
        parent_category_id: savedSeller1Parents.get('local-produce') ?? null,
        seller_id: seller1.id,
      },
      // Custom Items subcategories
      {
        category_name: 'Custom Prints',
        description: 'Custom printed items',
        slug: 'custom-prints',
        display_order: 1,
        parent_category_id: savedSeller1Parents.get('custom-items') ?? null,
        seller_id: seller1.id,
      },
      {
        category_name: 'Personalized Gifts',
        description: 'Personalized gift items',
        slug: 'personalized-gifts',
        display_order: 2,
        parent_category_id: savedSeller1Parents.get('custom-items') ?? null,
        seller_id: seller1.id,
      },
    ];
    // Uncle Brew (Seller 3) subcategories
    const seller3SubCategories: EnsureCategoryInput[] = seller3
      ? [
          // Franchise Supplies subcategories
          {
            category_name: 'Brewing Equipment',
            description: 'Coffee and tea brewing machines',
            slug: 'brewing-equipment',
            display_order: 1,
            parent_category_id:
              savedSeller3Parents.get('franchise-supplies') ?? null,
            seller_id: seller3.id,
          },
          {
            category_name: 'Cups & Packaging',
            description: 'Cups, lids, straws, and packaging materials',
            slug: 'cups-packaging',
            display_order: 2,
            parent_category_id:
              savedSeller3Parents.get('franchise-supplies') ?? null,
            seller_id: seller3.id,
          },
          {
            category_name: 'Ingredients & Syrups',
            description: 'Powders, syrups, and drink ingredients',
            slug: 'ingredients-syrups',
            display_order: 3,
            parent_category_id:
              savedSeller3Parents.get('franchise-supplies') ?? null,
            seller_id: seller3.id,
          },
        ]
      : [];
    let createdCount = 0;
    for (const category of globalSubCategories) {
      const existing = await this.repository.findOne({
        where: {
          slug: category.slug,
          seller_id:
            category.seller_id === null ? IsNull() : category.seller_id,
        },
      });
      if (!existing) {
        await ensureCategory(category);
        createdCount++;
      }
    }
    for (const category of sellerSubCategories) {
      const existing = await this.repository.findOne({
        where: {
          slug: category.slug,
          seller_id:
            category.seller_id === null ? IsNull() : category.seller_id,
        },
      });
      if (!existing) {
        await ensureCategory(category);
        createdCount++;
      }
    }
    for (const category of seller3SubCategories) {
      const existing = await this.repository.findOne({
        where: {
          slug: category.slug,
          seller_id:
            category.seller_id === null ? IsNull() : category.seller_id,
        },
      });
      if (!existing) {
        await ensureCategory(category);
        createdCount++;
      }
    }
    const parentCount =
      globalParentCategories.length +
      seller1ParentCategories.length +
      seller2ParentCategories.length +
      seller3ParentCategories.length;
    const subCount =
      globalSubCategories.length +
      sellerSubCategories.length +
      seller3SubCategories.length;
    console.log(
      `✅ Categories seed completed (${parentCount} parents defined, ${subCount} subs defined, ${createdCount} inserted)`,
    );
  }
}
