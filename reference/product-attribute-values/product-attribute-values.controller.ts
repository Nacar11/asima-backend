import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
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
import { AuthGuard } from '@nestjs/passport';
import { ProductAttributeValuesService } from './product-attribute-values.service';
import { ProductAttributeValue } from './domain/product-attribute-value';
import { FindAllProductAttributeValue } from './domain/find-all-product-attribute-value';
import { QueryProductAttributeValueDto } from './dto/query-product-attribute-value.dto';
import { SetDefaultProductAttributeValueDto } from './dto/set-default-product-attribute-value.dto';
import { BulkSetDefaultProductAttributeValueDto } from './dto/bulk-set-default-product-attribute-value.dto';

/**
 * Controller for ProductAttributeValue endpoints
 */
@ApiTags('Product Attribute Values')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'product-attribute-values',
  version: '1',
})
export class ProductAttributeValuesController {
  constructor(private readonly service: ProductAttributeValuesService) {}

  /**
   * Get all product attribute values
   */
  @Get()
  @ApiOperation({
    summary: 'Get all product attribute values',
    description:
      'Retrieves all product attribute values with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'product_variant_id',
    required: false,
    type: Number,
    description: 'Filter by product variant ID',
  })
  @ApiQuery({
    name: 'product_attribute_id',
    required: false,
    type: Number,
    description: 'Filter by product attribute ID',
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
    description: 'List of product attribute values',
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
    @Query() query: QueryProductAttributeValueDto,
  ): Promise<FindAllProductAttributeValue> {
    return this.service.findAll(query);
  }

  /**
   * Get product attribute value by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product attribute value by ID',
    description: 'Retrieves a specific product attribute value by its ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Product attribute value ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attribute value found',
    type: ProductAttributeValue,
  })
  @ApiResponse({
    status: 404,
    description: 'Product attribute value not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductAttributeValue> {
    return this.service.findById(id);
  }

  /**
   * Set a product attribute value as the default within its group
   */
  @Post('set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set product attribute value as default',
    description:
      'Sets the specified product attribute value as the default within its product_attribute_id group. All other instances in the same group will be set to non-default.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attribute value set as default successfully',
    type: ProductAttributeValue,
  })
  @ApiResponse({
    status: 404,
    description: 'Product attribute value not found',
  })
  async setDefault(
    @Body() input: SetDefaultProductAttributeValueDto,
  ): Promise<ProductAttributeValue> {
    return this.service.setDefault(input.id);
  }

  /**
   * Bulk set multiple product attribute values as defaults
   */
  @Post('bulk-set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk set product attribute values as defaults',
    description:
      'Sets multiple product attribute values as defaults. ' +
      'Each ID must belong to a different product_attribute_id group. ' +
      'For each group, clears existing is_default=true, then sets the requested ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attribute values set as defaults successfully',
    type: [ProductAttributeValue],
  })
  @ApiResponse({
    status: 400,
    description: 'Multiple IDs belong to the same product_attribute_id group',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more product attribute values not found',
  })
  async bulkSetDefault(
    @Body() input: BulkSetDefaultProductAttributeValueDto,
  ): Promise<ProductAttributeValue[]> {
    return this.service.bulkSetDefault(input.ids);
  }
}
