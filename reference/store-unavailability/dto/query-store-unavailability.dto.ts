import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query Store Unavailability DTO.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
export class QueryStoreUnavailabilityDto {
  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 101,
    description: 'Filter by service/venue scope',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2025-12-24' })
  @IsOptional()
  @IsDateString()
  unavailable_date?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_full_day?: boolean;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ type: Number, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;
}
