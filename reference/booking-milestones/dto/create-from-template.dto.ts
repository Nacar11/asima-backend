import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

/**
 * DTO for creating booking milestones from service milestone templates.
 *
 * Used when creating milestones for a booking based on service templates.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateFromTemplateDto {
  @ApiProperty({
    description: 'Booking ID to create milestones for',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  booking_id: number;
}
