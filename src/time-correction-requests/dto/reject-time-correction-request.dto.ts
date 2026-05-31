import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Payload for `POST /time-correction-requests/:id/reject`. Note required. */
export class RejectTimeCorrectionRequestDto {
  @ApiProperty({ example: 'The proposed time does not match the schedule.', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note!: string;
}
