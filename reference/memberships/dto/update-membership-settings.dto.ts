import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Max } from 'class-validator';

/**
 * DTO for updating membership settings.
 */
export class UpdateMembershipSettingsDto {
  @ApiPropertyOptional({
    description: 'Grace period in days after expiration',
    example: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(30)
  grace_period?: number;

  @ApiPropertyOptional({
    description: 'Days before expiration to attempt auto-renewal',
    example: 3,
    minimum: 1,
    maximum: 14,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(14)
  auto_renewal_days_before_expiration?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of auto-renewal retry attempts',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(10)
  maximum_renewal_entries?: number;
}
