import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Query DTO for seller availability check.
 */
export class QuerySellerAvailabilityDto {
  @ApiProperty({
    description: 'Date to check availability for (YYYY-MM-DD)',
    example: '2025-12-25',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Start time to check (HH:mm or HH:mm:ss)',
    example: '10:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time: string;

  @ApiProperty({
    description: 'End time to check (HH:mm or HH:mm:ss)',
    example: '11:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time: string;

  @ApiPropertyOptional({
    description: 'Member ID to check availability for',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  member_id?: number;
}

/**
 * Response DTO for seller availability.
 */
export class SellerAvailabilityResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the seller is available',
  })
  is_available: boolean;

  @ApiPropertyOptional({
    example: '2025-12-25',
    description: 'Date checked',
  })
  date: string;

  @ApiPropertyOptional({
    description: 'Store schedule for the day',
    example: { start_time: '09:00', end_time: '18:00' },
  })
  schedule?: {
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
  };

  @ApiPropertyOptional({
    description: 'Unavailability periods for the day',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        start_time: { type: 'string' },
        end_time: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  })
  unavailability?: Array<{
    start_time: string;
    end_time: string;
    reason?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Reason if not available',
  })
  reason?: string;
}
