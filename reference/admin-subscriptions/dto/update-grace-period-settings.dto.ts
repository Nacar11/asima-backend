import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

/**
 * DTO for updating grace period settings.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateGracePeriodSettingsDto {
  @ApiPropertyOptional({
    description: 'Default grace period in days',
    example: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  defaultGracePeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Whether to send reminder emails during grace period',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  sendReminderEmails?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to auto-suspend after grace period expires',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoSuspendAfterGracePeriod?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to notify admin before grace period expires',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notifyAdminBeforeExpiry?: boolean;
}
