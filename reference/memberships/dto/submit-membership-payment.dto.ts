import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitMembershipPaymentDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_id: number;

  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_billing_period_id: number;

  @ApiProperty({ type: String, example: 'gcash' })
  @IsString()
  payment_method_code: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  payment_reference?: string;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_auto_renew_enabled?: boolean;
}
