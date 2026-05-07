import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeEntry } from '@/time-entries/domain/time-entry';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { QueryMyTimeEntryDto } from '@/time-entries/dto/me/query-my-time-entry.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service endpoints. Audience: every authenticated user.
 *
 * Identity comes from `req.user.id`, NEVER from a path parameter — there
 * is intentionally no `:id` segment on any route here. The me-controller
 * scopes every result to the actor; admins must use `/admin/time-entries`
 * to act on someone else.
 *
 * Authentication is enforced by the global `JwtAuthGuard`; no
 * `@Permissions(...)` here — identity is the gate.
 */
@ApiTags('Time Entries')
@ApiBearerAuth()
@Controller({ path: 'users/me/time-entries', version: API_VERSION })
export class MeTimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Post('punch')
  @ApiOperation({
    summary: 'Toggle punch in / punch out',
    description:
      'Single endpoint: if the caller has an open entry, it gets closed (time_out=now, ' +
      'status=confirmed). Otherwise a new open entry is created (time_in=now, source=manual). ' +
      'The DB-level partial unique index prevents two concurrent punches from creating ' +
      'duplicate open entries — the loser is mapped to 409.',
  })
  @ApiResponse({ status: 201, description: 'Created (open) or closed (confirmed) entry' })
  punch(@CurrentUser() actor: User): Promise<TimeEntry> {
    return this.service.punch(actor);
  }

  @Get()
  @ApiOperation({
    summary: 'List my own time entries (paginated, filterable by date range)',
  })
  @ApiResponse({ status: 200 })
  findMine(
    @Query() query: QueryMyTimeEntryDto,
    @CurrentUser() actor: User,
  ): Promise<FindAllTimeEntry> {
    return this.service.findAll({ ...query, employee_id: actor.id });
  }

  @Get('today')
  @ApiOperation({
    summary: 'List my time entries for today (server-side date)',
    description:
      "Convenience endpoint — equivalent to GET /users/me/time-entries?from=<today>&to=<today>. " +
      'Uses the server clock so all employees agree on what "today" means.',
  })
  @ApiResponse({ status: 200 })
  async today(@CurrentUser() actor: User): Promise<FindAllTimeEntry> {
    const today = new Date().toISOString().slice(0, 10);
    return this.service.findAll({ employee_id: actor.id, from: today, to: today });
  }
}
