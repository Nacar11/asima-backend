import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from '@/permissions/permissions.service';
import { Permission } from '@/permissions/domain/permission';
import { FindAllPermission } from '@/permissions/domain/find-all-permission';
import { QueryPermissionDto } from '@/permissions/dto/query-permission.dto';
import { UpdatePermissionDto } from '@/permissions/dto/update-permission.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Admin endpoints for the Permission catalog. Gated by the global
 * `JwtAuthGuard` + per-route `@Permissions({ PERMISSION: ... })`
 * (enforced by global `PermissionsGuard`).
 */
@ApiTags('Admin - Permissions')
@ApiBearerAuth()
@Controller({ path: 'admin/permissions', version: API_VERSION })
export class AdminPermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @Permissions({ PERMISSION: 'View' })
  @ApiOperation({ summary: 'List permissions (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of permission codes' })
  findAll(@Query() query: QueryPermissionDto): Promise<FindAllPermission> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions({ PERMISSION: 'View' })
  @ApiOperation({ summary: 'Get a single permission by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Permission> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions({ PERMISSION: 'Update' })
  @ApiOperation({ summary: 'Update a permission description (only field allowed)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.service.update(id, dto);
  }
}
