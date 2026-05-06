import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';
import { User } from '@/users/domain/user';

/**
 * Voucher domain model.
 */
export class Voucher {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: String, example: 'WELCOME100' })
  code: string;
  @ApiProperty({ enum: VoucherScopeEnum, example: VoucherScopeEnum.CATEGORIES })
  scope: VoucherScopeEnum;
  @ApiPropertyOptional({ type: Number, nullable: true, example: null })
  seller_id?: number | null;
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: null,
    description:
      'When set, voucher applies only to this service (per-service voucher).',
  })
  service_id?: number | null;
  @ApiProperty({
    enum: VoucherDiscountTypeEnum,
    example: VoucherDiscountTypeEnum.PERCENTAGE,
    description:
      'Allowed values: shipping, fixed, percentage, b1t1, per_hours.',
  })
  discount_type: VoucherDiscountTypeEnum;
  @ApiProperty({ type: Number, example: 100 })
  discount_value: number;
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 50,
    description:
      'Maximum discount cap used for percentage vouchers (e.g. max 50 off).',
  })
  max_discount_cap?: number | null;
  @ApiProperty({ type: Number, example: 500, default: 0 })
  min_order_amount: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1000 })
  total_limit?: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  per_user_limit: number | null;
  @ApiProperty({ type: Number, example: 0, default: 0 })
  used_count: number;
  @ApiPropertyOptional({ type: Date, nullable: true })
  starts_at?: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  expires_at?: Date | null;
  @ApiProperty({ enum: VoucherStatusEnum, example: VoucherStatusEnum.ACTIVE })
  status: VoucherStatusEnum;
  @ApiProperty({ type: Boolean, example: false })
  is_claimable: boolean;
  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  terms_and_conditions?: string | null;
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  include_addons_flag?: boolean | null;
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'True when at least one user_voucher has been claimed for this voucher. Frontend uses this to render scope-entry fields as append-only (existing items non-removable).',
  })
  has_claims?: boolean;
  @ApiPropertyOptional({
    type: 'array',
    description:
      'Linked voucher_categories rows with category metadata for category-scoped vouchers.',
    example: [
      { id: 1, voucher_id: 17, category_id: 12, category_name: 'Food' },
    ],
  })
  voucher_categories?: Array<{
    id: number;
    voucher_id: number;
    category_id: number;
    category_name: string | null;
  }>;
  @ApiPropertyOptional({
    type: 'array',
    description:
      'Linked voucher_products rows with product metadata for product-scoped vouchers.',
    example: [
      {
        id: 1,
        voucher_id: 17,
        product_id: 101,
        product_name: 'Sample Product',
      },
    ],
  })
  voucher_products?: Array<{
    id: number;
    voucher_id: number;
    product_id: number;
    product_name: string | null;
  }>;
  @ApiPropertyOptional({
    type: 'array',
    description: 'Linked voucher_services rows (enriched by findById).',
  })
  voucher_services?: Array<{
    id: number;
    voucher_id: number;
    service_id: number;
    service_name: string | null;
  }>;
  @ApiPropertyOptional({
    type: 'array',
    description:
      'Linked voucher_service_categories rows (enriched by findById).',
  })
  voucher_service_categories?: Array<{
    id: number;
    voucher_id: number;
    service_category_id: number;
    service_category_name: string | null;
  }>;
  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;
  @ApiProperty({ type: Date })
  created_at: Date;
  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;
  @ApiProperty({ type: Date })
  updated_at: Date;
  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;
  @Exclude()
  __entity?: string;
}
