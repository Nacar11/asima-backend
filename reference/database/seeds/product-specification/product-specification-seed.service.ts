import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSpecificationEntity } from '@/product-specifications/persistence/entities/product-specification.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Injectable()
export class ProductSpecificationSeedService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductSpecificationEntity)
    private repository: Repository<ProductSpecificationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      const user = await this.userRepository.findOne({
        where: { id: 1 },
      });

      if (!user) {
        console.error(
          '❌ No user found. Cannot proceed to seed product specifications.',
        );
        return;
      }

      const products = await this.productRepository.find();

      if (products.length === 0) {
        console.error(
          '❌ No products found. Cannot proceed to seed product specifications.',
        );
        return;
      }

      // Create product lookup for easier access
      const productMap = new Map<string, ProductEntity>();
      products.forEach((product) => {
        productMap.set(product.product_name.toLowerCase(), product);
      });

      const specifications: Partial<ProductSpecificationEntity>[] = [];

      // iPhone 15 Pro Max Specifications
      const iPhone15 = productMap.get('iphone 15 pro max');
      if (iPhone15) {
        specifications.push(
          {
            product_id: iPhone15.id,
            specification_name: 'Display Size',
            unit: 'inches',
            specification_value: '6.7',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: iPhone15.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '221',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: iPhone15.id,
            specification_name: 'Dimensions',
            unit: 'mm',
            specification_value: '159.9 x 76.7 x 8.25 (H x W x D)',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: iPhone15.id,
            specification_name: 'Storage',
            unit: 'GB',
            specification_value: '256 / 512 / 1TB',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: iPhone15.id,
            specification_name: 'Camera',
            unit: 'MP',
            specification_value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: iPhone15.id,
            specification_name: 'Battery Life',
            unit: 'hours',
            specification_value: 'Up to 29 hours video playback',
            sort_order: 6,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // MacBook Pro 16 Specifications
      const macbook = productMap.get('macbook pro 16');
      if (macbook) {
        specifications.push(
          {
            product_id: macbook.id,
            specification_name: 'Display Size',
            unit: 'inches',
            specification_value: '16.2',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            specification_name: 'Weight',
            unit: 'kg',
            specification_value: '2.15',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            specification_name: 'Dimensions',
            unit: 'cm',
            specification_value: '35.57 x 24.81 x 1.55 (H x W x D)',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            specification_name: 'Processor',
            unit: '',
            specification_value: 'Apple M3 Pro / M3 Max chip',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            specification_name: 'RAM',
            unit: 'GB',
            specification_value: '18 / 36 / 48 / 96 / 128GB unified memory',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: macbook.id,
            specification_name: 'Storage',
            unit: 'GB',
            specification_value: '512GB / 1TB / 2TB / 4TB / 8TB SSD',
            sort_order: 6,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Sony WH-1000XM5 Specifications
      const headphones = productMap.get('sony wh-1000xm5');
      if (headphones) {
        specifications.push(
          {
            product_id: headphones.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '250',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: headphones.id,
            specification_name: 'Driver Size',
            unit: 'mm',
            specification_value: '30mm',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: headphones.id,
            specification_name: 'Battery Life',
            unit: 'hours',
            specification_value: '30 (ANC on), 40 (ANC off)',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: headphones.id,
            specification_name: 'Frequency Response',
            unit: 'Hz',
            specification_value: '4Hz - 40,000Hz',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: headphones.id,
            specification_name: 'Charging Time',
            unit: 'minutes',
            specification_value:
              '3 hours full charge, 3 min for 3 hours playback',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Samsung 65" QLED TV Specifications
      const tv = productMap.get('samsung 65" qled tv');
      if (tv) {
        specifications.push(
          {
            product_id: tv.id,
            specification_name: 'Screen Size',
            unit: 'inches',
            specification_value: '65',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tv.id,
            specification_name: 'Resolution',
            unit: '',
            specification_value: '4K UHD (3840 x 2160)',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tv.id,
            specification_name: 'Weight',
            unit: 'kg',
            specification_value: '25.8 (without stand), 26.2 (with stand)',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tv.id,
            specification_name: 'Dimensions',
            unit: 'cm',
            specification_value: '144.8 x 83.2 x 5.8 (without stand)',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tv.id,
            specification_name: 'Refresh Rate',
            unit: 'Hz',
            specification_value: '120',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tv.id,
            specification_name: 'Smart TV Platform',
            unit: '',
            specification_value: 'Tizen',
            sort_order: 6,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Nike Air Max 270 Specifications
      const nikeShoes = productMap.get('nike air max 270');
      if (nikeShoes) {
        specifications.push(
          {
            product_id: nikeShoes.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '340 (size 42)',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            specification_name: 'Heel Height',
            unit: 'mm',
            specification_value: '32',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            specification_name: 'Material',
            unit: '',
            specification_value: 'Mesh upper, Rubber sole, Foam midsole',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: nikeShoes.id,
            specification_name: 'Available Sizes',
            unit: '',
            specification_value: 'US 7-13, EU 40-46, UK 6-12',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Adidas Climacool T-Shirt Specifications
      const adidasShirt = productMap.get('adidas climacool t-shirt');
      if (adidasShirt) {
        specifications.push(
          {
            product_id: adidasShirt.id,
            specification_name: 'Material',
            unit: '',
            specification_value: '100% Polyester with Climacool technology',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '180 (size M)',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            specification_name: 'Available Sizes',
            unit: '',
            specification_value: 'XS, S, M, L, XL, XXL',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: adidasShirt.id,
            specification_name: 'Care Instructions',
            unit: '',
            specification_value: 'Machine wash cold, Tumble dry low',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Professional Yoga Mat Specifications
      const yogaMat = productMap.get('professional yoga mat');
      if (yogaMat) {
        specifications.push(
          {
            product_id: yogaMat.id,
            specification_name: 'Dimensions',
            unit: 'cm',
            specification_value: '183 x 61 x 0.6 (L x W x Thickness)',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: yogaMat.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '1200',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: yogaMat.id,
            specification_name: 'Material',
            unit: '',
            specification_value: 'High-density TPE eco-friendly material',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: yogaMat.id,
            specification_name: 'Non-slip Surface',
            unit: '',
            specification_value:
              'Double-sided textured surface for superior grip',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // 4-Person Camping Tent Specifications
      const tent = productMap.get('4-person camping tent');
      if (tent) {
        specifications.push(
          {
            product_id: tent.id,
            specification_name: 'Capacity',
            unit: 'persons',
            specification_value: '4',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tent.id,
            specification_name: 'Dimensions',
            unit: 'cm',
            specification_value: '240 x 240 x 185 (L x W x H)',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tent.id,
            specification_name: 'Weight',
            unit: 'kg',
            specification_value: '7.2',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tent.id,
            specification_name: 'Material',
            unit: '',
            specification_value: '190T polyester fabric, 7001 aluminum poles',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tent.id,
            specification_name: 'Water Resistance',
            unit: 'mm',
            specification_value: '3000mm waterproof rating',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Premium Colombian Coffee Specifications
      const coffee = productMap.get('premium arabica coffee beans');
      if (coffee) {
        specifications.push(
          {
            product_id: coffee.id,
            specification_name: 'Origin',
            unit: '',
            specification_value: 'Colombia, Medellín region, Antioquia',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Coffee Variety',
            unit: '',
            specification_value: '100% Arabica (Caturra, Castillo, Typica)',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Growing Altitude',
            unit: 'meters',
            specification_value: '1,200 - 1,800 meters above sea level',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Processing Method',
            unit: '',
            specification_value: 'Washed processing, sun-dried on patios',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Flavor Profile',
            unit: '',
            specification_value:
              'Chocolate, Caramel, Citrus, Nutty, Medium body',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Caffeine Content',
            unit: 'mg',
            specification_value: '95mg per 8oz cup (1.2%)',
            sort_order: 6,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Acidity Level',
            unit: '',
            specification_value: 'Medium acidity (pH 5.2-5.5)',
            sort_order: 7,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Roast Profile Options',
            unit: '',
            specification_value: 'Medium Roast, Dark Roast',
            sort_order: 8,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Grind Options',
            unit: '',
            specification_value:
              'Whole Bean, Fine Grind, Coarse Grind, Espresso Grind',
            sort_order: 9,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Package Weight',
            unit: 'grams',
            specification_value: '454g (1 lb) resealable bag',
            sort_order: 10,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Shelf Life',
            unit: 'months',
            specification_value: '12 months from roast date',
            sort_order: 11,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Brewing Recommendations',
            unit: '',
            specification_value:
              '1:16 ratio, 195-205°F water, 4-6 minutes extraction',
            sort_order: 12,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: coffee.id,
            specification_name: 'Certifications',
            unit: '',
            specification_value: 'Fair Trade, Organic, Rainforest Alliance',
            sort_order: 13,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Organic Green Tea Specifications
      const tea = productMap.get('organic green tea collection');
      if (tea) {
        specifications.push(
          {
            product_id: tea.id,
            specification_name: 'Origin',
            unit: '',
            specification_value: 'Japan, Kyoto region',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tea.id,
            specification_name: 'Weight',
            unit: 'grams',
            specification_value: '100',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tea.id,
            specification_name: 'Caffeine Content',
            unit: 'mg',
            specification_value: '25-30mg per 8oz cup',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tea.id,
            specification_name: 'Flavor Profile',
            unit: '',
            specification_value: 'Grassy, Vegetal, Slightly Sweet, Umami',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: tea.id,
            specification_name: 'Steeping Time',
            unit: 'minutes',
            specification_value: '2-3 minutes at 175°F (80°C)',
            sort_order: 5,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Modern Sofa Specifications
      const sofa = productMap.get('modern sofa');
      if (sofa) {
        specifications.push(
          {
            product_id: sofa.id,
            specification_name: 'Dimensions',
            unit: 'cm',
            specification_value: '200 x 90 x 85 (L x W x H)',
            sort_order: 1,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: sofa.id,
            specification_name: 'Weight',
            unit: 'kg',
            specification_value: '65',
            sort_order: 2,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: sofa.id,
            specification_name: 'Seating Capacity',
            unit: 'persons',
            specification_value: '3',
            sort_order: 3,
            created_by: user,
            updated_by: user,
          },
          {
            product_id: sofa.id,
            specification_name: 'Material',
            unit: '',
            specification_value:
              'High-quality fabric, Solid wood frame, High-density foam',
            sort_order: 4,
            created_by: user,
            updated_by: user,
          },
        );
      }

      // Save all specifications
      for (const specification of specifications) {
        await this.repository.save(specification);
      }

      console.log(
        `✅ Product specifications seeded successfully (${specifications.length} specifications created)`,
      );
    } else {
      console.log('⚠️  Product specifications already exist, skipping seed');
    }
  }
}
