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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceOptionValuesService } from '@/service-option-values/service-option-values.service';
import { CreateServiceOptionValueDto } from '@/service-option-values/dto/create-service-option-value.dto';
import { UpdateServiceOptionValueDto } from '@/service-option-values/dto/update-service-option-value.dto';
import { QueryServiceOptionValueDto } from '@/service-option-values/dto/query-service-option-value.dto';
import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';

@ApiTags('Service Option Values')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-option-values',
  version: '1',
})
export class ServiceOptionValuesController {
  constructor(private readonly service: ServiceOptionValuesService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceOptionValue })
  create(@Body() dto: CreateServiceOptionValueDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: ServiceOptionValue, isArray: true })
  async findAll(@Query() query: QueryServiceOptionValueDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('by-option-group/:optionGroupId')
  @ApiParam({ name: 'optionGroupId', type: Number })
  @ApiOkResponse({ type: ServiceOptionValue, isArray: true })
  findByOptionGroup(@Param('optionGroupId') optionGroupId: number) {
    return this.service.findByOptionGroupId(optionGroupId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionValue })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionValue })
  update(@Param('id') id: number, @Body() dto: UpdateServiceOptionValueDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
