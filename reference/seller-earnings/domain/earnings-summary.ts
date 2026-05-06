import { ApiProperty } from '@nestjs/swagger';

/**
 * Earnings Chart Point domain model.
 *
 * @version 1
 * @since 1.0.0
 */
export class EarningsChartPoint {
  @ApiProperty({ type: String, example: '2024-12-01' })
  period: string;

  @ApiProperty({ type: Number, example: 1500.0 })
  amount: number;
}

/**
 * Enhanced Earnings Summary domain model.
 *
 * @version 1
 * @since 1.0.0
 */
export class EarningsSummary {
  @ApiProperty({ type: Number, example: 50000.0 })
  total_earnings: number;

  @ApiProperty({ type: Number, example: 30000.0 })
  available_balance: number;

  @ApiProperty({ type: Number, example: 20000.0 })
  pending_balance: number;

  @ApiProperty({ type: Number, example: 15000.0 })
  this_month_earnings: number;

  @ApiProperty({ type: Number, example: 12000.0 })
  last_month_earnings: number;

  @ApiProperty({
    type: 'array',
    items: { $ref: '#/components/schemas/EarningsChartPoint' },
  })
  chart: EarningsChartPoint[];
}
