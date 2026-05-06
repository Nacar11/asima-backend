import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSellerCertificationDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID this certification belongs to',
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'AWS Solutions Architect',
    description: 'Name of the certification',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Amazon Web Services',
    description: 'Issuing organization',
  })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/cert-image.jpg',
    description: 'URL to certification image',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'AWS-123456',
    description: 'Credential ID or certificate number',
  })
  @IsOptional()
  @IsString()
  credential_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://aws.amazon.com/verification/123456',
    description: 'URL to verify the certification',
  })
  @IsOptional()
  @IsString()
  credential_url?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2023-01-15',
    description: 'Date the certification was issued',
  })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-01-15',
    description: 'Expiration date of the certification',
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({
    type: String,
    enum: ['Active', 'Expired', 'Revoked'],
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsEnum(['Active', 'Expired', 'Revoked'])
  status?: string;
}
