import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductSpecificationsService } from './product-specifications.service';
import { ProductSpecification } from './domain/product-specification';
import { FindAllProductSpecification } from './domain/find-all-product-specification';
import { CreateProductSpecificationDto } from './dto/create-product-specification.dto';
import { UpdateProductSpecificationDto } from './dto/update-product-specification.dto';
import { QueryProductSpecificationDto } from './dto/query-product-specification.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Controller for product specification endpoints
 */
@ApiTags('Product Specifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'product-specifications',
  version: '1',
})
export class ProductSpecificationsController {
  constructor(private readonly service: ProductSpecificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product specification' })
  @ApiResponse({
    status: 201,
    description: 'Product specification created successfully',
    type: ProductSpecification,
  })
  async create(
    @Body() input: CreateProductSpecificationDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductSpecification> {
    return this.service.create(input, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product specifications with filters' })
  @ApiResponse({
    status: 200,
    description: 'Product specifications retrieved successfully',
  })
  async findAll(
    @Query() query: QueryProductSpecificationDto,
  ): Promise<FindAllProductSpecification> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product specification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product specification retrieved successfully',
    type: ProductSpecification,
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<ProductSpecification> {
    return this.service.findById(parseInt(id, 10), currentUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product specification' })
  @ApiResponse({
    status: 200,
    description: 'Product specification updated successfully',
    type: ProductSpecification,
  })
  async update(
    @Param('id') id: string,
    @Body() input: UpdateProductSpecificationDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductSpecification> {
    return this.service.update(parseInt(id, 10), input, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product specification' })
  @ApiResponse({
    status: 200,
    description: 'Product specification deleted successfully',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.delete(parseInt(id, 10), currentUser);
  }
}
