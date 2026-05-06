import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsOptional, Min } from 'class-validator';

/**
 * Create Payout Request DTO
 * Mirrors the payload DragonPayV2Service sends to POST {payoutUrl}/{merchantId}/post
 */
export class CreatePayoutRequestDto {
  @ApiProperty({
    description: 'Merchant transaction ID',
    example: 'TXN-M2QX1-ABC123',
  })
  @IsString()
  TxnId: string;

  @ApiProperty({ description: 'Recipient first name', example: 'Juan' })
  @IsString()
  FirstName: string;

  @ApiPropertyOptional({ description: 'Recipient middle name' })
  @IsString()
  @IsOptional()
  MiddleName?: string;

  @ApiProperty({ description: 'Recipient last name', example: 'Dela Cruz' })
  @IsString()
  LastName: string;

  @ApiProperty({ description: 'Payout amount', example: 500 })
  @IsNumber()
  @Min(1)
  Amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'PHP' })
  @IsString()
  @IsOptional()
  Currency?: string;

  @ApiProperty({
    description: 'Description of payout',
    example: 'Refund for order #123',
  })
  @IsString()
  Description: string;

  @ApiProperty({ description: 'Processor ID', example: 'BOG' })
  @IsString()
  ProcId: string;

  @ApiProperty({
    description: 'Account number or identifier',
    example: '1234567890',
  })
  @IsString()
  ProcDetail: string;

  @ApiPropertyOptional({ description: 'Run date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  RunDate?: string;

  @ApiProperty({ description: 'Recipient email', example: 'juan@example.com' })
  @IsEmail()
  Email: string;

  @ApiPropertyOptional({ description: 'Mobile number' })
  @IsString()
  @IsOptional()
  MobileNo?: string;

  @ApiPropertyOptional({ description: 'Birth date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  BirthDate?: string;

  @ApiPropertyOptional({ description: 'Nationality' })
  @IsString()
  @IsOptional()
  Nationality?: string;

  @ApiPropertyOptional({ description: 'Address object' })
  @IsOptional()
  Address?: Record<string, string>;
}

/**
 * Payout creation response — matches DragonPay's { Code, Message } format
 */
export class PayoutResponseDto {
  @ApiProperty({ description: 'Result code (0 = success)', example: 0 })
  Code: number;

  @ApiProperty({
    description: 'Reference number on success, error message on failure',
    example: 'DPREF-20260212-ABCD1234',
  })
  Message: string;
}
