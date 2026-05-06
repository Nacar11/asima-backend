import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUppercase,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';

export class CreateReferralCodeDto {
  @ApiProperty({ type: String, example: 'FREECOFFEE' })
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'code must contain only uppercase letters and digits',
  })
  code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  voucher_ids?: number[];

  @ApiProperty({ enum: ReferralCodeSelectionModeEnum })
  @IsEnum(ReferralCodeSelectionModeEnum)
  selection_mode: ReferralCodeSelectionModeEnum;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usage_limit?: number | null;

  @ApiPropertyOptional({ enum: ReferralCodeStatusEnum, default: ReferralCodeStatusEnum.ACTIVE })
  @IsOptional()
  @IsEnum(ReferralCodeStatusEnum)
  status?: ReferralCodeStatusEnum;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @ValidateIf((o) => o.selection_mode === ReferralCodeSelectionModeEnum.USER_SELECTION)
  @IsInt()
  @Min(1)
  @Type(() => Number)
  max_voucher_selections?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  selection_timeout_hours?: number | null;
}
