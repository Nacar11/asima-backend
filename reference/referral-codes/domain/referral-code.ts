import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';

export class ReferralCode {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, example: 'FREECOFFEE' })
  code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ enum: ReferralCodeStatusEnum })
  status: ReferralCodeStatusEnum;

  @ApiPropertyOptional({ type: Number, nullable: true })
  usage_limit: number | null;

  @ApiProperty({ type: Number, default: 0 })
  usage_count: number;

  @ApiPropertyOptional({ type: Date, nullable: true })
  expires_at: Date | null;

  @ApiProperty({ enum: ReferralCodeSelectionModeEnum })
  selection_mode: ReferralCodeSelectionModeEnum;

  @ApiPropertyOptional({ type: Number, nullable: true })
  max_voucher_selections: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  selection_timeout_hours: number | null;

  /** Populated from referral_code_vouchers relation. */
  voucher_ids: number[];

  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  isValid(now: Date = new Date()): boolean {
    return (
      this.status === ReferralCodeStatusEnum.ACTIVE &&
      (this.expires_at === null || this.expires_at > now) &&
      (this.usage_limit === null || this.usage_count < this.usage_limit)
    );
  }
}
