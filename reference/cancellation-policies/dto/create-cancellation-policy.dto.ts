import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateCancellationPolicyDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Seller ID (null for platform default)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  seller_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Service ID (null for all services)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  service_id?: number;

  @ApiProperty({ type: String, example: 'Standard Policy' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: Number,
    example: 48,
    description: 'Hours before booking for 100% refund',
  })
  @IsNumber()
  @Min(0)
  free_cancel_hours: number;

  @ApiProperty({
    type: Number,
    example: 24,
    description: 'Hours before booking for partial refund',
  })
  @IsNumber()
  @Min(0)
  partial_cancel_hours: number;

  @ApiProperty({
    type: Number,
    example: 50,
    description: 'Refund percentage for partial cancellation',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  partial_cancel_percent: number;

  @ApiPropertyOptional({
    type: Number,
    example: 100,
    default: 100,
    description: 'No-show charge percentage',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  no_show_charge_percent?: number;
}
