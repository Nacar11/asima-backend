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
import { DisputeResolutionEnum } from '../enums/dispute-resolution.enum';

/**
 * DTO for resolving a dispute (admin action).
 *
 * @version 1
 * @since 1.0.0
 */
export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeResolutionEnum,
    example: DisputeResolutionEnum.FULL_REFUND,
    description: 'Resolution outcome',
  })
  @IsEnum(DisputeResolutionEnum)
  @IsNotEmpty()
  resolution: DisputeResolutionEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Customer claim is valid. Full refund approved.',
    description: 'Resolution notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution_notes?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1000.0,
    description: 'Refund amount to process',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refund_amount?: number;
}
