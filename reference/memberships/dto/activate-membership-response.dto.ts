import { ApiProperty } from '@nestjs/swagger';
import { Membership } from '@/memberships/domain/membership';
import { ActivateMembershipVoucherGrantsGroupedDto } from '@/memberships/dto/activate-membership-voucher-grants-grouped.dto';

export class ActivateMembershipResponseDto {
  @ApiProperty({ type: Membership })
  membership: Membership;
  @ApiProperty({ type: ActivateMembershipVoucherGrantsGroupedDto })
  voucher_grants: ActivateMembershipVoucherGrantsGroupedDto;
}
