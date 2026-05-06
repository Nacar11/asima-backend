import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { ProductMediaMapping } from '@/media/domain/product-media-mapping';
import { ProductMediaMappingMapper } from '@/media/persistence/mappers/product-media-mapping.mapper';

@Injectable()
export class ProductMediaMappingRepository {
  constructor(
    @InjectRepository(ProductMediaMappingEntity)
    private readonly repository: Repository<ProductMediaMappingEntity>,
  ) {}

  async create(data: ProductMediaMapping): Promise<ProductMediaMapping> {
    const persistenceModel = ProductMediaMappingMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return ProductMediaMappingMapper.toDomain(newEntity);
  }

  async findByProductId(productId: number): Promise<ProductMediaMapping[]> {
    const entities = await this.repository.find({
      where: { product_id: productId },
      relations: ['media'],
      order: { display_order: 'ASC' },
    });

    return entities.map(ProductMediaMappingMapper.toDomain);
  }

  async findProductLevelMedia(
    productId: number,
  ): Promise<ProductMediaMapping[]> {
    const entities = await this.repository.find({
      where: { product_id: productId },
      relations: ['media'],
      order: { display_order: 'ASC' },
    });

    return entities.map(ProductMediaMappingMapper.toDomain);
  }

  async findByMediaId(mediaId: number): Promise<ProductMediaMapping[]> {
    const entities = await this.repository.find({
      where: { media_id: mediaId },
    });

    return entities.map(ProductMediaMappingMapper.toDomain);
  }

