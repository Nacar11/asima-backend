import {
  IsNumber,
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DragonpayBillingDetailsDto } from './dragonpay-billing-details.dto';

export class CreateDragonpayPaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'PHP';

  @IsString()
  description: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  procId?: string;

  @IsString()
  @IsOptional()
  param1?: string;

  @IsString()
  @IsOptional()
  param2?: string;

  @IsString()
  @IsOptional()
  expiry?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DragonpayBillingDetailsDto)
  @IsOptional()
  billingDetails?: DragonpayBillingDetailsDto;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
