import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

/**
 * DTO for assigning a member to a booking.
 *
 * Used when assigning a seller member to handle a booking.
 *
 * @version 1
 * @since 1.0.0
 */
export class AssignMemberDto {
  @ApiProperty({
    description: 'Seller member ID to assign to the booking',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  assigned_member_id: number;
}
