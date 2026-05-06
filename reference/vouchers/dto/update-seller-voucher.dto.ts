import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

/**
 * DTO for updating seller vouchers.
 * Scope-entry arrays (`category_ids`, etc.) represent the desired final set of
 * eligible items for the voucher's current scope. The service diffs against the
 * existing set and enforces the append-only policy (see docs §5/§7.1) when the
 * voucher already has at least one claimed `user_voucher`.
 */
export class UpdateSellerVoucherDto {
  @ApiPropertyOptional({ enum: VoucherStatusEnum })
  @IsOptional()
  @IsEnum(VoucherStatusEnum)
  status?: VoucherStatusEnum;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  is_claimable?: boolean;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Extend-only after first claim. New value must be >= current expires_at.' })
  @IsOptional()
  @IsDateString()
  expires_at?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  include_addons_flag?: boolean | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description:
      'Increase-only after first redemption. Must be >= current used_count.',
  })
  @IsOptional()
  @ValidateIf((o) => o.total_limit !== null)
  @IsInt()
  @Min(1)
  total_limit?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description:
      'Increase-only after first redemption. Must be >= max per-user redemption count.',
  })
  @IsOptional()
  @ValidateIf((o) => o.per_user_limit !== null)
  @IsInt()
  @Min(1)
  per_user_limit?: number | null;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  category_ids?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  product_ids?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  service_category_ids?: number[];
}
