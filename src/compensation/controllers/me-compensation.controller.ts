import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompensationService } from '@/compensation/compensation.service';
import { Compensation } from '@/compensation/domain/compensation';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Permissions } from '@/permissions/permissions.decorator';
import { API_VERSION } from '@/utils/constants/api.constants';
import { User } from '@/users/domain/user';

/**
 * Self-service: an employee can see their OWN current compensation,
 * read-only. Gated by `COMPENSATION:ViewOwn` (matches the leave /
 * time-correction me-routes), the query is force-scoped to `req.user.id`
 * so it can never read another employee's pay. There is intentionally no
 * write surface — only HR changes compensation on `/admin/compensation`.
 */
@ApiTags('Compensation')
@ApiBearerAuth()
@Controller({ path: 'users/me/compensation', version: API_VERSION })
export class MeCompensationController {
  constructor(private readonly service: CompensationService) {}

  @Get()
  @Permissions({ COMPENSATION: 'ViewOwn' })
  @ApiOperation({
    summary: 'Get my current compensation',
    description: 'Returns my active rate, or null when none is set yet (new hire).',
  })
  @ApiResponse({ status: 200, type: Compensation })
  myCompensation(@CurrentUser() actor: User): Promise<Compensation | null> {
    return this.service.findCurrentForEmployee(actor.id);
  }
}
