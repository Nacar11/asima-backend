import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from '@/categories/categories.service';
import { Category } from '@/categories/domain/category';
import { FindAllCategory } from '@/categories/domain/find-all-category';
import {
  StructuredCategory,
  StructuredCategoriesResponse,
} from '@/categories/domain/structured-category';
import { CreateCategoryDto } from '@/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/categories/dto/update-category.dto';
import { QueryCategoryDto } from '@/categories/dto/query-category.dto';
import { QueryPersonalizedCategoryDto } from '@/categories/dto/query-personalized-category.dto';
import { BulkDeleteCategoriesDto } from '@/categories/dto/bulk-delete-categories.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Controller for category endpoints (user/seller operations)
 * Sellers can create/update/delete their own personalized categories
 * All authenticated users can read categories (with role-based filtering)
 */
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  /**
   * Create a personalized category (seller only)
   */
  @Post()
  @Permissions({ SM02: 'Create' })
  @ApiOperation({
    summary: 'Create a personalized category',
    description:
      'Creates a new personalized category for the current seller. seller_id is automatically set from the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Personalized category created successfully',
    type: Category,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a seller',
  })
  create(
    @Body() input: CreateCategoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<Category> {
    return this.service.createPersonalizedCategory(input, currentUser);
  }

  /**
   * Get categories
   * Any authenticated user can retrieve categories.
   * If seller_id is provided, returns only categories for that seller.
   */
  @Get()
  @Permissions({ SM02: 'View' })
  @ApiOperation({
    summary: 'Get categories',
    description:
      'Retrieves categories. By default returns all categories (global and seller-specific). If seller_id is provided, returns only categories for that seller.',
  })
  @ApiQuery({
    name: 'category_name',
    required: false,
    type: String,
    description: 'Filter by category name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort by created_at (ASC or DESC, default: DESC)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  findAll(@Query() query: QueryCategoryDto): Promise<FindAllCategory> {
    return this.service.findAll(query);
  }

  /**
   * Get personalized categories for the current seller
   * - include_global=false: only seller's own categories (for categories page)
   * - include_global=true: seller's categories + global (for product form/filter)
   */
  @Get('personalized')
  @Permissions({ SM02: 'View' })
  @ApiOperation({
    summary: 'Get personalized categories for current seller',
    description:
      'Retrieves categories for the current seller. Use include_global=true to also include global categories (for product form/filter).',
  })
  @ApiQuery({
    name: 'category_name',
    required: false,
    type: String,
    description: 'Filter by category name',
  })
  @ApiQuery({
    name: 'include_global',
    required: false,
    type: Boolean,
    description:
      'Include global categories along with seller categories. Default: false',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Inactive'],
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of personalized categories',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a seller',
  })
  findPersonalized(
    @Query() query: QueryPersonalizedCategoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllCategory> {
    return this.service.findPersonalizedCategories(query, currentUser);
  }

  /**
   * Get structured global categories (for mobile app)
   */
  @Get('structured')
  @Permissions({ SM02: 'View' })
  @ApiOperation({
    summary: 'Get structured global categories',
    description:
      'Retrieves global categories in hierarchical format with parent categories first and nested sub-categories up to 3 levels deep. Used primarily for mobile app navigation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured categories hierarchy',
    type: StructuredCategory,
    isArray: true,
  })
  getStructuredCategories(): Promise<StructuredCategoriesResponse> {
    return this.service.getStructuredCategories();
  }

  /**
   * Get category by ID
   */
  @Get(':id')
  @Permissions({ SM02: 'View' })
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieves a specific category by ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  findById(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.service.findById(id);
  }

  /**
   * Update a personalized category (seller only, own categories)
   */
  @Put(':id')
  @Permissions({ SM02: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a personalized category',
    description:
      'Updates an existing personalized category. Sellers can only update their own categories.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Personalized category updated successfully',
    type: Category,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your category or not a seller',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateCategoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<Category> {
    return this.service.updatePersonalizedCategory(id, input, currentUser);
  }

  /**
   * Bulk delete personalized categories (seller only)
   */
  @Post('bulk-delete')
  @Permissions({ SM02: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete personalized categories',
    description:
      'Deletes multiple personalized categories. Skips categories with dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete result',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deleted_count: { type: 'number' },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  bulkDelete(
    @Body() body: BulkDeleteCategoriesDto,
    @CurrentUser() currentUser: User,
  ): Promise<{
    message: string;
    deleted_count: number;
    failed: { id: number; reason: string }[];
  }> {
    return this.service.bulkDeletePersonalizedCategories(body.ids, currentUser);
  }

  /**
   * Hard-delete a personalized category (seller only, own categories)
   * Checks for dependencies before deletion
   */
  @Delete(':id')
  @Permissions({ SM02: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a personalized category',
    description:
      'Hard deletes a personalized category. Sellers can only delete their own categories. Deletion will fail if the category has products or sub-categories linked to it.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Personalized category deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your category or not a seller',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - category has dependencies (products/sub-categories)',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.hardDeletePersonalizedCategory(id, currentUser);
  }
}
