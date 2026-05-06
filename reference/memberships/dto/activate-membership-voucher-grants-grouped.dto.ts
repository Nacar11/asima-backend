import { ApiProperty } from '@nestjs/swagger';
import { ActivateMembershipVoucherGrantItemDto } from '@/memberships/dto/activate-membership-voucher-grant-item.dto';

export class ActivateMembershipVoucherGrantsGroupedDto {
  @ApiProperty({ type: () => [ActivateMembershipVoucherGrantItemDto] })
  global: ActivateMembershipVoucherGrantItemDto[];
  @ApiProperty({ type: () => [ActivateMembershipVoucherGrantItemDto] })
  categories: ActivateMembershipVoucherGrantItemDto[];
  @ApiProperty({ type: () => [ActivateMembershipVoucherGrantItemDto] })
  products: ActivateMembershipVoucherGrantItemDto[];
}
