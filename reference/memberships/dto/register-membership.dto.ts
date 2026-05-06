import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

const MEMBERSHIP_PAYMENT_METHOD_CODES: readonly string[] = [
  'gcash',
  'maya',
  'paymaya',
  'paymaya_direct',
  'maya_qr',
  'unionbank_qr',
  'grabpay',
  'shopeepay',
  'bpi',
  'bdo',
  'unionbank',
  'metrobank',
  'instapay',
  'pesonet',
  '7eleven',
  'bayad',
  'cebuana',
  'mlhuillier',
  'ecpay',
  'credit_card',
] as const;

export class RegisterMembershipDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_id: number;
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  membership_plan_billing_period_id?: number;
  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  is_auto_renew_enabled?: boolean;
  @ApiProperty({
    enum: MEMBERSHIP_PAYMENT_METHOD_CODES,
    example: 'gcash',
  })
  @IsString()
  @IsEnum(MEMBERSHIP_PAYMENT_METHOD_CODES)
  payment_method_code: string;
  @ApiPropertyOptional({
    type: String,
    example: '203.177.12.34',
    description: 'Client IP address for membership payment context',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
