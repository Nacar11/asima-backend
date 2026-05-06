import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for cancelling an order
 */
export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Changed my mind',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
