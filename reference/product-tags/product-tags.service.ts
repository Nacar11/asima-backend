/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ProductTagRepository } from './persistence/repositories/product-tag.repository';
import { AssignTagsDto } from '@/tags/dto/assign-tags.dto';
import { ProductTag } from './domain/product-tag';
import { TagRepository } from '@/tags/persistence/repositories/tag.repository';
import { User } from '@/users/domain/user';

@Injectable()
export class ProductTagsService {
  constructor(
    private readonly productTagRepository: ProductTagRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async assignTagsToProduct(
    productId: number,
    assignTagsDto: AssignTagsDto,
    currentUser: User,
  ): Promise<{
    message: string;
    product_id: number;
    tags: any[];
  }> {
    // TODO: When products module is implemented, add product ownership validation:
    // const product = await this.productRepository.findById(productId);
    // if (!product) {
    //   throw new NotFoundException('Product not found');
    // }
    // if (!currentUser.system_admin && product.seller_id !== currentUser.id) {
    //   throw new ForbiddenException('You can only assign tags to products you own');
    // }

    const productTags = await this.productTagRepository.assignTagsToProduct(
      productId,
      assignTagsDto.tag_ids,
    );

    // Get tag details
    const tags = await Promise.all(
      assignTagsDto.tag_ids.map((tagId) => this.tagRepository.findById(tagId)),
    );

    return {
      message: 'Tags assigned successfully',
      product_id: productId,
      tags: tags.filter((tag) => tag !== null),
    };
  }

  async removeTagFromProduct(
    productId: number,
    tagId: number,
    currentUser: User,
  ): Promise<{ message: string; product_id: number; tag_id: number }> {
    // TODO: When products module is implemented, add product ownership validation:
    // const product = await this.productRepository.findById(productId);
    // if (!product) {
    //   throw new NotFoundException('Product not found');
    // }
    // if (!currentUser.system_admin && product.seller_id !== currentUser.id) {
    //   throw new ForbiddenException('You can only remove tags from products you own');
    // }

    await this.productTagRepository.removeTagFromProduct(productId, tagId);

    return {
      message: 'Tag removed successfully',
      product_id: productId,
      tag_id: tagId,
    };
  }

  async getProductTags(productId: number): Promise<ProductTag[]> {
    return this.productTagRepository.findByProductId(productId);
  }

  async getProductsByTag(
    tagId: number,
  ): Promise<{ data: ProductTag[]; totalCount: number }> {
    const productTags = await this.productTagRepository.findByTagId(tagId);
    return {
      data: productTags,
      totalCount: productTags.length,
    };
  }

  async bulkAssignTags(
    productIds: number[],
    tagIds: number[],
    currentUser: User,
  ) {
    // TODO: When products module is implemented, add product ownership validation:
    // for (const productId of productIds) {
    //   const product = await this.productRepository.findById(productId);
    //   if (product && !currentUser.system_admin && product.seller_id !== currentUser.id) {
    //     throw new ForbiddenException(
    //       `You can only assign tags to products you own. Product ID ${productId} is not owned by you.`,
    //     );
    //   }
    // }

    const result = await this.productTagRepository.bulkAssign(
      productIds,
      tagIds,
    );

    return {
      message: `Tags assigned to ${productIds.length} products`,
      ...result,
    };
  }

  async bulkUnassignTags(
    productIds: number[],
    tagIds: number[],
    currentUser: User,
  ) {
    // TODO: When products module is implemented, add product ownership validation:
    // for (const productId of productIds) {
    //   const product = await this.productRepository.findById(productId);
    //   if (product && !currentUser.system_admin && product.seller_id !== currentUser.id) {
    //     throw new ForbiddenException(
    //       `You can only remove tags from products you own. Product ID ${productId} is not owned by you.`,
    //     );
    //   }
    // }

    const result = await this.productTagRepository.bulkUnassign(
      productIds,
      tagIds,
    );

    return {
      message: `Tags removed from ${productIds.length} products`,
      ...result,
    };
  }
}
