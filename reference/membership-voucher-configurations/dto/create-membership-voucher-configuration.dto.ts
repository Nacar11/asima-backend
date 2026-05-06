import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateMembershipVoucherConfigurationDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_id: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  voucher_id: number;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  is_active?: boolean;
}
