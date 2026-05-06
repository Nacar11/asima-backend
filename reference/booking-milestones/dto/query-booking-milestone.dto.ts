import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';

/**
 * DTO for querying booking milestones.
 *
 * Used for filtering and paginating booking milestones.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryBookingMilestoneDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by milestone status',
    enum: MilestoneStatusEnum,
    example: MilestoneStatusEnum.PENDING,
  })
  @IsOptional()
  @IsEnum(MilestoneStatusEnum)
  status?: MilestoneStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by booking ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  booking_id?: number;
}
