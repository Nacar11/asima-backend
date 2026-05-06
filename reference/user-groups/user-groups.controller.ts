import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
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
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from '@/user-groups/dto/create-user-group.dto';
import { UpdateUserGroupDto } from '@/user-groups/dto/update-user-group.dto';
import { UserGroup } from '@/user-groups/domain/user-group';
import {
  // PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { DevExtremeGetDto as GetQueryParams } from '@/devextreme/dto/devextreme-get.dto';
import { StatusEnum } from '@/user-groups/user-groups.enum';

@ApiTags('UserGroups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'user-groups',
  version: '1',
})
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post()
  @Permissions({ MU02: 'Create' })
  @ApiCreatedResponse({
    type: UserGroup,
  })
  create(
    @Body() createUserGroupDto: CreateUserGroupDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userGroupsService.create(createUserGroupDto, currentUser);
  }

  @Get()
  @Permissions({ MU02: 'View' })
  @ApiOkResponse({
    type: PaginatedResponse(UserGroup),
  })
  async findManyBy(
    @Query() query: GetQueryParams,
  ): Promise<{ data: UserGroup[]; totalCount: number }> {
    return await this.userGroupsService.findManyBy(query);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU02: 'View' })
  @ApiOkResponse({
    type: UserGroup,
    isArray: true,
  })
  findAll() {
    return this.userGroupsService.findAll();
  }

  @Get(':id')
  @Permissions({ MU02: 'View' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserGroup,
  })
  findById(@Param('id') id: number) {
    return this.userGroupsService.findById(id);
  }

  @Patch(':id')
  @Permissions({ MU02: 'Edit' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserGroup,
  })
  update(
    @Param('id') id: number,
    @Body() updateUserGroupDto: UpdateUserGroupDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userGroupsService.update(id, updateUserGroupDto, currentUser);
  }

  @Patch(':id/hold')
  @Permissions({ MU02: 'Edit' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserGroup,
    description: 'User group status updated to Hold',
  })
  async hold(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userGroupsService.updateStatus(
      id,
      StatusEnum.HOLD,
      currentUser,
    );
  }

  @Patch(':id/release')
  @Permissions({ MU02: 'Edit' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserGroup,
    description: 'User group status updated to Active',
  })
  async release(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userGroupsService.updateStatus(
      id,
      StatusEnum.ACTIVE,
      currentUser,
    );
  }

  @Patch(':id/restore')
  @Permissions({ MU02: 'Edit' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserGroup,
    description: 'User group restored to Active status',
  })
  async restore(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userGroupsService.restore(id, currentUser);
  }

  @Delete(':id')
  @Permissions({ MU02: 'Delete' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userGroupsService.remove(id, currentUser);
  }
}
