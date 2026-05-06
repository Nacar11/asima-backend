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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ParametersService } from './parameters.service';
import { CreateParameterDto } from '@/parameters/dto/create-parameter.dto';
import { UpdateParameterDto } from '@/parameters/dto/update-parameter.dto';
import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { Parameter } from '@/parameters/domain/parameter';
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { FindParameterByDto } from '@/parameters/dto/find-parameter-by.dto';
import {
  DevExtremePaginatedResponse,
  DevExtremePaginatedResponseDto,
} from '@/devextreme/dto/paginated-response';

@ApiTags('Parameters')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller({
  path: 'parameters',
  version: '1',
})
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  @Post()
  @ApiCreatedResponse({
    type: Parameter,
  })
  create(@Body() createparametersDto: CreateParameterDto) {
    return this.parametersService.create(createparametersDto);
  }

  @Get()
  @ApiOkResponse({
    type: DevExtremePaginatedResponse(Parameter),
  })
  async findAllWithPagination(
    @Query() query: GetQueryParams,
  ): Promise<DevExtremePaginatedResponseDto<Parameter>> {
    const paginatedQuery = {
      ...query,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
      sort: query.sort,
    };
    const result = await this.parametersService.findByMany(paginatedQuery);
    return result;
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Parameter,
    isArray: true,
  })
  findAll() {
    return this.parametersService.findAll();
  }

  @Get('/get-by-code')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Parameter,
  })
  findByCode(@Query() query: FindParameterByDto) {
    return this.parametersService.findByCode(query?.code ?? '');
  }

  @Get('/get-by-item')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Parameter,
  })
  findByItem(@Query() query: FindParameterByDto) {
    return this.parametersService.findByItem(query?.param_item ?? '');
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Parameter,
  })
  findById(@Param('id') id: number) {
    return this.parametersService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Parameter,
  })
  update(
    @Param('id') id: number,
    @Body() updateparametersDto: UpdateParameterDto,
  ) {
    return this.parametersService.update(id, updateparametersDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number) {
    return this.parametersService.remove(id);
  }
}
