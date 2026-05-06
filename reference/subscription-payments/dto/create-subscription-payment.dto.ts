import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  subscription_id: number;

  @ApiProperty({ type: Number, example: 499.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ type: String, example: '2025-12-12' })
  @IsDateString()
  billing_cycle_start: string;

  @ApiProperty({ type: String, example: '2026-01-12' })
  @IsDateString()
  billing_cycle_end: string;

  @ApiProperty({ type: String, example: '2025-12-19' })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({ type: String, example: 'gcash' })
  @IsOptional()
  @IsString()
  payment_method?: string;
}
