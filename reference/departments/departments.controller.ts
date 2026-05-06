import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/departments/dto/update-department.dto';
import { FindAllDepartmentsDto } from '@/departments/dto/find-all-departments.dto';
import { Department } from '@/departments/domain/department';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllDepartment } from '@/departments/domain/find-all-department';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'departments',
  version: '1',
})
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Department,
  })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.departmentsService.create(createDepartmentDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse<Department>(Department),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Department>> {
    const result = await this.departmentsService.findByMany(query);
    return result;
  }

  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(Department),
  })
  async findAllWithPagination(
    @Query() query: FindAllDepartmentsDto,
  ): Promise<PaginatedResponseDto<Department>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<Department> =
      await this.departmentsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllDepartment,
    isArray: true,
  })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of materials for lookup purposes',
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
  async lookup(
    @Query() query: LookUpDto,
    @Query() exclude: BulkExcludeDto,
  ): Promise<{
    data: { id: number; code: string; name: string }[];
    totalCount: number;
  }> {
    return await this.departmentsService.lookup(query, exclude);
  }

  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single department for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        code: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  lookupById(@Param('id') id: number): Promise<{
    id?: number;
    code?: string;
    name?: string;
  }> {
    return this.departmentsService.lookupById(id);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
  })
  findById(@Param('id') id: number) {
    return this.departmentsService.findById(id);
  }
  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Departments successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.departmentsService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Departments successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.departmentsService.bulkRelease(bulkReleaseDto.ids);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Department,
  })
  update(
    @Param('id') id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto, currentUser);
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'Departments successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.departmentsService.bulkDelete(bulkDeleteDto.ids);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.departmentsService.remove(id, currentUser);
  }
}
