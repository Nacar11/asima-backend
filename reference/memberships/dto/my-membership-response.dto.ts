import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Membership } from '@/memberships/domain/membership';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { ActivateMembershipVoucherGrantsGroupedDto } from '@/memberships/dto/activate-membership-voucher-grants-grouped.dto';

export class MyMembershipUserDto {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'John' })
  first_name: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  middle_name?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'Doe' })
  last_name: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  suffix?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'john.doe@cody.inc',
  })
  email?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, example: '+1234567890' })
  phone?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  image?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  profile_picture?: string | null;
}

export class MyMembershipResponseDto {
  @ApiPropertyOptional({ type: () => MyMembershipUserDto, nullable: true })
  user: MyMembershipUserDto | null;
  @ApiPropertyOptional({ type: Membership, nullable: true })
  membership: Membership | null;
  @ApiProperty({ type: Boolean })
  has_access: boolean;
  @ApiProperty({ type: () => [MembershipPayment] })
  membership_payments: MembershipPayment[];
  @ApiProperty({ type: ActivateMembershipVoucherGrantsGroupedDto })
  voucher_grants: ActivateMembershipVoucherGrantsGroupedDto;
}
