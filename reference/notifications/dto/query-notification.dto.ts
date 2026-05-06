import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

/**
 * DTO for querying notifications with filters and pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryNotificationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    example: NotificationTypeEnum.BOOKING_CONFIRMED,
    enum: NotificationTypeEnum,
  })
  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  type?: NotificationTypeEnum;

  @ApiPropertyOptional({
    description: 'Filter by read status (true = read, false = unread)',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_read?: boolean;
}
