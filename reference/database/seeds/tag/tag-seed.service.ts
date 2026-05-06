import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

@Injectable()
export class TagSeedService implements ISeedService {
  constructor(
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
    @InjectRepository(SellerEntity)
    private sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.tagRepository.count();

    if (!count) {
      // Get the admin user (creator)
      const user = await this.userRepository.findOne({
        where: { id: 1 },
      });

      if (!user) {
        console.error('❌ No user found. Cannot proceed to seed tags.');
        return;
      }

      // Get seller 1 and seller 2
      const seller1 = await this.sellerRepository.findOne({
        where: { id: 1 },
      });

      const seller2 = await this.sellerRepository.findOne({
        where: { id: 2 },
      });

      if (!seller1 || !seller2) {
        console.error(
          '❌ Sellers not found. Cannot proceed to seed tags. Please run seller seeder first.',
        );
        return;
      }

      // Tags for Seller 1 (Tech Store)
      const seller1Tags = [
        {
          seller_id: seller1.id,
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and gadgets',
          count: 0,
          display_order: 1,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller1.id,
          name: 'Wireless',
          slug: 'wireless',
          description: 'Wireless technology products',
          count: 0,
          display_order: 2,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller1.id,
          name: 'Gaming',
          slug: 'gaming',
          description: 'Gaming equipment and accessories',
          count: 0,
          display_order: 3,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller1.id,
          name: 'New Arrival',
          slug: 'new-arrival',
          description: 'Newly added products',
          count: 0,
          display_order: 4,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller1.id,
          name: 'Best Seller',
          slug: 'best-seller',
          description: 'Top selling products',
          count: 0,
          display_order: 5,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
      ];

      // Tags for Seller 2 (Fashion Boutique)
      const seller2Tags = [
        {
          seller_id: seller2.id,
          name: 'Clothing',
          slug: 'clothing',
          description: 'Apparel and garments',
          count: 0,
          display_order: 1,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller2.id,
          name: 'Accessories',
          slug: 'accessories',
          description: 'Fashion accessories',
          count: 0,
          display_order: 2,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller2.id,
          name: 'Summer Collection',
          slug: 'summer-collection',
          description: 'Summer fashion items',
          count: 0,
          display_order: 3,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller2.id,
          name: 'New Arrival',
          slug: 'new-arrival',
          description: 'Newly added products',
          count: 0,
          display_order: 4,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
        {
          seller_id: seller2.id,
          name: 'Best Seller',
          slug: 'best-seller',
          description: 'Top selling products',
          count: 0,
          display_order: 5,
          status: 'Active',
          created_by: user.id,
          updated_by: user.id,
        },
      ];

      // Get seller 3 (Uncle Brew)
      const seller3 = await this.sellerRepository.findOne({
        where: { id: 3 },
      });

      // Tags for Seller 3 (Uncle Brew)
      const seller3Tags = seller3
        ? [
            {
              seller_id: seller3.id,
              name: 'Coffee',
              slug: 'coffee',
              description: 'Coffee-based beverages',
              count: 0,
              display_order: 1,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Milk Tea',
              slug: 'milk-tea',
              description: 'Milk tea drinks',
              count: 0,
              display_order: 2,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Chocolate',
              slug: 'chocolate',
              description: 'Chocolate beverages',
              count: 0,
              display_order: 3,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Ice Cream',
              slug: 'ice-cream',
              description: 'Ice cream and frozen treats',
              count: 0,
              display_order: 4,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Budget Friendly',
              slug: 'budget-friendly',
              description: 'Affordable items at ₱39 and below',
              count: 0,
              display_order: 5,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Franchise Supplies',
              slug: 'franchise-supplies',
              description: 'Equipment and materials for franchisees',
              count: 0,
              display_order: 6,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
            {
              seller_id: seller3.id,
              name: 'Best Seller',
              slug: 'best-seller',
              description: 'Top selling products',
              count: 0,
              display_order: 7,
              status: 'Active',
              created_by: user.id,
              updated_by: user.id,
            },
          ]
        : [];

      // Combine all tags
      const allTags = [...seller1Tags, ...seller2Tags, ...seller3Tags];

      // Save all tags
      await this.tagRepository.save(this.tagRepository.create(allTags));

      console.log(
        `✅ Tags seeded successfully (${seller1Tags.length} for Seller 1, ${seller2Tags.length} for Seller 2, ${seller3Tags.length} for Seller 3)`,
      );
    }
  }
}
