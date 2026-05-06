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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductAttributesService } from './product-attributes.service';
import { ProductAttribute } from './domain/product-attribute';
import { FindAllProductAttribute } from './domain/find-all-product-attribute';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Product Attributes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'product-attributes',
  version: '1',
})
export class ProductAttributesController {
  constructor(
    private readonly productAttributesService: ProductAttributesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product attribute',
    description:
      'Creates a product-attribute relationship with optional attribute value IDs. The attribute_value_ids array will be validated to ensure all IDs belong to the specified attribute and seller.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product attribute created successfully',
    schema: {
      example: {
        id: 1,
        product_id: 1,
        attribute_id: 1,
        attribute_value_ids: [1, 2, 4],
        product: {
          id: 1,
          product_name: 'iPhone 15 Pro Max',
          description: 'Latest flagship smartphone',
          status: 'Published',
        },
        attribute: {
          id: 1,
          name: 'Color',
          status: 'Active',
          attribute_values: [
            { id: 1, value: 'Black', display_order: 0 },
            { id: 2, value: 'White', display_order: 1 },
            { id: 4, value: 'Blue', display_order: 2 },
          ],
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    type: ProductAttribute,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid product ID, attribute ID, attribute value IDs, or duplicate combination',
    schema: {
      examples: {
        duplicateCombination: {
          summary: 'Product-attribute combination already exists',
          value: {
            message:
              'Product attribute with product_id 1 and attribute_id 1 already exists',
            error: 'Bad Request',
          },
        },
        invalidAttributeValue: {
          summary: 'Attribute value does not belong to seller',
          value: {
            message:
              'Attribute value with ID 999 does not belong to your attributes',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createProductAttributeDto: CreateProductAttributeDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductAttribute> {
    return this.productAttributesService.create(
      createProductAttributeDto,
      currentUser,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product attributes with pagination and filtering',
    description:
      'Returns product attributes with their associated products, attributes, and attribute values. The attribute_values array contains all possible values for each attribute.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attributes retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            product_id: 1,
            attribute_id: 1,
            attribute_value_ids: [1, 2, 4],
            product: {
              id: 1,
              product_name: 'iPhone 15 Pro Max',
              description: 'Latest flagship smartphone',
              status: 'Published',
            },
            attribute: {
              id: 1,
              name: 'Color',
              status: 'Active',
              attribute_values: [
                { id: 1, value: 'Black', display_order: 0 },
                { id: 2, value: 'White', display_order: 1 },
                { id: 4, value: 'Blue', display_order: 2 },
              ],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 10,
      },
    },
    type: FindAllProductAttribute,
  })
  findAll(
    @Query() query: QueryProductAttributeDto,
  ): Promise<FindAllProductAttribute> {
    return this.productAttributesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product attribute by ID',
    description:
      'Returns a single product attribute with its associated product, attribute, and all possible attribute values.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attribute retrieved successfully',
    schema: {
      example: {
        id: 1,
        product_id: 1,
        attribute_id: 1,
        attribute_value_ids: [1, 2, 4],
        product: {
          id: 1,
          product_name: 'iPhone 15 Pro Max',
          description: 'Latest flagship smartphone with titanium design',
          status: 'Published',
          seller_id: 1,
        },
        attribute: {
          id: 1,
          name: 'Color',
          status: 'Active',
          seller_id: 1,
          attribute_values: [
            { id: 1, value: 'Black', display_order: 0 },
            { id: 2, value: 'White', display_order: 1 },
            { id: 4, value: 'Blue', display_order: 2 },
          ],
        },
        created_by: { id: 1, first_name: 'Super', last_name: 'Admin' },
        updated_by: { id: 1, first_name: 'Super', last_name: 'Admin' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    type: ProductAttribute,
  })
  @ApiResponse({ status: 404, description: 'Product attribute not found' })
  findById(@Param('id') id: string): Promise<ProductAttribute> {
    return this.productAttributesService.findById(+id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a product attribute',
    description:
      'Updates a product-attribute relationship. The attribute_value_ids array completely replaces existing values. All validation rules apply to ensure data integrity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product attribute updated successfully',
    schema: {
      example: {
        id: 1,
        product_id: 1,
        attribute_id: 1,
        attribute_value_ids: [1, 3, 5], // Updated values
        product: {
          id: 1,
          product_name: 'iPhone 15 Pro Max',
          description: 'Latest flagship smartphone',
          status: 'Published',
        },
        attribute: {
          id: 1,
          name: 'Color',
          status: 'Active',
          attribute_values: [
            { id: 1, value: 'Black', display_order: 0 },
            { id: 3, value: 'Red', display_order: 1 },
            { id: 5, value: 'Green', display_order: 2 },
          ],
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      },
    },
    type: ProductAttribute,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid attribute value IDs, duplicates, cross-seller data, or duplicate combination',
    schema: {
      examples: {
        duplicateCombination: {
          summary: 'Product-attribute combination already exists',
          value: {
            message:
              'Product attribute with product_id 1 and attribute_id 1 already exists',
            error: 'Bad Request',
          },
        },
        invalidAttribute: {
          summary: 'Attribute value belongs to wrong attribute',
          value: {
            message:
              'Attribute value with ID 999 does not belong to attribute with ID 1',
            error: 'Bad Request',
          },
        },
        duplicateIds: {
          summary: 'Duplicate attribute value IDs',
          value: {
            message: 'Duplicate attribute value IDs are not allowed',
            error: 'Bad Request',
          },
        },
        crossSeller: {
          summary: 'Attribute value from different seller',
          value: {
            message:
              'Attribute value with ID 888 does not belong to your attributes',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product attribute not found' })
  update(
    @Param('id') id: string,
    @Body() updateProductAttributeDto: UpdateProductAttributeDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductAttribute> {
    return this.productAttributesService.update(
      +id,
      updateProductAttributeDto,
      currentUser,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product attribute by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product attribute deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product attribute not found' })
  delete(@Param('id') id: string): Promise<void> {
    return this.productAttributesService.delete(+id);
  }
}
