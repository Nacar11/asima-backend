import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CarouselBannersService } from '@/carousel-banners/carousel-banners.service';
import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { QueryCarouselBannersDto } from '@/carousel-banners/dto/query-carousel-banners.dto';
import type { FindAllCarouselBanners } from '@/carousel-banners/domain/find-all-carousel-banners';

@ApiTags('Carousel Banners')
@Controller({
  path: 'carousel-banners',
  version: '1',
})
export class CarouselBannersPublicController {
  constructor(private readonly service: CarouselBannersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get carousel banners (public)',
    description:
      'Returns only currently active carousel banners (scheduled + active).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of carousel banners',
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
    @Query() query: QueryCarouselBannersDto,
  ): Promise<FindAllCarouselBanners> {
    return this.service.findAllPublic(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get carousel banner by id (public)',
    description: 'Returns a single carousel banner by id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Carousel banner id' })
  @ApiResponse({
    status: 200,
    description: 'Carousel banner found',
    type: CarouselBanner,
  })
  @ApiResponse({ status: 404, description: 'Carousel banner not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CarouselBanner> {
    return this.service.findById(id);
  }
}
