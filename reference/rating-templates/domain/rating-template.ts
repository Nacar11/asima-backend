import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RatingTypeEnum } from '@/rating-templates/enums/rating-type.enum';

/**
 * Rating Template domain model.
 *
 * Represents an admin-defined rating criteria template used for
 * customer reviews after service completion.
 *
 * @version 1
 * @since 1.0.0
 */
export class RatingTemplate {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Service Quality' })
  name: string;

  @ApiProperty({ example: 'service_quality' })
  code: string;

  @ApiPropertyOptional({ example: 'Rate the quality of service provided' })
  description?: string | null;

  @ApiProperty({ enum: RatingTypeEnum, example: RatingTypeEnum.STARS })
  rating_type: RatingTypeEnum;

  @ApiProperty({ example: 1, description: 'Minimum allowed value' })
  min_value: number;

  @ApiProperty({ example: 5, description: 'Maximum allowed value' })
  max_value: number;

  @ApiProperty({ example: true })
  is_required: boolean;

  @ApiProperty({ example: 1 })
  sequence_order: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiPropertyOptional({ example: 1 })
  created_by?: number | null;

  @ApiProperty({ example: '2026-01-24T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ example: 1 })
  updated_by?: number | null;

  @ApiProperty({ example: '2026-01-24T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: null })
  deleted_by?: number | null;

  @ApiPropertyOptional({ example: null })
  deleted_at?: Date | null;
}
