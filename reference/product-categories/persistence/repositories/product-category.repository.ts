import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseProductCategoryRepository } from '@/product-categories/persistence/repositories/base-product-category.repository';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductCategoryMapper } from '@/product-categories/persistence/mappers/product-category.mapper';
import { ProductCategory } from '@/product-categories/domain/product-category';

/**
 * Concrete repository for product-category persistence operations
 */
@Injectable()
export class ProductCategoryRepository extends BaseProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategoryEntity)
    private readonly repository: Repository<ProductCategoryEntity>,
  ) {
    super();
  }

  async syncCategories(
    productId: number,
    categoryIds: number[],
  ): Promise<ProductCategory[]> {
    await this.repository.delete({ product_id: productId });

    if (categoryIds.length === 0) {
      return [];
    }

    const newAssociations = categoryIds.map((categoryId, index) =>
      this.repository.create({
        product_id: productId,
        category_id: categoryId,
        display_order: index,
      }),
    );
    await this.repository.save(newAssociations);

    const entities = await this.repository.find({
      where: { product_id: productId },
      relations: ['category', 'created_by', 'updated_by', 'deleted_by'],
      order: { display_order: 'ASC' },
    });

    return entities.map((entity) => ProductCategoryMapper.toDomain(entity));
  }

  async findAll(
    sellerUserId: number,
    productId?: number,
    categoryName?: string,
  ): Promise<ProductCategory[]> {
    let query = this.repository
      .createQueryBuilder('pc')
      .leftJoinAndSelect('pc.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('pc.created_by', 'created_by')
      .leftJoinAndSelect('pc.updated_by', 'updated_by')
      .leftJoinAndSelect('pc.deleted_by', 'deleted_by')
      .where('seller.user_id = :sellerUserId', { sellerUserId });

    if (productId) {
      query = query.andWhere('pc.product_id = :productId', { productId });
    }

    if (categoryName) {
      query = query.andWhere('category.category_name ILIKE :categoryName', {
        categoryName: `%${categoryName}%`,
      });
    }

    const entities = await query.orderBy('pc.display_order', 'ASC').getMany();
    return entities.map((entity) => ProductCategoryMapper.toDomain(entity));
  }
}
