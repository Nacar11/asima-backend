import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RenewMembershipDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_id?: number;
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_billing_period_id?: number;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  payment_method_code?: string;
}
