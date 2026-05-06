import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { ServiceGallery } from '@/service-gallery/domain/service-gallery';
import { User } from '@/users/domain/user';
import { Review } from '@/reviews/domain/review';
import { Seller } from '@/sellers/domain/seller';

export class Service {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: 'Seller who owns this service',
  })
  seller?: Pick<
    Seller,
    | 'id'
    | 'store_name'
    | 'slug'
    | 'store_logo_url'
    | 'average_rating'
    | 'pickup_city'
    | 'pickup_province'
    | 'status'
    | 'contact'
    | 'email'
    | 'website'
    | 'service_location_address_id'
    | 'service_location_address'
  > | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  category_id?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  currency_id?: number | null;

  @ApiProperty({ type: String, example: 'Aircon Cleaning' })
  title: string;

  @ApiProperty({ type: String, example: 'aircon-cleaning' })
  code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  short_description?: string | null;

  @ApiProperty({ enum: PricingTypeEnum, example: PricingTypeEnum.FIXED })
  pricing_type: PricingTypeEnum;

  @ApiProperty({
    enum: ServiceTypeEnum,
    example: ServiceTypeEnum.STANDARD,
    description:
      'Service type: standard (preventive) or assessment (DPO diagnostic)',
  })
  service_type: ServiceTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 1500 })
  base_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 750 })
  hourly_rate?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 750,
    description:
      'Minimum price (min of base_price and hourly_rate if both exist)',
  })
  min_price?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1500,
    description:
      'Maximum price (max of base_price and hourly_rate if both exist)',
  })
  max_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 120 })
  estimated_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 60 })
  minimum_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 240 })
  maximum_duration_minutes?: number | null;

  @ApiPropertyOptional({ type: Number, example: 10 })
  service_radius_km?: number | null;

  /** @deprecated Use service_location_type instead */
  @ApiPropertyOptional({ type: Boolean, example: false })
  is_remote_available?: boolean;

  @ApiProperty({
    enum: ServiceLocationTypeEnum,
    example: ServiceLocationTypeEnum.HOME_SERVICE,
    description:
      'Where the service is delivered: home_service, walk_in, both, or remote',
  })
  service_location_type: ServiceLocationTypeEnum;

  // ==================== Venue Configuration ====================

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description:
      'Number of bookable units (e.g., 5 courts). Only for venue services.',
  })
  venue_capacity?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 60,
    description:
      'Duration of each time slot in minutes. Only for venue services.',
  })
  slot_duration_minutes?: number | null;

  // ==================== Peak Pricing Configuration ====================

  @ApiPropertyOptional({
    type: Number,
    example: 1.5,
    description:
      'Multiplier for peak pricing (e.g., 1.5 = 50% surcharge). Null = no peak pricing.',
  })
  peak_price_multiplier?: number | null;

  @ApiPropertyOptional({
    type: [Number],
    example: [0, 5, 6],
    description:
      'Days of week that are peak (0=Sun, 6=Sat). Null = no peak days.',
  })
  peak_days?: number[] | null;

  @ApiPropertyOptional({
    type: String,
    example: '18:00',
    description:
      'Start of peak hours within peak days. Null = entire peak day is peak.',
  })
  peak_start_time?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '21:00',
    description: 'End of peak hours within peak days.',
  })
  peak_end_time?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1200,
    description:
      'Computed peak hourly rate (hourly_rate * peak_price_multiplier). Present when both are set.',
  })
  peak_price?: number | null;

  // ==================== Booking Limits ====================

  @ApiPropertyOptional({ type: Number, example: 10 })
  max_bookings_per_day?: number | null;

  @ApiPropertyOptional({ type: Number, example: 30 })
  advance_booking_days?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description:
      'Minimum lead time before booking start, in minutes. Field name is kept for backward compatibility.',
  })
  minimum_notice_hours?: number | null;

  @ApiProperty({ enum: ServiceStatusEnum, example: ServiceStatusEnum.DRAFT })
  @Transform(
    ({ value }) => {
      if (typeof value === 'string' && value.length > 0) {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return value;
    },
    { toPlainOnly: true },
  )
  status: ServiceStatusEnum;

  @ApiProperty({ type: Boolean, example: false })
  is_featured: boolean;

  @ApiProperty({ type: Boolean, example: false })
  requires_quote: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description:
      'Indicates if this service has checklist templates (for assessment/reactive services)',
  })
  has_checklist: boolean;

  @ApiProperty({ type: Boolean, example: true })
  instant_booking: boolean;

  @ApiProperty({ type: Number, example: 0 })
  view_count: number;

  @ApiProperty({ type: Number, example: 0 })
  total_bookings: number;

  @ApiProperty({ type: Number, example: 0 })
  average_rating: number;

  @ApiProperty({ type: Number, example: 0 })
  total_reviews: number;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional()
  deleted_at?: Date | null;

  @ApiPropertyOptional({
    type: () => [ServiceMilestoneTemplate],
    description: 'Milestone templates for this service',
  })
  milestone_templates?: ServiceMilestoneTemplate[];

  @ApiPropertyOptional({
    type: () => [ServiceOptionGroup],
    description: 'Option groups for this service',
  })
  option_groups?: ServiceOptionGroup[];

  @ApiPropertyOptional({
    type: () => [ServiceAddon],
    description: 'Add-ons for this service',
  })
  addons?: ServiceAddon[];

  @ApiPropertyOptional({
    type: () => [ServiceGallery],
    description: 'Gallery images for this service',
  })
  gallery?: ServiceGallery[];

  @ApiPropertyOptional({
    type: String,
    description: 'Primary image URL from gallery',
  })
  primary_image_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Card image URL for list/summary views',
  })
  card_image_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Icon URL (e.g. from service category)',
  })
  icon_url?: string | null;

  @ApiPropertyOptional({
    type: () => [Review],
    description: 'Reviews for this service',
  })
  reviews?: Review[];

  @Exclude()
  __entity?: string;
}
