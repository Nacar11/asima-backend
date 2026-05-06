import { ApiProperty } from '@nestjs/swagger';

/**
 * Subscription usage domain class.
 *
 * Represents current usage vs plan limits for a user's subscription.
 * Used to show how much of their subscription quota they've consumed.
 *
 * @version 1
 * @since 1.0.0
 */
export class SubscriptionUsage {
  @ApiProperty({
    example: 1,
    description: 'Number of sellers/stores created',
  })
  sellers_used: number;

  @ApiProperty({
    example: 1,
    description: 'Maximum sellers allowed by plan (null = unlimited)',
    nullable: true,
  })
  sellers_limit: number | null;

  @ApiProperty({
    example: 25,
    description: 'Number of products created',
  })
  products_used: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum products allowed by plan (null = unlimited)',
    nullable: true,
  })
  products_limit: number | null;

  @ApiProperty({
    example: 10,
    description: 'Number of services created',
  })
  services_used: number;

  @ApiProperty({
    example: 50,
    description: 'Maximum services allowed by plan (null = unlimited)',
    nullable: true,
  })
  services_limit: number | null;

  @ApiProperty({
    example: 3,
    description: 'Number of team members',
  })
  members_used: number;

  @ApiProperty({
    example: 5,
    description: 'Maximum members allowed by plan (null = unlimited)',
    nullable: true,
  })
  members_limit: number | null;

  @ApiProperty({
    example: 50,
    description: 'Number of bookings this month',
  })
  bookings_this_month: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum bookings allowed per month (null = unlimited)',
    nullable: true,
  })
  bookings_limit: number | null;
}
