import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for manual subscription renewal.
 *
 * @version 1
 * @since 1.0.0
 */
export class ManualRenewalDto {
  @ApiPropertyOptional({
    description: 'Reason for manual renewal',
    example: 'Payment issue resolved, manual renewal requested',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
