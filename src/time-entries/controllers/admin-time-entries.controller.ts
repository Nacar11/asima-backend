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
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeEntry } from '@/time-entries/domain/time-entry';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { CreateTimeEntryDto } from '@/time-entries/dto/admin/create-time-entry.dto';
import { UpdateTimeEntryDto } from '@/time-entries/dto/admin/update-time-entry.dto';
import { QueryTimeEntryDto } from '@/time-entries/dto/admin/query-time-entry.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Admin endpoints for managing ANY employee's time entries.
 *
 * Audience: holders of `TIME:Create` / `TIME:View` / `TIME:Update` /
 * `TIME:Delete` (or `system_admin: true`). Carries the WIDE field set —
 * pick the target employee, set time_in/time_out manually, etc.
 *
 * Companion: `me-time-entries.controller.ts` (`/users/me/time-entries`)
 * for self-service punch — narrow surface, identity-keyed.
 */
@ApiTags('Admin - Time Entries')
@ApiBearerAuth()
@Controller({ path: 'admin/time-entries', version: API_VERSION })
export class AdminTimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Get()
  @Permissions({ TIME: 'View' })
  @ApiOperation({ summary: 'List time entries (paginated, filterable by employee + date range)' })
  @ApiResponse({ status: 200, description: 'Paginated list of time entries' })
  findAll(@Query() query: QueryTimeEntryDto): Promise<FindAllTimeEntry> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions({ TIME: 'View' })
  @ApiOperation({ summary: 'Get a single time entry by id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TimeEntry> {
    return this.service.findById(id);
  }

  @Post()
  @Permissions({ TIME: 'Create' })
  @ApiOperation({
    summary: 'Create a time entry on behalf of an employee',
    description:
      'Set both time_in and time_out for a confirmed segment, or omit time_out to create an open ' +
      'entry. The DB-level partial unique index rejects a second open entry for the same employee.',
  })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() actor: User): Promise<TimeEntry> {
    return this.service.create({ ...dto, created_by: actor.id });
  }

  @Patch(':id')
  @Permissions({ TIME: 'Update' })
  @ApiOperation({
    summary: 'Update a time entry',
    description:
      'Status is derived from time_out — null = open, set = confirmed. ' +
      'Status is intentionally not a writable field; set time_out to close an open entry.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() actor: User,
  ): Promise<TimeEntry> {
    return this.service.update(id, { ...dto, updated_by: actor.id });
  }

  @Delete(':id')
  @Permissions({ TIME: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a time entry' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: User): Promise<void> {
    await this.service.softDelete(id, actor.id);
  }
}
