import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DisputeReasonEnum } from '../enums/dispute-reason.enum';
import { DisputeResolutionEnum } from '../enums/dispute-resolution.enum';

/**
 * DTO for creating a new dispute.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreateDisputeDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Booking ID to dispute',
  })
  @IsNumber()
  @IsNotEmpty()
  booking_id: number;

  @ApiProperty({
    enum: DisputeReasonEnum,
    example: DisputeReasonEnum.POOR_QUALITY,
    description: 'Reason for the dispute',
  })
  @IsEnum(DisputeReasonEnum)
  @IsNotEmpty()
  reason: DisputeReasonEnum;

  @ApiProperty({
    type: String,
    example: 'The service was not completed as agreed.',
    description: 'Detailed description of the issue',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'URLs of evidence photos/documents',
  })
  @IsOptional()
  @IsString({ each: true })
  evidence_urls?: string[];

  @ApiPropertyOptional({
    enum: DisputeResolutionEnum,
    example: DisputeResolutionEnum.FULL_REFUND,
    description: 'Requested resolution type',
  })
  @IsOptional()
  @IsEnum(DisputeResolutionEnum)
  requested_resolution?: DisputeResolutionEnum;

  @ApiPropertyOptional({
    type: Number,
    example: 500.0,
    description: 'Requested refund amount (for partial refund)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requested_refund_amount?: number;
}
