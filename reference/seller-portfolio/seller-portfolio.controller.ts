import {
  Controller,
  Get,
  Post,
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
import { AuthGuard } from '@nestjs/passport';
import { SellerPortfolioService } from '@/seller-portfolio/seller-portfolio.service';
import { SellerPortfolio } from '@/seller-portfolio/domain/seller-portfolio';
import { CreateSellerPortfolioDto } from '@/seller-portfolio/dto/create-seller-portfolio.dto';
import { UpdateSellerPortfolioDto } from '@/seller-portfolio/dto/update-seller-portfolio.dto';
import { QuerySellerPortfolioDto } from '@/seller-portfolio/dto/query-seller-portfolio.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Seller Portfolio')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'seller-portfolio',
  version: '1',
})
export class SellerPortfolioController {
  constructor(private readonly service: SellerPortfolioService) {}

  /**
   * Add a portfolio item
   */
  @Post()
  @ApiOperation({
    summary: 'Add a portfolio item',
    description: 'Creates a new portfolio item for a seller',
  })
  @ApiResponse({
    status: 201,
    description: 'Portfolio item created successfully',
    type: SellerPortfolio,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Seller not found',
  })
  async create(
    @Body() dto: CreateSellerPortfolioDto,
    @CurrentUser() currentUser: User,
  ): Promise<SellerPortfolio> {
    return this.service.create(dto, currentUser);
  }

  /**
   * Get all portfolio items
   */
  @Get()
  @ApiOperation({
    summary: 'Get all portfolio items',
    description:
      'Retrieves all portfolio items with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'seller_id',
    required: false,
    type: Number,
    description: 'Filter by seller ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title or description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Inactive'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of items to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of items to take',
  })
  @ApiResponse({
    status: 200,
    description: 'List of portfolio items',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: QuerySellerPortfolioDto): Promise<{
    data: SellerPortfolio[];
    totalCount: number;
  }> {
    return this.service.findAll(query);
  }

  /**
   * Get portfolio item by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get portfolio item by ID',
    description: 'Retrieves a specific portfolio item by its ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Portfolio item ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio item found',
    type: SellerPortfolio,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SellerPortfolio> {
    return this.service.findById(id);
  }

  /**
   * Update a portfolio item
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a portfolio item',
    description: 'Updates an existing portfolio item',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Portfolio item ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio item updated successfully',
    type: SellerPortfolio,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerPortfolioDto,
    @CurrentUser() currentUser: User,
  ): Promise<SellerPortfolio> {
    return this.service.update(id, dto, currentUser);
  }

  /**
   * Delete a portfolio item
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a portfolio item',
    description: 'Soft deletes a portfolio item',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Portfolio item ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Portfolio item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.remove(id, currentUser);
  }
}
