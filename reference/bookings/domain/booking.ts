import { Exclude, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { BookingGuest } from '@/booking-guests/domain/booking-guest';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';
import { normalizeTimeForPresentation } from '@/bookings/utils/booking-time-presentation.util';

/**
 * Booking domain model.
 *
 * Represents a service booking created from a sales order.
 * Tracks booking status, scheduling, location, pricing, and completion.
 *
 * Note: checkout_order_id is deprecated. New bookings use sales_order_item_id.
 *
 * @version 2
 * @since 1.0.0
 */
export class Booking {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Booking ID',
  })
  id: number;

  @ApiPropertyOptional({
    enum: PaymentStatusEnum,
    example: PaymentStatusEnum.PAID,
    description:
      'Booking payment status. Uses checkout order payment_status when available, otherwise derived from escrow transactions.',
    nullable: true,
  })
  payment_status?: PaymentStatusEnum;

  // DEPRECATED: Use sales_order_item_id instead. Kept for backward compatibility.
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Checkout order ID this booking belongs to (DEPRECATED)',
    nullable: true,
  })
  checkout_order_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Checkout order details (DEPRECATED)',
    nullable: true,
  })
  checkout_order?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Sales order ID this booking belongs to',
    nullable: true,
  })
  sales_order_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Sales order details',
    nullable: true,
  })
  sales_order?: any;

  @ApiPropertyOptional({
    type: 'array',
    nullable: true,
    description: 'Applied vouchers for the linked sales order',
    example: [
      {
        id: 1,
        voucher_code: 'WELCOME100',
        voucher_discount: 100,
        user_voucher_id: 12,
      },
    ],
  })
  applied_vouchers?: Array<{
    id: number;
    voucher_code: string;
    voucher_discount: number;
    user_voucher_id: number;
    include_addons_flag: boolean;
  }>;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Sales order item ID (source of truth for add-ons/options)',
    nullable: true,
  })
  sales_order_item_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Sales order item details',
    nullable: true,
  })
  sales_order_item?: any;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Guest email used for no-login booking lookup',
    example: 'juan@example.com',
  })
  guest_email?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Guest-selected payment method used at checkout',
    example: 'gcash',
  })
  guest_payment_method?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description:
      'Total number of persons on the booking, including the primary contact.',
  })
  guest_count?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 12,
    description:
      'Linked open play event id when booking is an open play registration.',
    nullable: true,
  })
  open_play_event_id?: number | null;

  @ApiPropertyOptional({
    type: () => BookingGuest,
    description: 'Primary guest / booking contact snapshot',
    nullable: true,
  })
  primary_guest?: BookingGuest | null;

  @ApiPropertyOptional({
    type: [BookingGuest],
    description: 'Full guest roster snapshots for the booking.',
    nullable: true,
  })
  booking_guests?: BookingGuest[];

  @ApiPropertyOptional({
    type: String,
    description: 'Short display summary of the guest roster.',
    nullable: true,
    example: 'Guest One, Guest Two, Guest Three',
  })
  guest_names_summary?: string | null;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID providing the service',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Seller details',
  })
  seller?: any;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Service ID',
  })
  service_id: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Service details',
  })
  service?: any;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Service package ID (if booking includes a package)',
    nullable: true,
  })
  package_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Service package details',
    nullable: true,
  })
  package?: any;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'Bundle ID (if booking is from a bundle)',
    nullable: true,
  })
  bundle_id?: number | null;

  // ==================== DPO Assessment Fields ====================

  /**
   * @deprecated Use `service.requires_quote` to determine flow type instead.
   * This field is kept for backward compatibility.
   */
  @ApiProperty({
    type: Boolean,
    example: false,
    description:
      'Whether this is an assessment booking (DPO flow). Assessment bookings have checklist milestones.',
    default: false,
    deprecated: true,
  })
  is_assessment: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description:
      'ID of the quotation generated FROM this assessment booking (only for assessment bookings)',
    nullable: true,
  })
  quotation_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Quotation details (if this assessment generated a quotation)',
    nullable: true,
  })
  quotation?: any;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description:
      'ID of the quotation this booking was created FROM (when customer accepts a quotation)',
    nullable: true,
  })
  source_quotation_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Source quotation details',
    nullable: true,
  })
  source_quotation?: any;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description:
      'ID of the specific quotation line item this booking came from',
    nullable: true,
  })
  source_quotation_item_id?: number | null;

  // ==================== End DPO Assessment Fields ====================

  // ==================== MEPF Flow Fields ====================

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description:
      'FK to form_submissions table. Links this booking to the customer form submission data.',
    nullable: true,
  })
  form_submission_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'UUID to group recurring bookings together. All bookings in a recurrence series share this ID.',
    nullable: true,
  })
  recurrence_group_id?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Index in the recurrence series (1, 2, 3... for monthly bookings). Null for non-recurring.',
    nullable: true,
  })
  recurrence_index?: number | null;

  // ==================== End MEPF Flow Fields ====================

  @ApiProperty({
    type: String,
    example: 'BK-20241211-1234',
    description: 'Unique booking number (format: BK-YYYYMMDD-XXXX)',
  })
  booking_number: string;

  @ApiPropertyOptional({
    type: String,
    example: 'BKG-20260327-1234',
    description:
      'Shared guest-facing booking reference for grouped slot/court bookings.',
    nullable: true,
  })
  booking_group_number?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Assigned member ID (for sellers with multiple members)',
    nullable: true,
  })
  assigned_member_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Assigned member details',
    nullable: true,
  })
  assigned_member?: any;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Customer ID who made the booking',
  })
  customer_id: number;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Customer details (includes computed name for provider views)',
  })
  customer?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'email' | 'image'
  > & { name?: string | null; phone_number?: string | null };

  // Schedule (Phase B3: consistent format — date as YYYY-MM-DD, time as HH:mm:ss in API response)
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2024-12-25',
    description:
      'Scheduled date for the service (YYYY-MM-DD, same in list and detail)',
  })
  @Transform(
    ({ value }) =>
      value instanceof Date ? value.toISOString().split('T')[0] : value,
    { toPlainOnly: true },
  )
  scheduled_date: Date;

  @ApiProperty({
    type: String,
    format: 'time',
    example: '09:00:00',
    description: 'Scheduled start time (HH:mm:ss)',
  })
  @Transform(({ value }) => normalizeTimeForPresentation(value), {
    toPlainOnly: true,
  })
  scheduled_start_time: string;

  @ApiPropertyOptional({
    type: String,
    format: 'time',
    example: '11:00:00',
    description: 'Scheduled end time',
    nullable: true,
  })
  @Transform(({ value }) => normalizeTimeForPresentation(value), {
    toPlainOnly: true,
  })
  scheduled_end_time?: string | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T09:00:00Z',
    description: 'Actual start time when service began',
    nullable: true,
  })
  actual_start_time?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: '2024-12-25T11:30:00Z',
    description: 'Actual end time when service completed',
    nullable: true,
  })
  actual_end_time?: Date | null;

  // Location
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Service address ID',
    nullable: true,
  })
  service_address_id?: number | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Service address details',
    nullable: true,
  })
  service_address?: any;

  @ApiPropertyOptional({
    type: String,
    example: '123 Main St, City, Province',
    description: 'Service address as text (if not using address ID)',
    nullable: true,
  })
  service_address_text?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 14.5995,
    description: 'Service location latitude',
    nullable: true,
  })
  service_latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 120.9842,
    description: 'Service location longitude',
    nullable: true,
  })
  service_longitude?: number | null;

  @ApiProperty({
    enum: AppointmentLocationTypeEnum,
    example: AppointmentLocationTypeEnum.HOME_SERVICE,
    description:
      'Where the service will be delivered: home_service, walk_in, or remote',
  })
  appointment_location_type: AppointmentLocationTypeEnum;

  // Pricing breakdown
  @ApiProperty({
    type: Number,
    example: 1200.0,
    description: 'Base service/package price',
    default: 0,
  })
  base_price: number;

  @ApiProperty({
    type: Number,
    example: 200.0,
    description: 'Total of all selected add-ons',
    default: 0,
  })
  addons_total: number;

  @ApiProperty({
    type: Number,
    example: 100.0,
    description: 'Total of all option value price adjustments',
    default: 0,
  })
  options_total: number;

  @ApiProperty({
    type: Number,
    example: 50.0,
    description: 'Location-based additional fee from service area',
    default: 0,
  })
  location_additional_fee: number;

  @ApiProperty({
    type: Number,
    example: 1500.0,
    description:
      'Subtotal (base_price + addons_total + options_total + location_additional_fee)',
  })
  subtotal: number;

  @ApiProperty({
    type: Number,
    example: 0.0,
    description: 'Discount amount',
    default: 0,
  })
  discount_amount: number;

  @ApiProperty({
    type: Number,
    example: 150.0,
    description: 'Platform fee',
    default: 0,
  })
  platform_fee: number;

  @ApiProperty({
    type: Number,
    example: 10.0,
    description: 'Platform fee percentage',
    default: 10.0,
  })
  platform_fee_percent: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1350.0,
    description: 'Provider payout amount (subtotal - platform_fee)',
    nullable: true,
  })
  provider_payout?: number | null;

  @ApiProperty({
    type: Number,
    example: 1500.0,
    description: 'Total amount customer pays (same as subtotal)',
  })
  total: number;

  // Status
  @ApiProperty({
    enum: BookingStatusEnum,
    example: BookingStatusEnum.PENDING,
    description: 'Booking status',
    default: BookingStatusEnum.PENDING,
  })
  status: BookingStatusEnum;

  // Notes
  @ApiPropertyOptional({
    type: String,
    example: 'Please arrive before 9 AM',
    description: 'Customer notes for the booking',
    nullable: true,
  })
  customer_notes?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Customer requested early arrival',
    description: 'Provider notes (internal)',
    nullable: true,
  })
  provider_notes?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'VIP customer - expedite',
    description: 'Internal notes (admin only)',
    nullable: true,
  })
  internal_notes?: string | null;

  // Cancellation
  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Cancellation timestamp',
    nullable: true,
  })
  cancelled_at?: Date | null;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'User ID who cancelled the booking',
    nullable: true,
  })
  cancelled_by?: number | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who cancelled the booking',
    nullable: true,
  })
  cancelled_by_user?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: String,
    example: null,
    description: 'Cancellation reason',
    nullable: true,
  })
  cancellation_reason?: string | null;

  // Completion
  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Completion timestamp',
    nullable: true,
  })
  completed_at?: Date | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Confirmation timestamp',
    nullable: true,
  })
  confirmed_at?: Date | null;

  // Customer approval (after service completion)
  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether customer has approved the completed service',
    nullable: true,
    default: false,
  })
  customer_approved?: boolean | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Timestamp when customer approved the service',
    nullable: true,
  })
  customer_approved_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Great service, very professional!',
    description: 'Customer feedback after service completion',
    nullable: true,
  })
  customer_feedback?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Customer rating (1-5)',
    nullable: true,
  })
  customer_rating?: number | null;

  // Reschedule request
  @ApiPropertyOptional({
    type: String,
    example: 'Unexpected scheduling conflict',
    description: 'Reason for reschedule request',
    nullable: true,
  })
  reschedule_reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '["2025-01-15 09:00", "2025-01-16 14:00"]',
    description: 'Suggested alternative times (JSON array)',
    nullable: true,
  })
  reschedule_suggested_times?: string | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Timestamp when reschedule was requested',
    nullable: true,
  })
  reschedule_requested_at?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'seller',
    description: 'Who requested the reschedule (seller or customer)',
    nullable: true,
  })
  reschedule_requested_by?: string | null;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this booking',
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:00:00Z',
    description: 'Creation timestamp',
  })
  created_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who last updated this booking',
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    example: '2024-12-11T09:05:00Z',
    description: 'Last update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who deleted this booking',
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    type: Date,
    example: null,
    description: 'Deletion timestamp (null if not deleted)',
  })
  deleted_at?: Date | null;

  // Price breakdown details (add-ons and options)
  @ApiPropertyOptional({
    type: Array,
    description: 'Selected add-ons for this booking with pricing details',
  })
  booking_addons?: Array<{
    id: number;
    addon_id: number | null;
    addon_name: string;
    addon_code: string;
    addon_description: string | null;
    unit_type: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    duration_minutes: number | null;
  }>;

  @ApiPropertyOptional({
    type: Array,
    description: 'Selected options for this booking with pricing details',
  })
  booking_options?: Array<{
    id: number;
    option_group_id: number | null;
    option_value_id: number | null;
    group_name: string;
    group_code: string;
    value_label: string;
    value_code: string;
    quantity: number;
    price_adjustment: number;
    duration_adjustment_minutes: number;
  }>;

  @ApiPropertyOptional({
    type: Array,
    description: 'Booking milestones and checklist items',
  })
  booking_milestones?: Array<{
    id: number;
    booking_id: number;
    template_id: number | null;
    name: string;
    description: string | null;
    sequence_order: number;
    status: string;
    payment_percent: number;
    payment_amount: number;
    payment_released: boolean;
    payment_released_at: Date | null;
    started_at: Date | null;
    completed_at: Date | null;
    submitted_at: Date | null;
    approved_at: Date | null;
    customer_notes: string | null;
    provider_notes: string | null;
    rejection_reason: string | null;
    approved_by: number | null;
    auto_approved: boolean;
    auto_approve_after_hours: number;
    milestone_type: string;
    category: string | null;
    response_type: string | null;
    measurement_unit: string | null;
    is_required: boolean;
    checkbox_value: boolean | null;
    text_value: string | null;
    rating_value: number | null;
    measurement_value: number | null;
    photo_urls: string[] | null;
    source_quotation_item_id: number | null;
  }>;

  @Exclude()
  __entity?: string;
}
