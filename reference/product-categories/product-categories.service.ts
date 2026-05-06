import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BaseProductCategoryRepository } from '@/product-categories/persistence/repositories/base-product-category.repository';
import { ProductCategory } from '@/product-categories/domain/product-category';
import { SyncProductCategoriesDto } from '@/product-categories/dto/sync-product-categories.dto';
import { QueryProductCategoriesDto } from '@/product-categories/dto/query-product-categories.dto';
import { User } from '@/users/domain/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Service for product-category business logic
 */
@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly repository: BaseProductCategoryRepository,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
  ) {}

  /**
   * Sync categories for a product
   * Replaces all existing categories with the provided list
   */
  async syncCategories(
    productId: number,
    input: SyncProductCategoriesDto,
    causer: User,
  ): Promise<ProductCategory[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const seller = await this.sellerRepository.findOne({
      where: { id: product.seller_id, user_id: causer.id },
    });

    if (!seller) {
      throw new ForbiddenException(
        'You can only update categories for products that belong to you',
      );
    }

    // Sync categories
    const result = await this.repository.syncCategories(
      productId,
      input.category_ids,
    );

    return result;
  }

  /**
   * Find all product categories for the current user's products
   * Optionally filter by product ID and category name
   */
  async findAll(
    causer: User,
    query: QueryProductCategoriesDto,
  ): Promise<ProductCategory[]> {
    return this.repository.findAll(
      causer.id,
      query.productId,
      query.categoryName,
    );
  }
}
