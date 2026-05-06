import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  DragonPayCurrencyEnum,
  DragonPayModeEnum,
} from '../enums/dragonpay-processor.enum';

/**
 * Create Payment Request DTO
 * Based on DragonPay Payment Switch API v2.26 Section 5.2
 */
export class CreatePaymentRequestDto {
  @ApiProperty({
    type: String,
    description:
      'Unique transaction ID (up to 40 chars, alphanumeric, dashes, periods)',
    example: 'TXN-20260102-0001',
    maxLength: 40,
  })
  @IsString()
  @Length(1, 40)
  txnid: string;

  @ApiProperty({
    type: Number,
    description: 'Transaction amount',
    example: 1000.0,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(1000000)
  amount: number;

  @ApiProperty({
    enum: DragonPayCurrencyEnum,
    description: 'Currency code',
    example: DragonPayCurrencyEnum.PHP,
    default: DragonPayCurrencyEnum.PHP,
  })
  @IsEnum(DragonPayCurrencyEnum)
  ccy: DragonPayCurrencyEnum;

  @ApiProperty({
    type: String,
    description: 'Transaction description (up to 128 chars)',
    example: 'Payment for booking #123',
    maxLength: 128,
  })
  @IsString()
  @Length(1, 128)
  description: string;

  @ApiProperty({
    type: String,
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer first name',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer last name',
    example: 'Dela Cruz',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer address line 1',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer address line 2',
    example: 'Barangay Sample',
  })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'City',
    example: 'Manila',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'State/Province',
    example: 'Metro Manila',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Country',
    example: 'PH',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Postal/ZIP code',
    example: '1000',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer telephone number',
    example: '+639171234567',
  })
  @IsOptional()
  @IsString()
  telNo?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Pre-select payment processor/channel (e.g. GCSH, PYMY, CC, BOG, etc.)',
    example: 'GCSH',
  })
  @IsOptional()
  @IsString()
  procId?: string;

  @ApiPropertyOptional({
    enum: DragonPayModeEnum,
    description: 'Payment mode filter (online/offline)',
    example: DragonPayModeEnum.ONLINE,
  })
  @IsOptional()
  @IsEnum(DragonPayModeEnum)
  mode?: DragonPayModeEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'URL to redirect after payment',
    example: 'https://yourapp.com/payment/success',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'URL to redirect on cancellation',
    example: 'https://yourapp.com/payment/cancel',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'URL for server-to-server callback (webhook)',
    example: 'https://yourapp.com/api/v1/dragonpay-dummy/postback',
  })
  @IsOptional()
  @IsString()
  postbackUrl?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 1 (stored with transaction)',
    example: '{"booking_id": 123}',
  })
  @IsOptional()
  @IsString()
  param1?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Custom parameter 2 (stored with transaction)',
  })
  @IsOptional()
  @IsString()
  param2?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Customer mobile number (required for e-wallet payments)',
    example: '09171234567',
  })
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Public base URL to use when generating the dummy pay page URL (useful for emulators/devices)',
    example: 'http://10.0.2.2:4080',
  })
  @IsOptional()
  @IsString()
  publicBaseUrl?: string;
}
