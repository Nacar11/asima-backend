import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompensationService } from '@/compensation/compensation.service';
import { Compensation } from '@/compensation/domain/compensation';
import { CreateCompensationDto } from '@/compensation/dto/admin/create-compensation.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Admin endpoints for managing ANY employee's compensation. Gated by the
 * dedicated `COMPENSATION:*` resource — HR-only, separate from `USER:*` so
 * ordinary admins never see pay. Read / correct / remove land with Tasks
 * 3–4; this controller carries the `POST` (set / change pay) only.
 *
 * Keeps the global `default` throttle — pay routes are not a hot typeahead
 * path, so they are NOT `@SkipThrottle()`d.
 */
@ApiTags('Admin - Compensation')
@ApiBearerAuth()
@Controller({ path: 'admin/compensation', version: API_VERSION })
export class AdminCompensationController {
  constructor(private readonly service: CompensationService) {}

  @Post()
  @Permissions({ COMPENSATION: 'Create' })
  @ApiOperation({
    summary: "Set / change an employee's compensation",
    description:
      'Effective-dated and one-step: the prior active row is auto-end-dated and the new row ' +
      'inserted in one transaction. effective_from cannot be in the future and must be after ' +
      "the current rate's effective_from. Omit hourly_rate to derive it from monthly_salary.",
  })
  @ApiResponse({ status: 201, type: Compensation })
  create(@Body() dto: CreateCompensationDto, @CurrentUser() actor: User): Promise<Compensation> {
    return this.service.create({ ...dto, created_by: actor.id });
  }
}
