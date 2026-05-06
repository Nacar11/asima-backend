import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for requesting revision on a milestone.
 *
 * Used when customer rejects a submitted milestone and requests changes.
 *
 * @version 1
 * @since 1.0.0
 */
export class RequestRevisionDto {
  @ApiProperty({
    description: 'Rejection reason and revision requirements',
    example: 'Please add more details to the design',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  rejection_reason: string;
}
