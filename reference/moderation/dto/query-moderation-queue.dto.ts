import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';
import { ModerationPriorityEnum } from '@/moderation/enums/moderation-priority.enum';

// Whitelist of allowed sort columns to prevent SQL injection
const ALLOWED_SORT_COLUMNS = [
  'created_at',
  'updated_at',
  'priority',
  'status',
  'content_type',
  'reported_by',
  'reported_reason',
] as const;

/**
 * DTO for querying moderation queue.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryModerationQueueDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: ModerationStatusEnum,
    description: 'Filter by moderation status',
  })
  @IsOptional()
  @IsEnum(ModerationStatusEnum)
  status?: ModerationStatusEnum;

  @ApiPropertyOptional({
    enum: ContentTypeEnum,
    description: 'Filter by content type',
  })
  @IsOptional()
  @IsEnum(ContentTypeEnum)
  content_type?: ContentTypeEnum;

  @ApiPropertyOptional({
    enum: ModerationPriorityEnum,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(ModerationPriorityEnum)
  priority?: ModerationPriorityEnum;

  @ApiPropertyOptional({
    description: 'Filter by reported reason (partial match)',
    example: 'Inappropriate content',
  })
  @IsOptional()
  @IsString()
  reported_reason?: string;

  @ApiPropertyOptional({
    description:
      'Filter by reporter name (searches first_name and last_name, partial match)',
    example: 'jane',
  })
  @IsOptional()
  @IsString()
  reporter_name?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'created_at',
    enum: ALLOWED_SORT_COLUMNS,
    default: 'priority',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_COLUMNS)
  sort_by?: (typeof ALLOWED_SORT_COLUMNS)[number];

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';
}
