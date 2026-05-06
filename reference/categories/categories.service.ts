import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseCategoryRepository } from '@/categories/persistence/base-category.repository';
import { Category } from '@/categories/domain/category';
import { FindAllCategory } from '@/categories/domain/find-all-category';
import {
  StructuredCategory,
  StructuredCategoriesResponse,
} from '@/categories/domain/structured-category';
import { CategorySearchCriteria } from '@/categories/domain/category-search-criteria';
import { CreateCategoryDto } from '@/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/categories/dto/update-category.dto';
import { QueryCategoryDto } from '@/categories/dto/query-category.dto';
import { QueryAdminCategoryDto } from '@/categories/dto/query-admin-category.dto';
import { ReorderCategoriesDto } from '@/categories/dto/reorder-categories.dto';
import { QueryPersonalizedCategoryDto } from '@/categories/dto/query-personalized-category.dto';
import { User } from '@/users/domain/user';
import { PAGINATION_DEFAULTS } from '@/utils/constants/pagination.constants';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';
import {
  CATEGORY_DEFAULT_DISPLAY_ORDER,
  CATEGORY_MAX_HIERARCHY_DEPTH,
} from '@/categories/categories.constants';
import { CategoryRepository } from '@/categories/persistence/repositories/category.repository';

/**
 * Service for category business logic
 */
@Injectable()
export class CategoriesService {
  constructor(
    private readonly repository: BaseCategoryRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  private buildSearchCriteriaFromQuery(
    query: QueryCategoryDto,
  ): CategorySearchCriteria {
    const criteria: CategorySearchCriteria = {
      categoryName: query.category_name,
      sellerId: query.seller_id,
      isGlobal: query.isGlobal,
      skip: query.skip ?? PAGINATION_DEFAULTS.skip,
      take: query.take ?? PAGINATION_DEFAULTS.take,
      sortOrder: query.sortBy ?? PAGINATION_DEFAULTS.sortOrder,
      status: query.status as ActiveInactiveStatusEnum | undefined,
      activeSellerOnly: query.active_seller_only,
    };
    return criteria;
  }

  /**
   * Create a new category
   */
  async create(input: CreateCategoryDto, causer: User): Promise<Category> {
    await this.validateSlugUniqueness(input.slug, input.seller_id ?? null);

    const category = Object.assign(new Category(), input, {
      display_order: input.display_order ?? CATEGORY_DEFAULT_DISPLAY_ORDER,
      created_by: causer,
      updated_by: causer,
    });
    return this.repository.create(category);
  }

  /**
   * Get all categories with pagination and filters
   */
  async findAll(query: QueryCategoryDto): Promise<FindAllCategory> {
    const criteria = this.buildSearchCriteriaFromQuery(query);
    return this.repository.findAll(criteria);
  }

  /**
   * Get a category by ID
   */
  async findById(id: number): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  /**
   * Update a category
   */
  async update(
    id: number,
    input: UpdateCategoryDto,
    causer: User,
  ): Promise<Category> {
    const existingCategory = await this.findById(id);

    if (input.slug !== undefined) {
      await this.validateSlugUniqueness(
        input.slug,
        existingCategory.seller_id ?? null,
        id,
      );
    }

    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, input, {
      updated_by: causer.id,
    });
    return this.repository.update(id, partialCategory);
  }

