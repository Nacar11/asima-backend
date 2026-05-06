import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { StoreUserGroupsService } from './store-user-groups.service';
import { CreateStoreUserGroupDto } from './dto/create-store-user-group.dto';
import { UpdateStoreUserGroupDto } from './dto/update-store-user-group.dto';
import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { JwtPayloadType } from '@/auth/strategies/types/jwt-payload.type';

@ApiTags('Store User Groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'store-user-groups', version: '1' })
export class StoreUserGroupsController {
  constructor(private readonly service: StoreUserGroupsService) {}

  @Post()
  @Permissions({ SUG1: 'Create' })
  create(
    @Body() dto: CreateStoreUserGroupDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  @Permissions({ SUG1: 'View' })
  findAll(@Query() query: BaseGetDto, @CurrentUser() user: JwtPayloadType) {
    return this.service.findAllForStore(user, query);
  }

  @Get('available-menus')
  @Permissions({ SUG1: 'View' })
  getAvailableMenus(@CurrentUser() user: JwtPayloadType) {
    return this.service.getAvailableMenus(user);
  }

  @Get(':id')
  @Permissions({ SUG1: 'View' })
  findOne(@Param('id') id: number, @CurrentUser() user: JwtPayloadType) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Permissions({ SUG1: 'Edit' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateStoreUserGroupDto,
    @CurrentUser() user: JwtPayloadType,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/restore')
  @Permissions({ SUG1: 'Edit' })
  restore(@Param('id') id: number, @CurrentUser() user: JwtPayloadType) {
    return this.service.restore(id, user);
  }

  @Delete(':id')
  @Permissions({ SUG1: 'Delete' })
  remove(@Param('id') id: number, @CurrentUser() user: JwtPayloadType) {
    return this.service.remove(id, user);
  }
}
