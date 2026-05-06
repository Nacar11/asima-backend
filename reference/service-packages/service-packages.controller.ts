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
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { CreateServicePackageDto } from '@/service-packages/dto/create-service-package.dto';
import { UpdateServicePackageDto } from '@/service-packages/dto/update-service-package.dto';
import { QueryServicePackageDto } from '@/service-packages/dto/query-service-package.dto';
import { BulkDeleteServicePackagesDto } from '@/service-packages/dto/bulk-delete-service-packages.dto';
import { ServicePackage } from '@/service-packages/domain/service-package';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Service Packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-packages',
  version: '1',
})
export class ServicePackagesController {
  constructor(private readonly service: ServicePackagesService) {}

  @Post()
  @ApiCreatedResponse({ type: ServicePackage })
  create(
    @Body() dto: CreateServicePackageDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    enum: [
      'name',
      'price',
      'duration_minutes',
      'display_order',
      'created_at',
      'updated_at',
      'status',
    ],
    description: 'Field to sort by (default: display_order)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: ASC)',
  })
  @ApiOkResponse({ type: ServicePackage, isArray: true })
  async findAll(@Query() query: QueryServicePackageDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServicePackage })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServicePackage })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServicePackageDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete('bulk-delete')
  @ApiOkResponse({
    description: 'Bulk delete service packages',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of successfully deleted service packages',
        },
        failed: {
          type: 'number',
          description: 'Number of failed deletions',
        },
        deleted_ids: { type: 'array', items: { type: 'number' } },
        failed_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkDelete(
    @Body() dto: BulkDeleteServicePackagesDto,
    @CurrentUser() currentUser: User,
  ) {
    return await this.service.bulkDelete(dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
