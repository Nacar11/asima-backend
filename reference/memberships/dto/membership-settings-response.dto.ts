import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for membership settings.
 */
export class MembershipSettingsResponseDto {
  @ApiProperty({
    description: 'Grace period in days after expiration',
    example: 7,
  })
  grace_period: number;

  @ApiProperty({
    description: 'Days before expiration to attempt auto-renewal',
    example: 3,
  })
  auto_renewal_days_before_expiration: number;

  @ApiProperty({
    description: 'Maximum number of auto-renewal retry attempts',
    example: 3,
  })
  maximum_renewal_entries: number;
}
