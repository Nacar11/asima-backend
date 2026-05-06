import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating a booking milestone.
 *
 * Used when creating milestones manually or from templates.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateBookingMilestoneDto {
  @ApiProperty({
    description: 'Booking ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  booking_id: number;

  @ApiPropertyOptional({
    description: 'Service milestone template ID (if creating from template)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  template_id?: number;

  @ApiProperty({
    description: 'Milestone name',
    example: 'Initial Consultation',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Milestone description',
    example: 'Complete initial consultation with customer',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Sequence order (1, 2, 3, ...)',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  sequence_order: number;

  @ApiProperty({
    description: 'Payment percentage (0-100)',
    example: 30.0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  payment_percent: number;

  @ApiProperty({
    description: 'Payment amount',
    example: 450.0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  payment_amount: number;
}
