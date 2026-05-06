import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ModerationStatusEnum } from '@/moderation/enums/moderation-status.enum';
import { ContentTypeEnum } from '@/moderation/enums/content-type.enum';

/**
 * DTO for querying moderation history.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryModerationHistoryDto {
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
}
