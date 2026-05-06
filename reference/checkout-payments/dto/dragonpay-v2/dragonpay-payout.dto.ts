import {
  IsNumber,
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';

export class DragonpayPayoutAddressDto {
  @IsString()
  @IsOptional()
  address1?: string; // Maps to Street1

  @IsString()
  @IsOptional()
  address2?: string; // Maps to Street2

  @IsString()
  @IsOptional()
  barangay?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string; // Maps to Province (DragonPay spec)

  @IsString()
  @IsOptional()
  country?: string; // ISO country code (default: PH)
}

export class DragonpayPayoutDto {
  @IsString()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'PHP';

  @IsString()
  description: string;

  @IsString()
  procId: string;

  @IsString()
  procDetail: string;

  @IsString()
  @IsOptional()
  runDate?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  mobileNo?: string;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsObject()
  @IsOptional()
  address?: DragonpayPayoutAddressDto;
}
