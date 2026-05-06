import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { BaseProductVariantRepository } from '../base-product-variant.repository';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductVariantMapper } from '../mappers/product-variant.mapper';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductVariant } from '@/product-variants/domain/product-variant';
import { FindAllProductVariant } from '@/product-variants/domain/find-all-product-variant';
import { QueryProductVariantDto } from '@/product-variants/dto/query-product-variant.dto';

@Injectable()
export class ProductVariantRepository extends BaseProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findAll(query: QueryProductVariantDto): Promise<FindAllProductVariant> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 40;
    const sortOrder = query.sortBy ?? 'ASC';

    let queryBuilder: SelectQueryBuilder<ProductVariantEntity> =
      this.variantRepository
        .createQueryBuilder('variant')
        .withDeleted()
        .andWhere('variant.deleted_at IS NULL')
        .leftJoinAndSelect(
          'variant.product_attribute_values',
          'product_attribute_values',
        )
        .leftJoinAndSelect(
          'product_attribute_values.attribute_value',
          'attribute_value',
        )
        .leftJoinAndSelect('attribute_value.attribute', 'attribute')
        .leftJoinAndSelect('variant.inventory_stock', 'inventory_stock')
        .leftJoinAndSelect('variant.product', 'product')
        .leftJoinAndSelect('variant.created_by', 'created_by')
        .leftJoinAndSelect('variant.updated_by', 'updated_by')
        .leftJoinAndMapOne(
          'variant.media',
          MediaEntity,
          'variant_media',
          'variant_media.id = variant.media_id',
        );

    // Apply filters
    if (query.sku) {
      queryBuilder = queryBuilder.andWhere('variant.sku ILIKE :sku', {
        sku: `%${query.sku}%`,
      });
    }

    if (query.variant_name) {
      queryBuilder = queryBuilder.andWhere(
        'variant.variant_name ILIKE :variant_name',
        {
          variant_name: `%${query.variant_name}%`,
        },
      );
    }

    if (query.status) {
      queryBuilder = queryBuilder.andWhere('variant.status = :status', {
        status: query.status,
      });
    }

    if (query.product_id) {
      queryBuilder = queryBuilder.andWhere('variant.product_id = :product_id', {
        product_id: query.product_id,
      });
    }

    // Apply stable ordering
    queryBuilder = queryBuilder
      .orderBy('variant.display_order', sortOrder)
      .addOrderBy('variant.id', 'ASC');

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const entities = await queryBuilder.skip(skip).take(take).getMany();

    // Map to domain models
    const data = entities.map((entity) =>
      ProductVariantMapper.toDomain(entity),
    );

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async findById(id: number): Promise<ProductVariant | null> {
    const entity = await this.variantRepository.findOne({
      where: { id },
      relations: [
        'product_attribute_values',
        'product_attribute_values.attribute_value',
        'product_attribute_values.attribute_value.attribute',
        'inventory_stock',
        'media',
        'product',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? ProductVariantMapper.toDomain(entity) : null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const entity = await this.variantRepository.findOne({
      where: { sku },
      relations: [
        'product_attribute_values',
        'product_attribute_values.attribute_value',
        'product_attribute_values.attribute_value.attribute',
        'inventory_stock',
        'media',
        'product',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? ProductVariantMapper.toDomain(entity) : null;
  }

  async findByIdWithRelationships(id: number): Promise<ProductVariant | null> {
    const entity = await this.variantRepository.findOne({
      where: { id },
      relations: [
        'product_attribute_values',
        'product_attribute_values.attribute_value',
        'product_attribute_values.attribute_value.attribute',
        'inventory_stock',
        'media',
        'product',
        'created_by',
        'updated_by',
      ],
    });

    return entity ? ProductVariantMapper.toDomain(entity) : null;
  }

  async findByProductId(productId: number): Promise<ProductVariant[]> {
    const entities = await this.variantRepository.find({
      where: { product_id: productId },
      relations: [
        'product_attribute_values',
        'product_attribute_values.attribute_value',
        'product_attribute_values.attribute_value.attribute',
        'inventory_stock',
        'media',
        'product',
        'created_by',
        'updated_by',
      ],
      order: { display_order: 'ASC', id: 'ASC' },
    });

    return entities.map((entity) => ProductVariantMapper.toDomain(entity));
  }

  async findVariantWithLowestCostPrice(
    productId: number,
  ): Promise<ProductVariant | null> {
    const entity = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.product_id = :productId', { productId })
      .orderBy('variant.cost_price', 'ASC')
      .limit(1)
      .getOne();

    return entity ? ProductVariantMapper.toDomain(entity) : null;
  }

  async remove(id: number): Promise<void> {
    await this.variantRepository.softDelete(id);
  }
}
