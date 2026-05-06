import { ApiProperty } from '@nestjs/swagger';

/**
 * GracePeriodSettings domain model.
 *
 * Represents grace period configuration settings.
 *
 * @version 1
 * @since 1.0.0
 */
export class GracePeriodSettings {
  @ApiProperty({
    type: Number,
    example: 7,
    description: 'Default grace period in days',
  })
  defaultGracePeriodDays: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether to send reminder emails during grace period',
  })
  sendReminderEmails: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether to auto-suspend after grace period expires',
  })
  autoSuspendAfterGracePeriod: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether to notify admin before grace period expires',
  })
  notifyAdminBeforeExpiry: boolean;
}
