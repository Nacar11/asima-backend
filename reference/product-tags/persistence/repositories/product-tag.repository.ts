import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductTag } from '@/product-tags/domain/product-tag';
import { ProductTagMapper } from '@/product-tags/persistence/mappers/product-tag.mapper';
import { TagRepository } from '@/tags/persistence/repositories/tag.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductTagRepository {
  constructor(
    @InjectRepository(ProductTagEntity)
    private readonly productTagRepository: Repository<ProductTagEntity>,
    private readonly tagRepository: TagRepository,
    private readonly clsService: ClsService,
  ) {}

  async assignTagsToProduct(
    productId: number,
    tagIds: number[],
  ): Promise<ProductTag[]> {
    const currentUser = this.clsService.get('currentUser');

    // Validate tag limit (max 20 per product)
    const existingCount = await this.productTagRepository.count({
      where: { product_id: productId },
    });

    const newTagsCount = tagIds.length;
    if (existingCount + newTagsCount > 20) {
      throw new BadRequestException(
        `Maximum 20 tags can be assigned to a product. Current: ${existingCount}, Attempting to add: ${newTagsCount}`,
      );
    }

    // Validate all tags exist
    for (const tagId of tagIds) {
      const tag = await this.tagRepository.findById(tagId);
      if (!tag) {
        throw new NotFoundException(`Tag with ID ${tagId} not found`);
      }
    }

    const productTags: ProductTag[] = [];

    for (const tagId of tagIds) {
      // Check if already assigned
      const existing = await this.productTagRepository.findOne({
        where: { product_id: productId, tag_id: tagId },
      });

      if (existing) {
        throw new ConflictException(
          `Tag ${tagId} is already assigned to this product`,
        );
      }

      // Create assignment
      const entity = await this.productTagRepository.save({
        product_id: productId,
        tag_id: tagId,
        tag_order: 0,
        created_by: currentUser?.id,
      });

      productTags.push(ProductTagMapper.toDomain(entity));
    }

    return productTags;
  }

  async removeTagFromProduct(productId: number, tagId: number): Promise<void> {
    const entity = await this.productTagRepository.findOne({
      where: { product_id: productId, tag_id: tagId },
    });

    if (!entity) {
      throw new NotFoundException('Tag assignment not found');
    }

    await this.productTagRepository.remove(entity);
  }

  async findByProductId(productId: number): Promise<ProductTag[]> {
    const entities = await this.productTagRepository.find({
      where: { product_id: productId },
      relations: ['tag', 'creator'],
      order: { tag_order: 'ASC', created_at: 'ASC' },
    });

    return entities.map((entity) => ProductTagMapper.toDomain(entity));
  }

  async findByTagId(tagId: number): Promise<ProductTag[]> {
    const entities = await this.productTagRepository.find({
      where: { tag_id: tagId },
      relations: ['creator'],
      order: { created_at: 'DESC' },
    });

    return entities.map((entity) => ProductTagMapper.toDomain(entity));
  }

  async countByProductId(productId: number): Promise<number> {
    return this.productTagRepository.count({
      where: { product_id: productId },
    });
  }

  async countByTagId(tagId: number): Promise<number> {
    return this.productTagRepository.count({
      where: { tag_id: tagId },
    });
  }

  async deleteByTagId(tagId: number): Promise<void> {
    await this.productTagRepository.delete({ tag_id: tagId });
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.productTagRepository.delete({ product_id: productId });
  }

  async bulkAssign(
    productIds: number[],
    tagIds: number[],
  ): Promise<{ assigned_count: number; skipped_count: number }> {
    const currentUser = this.clsService.get('currentUser');
    let assignedCount = 0;
    let skippedCount = 0;

    for (const productId of productIds) {
      for (const tagId of tagIds) {
        // Check if already assigned
        const existing = await this.productTagRepository.findOne({
          where: { product_id: productId, tag_id: tagId },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Check tag limit
        const currentCount = await this.countByProductId(productId);
        if (currentCount >= 20) {
          skippedCount++;
          continue;
        }

        // Create assignment
        await this.productTagRepository.save({
          product_id: productId,
          tag_id: tagId,
          tag_order: 0,
          created_by: currentUser?.id,
        });

        assignedCount++;
      }
    }

    return { assigned_count: assignedCount, skipped_count: skippedCount };
  }

  async bulkUnassign(
    productIds: number[],
    tagIds: number[],
  ): Promise<{ removed_count: number }> {
    let removedCount = 0;

    for (const productId of productIds) {
      for (const tagId of tagIds) {
        const entity = await this.productTagRepository.findOne({
          where: { product_id: productId, tag_id: tagId },
        });

        if (entity) {
          await this.productTagRepository.remove(entity);
          removedCount++;
        }
      }
    }

    return { removed_count: removedCount };
  }
}
