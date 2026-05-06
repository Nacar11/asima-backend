import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';
import { Transform } from 'class-transformer';
import { CreatePickleballMerchantApplicationCourtDto } from '@/pickleball-merchants/dto/create-pickleball-merchant-application-court.dto';

export class CreatePickleballMerchantApplicationDto {
  @ApiProperty({ example: 'Ace Smash Sports Center' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  merchant_name: string;

  @ApiPropertyOptional({ example: 'Ace Smash Liloan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location_name?: string;

  @ApiPropertyOptional({ example: 'Community pickleball venue with 4 courts.' })
  @IsOptional()
  @IsString()
  merchant_description?: string;

  @ApiPropertyOptional({ example: 'Juan Dela Cruz' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact_name?: string;

  @ApiPropertyOptional({ example: '+639171234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact_phone?: string;

  @ApiProperty({ example: 'owner@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  owner_email: string;

  @ApiProperty({ example: 'approver@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  approver_email: string;

  @ApiPropertyOptional({ example: 'National Highway, Poblacion' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line?: string;

  @ApiPropertyOptional({ example: 'Cebu' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ example: 'Liloan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Poblacion' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barangay?: string;

  @ApiPropertyOptional({ example: '6002' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiPropertyOptional({ example: 10.399 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 123.999 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
    description:
      'Merchant-provided GCash QR image as a data URI or raw base64 string.',
  })
  @IsString()
  @IsNotEmpty()
  gcash_qr_image_base64: string;

  @ApiProperty({ type: () => [CreatePickleballMerchantApplicationCourtDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePickleballMerchantApplicationCourtDto)
  courts: CreatePickleballMerchantApplicationCourtDto[];
}
