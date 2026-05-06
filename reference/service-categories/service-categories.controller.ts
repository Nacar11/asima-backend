import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceCategoriesService } from '@/service-categories/service-categories.service';
import { CreateServiceCategoryDto } from '@/service-categories/dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '@/service-categories/dto/update-service-category.dto';
import { QueryServiceCategoryDto } from '@/service-categories/dto/query-service-category.dto';
import { BulkDeleteServiceCategoriesDto } from '@/service-categories/dto/bulk-delete-service-categories.dto';
import { ServiceCategory } from '@/service-categories/domain/service-category';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

@ApiTags('Service Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'service-categories',
  version: '1',
})
export class ServiceCategoriesController {
  constructor(private readonly service: ServiceCategoriesService) {}

  @Post()
  @Permissions({ SM11: 'Create' })
  @ApiCreatedResponse({ type: ServiceCategory })
  create(
    @Body() dto: CreateServiceCategoryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    enum: ['name', 'created_at', 'updated_at', 'display_order'],
    description: 'Field to sort by (default: display_order)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: ASC)',
  })
  @ApiOkResponse({ type: ServiceCategory, isArray: true })
  async findAll(@Query() query: QueryServiceCategoryDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a lightweight list for dropdown lookups',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              code: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  lookup(@Query() query: LookUpDto) {
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;
    const searchValue = query.name ?? query.searchValue ?? query.searchExpr;
    return this.service.lookup(searchValue, take, skip);
  }

  @Get('/featured')
  @ApiOkResponse({ type: ServiceCategory, isArray: true })
  async featured(@Query('take') take?: number) {
    const num = Number(take);
    const parsedTake = Number.isFinite(num) && num > 0 ? num : 10;
    const { data } = await this.service.findFeatured(parsedTake);
    return data;
  }

  @Get(':id')
  @Permissions({ SM11: 'View' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceCategory })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions({ SM11: 'Edit' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceCategory })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceCategoryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Bulk delete operation completed',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of successfully deleted service categories',
        },
        failed: {
          type: 'number',
          description: 'Number of failed deletions',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of error messages for failed deletions',
        },
      },
    },
  })
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteServiceCategoriesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.bulkDelete(bulkDeleteDto.ids, currentUser);
  }

  @Delete(':id')
  @Permissions({ SM11: 'Delete' })
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
