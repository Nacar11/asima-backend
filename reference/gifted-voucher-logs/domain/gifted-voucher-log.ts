import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GiftedVoucherLog {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 5 })
  voucher_id: number | null;

  @ApiProperty({ type: Number, example: 42 })
  gifted_by_user_id: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 101 })
  gifted_to_user_id: number | null;

  @ApiProperty({ type: Number, example: 3 })
  quantity: number;

  @ApiProperty({ type: Date, description: 'When the voucher was gifted' })
  gifted_at: Date;

  // --- Snapshot fields (point-in-time values at gift time) ---

  @ApiProperty({ type: String, example: 'WELCOME100' })
  voucher_code: string;

  @ApiProperty({ type: String, example: 'percentage' })
  voucher_discount_type: string;

  @ApiProperty({ type: Number, example: 10 })
  voucher_discount_value: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 50 })
  voucher_max_discount_cap: number | null;

  @ApiProperty({ type: String, example: 'categories' })
  voucher_scope: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  voucher_description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  seller_name: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  gifted_to_first_name: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  gifted_to_last_name: string | null;

  // --- End snapshot fields ---

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether the voucher has been deleted',
  })
  voucher_deleted?: boolean;

  @ApiPropertyOptional({
    description: 'Eligible categories (from voucher junction tables)',
  })
  voucher_categories?: Array<{
    id: number;
    voucher_id: number;
    category_id: number;
    category_name: string | null;
  }>;

  @ApiPropertyOptional({
    description: 'Eligible products (from voucher junction tables)',
  })
  voucher_products?: Array<{
    id: number;
    voucher_id: number;
    product_id: number;
    product_name: string | null;
  }>;

  @ApiPropertyOptional({
    description: 'Eligible services (from voucher junction tables)',
  })
  voucher_services?: Array<{
    id: number;
    voucher_id: number;
    service_id: number;
    service_name: string | null;
  }>;

  @ApiPropertyOptional({
    description: 'Eligible service categories (from voucher junction tables)',
  })
  voucher_service_categories?: Array<{
    id: number;
    voucher_id: number;
    service_category_id: number;
    service_category_name: string | null;
  }>;

  @ApiPropertyOptional({ description: 'Gifted-by user summary' })
  gifted_by?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };

  @ApiPropertyOptional({
    description: 'Gifted-to user summary (from relation, if still exists)',
  })
  gifted_to?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}
