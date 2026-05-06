import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '../seed.interface';

/**
 * Service for seeding product tags
 */
@Injectable()
export class ProductTagsSeedService implements ISeedService {
  constructor(
    @InjectRepository(ProductTagEntity)
    private repository: Repository<ProductTagEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: 1 },
    });
    if (!user) {
      console.error('❌ No user found. Cannot proceed to seed product tags.');
      return;
    }
    const products = await this.productRepository.find();
    const tags = await this.tagRepository.find();
    if (products.length === 0 || tags.length === 0) {
      console.log('⚠️  No products or tags found. Skipping product tags seed.');
      return;
    }
    const existingProductTags = await this.repository.find();
    const existingKeySet = new Set<string>();
    existingProductTags.forEach((pt) => {
      existingKeySet.add(`${pt.product_id}-${pt.tag_id}`);
    });
    const tagMap = new Map<string, TagEntity>();
    tags.forEach((tag) => {
      const scope = tag.seller_id ?? 'global';
      tagMap.set(`${scope}-${tag.name.toLowerCase()}`, tag);
    });
    const ensureProductTag = async (input: {
      readonly product_id: number;
      readonly tag_id: number;
      readonly tag_order: number;
    }): Promise<void> => {
      const key = `${input.product_id}-${input.tag_id}`;
      if (existingKeySet.has(key)) {
        return;
      }
      await this.repository.save({
        product_id: input.product_id,
        tag_id: input.tag_id,
        tag_order: input.tag_order,
        created_by: user.id,
      });
      existingKeySet.add(key);
    };
    const addProductToTags = async (
      product: ProductEntity | undefined,
      tagNames: Array<{ name: string; sellerId?: number | null }>,
    ): Promise<void> => {
      if (!product) {
        return;
      }
      let tagOrder = 0;
      for (const { name, sellerId } of tagNames) {
        const scope = sellerId ?? 'global';
        const tag = tagMap.get(`${scope}-${name.toLowerCase()}`);
        if (!tag) {
          continue;
        }
        await ensureProductTag({
          product_id: product.id,
          tag_id: tag.id,
          tag_order: tagOrder,
        });
        tagOrder++;
      }
    };
    let createdCount = 0;
    const initialCount = existingKeySet.size;

    const seller3Id = 3;
    const premiumCoffeeBeanProductNames = [
      'Premium Arabica Coffee Beans',
      'Premium Robusta Coffee Beans',
      'Single-Origin Arabica Coffee Beans - Ethiopia',
      'Single-Origin Arabica Coffee Beans - Colombia',
      'Espresso Blend Coffee Beans',
    ];
    for (const productName of premiumCoffeeBeanProductNames) {
      await addProductToTags(
        products.find((p) => p.product_name === productName),
        [
          { name: 'Coffee', sellerId: seller3Id },
          { name: 'Franchise Supplies', sellerId: seller3Id },
        ],
      );
    }

    // Franchise Supplies - Equipment
    await addProductToTags(
      products.find((p) => p.product_name === 'Cup Sealer Machine'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Milk Tea Shaker Machine'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Fructose Dispenser'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Automatic Tea Brewer'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Commercial Blender'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );

    // Franchise Supplies - Packaging
    await addProductToTags(
      products.find((p) => p.product_name === 'PP Cups 16oz (50pcs)'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'PP Cups 22oz (50pcs)'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Sealer Film Roll'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Fat Straws (100pcs)'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );

    // Franchise Supplies - Ingredients
    await addProductToTags(
      products.find((p) => p.product_name === 'Milk Tea Powder 1kg'),
      [
        { name: 'Milk Tea', sellerId: seller3Id },
        { name: 'Franchise Supplies', sellerId: seller3Id },
      ],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Fructose Syrup 2.5kg'),
      [{ name: 'Franchise Supplies', sellerId: seller3Id }],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Tapioca Pearls 1kg'),
      [
        { name: 'Milk Tea', sellerId: seller3Id },
        { name: 'Franchise Supplies', sellerId: seller3Id },
      ],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Coffee Jelly 1kg'),
      [
        { name: 'Coffee', sellerId: seller3Id },
        { name: 'Franchise Supplies', sellerId: seller3Id },
      ],
    );
    await addProductToTags(
      products.find((p) => p.product_name === 'Non-Dairy Creamer 1kg'),
      [
        { name: 'Milk Tea', sellerId: seller3Id },
        { name: 'Franchise Supplies', sellerId: seller3Id },
      ],
    );

    createdCount = existingKeySet.size - initialCount;
    console.log(`✅ Product tags seed completed (${createdCount} inserted)`);
  }
}
