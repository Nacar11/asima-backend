import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';
import { User } from '@/users/domain/user';

export class ReferralCodeUsage {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  referral_code_id: number;

  @ApiProperty({ type: Number })
  user_id: number;

  @ApiProperty({ enum: ReferralCodeUsageSelectionStatusEnum })
  selection_status: ReferralCodeUsageSelectionStatusEnum;

  @ApiPropertyOptional({ type: Date, nullable: true })
  selection_deadline: Date | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: () => User })
  user?: User;
}
