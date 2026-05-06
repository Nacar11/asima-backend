import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  DragonPayCurrencyEnum,
  DragonPayModeEnum,
} from '../enums/dragonpay-processor.enum';

/**
 * Get Available Processors Request DTO
 * Based on DragonPay Payment Switch API v2.26 Section 7.2.2
 */
export class GetProcessorsDto {
  @ApiProperty({
    type: Number,
    description: 'Transaction amount to check available processors',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiPropertyOptional({
    enum: DragonPayCurrencyEnum,
    description: 'Currency code filter',
    example: DragonPayCurrencyEnum.PHP,
    default: DragonPayCurrencyEnum.PHP,
  })
  @IsOptional()
  @IsEnum(DragonPayCurrencyEnum)
  ccy?: DragonPayCurrencyEnum;

  @ApiPropertyOptional({
    enum: DragonPayModeEnum,
    description: 'Payment mode filter (online/offline)',
    example: DragonPayModeEnum.ONLINE,
  })
  @IsOptional()
  @IsEnum(DragonPayModeEnum)
  mode?: DragonPayModeEnum;
}

/**
 * Processor DTO
 * Individual payment processor/channel information
 */
export class ProcessorDto {
  @ApiProperty({
    type: String,
    description: 'Processor ID',
    example: 'GCSH',
  })
  procId: string;

  @ApiProperty({
    type: String,
    description: 'Short name',
    example: 'GCash',
  })
  shortName: string;

  @ApiProperty({
    type: String,
    description: 'Long/full name',
    example: 'GCash Mobile Payment',
  })
  longName: string;

  @ApiProperty({
    type: String,
    description: 'Logo URL',
    example: 'https://dragonpay.ph/logos/gcash.png',
  })
  logo: string;

  @ApiProperty({
    type: [String],
    description: 'Supported currencies',
    example: ['PHP'],
  })
  currencies: string[];

  @ApiProperty({
    type: Boolean,
    description: 'Is real-time processing',
    example: true,
  })
  realTime: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Requires PIN',
    example: false,
  })
  hasPin: boolean;

  @ApiProperty({
    type: Number,
    description: 'Minimum processing days',
    example: 0,
  })
  dayMin: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum processing days',
    example: 1,
  })
  dayMax: number;

  @ApiProperty({
    type: Number,
    description: 'Minimum amount',
    example: 1,
  })
  amtMin: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum amount',
    example: 50000,
  })
  amtMax: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Remarks',
  })
  remarks?: string;

  @ApiProperty({
    type: Number,
    description: 'Transaction cost/fee percentage',
    example: 2.5,
  })
  cost: number;

  @ApiProperty({
    type: String,
    description: 'Payment type (e-wallet, bank, otc)',
    example: 'e-wallet',
  })
  type: string;
}

/**
 * Get Processors Response DTO
 */
export class GetProcessorsResponseDto {
  @ApiProperty({
    type: [ProcessorDto],
    description: 'Available payment processors',
  })
  processors: ProcessorDto[];
}
