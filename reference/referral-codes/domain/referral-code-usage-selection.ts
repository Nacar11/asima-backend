import { ApiProperty } from '@nestjs/swagger';

export class ReferralCodeUsageSelection {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  referral_code_usage_id: number;

  @ApiProperty({ type: Number })
  voucher_id: number;

  @ApiProperty({ type: Date })
  selected_at: Date;
}
