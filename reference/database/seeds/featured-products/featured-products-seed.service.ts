import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { ProductFeaturedSectionEntity } from '@/featured-products/persistence/entities/product-featured-section.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FeaturedSectionEnum } from '@/products/products.enum';

@Injectable()
export class FeaturedProductsSeedService implements ISeedService {
  constructor(
    @InjectRepository(ProductFeaturedSectionEntity)
    private repository: Repository<ProductFeaturedSectionEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      // Get admin user for featured_by
      const adminUser = await this.userRepository.findOne({
        where: { id: 1 },
      });

      if (!adminUser) {
        console.error(
          '❌ No admin user found. Cannot proceed to seed featured products.',
        );
        return;
      }

      // Get published products to feature
      const products = await this.productRepository.find({
        where: { status: 'Published' },
        take: 20,
        order: { id: 'ASC' },
      });

      if (products.length === 0) {
        console.error(
          '❌ No published products found. Cannot proceed to seed featured products.',
        );
        return;
      }

      const featuredSections: Partial<ProductFeaturedSectionEntity>[] = [];

      // Featured section - first 5 products
      const featuredProducts = products.slice(0, 5);
      featuredProducts.forEach((product, index) => {
        featuredSections.push({
          product_id: product.id,
          section: FeaturedSectionEnum.FEATURED,
          display_order: index + 1,
          featured_at: new Date(),
          featured_by: adminUser,
        });
      });

      // Bestsellers section - products 3-8 (some overlap with featured)
      const bestsellerProducts = products.slice(2, 8);
      bestsellerProducts.forEach((product, index) => {
        featuredSections.push({
          product_id: product.id,
          section: FeaturedSectionEnum.BESTSELLERS,
          display_order: index + 1,
          featured_at: new Date(),
          featured_by: adminUser,
        });
      });

      // New Arrivals section - products 6-12
      const newArrivalProducts = products.slice(5, 12);
      newArrivalProducts.forEach((product, index) => {
        featuredSections.push({
          product_id: product.id,
          section: FeaturedSectionEnum.NEW_ARRIVALS,
          display_order: index + 1,
          featured_at: new Date(),
          featured_by: adminUser,
        });
      });

      // Trending section - products 1, 4, 7, 10, 13 (scattered selection)
      const trendingIndices = [0, 3, 6, 9, 12];
      trendingIndices.forEach((productIndex, orderIndex) => {
        if (products[productIndex]) {
          featuredSections.push({
            product_id: products[productIndex].id,
            section: FeaturedSectionEnum.TRENDING,
            display_order: orderIndex + 1,
            featured_at: new Date(),
            featured_by: adminUser,
          });
        }
      });

      // Save all featured section entries
      for (const featuredSection of featuredSections) {
        try {
          await this.repository.save(this.repository.create(featuredSection));
        } catch {
          // Skip duplicates (product already in section)
          console.warn(
            `Skipping duplicate: product ${featuredSection.product_id} in ${featuredSection.section}`,
          );
        }
      }

      console.log(
        `✅ Featured products seeded successfully:`,
        `\n   - Featured: ${featuredProducts.length} products`,
        `\n   - Bestsellers: ${bestsellerProducts.length} products`,
        `\n   - New Arrivals: ${newArrivalProducts.length} products`,
        `\n   - Trending: ${trendingIndices.filter((i) => products[i]).length} products`,
      );
    }
  }
}
