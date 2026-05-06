import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class ProductAttributeSeedService {
  constructor(
    @InjectRepository(ProductAttributeEntity)
    private productAttributeRepository: Repository<ProductAttributeEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(AttributeEntity)
    private attributeRepository: Repository<AttributeEntity>,
    @InjectRepository(AttributeValueEntity)
    private attributeValueRepository: Repository<AttributeValueEntity>,
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
        '❌ No user found. Cannot proceed to seed product attributes.',
      );
      return;
    }
    if (!seller2User) {
      console.error(
        '❌ No user found. Cannot proceed to seed product attributes.',
      );
      return;
    }
    const products = await this.productRepository.find({
      relations: ['seller'],
    });
    const attributes = await this.attributeRepository.find({
      relations: ['seller'],
    });
    const attributeValues = await this.attributeValueRepository.find({
      relations: ['attribute'],
    });
    if (!products.length || !attributes.length || !attributeValues.length) {
      console.error(
        '❌ Products, attributes, or attribute values not found. Cannot proceed to seed product attributes. Please run product, attribute, and attribute value seeders first.',
      );
      return;
    }
    const attributesBySellerAndName = new Map<
      string,
      { id: number; name: string }
    >();
    for (const attr of attributes) {
      const key = `${attr.seller_id}-${attr.name}`;
      attributesBySellerAndName.set(key, { id: attr.id, name: attr.name });
    }
    const attributeValuesByAttributeId = new Map<
      number,
      AttributeValueEntity[]
    >();
    for (const av of attributeValues) {
      const existing = attributeValuesByAttributeId.get(av.attribute_id) ?? [];
      existing.push(av);
      attributeValuesByAttributeId.set(av.attribute_id, existing);
    }
    const getAttributeValueIds = (
      sellerId: number,
      attributeName: string,
      valueNames: string[],
    ): number[] => {
      const attributeKey = `${sellerId}-${attributeName}`;
      const attribute = attributesBySellerAndName.get(attributeKey);
      if (!attribute) {
        return [];
      }
      const values = attributeValuesByAttributeId.get(attribute.id) ?? [];
      return values
        .filter((av) => valueNames.includes(av.value))
        .map((av) => av.id);
    };

    // Define product-to-attribute mappings with specific attribute values
    const productAttributeMappings: Record<string, Record<string, string[]>> = {
      // Electronics (Seller 1 - Tech Store)
      'iPhone 15 Pro Max': {
        Color: ['Black', 'White', 'Blue'],
        Storage: ['256GB', '512GB', '1TB'],
        RAM: ['8GB'],
        Processor: ['Apple M3'],
      },
      'MacBook Air M2': {
        Color: ['Silver', 'Space Gray'],
        Storage: ['256GB', '512GB'],
        RAM: ['8GB', '16GB'],
        Processor: ['Apple M2'],
        'Screen Size': ['13"', '15"'],
      },
      'Sony WH-1000XM5 Headphones': {
        Color: ['Black', 'Silver'],
      },
      // Clothing (Seller 2 - Fashion Boutique)
      "Men's Premium Cotton T-Shirt": {
        Size: ['S', 'M', 'L', 'XL'],
        Color: ['White', 'Black', 'Blue', 'Gray'],
        Material: ['Cotton'],
        Style: ['Regular', 'Slim'],
      },
      "Women's Elegant Summer Dress": {
        Size: ['XS', 'S', 'M', 'L'],
        Color: ['White', 'Pink', 'Blue', 'Yellow'],
        Material: ['Silk', 'Cotton'],
        Style: ['Classic', 'Modern'],
      },
      "Kids' Educational Toy Set": {
        Color: ['Red', 'Blue', 'Green', 'Yellow'],
        Material: ['Plastic', 'Wood'],
      },
      // Home & Garden (Seller 1)
      'Professional Chef Knife Set': {
        Material: ['Stainless Steel'],
        'Blade Count': ['6'],
      },
      'Modern Minimalist Sofa': {
        Color: ['Gray', 'Beige', 'Navy'],
        Material: ['Fabric', 'Leather'],
        Style: ['Modern', 'Classic'],
      },
      // Food & Beverages (Seller 1)
      'Premium Arabica Coffee Beans': {
        'Roast Level': ['Medium Roast', 'Dark Roast'],
        'Grind Type': ['Whole Bean', 'Fine Grind', 'Medium Grind'],
        Origin: ['Colombian', 'Ethiopian', 'Brazilian'],
      },
      'Organic Green Tea Collection': {
        'Tea Type': ['Green Tea', 'White Tea', 'Herbal Tea'],
        'Steep Time': ['2-3 min', '3-5 min'],
      },
      'Artisan Chocolate Bar Collection': {
        'Cocoa Percentage': ['70%', '85%', '90%'],
        Material: ['Organic Cocoa'],
      },
      // Sports & Outdoors (Seller 2 - Fashion)
      'Professional Yoga Mat': {
        Color: ['Purple', 'Blue', 'Black', 'Pink'],
        Thickness: ['6mm', '8mm'],
        Length: ['183cm', '188cm'],
      },
      '4-Person Camping Tent': {
        Color: ['Green', 'Blue', 'Orange'],
        Capacity: ['4 Person'],
        'Waterproof Rating': ['2000mm', '3000mm'],
      },
      // Books & Media (Seller 1)
      'Bestselling Novel Collection': {
        Genre: ['Fiction', 'Mystery', 'Romance'],
        'Book Count': ['3', '5'],
      },
      'Acoustic Guitar Starter Pack': {
        'String Type': ['Steel', 'Nylon'],
        'Wood Type': ['Mahogany', 'Spruce'],
      },
      // Health & Beauty (Seller 2 - Fashion)
      'Organic Face Moisturizer': {
        'Skin Type': ['Normal', 'Dry', 'Oily'],
        Fragrance: ['Unscented', 'Lavender'],
      },
      'Bamboo Toothbrush Set': {
        Color: ['Green', 'Blue', 'White'],
        Quantity: ['4 Pack', '6 Pack'],
      },
      // Toys & Games (Seller 1)
      'STEM Science Kit for Kids': {
        Color: ['Multi-color'],
      },
      'Strategy Board Game Collection': {
        Color: ['Multi-color'],
      },
      // Artisan Crafts (Seller 1)
      'Handmade Silver Necklace': {
        'Metal Type': ['Silver'],
        Gemstone: ['Amethyst', 'Turquoise', 'Rose Quartz'],
      },
      'Wooden Cutting Board Set': {
        Material: ['Bamboo', 'Maple'],
      },
      // Local Produce (Seller 1)
      'Organic Vegetable Box': {
        'Organic Certified': ['Yes'],
        Freshness: ['Fresh'],
      },
      'Fresh Fruit Basket': {
        'Organic Certified': ['Yes', 'No'],
        Freshness: ['Fresh'],
      },
      // Custom Items (Seller 1)
      'Custom Photo Canvas Print': {
        'Customization Type': ['Photo Print'],
        'Canvas Size': ['11"x14"', '16"x20"', '24"x36"'],
      },
      'Engraved Wooden Keepsake Box': {
        'Customization Type': ['Engraving'],
        Material: ['Oak', 'Walnut', 'Cherry'],
      },
      // Coffee Beans (Seller 1)
      'Ethiopian Yirgacheffe Coffee Beans': {
        'Roast Level': ['Light Roast', 'Medium Roast'],
        'Grind Type': ['Whole Bean'],
        Origin: ['Ethiopian'],
        Grade: ['Specialty Grade', 'Premium Grade'],
        'Flavor Profile': ['Floral', 'Citrus', 'Fruity'],
        'Processing Method': ['Sun-dried', 'Fermented'],
        Weight: ['250g', '1kg'],
      },
      'Colombian Supremo Coffee Beans': {
        'Roast Level': ['Medium Roast', 'Dark Roast'],
        'Grind Type': ['Whole Bean'],
        Origin: ['Colombian'],
        Grade: ['Premium Grade', 'Fair Trade Grade'],
        'Flavor Profile': ['Chocolatey', 'Nutty', 'Sweet'],
        'Processing Method': ['Sun-dried'],
        Weight: ['250g', '1kg'],
      },
      'Brazil Santos Coffee Beans': {
        'Roast Level': ['Light Roast', 'Medium Roast'],
        'Grind Type': ['Whole Bean'],
        Origin: ['Brazilian'],
        Grade: ['Standard Grade'],
        'Flavor Profile': ['Nutty', 'Chocolatey'],
        'Processing Method': ['Sun-dried'],
        Weight: ['250g', '1kg'],
      },
      'House Espresso Blend Coffee Beans': {
        'Roast Level': ['Dark Roast', 'Italian Roast'],
        'Grind Type': ['Whole Bean', 'Espresso Grind'],
        Origin: ['Colombian', 'Brazilian'],
        Grade: ['Premium Grade'],
        'Flavor Profile': ['Chocolatey', 'Smoky'],
        'Processing Method': ['Oxidized'],
        Weight: ['250g', '1kg'],
      },
      // Drinkware (Seller 1)
      'Double-Wall Glass Tumbler': {
        Material: ['Glass'],
        Volume: ['350ml', '16oz'],
      },
      'Ceramic Latte Mug': {
        Material: ['Ceramic'],
        Volume: ['350ml', '12oz'],
        Color: ['White', 'Black'],
      },
      'Stainless Steel Travel Tumbler': {
        Material: ['Stainless Steel'],
        Volume: ['500ml', '20oz'],
        Color: ['Black', 'Silver'],
      },
      'Insulated Water Bottle': {
        Material: ['Stainless Steel'],
        Volume: ['750ml', '1L'],
        Color: ['Blue', 'Black'],
      },
      // Equipment (Seller 1)
      'Manual Coffee Grinder': {
        Material: ['Stainless Steel', 'Bamboo'],
      },
      'Pour Over Coffee Dripper Set': {
        Material: ['Glass', 'Ceramic'],
        Volume: ['350ml', '500ml'],
      },
      'French Press Coffee Maker': {
        Material: ['Glass', 'Stainless Steel'],
        Volume: ['500ml', '750ml'],
      },
      'Electric Milk Frother': {
        Material: ['Stainless Steel', 'Plastic'],
        Power: ['USB', 'AC'],
      },
      // Ingredients (Seller 1)
      'Vanilla Syrup': {
        'Flavor Profile': ['Sweet'],
        Volume: ['250ml', '500ml'],
      },
      'Caramel Syrup': {
        'Flavor Profile': ['Sweet'],
        Volume: ['250ml', '500ml'],
      },
      'Cocoa Powder': {
        Weight: ['200g', '250g'],
        Grade: ['Organic Grade'],
        'Flavor Profile': ['Chocolatey'],
      },
      'Matcha Powder': {
        Weight: ['50g', '200g'],
        'Tea Grade': ['Ceremonial Grade', 'Premium Grade', 'Standard Grade'],
        'Tea Type': ['Green Tea'],
      },
    };
    const existingProductAttributes =
      await this.productAttributeRepository.find();
    const existingMap = new Map<string, ProductAttributeEntity>();
    for (const pa of existingProductAttributes) {
      const key = `${pa.product_id}-${pa.attribute_id}`;
      existingMap.set(key, pa);
    }
    const normalizeIds = (
      value: readonly number[] | null | undefined,
    ): string => {
      const ids: number[] = [...(value ?? [])];
      ids.sort((a, b) => a - b);
      return ids.join(',');
    };
    let createdCount = 0;
    let updatedCount = 0;
    for (const product of products) {
      const actorUser = product.seller_id === 2 ? seller2User : user;
      const attributeMappings = productAttributeMappings[product.product_name];
      if (!attributeMappings) {
        continue;
      }
      for (const [attributeName, valueNames] of Object.entries(
        attributeMappings,
      )) {
        const attributeKey = `${product.seller_id}-${attributeName}`;
        const attribute = attributesBySellerAndName.get(attributeKey);
        if (!attribute) {
          continue;
        }
        const attributeValueIds = getAttributeValueIds(
          product.seller_id,
          attributeName,
          valueNames,
        );
        const key = `${product.id}-${attribute.id}`;
        const existing = existingMap.get(key);
        if (!existing) {
          const saved = await this.productAttributeRepository.save(
            this.productAttributeRepository.create({
              product_id: product.id,
              attribute_id: attribute.id,
              attribute_value_ids: attributeValueIds,
              created_by: actorUser,
              updated_by: actorUser,
            }),
          );
          existingMap.set(key, saved);
          createdCount++;
          continue;
        }
        const existingIds = normalizeIds(existing.attribute_value_ids);
        const nextIds = normalizeIds(attributeValueIds);
        if (!nextIds || existingIds === nextIds) {
          continue;
        }
        await this.productAttributeRepository.save({
          ...existing,
          attribute_value_ids: attributeValueIds,
          updated_by: actorUser,
        });
        updatedCount++;
      }
    }
    console.log(
      `✅ Product attributes seed completed (${createdCount} inserted, ${updatedCount} updated)`,
    );
  }
}
