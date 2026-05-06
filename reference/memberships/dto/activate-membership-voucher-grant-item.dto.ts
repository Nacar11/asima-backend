import { ApiProperty } from '@nestjs/swagger';
import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { ActivateMembershipVoucherLinkedCategoryDto } from '@/memberships/dto/activate-membership-voucher-linked-category.dto';
import { ActivateMembershipVoucherLinkedProductDto } from '@/memberships/dto/activate-membership-voucher-linked-product.dto';

export class ActivateMembershipVoucherGrantItemDto {
  @ApiProperty({ type: MembershipVoucherGrant })
  grant: MembershipVoucherGrant;
  @ApiProperty({ type: Number, example: 1 })
  voucher_id: number;
  @ApiProperty({ type: String, example: 'ADMNFIX80' })
  voucher_code: string;
  @ApiProperty({ enum: VoucherScopeEnum, example: VoucherScopeEnum.CATEGORIES })
  voucher_scope: VoucherScopeEnum;
  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Quantity of unique grants by voucher_code',
  })
  granted: number;
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Number of grants already redeemed by the user',
  })
  used: number;
  @ApiProperty({
    type: String,
    nullable: true,
    required: false,
    example: 'Membership court usage voucher (1 hour)',
    description: 'Voucher description for display purposes',
  })
  voucher_description?: string | null;
  @ApiProperty({
    type: () => [ActivateMembershipVoucherLinkedCategoryDto],
    required: false,
  })
  categories?: ActivateMembershipVoucherLinkedCategoryDto[];
  @ApiProperty({
    type: () => [ActivateMembershipVoucherLinkedProductDto],
    required: false,
  })
  products?: ActivateMembershipVoucherLinkedProductDto[];
}
