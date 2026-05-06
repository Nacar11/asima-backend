import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariant } from './domain/product-variant';
import { FindAllProductVariant } from './domain/find-all-product-variant';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { SyncProductVariantsDto } from './dto/sync-product-variants.dto';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';

@ApiTags('Product Variants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'product-variants',
  version: '1',
})
export class ProductVariantsController {
  constructor(private readonly service: ProductVariantsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product variants with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variants retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductVariant' },
        },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  @ApiQuery({ name: 'sku', required: false, description: 'Filter by SKU' })
  @ApiQuery({
    name: 'variant_name',
    required: false,
    description: 'Filter by variant name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Inactive'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of items to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items to take',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'ASC',
  })
  async findAll(
    @Query() query: QueryProductVariantDto,
  ): Promise<FindAllProductVariant> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product variant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product variant retrieved successfully',
    type: ProductVariant,
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductVariant> {
    return this.service.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product variant (hard delete)' })
  @ApiResponse({
    status: 204,
    description: 'Product variant deleted successfully',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.delete(id, currentUser);
  }

  @Put('products/:productId/sync')
  @ApiOperation({
    summary: 'Sync product variants for a product',
    description:
      'Replaces all existing variants for a product with the new array of variants. Creates new variants or updates existing ones based on the provided data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variants synced successfully',
    type: [ProductVariant],
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid variant data, SKU conflicts, or attribute validation errors',
    schema: {
      examples: {
        skuConflict: {
          summary: 'SKU already exists',
          value: {
            message:
              "Variant 1 (SKU: 'IPHONE-15-BLUE-128GB'): SKU already exists. Product variant SKUs must be unique across all products.",
            error: 'Bad Request',
          },
        },
        duplicateSkuInRequest: {
          summary: 'Duplicate SKU in same request',
          value: {
            message:
              "Variant 2: Duplicate SKU 'IPHONE-15-BLUE-128GB' found within the same sync request. SKUs must be unique across all variants.",
            error: 'Bad Request',
          },
        },
        attributeValidation: {
          summary: 'Attribute validation error',
          value: {
            message:
              'Variant 1: Attribute value ID 999 (attribute ID 5) does not belong to product ID 1',
            error: 'Bad Request',
          },
        },
        duplicateAttribute: {
          summary: 'Duplicate attribute in variant',
          value: {
            message:
              'Variant 1: Duplicate attribute ID 5 found in attribute value IDs (attribute value ID 999)',
            error: 'Bad Request',
          },
        },
        stockValidation: {
          summary: 'Stock validation error',
          value: {
            message:
              'Variant 1: Minimum stock level (10) cannot be greater than stock quantity (5)',
            error: 'Bad Request',
          },
        },
        missingRequiredField: {
          summary: 'Missing required field',
          value: {
            message: 'Variant 1: SKU is required',
            error: 'Bad Request',
          },
        },
        dtoValidation: {
          summary: 'DTO validation error',
          value: {
            message: [
              'product_variants.0.sku should not be empty',
              'product_variants.0.selling_price must be a number conforming to the specified constraints',
              'product_variants.0.min_stock_level: Minimum stock level (10) cannot be greater than stock quantity (5)',
            ],
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async syncVariants(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() input: SyncProductVariantsDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductVariant[]> {
    return this.service.syncVariants(productId, input, currentUser);
  }
}
