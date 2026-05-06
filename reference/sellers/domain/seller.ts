import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';
import { BusinessTypeEnum } from '@/sellers/enums/business-type.enum';

export class SellerEdistrictInfo {
  @ApiProperty() id: number;
  @ApiProperty() key: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) subtitle: string | null;
  @ApiPropertyOptional({ nullable: true }) store_name: string | null;
  @ApiPropertyOptional({ nullable: true }) image_url: string | null;
  @ApiPropertyOptional({ nullable: true }) background_image_url: string | null;
  @ApiProperty() status: string;
  @ApiProperty() is_members_only: boolean;
  @ApiProperty() display_order: number;
}

/**
 * Seller subscription summary (used in listings)
 */
export class SellerSubscription {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  plan_id: number;

  @ApiPropertyOptional({
    type: Object,
    example: {
      id: 1,
      plan_name: 'Basic Plan',
      plan_code: 'BASIC',
      price: 499,
      billing_cycle: 'monthly',
    },
  })
  plan?: {
    id: number;
    plan_name: string;
    plan_code: string;
    price: number;
    billing_cycle: string;
  };

  @ApiProperty({ type: String, example: 'SUB-20251212-1234' })
  subscription_number: string;

  @ApiProperty({ type: String, example: 'active' })
  status: string;

  @ApiProperty({ type: Date, example: '2025-12-12' })
  start_date: Date;

  @ApiPropertyOptional({ type: Date, example: '2026-01-12', nullable: true })
  end_date?: Date | null;

  @ApiPropertyOptional({ type: Date, example: '2026-01-12', nullable: true })
  next_billing_date?: Date | null;

  @ApiProperty({ type: Boolean, example: true })
  auto_renew: boolean;
}

/**
 * Seller domain entity
 */
