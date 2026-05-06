import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CarouselBannersService } from '@/carousel-banners/carousel-banners.service';
import { CarouselBanner } from '@/carousel-banners/domain/carousel-banner';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import { CreateCarouselBannerDto } from '@/carousel-banners/dto/create-carousel-banner.dto';
import { UpdateCarouselBannerDto } from '@/carousel-banners/dto/update-carousel-banner.dto';
import { QueryCarouselBannersAdminDto } from '@/carousel-banners/dto/query-carousel-banners-admin.dto';
import { SyncCarouselBannersDto } from '@/carousel-banners/dto/sync-carousel-banners.dto';
import type { FindAllCarouselBanners } from '@/carousel-banners/domain/find-all-carousel-banners';

@ApiTags('Admin - Carousel Banners')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({
  path: 'admin/carousel-banners',
  version: '1',
})
export class CarouselBannersAdminController {
  constructor(private readonly service: CarouselBannersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create carousel banner',
    description: 'Creates a new carousel banner.',
  })
  @ApiResponse({
    status: 201,
    description: 'Carousel banner created',
    type: CarouselBanner,
  })
  async create(
    @Body() input: CreateCarouselBannerDto,
    @CurrentUser() currentUser: User,
  ): Promise<CarouselBanner> {
    return this.service.create(input, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'List carousel banners (admin)',
    description: 'Retrieves all carousel banners.',
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
    @Query() query: QueryCarouselBannersAdminDto,
  ): Promise<FindAllCarouselBanners> {
    return this.service.findAll(query);
  }

  @Put('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync carousel banners',
    description:
      'Replaces all carousel banners with the provided list. Missing banners are deleted, existing ones are updated, and new ones are created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousel banners synced',
    type: [CarouselBanner],
  })
  async syncCarouselBanners(
    @Body() input: SyncCarouselBannersDto,
    @CurrentUser() currentUser: User,
  ): Promise<CarouselBanner[]> {
    return await this.service.syncCarouselBanners(input, currentUser);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get carousel banner by id (admin)',
    description: 'Retrieves a carousel banner by id.',
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

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update carousel banner',
    description: 'Updates a carousel banner by id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Carousel banner id' })
  @ApiResponse({
    status: 200,
    description: 'Carousel banner updated',
    type: CarouselBanner,
  })
  @ApiResponse({ status: 404, description: 'Carousel banner not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateCarouselBannerDto,
    @CurrentUser() currentUser: User,
  ): Promise<CarouselBanner> {
    return this.service.update(id, input, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete carousel banner',
    description: 'Soft deletes a carousel banner by id.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Carousel banner id' })
  @ApiResponse({ status: 200, description: 'Carousel banner deleted' })
  @ApiResponse({ status: 404, description: 'Carousel banner not found' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.delete(id, currentUser);
  }
}
