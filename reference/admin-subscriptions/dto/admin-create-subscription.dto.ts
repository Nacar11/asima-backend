import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for admin creating a subscription for a specific user.
 *
 * @version 1
 * @since 1.0.0
 */
export class AdminCreateSubscriptionDto {
  @ApiProperty({
    description: 'User ID to create subscription for',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  user_id: number;

  @ApiProperty({
    description: 'Subscription plan ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  plan_id: number;

  @ApiPropertyOptional({
    description: 'Whether to auto-renew the subscription',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to skip payment (activate immediately)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skip_payment?: boolean;
}
