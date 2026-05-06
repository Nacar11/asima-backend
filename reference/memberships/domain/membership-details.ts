import { ApiProperty } from '@nestjs/swagger';
import { Membership } from '@/memberships/domain/membership';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';

/**
 * Membership details payload for admin view.
 */
export class MembershipDetails {
  @ApiProperty({ type: Membership })
  membership: Membership;
  @ApiProperty({ type: () => [MembershipPayment] })
  payment_history: MembershipPayment[];
  @ApiProperty({ type: () => [MembershipVoucherGrant] })
  voucher_issuance_log: MembershipVoucherGrant[];
}
