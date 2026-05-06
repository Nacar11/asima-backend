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
import { ProductsService } from '@/products/products.service';
import { Product } from '@/products/domain/product';
import { FindAllProduct } from '@/products/domain/find-all-product';
import { CreateProductDto } from '@/products/dto/create-product.dto';
import { UpdateProductDto } from '@/products/dto/update-product.dto';
import { QueryProductDto } from '@/products/dto/query-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

/**
 * Controller for product endpoints
 */
@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  /**
   * Create a new product
   */
  @Post()
  @Permissions({ SM01: 'Create' })
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product with the provided details. The seller_id is automatically set to the current user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
    schema: {
      example: {
        id: 1,
        product_name: 'Premium Coffee Beans',
        description:
          'Single-origin Arabica coffee beans from high-altitude farms',
        status: 'Active',
        seller_id: 1,
        created_by: { id: 1, first_name: 'John', last_name: 'Doe' },
        updated_by: { id: 1, first_name: 'John', last_name: 'Doe' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      example: {
        message: 'product_name must be at least 3 characters long',
        error: 'Bad Request',
      },
    },
  })
  async create(
    @Body() input: CreateProductDto,
    @CurrentUser() currentUser: User,
  ): Promise<Product> {
    return this.service.create(input, currentUser);
  }

  /**
   * Get all products
   */
  @Get()
  @Permissions({ SM01: 'View' })
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieves all products with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['Published', 'Draft', 'For Review'],
    description: 'Filter by status (Published/Draft/For Review)',
  })
  @ApiQuery({
    name: 'seller_id',
    required: false,
    type: Number,
    description: 'Filter by seller ID',
  })
  @ApiQuery({
    name: 'listing_type',
    required: false,
    type: String,
    enum: ['product', 'material'],
    description:
      'Filter by listing type (product for marketplace items, material for internal materials)',
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
  @ApiQuery({
    name: 'category_ids',
    required: false,
    type: String,
    example: '1,2,3',
    description:
      'Filter by category IDs as a single value (comma-separated like "1,2,3")',
  })
  @ApiQuery({
    name: 'tag_ids',
    required: false,
    type: String,
    example: '1,2,3',
    description:
      'Filter by tag IDs as a single value (comma-separated like "1,2,3")',
  })
  @ApiQuery({
    name: 'price_range_start',
    required: false,
    type: Number,
    example: 100.0,
    description:
      'Minimum price filter. Products with default price (min variant selling price) >= this value',
  })
  @ApiQuery({
    name: 'price_range_end',
    required: false,
    type: Number,
    example: 500.0,
    description:
      'Maximum price filter. Products with default price (min variant selling price) <= this value',
  })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    enum: [1, 2, 3, 4, 5],
    example: 4,
    description:
      'Minimum rating filter (1-5). Products with average rating >= this value',
  })
  @ApiQuery({
    name: 'featured_section',
    required: false,
    type: String,
    enum: ['featured', 'bestsellers', 'new_arrivals', 'trending'],
    description:
      'Filter by featured section. Only returns products present in product_featured_sections with the given section value.',
  })
  @ApiQuery({
    name: 'active_seller_only',
    required: false,
    type: Boolean,
    example: true,
    description: 'Filter to only include products whose seller is active.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products',
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
  async findAll(
    @Query() query: QueryProductDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllProduct> {
    return this.service.findAll(query, currentUser);
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @Permissions({ SM01: 'View' })
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a specific product by its ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product ID',
  })
  @ApiQuery({
    name: 'exclude_variants',
    required: false,
    type: Boolean,
    example: false,
    description:
      'If true, returns product_variants as an empty array to optimize payload size',
  })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('exclude_variants') excludeVariants?: string,
  ): Promise<Product> {
    const isExcludeVariants =
      excludeVariants === '1' ||
      excludeVariants === 'true' ||
      excludeVariants === 'TRUE';
    return this.service.findById(id, { excludeVariants: isExcludeVariants });
  }

  /**
   * Update a product
   */
  @Put(':id')
  @Permissions({ SM01: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product with the provided details',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateProductDto,
    @CurrentUser() currentUser: User,
  ): Promise<Product> {
    return this.service.update(id, input, currentUser);
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete products',
    description:
      'Soft deletes multiple products. Each product is deleted only if it belongs to the current seller and has no pending orders. Returns which IDs were deleted and which products were blocked with reasons.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete result',
    schema: {
      type: 'object',
      properties: {
        deleted_ids: { type: 'array', items: { type: 'number' } },
        blocked_products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              product_name: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async deleteBulk(
    @Body() input: BulkActionDto,
    @CurrentUser() currentUser: User,
  ): Promise<{
    readonly deleted_ids: number[];
    readonly blocked_products: Array<{
      readonly id: number;
      readonly product_name: string;
      readonly reason: string;
    }>;
  }> {
    return this.service.deleteBulk(input.ids, currentUser);
  }

  /**
   * Delete a product
   */
  @Delete(':id')
  @Permissions({ SM01: 'Delete' })
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft deletes a product (marks as deleted)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description:
      'Delete result. If the product has pending orders, the request still succeeds but returns is_deleted=false with a message.',
    schema: {
      type: 'object',
      properties: {
        is_deleted: { type: 'boolean' },
        message: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<{ readonly is_deleted: boolean; readonly message?: string }> {
    return this.service.delete(id, currentUser);
  }
}