  /**
   * Delete a category
   */
  async delete(id: number, causer: User): Promise<void> {
    await this.findById(id);
    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, {
      deleted_by: causer.id,
    });
    await this.repository.update(id, partialCategory);
    await this.repository.remove(id);
  }

  /**
   * Create a global category (admin only)
   * Ensures seller_id is null and validates media is from admin uploads
   */
  async createGlobalCategory(
    input: CreateCategoryDto,
    admin: User,
  ): Promise<Category> {
    if (!admin.system_admin) {
      throw new ForbiddenException('Only admins can create global categories');
    }

    await this.validateSlugUniqueness(input.slug, null);

    const categoryInput = { ...input, seller_id: null };
    const category = Object.assign(new Category(), categoryInput, {
      display_order: input.display_order ?? CATEGORY_DEFAULT_DISPLAY_ORDER,
      created_by: admin,
      updated_by: admin,
    });
    return this.repository.create(category);
  }

  /**
   * Create a personalized category (seller only)
   * Automatically sets seller_id from current user's seller
   */
  async createPersonalizedCategory(
    input: CreateCategoryDto,
    seller: User,
  ): Promise<Category> {
    if (!seller.seller_id) {
      throw new ForbiddenException(
        'Only sellers can create personalized categories',
      );
    }

    await this.validateSlugUniqueness(input.slug, seller.seller_id);

    const categoryInput = { ...input, seller_id: seller.seller_id };
    const category = Object.assign(new Category(), categoryInput, {
      display_order: input.display_order ?? CATEGORY_DEFAULT_DISPLAY_ORDER,
      created_by: seller,
      updated_by: seller,
    });
    return this.repository.create(category);
  }

  /**
   * Get all global categories for admin (only seller_id = null)
   * Returns parent categories sorted by display_order, each with nested child_categories.
   * Each category gets a computed display_order_label (e.g., "1", "1.1", "1.2").
   * Only parent categories are paginated; children are nested inside their parent.
   */
  async findAllAdmin(query: QueryAdminCategoryDto): Promise<{
    data: Record<string, unknown>[];
    totalCount: number;
    skip: number;
    take: number;
    structure: 'tree' | 'flat';
  }> {
    const skip = query.skip ?? PAGINATION_DEFAULTS.skip;
    const take = query.take ?? PAGINATION_DEFAULTS.take;
    const criteria: CategorySearchCriteria = {
      categoryName: query.category_name,
      sellerId: undefined,
      isGlobal: true,
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
      sortOrder: query.sortBy ?? PAGINATION_DEFAULTS.sortOrder,
      status: query.status,
      activeSellerOnly: query.active_seller_only,
    };
    const result = await this.repository.findAll(criteria);
    const parentCategories = this.buildNestedCategoryList(result.data);
    const separateChild = query.separate_child ?? false;
    const transformedData = separateChild
      ? this.buildFlatCategoryList(parentCategories)
      : parentCategories;
    const paginatedData = transformedData.slice(skip, skip + take);
    return {
      data: paginatedData,
      totalCount: transformedData.length,
      skip,
      take,
      structure: separateChild ? 'flat' : 'tree',
    };
  }

  /**
   * Build a list of parent categories with nested child_categories.
   * Parents sorted by display_order; children sorted by display_order within each parent.
   * Computes display_order_label: parent gets "N", children get "N.M".
   */
  private categoryToPlain(cat: Category): Record<string, unknown> {
    return {
      id: cat.id,
      category_name: cat.category_name,
      description: cat.description ?? null,
      slug: cat.slug,
      display_order: cat.display_order,
      display_order_label: cat.display_order_label ?? null,
      parent_category_id: cat.parent_category_id ?? null,
      parent_category_name: cat.parent_category_name ?? null,
      seller_id: cat.seller_id ?? null,
      media_id: cat.media_id ?? null,
      status: cat.status,
      product_count: cat.product_count ?? 0,
      sub_category_count: cat.sub_category_count ?? 0,
      child_categories: (cat.child_categories ?? []).map((c) =>
        this.categoryToPlain(c),
      ),
      category_image: cat.category_image ?? null,
      seller: cat.seller ?? null,
      created_by: cat.created_by ?? null,
      created_at: cat.created_at,
      updated_by: cat.updated_by ?? null,
      updated_at: cat.updated_at,
      parent_category: cat.parent_category_id
        ? {
            id: cat.parent_category_id,
            category_name: cat.parent_category_name ?? null,
          }
        : null,
    };
  }

  private buildNestedCategoryList(
    categories: Category[],
  ): Record<string, unknown>[] {
    const parents = categories
      .filter(
        (cat) =>
          cat.parent_category_id === null ||
          cat.parent_category_id === undefined,
      )
      .sort((a, b) => a.display_order - b.display_order);
    const childrenByParentId = new Map<number, Category[]>();
    for (const cat of categories) {
      const parentId = cat.parent_category_id;
      if (parentId !== null && parentId !== undefined) {
        const siblings = childrenByParentId.get(parentId) ?? [];
        siblings.push(cat);
        childrenByParentId.set(parentId, siblings);
      }
    }
    for (const siblings of childrenByParentId.values()) {
      siblings.sort((a, b) => a.display_order - b.display_order);
    }
    return parents.map((parent, parentIndex) => {
      const parentLabel = `${parentIndex + 1}`;
      parent.display_order_label = parentLabel;
      const children = childrenByParentId.get(parent.id) ?? [];
      for (const [childIndex, child] of children.entries()) {
        child.display_order_label = `${parentLabel}.${childIndex + 1}`;
      }
      parent.child_categories = children;
      return this.categoryToPlain(parent);
    });
  }

  private buildFlatCategoryList(
    nestedCategories: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    const flatCategories: Record<string, unknown>[] = [];
    const appendCategory = (category: Record<string, unknown>): void => {
      const childCategories = (category.child_categories ?? []) as Record<
        string,
        unknown
      >[];
      const currentCategory: Record<string, unknown> = {
        ...category,
        child_categories: [],
      };
      flatCategories.push(currentCategory);
      childCategories.forEach((childCategory: Record<string, unknown>) => {
        appendCategory(childCategory);
      });
    };
    nestedCategories.forEach((category: Record<string, unknown>) => {
      appendCategory(category);
    });
    return flatCategories;
  }

  /**
   * Batch reorder categories by updating their display_order values
   */
  async reorderCategories(
    input: ReorderCategoriesDto,
    admin: User,
  ): Promise<{ message: string }> {
    if (!admin.system_admin) {
      throw new ForbiddenException('Only admins can reorder global categories');
    }
    await this.categoryRepository.bulkUpdateDisplayOrder(input.categories);
    return { message: `${input.categories.length} categories reordered` };
  }

  /**
   * Get categories for user/seller with role-based filtering
   * - Admin: sees all
   * - Seller: sees own personalized + global
   * - Regular user: sees global only
   */
  async findAllForUser(
    query: QueryCategoryDto,
    currentUser: User,
  ): Promise<FindAllCategory> {
    const criteria = this.buildSearchCriteriaFromQuery(query);
    if (currentUser.system_admin) {
      return this.repository.findAll(criteria);
    }
    if (currentUser.seller_id) {
      criteria.sellerId = currentUser.seller_id;
      criteria.isGlobal = true;
      return this.repository.findAll(criteria);
    }
    criteria.sellerId = undefined;
    criteria.isGlobal = true;
    return this.repository.findAll(criteria);
  }

  /**
   * Get personalized categories for the current seller
   * Uses currentUser.seller_id from logged-in user's seller relationship
   * Used for:
   * - Categories page (include_global = false): only seller's own categories
   * - Product form/filter (include_global = true): seller's categories + global
   */
  async findPersonalizedCategories(
    query: QueryPersonalizedCategoryDto,
    currentUser: User,
  ): Promise<FindAllCategory> {
    if (!currentUser.seller_id) {
      throw new ForbiddenException(
        'Only sellers can access personalized categories',
      );
    }
    const criteria: CategorySearchCriteria = {
      categoryName: query.category_name,
      sellerId: currentUser.seller_id,
      includeGlobal: query.include_global ?? false,
      skip: query.skip ?? PAGINATION_DEFAULTS.skip,
      take: query.take ?? PAGINATION_DEFAULTS.take,
      status: query.status,
    };
    return this.repository.findAll(criteria);
  }

  /**
   * Update a global category (admin only)
   */
  async updateGlobalCategory(
    id: number,
    input: UpdateCategoryDto,
    admin: User,
  ): Promise<Category> {
    if (!admin.system_admin) {
      throw new ForbiddenException('Only admins can update global categories');
    }
    const category = await this.findById(id);
    if (category.seller_id !== null) {
      throw new BadRequestException(
        'Cannot update seller-specific category via admin endpoint',
      );
    }

    // Validate slug uniqueness if it's being updated
    if (input.slug !== undefined) {
      await this.validateSlugUniqueness(input.slug, null, id);
    }

    // Validate parent category if it's being updated
    if (input.parent_category_id !== undefined) {
      await this.validateParentCategory(input.parent_category_id, id);
    }

    const updateInput = { ...input };
    delete updateInput.seller_id;
    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, updateInput, {
      updated_by: admin.id,
    });
    return this.repository.update(id, partialCategory);
  }

  /**
   * Update a personalized category (seller only, own categories)
   */
  async updatePersonalizedCategory(
    id: number,
    input: UpdateCategoryDto,
    seller: User,
  ): Promise<Category> {
    if (!seller.seller_id) {
      throw new ForbiddenException(
        'Only sellers can update personalized categories',
      );
    }
    const category = await this.findById(id);
    if (category.seller_id !== seller.seller_id) {
      throw new ForbiddenException(
        'You can only update your own personalized categories',
      );
    }

    // Validate slug uniqueness if it's being updated
    if (input.slug !== undefined) {
      await this.validateSlugUniqueness(input.slug, seller.seller_id, id);
    }

    // Validate parent category if it's being updated
    if (input.parent_category_id !== undefined) {
      await this.validateParentCategory(input.parent_category_id, id);
      await this.validateParentOwnershipForSeller(
        input.parent_category_id,
        seller.seller_id,
      );
    }

    const updateInput = { ...input };
    delete updateInput.seller_id;
    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, updateInput, {
      updated_by: seller.id,
    });
    return this.repository.update(id, partialCategory);
  }

  /**
   * Soft-delete a global category (admin only)
   * Checks for dependencies before deletion
   */
  async softDeleteGlobalCategory(id: number, admin: User): Promise<void> {
    if (!admin.system_admin) {
      throw new ForbiddenException('Only admins can delete global categories');
    }
    const category = await this.findById(id);
    if (category.seller_id !== null) {
      throw new BadRequestException(
        'Cannot delete seller-specific category via admin endpoint',
      );
    }

    // Check for dependencies before deletion
    const dependencies = await this.checkCategoryDependencies(id);
    if (dependencies.productCount > 0 || dependencies.subCategoryCount > 0) {
      const messages: string[] = [];
      if (dependencies.productCount > 0) {
        messages.push(`${dependencies.productCount} product(s)`);
      }
      if (dependencies.subCategoryCount > 0) {
        messages.push(`${dependencies.subCategoryCount} sub-category(ies)`);
      }
      throw new ConflictException(
        `Cannot delete category: it has ${messages.join(' and ')} linked to it`,
      );
    }

    const partialCategory: Partial<Category> = new Category();
    Object.assign(partialCategory, {
      deleted_by: admin.id,
    });
    await this.repository.update(id, partialCategory);
    await this.repository.remove(id);
  }

  /**
   * Hard-delete a personalized category (seller only, own categories)
   * Checks for dependencies before deletion
   */
  async hardDeletePersonalizedCategory(
    id: number,
    seller: User,
  ): Promise<void> {
    if (!seller.seller_id) {
      throw new ForbiddenException(
        'Only sellers can delete personalized categories',
      );
    }
    const category = await this.findById(id);
    if (category.seller_id !== seller.seller_id) {
      throw new ForbiddenException(
        'You can only delete your own personalized categories',
      );
    }
    const dependencies = await this.checkCategoryDependencies(id);
    if (dependencies.productCount > 0 || dependencies.subCategoryCount > 0) {
      const messages: string[] = [];
      if (dependencies.productCount > 0) {
        messages.push(`${dependencies.productCount} product(s)`);
      }
      if (dependencies.subCategoryCount > 0) {
        messages.push(`${dependencies.subCategoryCount} sub-category(ies)`);
      }
      throw new ConflictException(
        `Cannot delete category: it has ${messages.join(' and ')} linked to it`,
      );
    }
    await this.categoryRepository.hardDelete(id);
  }

  /**
   * Check category dependencies for hard-delete validation
   */
  checkCategoryDependencies(categoryId: number): Promise<{
    productCount: number;
    subCategoryCount: number;
  }> {
    return this.categoryRepository.countDependencies(categoryId);
  }

  /**
   * Bulk delete personalized categories (seller only)
   * Skips categories with dependencies or ownership issues
   */
  async bulkDeletePersonalizedCategories(
    ids: number[],
    seller: User,
  ): Promise<{
    message: string;
    deleted_count: number;
    failed: { id: number; reason: string }[];
  }> {
    if (!seller.seller_id) {
      throw new ForbiddenException(
        'Only sellers can delete personalized categories',
      );
    }

    const failed: { id: number; reason: string }[] = [];
    const toDelete: number[] = [];

    for (const id of ids) {
      try {
        const category = await this.findById(id);

        if (category.seller_id !== seller.seller_id) {
          failed.push({ id, reason: 'Not your category' });
          continue;
        }

        const dependencies = await this.checkCategoryDependencies(id);
        if (
          dependencies.productCount > 0 ||
          dependencies.subCategoryCount > 0
        ) {
          const reasons: string[] = [];
          if (dependencies.productCount > 0) {
            reasons.push(`${dependencies.productCount} product(s)`);
          }
          if (dependencies.subCategoryCount > 0) {
            reasons.push(`${dependencies.subCategoryCount} sub-category(ies)`);
          }
          failed.push({ id, reason: `Has ${reasons.join(' and ')}` });
          continue;
        }

        toDelete.push(id);
      } catch (error) {
        if (error instanceof NotFoundException) {
          failed.push({ id, reason: 'Category not found' });
        } else {
          throw error;
        }
      }
    }

    let deletedCount = 0;
    if (toDelete.length > 0) {
      deletedCount = await this.categoryRepository.bulkHardDelete(toDelete);
    }

    return {
      message: `${deletedCount} categories deleted successfully`,
      deleted_count: deletedCount,
      failed,
    };
  }

  /**
   * Get structured global categories in hierarchical format
   * Returns parent categories first with nested sub-categories (up to 3 levels)
   */
  async getStructuredCategories(): Promise<StructuredCategoriesResponse> {
    const globalCategories = await this.repository.findGlobalCategories();

    // Helper function to convert Category to StructuredCategory
    const convertToStructured = (category: Category): StructuredCategory => {
      const structuredCategory: StructuredCategory = {
        id: category.id,
        category_name: category.category_name,
        description: category.description,
        slug: category.slug,
        display_order: category.display_order,
        parent_category_id: category.parent_category_id,
        status: category.status,
        category_image: category.category_image ?? null,
      };
      return structuredCategory;
    };

    // Helper function to build hierarchy recursively (max 3 levels)
    const buildHierarchy = (
      categoryId: number | null,
      level: number = 0,
    ): StructuredCategory[] => {
      if (level >= CATEGORY_MAX_HIERARCHY_DEPTH) return [];

      const children = globalCategories.filter(
        (cat) => cat.parent_category_id === categoryId,
      );

      return children
        .map((child) => {
          const structuredChild = convertToStructured(child);
          structuredChild.sub_categories = buildHierarchy(child.id, level + 1);
          return structuredChild;
        })
        .sort((a, b) => a.display_order - b.display_order);
    };

    // Start with root categories (parent_category_id is null)
    return buildHierarchy(null);
  }

  /**
   * Validate parent category for updates
   * Checks if parent exists and prevents circular references
   */
  private async validateParentCategory(
    parentCategoryId: number | null,
    categoryId: number,
  ): Promise<void> {
    if (parentCategoryId === null) {
      // Setting to root level is always allowed
      return;
    }

    // Check if parent category exists
    const parentCategory = await this.findById(parentCategoryId);
    if (!parentCategory) {
      throw new BadRequestException(
        `Parent category with id ${parentCategoryId} does not exist`,
      );
    }

    // Prevent self-reference
    if (parentCategoryId === categoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Check for circular references
    await this.checkCircularReference(categoryId, parentCategoryId);
  }

  /**
   * Check for circular references in category hierarchy
   */
  private async checkCircularReference(
    categoryId: number,
    potentialParentId: number,
  ): Promise<void> {
    const visited = new Set<number>();
    let currentId: number | null = potentialParentId;

    while (currentId !== null) {
      if (visited.has(currentId)) {
        throw new BadRequestException(
          'Circular reference detected in category hierarchy',
        );
      }

      if (currentId === categoryId) {
        throw new BadRequestException(
          'Circular reference detected in category hierarchy',
        );
      }

      visited.add(currentId);

      const currentCategory = await this.findById(currentId);
      if (!currentCategory) {
        break; // Parent doesn't exist, but this should be caught earlier
      }

      currentId = currentCategory.parent_category_id ?? null;
    }
  }

  /**
   * Validate parent category ownership for personalized categories
   * Ensures sellers can only set parents they own or global categories
   */
  private async validateParentOwnershipForSeller(
    parentCategoryId: number | null,
    sellerId: number,
  ): Promise<void> {
    if (parentCategoryId === null) {
      // Root level is allowed
      return;
    }

    const parentCategory = await this.findById(parentCategoryId);
    if (!parentCategory) {
      // This should be caught by validateParentCategory, but check anyway
      throw new BadRequestException(
        `Parent category with id ${parentCategoryId} does not exist`,
      );
    }

    // Allow global categories (seller_id = null) or categories owned by the same seller
    if (
      parentCategory.seller_id !== null &&
      parentCategory.seller_id !== sellerId
    ) {
      throw new ForbiddenException(
        'You can only set parent categories that you own or global categories',
      );
    }
  }

  /**
   * Validate that slug is unique within the same scope (global or seller-specific)
   * Throws ConflictException if duplicate slug is found
   */
  private async validateSlugUniqueness(
    slug: string,
    sellerId: number | null,
    excludeId?: number,
  ): Promise<void> {
    const existingCategory = await this.categoryRepository.findBySlug(
      slug,
      sellerId,
      excludeId,
    );

    if (existingCategory) {
      throw new ConflictException(
        `A category with slug "${slug}" already exists`,
      );
    }
  }
}
