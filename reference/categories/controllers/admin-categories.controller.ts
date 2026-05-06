import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
// FindAllCategory not used here - findAllAdmin returns plain objects to preserve child_categories
import { CreateCategoryDto } from '@/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/categories/dto/update-category.dto';
import { QueryAdminCategoryDto } from '@/categories/dto/query-admin-category.dto';
import { ReorderCategoriesDto } from '@/categories/dto/reorder-categories.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Admin controller for managing global categories
 * Only admins can create/update/delete global categories (seller_id = null)
 */
@ApiTags('Admin - Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'admin/categories',
  version: '1',
})
export class AdminCategoriesController {
  constructor(private readonly service: CategoriesService) {}

  /**
   * Create a new global category
   */
  @Post()
  @Permissions({ AC01: 'Create' })
  @ApiOperation({
    summary: 'Create a global category',
    description:
      'Creates a new global category (seller_id = null). Only admins can create global categories. Media must be from admin uploads (media/admins/*).',
  })
  @ApiResponse({
    status: 201,
    description: 'Global category created successfully',
    type: Category,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid media',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not an admin',
  })
  create(
    @Body() input: CreateCategoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<Category> {
    return this.service.createGlobalCategory(input, currentUser);
  }

  /**
   * Get all categories (admin view - sees everything)
   */
  @Get()
  @Permissions({ AC01: 'View' })
  @ApiOperation({
    summary: 'Get global categories (admin view)',
    description:
      'Retrieves global categories only. Response can be tree (default) or flat via separate_child query.',
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
    name: 'separate_child',
    required: false,
    type: Boolean,
    description:
      'When true, returns a flat list where parent and child categories are independent entries. Default false (tree).',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiQuery({
    name: 'active_seller_only',
    required: false,
    type: Boolean,
    example: true,
    description:
      'Filter to only include categories whose seller is active. Global categories (seller_id = NULL) are always included.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
        structure: { type: 'string', enum: ['tree', 'flat'] },
      },
    },
  })
  findAll(@Query() query: QueryAdminCategoryDto): Promise<{
    data: Record<string, unknown>[];
    totalCount: number;
    skip: number;
    take: number;
    structure: 'tree' | 'flat';
  }> {
    return this.service.findAllAdmin(query);
  }

  /**
   * Batch reorder categories by updating display_order values
   */
  @Patch('reorder')
  @Permissions({ AC01: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder global categories',
    description:
      'Batch update display_order for multiple global categories. Used for drag-and-drop reordering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories reordered successfully',
  })
  reorder(
    @Body() input: ReorderCategoriesDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ message: string }> {
    return this.service.reorderCategories(input, currentUser);
  }

  /**
   * Get category by ID
   */
  @Get(':id')
  @Permissions({ AC01: 'View' })
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Retrieves a specific category by ID (admin can view any category)',
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
   * Update a global category
   */
  @Put(':id')
  @Permissions({ AC01: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a global category',
    description:
      'Updates an existing global category. Only global categories (seller_id = null) can be updated via this endpoint.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Global category updated successfully',
    type: Category,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot update non-global category via admin endpoint',
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
    return this.service.updateGlobalCategory(id, input, currentUser);
  }

  /**
   * Soft-delete a global category
   */
  @Delete(':id')
  @Permissions({ AC01: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a global category',
    description:
      'Soft deletes a global category. Only global categories (seller_id = null) can be deleted via this endpoint.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Global category deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot delete non-global category via admin endpoint',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.softDeleteGlobalCategory(id, currentUser);
  }
}