  async findOneById(id: number): Promise<ProductMediaMapping | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!entity) {
      return null;
    }
    return ProductMediaMappingMapper.toDomain(entity);
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.delete({ id });
  }

  async deleteByProductAndMedia(
    productId: number,
    mediaId: number,
  ): Promise<void> {
    await this.repository.delete({
      product_id: productId,
      media_id: mediaId,
    });
  }

  async updateDisplayOrder(
    productId: number,
    mediaOrder: Array<{ media_id: number; display_order: number }>,
  ): Promise<void> {
    for (const item of mediaOrder) {
      await this.repository.update(
        { product_id: productId, media_id: item.media_id, is_primary: false },
        { display_order: item.display_order },
      );
    }
  }

  /**
   * Swap primary image: makes the new media the primary.
   * - Old primary: converted to gallery (is_primary=false), removes duplicate gallery mappings
   * - New primary: creates mapping with is_primary=true, keeps ONE gallery mapping
   */
  async swapPrimary(
    productId: number,
    newPrimaryMediaId: number,
  ): Promise<void> {
    // Check if this media is already the primary
    const existingPrimary = await this.repository.findOne({
      where: {
        product_id: productId,
        media_id: newPrimaryMediaId,
        is_primary: true,
      },
    });

    // If new primary is already the primary, nothing to do
    if (existingPrimary) {
      return;
    }

    // Find the current primary
    const currentPrimary = await this.repository.findOne({
      where: { product_id: productId, is_primary: true },
    });

    // Get max gallery display_order for positioning
    const maxOrder = await this.getMaxGalleryDisplayOrder(productId);

    if (currentPrimary) {
      // Check if old primary already has a gallery mapping
      const oldPrimaryGalleryMapping = await this.repository.findOne({
        where: {
          product_id: productId,
          media_id: currentPrimary.media_id,
          is_primary: false,
        },
      });

      if (oldPrimaryGalleryMapping) {
        // Old primary already has gallery mapping, just delete the primary mapping
        await this.repository.delete({
          product_id: productId,
          media_id: currentPrimary.media_id,
          is_primary: true,
        });
      } else {
        // Convert old primary to gallery (update to is_primary=false)
        await this.repository.update(
          {
            product_id: productId,
            media_id: currentPrimary.media_id,
            is_primary: true,
          },
          { is_primary: false, display_order: maxOrder + 1 },
        );
      }
    }

    // Check if new primary already has a gallery mapping
    const newPrimaryGalleryMapping = await this.repository.findOne({
      where: {
        product_id: productId,
        media_id: newPrimaryMediaId,
        is_primary: false,
      },
    });

    if (newPrimaryGalleryMapping) {
      // Keep the gallery mapping, create new primary mapping
      const newMapping = this.repository.create({
        product_id: productId,
        media_id: newPrimaryMediaId,
        is_primary: true,
        display_order: 0,
      });
      await this.repository.save(newMapping);
    } else {
      // No gallery mapping exists, create primary mapping
      const newMapping = this.repository.create({
        product_id: productId,
        media_id: newPrimaryMediaId,
        is_primary: true,
        display_order: 0,
      });
      await this.repository.save(newMapping);
    }
  }

  /**
   * Unset is_primary for all media mappings for a product.
   * Used before setting a new primary image.
   */
  async unsetPrimaryForProduct(productId: number): Promise<void> {
    await this.repository.update(
      { product_id: productId, is_primary: true },
      { is_primary: false },
    );
  }

  async syncPrimaryImage(productId: number, mediaId: number): Promise<void> {
    await this.repository.manager.transaction(async (entityManager) => {
      const repository = entityManager.getRepository(ProductMediaMappingEntity);
      await entityManager.query(
        'SELECT id FROM products WHERE id = $1 FOR UPDATE',
        [productId],
      );
      await repository.delete({ product_id: productId, is_primary: true });
      const newMapping = repository.create({
        product_id: productId,
        media_id: mediaId,
        is_primary: true,
        display_order: 0,
      });
      await repository.save(newMapping);
    });
  }

  async syncProductImages(
    productId: number,
    mediaIds: number[],
  ): Promise<void> {
    const uniqueMediaIds = Array.from(new Set(mediaIds));
    await this.repository.manager.transaction(async (entityManager) => {
      const repository = entityManager.getRepository(ProductMediaMappingEntity);
      await entityManager.query(
        'SELECT id FROM products WHERE id = $1 FOR UPDATE',
        [productId],
      );
      await repository
        .createQueryBuilder()
        .delete()
        .where('product_id = :productId', { productId })
        .andWhere('"is_primary" IS DISTINCT FROM true')
        .execute();
      if (uniqueMediaIds.length === 0) {
        return;
      }
      const mappingsToCreate = uniqueMediaIds.map((mediaId, index) =>
        repository.create({
          product_id: productId,
          media_id: mediaId,
          is_primary: false,
          display_order: index + 1,
        }),
      );
      await repository.save(mappingsToCreate);
    });
  }

  /**
   * Unset is_primary and move the old primary to the gallery with a specific display_order.
   * Used when linking a new primary image via POST.
   */
  async unsetPrimaryAndMoveToGallery(
    productId: number,
    newDisplayOrder: number,
  ): Promise<void> {
    await this.repository.update(
      { product_id: productId, is_primary: true },
      { is_primary: false, display_order: newDisplayOrder },
    );
  }

  /**
   * Get the maximum display_order for gallery images of a product.
   * Gallery images are those with is_primary = false.
   */
  async getMaxGalleryDisplayOrder(productId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('mapping')
      .select('MAX(mapping.display_order)', 'maxOrder')
      .where('mapping.product_id = :productId', { productId })
      .andWhere('mapping.is_primary = false')
      .getRawOne();

    return result?.maxOrder ?? -1;
  }

  /**
   * Get existing media IDs for gallery images of a product.
   * Gallery images are those with is_primary = false.
   */
  async getExistingGalleryMediaIds(productId: number): Promise<number[]> {
    const entities = await this.repository.find({
      where: {
        product_id: productId,
        is_primary: false,
      },
      select: ['media_id'],
    });

    return entities.map((e) => e.media_id);
  }

  /**
   * Check if a product has a primary image.
   */
  async hasPrimaryImage(productId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        product_id: productId,
        is_primary: true,
      },
    });

    return count > 0;
  }

  /**
   * Update display_order for a single media mapping.
   */
  async updateSingleDisplayOrder(
    productId: number,
    mediaId: number,
    displayOrder: number,
  ): Promise<void> {
    await this.repository.update(
      {
        product_id: productId,
        media_id: mediaId,
        is_primary: false,
      },
      { display_order: displayOrder },
    );
  }

  /**
   * Set a specific media as primary for a product.
   * Should be called after unsetPrimaryForProduct to ensure only one primary.
   */
  async setAsPrimary(productId: number, mediaId: number): Promise<void> {
    await this.repository.update(
      {
        product_id: productId,
        media_id: mediaId,
      },
      { is_primary: true, display_order: 0 },
    );
  }
}
