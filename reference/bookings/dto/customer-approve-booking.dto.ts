import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsNumber,
} from 'class-validator';

/**
 * DTO for customer approval of a completed booking.
 *
 * Allows customers to confirm satisfaction with the service
 * and optionally provide feedback/rating.
 */
export class CustomerApproveBookingDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Optional feedback from the customer',
    example: 'Great service, very professional!',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Optional rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
