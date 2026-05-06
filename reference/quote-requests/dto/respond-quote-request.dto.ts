import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsInt,
  IsPositive,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Quote breakdown item for detailed pricing.
 */
export class QuoteBreakdownItemDto {
  @ApiProperty({ type: String, example: 'Aircon Unit Cleaning' })
  @IsNotEmpty()
  @IsString()
  item: string;

  @ApiPropertyOptional({ type: String, example: 'Deep cleaning of 3 units' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: Number, example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ type: Number, example: 1500.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiProperty({ type: Number, example: 4500.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;
}

/**
 * DTO for seller to respond to a quote request with pricing.
 *
 * @version 1
 * @since 1.0.0
 */
export class RespondQuoteRequestDto {
  @ApiProperty({
    type: Number,
    example: 4500.0,
    description: 'Total quoted price',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quoted_price: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Currency ID for the quote',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  currency_id?: number;

  @ApiProperty({
    type: String,
    example:
      'Based on your requirements for 3 split-type aircon units, the total cost includes deep cleaning and filter replacement...',
    description: 'Detailed explanation of the quote',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  seller_response: string;

  @ApiPropertyOptional({
    type: [QuoteBreakdownItemDto],
    description: 'Detailed breakdown of quote items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteBreakdownItemDto)
  quote_breakdown?: QuoteBreakdownItemDto[];

  @ApiPropertyOptional({
    type: Number,
    example: 120,
    description: 'Estimated duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    type: String,
    example: '2025-02-01',
    description: 'Quote expiry date (YYYY-MM-DD). Default: 7 days from now.',
  })
  @IsOptional()
  @IsDateString()
  quote_expires_at?: string;
}

/**
 * DTO for customer to respond to a quote (accept/reject).
 *
 * @version 1
 * @since 1.0.0
 */
export class CustomerRespondQuoteDto {
  @ApiProperty({
    type: String,
    enum: ['accept', 'reject', 'revision_requested'],
    example: 'accept',
    description: 'Customer decision on the quote',
  })
  @IsNotEmpty()
  @IsString()
  action: 'accept' | 'reject' | 'revision_requested';

  @ApiPropertyOptional({
    type: String,
    example: 'The price is too high for my budget.',
    description: 'Optional response/feedback from customer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_response?: string;

  // ==================== Booking Details (if accepting) ====================

  @ApiPropertyOptional({
    type: String,
    example: '2025-02-15',
    description: 'Scheduled date for the booking (required if accepting)',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional({
    type: String,
    example: '09:00:00',
    description: 'Scheduled time for the booking (required if accepting)',
  })
  @IsOptional()
  @IsString()
  scheduled_time?: string;
}
