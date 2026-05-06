import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class ProductCategorySeedService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductCategoryEntity)
    private repository: Repository<ProductCategoryEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    if (!user) {
      console.error(
        '❌ No user found. Cannot proceed to seed product categories.',
      );
      return;
    }
    const products = await this.productRepository.find();
    const categories = await this.categoryRepository.find();
    if (products.length === 0) {
      console.error(
        '❌ No products found. Cannot proceed to seed product categories.',
      );
      return;
    }
    if (categories.length === 0) {
      console.error(
        '❌ No categories found. Cannot proceed to seed product categories.',
      );
      return;
    }
    const categoryMap = new Map<string, CategoryEntity>();
    categories.forEach((category) => {
      const scope = category.seller_id ?? 'global';
      categoryMap.set(
        `${scope}-${category.category_name.toLowerCase()}`,
        category,
      );
    });
    const existingProductCategories = await this.repository.find();
    const existingKeySet = new Set<string>();
    existingProductCategories.forEach((pc) => {
      existingKeySet.add(`${pc.product_id}-${pc.category_id}`);
    });
    const ensureProductCategory = async (input: {
      readonly product_id: number;
      readonly category_id: number;
      readonly is_primary: boolean;
      readonly display_order: number;
    }): Promise<void> => {
      const key = `${input.product_id}-${input.category_id}`;
      if (existingKeySet.has(key)) {
        return;
      }
      await this.repository.save({
        product_id: input.product_id,
        category_id: input.category_id,
        is_primary: input.is_primary,
        display_order: input.display_order,
        created_by: user,
        updated_by: user,
      });
      existingKeySet.add(key);
    };

    const addProductToCategories = async (
      product: ProductEntity | undefined,
      categoryNames: Array<{
        name: string;
        isPrimary: boolean;
        sellerId?: number | null;
      }>,
    ): Promise<void> => {
      if (!product) {
        return;
      }
      let displayOrder = 1;
      for (const { name, isPrimary, sellerId } of categoryNames) {
        const scope = sellerId ?? 'global';
        const category = categoryMap.get(`${scope}-${name.toLowerCase()}`);
        if (!category) {
          continue;
        }
        await ensureProductCategory({
          product_id: product.id,
          category_id: category.id,
          is_primary: isPrimary,
          display_order: displayOrder,
        });
        displayOrder++;
      }
    };

    // Electronics Products
    await addProductToCategories(
      products.find((p) => p.product_name.includes('iPhone 15 Pro Max')),
      [
        { name: 'Smartphones', isPrimary: true },
        { name: 'Audio Equipment', isPrimary: false },
        { name: 'Electronics', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('MacBook Air M2')),
      [
        { name: 'Laptops', isPrimary: true },
        { name: 'Electronics', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Sony WH-1000XM5 Headphones'),
      ),
      [
        { name: 'Audio Equipment', isPrimary: true },
        { name: 'Electronics', isPrimary: false },
      ],
    );

    // Clothing Products
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes("Men's Premium Cotton T-Shirt"),
      ),
      [
        { name: 'Clothing for men', isPrimary: true },
        { name: 'Clothing', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes("Men's Premium Cotton T-Shirt"),
      ),
      [{ name: 'Fashion Picks', isPrimary: false, sellerId: 2 }],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes("Women's Elegant Summer Dress"),
      ),
      [
        { name: 'Clothing for women', isPrimary: true },
        { name: 'Clothing', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes("Women's Elegant Summer Dress"),
      ),
      [{ name: 'Fashion Picks', isPrimary: false, sellerId: 2 }],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes("Kids' Educational Toy Set"),
      ),
      [
        { name: 'Clothing for children', isPrimary: true },
        { name: 'Educational Toys', isPrimary: false },
        { name: 'Toys & Games', isPrimary: false },
      ],
    );

    // Home & Garden Products
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Professional Chef Knife Set'),
      ),
      [
        { name: 'Kitchenware', isPrimary: true },
        { name: 'Home & Garden', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Modern Minimalist Sofa')),
      [
        { name: 'Furniture', isPrimary: true },
        { name: 'Home & Garden', isPrimary: false },
      ],
    );

    // Food & Beverages Products
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Premium Arabica Coffee Beans'),
      ),
      [
        { name: 'Beverages', isPrimary: true },
        { name: 'Food & Beverages', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Organic Green Tea Collection'),
      ),
      [
        { name: 'Beverages', isPrimary: true },
        { name: 'Food & Beverages', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Artisan Chocolate Bar Collection'),
      ),
      [
        { name: 'Snacks', isPrimary: true },
        { name: 'Food & Beverages', isPrimary: false },
      ],
    );

    // Sports & Outdoors Products
    await addProductToCategories(
      products.find((p) => p.product_name.includes('Professional Yoga Mat')),
      [
        { name: 'Fitness Equipment', isPrimary: true },
        { name: 'Sports & Outdoors', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Professional Yoga Mat')),
      [{ name: 'Activewear', isPrimary: false, sellerId: 2 }],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('4-Person Camping Tent')),
      [
        { name: 'Outdoor Gear', isPrimary: true },
        { name: 'Sports & Outdoors', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('4-Person Camping Tent')),
      [{ name: 'Activewear', isPrimary: false, sellerId: 2 }],
    );

    // Books & Media Products
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Bestselling Novel Collection'),
      ),
      [
        { name: 'Books', isPrimary: true },
        { name: 'Books & Media', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Acoustic Guitar Starter Pack'),
      ),
      [
        { name: 'Music', isPrimary: true },
        { name: 'Books & Media', isPrimary: false },
      ],
    );

    // Health & Beauty Products
    await addProductToCategories(
      products.find((p) => p.product_name.includes('Organic Face Moisturizer')),
      [
        { name: 'Skincare', isPrimary: true },
        { name: 'Health & Beauty', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Organic Face Moisturizer')),
      [{ name: 'Beauty Essentials', isPrimary: false, sellerId: 2 }],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Bamboo Toothbrush Set')),
      [
        { name: 'Personal Care', isPrimary: true },
        { name: 'Health & Beauty', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Bamboo Toothbrush Set')),
      [{ name: 'Beauty Essentials', isPrimary: false, sellerId: 2 }],
    );

    // Toys & Games Products
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('STEM Science Kit for Kids'),
      ),
      [
        { name: 'Educational Toys', isPrimary: true },
        { name: 'Toys & Games', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Strategy Board Game Collection'),
      ),
      [
        { name: 'Board Games', isPrimary: true },
        { name: 'Toys & Games', isPrimary: false },
      ],
    );

    // Artisan Crafts Products (Seller-specific)
    await addProductToCategories(
      products.find((p) => p.product_name.includes('Handmade Silver Necklace')),
      [
        { name: 'Handmade Jewelry', isPrimary: true },
        { name: 'Artisan Crafts', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Wooden Cutting Board Set')),
      [
        { name: 'Wood Crafts', isPrimary: true },
        { name: 'Artisan Crafts', isPrimary: false },
      ],
    );

    // Local Produce Products (Seller-specific)
    await addProductToCategories(
      products.find((p) => p.product_name.includes('Organic Vegetable Box')),
      [
        { name: 'Fresh Vegetables', isPrimary: true },
        { name: 'Local Produce', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) => p.product_name.includes('Fresh Fruit Basket')),
      [
        { name: 'Fresh Fruits', isPrimary: true },
        { name: 'Local Produce', isPrimary: false },
      ],
    );

    // Custom Items Products (Seller-specific)
    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Custom Photo Canvas Print'),
      ),
      [
        { name: 'Custom Prints', isPrimary: true },
        { name: 'Custom Items', isPrimary: false },
      ],
    );

    await addProductToCategories(
      products.find((p) =>
        p.product_name.includes('Engraved Wooden Keepsake Box'),
      ),
      [
        { name: 'Personalized Gifts', isPrimary: true },
        { name: 'Custom Items', isPrimary: false },
      ],
    );

    // New global categories
    const coffeeBeansCategory = categoryMap.get('coffee beans');
    const drinkwareCategory = categoryMap.get('drinkware');
    const equipmentCategory = categoryMap.get('equipment');
    const ingredientsCategory = categoryMap.get('ingredients');

    const coffeeBeansProducts = [
      'Ethiopian Yirgacheffe Coffee Beans',
      'Colombian Supremo Coffee Beans',
      'Brazil Santos Coffee Beans',
      'House Espresso Blend Coffee Beans',
    ];
    if (coffeeBeansCategory) {
      for (const productName of coffeeBeansProducts) {
        const product = products.find((p) => p.product_name === productName);
        if (!product) {
          continue;
        }
        await ensureProductCategory({
          product_id: product.id,
          category_id: coffeeBeansCategory.id,
          is_primary: true,
          display_order: 1,
        });
      }
    }

    const drinkwareProducts = [
      'Double-Wall Glass Tumbler',
      'Ceramic Latte Mug',
      'Stainless Steel Travel Tumbler',
      'Insulated Water Bottle',
    ];
    if (drinkwareCategory) {
      for (const productName of drinkwareProducts) {
        const product = products.find((p) => p.product_name === productName);
        if (!product) {
          continue;
        }
        await ensureProductCategory({
          product_id: product.id,
          category_id: drinkwareCategory.id,
          is_primary: true,
          display_order: 1,
        });
      }
    }

    const equipmentProducts = [
      'Manual Coffee Grinder',
      'Pour Over Coffee Dripper Set',
      'French Press Coffee Maker',
      'Electric Milk Frother',
    ];
    if (equipmentCategory) {
      for (const productName of equipmentProducts) {
        const product = products.find((p) => p.product_name === productName);
        if (!product) {
          continue;
        }
        await ensureProductCategory({
          product_id: product.id,
          category_id: equipmentCategory.id,
          is_primary: true,
          display_order: 1,
        });
      }
    }

    const ingredientsProducts = [
      'Vanilla Syrup',
      'Caramel Syrup',
      'Cocoa Powder',
      'Matcha Powder',
    ];
    if (ingredientsCategory) {
      for (const productName of ingredientsProducts) {
        const product = products.find((p) => p.product_name === productName);
        if (!product) {
          continue;
        }
        await ensureProductCategory({
          product_id: product.id,
          category_id: ingredientsCategory.id,
          is_primary: true,
          display_order: 1,
        });
      }
    }

    const seller3Id = 3;
    const premiumCoffeeBeanProductNames = [
      'Premium Arabica Coffee Beans',
      'Premium Robusta Coffee Beans',
      'Single-Origin Arabica Coffee Beans - Ethiopia',
      'Single-Origin Arabica Coffee Beans - Colombia',
      'Espresso Blend Coffee Beans',
    ];
    for (const productName of premiumCoffeeBeanProductNames) {
      await addProductToCategories(
        products.find((p) => p.product_name === productName),
        [
          { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
          {
            name: 'Ingredients & Syrups',
            isPrimary: false,
            sellerId: seller3Id,
          },
        ],
      );
    }

    // Franchise Supplies - Equipment
    await addProductToCategories(
      products.find((p) => p.product_name === 'Cup Sealer Machine'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Brewing Equipment', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Milk Tea Shaker Machine'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Brewing Equipment', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Fructose Dispenser'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Brewing Equipment', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Automatic Tea Brewer'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Brewing Equipment', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Commercial Blender'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Brewing Equipment', isPrimary: false, sellerId: seller3Id },
      ],
    );

    // Franchise Supplies - Packaging
    await addProductToCategories(
      products.find((p) => p.product_name === 'PP Cups 16oz (50pcs)'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Cups & Packaging', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'PP Cups 22oz (50pcs)'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Cups & Packaging', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Sealer Film Roll'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Cups & Packaging', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Fat Straws (100pcs)'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Cups & Packaging', isPrimary: false, sellerId: seller3Id },
      ],
    );

    // Franchise Supplies - Ingredients
    await addProductToCategories(
      products.find((p) => p.product_name === 'Milk Tea Powder 1kg'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Ingredients & Syrups', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Fructose Syrup 2.5kg'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Ingredients & Syrups', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Tapioca Pearls 1kg'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Ingredients & Syrups', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Coffee Jelly 1kg'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Ingredients & Syrups', isPrimary: false, sellerId: seller3Id },
      ],
    );
    await addProductToCategories(
      products.find((p) => p.product_name === 'Non-Dairy Creamer 1kg'),
      [
        { name: 'Franchise Supplies', isPrimary: true, sellerId: seller3Id },
        { name: 'Ingredients & Syrups', isPrimary: false, sellerId: seller3Id },
      ],
    );

    console.log('✅ Product categories seed completed');
  }
}
