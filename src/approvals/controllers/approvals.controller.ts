import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApprovalsService } from '@/approvals/approvals.service';
import { FindPendingApprovals } from '@/approvals/domain/find-pending-approvals';
import { QueryPendingApprovalsDto } from '@/approvals/dto/query-pending-approvals.dto';
import { Permissions } from '@/permissions/permissions.decorator';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { API_VERSION } from '@/utils/constants/api.constants';

/**
 * Cross-resource approvals inbox. Identity comes from the JWT, never the URL —
 * `req.user.id` is what the service filters on when the caller lacks
 * `APPROVAL:ApproveAny`.
 *
 * Path is `/approvals` (not `/admin/approvals`) because the page is gated
 * by permission, not by being an admin surface — HR's wider view is a
 * permission concern (`APPROVAL:ApproveAny`), not a URL concern.
 */
@ApiTags('Approvals')
@ApiBearerAuth()
@Controller({ path: 'approvals', version: API_VERSION })
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get('pending')
  @Permissions({ APPROVAL: 'View' })
  @ApiOperation({
    summary:
      'List approvals where the caller is the current approver (or all, if APPROVAL:ApproveAny).',
  })
  @ApiResponse({ status: 200, description: 'Paginated pending-approvals list' })
  findPending(
    @CurrentUser() user: User,
    @Query() query: QueryPendingApprovalsDto,
  ): Promise<FindPendingApprovals> {
    return this.service.findPending(user, query);
  }
}
