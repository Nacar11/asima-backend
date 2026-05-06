import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

/**
 * DTO for releasing escrow funds.
 *
 * Used when releasing funds to provider after milestone approval.
 *
 * @version 1
 * @since 1.0.0
 */
export class ReleaseEscrowDto {
  @ApiProperty({
    description: 'Milestone ID to release payment for',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  milestone_id: number;

  @ApiPropertyOptional({
    description: 'Amount to release (if partial release)',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    description: 'User ID who receives the release',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  released_to?: number;

  @ApiPropertyOptional({
    description: 'Release method (bank_transfer, wallet, gcash)',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  release_method?: string;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'REF123456',
  })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({
    description: 'Release notes',
    example: 'Milestone 1 approved and released',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
