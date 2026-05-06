import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Matches,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CheckoutSourceEnum } from '@/sales-orders/domain/checkout-source.enum';
import { Type } from 'class-transformer';

/**
 * Schedule override for a specific quotation item.
 */
export class ItemScheduleOverrideDto {
  @ApiProperty({ example: 1, description: 'Quotation item ID' })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quotation_item_id: number;

  @ApiProperty({ example: '2026-02-20', description: 'New scheduled date' })
  @IsNotEmpty()
  @IsDateString()
  scheduled_date: string;

  @ApiPropertyOptional({ example: '10:00:00', description: 'Start time' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_start_time must be in HH:mm:ss format',
  })
  scheduled_start_time?: string;
}

/**
 * DTO for processing quotation checkout.
 */
export class ProcessQuotationCheckoutDto {
  @ApiProperty({
    example: 'card',
    description: 'Payment method: card, gcash, maya, bank_transfer',
  })
  @IsNotEmpty()
  @IsString()
  payment_method: string;

  @ApiPropertyOptional({
    example: 'pm_123456',
    description: 'Payment method token from payment gateway',
  })
  @IsOptional()
  @IsString()
  payment_method_token?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Service address ID (if different from quotation)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    type: [ItemScheduleOverrideDto],
    description: 'Override schedule for specific items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemScheduleOverrideDto)
  schedule_overrides?: ItemScheduleOverrideDto[];

  @ApiPropertyOptional({
    example: 'Please call before arriving',
    description: 'Additional notes for the order',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Checkout source platform',
    enum: CheckoutSourceEnum,
    example: CheckoutSourceEnum.ETRAVAJOE,
  })
  @IsOptional()
  @IsEnum(CheckoutSourceEnum)
  checkout_source?: CheckoutSourceEnum;
}

/**
 * Response for successful quotation checkout.
 */
export class QuotationCheckoutResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1, description: 'Created sales order ID' })
  sales_order_id: number;

  @ApiProperty({ example: 'SO-20260124-1234' })
  order_number: string;

  @ApiProperty({
    type: [Number],
    description: 'IDs of created/updated bookings',
  })
  booking_ids: number[];

  @ApiProperty({ example: 1, description: 'Quotation ID that was processed' })
  quotation_id: number;

  @ApiProperty({ example: 17000.0, description: 'Total amount charged' })
  total_amount: number;

  @ApiProperty({ example: 'paid', description: 'Payment status' })
  payment_status: string;

  @ApiPropertyOptional({ example: 'pi_123456' })
  payment_intent_id?: string;

  @ApiProperty({ example: 'Quotation checkout completed successfully' })
  message: string;
}
