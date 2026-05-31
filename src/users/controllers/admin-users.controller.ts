import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';
import { CreateUserDto } from '@/users/dto/admin/create-user.dto';
import { UpdateUserDto } from '@/users/dto/admin/update-user.dto';
import { QueryUserDto } from '@/users/dto/admin/query-user.dto';
import { ResetUserPasswordDto } from '@/users/dto/admin/reset-user-password.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Admin endpoints for managing ANY user.
 *
 * Audience: holders of `USER:Create` / `USER:View` / `USER:Update` /
 * `USER:Delete` (or `system_admin: true`). Carries the WIDE field set —
 * `role_id`, `is_active`, password reset.
 *
 * Companion: `me-users.controller.ts` (`/users/me`) for self-service —
 * narrow surface, identity-keyed (no `:id`).
 */
@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller({ path: 'admin/users', version: API_VERSION })
export class AdminUsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Permissions({ USER: 'View' })
  @ApiOperation({ summary: 'List users (paginated, filterable)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users, each with a slim role (id + name, no permissions tree)',
  })
  async findAll(@Query() query: QueryUserDto): Promise<PaginatedResponse<UserResponseDto>> {
    const result = await this.service.findAll(query);
    return { ...result, data: result.data.map(UserResponseDto.from) };
  }

  @Get(':id')
  @Permissions({ USER: 'View' })
  @ApiOperation({ summary: 'Get a single user by id (with a slim role — no permissions tree)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.service.findById(id));
  }

  @Post()
  @Permissions({ USER: 'Create' })
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: User): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.service.create({ ...dto, created_by: actor.id }));
  }

  @Patch(':id')
  @Permissions({ USER: 'Update' })
  @ApiOperation({ summary: 'Update a user (any field except password)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: User,
  ): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.service.update(id, { ...dto, updated_by: actor.id }));
  }

  @Post(':id/reset-password')
  @Permissions({ USER: 'Update' })
  @Throttle({ password: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Force-reset another user’s password',
    description:
      'Admin override — does NOT require the target user’s current password. ' +
      'Self-service password change uses PATCH /users/me/password instead.',
  })
  @ApiResponse({ status: 204 })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() actor: User,
  ): Promise<void> {
    await this.service.changePassword(id, dto.new_password, actor.id);
  }

  @Delete(':id')
  @Permissions({ USER: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: User): Promise<void> {
    await this.service.softDelete(id, actor.id);
  }
}
