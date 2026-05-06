import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Rating Item domain model.
 *
 * Represents an individual rating value for a specific rating template criteria.
 *
 * @version 1
 * @since 1.0.0
 */
export class RatingItem {
  @ApiProperty({ description: 'Rating Item ID' })
  id: number;

  @ApiProperty({ description: 'Parent Rating ID' })
  rating_id: number;

  @ApiProperty({ description: 'Rating Template ID' })
  rating_template_id: number;

  @ApiProperty({ description: 'Snapshot of template code at time of rating' })
  template_code: string;

  @ApiProperty({ description: 'Snapshot of template name at time of rating' })
  template_name: string;

  @ApiProperty({ description: 'Rating value given by customer' })
  value: number;

  // ==================== Audit Fields ====================

  @ApiPropertyOptional({ description: 'User who created this record' })
  created_by: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'User who last updated this record' })
  updated_by: number | null;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'User who deleted this record' })
  deleted_by: number | null;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  deleted_at: Date | null;
}