export class Seller {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'One-to-one relationship with users table',
  })
  user_id: number;

  @ApiProperty({
    type: () => User,
    description: 'User who owns this seller account',
    example: { id: 1, first_name: 'John', last_name: 'Doe' },
  })
  user: Pick<User, 'id' | 'first_name' | 'last_name'>;

  @ApiProperty({
    type: String,
    example: 'Tech Store',
  })
  store_name: string;

  @ApiProperty({
    type: String,
    example: 'tech-store',
    description: 'URL-friendly seller slug',
  })
  slug: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A store selling electronics and gadgets',
    nullable: true,
  })
  store_description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  store_logo_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/banner.png',
    nullable: true,
  })
  store_banner_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'BR123456789',
    nullable: true,
  })
  business_registration_number?: string | null;

  @ApiPropertyOptional({
    enum: BusinessTypeEnum,
    example: BusinessTypeEnum.SOLE_PROPRIETOR,
    nullable: true,
  })
  business_type?: BusinessTypeEnum | null;

  @ApiPropertyOptional({
    type: String,
    example: 'TAX123456',
    nullable: true,
  })
  tax_id?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'John Doe',
    nullable: true,
  })
  bank_account_holder?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1234567890',
    nullable: true,
  })
  bank_account_number?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Bank of America',
    nullable: true,
  })
  bank_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '+63 912 345 6789',
    nullable: true,
    description: 'Store/seller contact number',
  })
  contact?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'store@example.com',
    nullable: true,
    description: 'Store/seller email address',
  })
  email?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com',
    nullable: true,
    description: 'Store/seller website URL',
  })
  website?: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Seller verification status',
  })
  is_verified: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Can deactivate seller account',
  })
  is_active: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Seller offers products',
  })
  sells_products: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Seller offers services',
  })
  sells_services: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether seller is featured on public listings',
  })
  is_featured: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Auto-accept service bookings',
  })
  auto_accept_bookings: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '10+ years in home repairs and maintenance',
    nullable: true,
  })
  bio?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    nullable: true,
  })
  years_of_experience?: number | null;

  @ApiProperty({
    type: Number,
    example: 25.5,
    description: 'Hourly rate when selling services',
  })
  hourly_rate: number;

  @ApiProperty({
    type: Number,
    example: 10.0,
    description:
      'Platform commission % deducted before crediting seller wallet',
  })
  commission_rate: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Total sales amount',
  })
  total_sales: number;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Total number of reviews',
  })
  total_reviews: number;

  @ApiProperty({
    type: Number,
    example: 4.8,
    description: 'Average rating for seller services/products',
  })
  average_rating: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Total services listed by seller',
  })
  total_services: number;

  @ApiProperty({
    type: Number,
    example: 30,
    description: 'Total completed bookings fulfilled by this seller',
  })
  total_completed_bookings: number;

  // ==================== Booking Capacity Settings ====================

  @ApiProperty({
    type: Number,
    example: 1,
    default: 1,
    description:
      'Maximum number of bookings that can be scheduled at the same time',
  })
  max_concurrent_bookings: number;

  @ApiProperty({
    type: Number,
    example: 8,
    default: 8,
    description: 'Maximum number of bookings per day',
  })
  max_daily_bookings: number;

  @ApiProperty({
    type: Number,
    example: 8.0,
    default: 8,
    description: 'Total service capacity hours per day',
  })
  service_capacity_hours: number;

  @ApiProperty({
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
    description: 'Seller status: Active, Cancelled, or Hold',
  })
  status: StatusEnum;

  @ApiPropertyOptional({ type: Number, example: 1, nullable: true })
  edistrict_id?: number | null;

  @ApiPropertyOptional({ type: () => SellerEdistrictInfo, nullable: true })
  edistrict?: SellerEdistrictInfo | null;

  @ApiPropertyOptional({
    type: Array,
    nullable: true,
    description: 'Categories associated with this seller',
    example: [
      {
        id: 1,
        category_name: 'Electronics',
        slug: 'electronics',
        display_order: 0,
        parent_category_id: null,
        seller_id: 1,
      },
    ],
  })
  categories?: Array<{
    id: number;
    category_name: string;
    slug: string;
    display_order: number;
    parent_category_id: number | null;
    seller_id: number | null;
  }> | null;

  // ==================== Pickup Location for Shipping ====================

  @ApiPropertyOptional({
    type: String,
    example: '123 Warehouse Street',
    description: 'Pickup/warehouse address for shipping',
    nullable: true,
  })
  pickup_address?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu City',
    description: 'Pickup location city',
    nullable: true,
  })
  pickup_city?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Cebu',
    description: 'Pickup location province',
    nullable: true,
  })
  pickup_province?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '6000',
    description: 'Pickup location postal code',
    nullable: true,
  })
  pickup_postal_code?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10.3157,
    description: 'Latitude coordinate for shipping distance calculation',
    nullable: true,
  })
  pickup_latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 123.8854,
    description: 'Longitude coordinate for shipping distance calculation',
    nullable: true,
  })
  pickup_longitude?: number | null;

  // ==================== Service Location for Walk-in Appointments ====================

  @ApiPropertyOptional({
    type: Number,
    example: 123,
    description: 'Service location address ID',
    nullable: true,
  })
  service_location_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    example: {
      id: 123,
      address_line1: '123 Service St',
      city: 'Quezon City',
      state_province: 'Metro Manila',
      postal_code: '1100',
      country: 'Philippines',
    },
    description: 'Service location address object',
    nullable: true,
  })
  service_location_address?: any | null;

  // ==================== Pickup Configuration ====================

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether pickup is enabled for this seller',
  })
  pickup_enabled: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 123,
    description: 'Pickup address ID from user_addresses table',
    nullable: true,
  })
  pickup_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    example: {
      id: 123,
      address_line1: '123 Pickup St',
      city: 'Quezon City',
      state_province: 'Metro Manila',
      postal_code: '1100',
      country: 'Philippines',
    },
    description: 'Full pickup address object',
    nullable: true,
  })
  pickup_address_entity?: any | null;

  @ApiProperty({
    type: Number,
    example: 30,
    description: 'Preparation time in minutes before pickup is ready',
  })
  pickup_preparation_time: number;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Maximum concurrent pickup orders',
  })
  pickup_max_concurrent_orders: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Please arrive at the back entrance and ring the bell',
    description: 'Pickup instructions for customers',
    nullable: true,
  })
  pickup_instructions?: string | null;

  @ApiProperty({
    type: Number,
    example: 120,
    description: 'Grace period in minutes before marking as no-show',
  })
  pickup_grace_period: number;

  // ==================== End Pickup Configuration ====================

  // ==================== Subscription ====================

  @ApiPropertyOptional({
    type: () => SellerSubscription,
    nullable: true,
    description: 'Active subscription for this seller',
  })
  subscription?: SellerSubscription | null;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
