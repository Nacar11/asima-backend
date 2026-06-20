import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScheduleChangeService } from '@/work-schedules/schedule-change.service';
import { ScheduleChangeDto } from '@/work-schedules/dto/admin/schedule-change.dto';
import { ApplyScheduleChangeDto } from '@/work-schedules/dto/admin/apply-schedule-change.dto';
import {
  ScheduleChangeImpact,
  ScheduleChangeIntent,
  ScheduleChangeResult,
} from '@/work-schedules/domain/schedule-change';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/** Map the validated DTO to the domain intent (narrow the day_of_week + mode types). */
export function toIntent(dto: ScheduleChangeDto): ScheduleChangeIntent {
  return {
    employee_id: dto.employee_id,
    day_of_week: dto.day_of_week as DayOfWeek,
    effective_from: dto.effective_from,
    mode: dto.mode,
    expected_in: dto.expected_in,
    expected_out: dto.expected_out,
    break_minutes: dto.break_minutes,
    break_start: dto.break_start ?? null,
  };
}

/**
 * Cascade-aware admin endpoints for changing/removing an existing employee
 * schedule. `preview` is the read-only dry-run; `apply` (Task 7) commits.
 *
 * Route gating is `SCHEDULE:Update`; a `mode: 'remove'` additionally requires
 * `SCHEDULE:Delete`, checked in the service (C2 — the static decorator can't
 * gate on the request body).
 */
@ApiTags('Admin - Work Schedules')
@ApiBearerAuth()
@Controller({ path: 'admin/work-schedules/changes', version: API_VERSION })
export class AdminScheduleChangesController {
  constructor(private readonly service: ScheduleChangeService) {}

  @Post('preview')
  @Permissions({ SCHEDULE: 'Update' })
  @ApiOperation({
    summary: 'Dry-run a schedule change — list the leave/correction requests it would auto-cancel',
    description:
      'Writes nothing. Returns the versioning action plus the requests that would be cancelled ' +
      '(with the governed trigger_dates) and the leave-days that would be freed. A mode=remove ' +
      'also requires SCHEDULE:Delete.',
  })
  @ApiResponse({ status: 201, type: ScheduleChangeImpact })
  preview(
    @Body() dto: ScheduleChangeDto,
    @CurrentUser() actor: User,
  ): Promise<ScheduleChangeImpact> {
    return this.service.preview(toIntent(dto), actor);
  }

  @Post()
  @Permissions({ SCHEDULE: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply a schedule change + auto-cancel cascade atomically',
    description:
      'Commits the versioning and cancels the affected requests in one transaction. Send the ' +
      'previewed (kind, id, status) snapshot; if the affected set changed since preview the ' +
      'call returns 409 and you must re-preview. A mode=remove also requires SCHEDULE:Delete.',
  })
  @ApiResponse({ status: 200, type: ScheduleChangeResult })
  @ApiResponse({ status: 409, description: 'Affected set drifted since preview — re-preview.' })
  apply(
    @Body() dto: ApplyScheduleChangeDto,
    @CurrentUser() actor: User,
  ): Promise<ScheduleChangeResult> {
    return this.service.apply(toIntent(dto), actor, dto.previewed);
  }
}
