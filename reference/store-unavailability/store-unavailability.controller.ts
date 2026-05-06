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
  ApiTags,
} from '@nestjs/swagger';
import { StoreUnavailabilityService } from '@/store-unavailability/store-unavailability.service';
import { CreateStoreUnavailabilityDto } from '@/store-unavailability/dto/create-store-unavailability.dto';
import { UpdateStoreUnavailabilityDto } from '@/store-unavailability/dto/update-store-unavailability.dto';
import { QueryStoreUnavailabilityDto } from '@/store-unavailability/dto/query-store-unavailability.dto';
import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Store Unavailability')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'store-unavailability',
  version: '1',
})
export class StoreUnavailabilityController {
  constructor(private readonly service: StoreUnavailabilityService) {}

  @Post()
  @ApiCreatedResponse({ type: StoreUnavailability })
  create(
    @Body() dto: CreateStoreUnavailabilityDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: StoreUnavailability, isArray: true })
  async findAll(@Query() query: QueryStoreUnavailabilityDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: StoreUnavailability })
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: StoreUnavailability })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateStoreUnavailabilityDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
