import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO for querying day schedule data.
 *
 * @version 1
 * @since 1.0.0
 */
export class DayScheduleDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-12-25',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;
}
