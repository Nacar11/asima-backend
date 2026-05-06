import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * UserSearchHistory domain model representing a single search executed by a user.
 */
export class UserSearchHistory {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  user_id: number;

  @ApiProperty({ type: String, example: 'iphone 15' })
  keyword: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  created_by?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  updated_by?: number | null;

  @ApiPropertyOptional({ type: Number, example: null })
  deleted_by?: number | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiProperty({ type: Date })
  updated_at: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
