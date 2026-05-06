import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO for creating a shipping distance tier
 */
export class CreateDistanceTierDto {
  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Minimum distance in km (inclusive)',
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  min_distance_km: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    nullable: true,
    description: 'Maximum distance in km (exclusive), null = unlimited',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  max_distance_km?: number | null;

  @ApiProperty({
    type: Number,
    example: 50.0,
    description: 'Fee for this distance tier',
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee: number;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Display order for sorting',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}
