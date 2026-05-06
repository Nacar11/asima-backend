import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * DTO for admin refund action.
 *
 * @version 1
 * @since 1.0.0
 */
export class AdminRefundDto {
  @ApiProperty({
    type: Number,
    example: 1000.0,
    description: 'Refund amount',
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    type: String,
    example: 'Admin-initiated refund due to service issue',
    description: 'Refund reason',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Whether to notify customer',
    default: true,
  })
  @IsOptional()
  notify_customer?: boolean;
}
