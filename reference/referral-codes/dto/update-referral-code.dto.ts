import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';

export class UpdateReferralCodeDto {
  @ApiPropertyOptional({ enum: ReferralCodeStatusEnum })
  @IsOptional()
  @IsEnum(ReferralCodeStatusEnum)
  status?: ReferralCodeStatusEnum;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usage_limit?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
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

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  voucher_ids?: number[];
}
