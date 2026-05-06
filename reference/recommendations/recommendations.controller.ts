import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { RecommendationsService } from '@/recommendations/recommendations.service';
import { QueryRecommendationsDto } from '@/recommendations/dto/query-recommendations.dto';
import { FindAllRecommendedProduct } from '@/recommendations/domain/find-all-recommended-product';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard, JwtGuard)
@Controller({
  path: 'products',
  version: '1',
})
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get(':id/recommendations')
  @ApiOperation({
    summary: 'Get product recommendations',
    description:
      'Returns recommended products for a given source product ID. Supports multiple recommendation strategies via the type parameter.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Source product ID',
    example: 1,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    enum: ['similar', 'same_category', 'same_seller'],
    description: 'Recommendation type',
    example: 'similar',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Pagination offset',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of results to return (max 20)',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Recommended products returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 2 },
              product_name: { type: 'string', example: 'Organic Green Tea' },
              description: {
                type: 'string',
                example: 'Premium loose leaf green tea',
              },
              primary_image: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number', example: 5 },
                  file_path: {
                    type: 'string',
                    example: '/uploads/products/green-tea.jpg',
                  },
                  url: {
                    type: 'string',
                    example:
                      'https://cdn.example.com/uploads/products/green-tea.jpg',
                  },
                },
              },
              min_price: { type: 'number', example: 280.0 },
              max_price: { type: 'number', example: 450.0 },
              average_rating: { type: 'number', example: 4.7, nullable: true },
              total_reviews: { type: 'number', example: 89 },
              seller: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'number', example: 1 },
                  store_name: { type: 'string', example: 'Tea House' },
                  store_logo_url: {
                    type: 'string',
                    example: 'https://cdn.example.com/stores/tea-logo.jpg',
                  },
                },
              },
              relevance_score: { type: 'number', example: 85 },
            },
          },
        },
        totalCount: { type: 'number', example: 15 },
        skip: { type: 'number', example: 0 },
        take: { type: 'number', example: 10 },
        recommendation_type: {
          type: 'string',
          example: 'similar',
        },
        source_product_id: { type: 'number', example: 1 },
      },
    },
  })
  async findRecommendations(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryRecommendationsDto,
  ): Promise<FindAllRecommendedProduct> {
    return this.recommendationsService.getRecommendations(id, query);
  }
}
