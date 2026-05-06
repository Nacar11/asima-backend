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
import { UserPermissionsService } from './user-permissions.service';
import { CreateUserPermissionDto } from '@/user-permissions/dto/create-user-permission.dto';
import { UpdateUserPermissionDto } from '@/user-permissions/dto/update-user-permission.dto';
import { FindAllUserPermissionsDto } from '@/user-permissions/dto/find-all-user-permissions.dto';
import { UserPermission } from '@/user-permissions/domain/user-permission';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@ApiTags('UserPermissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'user-permissions',
  version: '1',
})
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Post()
  @Permissions({ MU03: 'Create' })
  @ApiCreatedResponse({
    type: UserPermission,
  })
  create(
    @Body() createUserPermissionDto: CreateUserPermissionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userPermissionsService.create(
      createUserPermissionDto,
      currentUser,
    );
  }

  @Get()
  @Permissions({ MU03: 'View' })
  @ApiOkResponse({
    type: PaginatedResponse(UserPermission),
  })
  async findAllWithPagination(
    @Query() query: FindAllUserPermissionsDto,
  ): Promise<PaginatedResponseDto<UserPermission>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<UserPermission> =
      await this.userPermissionsService.findAllWithPagination({
        menu: query?.menu,
        group: query?.group,
        status: query?.status,
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU03: 'View' })
  @ApiOkResponse({
    type: UserPermission,
    isArray: true,
  })
  findAll() {
    return this.userPermissionsService.findAll();
  }

  @Get(':id')
  @Permissions({ MU03: 'View' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserPermission,
  })
  findById(@Param('id') id: number) {
    return this.userPermissionsService.findById(id);
  }

  @Patch(':id')
  @Permissions({ MU03: 'Edit' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserPermission,
  })
  update(
    @Param('id') id: number,
    @Body() updateUserPermissionDto: UpdateUserPermissionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userPermissionsService.update(
      id,
      updateUserPermissionDto,
      currentUser,
    );
  }

  @Delete(':id')
  @Permissions({ MU03: 'Delete' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userPermissionsService.remove(id, currentUser);
  }
}
