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
import { WorkSchedulesService } from '@/work-schedules/work-schedules.service';
import { WorkScheduleResponseDto } from '@/work-schedules/dto/response/work-schedule-response.dto';
import { WorkScheduleAssembler } from '@/work-schedules/work-schedule.assembler';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';
import { CreateWorkScheduleDto } from '@/work-schedules/dto/admin/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from '@/work-schedules/dto/admin/update-work-schedule.dto';
import { QueryWorkScheduleDto } from '@/work-schedules/dto/admin/query-work-schedule.dto';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { utcDateString } from '@/utils/helpers/dates';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Admin endpoints for managing ANY employee's work schedule.
 *
 * Audience: holders of `SCHEDULE:Create` / `View` / `Update` / `Delete`
 * (or `system_admin: true`).
 *
 * DELETE on this controller is intentionally a **logical end** — it
 * stamps `effective_to = today` rather than removing the row. Historical
 * DTRs need the schedule that was active at the time, so a physical
 * delete would corrupt past-period attendance reports.
 */
@ApiTags('Admin - Work Schedules')
@ApiBearerAuth()
@Controller({ path: 'admin/work-schedules', version: API_VERSION })
export class AdminWorkSchedulesController {
  constructor(private readonly service: WorkSchedulesService) {}

  @Get()
  @Permissions({ SCHEDULE: 'View' })
  @ApiOperation({ summary: 'List schedules (paginated, filterable by employee + day_of_week)' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: QueryWorkScheduleDto,
  ): Promise<PaginatedResponse<WorkScheduleResponseDto>> {
    return WorkScheduleAssembler.toPaginatedResponse(
      await this.service.findAll({
        ...query,
        day_of_week: query.day_of_week as DayOfWeek | undefined,
      }),
    );
  }

  @Get(':id')
  @Permissions({ SCHEDULE: 'View' })
  @ApiOperation({ summary: 'Get a single schedule by id' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkScheduleResponseDto> {
    return WorkScheduleAssembler.toResponse(await this.service.findById(id));
  }

  @Post()
  @Permissions({ SCHEDULE: 'Create' })
  @ApiOperation({
    summary: 'Create a work schedule for an employee',
    description:
      'Each (employee, day_of_week) can have at most ONE active row (effective_to IS NULL). ' +
      'To change a schedule mid-period, end the existing row (PATCH or DELETE) and POST a new one.',
  })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateWorkScheduleDto,
    @CurrentUser() actor: User,
  ): Promise<WorkScheduleResponseDto> {
    return WorkScheduleAssembler.toResponse(
      await this.service.create({
        ...dto,
        day_of_week: dto.day_of_week as DayOfWeek,
        created_by: actor.id,
      }),
    );
  }

  @Patch(':id')
  @Permissions({ SCHEDULE: 'Update' })
  @ApiOperation({
    summary: 'Update a work schedule (window, break, effective dates)',
    description:
      'employee_id and day_of_week are NOT writable — to move a schedule, end this row and ' +
      'create a new one. Setting effective_to here logically ends the row.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
    @CurrentUser() actor: User,
  ): Promise<WorkScheduleResponseDto> {
    return WorkScheduleAssembler.toResponse(
      await this.service.update(id, { ...dto, updated_by: actor.id }),
    );
  }

  @Delete(':id')
  @Permissions({ SCHEDULE: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logically end a work schedule (sets effective_to = today)',
    description:
      'NOT a physical delete — historical DTRs need to know what schedule was in effect on ' +
      'past dates. Returns the updated row so the caller can confirm effective_to was set. ' +
      'If you need a hard removal (rare), use the soft-delete via a separate request.',
  })
  @ApiResponse({ status: 200, type: WorkScheduleResponseDto })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: User,
  ): Promise<WorkScheduleResponseDto> {
    const today = utcDateString();
    return WorkScheduleAssembler.toResponse(await this.service.endLogically(id, today, actor.id));
  }
}
