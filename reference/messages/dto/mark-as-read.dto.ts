import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsPositive, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for marking messages as read.
 *
 * @version 1
 * @since 1.0.0
 */
export class MarkAsReadDto {
  @ApiPropertyOptional({
    type: [Number],
    description:
      'Specific message IDs to mark as read (if not provided, marks all unread in conversation)',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  message_ids?: number[];
}
