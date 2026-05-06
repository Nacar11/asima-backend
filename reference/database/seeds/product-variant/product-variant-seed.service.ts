import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class ProductVariantSeedService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private repository: Repository<ProductVariantEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    const seller2User = await this.userRepository.findOne({
      where: { id: 2 },
    });
    if (!user) {
      console.error(
        '❌ No user found. Cannot proceed to seed product variants.',
      );
      return;
    }
    if (!seller2User) {
      console.error(
        '❌ No user found. Cannot proceed to seed product variants.',
      );
      return;
    }
    const products = await this.productRepository.find();
    if (products.length === 0) {
      console.error(
        '❌ No products found. Cannot proceed to seed product variants.',
      );
      return;
    }
    const actorUserByProductId = new Map<number, UserEntity>();
    for (const product of products) {
      const actorUser = product.seller_id === 2 ? seller2User : user;
      actorUserByProductId.set(product.id, actorUser);
    }
    const productMap = new Map<string, ProductEntity>();
    products.forEach((product) => {
      productMap.set(product.product_name.toLowerCase(), product);
    });
    const productById = new Map<number, ProductEntity>();
    for (const product of products) {
      productById.set(product.id, product);
    }
    type EnsureVariantInput = Partial<ProductVariantEntity> & {
      readonly sku: string;
    };
    const ensureVariant = async (
      input: EnsureVariantInput,
    ): Promise<ProductVariantEntity> => {
      const actorUser = actorUserByProductId.get(input.product_id ?? 0) ?? user;
      const existing = await this.repository.findOne({
        where: {
          sku: input.sku,
        },
      });
      if (existing) {
        await this.repository.save({
          ...existing,
          created_by: actorUser,
          updated_by: actorUser,
        });
        return existing;
      }
      return this.repository.save(
        this.repository.create({
          ...input,
          created_by: actorUser,
          updated_by: actorUser,
        }),
      );
    };
    const variants: EnsureVariantInput[] = [];

    {
      // iPhone 15 Pro Max Variants
      const iPhone15 = productMap.get('iphone 15 pro max');
      if (iPhone15) {
        variants.push(
          {
            product_id: iPhone15.id,
            sku: 'IP15PM-256-BLK',
            variant_name: 'iPhone 15 Pro Max - 256GB - Black Titanium',
            description:
              'Latest iPhone 15 Pro Max with 256GB storage in stunning Black Titanium finish',
            selling_price: 1199,
            cost_price: 999,
            minimum_order: 1,
            status: 'Active',
            // Shipping dimensions
            weight_kg: 0.221,
            length_cm: 16.0,
            width_cm: 8.0,
            height_cm: 4.0,
          },
          {
            product_id: iPhone15.id,
            sku: 'IP15PM-256-WHT',
            variant_name: 'iPhone 15 Pro Max - 256GB - White Titanium',
            description:
              'Latest iPhone 15 Pro Max with 256GB storage in elegant White Titanium finish',
            selling_price: 1199,
            cost_price: 999,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.221,
            length_cm: 16.0,
            width_cm: 8.0,
            height_cm: 4.0,
          },
          {
            product_id: iPhone15.id,
            sku: 'IP15PM-512-BLK',
            variant_name: 'iPhone 15 Pro Max - 512GB - Black Titanium',
            description:
              'Latest iPhone 15 Pro Max with 512GB storage in stunning Black Titanium finish',
            selling_price: 1399,
            cost_price: 1199,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.221,
            length_cm: 16.0,
            width_cm: 8.0,
            height_cm: 4.0,
          },
          {
            product_id: iPhone15.id,
            sku: 'IP15PM-1TB-BLK',
            variant_name: 'iPhone 15 Pro Max - 1TB - Black Titanium',
            selling_price: 1599,
            cost_price: 1399,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.221,
            length_cm: 16.0,
            width_cm: 8.0,
            height_cm: 4.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Product IDs 1-19 must have variants (deterministic by id)
      const macbookAirM2 = productById.get(2);
      if (macbookAirM2) {
        variants.push(
          {
            product_id: macbookAirM2.id,
            sku: 'MBAIR-M2-256-SLV',
            variant_name: 'MacBook Air M2 - 256GB - Silver',
            selling_price: 1199,
            cost_price: 999,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.24,
            length_cm: 30.4,
            width_cm: 21.5,
            height_cm: 2.0,
          },
          {
            product_id: macbookAirM2.id,
            sku: 'MBAIR-M2-512-SPCGRY',
            variant_name: 'MacBook Air M2 - 512GB - Space Gray',
            selling_price: 1399,
            cost_price: 1149,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.24,
            length_cm: 30.4,
            width_cm: 21.5,
            height_cm: 2.0,
          },
        );
      }
      const sonyXm5Headphones = productById.get(3);
      if (sonyXm5Headphones) {
        variants.push(
          {
            product_id: sonyXm5Headphones.id,
            sku: 'SONY-WH1000XM5-BLK',
            variant_name: 'Sony WH-1000XM5 - Black',
            selling_price: 399,
            cost_price: 275,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 22.0,
            width_cm: 20.0,
            height_cm: 10.0,
          },
          {
            product_id: sonyXm5Headphones.id,
            sku: 'SONY-WH1000XM5-SLV',
            variant_name: 'Sony WH-1000XM5 - Silver',
            selling_price: 399,
            cost_price: 275,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 22.0,
            width_cm: 20.0,
            height_cm: 10.0,
          },
        );
      }
      const mensCottonShirt = productById.get(4);
      if (mensCottonShirt) {
        variants.push(
          {
            product_id: mensCottonShirt.id,
            sku: 'MEN-TSHIRT-COT-S-BLK',
            variant_name: "Men's Premium Cotton T-Shirt - Small - Black",
            selling_price: 24.99,
            cost_price: 12.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.2,
            length_cm: 30.0,
            width_cm: 25.0,
            height_cm: 2.0,
          },
          {
            product_id: mensCottonShirt.id,
            sku: 'MEN-TSHIRT-COT-L-WHT',
            variant_name: "Men's Premium Cotton T-Shirt - Large - White",
            selling_price: 24.99,
            cost_price: 12.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 34.0,
            width_cm: 28.0,
            height_cm: 2.0,
          },
        );
      }
      const womensSummerDress = productById.get(5);
      if (womensSummerDress) {
        variants.push(
          {
            product_id: womensSummerDress.id,
            sku: 'WOM-DRESS-SUM-S-PNK',
            variant_name: "Women's Elegant Summer Dress - Small - Pink",
            selling_price: 59.99,
            cost_price: 29,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.35,
            length_cm: 40.0,
            width_cm: 30.0,
            height_cm: 4.0,
          },
          {
            product_id: womensSummerDress.id,
            sku: 'WOM-DRESS-SUM-M-BLU',
            variant_name: "Women's Elegant Summer Dress - Medium - Blue",
            selling_price: 59.99,
            cost_price: 29,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.38,
            length_cm: 42.0,
            width_cm: 32.0,
            height_cm: 4.0,
          },
        );
      }
      const kidsToySet = productById.get(6);
      if (kidsToySet) {
        variants.push(
          {
            product_id: kidsToySet.id,
            sku: 'KIDS-EDU-TOY-SET-STD',
            variant_name: "Kids' Educational Toy Set - Standard",
            selling_price: 39.99,
            cost_price: 19.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.0,
            length_cm: 35.0,
            width_cm: 25.0,
            height_cm: 10.0,
          },
          {
            product_id: kidsToySet.id,
            sku: 'KIDS-EDU-TOY-SET-DELUXE',
            variant_name: "Kids' Educational Toy Set - Deluxe",
            selling_price: 54.99,
            cost_price: 27,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.4,
            length_cm: 40.0,
            width_cm: 30.0,
            height_cm: 12.0,
          },
        );
      }
      const chefKnifeSet = productById.get(7);
      if (chefKnifeSet) {
        variants.push(
          {
            product_id: chefKnifeSet.id,
            sku: 'KNIFE-SET-CHEF-6PC',
            variant_name: 'Professional Chef Knife Set - 6-Piece',
            selling_price: 79.99,
            cost_price: 42,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 2.2,
            length_cm: 38.0,
            width_cm: 18.0,
            height_cm: 8.0,
          },
          {
            product_id: chefKnifeSet.id,
            sku: 'KNIFE-SET-CHEF-6PC-BLOCK',
            variant_name: 'Professional Chef Knife Set - 6-Piece + Block',
            selling_price: 99.99,
            cost_price: 55,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 3.0,
            length_cm: 40.0,
            width_cm: 20.0,
            height_cm: 10.0,
          },
        );
      }
      const minimalistSofa = productById.get(8);
      if (minimalistSofa) {
        variants.push(
          {
            product_id: minimalistSofa.id,
            sku: 'SOFA-MIN-GRY-2S',
            variant_name: 'Modern Minimalist Sofa - Gray - 2-Seater',
            selling_price: 799,
            cost_price: 499,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 38.0,
            length_cm: 185.0,
            width_cm: 85.0,
            height_cm: 80.0,
          },
          {
            product_id: minimalistSofa.id,
            sku: 'SOFA-MIN-NVY-3S',
            variant_name: 'Modern Minimalist Sofa - Navy - 3-Seater',
            selling_price: 999,
            cost_price: 629,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 45.0,
            length_cm: 210.0,
            width_cm: 90.0,
            height_cm: 85.0,
          },
        );
      }
      const chocolateBars = productById.get(11);
      if (chocolateBars) {
        variants.push(
          {
            product_id: chocolateBars.id,
            sku: 'CHOCO-BAR-70-5PK',
            variant_name: 'Artisan Chocolate Bar Collection - 70% - 5 Pack',
            selling_price: 19.99,
            cost_price: 10,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 12.0,
            height_cm: 6.0,
          },
          {
            product_id: chocolateBars.id,
            sku: 'CHOCO-BAR-85-5PK',
            variant_name: 'Artisan Chocolate Bar Collection - 85% - 5 Pack',
            selling_price: 21.99,
            cost_price: 11,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 12.0,
            height_cm: 6.0,
          },
        );
      }
      const novelCollection = productById.get(14);
      if (novelCollection) {
        variants.push(
          {
            product_id: novelCollection.id,
            sku: 'BOOK-NOVEL-SET-3',
            variant_name: 'Bestselling Novel Collection - 3 Books',
            selling_price: 29.99,
            cost_price: 15,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.1,
            length_cm: 25.0,
            width_cm: 18.0,
            height_cm: 8.0,
          },
          {
            product_id: novelCollection.id,
            sku: 'BOOK-NOVEL-SET-5',
            variant_name: 'Bestselling Novel Collection - 5 Books',
            selling_price: 44.99,
            cost_price: 23,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.8,
            length_cm: 27.0,
            width_cm: 20.0,
            height_cm: 10.0,
          },
        );
      }
      const guitarStarterPack = productById.get(15);
      if (guitarStarterPack) {
        variants.push(
          {
            product_id: guitarStarterPack.id,
            sku: 'GTR-STARTER-STL',
            variant_name: 'Acoustic Guitar Starter Pack - Steel Strings',
            selling_price: 199.99,
            cost_price: 125,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 4.0,
            length_cm: 110.0,
            width_cm: 45.0,
            height_cm: 15.0,
          },
          {
            product_id: guitarStarterPack.id,
            sku: 'GTR-STARTER-NYL',
            variant_name: 'Acoustic Guitar Starter Pack - Nylon Strings',
            selling_price: 199.99,
            cost_price: 125,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 4.0,
            length_cm: 110.0,
            width_cm: 45.0,
            height_cm: 15.0,
          },
        );
      }
      const faceMoisturizer = productById.get(16);
      if (faceMoisturizer) {
        variants.push(
          {
            product_id: faceMoisturizer.id,
            sku: 'MOIST-FACE-50ML',
            variant_name: 'Organic Face Moisturizer - 50ml',
            selling_price: 24.99,
            cost_price: 12,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.15,
            length_cm: 12.0,
            width_cm: 6.0,
            height_cm: 6.0,
          },
          {
            product_id: faceMoisturizer.id,
            sku: 'MOIST-FACE-100ML',
            variant_name: 'Organic Face Moisturizer - 100ml',
            selling_price: 39.99,
            cost_price: 19,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 15.0,
            width_cm: 7.0,
            height_cm: 7.0,
          },
        );
      }
      const toothbrushSet = productById.get(17);
      if (toothbrushSet) {
        variants.push(
          {
            product_id: toothbrushSet.id,
            sku: 'TOOTH-BMB-4PK',
            variant_name: 'Bamboo Toothbrush Set - 4 Pack',
            selling_price: 12.99,
            cost_price: 6,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 22.0,
            width_cm: 12.0,
            height_cm: 4.0,
          },
          {
            product_id: toothbrushSet.id,
            sku: 'TOOTH-BMB-6PK',
            variant_name: 'Bamboo Toothbrush Set - 6 Pack',
            selling_price: 16.99,
            cost_price: 8,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.3,
            length_cm: 22.0,
            width_cm: 12.0,
            height_cm: 4.0,
          },
        );
      }
      const stemKit = productById.get(18);
      if (stemKit) {
        variants.push(
          {
            product_id: stemKit.id,
            sku: 'STEM-KIT-STD',
            variant_name: 'STEM Science Kit for Kids - Standard',
            selling_price: 34.99,
            cost_price: 16,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.2,
            length_cm: 35.0,
            width_cm: 25.0,
            height_cm: 10.0,
          },
          {
            product_id: stemKit.id,
            sku: 'STEM-KIT-DELUXE',
            variant_name: 'STEM Science Kit for Kids - Deluxe',
            selling_price: 49.99,
            cost_price: 24,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.6,
            length_cm: 40.0,
            width_cm: 30.0,
            height_cm: 12.0,
          },
        );
      }
      const boardGames = productById.get(19);
      if (boardGames) {
        variants.push(
          {
            product_id: boardGames.id,
            sku: 'BOARD-GAME-SET-STD',
            variant_name: 'Strategy Board Game Collection - Standard',
            selling_price: 29.99,
            cost_price: 14,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.4,
            length_cm: 30.0,
            width_cm: 30.0,
            height_cm: 8.0,
          },
          {
            product_id: boardGames.id,
            sku: 'BOARD-GAME-SET-FAM',
            variant_name: 'Strategy Board Game Collection - Family Edition',
            selling_price: 39.99,
            cost_price: 19,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.7,
            length_cm: 32.0,
            width_cm: 32.0,
            height_cm: 9.0,
          },
        );
      }

      // MacBook Pro 16 Variants
      const macbook = productMap.get('macbook pro 16');
      if (macbook) {
        variants.push(
          {
            product_id: macbook.id,
            sku: 'MBP16-M3-512-SSD',
            variant_name: 'MacBook Pro 16" - M3 Pro - 512GB SSD - Space Black',
            selling_price: 2499,
            cost_price: 2099,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 2.14,
            length_cm: 36.0,
            width_cm: 25.5,
            height_cm: 5.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            sku: 'MBP16-M3-1TB-SSD',
            variant_name: 'MacBook Pro 16" - M3 Pro - 1TB SSD - Space Black',
            selling_price: 2699,
            cost_price: 2299,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 2.14,
            length_cm: 36.0,
            width_cm: 25.5,
            height_cm: 5.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            sku: 'MBP16-M3MAX-1TB-SSD',
            variant_name: 'MacBook Pro 16" - M3 Max - 1TB SSD - Space Black',
            selling_price: 3199,
            cost_price: 2799,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 2.14,
            length_cm: 36.0,
            width_cm: 25.5,
            height_cm: 5.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            sku: 'MBP16-M3MAX-2TB-SSD',
            variant_name: 'MacBook Pro 16" - M3 Max - 2TB SSD - Space Black',
            selling_price: 3499,
            cost_price: 3099,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 2.14,
            length_cm: 36.0,
            width_cm: 25.5,
            height_cm: 5.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Adidas Climacool T-Shirt Variants
      const adidasShirt = productMap.get('adidas climacool t-shirt');
      if (adidasShirt) {
        variants.push(
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-SML-BLK',
            variant_name: 'Adidas Climacool T-Shirt - Small - Black',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.2,
            length_cm: 30.0,
            width_cm: 25.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-MED-BLK',
            variant_name: 'Adidas Climacool T-Shirt - Medium - Black',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.22,
            length_cm: 32.0,
            width_cm: 26.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-LRG-BLK',
            variant_name: 'Adidas Climacool T-Shirt - Large - Black',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 34.0,
            width_cm: 28.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-SML-WHT',
            variant_name: 'Adidas Climacool T-Shirt - Small - White',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.2,
            length_cm: 30.0,
            width_cm: 25.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-MED-WHT',
            variant_name: 'Adidas Climacool T-Shirt - Medium - White',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.22,
            length_cm: 32.0,
            width_cm: 26.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            sku: 'AD-CC-LRG-WHT',
            variant_name: 'Adidas Climacool T-Shirt - Large - White',
            selling_price: 35,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 34.0,
            width_cm: 28.0,
            height_cm: 2.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Nike Air Max 270 Variants
      const nikeShoes = productMap.get('nike air max 270');
      if (nikeShoes) {
        variants.push(
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-8-BLK',
            variant_name: 'Nike Air Max 270 - Size 8 - Black',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.8,
            length_cm: 32.0,
            width_cm: 22.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-9-BLK',
            variant_name: 'Nike Air Max 270 - Size 9 - Black',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.85,
            length_cm: 33.0,
            width_cm: 23.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-10-BLK',
            variant_name: 'Nike Air Max 270 - Size 10 - Black',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.9,
            length_cm: 34.0,
            width_cm: 24.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-8-WHT',
            variant_name: 'Nike Air Max 270 - Size 8 - White',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.8,
            length_cm: 32.0,
            width_cm: 22.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-9-WHT',
            variant_name: 'Nike Air Max 270 - Size 9 - White',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.85,
            length_cm: 33.0,
            width_cm: 23.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            sku: 'NIKE-AM270-10-WHT',
            variant_name: 'Nike Air Max 270 - Size 10 - White',
            selling_price: 150,
            cost_price: 85,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.9,
            length_cm: 34.0,
            width_cm: 24.0,
            height_cm: 12.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Sony WH-1000XM5 Variants
      const headphones = productMap.get('sony wh-1000xm5');
      if (headphones) {
        variants.push(
          {
            product_id: headphones.id,
            sku: 'SONY-XM5-BLK',
            variant_name: 'Sony WH-1000XM5 - Black',
            selling_price: 399,
            cost_price: 275,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 22.0,
            width_cm: 20.0,
            height_cm: 10.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: headphones.id,
            sku: 'SONY-XM5-SLV',
            variant_name: 'Sony WH-1000XM5 - Silver',
            selling_price: 399,
            cost_price: 275,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 22.0,
            width_cm: 20.0,
            height_cm: 10.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // iPad Air 11 Variants
      const ipad = productMap.get('ipad air 11');
      if (ipad) {
        variants.push(
          {
            product_id: ipad.id,
            sku: 'IPAD-AIR-11-128-WiFi',
            variant_name: 'iPad Air 11" - 128GB - Wi-Fi - Blue',
            selling_price: 599,
            cost_price: 479,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.462,
            length_cm: 25.0,
            width_cm: 18.0,
            height_cm: 3.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: ipad.id,
            sku: 'IPAD-AIR-11-256-WiFi',
            variant_name: 'iPad Air 11" - 256GB - Wi-Fi - Blue',
            selling_price: 699,
            cost_price: 579,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.462,
            length_cm: 25.0,
            width_cm: 18.0,
            height_cm: 3.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: ipad.id,
            sku: 'IPAD-AIR-11-128-Cell',
            variant_name: 'iPad Air 11" - 128GB - Cellular - Blue',
            selling_price: 749,
            cost_price: 629,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.462,
            length_cm: 25.0,
            width_cm: 18.0,
            height_cm: 3.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Samsung 65" QLED TV (Single variant - no variants)
      const tv = productMap.get('samsung 65" qled tv');
      if (tv) {
        variants.push({
          product_id: tv.id,
          sku: 'SAMSUNG-QLED-65',
          variant_name: 'Samsung 65" QLED 4K Smart TV',
          selling_price: 1299,
          cost_price: 999,
          minimum_order: 1,
          status: 'Active',
          weight_kg: 25.0,
          length_cm: 150.0,
          width_cm: 90.0,
          height_cm: 15.0,
          created_by: user,
          updated_by: user,
        });
      }

      // Professional Yoga Mat Variants
      const yogaMat = productMap.get('professional yoga mat');
      if (yogaMat) {
        variants.push(
          {
            product_id: yogaMat.id,
            sku: 'YOGA-MAT-PRO-BLK',
            variant_name: 'Professional Yoga Mat - Black',
            selling_price: 45,
            cost_price: 22,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.2,
            length_cm: 68.0,
            width_cm: 15.0,
            height_cm: 15.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: yogaMat.id,
            sku: 'YOGA-MAT-PRO-BLU',
            variant_name: 'Professional Yoga Mat - Blue',
            selling_price: 45,
            cost_price: 22,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.2,
            length_cm: 68.0,
            width_cm: 15.0,
            height_cm: 15.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: yogaMat.id,
            sku: 'YOGA-MAT-PRO-GRN',
            variant_name: 'Professional Yoga Mat - Green',
            selling_price: 45,
            cost_price: 22,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.2,
            length_cm: 68.0,
            width_cm: 15.0,
            height_cm: 15.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // 4-Person Camping Tent Variants
      const tent = productMap.get('4-person camping tent');
      if (tent) {
        variants.push(
          {
            product_id: tent.id,
            sku: 'TENT-4P-ORG',
            variant_name: '4-Person Camping Tent - Orange',
            selling_price: 189,
            cost_price: 95,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 4.5,
            length_cm: 60.0,
            width_cm: 20.0,
            height_cm: 20.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tent.id,
            sku: 'TENT-4P-BLU',
            variant_name: '4-Person Camping Tent - Blue',
            selling_price: 189,
            cost_price: 95,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 4.5,
            length_cm: 60.0,
            width_cm: 20.0,
            height_cm: 20.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Modern Sofa Variants
      const sofa = productMap.get('modern sofa');
      if (sofa) {
        variants.push(
          {
            product_id: sofa.id,
            sku: 'SOFA-MOD-GRY',
            variant_name: 'Modern Sofa - Gray',
            selling_price: 899,
            cost_price: 549,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 45.0,
            length_cm: 200.0,
            width_cm: 90.0,
            height_cm: 85.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: sofa.id,
            sku: 'SOFA-MOD-BLU',
            variant_name: 'Modern Sofa - Navy Blue',
            selling_price: 899,
            cost_price: 549,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 45.0,
            length_cm: 200.0,
            width_cm: 90.0,
            height_cm: 85.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: sofa.id,
            sku: 'SOFA-MOD-BRN',
            variant_name: 'Modern Sofa - Brown',
            selling_price: 899,
            cost_price: 549,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 45.0,
            length_cm: 200.0,
            width_cm: 90.0,
            height_cm: 85.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Premium Colombian Coffee Variants
      const coffee = productMap.get('premium arabica coffee beans');
      if (coffee) {
        variants.push(
          // Medium Roast Variants
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-MED-WHOLE',
            variant_name:
              'Premium Colombian Coffee - Medium Roast - Whole Bean',
            selling_price: 18.99,
            cost_price: 9.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-MED-FINE',
            variant_name:
              'Premium Colombian Coffee - Medium Roast - Fine Grind',
            selling_price: 19.99,
            cost_price: 10,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-MED-COARSE',
            variant_name:
              'Premium Colombian Coffee - Medium Roast - Coarse Grind',
            selling_price: 19.99,
            cost_price: 10,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          // Dark Roast Variants
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-DRK-WHOLE',
            variant_name: 'Premium Colombian Coffee - Dark Roast - Whole Bean',
            selling_price: 18.99,
            cost_price: 9.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-DRK-FINE',
            variant_name: 'Premium Colombian Coffee - Dark Roast - Fine Grind',
            selling_price: 19.99,
            cost_price: 10,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            sku: 'COFFEE-COL-DRK-ESPRESSO',
            variant_name:
              'Premium Colombian Coffee - Dark Roast - Espresso Grind',
            selling_price: 20.99,
            cost_price: 11,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 20.0,
            width_cm: 10.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Organic Green Tea Variants
      const tea = productMap.get('organic green tea collection');
      if (tea) {
        variants.push(
          {
            product_id: tea.id,
            sku: 'TEA-GRN-PRM',
            variant_name: 'Organic Green Tea - Premium Grade',
            selling_price: 12.99,
            cost_price: 6.5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 15.0,
            width_cm: 8.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tea.id,
            sku: 'TEA-GRN-STN',
            variant_name: 'Organic Green Tea - Standard Grade',
            selling_price: 9.99,
            cost_price: 5,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.25,
            length_cm: 15.0,
            width_cm: 8.0,
            height_cm: 8.0,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Coffee Beans (Global) - 2 variants per product
      const ethiopianYirgacheffe = productMap.get(
        'ethiopian yirgacheffe coffee beans',
      );
      if (ethiopianYirgacheffe) {
        variants.push(
          {
            product_id: ethiopianYirgacheffe.id,
            sku: 'COFFEE-ETH-YIR-250G',
            variant_name: 'Ethiopian Yirgacheffe - 250g - Whole Bean',
            description: 'Floral and citrus notes, whole bean 250g pack',
            selling_price: 16.99,
            cost_price: 8.5,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: ethiopianYirgacheffe.id,
            sku: 'COFFEE-ETH-YIR-1KG',
            variant_name: 'Ethiopian Yirgacheffe - 1kg - Whole Bean',
            description: 'Floral and citrus notes, whole bean 1kg pack',
            selling_price: 49.99,
            cost_price: 29,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const colombianSupremo = productMap.get('colombian supremo coffee beans');
      if (colombianSupremo) {
        variants.push(
          {
            product_id: colombianSupremo.id,
            sku: 'COFFEE-COL-SUP-250G',
            variant_name: 'Colombian Supremo - 250g - Whole Bean',
            description: 'Balanced caramel notes, whole bean 250g pack',
            selling_price: 15.99,
            cost_price: 8,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: colombianSupremo.id,
            sku: 'COFFEE-COL-SUP-1KG',
            variant_name: 'Colombian Supremo - 1kg - Whole Bean',
            description: 'Balanced caramel notes, whole bean 1kg pack',
            selling_price: 46.99,
            cost_price: 26,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const brazilSantos = productMap.get('brazil santos coffee beans');
      if (brazilSantos) {
        variants.push(
          {
            product_id: brazilSantos.id,
            sku: 'COFFEE-BRZ-SNT-250G',
            variant_name: 'Brazil Santos - 250g - Whole Bean',
            description: 'Nutty chocolate finish, whole bean 250g pack',
            selling_price: 14.99,
            cost_price: 7.5,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: brazilSantos.id,
            sku: 'COFFEE-BRZ-SNT-1KG',
            variant_name: 'Brazil Santos - 1kg - Whole Bean',
            description: 'Nutty chocolate finish, whole bean 1kg pack',
            selling_price: 43.99,
            cost_price: 24,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const espressoBlend = productMap.get('house espresso blend coffee beans');
      if (espressoBlend) {
        variants.push(
          {
            product_id: espressoBlend.id,
            sku: 'COFFEE-ESP-BLD-250G',
            variant_name: 'House Espresso Blend - 250g - Whole Bean',
            description: 'Rich espresso blend, whole bean 250g pack',
            selling_price: 15.49,
            cost_price: 7.8,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: espressoBlend.id,
            sku: 'COFFEE-ESP-BLD-1KG',
            variant_name: 'House Espresso Blend - 1kg - Whole Bean',
            description: 'Rich espresso blend, whole bean 1kg pack',
            selling_price: 44.99,
            cost_price: 25,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }

      // Drinkware (Global) - 2 variants per product
      const glassTumbler = productMap.get('double-wall glass tumbler');
      if (glassTumbler) {
        variants.push(
          {
            product_id: glassTumbler.id,
            sku: 'DRINKWARE-GLASS-TMB-12OZ',
            variant_name: 'Double-Wall Glass Tumbler - 12oz',
            selling_price: 12.99,
            cost_price: 6.5,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: glassTumbler.id,
            sku: 'DRINKWARE-GLASS-TMB-16OZ',
            variant_name: 'Double-Wall Glass Tumbler - 16oz',
            selling_price: 14.99,
            cost_price: 7.8,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const ceramicMug = productMap.get('ceramic latte mug');
      if (ceramicMug) {
        variants.push(
          {
            product_id: ceramicMug.id,
            sku: 'DRINKWARE-CER-MUG-12OZ',
            variant_name: 'Ceramic Latte Mug - 12oz',
            selling_price: 9.99,
            cost_price: 4.8,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: ceramicMug.id,
            sku: 'DRINKWARE-CER-MUG-16OZ',
            variant_name: 'Ceramic Latte Mug - 16oz',
            selling_price: 11.99,
            cost_price: 5.9,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const travelTumbler = productMap.get('stainless steel travel tumbler');
      if (travelTumbler) {
        variants.push(
          {
            product_id: travelTumbler.id,
            sku: 'DRINKWARE-TRVL-TMB-12OZ',
            variant_name: 'Stainless Steel Travel Tumbler - 12oz',
            selling_price: 18.99,
            cost_price: 11,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: travelTumbler.id,
            sku: 'DRINKWARE-TRVL-TMB-20OZ',
            variant_name: 'Stainless Steel Travel Tumbler - 20oz',
            selling_price: 22.99,
            cost_price: 13.5,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const waterBottle = productMap.get('insulated water bottle');
      if (waterBottle) {
        variants.push(
          {
            product_id: waterBottle.id,
            sku: 'DRINKWARE-BTL-500ML',
            variant_name: 'Insulated Water Bottle - 500ml',
            selling_price: 19.99,
            cost_price: 12,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: waterBottle.id,
            sku: 'DRINKWARE-BTL-1L',
            variant_name: 'Insulated Water Bottle - 1L',
            selling_price: 24.99,
            cost_price: 15,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }

      // Equipment (Global) - 2 variants per product
      const manualGrinder = productMap.get('manual coffee grinder');
      if (manualGrinder) {
        variants.push(
          {
            product_id: manualGrinder.id,
            sku: 'EQUIP-GRINDER-MNL-STD',
            variant_name: 'Manual Coffee Grinder - Standard',
            selling_price: 24.99,
            cost_price: 14,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: manualGrinder.id,
            sku: 'EQUIP-GRINDER-MNL-PRO',
            variant_name: 'Manual Coffee Grinder - Pro',
            selling_price: 34.99,
            cost_price: 20,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const pourOverSet = productMap.get('pour over coffee dripper set');
      if (pourOverSet) {
        variants.push(
          {
            product_id: pourOverSet.id,
            sku: 'EQUIP-POUROVER-1CUP',
            variant_name: 'Pour Over Coffee Dripper Set - 1 Cup',
            selling_price: 21.99,
            cost_price: 12,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: pourOverSet.id,
            sku: 'EQUIP-POUROVER-2CUP',
            variant_name: 'Pour Over Coffee Dripper Set - 2 Cup',
            selling_price: 24.99,
            cost_price: 13.5,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const frenchPress = productMap.get('french press coffee maker');
      if (frenchPress) {
        variants.push(
          {
            product_id: frenchPress.id,
            sku: 'EQUIP-FRENCH-350ML',
            variant_name: 'French Press Coffee Maker - 350ml',
            selling_price: 19.99,
            cost_price: 11.5,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: frenchPress.id,
            sku: 'EQUIP-FRENCH-1L',
            variant_name: 'French Press Coffee Maker - 1L',
            selling_price: 29.99,
            cost_price: 17,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const milkFrother = productMap.get('electric milk frother');
      if (milkFrother) {
        variants.push(
          {
            product_id: milkFrother.id,
            sku: 'EQUIP-FROTHER-BASIC',
            variant_name: 'Electric Milk Frother - Basic',
            selling_price: 29.99,
            cost_price: 18,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: milkFrother.id,
            sku: 'EQUIP-FROTHER-PRO',
            variant_name: 'Electric Milk Frother - Pro',
            selling_price: 39.99,
            cost_price: 24,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }

      // Ingredients (Global) - 2 variants per product
      const vanillaSyrup = productMap.get('vanilla syrup');
      if (vanillaSyrup) {
        variants.push(
          {
            product_id: vanillaSyrup.id,
            sku: 'ING-VAN-SYR-250ML',
            variant_name: 'Vanilla Syrup - 250ml',
            selling_price: 8.99,
            cost_price: 4.2,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: vanillaSyrup.id,
            sku: 'ING-VAN-SYR-750ML',
            variant_name: 'Vanilla Syrup - 750ml',
            selling_price: 16.99,
            cost_price: 8.5,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const caramelSyrup = productMap.get('caramel syrup');
      if (caramelSyrup) {
        variants.push(
          {
            product_id: caramelSyrup.id,
            sku: 'ING-CAR-SYR-250ML',
            variant_name: 'Caramel Syrup - 250ml',
            selling_price: 8.99,
            cost_price: 4.2,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: caramelSyrup.id,
            sku: 'ING-CAR-SYR-750ML',
            variant_name: 'Caramel Syrup - 750ml',
            selling_price: 16.99,
            cost_price: 8.5,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const cocoaPowder = productMap.get('cocoa powder');
      if (cocoaPowder) {
        variants.push(
          {
            product_id: cocoaPowder.id,
            sku: 'ING-COCOA-250G',
            variant_name: 'Cocoa Powder - 250g',
            selling_price: 6.99,
            cost_price: 3.3,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: cocoaPowder.id,
            sku: 'ING-COCOA-1KG',
            variant_name: 'Cocoa Powder - 1kg',
            selling_price: 18.99,
            cost_price: 10,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const matchaPowder = productMap.get('matcha powder');
      if (matchaPowder) {
        variants.push(
          {
            product_id: matchaPowder.id,
            sku: 'ING-MATCHA-50G',
            variant_name: 'Matcha Powder - 50g',
            selling_price: 9.99,
            cost_price: 5.5,
            minimum_order: 1,
            status: 'Active',
          },
          {
            product_id: matchaPowder.id,
            sku: 'ING-MATCHA-200G',
            variant_name: 'Matcha Powder - 200g',
            selling_price: 29.99,
            cost_price: 17,
            minimum_order: 1,
            status: 'Active',
          },
        );
      }
      const coffeeBeanProducts: Array<{
        readonly productKey: string;
        readonly skuPrefix: string;
        readonly baseVariantName: string;
        readonly description: string;
        readonly price500g: number;
        readonly price1kg: number;
        readonly cost500g: number;
        readonly cost1kg: number;
      }> = [
        {
          productKey: 'premium arabica coffee beans',
          skuPrefix: 'UB-ARABICA',
          baseVariantName: 'Premium Arabica Coffee Beans',
          description: 'Whole beans, medium roast',
          price500g: 260,
          price1kg: 480,
          cost500g: 180,
          cost1kg: 330,
        },
        {
          productKey: 'premium robusta coffee beans',
          skuPrefix: 'UB-ROBUSTA',
          baseVariantName: 'Premium Robusta Coffee Beans',
          description: 'Whole beans, dark roast',
          price500g: 220,
          price1kg: 410,
          cost500g: 150,
          cost1kg: 285,
        },
        {
          productKey: 'single-origin arabica coffee beans - ethiopia',
          skuPrefix: 'UB-ETHIOPIA',
          baseVariantName: 'Single-Origin Arabica Coffee Beans - Ethiopia',
          description: 'Whole beans, medium roast, single-origin',
          price500g: 290,
          price1kg: 540,
          cost500g: 205,
          cost1kg: 380,
        },
        {
          productKey: 'single-origin arabica coffee beans - colombia',
          skuPrefix: 'UB-COLOMBIA',
          baseVariantName: 'Single-Origin Arabica Coffee Beans - Colombia',
          description: 'Whole beans, medium roast, single-origin',
          price500g: 280,
          price1kg: 520,
          cost500g: 198,
          cost1kg: 365,
        },
        {
          productKey: 'espresso blend coffee beans',
          skuPrefix: 'UB-ESPRESSO',
          baseVariantName: 'Espresso Blend Coffee Beans',
          description: 'Whole beans, medium-dark roast, espresso blend',
          price500g: 250,
          price1kg: 460,
          cost500g: 175,
          cost1kg: 320,
        },
      ];
      for (const coffeeBeanProduct of coffeeBeanProducts) {
        const product = productMap.get(coffeeBeanProduct.productKey);
        if (!product) {
          continue;
        }
        variants.push(
          {
            product_id: product.id,
            sku: `${coffeeBeanProduct.skuPrefix}-500G`,
            variant_name: `${coffeeBeanProduct.baseVariantName} - 500g`,
            description: `${coffeeBeanProduct.description}, 500g bag`,
            selling_price: coffeeBeanProduct.price500g,
            cost_price: coffeeBeanProduct.cost500g,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 0.5,
            length_cm: 22.0,
            width_cm: 15.0,
            height_cm: 7.0,
          },
          {
            product_id: product.id,
            sku: `${coffeeBeanProduct.skuPrefix}-1KG`,
            variant_name: `${coffeeBeanProduct.baseVariantName} - 1kg`,
            description: `${coffeeBeanProduct.description}, 1kg bag`,
            selling_price: coffeeBeanProduct.price1kg,
            cost_price: coffeeBeanProduct.cost1kg,
            minimum_order: 1,
            status: 'Active',
            weight_kg: 1.0,
            length_cm: 28.0,
            width_cm: 18.0,
            height_cm: 8.0,
          },
        );
      }
      // Uncle Brew Franchise Equipment
      const cupSealer = productMap.get('cup sealer machine');
      if (cupSealer) {
        variants.push({
          product_id: cupSealer.id,
          sku: 'UB-EQUIP-SEALER',
          variant_name: 'Cup Sealer Machine - Standard',
          selling_price: 8500,
          cost_price: 5500,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const shakerMachine = productMap.get('milk tea shaker machine');
      if (shakerMachine) {
        variants.push({
          product_id: shakerMachine.id,
          sku: 'UB-EQUIP-SHAKER',
          variant_name: 'Milk Tea Shaker Machine - SK300',
          selling_price: 12000,
          cost_price: 7500,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const fructoseDispenser = productMap.get('fructose dispenser');
      if (fructoseDispenser) {
        variants.push({
          product_id: fructoseDispenser.id,
          sku: 'UB-EQUIP-FRUCTOSE',
          variant_name: 'Fructose Dispenser - Automatic',
          selling_price: 15000,
          cost_price: 9500,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const teaBrewer = productMap.get('automatic tea brewer');
      if (teaBrewer) {
        variants.push({
          product_id: teaBrewer.id,
          sku: 'UB-EQUIP-BREWER',
          variant_name: 'Automatic Tea Brewer - Commercial',
          selling_price: 18000,
          cost_price: 11000,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const blender = productMap.get('commercial blender');
      if (blender) {
        variants.push({
          product_id: blender.id,
          sku: 'UB-EQUIP-BLENDER',
          variant_name: 'Commercial Blender - Heavy Duty',
          selling_price: 6500,
          cost_price: 4000,
          minimum_order: 1,
          status: 'Active',
        });
      }
      // Uncle Brew Franchise Packaging
      const cups16oz = productMap.get('pp cups 16oz (50pcs)');
      if (cups16oz) {
        variants.push({
          product_id: cups16oz.id,
          sku: 'UB-PKG-CUP16',
          variant_name: 'PP Cups 16oz - Pack of 50',
          selling_price: 150,
          cost_price: 85,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const cups22oz = productMap.get('pp cups 22oz (50pcs)');
      if (cups22oz) {
        variants.push({
          product_id: cups22oz.id,
          sku: 'UB-PKG-CUP22',
          variant_name: 'PP Cups 22oz - Pack of 50',
          selling_price: 180,
          cost_price: 100,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const sealerFilm = productMap.get('sealer film roll');
      if (sealerFilm) {
        variants.push({
          product_id: sealerFilm.id,
          sku: 'UB-PKG-FILM',
          variant_name: 'Sealer Film Roll - 3000 cups',
          selling_price: 450,
          cost_price: 280,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const fatStraws = productMap.get('fat straws (100pcs)');
      if (fatStraws) {
        variants.push({
          product_id: fatStraws.id,
          sku: 'UB-PKG-STRAWS',
          variant_name: 'Fat Straws - Pack of 100',
          selling_price: 80,
          cost_price: 45,
          minimum_order: 1,
          status: 'Active',
        });
      }
      // Uncle Brew Franchise Ingredients
      const milkTeaPowder = productMap.get('milk tea powder 1kg');
      if (milkTeaPowder) {
        variants.push({
          product_id: milkTeaPowder.id,
          sku: 'UB-ING-MTPOWDER',
          variant_name: 'Milk Tea Powder - 1kg',
          selling_price: 350,
          cost_price: 200,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const fructoseSyrup = productMap.get('fructose syrup 2.5kg');
      if (fructoseSyrup) {
        variants.push({
          product_id: fructoseSyrup.id,
          sku: 'UB-ING-FRUCTOSE',
          variant_name: 'Fructose Syrup - 2.5kg',
          selling_price: 280,
          cost_price: 160,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const tapiocaPearls = productMap.get('tapioca pearls 1kg');
      if (tapiocaPearls) {
        variants.push({
          product_id: tapiocaPearls.id,
          sku: 'UB-ING-PEARLS',
          variant_name: 'Tapioca Pearls - 1kg',
          selling_price: 180,
          cost_price: 95,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const coffeeJelly1kg = productMap.get('coffee jelly 1kg');
      if (coffeeJelly1kg) {
        variants.push({
          product_id: coffeeJelly1kg.id,
          sku: 'UB-ING-JELLY',
          variant_name: 'Coffee Jelly - 1kg',
          selling_price: 200,
          cost_price: 110,
          minimum_order: 1,
          status: 'Active',
        });
      }
      const creamer = productMap.get('non-dairy creamer 1kg');
      if (creamer) {
        variants.push({
          product_id: creamer.id,
          sku: 'UB-ING-CREAMER',
          variant_name: 'Non-Dairy Creamer - 1kg',
          selling_price: 250,
          cost_price: 140,
          minimum_order: 1,
          status: 'Active',
        });
      }
    }
    const displayOrderByProductId = new Map<number, number>();
    for (const variant of variants) {
      const productId = variant.product_id ?? 0;
      const nextDisplayOrder =
        (displayOrderByProductId.get(productId) ?? 0) + 1;
      displayOrderByProductId.set(productId, nextDisplayOrder);
      variant.display_order = nextDisplayOrder;
    }
    let createdCount = 0;
    for (const variant of variants) {
      const existing = await this.repository.findOne({
        where: {
          sku: variant.sku,
        },
      });
      if (existing) {
        await ensureVariant(variant);
        continue;
      }
      await ensureVariant(variant);
      createdCount++;
    }
    console.log(
      `✅ Product variants seed completed (${variants.length} defined, ${createdCount} inserted)`,
    );
  }
}
