import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from '@/roles/roles.service';
import { Role } from '@/roles/domain/role';
import { FindAllRole } from '@/roles/domain/find-all-role';
import { QueryRoleDto } from '@/roles/dto/query-role.dto';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Admin endpoints for Role catalog.
 *
 * NOTE (v0): full CRUD + assign-permissions endpoints land in Task 9
 * once PermissionsGuard exists. For now only GET endpoints are exposed
 * (read-only) and they are open to any caller — do not deploy.
 */
@ApiTags('Admin / Roles')
@ApiBearerAuth()
@Controller({ path: 'admin/roles', version: API_VERSION })
export class AdminRolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles (paginated, with permissions populated)' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: QueryRoleDto): Promise<FindAllRole> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single role by id, with its permissions' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    return this.service.findById(id);
  }
}
