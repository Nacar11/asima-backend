import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TagRepository } from './persistence/repositories/tag.repository';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FilterTagDto } from './dto/filter-tag.dto';
import { Tag } from './domain/tag';
import { User } from '@/users/domain/user';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';

@Injectable()
export class TagsService {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * Generate a unique slug from tag name (WordPress-style) for a specific seller
   */
  async generateSlug(name: string, sellerId: number): Promise<string> {
    // Step 1: Sanitize name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Step 2: Check uniqueness within seller's tags and append number if needed
    let counter = 2;
    let finalSlug = slug;

    while (await this.tagRepository.findBySlug(finalSlug, sellerId)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  /**
   * Create a new tag for a specific seller
   */
  async create(
    createTagDto: CreateTagDto,
    currentUser: User,
    sellerId: number,
  ): Promise<Tag> {
    // Check for duplicate name within seller's tags (case-insensitive)
    const existingTag = await this.tagRepository.findByName(
      createTagDto.name,
      sellerId,
    );
    if (existingTag) {
      throw new ConflictException(
        'You already have a tag with this name. Please choose a different name.',
      );
    }

    // Use provided slug or generate unique slug for this seller
    let slug: string;
    if (createTagDto.slug) {
      // Validate uniqueness of provided slug
      const existingSlugTag = await this.tagRepository.findBySlug(
        createTagDto.slug,
        sellerId,
      );
      if (existingSlugTag) {
        throw new ConflictException(
          'You already have a tag with this slug. Please choose a different slug.',
        );
      }
      slug = createTagDto.slug;
    } else {
      // Generate unique slug from name
      slug = await this.generateSlug(createTagDto.name, sellerId);
    }

    // Create tag
    return this.tagRepository.create(
      {
        name: createTagDto.name,
        slug,
        description: createTagDto.description,
        status: createTagDto.status,
      },
      currentUser,
      sellerId,
    );
  }

  /**
   * Find all tags with DevExtreme filtering and pagination
   * Returns DevExtreme format: { data, totalCount }
   */
  findByMany(queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.tagRepository.findByMany(queryParamsParsed);
  }

  /**
   * Find tags for a specific seller with DevExtreme filtering and pagination
   * Returns DevExtreme format: { data, totalCount }
   */
  findBySeller(sellerId: number, queryParams: GetQueryParams) {
    const queryParamsParsed = {
      ...queryParams,
      filter: queryParams?.filter,
    };
    return this.tagRepository.findBySeller(sellerId, queryParamsParsed);
  }

  /**
   * Find all tags with filters and pagination (legacy method)
   * Returns DevExtreme format: { data, totalCount }
   */
  async findAll(
    filters: FilterTagDto,
  ): Promise<{ data: Tag[]; totalCount: number }> {
    const { data, totalCount } = await this.tagRepository.findAll(filters);
    return {
      data,
      totalCount,
    };
  }

  /**
   * Find tag by ID
   */
  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  /**
   * Find tag by slug and seller ID
   */
  async findOneBySlug(sellerId: number, slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findBySlugAndSeller(slug, sellerId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  /**
   * Update a tag
   */
  async update(
    id: number,
    updateTagDto: UpdateTagDto,
    currentUser: User,
  ): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Authorization check: only tag owner (seller) or system admin can update
    if (!currentUser.system_admin && tag.seller_id !== currentUser.seller_id) {
      throw new ForbiddenException('You can only update tags you own');
    }

    // Check for duplicate name if name is being updated
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.tagRepository.findByName(
        updateTagDto.name,
      );
      if (existingTag) {
        throw new ConflictException(
          'Tag with this name already exists. Please choose a different name.',
        );
      }
    }

    // Handle slug update logic
    let slug = tag.slug;
    if (updateTagDto.slug !== undefined) {
      // Explicit slug provided (could be null or a value)
      if (updateTagDto.slug) {
        // Validate uniqueness of provided slug
        const existingSlugTag = await this.tagRepository.findBySlug(
          updateTagDto.slug,
          tag.seller_id!,
        );
        if (existingSlugTag && existingSlugTag.id !== tag.id) {
          throw new ConflictException(
            'Tag with this slug already exists. Please choose a different slug.',
          );
        }
        slug = updateTagDto.slug;
      } else if (updateTagDto.name) {
        // Slug is null but name is provided, generate from new name
        slug = await this.generateSlug(updateTagDto.name, tag.seller_id!);
      } else {
        // Slug is null and no new name, generate from existing name
        slug = await this.generateSlug(tag.name, tag.seller_id!);
      }
    } else if (updateTagDto.name && updateTagDto.name !== tag.name) {
      // No slug provided but name changed, generate new slug from name
      slug = await this.generateSlug(updateTagDto.name, tag.seller_id!);
    }

    return this.tagRepository.update(
      id,
      {
        ...updateTagDto,
        slug,
      },
      currentUser,
    );
  }

  /**
   * Update a tag by slug and seller ID
   */
  async updateBySlug(
    sellerId: number,
    slug: string,
    updateTagDto: UpdateTagDto,
    currentUser: User,
  ): Promise<Tag> {
    const tag = await this.tagRepository.findBySlugAndSeller(slug, sellerId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Authorization check: only tag owner (seller) or system admin can update
    if (!currentUser.system_admin && tag.seller_id !== currentUser.seller_id) {
      throw new ForbiddenException('You can only update tags you own');
    }

    // Check for duplicate name if name is being updated
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.tagRepository.findByName(
        updateTagDto.name,
        sellerId,
      );
      if (existingTag && existingTag.id !== tag.id) {
        throw new ConflictException(
          'Tag with this name already exists. Please choose a different name.',
        );
      }
    }

    // Handle slug update logic
    let newSlug = tag.slug;
    if (updateTagDto.slug !== undefined) {
      // Explicit slug provided (could be null or a value)
      if (updateTagDto.slug) {
        // Validate uniqueness of provided slug
        const existingSlugTag = await this.tagRepository.findBySlug(
          updateTagDto.slug,
          sellerId,
        );
        if (existingSlugTag && existingSlugTag.id !== tag.id) {
          throw new ConflictException(
            'Tag with this slug already exists. Please choose a different slug.',
          );
        }
        newSlug = updateTagDto.slug;
      } else if (updateTagDto.name) {
        // Slug is null but name is provided, generate from new name
        newSlug = await this.generateSlug(updateTagDto.name, sellerId);
      } else {
        // Slug is null and no new name, generate from existing name
        newSlug = await this.generateSlug(tag.name, sellerId);
      }
    } else if (updateTagDto.name && updateTagDto.name !== tag.name) {
      // No slug provided but name changed, generate new slug from name
      newSlug = await this.generateSlug(updateTagDto.name, sellerId);
    }

    return this.tagRepository.update(
      tag.id,
      {
        ...updateTagDto,
        slug: newSlug,
      },
      currentUser,
    );
  }

  /**
   * Soft delete a tag
   * Blocks deletion if tag has products linked to it
   */
  async remove(
    id: number,
    currentUser: User,
  ): Promise<{ message: string; affected_products: number }> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Authorization check: only tag owner (seller) or system admin can delete
    if (!currentUser.system_admin && tag.seller_id !== currentUser.seller_id) {
      throw new ForbiddenException('You can only delete tags you own');
    }

    const affectedProducts = await this.tagRepository.countProductsByTagId(id);

    // Block deletion if tag has products linked
    if (affectedProducts > 0) {
      throw new ConflictException(
        `Cannot delete tag: it has ${affectedProducts} product(s) linked to it`,
      );
    }

    // Soft delete the tag
    await this.tagRepository.softDelete(id, currentUser);

    return {
      message: 'Tag deleted successfully',
      affected_products: affectedProducts,
    };
  }

  /**
   * Soft delete a tag by slug and seller ID
   * Blocks deletion if tag has products linked to it
   */
  async removeBySlug(
    sellerId: number,
    slug: string,
    currentUser: User,
  ): Promise<{ message: string; affected_products: number }> {
    const tag = await this.tagRepository.findBySlugAndSeller(slug, sellerId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Authorization check: only tag owner (seller) or system admin can delete
    if (!currentUser.system_admin && tag.seller_id !== currentUser.seller_id) {
      throw new ForbiddenException('You can only delete tags you own');
    }

    const affectedProducts = await this.tagRepository.countProductsByTagId(
      tag.id,
    );

    // Block deletion if tag has products linked
    if (affectedProducts > 0) {
      throw new ConflictException(
        `Cannot delete tag: it has ${affectedProducts} product(s) linked to it`,
      );
    }

    // Soft delete the tag
    await this.tagRepository.softDelete(tag.id, currentUser);

    return {
      message: 'Tag deleted successfully',
      affected_products: affectedProducts,
    };
  }

  /**
   * Bulk delete tags
   * Blocks deletion if any tag has products linked to it
   */
  async bulkDelete(
    ids: number[],
    currentUser: User,
  ): Promise<{
    message: string;
    deleted_count: number;
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No tag IDs provided');
    }

    if (ids.length > 100) {
      throw new BadRequestException(
        'Maximum 100 tags can be deleted in bulk operation',
      );
    }

    // Validate ownership and check for product dependencies
    const tagsWithProducts: { id: number; name: string; count: number }[] = [];

    for (const id of ids) {
      const tag = await this.tagRepository.findById(id);
      if (tag) {
        // Authorization check: only tag owner (seller) or system admin can delete
        if (
          !currentUser.system_admin &&
          tag.seller_id !== currentUser.seller_id
        ) {
          throw new ForbiddenException(
            `You can only delete tags you own. Tag ID ${id} is not owned by you.`,
          );
        }

        const productCount = await this.tagRepository.countProductsByTagId(id);
        if (productCount > 0) {
          tagsWithProducts.push({ id, name: tag.name, count: productCount });
        }
      }
    }

    // Block deletion if any tag has products linked
    if (tagsWithProducts.length > 0) {
      const tagNames = tagsWithProducts.map((t) => t.name).join(', ');
      throw new ConflictException(
        `Cannot delete tags with products linked. Tags with products: ${tagNames}`,
      );
    }

    const deletedCount = await this.tagRepository.bulkDelete(ids, currentUser);

    return {
      message: `${deletedCount} tags deleted successfully`,
      deleted_count: deletedCount,
    };
  }
}
