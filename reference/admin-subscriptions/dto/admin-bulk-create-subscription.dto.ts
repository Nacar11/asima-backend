import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for admin bulk creating subscriptions for multiple users.
 *
 * @version 1
 * @since 1.0.0
 */
export class AdminBulkCreateSubscriptionDto {
  @ApiProperty({
    description: 'Array of user IDs to create subscriptions for',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  user_ids: number[];

  @ApiProperty({
    description: 'Subscription plan ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  plan_id: number;

  @ApiPropertyOptional({
    description: 'Whether to auto-renew the subscriptions',
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
