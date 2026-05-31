import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload for `POST /leave-requests/:id/reject`. A note is mandatory —
 * a rejection without a reason is unreviewable for the employee.
 */
export class RejectLeaveRequestDto {
  @ApiProperty({ example: 'Insufficient coverage that week.', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note!: string;
}
