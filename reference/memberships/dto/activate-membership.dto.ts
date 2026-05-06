import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, ValidateIf } from 'class-validator';

export class ActivateMembershipDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Membership payment ID',
  })
  @IsInt()
  @Min(1)
  @ValidateIf((o) => !o.dragonpay_txn_id)
  membership_payment_id?: number;

  @ApiProperty({
    type: String,
    example: 'PAY-XXX',
    description:
      'DragonPay transaction ID (alternative to membership_payment_id)',
  })
  @IsString()
  @ValidateIf((o) => !o.membership_payment_id)
  dragonpay_txn_id?: string;
}
