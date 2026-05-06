import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { AuthGuard } from '@nestjs/passport';
import { FeaturedProductsService } from './featured-products.service';
import { Product } from '@/products/domain/product';
import { FindAllFeaturedProducts } from './domain/find-all-featured-products';
import { FindAllFeaturedProductCards } from './domain/find-all-featured-product-cards';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import {
  QueryFeaturedProductsDto,
  QueryAdminFeaturedDto,
  SetFeaturedProductDto,
  BatchSetFeaturedDto,
  ReorderFeaturedDto,
  RemoveFeaturedDto,
} from './dto';

/**
 * Public controller for featured products
 */
@ApiTags('Featured Products')
@Controller({
  path: 'products/featured',
  version: '1',
})
export class FeaturedProductsPublicController {
  constructor(private readonly service: FeaturedProductsService) {}

  /**
   * Get featured products for public display
   */
  @Get()
  @ApiOperation({
    summary: 'Get featured products',
    description:
      'Retrieves featured products for homescreen display. Returns only published products with available stock. If section is not provided, returns all featured products across all sections.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured products',
    type: FindAllFeaturedProductCards,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid query parameters',
  })
  async findAll(
    @Query() query: QueryFeaturedProductsDto,
  ): Promise<FindAllFeaturedProductCards> {
    return this.service.findAllPublic(query);
  }
}

/**
 * Admin controller for featured products management
 */
@ApiTags('Admin - Featured Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/products/featured',
  version: '1',
})
export class FeaturedProductsAdminController {
  constructor(private readonly service: FeaturedProductsService) {}

  /**
   * Get all featured products for admin management
   */
  @Get()
  @ApiOperation({
    summary: 'Get featured products (admin)',
    description:
      'Retrieves all featured products for admin management. Includes unpublished and out-of-stock products.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured products with admin details',
    type: FindAllFeaturedProducts,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a system admin',
  })
  async findAll(
    @Query() query: QueryAdminFeaturedDto,
  ): Promise<FindAllFeaturedProducts> {
    return this.service.findAllAdmin(query);
  }

  /**
   * Batch update featured status for multiple products
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch update featured status',
    description:
      'Update featured status for multiple products in a single request. Supports up to 50 products.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products updated successfully',
    type: [Product],
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed or max featured limit exceeded',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a system admin',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more products not found',
  })
  async batchSetFeatured(
    @Body() dto: BatchSetFeaturedDto,
    @CurrentUser() admin: User,
  ): Promise<Product[]> {
    return this.service.batchSetFeatured(dto, admin);
  }

  /**
   * Reorder featured products
   */
  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder featured products',
    description:
      'Reorder featured products by providing an array of product IDs in the desired order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products reordered successfully',
    type: [Product],
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed, duplicate IDs, or products not featured',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a system admin',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more products not found',
  })
  async reorder(@Body() dto: ReorderFeaturedDto): Promise<Product[]> {
    return this.service.reorder(dto);
  }
}

/**
 * Admin controller for individual product featured operations
 */
@ApiTags('Admin - Featured Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/products',
  version: '1',
})
export class FeaturedProductsAdminSingleController {
  constructor(private readonly service: FeaturedProductsService) {}

  /**
   * Set product featured status
   */
  @Post(':id/featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set product featured status',
    description:
      'Mark a product as featured in a section. Only published products can be featured. A product can be in multiple sections.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product featured status updated',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - product not published or max featured limit exceeded',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a system admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Product already featured in this section',
  })
  async setFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetFeaturedProductDto,
    @CurrentUser() admin: User,
  ): Promise<Product> {
    return this.service.setFeatured(id, dto, admin);
  }

  /**
   * Remove product from featured section
   */
  @Patch(':id/unfeatured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove product from featured section',
    description:
      'Remove a product from a specific featured section. The section parameter is required.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from featured section',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - product not in specified section',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not a system admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async removeFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemoveFeaturedDto,
  ): Promise<Product> {
    return this.service.removeFeatured(id, dto);
  }
}
