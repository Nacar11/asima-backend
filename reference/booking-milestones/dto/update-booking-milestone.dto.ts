import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';

/**
 * DTO for updating a booking milestone.
 *
 * Used for updating milestone details, status, and notes.
 * All fields are optional - only provided fields will be updated.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateBookingMilestoneDto {
  @ApiPropertyOptional({
    enum: MilestoneStatusEnum,
    description: 'Milestone status',
    example: MilestoneStatusEnum.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(MilestoneStatusEnum)
  status?: MilestoneStatusEnum;

  @ApiPropertyOptional({
    description: 'Milestone name',
    example: 'Updated Milestone Name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Milestone description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Provider notes',
    example: 'Completed as per requirements',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  provider_notes?: string;

  @ApiPropertyOptional({
    description: 'Customer notes',
    example: 'Looks good!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customer_notes?: string;

  @ApiPropertyOptional({
    description: 'Rejection reason (if rejecting)',
    example: 'Does not meet requirements',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}
