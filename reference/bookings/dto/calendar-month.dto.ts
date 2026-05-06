import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO for querying calendar month data.
 *
 * @version 1
 * @since 1.0.0
 */
export class CalendarMonthDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-12',
    pattern: '^\\d{4}-\\d{2}$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Month must be in YYYY-MM format',
  })
  month: string;
}
