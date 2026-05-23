import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkSchedulesService } from '@/work-schedules/work-schedules.service';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service: every authenticated user can see their own active
 * weekly schedule.
 *
 * Returns 0..7 rows (one per active weekday). Mutations belong to
 * HR / admins on `/admin/work-schedules` — there is intentionally no
 * `PATCH /users/me/work-schedule` endpoint.
 *
 * Authentication is enforced by the global `JwtAuthGuard`; identity is
 * the gate (no `@Permissions(...)`).
 */
@ApiTags('Work Schedules')
@ApiBearerAuth()
@Controller({ path: 'users/me/work-schedule', version: API_VERSION })
export class MeWorkSchedulesController {
  constructor(private readonly service: WorkSchedulesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get my active weekly schedule',
    description:
      'Returns my active rows (effective_to IS NULL), ordered Sun..Sat. Use this to render the ' +
      '"my hours this week" widget on the frontend.',
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/WorkSchedule' } },
  })
  mySchedule(@CurrentUser() actor: User): Promise<WorkSchedule[]> {
    return this.service.findActiveForEmployee(actor.id);
  }
}
