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
import { RolesService } from '@/roles/roles.service';
import { Role } from '@/roles/domain/role';
import { FindAllRole } from '@/roles/domain/find-all-role';
import { QueryRoleDto } from '@/roles/dto/query-role.dto';
import { CreateRoleDto } from '@/roles/dto/create-role.dto';
import { UpdateRoleDto } from '@/roles/dto/update-role.dto';
import { AssignPermissionsDto } from '@/roles/dto/assign-permissions.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Admin endpoints for the Role catalog. Full CRUD + assign-permissions.
 *
 * Built-in roles (SUPER_ADMIN, HR_ADMIN, PROJECT_MANAGER, etc.) are
 * protected from deletion at the service layer — see `PROTECTED_ROLES`
 * in `roles.constants.ts`. Renames are allowed but discouraged.
 */
@ApiTags('Admin - Roles')
@ApiBearerAuth()
@Controller({ path: 'admin/roles', version: API_VERSION })
export class AdminRolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @Permissions({ ROLE: 'View' })
  @ApiOperation({ summary: 'List roles (paginated, with permissions populated)' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: QueryRoleDto): Promise<FindAllRole> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions({ ROLE: 'View' })
  @ApiOperation({ summary: 'Get a single role by id, with its permissions' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    return this.service.findById(id);
  }

  @Post()
  @Permissions({ ROLE: 'Create' })
  @ApiOperation({ summary: 'Create a new role with an initial permission set' })
  @ApiResponse({ status: 201, type: Role })
  create(@Body() dto: CreateRoleDto, @CurrentUser() actor: User): Promise<Role> {
    return this.service.create({ ...dto, created_by: actor.id });
  }

  @Patch(':id')
  @Permissions({ ROLE: 'Update' })
  @ApiOperation({ summary: 'Update a role’s name or description' })
  @ApiResponse({ status: 200, type: Role })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: User,
  ): Promise<Role> {
    return this.service.update(id, { ...dto, updated_by: actor.id });
  }

  @Post(':id/permissions')
  @Permissions({ ROLE: 'Update' })
  @ApiOperation({
    summary: 'Replace the role’s permission set',
    description:
      'Sends the COMPLETE desired set. Existing permissions are removed and replaced. ' +
      'Pass `[]` to clear all permissions.',
  })
  @ApiResponse({ status: 200, type: Role })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ): Promise<Role> {
    return this.service.assignPermissions(id, dto.permission_ids);
  }

  @Delete(':id')
  @Permissions({ ROLE: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a role',
    description: 'Built-in roles (SUPER_ADMIN, HR_ADMIN, etc.) are protected — returns 403.',
  })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: User): Promise<void> {
    await this.service.softDelete(id, actor.id);
  }
}
