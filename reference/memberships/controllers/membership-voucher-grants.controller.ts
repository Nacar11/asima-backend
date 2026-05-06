import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MembershipsService } from '@/memberships/memberships.service';
import { QueryMyMembershipVoucherGrantDto } from '@/memberships/dto/query-my-membership-voucher-grant.dto';
import { FindAllMembershipVoucherGrant } from '@/memberships/domain/find-all-membership-voucher-grant';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Membership')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'membership', version: '1' })
export class MembershipVoucherGrantsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * List current user's membership voucher grants.
   */
  @Get('voucher-grants')
  @ApiOperation({ summary: "List current user's membership voucher grants" })
  @ApiOkResponse({ type: Object })
  public findMyVoucherGrants(
    @Query() query: QueryMyMembershipVoucherGrantDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllMembershipVoucherGrant> {
    return this.membershipsService.findVoucherGrants({
      ...query,
      user_id: currentUser.id,
    });
  }
}
