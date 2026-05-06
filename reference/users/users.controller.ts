import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { Roles } from '@/roles/roles.decorator';
import { NullableType } from '@/utils/types/nullable.type';
// import { QueryUserDto } from '@/users/dto/query-user.dto';
import { User } from '@/users/domain/user';
import { UsersService } from '@/users/users.service';
import {
  // PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
// import { paginate } from '@/utils/paginate';
// import { IPaginatedResult } from '@/utils/types/paginated-result';
import { InsertUpdateFailedFilter } from '@/utils/exception-filters/insert-update.filter';
import { FindAllUser } from '@/users/domain/find-all-user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { BulkActionDto } from '@/utils/dto/bulk-action.dto';
import { Permissions } from '../user-permissions/persistence/user-permissions.decorator';
import { PermissionsGuard } from '../user-permissions/user-permissions.guard';
import { GetUserDto } from './dto/get-user.dto';
import { UserGroup } from '@/user-groups/domain/user-group';
import { DevExtremeGetDto as GetQueryParams } from '@/devextreme/dto/devextreme-get.dto';
import { UserLookupDto } from './dto/user-lookup.dto';

@ApiBearerAuth()
@Roles(true) // true for system_admin
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   * @param createProfileDto - The user data
   * @returns The created user
   * */
  @ApiCreatedResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @InsertUpdateFailedFilter()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ MU01: 'Create' })
  async create(
    @Body() createProfileDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.create(createProfileDto, currentUser);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(UserGroup),
  })
  @Permissions({ MU01: 'View' })
  async findManyBy(
    @Query() query: GetQueryParams,
  ): Promise<{ data: User[]; totalCount: number }> {
    return await this.usersService.findManyBy(query);
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'View' })
  @ApiOkResponse({
    type: FindAllUser,
    isArray: true,
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('/eligible-sellers')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'View' })
  @ApiOkResponse({
    type: FindAllUser,
    isArray: true,
  })
  findEligibleSellerUsers() {
    return this.usersService.findEligibleSellerUsers();
  }

  /**
   * Get seller status for multiple users (bulk)
   * Query param: ids (comma-separated user IDs)
   */
  @Get('/seller-status')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'View' })
  @ApiOkResponse({
    description: 'Returns seller status for multiple users',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          has_seller: { type: 'boolean' },
          has_seller_member: { type: 'boolean' },
        },
      },
    },
  })
  async getBulkSellerStatus(
    @Query('ids') ids: string,
  ): Promise<
    Record<number, { has_seller: boolean; has_seller_member: boolean }>
  > {
    const userIds = ids
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (userIds.length === 0) {
      return {};
    }

    return this.usersService.getBulkSellerStatus(userIds);
  }

  @Get('/lookup')
  @Permissions({ MU01: 'View' })
  @ApiOkResponse({
    description: 'Returns a list of users for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              user_id: { type: 'string' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
        totalCount: { type: 'number' },
      },
    },
  })
  async lookup(@Query() query: UserLookupDto): Promise<{
    data: {
      id: number;
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
    }[];
    totalCount: number;
  }> {
    return await this.usersService.lookup(query);
  }

  @Get('lookup/:id')
  @Permissions({ MU01: 'View' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns a single user for lookup purposes',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        user_id: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
      },
    },
  })
  lookupById(@Param('id') id: number): Promise<{
    id?: number;
    user_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  }> {
    return this.usersService.lookupById(id);
  }

  @Get('/testing')
  @Permissions({ MU01: 'View' })
  testing(@Query() query: GetUserDto) {
    return this.usersService.retrieveTestData(query);
  }

  /**
   * Get seller status for a single user
   * Returns whether the user has a seller account and/or is a seller member
   */
  @Get(':id/seller-status')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'View' })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns seller status for a user',
    schema: {
      type: 'object',
      properties: {
        has_seller: { type: 'boolean' },
        has_seller_member: { type: 'boolean' },
      },
    },
  })
  async getSellerStatus(
    @Param('id') id: number,
  ): Promise<{ has_seller: boolean; has_seller_member: boolean }> {
    return this.usersService.getSellerStatus(Number(id));
  }

  /**
   * Get a user by ID
   * @param id - The user ID
   * @returns The user
   * */
  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: User['id']): Promise<NullableType<User>> {
    return this.usersService.findById(id);
  }

  @Patch('/bulk-hold')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'Edit' })
  @ApiNoContentResponse({
    description: 'Users successfully put on hold!',
  })
  bulkHold(@Body() bulkHoldGRDto: BulkActionDto) {
    return this.usersService.bulkHold(bulkHoldGRDto.ids);
  }

  @Patch('/bulk-release')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'Edit' })
  @ApiNoContentResponse({
    description: 'Users successfully released!',
  })
  bulkRelease(@Body() bulkReleaseDto: BulkActionDto) {
    return this.usersService.bulkRelease(bulkReleaseDto.ids);
  }

  /**
   * Update own profile (for customers)
   * @param updateProfileDto - The user data
   * @param avatar - Optional avatar file for profile picture
   * @returns The updated user
   */
  @ApiOkResponse({
    type: User,
  })
  @InsertUpdateFailedFilter()
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU04: 'Edit' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture image file (for multipart/form-data)',
        },
        first_name: { type: 'string' },
        middle_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        gender: {
          type: 'string',
          enum: ['Male', 'Female', 'Other', 'PreferNotToSay'],
        },
        date_of_birth: { type: 'string', format: 'date' },
        profile_picture: {
          type: 'string',
          description:
            'Base64 image data URI (e.g., "data:image/png;base64,iVBORw0...") or empty string to remove',
        },
      },
    },
  })
  async updateMe(
    @Body() updateProfileDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<User | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { system_admin, ...safeDto } = updateProfileDto;
    const updatedUser = await this.usersService.update(
      currentUser.id,
      safeDto,
      currentUser,
      avatar,
      updateProfileDto.profile_picture,
    );
    return updatedUser;
  }

  /**
   * Update a user
   * @param id - The user ID
   * @param updateProfileDto - The user data
   * @param avatar - Optional avatar file for profile picture
   * @returns The updated user
   * */
  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @InsertUpdateFailedFilter()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ MU01: 'Edit' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture image file (for multipart/form-data)',
        },
        first_name: { type: 'string' },
        middle_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        gender: {
          type: 'string',
          enum: ['Male', 'Female', 'Other', 'PreferNotToSay'],
        },
        date_of_birth: { type: 'string', format: 'date' },
        profile_picture: {
          type: 'string',
          description:
            'Base64 image data URI (e.g., "data:image/png;base64,iVBORw0...") or empty string to remove',
        },
      },
    },
  })
  async update(
    @Param('id') id: User['id'],
    @Body() updateProfileDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<User | null> {
    const updatedUser = await this.usersService.update(
      id,
      updateProfileDto,
      currentUser,
      avatar,
      updateProfileDto.profile_picture,
    );

    return updatedUser;
  }

  @Delete('/bulk-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({ MU01: 'Delete' })
  @ApiNoContentResponse({ description: 'Users successfully deleted!' })
  bulkDelete(@Body() bulkDeleteDto: BulkActionDto) {
    return this.usersService.bulkDelete(bulkDeleteDto.ids);
  }
  /**
   * Delete a user
   * @param id - The user ID
   * */
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({ MU01: 'Delete' })
  remove(
    @Param('id') id: User['id'],
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.usersService.remove(id, currentUser);
  }
}
