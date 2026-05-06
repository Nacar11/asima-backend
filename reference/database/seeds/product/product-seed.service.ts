import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Injectable()
export class ProductSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(ProductEntity)
    private repository: Repository<ProductEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    const seller2User = await this.userRepository.findOne({
      where: { id: 2 },
    });
    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed products.');
      return;
    }
    if (!seller2User) {
      console.error('❌ No user found. Cannot proceed to seed products.');
      return;
    }
    const seller1 = await this.sellerRepository.findOne({
      where: { id: 1 },
    });
    const seller2 = await this.sellerRepository.findOne({
      where: { id: 2 },
    });
    if (!seller1 || !seller2) {
      console.error('❌ No seller found. Cannot proceed to seed products.');
      return;
    }
    type EnsureProductInput = {
      readonly product_name: string;
      readonly description: string;
      readonly seller_id: number;
      readonly status: string;
    };
    const ensureProduct = async (
      input: EnsureProductInput,
    ): Promise<ProductEntity> => {
      const actorUser = input.seller_id === seller2.id ? seller2User : user;
      const existing = await this.repository.findOne({
        where: {
          product_name: input.product_name,
        },
      });
      if (existing) {
        const shouldUpdate =
          existing.seller_id !== input.seller_id ||
          (existing.description ?? null) !== input.description ||
          existing.status !== input.status;
        if (!shouldUpdate) {
          return existing;
        }
        return this.repository.save({
          ...existing,
          seller_id: input.seller_id,
          description: input.description,
          status: input.status,
          created_by: actorUser,
          updated_by: actorUser,
        });
      }
      return this.repository.save(
        this.repository.create({
          ...input,
          created_by: actorUser,
          updated_by: actorUser,
        }),
      );
    };
    const seller2ProductNames = new Set<string>([
      "Men's Premium Cotton T-Shirt",
      "Women's Elegant Summer Dress",
      'Professional Yoga Mat',
      '4-Person Camping Tent',
      'Organic Face Moisturizer',
      'Bamboo Toothbrush Set',
      'STEM Science Kit for Kids',
      'Strategy Board Game Collection',
    ]);
    // Uncle Brew (Seller 3) products
    const seller3 = await this.sellerRepository.findOne({
      where: { id: 3 },
    });
    const seller3ProductNames = new Set<string>([
      'Premium Arabica Coffee Beans',
      'Premium Robusta Coffee Beans',
      'Single-Origin Arabica Coffee Beans - Ethiopia',
      'Single-Origin Arabica Coffee Beans - Colombia',
      'Espresso Blend Coffee Beans',
      // Franchise Supplies - Equipment
      'Cup Sealer Machine',
      'Milk Tea Shaker Machine',
      'Fructose Dispenser',
      'Automatic Tea Brewer',
      'Commercial Blender',
      // Franchise Supplies - Packaging
      'PP Cups 16oz (50pcs)',
      'PP Cups 22oz (50pcs)',
      'Sealer Film Roll',
      'Fat Straws (100pcs)',
      // Franchise Supplies - Ingredients
      'Milk Tea Powder 1kg',
      'Fructose Syrup 2.5kg',
      'Tapioca Pearls 1kg',
      'Coffee Jelly 1kg',
      'Non-Dairy Creamer 1kg',
    ]);
    const getSellerIdForProductName = (productName: string): number => {
      if (seller2ProductNames.has(productName)) {
        return seller2.id;
      }
      if (seller3 && seller3ProductNames.has(productName)) {
        return seller3.id;
      }
      return seller1.id;
    };
    const products: EnsureProductInput[] = [
      // Electronics Category Products
      {
        product_name: 'iPhone 15 Pro Max',
        description:
          'Latest flagship smartphone with titanium design and A17 Pro chip',
        status: 'Published',
        seller_id: getSellerIdForProductName('iPhone 15 Pro Max'),
      },
      {
        product_name: 'MacBook Air M2',
        description: 'Ultra-thin laptop with M2 chip, 13-inch display',
        status: 'Published',
        seller_id: getSellerIdForProductName('MacBook Air M2'),
      },
      {
        product_name: 'Sony WH-1000XM5 Headphones',
        description: 'Premium noise-canceling wireless headphones',
        status: 'Published',
        seller_id: getSellerIdForProductName('Sony WH-1000XM5 Headphones'),
      },
      // Clothing Category Products
      {
        product_name: "Men's Premium Cotton T-Shirt",
        description: 'Soft, breathable cotton t-shirt for men',
        status: 'Published',
        seller_id: getSellerIdForProductName("Men's Premium Cotton T-Shirt"),
      },
      {
        product_name: "Women's Elegant Summer Dress",
        description: 'Flowing summer dress with floral patterns',
        status: 'Published',
        seller_id: getSellerIdForProductName("Women's Elegant Summer Dress"),
      },
      {
        product_name: "Kids' Educational Toy Set",
        description: 'Safe and fun educational toys for children',
        status: 'Published',
        seller_id: getSellerIdForProductName("Kids' Educational Toy Set"),
      },
      // Home & Garden Category Products
      {
        product_name: 'Professional Chef Knife Set',
        description:
          '6-piece stainless steel kitchen knife set with wooden block',
        status: 'Published',
        seller_id: getSellerIdForProductName('Professional Chef Knife Set'),
      },
      {
        product_name: 'Modern Minimalist Sofa',
        description:
          '3-seater fabric sofa with wooden legs, perfect for living rooms',
        status: 'Published',
        seller_id: getSellerIdForProductName('Modern Minimalist Sofa'),
      },
      // Food & Beverages Category Products
      {
        product_name: 'Premium Arabica Coffee Beans',
        description:
          'Single-origin Arabica coffee beans from high-altitude farms',
        status: 'Published',
        seller_id: getSellerIdForProductName('Premium Arabica Coffee Beans'),
      },
      {
        product_name: 'Organic Green Tea Collection',
        description: 'Hand-picked organic green tea leaves from Japan',
        status: 'Published',
        seller_id: getSellerIdForProductName('Organic Green Tea Collection'),
      },
      {
        product_name: 'Artisan Chocolate Bar Collection',
        description: '70% dark chocolate with cocoa nibs and sea salt',
        status: 'Published',
        seller_id: getSellerIdForProductName(
          'Artisan Chocolate Bar Collection',
        ),
      },
      // Sports & Outdoors Category Products
      {
        product_name: 'Professional Yoga Mat',
        description: 'Non-slip exercise yoga mat with carrying strap',
        status: 'Published',
        seller_id: getSellerIdForProductName('Professional Yoga Mat'),
      },
      {
        product_name: '4-Person Camping Tent',
        description: 'Waterproof family tent with easy setup',
        status: 'Published',
        seller_id: getSellerIdForProductName('4-Person Camping Tent'),
      },
      // Books & Media Category Products
      {
        product_name: 'Bestselling Novel Collection',
        description: 'Set of 5 award-winning contemporary fiction books',
        status: 'Published',
        seller_id: getSellerIdForProductName('Bestselling Novel Collection'),
      },
      {
        product_name: 'Acoustic Guitar Starter Pack',
        description: 'Beginner acoustic guitar with accessories and lessons',
        status: 'Published',
        seller_id: getSellerIdForProductName('Acoustic Guitar Starter Pack'),
      },
      // Health & Beauty Category Products
      {
        product_name: 'Organic Face Moisturizer',
        description:
          'Natural skincare moisturizer with vitamin E and aloe vera',
        status: 'Published',
        seller_id: getSellerIdForProductName('Organic Face Moisturizer'),
      },
      {
        product_name: 'Bamboo Toothbrush Set',
        description: 'Eco-friendly bamboo toothbrushes (4-pack)',
        status: 'Published',
        seller_id: getSellerIdForProductName('Bamboo Toothbrush Set'),
      },
      // Toys & Games Category Products
      {
        product_name: 'STEM Science Kit for Kids',
        description: 'Educational science experiment kit for ages 8-12',
        status: 'Published',
        seller_id: getSellerIdForProductName('STEM Science Kit for Kids'),
      },
      {
        product_name: 'Strategy Board Game Collection',
        description: 'Set of 3 classic strategy board games for family nights',
        status: 'Published',
        seller_id: getSellerIdForProductName('Strategy Board Game Collection'),
      },
      // Artisan Crafts (Seller-Specific) Products
      {
        product_name: 'Handmade Silver Necklace',
        description: 'Artisan-crafted sterling silver necklace with gemstone',
        status: 'Published',
        seller_id: getSellerIdForProductName('Handmade Silver Necklace'),
      },
      {
        product_name: 'Wooden Cutting Board Set',
        description: 'Handcrafted wooden cutting boards with juice grooves',
        status: 'Published',
        seller_id: getSellerIdForProductName('Wooden Cutting Board Set'),
      },
      // Local Produce (Seller-Specific) Products
      {
        product_name: 'Organic Vegetable Box',
        description: 'Fresh seasonal vegetables from local farms',
        status: 'Published',
        seller_id: getSellerIdForProductName('Organic Vegetable Box'),
      },
      {
        product_name: 'Fresh Fruit Basket',
        description: 'Assorted fresh fruits picked at peak ripeness',
        status: 'Published',
        seller_id: getSellerIdForProductName('Fresh Fruit Basket'),
      },
      // Custom Items (Seller-Specific) Products
      {
        product_name: 'Custom Photo Canvas Print',
        description: 'Personalized canvas print with your favorite photo',
        status: 'Published',
        seller_id: getSellerIdForProductName('Custom Photo Canvas Print'),
      },
      {
        product_name: 'Engraved Wooden Keepsake Box',
        description: 'Personalized wooden box with custom engraving',
        status: 'Published',
        seller_id: getSellerIdForProductName('Engraved Wooden Keepsake Box'),
      },
      // Coffee Beans (Global)
      {
        product_name: 'Ethiopian Yirgacheffe Coffee Beans',
        description: 'Floral and citrus single-origin coffee beans',
        status: 'Published',
        seller_id: getSellerIdForProductName(
          'Ethiopian Yirgacheffe Coffee Beans',
        ),
      },
      {
        product_name: 'Colombian Supremo Coffee Beans',
        description: 'Smooth, balanced coffee beans with caramel notes',
        status: 'Published',
        seller_id: getSellerIdForProductName('Colombian Supremo Coffee Beans'),
      },
      {
        product_name: 'Brazil Santos Coffee Beans',
        description: 'Low-acid coffee beans with nutty chocolate finish',
        status: 'Published',
        seller_id: getSellerIdForProductName('Brazil Santos Coffee Beans'),
      },
      {
        product_name: 'House Espresso Blend Coffee Beans',
        description: 'Rich espresso blend crafted for milk-based drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName(
          'House Espresso Blend Coffee Beans',
        ),
      },
      // Drinkware (Global)
      {
        product_name: 'Double-Wall Glass Tumbler',
        description:
          'Double-wall insulated glass tumbler for hot or iced drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName('Double-Wall Glass Tumbler'),
      },
      {
        product_name: 'Ceramic Latte Mug',
        description: 'Classic ceramic mug designed for lattes and cappuccinos',
        status: 'Published',
        seller_id: getSellerIdForProductName('Ceramic Latte Mug'),
      },
      {
        product_name: 'Stainless Steel Travel Tumbler',
        description: 'Leak-resistant travel tumbler with insulation',
        status: 'Published',
        seller_id: getSellerIdForProductName('Stainless Steel Travel Tumbler'),
      },
      {
        product_name: 'Insulated Water Bottle',
        description: 'Vacuum insulated bottle to keep drinks cold or hot',
        status: 'Published',
        seller_id: getSellerIdForProductName('Insulated Water Bottle'),
      },
      // Equipment (Global)
      {
        product_name: 'Manual Coffee Grinder',
        description: 'Hand grinder with adjustable grind settings',
        status: 'Published',
        seller_id: getSellerIdForProductName('Manual Coffee Grinder'),
      },
      {
        product_name: 'Pour Over Coffee Dripper Set',
        description: 'Starter set for pour over brewing at home',
        status: 'Published',
        seller_id: getSellerIdForProductName('Pour Over Coffee Dripper Set'),
      },
      {
        product_name: 'French Press Coffee Maker',
        description: 'Borosilicate glass French press for full-bodied coffee',
        status: 'Published',
        seller_id: getSellerIdForProductName('French Press Coffee Maker'),
      },
      {
        product_name: 'Electric Milk Frother',
        description: 'Compact frother for hot and cold milk foam',
        status: 'Published',
        seller_id: getSellerIdForProductName('Electric Milk Frother'),
      },
      // Ingredients (Global)
      {
        product_name: 'Vanilla Syrup',
        description: 'Coffee syrup for flavored lattes and cold drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName('Vanilla Syrup'),
      },
      {
        product_name: 'Caramel Syrup',
        description: 'Sweet caramel syrup for coffee and desserts',
        status: 'Published',
        seller_id: getSellerIdForProductName('Caramel Syrup'),
      },
      {
        product_name: 'Cocoa Powder',
        description: 'Unsweetened cocoa powder for mochas and baking',
        status: 'Published',
        seller_id: getSellerIdForProductName('Cocoa Powder'),
      },
      {
        product_name: 'Matcha Powder',
        description: 'Premium green tea powder for matcha lattes',
        status: 'Published',
        seller_id: getSellerIdForProductName('Matcha Powder'),
      },
      {
        product_name: 'Premium Arabica Coffee Beans',
        description:
          'Premium Arabica coffee beans, medium roast, suitable for franchise brewing operations',
        status: 'Published',
        seller_id: getSellerIdForProductName('Premium Arabica Coffee Beans'),
      },
      {
        product_name: 'Premium Robusta Coffee Beans',
        description:
          'Premium Robusta coffee beans, dark roast, high-caffeine profile for franchise operations',
        status: 'Published',
        seller_id: getSellerIdForProductName('Premium Robusta Coffee Beans'),
      },
      {
        product_name: 'Single-Origin Arabica Coffee Beans - Ethiopia',
        description:
          'Single-origin Arabica coffee beans from Ethiopia, medium roast, floral notes for franchise operations',
        status: 'Published',
        seller_id: getSellerIdForProductName(
          'Single-Origin Arabica Coffee Beans - Ethiopia',
        ),
      },
      {
        product_name: 'Single-Origin Arabica Coffee Beans - Colombia',
        description:
          'Single-origin Arabica coffee beans from Colombia, medium roast, balanced profile for franchise operations',
        status: 'Published',
        seller_id: getSellerIdForProductName(
          'Single-Origin Arabica Coffee Beans - Colombia',
        ),
      },
      {
        product_name: 'Espresso Blend Coffee Beans',
        description:
          'Espresso blend coffee beans (Arabica/Robusta), medium-dark roast for espresso-based franchise drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName('Espresso Blend Coffee Beans'),
      },
      // Uncle Brew Franchise Supplies - Equipment
      {
        product_name: 'Cup Sealer Machine',
        description: 'Automatic cup sealing machine for PP and PET cups',
        status: 'Published',
        seller_id: getSellerIdForProductName('Cup Sealer Machine'),
      },
      {
        product_name: 'Milk Tea Shaker Machine',
        description: 'Electric shaker machine for milk tea preparation',
        status: 'Published',
        seller_id: getSellerIdForProductName('Milk Tea Shaker Machine'),
      },
      {
        product_name: 'Fructose Dispenser',
        description:
          'Automatic fructose syrup dispenser for consistent sweetness',
        status: 'Published',
        seller_id: getSellerIdForProductName('Fructose Dispenser'),
      },
      {
        product_name: 'Automatic Tea Brewer',
        description: 'Commercial automatic tea brewing machine',
        status: 'Published',
        seller_id: getSellerIdForProductName('Automatic Tea Brewer'),
      },
      {
        product_name: 'Commercial Blender',
        description:
          'High-powered commercial blender for smoothies and frappes',
        status: 'Published',
        seller_id: getSellerIdForProductName('Commercial Blender'),
      },
      // Uncle Brew Franchise Supplies - Packaging
      {
        product_name: 'PP Cups 16oz (50pcs)',
        description: 'Polypropylene cups 16oz for cold drinks, pack of 50',
        status: 'Published',
        seller_id: getSellerIdForProductName('PP Cups 16oz (50pcs)'),
      },
      {
        product_name: 'PP Cups 22oz (50pcs)',
        description: 'Polypropylene cups 22oz for large drinks, pack of 50',
        status: 'Published',
        seller_id: getSellerIdForProductName('PP Cups 22oz (50pcs)'),
      },
      {
        product_name: 'Sealer Film Roll',
        description: 'Sealing film roll for cup sealer machines',
        status: 'Published',
        seller_id: getSellerIdForProductName('Sealer Film Roll'),
      },
      {
        product_name: 'Fat Straws (100pcs)',
        description: 'Wide straws for bubble tea, pack of 100',
        status: 'Published',
        seller_id: getSellerIdForProductName('Fat Straws (100pcs)'),
      },
      // Uncle Brew Franchise Supplies - Ingredients
      {
        product_name: 'Milk Tea Powder 1kg',
        description: 'Premium milk tea powder for classic milk tea drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName('Milk Tea Powder 1kg'),
      },
      {
        product_name: 'Fructose Syrup 2.5kg',
        description: 'Fructose syrup for sweetening beverages',
        status: 'Published',
        seller_id: getSellerIdForProductName('Fructose Syrup 2.5kg'),
      },
      {
        product_name: 'Tapioca Pearls 1kg',
        description: 'Black tapioca pearls for bubble tea',
        status: 'Published',
        seller_id: getSellerIdForProductName('Tapioca Pearls 1kg'),
      },
      {
        product_name: 'Coffee Jelly 1kg',
        description: 'Coffee-flavored jelly topping for drinks',
        status: 'Published',
        seller_id: getSellerIdForProductName('Coffee Jelly 1kg'),
      },
      {
        product_name: 'Non-Dairy Creamer 1kg',
        description: 'Non-dairy creamer powder for milk tea',
        status: 'Published',
        seller_id: getSellerIdForProductName('Non-Dairy Creamer 1kg'),
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;
    for (const product of products) {
      const existing = await this.repository.findOne({
        where: {
          product_name: product.product_name,
        },
      });
      if (!existing) {
        await ensureProduct(product);
        createdCount++;
        continue;
      }
      const beforeSellerId = existing.seller_id;
      const saved = await ensureProduct(product);
      if (saved.seller_id !== beforeSellerId) {
        updatedCount++;
      }
    }
    console.log(
      `✅ Products seed completed (${products.length} defined, ${createdCount} inserted, ${updatedCount} updated)`,
    );
  }
}
