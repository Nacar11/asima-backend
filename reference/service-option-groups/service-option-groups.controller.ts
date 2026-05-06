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
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { CreateServiceOptionGroupDto } from '@/service-option-groups/dto/create-service-option-group.dto';
import { UpdateServiceOptionGroupDto } from '@/service-option-groups/dto/update-service-option-group.dto';
import { QueryServiceOptionGroupDto } from '@/service-option-groups/dto/query-service-option-group.dto';
import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Service Option Groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-option-groups',
  version: '1',
})
export class ServiceOptionGroupsController {
  constructor(private readonly service: ServiceOptionGroupsService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceOptionGroup })
  create(
    @Body() dto: CreateServiceOptionGroupDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: ServiceOptionGroup, isArray: true })
  async findAll(@Query() query: QueryServiceOptionGroupDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('by-service/:serviceId')
  @ApiParam({ name: 'serviceId', type: Number })
  @ApiOkResponse({ type: ServiceOptionGroup, isArray: true })
  findByService(@Param('serviceId') serviceId: number) {
    return this.service.findByServiceId(serviceId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionGroup })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceOptionGroup })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceOptionGroupDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
