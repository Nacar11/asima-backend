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
import { ServiceAddonsService } from '@/service-addons/service-addons.service';
import { CreateServiceAddonDto } from '@/service-addons/dto/create-service-addon.dto';
import { UpdateServiceAddonDto } from '@/service-addons/dto/update-service-addon.dto';
import { QueryServiceAddonDto } from '@/service-addons/dto/query-service-addon.dto';
import { BulkDeleteServiceAddonsDto } from '@/service-addons/dto/bulk-delete-service-addons.dto';
import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Service Addons')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'service-addons',
  version: '1',
})
export class ServiceAddonsController {
  constructor(private readonly service: ServiceAddonsService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceAddon })
  create(@Body() dto: CreateServiceAddonDto, @CurrentUser() currentUser: User) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: ServiceAddon, isArray: true })
  async findAll(@Query() query: QueryServiceAddonDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('by-service/:serviceId')
  @ApiParam({ name: 'serviceId', type: Number })
  @ApiOkResponse({ type: ServiceAddon, isArray: true })
  findByService(@Param('serviceId') serviceId: number) {
    return this.service.findByServiceId(serviceId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceAddon })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ServiceAddon })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateServiceAddonDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeMany(
    @Body() dto: BulkDeleteServiceAddonsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.removeMany(dto.ids, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
