import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';

export class ProcessRefundDto {
  @ApiPropertyOptional({
    description: 'Actual refund amount (if different from calculated)',
    example: 150.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_refund_amount?: number;

  @ApiPropertyOptional({
    description:
      'Notes about the refund (required when override_amount is true)',
    example: 'Refunded via original payment method',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  refund_notes?: string;

  @ApiPropertyOptional({
    description:
      'Set to true to override calculated amount when difference exceeds 5% (requires refund_notes)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  override_amount?: boolean;
}
