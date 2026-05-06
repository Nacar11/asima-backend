import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * DTO for extending a subscription.
 *
 * @version 1
 * @since 1.0.0
 */
export class ExtendSubscriptionDto {
  @ApiProperty({
    description: 'Number of days to extend the subscription',
    example: 30,
  })
  @IsInt()
  @IsPositive()
  days: number;

  @ApiPropertyOptional({
    description: 'Reason for extension',
    example: 'Customer service issue compensation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
