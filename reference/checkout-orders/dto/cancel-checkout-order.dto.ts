import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for cancelling a checkout order.
 */
export class CancelCheckoutOrderDto {
  @ApiProperty({
    type: String,
    description: 'Reason for cancellation',
    example: 'Changed my mind',
  })
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Additional details about the cancellation',
    example: 'Found a better deal elsewhere',
  })
  @IsOptional()
  @IsString()
  cancellation_details?: string;
}
