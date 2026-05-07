import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from '@/roles/roles.service';
import { Role } from '@/roles/domain/role';
import { FindAllRole } from '@/roles/domain/find-all-role';
import { QueryRoleDto } from '@/roles/dto/query-role.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Admin endpoints for Role catalog. Gated by the global `JwtAuthGuard` +
 * per-route `@Permissions({ ROLE: 'View' })`.
 *
 * Full CRUD + assign-permissions endpoints will land in a follow-up task;
 * v0 ships read-only.
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
}
