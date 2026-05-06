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
import { SubSectionsService } from './sub-sections.service';
import { CreateSubSectionDto } from '@/sub-sections/dto/create-sub-section.dto';
import { UpdateSubSectionDto } from '@/sub-sections/dto/update-sub-section.dto';
import { FindAllSubSectionsDto } from '@/sub-sections/dto/find-all-sub-sections.dto';
import { SubSection } from '@/sub-sections/domain/sub-section';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FindAllSubSection } from '@/sub-sections/domain/find-all-sub-section';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { LookUpDto } from '@/utils/dto/lookup.dto';
import { BulkExcludeDto } from '@/utils/dto/bulk-exclude.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';

@ApiTags('SubSections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'sub-sections',
  version: '1',
})
export class SubSectionsController {
  constructor(private readonly subSectionsService: SubSectionsService) {}

  @Post()
  @ApiCreatedResponse({
    type: SubSection,
  })
  create(
    @Body() createSubSectionDto: CreateSubSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.subSectionsService.create(createSubSectionDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(SubSection),
  })
  async findByMany(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<SubSection>> {
    return await this.subSectionsService.findByMany(query);
  }

  @Get('v2')
  @ApiOkResponse({
    type: PaginatedResponse(SubSection),
  })
  async findAllWithPagination(
    @Query() query: FindAllSubSectionsDto,
  ): Promise<PaginatedResponseDto<SubSection>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<SubSection> =
      await this.subSectionsService.findAllWithPagination({
        filterQuery: query.search,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: FindAllSubSection,
    isArray: true,
  })
  findAll() {
    return this.subSectionsService.findAll();
  }

  @Get('/lookup')
  @ApiOkResponse({
    description: 'Returns a list of sub-section for lookup purposes',
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
    return await this.subSectionsService.lookup(query, exclude);
  }

  @Get('lookup/:id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single material for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        code: { type: 'string' },
        name: { type: 'string' },
        specifications: { type: 'string' },
      },
    },
  })
  lookupById(@Param('id') id: number): Promise<{
    id?: number;
    code?: string;
    name?: string;
  }> {
    return this.subSectionsService.lookupById(id);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: SubSection,
  })
  findById(@Param('id') id: number) {
    return this.subSectionsService.findById(id);
  }

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'SubSections successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.subSectionsService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'SubSections successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.subSectionsService.bulkRelease(bulkReleaseDto.ids);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: SubSection,
  })
  update(
    @Param('id') id: number,
    @Body() updateSubSectionDto: UpdateSubSectionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.subSectionsService.update(id, updateSubSectionDto, currentUser);
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiNoContentResponse({
    description: 'SubSections successfully deleted!',
  })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.subSectionsService.bulkDelete(bulkDeleteDto.ids);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.subSectionsService.remove(id, currentUser);
  }
}
