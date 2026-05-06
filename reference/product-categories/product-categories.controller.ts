import {
  Controller,
  Put,
  Get,
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
} from '@nestjs/swagger';
import { ProductCategoriesService } from '@/product-categories/product-categories.service';
import { ProductCategory } from '@/product-categories/domain/product-category';
import { SyncProductCategoriesDto } from '@/product-categories/dto/sync-product-categories.dto';
import { QueryProductCategoriesDto } from '@/product-categories/dto/query-product-categories.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Controller for product-category endpoints
 */
@ApiTags('Product Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'product-categories',
  version: '1',
})
export class ProductCategoriesController {
  constructor(private readonly service: ProductCategoriesService) {}

  /**
   * Sync categories for a product
   */
  @Put(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Product Categories')
  @ApiOperation({
    summary: 'Sync product categories',
    description:
      'Replaces all categories for a product with the provided list. Existing associations are removed and new ones are created.',
  })
  @ApiParam({
    name: 'productId',
    type: Number,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully Updated Categories for this Product.',
    type: [ProductCategory],
    schema: {
      example: [
        {
          id: 1,
          product_id: 1,
          category_id: 1,
          is_primary: true,
          display_order: 0,
          category: {
            id: 1,
            category_name: 'Electronics',
            description: 'Electronic products',
            slug: 'electronics',
            display_order: 0,
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - product does not belong to current user',
  })
  async syncCategories(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() input: SyncProductCategoriesDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductCategory[]> {
    return this.service.syncCategories(productId, input, currentUser);
  }

  /**
   * Get all product categories for the current user's products
   */
  @Get()
  @ApiOperation({
    summary: 'Get all product categories',
    description:
      'Retrieves all product categories for the current user. Optionally filter by product ID and category name.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved product categories.',
    type: [ProductCategory],
    schema: {
      example: [
        {
          id: 1,
          product_id: 1,
          category_id: 1,
          is_primary: true,
          display_order: 0,
          category: {
            id: 1,
            category_name: 'Electronics',
            description: 'Electronic products',
            slug: 'electronics',
            display_order: 0,
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    },
  })
  async getAll(
    @Query() query: QueryProductCategoriesDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductCategory[]> {
    return this.service.findAll(currentUser, query);
  }
}
