import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { EscrowTransactionTypeEnum } from '@/escrow-transactions/enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from '@/escrow-transactions/enums/escrow-transaction-status.enum';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { OpenPlayEventEntity } from '@/guest-venue-booking/persistence/entities/open-play-event.entity';
import { formatOpenPlaySkillLevelLabel } from '@/guest-venue-booking/open-play-skill-levels.constants';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { StorageService } from '@/storage/storage.service';
import { AvailabilityRealtimeService } from '@/availability-realtime/availability-realtime.service';
import { QuerySellerDetailedBlockedSlotsDto } from './dto/query-seller-detailed-blocked-slots.dto';
import { QuerySellerDetailedBookingsDto } from './dto/query-seller-detailed-bookings.dto';
import { normalizeTimeForPresentation } from '@/bookings/utils/booking-time-presentation.util';

type SoaStatus = 'released' | 'partial' | 'held' | 'refunded';

const OPEN_PLAY_REGISTERED_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.AWAITING_CONFIRMATION,
  BookingStatusEnum.CONFIRMED,
  BookingStatusEnum.IN_PROGRESS,
  BookingStatusEnum.COMPLETED,
];

export type SellerDetailedBookingSalesOrderSummary = {
  id: number;
  order_number: string;
  status: string;
  payment_method: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  created_at: Date;
  items_count: number;
};

export type SellerDetailedBookingAddon = {
  id: number;
  addon_id: number | null;
  addon_name: string;
  addon_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  duration_minutes: number | null;
};

export type SellerDetailedBookingOption = {
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
};

export type SellerDetailedBookingSalesOrderItem = {
  id: number;
  item_type: CartItemTypeEnum | string;
  service_title: string | null;
  product_name: string | null;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  scheduled_date: Date | null;
  scheduled_start_time: string | null;
  addons: SellerDetailedBookingAddon[];
  options: SellerDetailedBookingOption[];
};

export type SellerDetailedBookingSalesOrderVoucher = {
  id: number;
  voucher_code: string;
  voucher_discount: number;
  user_voucher_id: number;
};

export type SellerDetailedBookingSalesOrderDetail =
  SellerDetailedBookingSalesOrderSummary & {
    items: SellerDetailedBookingSalesOrderItem[];
    vouchers: SellerDetailedBookingSalesOrderVoucher[];
  };

export type SellerDetailedBookingRow = {
  id: number;
  booking_number: string;
  booking_group_number: string | null;
  slot_count: number;
  booking_type: 'regular' | 'open_play';
  open_play_event_id: number | null;
  sales_order_number: string | null;
  sales_order: SellerDetailedBookingSalesOrderSummary | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  created_at: Date;
  completed_at: Date | null;
  status: string;
  customer_name: string;
  customer_phone: string | null;
  guest_count: number;
  guest_names_summary: string | null;
  service_title: string;
  payment_status: string;
  gross_amount: number;
  total_amount: number;
  discount_amount: number;
  platform_fee: number;
  net_amount: number;
  released_amount: number;
  refund_amount: number;
  held_amount: number;
  soa_status: SoaStatus;
};

export type SellerDetailedBookingsListResponse = {
  data: SellerDetailedBookingRow[];
  totalCount: number;
  skip: number;
  take: number;
};

export type SellerDetailedBlockedSlotRow = {
  id: number;
  seller_id: number;
  service_id: number | null;
  service_title: string | null;
  blocked_by_user_id: number | null;
  blocked_by_name: string | null;
  unavailable_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  reason: string | null;
  block_type: string;
  open_play_event_id: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type SellerDetailedBlockedSlotsListResponse = {
  data: SellerDetailedBlockedSlotRow[];
  totalCount: number;
  skip: number;
  take: number;
};

export type SellerDetailedBookingDetailResponse = {
  booking: {
    id: number;
    booking_number: string;
    booking_group_number: string | null;
    slot_count: number;
    grouped_slots: Array<{
      id: number;
      booking_number: string;
      slot_count: number;
      sales_order_number: string | null;
      service_title: string | null;
      scheduled_date: Date | null;
      scheduled_start_time: string | null;
      scheduled_end_time: string | null;
      status: string;
      payment_status: string;
      total_amount: number;
      customer_name: string;
      guest_count: number;
    }>;
    booking_type: 'regular' | 'open_play';
    open_play_event_id: number | null;
    open_play_title: string | null;
    open_play_max_applicants: number | null;
    open_play_skill_level_code: string | null;
    open_play_skill_level_label: string | null;
    service_id: number | null;
    service_type: string | null;
    sales_order_number: string | null;
    scheduled_date: Date | null;
    scheduled_start_time: string | null;
    scheduled_end_time: string | null;
    created_at: Date;
    completed_at: Date | null;
    status: string;
    payment_status: string;
    payment_reference: string | null;
    payment_proof_url: string | null;
    payment_proof_uploaded_at: string | null;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    guest_count: number;
    guest_names_summary: string | null;
    guests: Array<{
      sort_order: number;
      is_primary_contact: boolean;
      first_name: string;
      last_name: string;
      full_name: string;
      email: string | null;
      phone: string | null;
    }>;
    service_title: string | null;
    service_address_text: string | null;
    base_price: number;
    addons_total: number;
    options_total: number;
    location_additional_fee: number;
    subtotal: number;
    customer_notes: string | null;
    provider_notes: string | null;
    internal_notes: string | null;
    cancelled_by: number | null;
    cancelled_by_name: string | null;
    cancellation_reason: string | null;
    confirmed_at: Date | null;
    cancelled_at: Date | null;
    updated_at: Date;
    approved_at: string | null;
    approved_by: number | null;
    approved_by_name: string | null;
    rejected_at: string | null;
    rejected_by: number | null;
    rejected_by_name: string | null;
    rejection_reason: string | null;
    booking_addons: SellerDetailedBookingAddon[];
    booking_options: SellerDetailedBookingOption[];
  };
  statement_of_account: {
    gross_amount: number;
    discount_amount: number;
    platform_fee: number;
    net_amount: number;
    released_amount: number;
    refund_amount: number;
    held_amount: number;
    deposit_amount: number;
    soa_status: SoaStatus;
  };
  sales_order: SellerDetailedBookingSalesOrderDetail | null;
  sales_orders: SellerDetailedBookingSalesOrderDetail[];
  escrow_transactions: Array<{
    id: number;
    transaction_type: EscrowTransactionTypeEnum;
    status: EscrowTransactionStatusEnum;
    amount: number;
    reference_number: string | null;
    notes: string | null;
    processed_at: Date | null;
    created_at: Date;
  }>;
};

type EscrowAggregate = {
  deposit_amount: number;
  released_amount: number;
  refund_amount: number;
  failed_deposit_count: number;
  in_flight_count: number;
};

@Injectable()
export class SellerDetailedBookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(EscrowTransactionEntity)
    private readonly escrowTransactionRepository: Repository<EscrowTransactionEntity>,
    @InjectRepository(CheckoutPaymentEntity)
    private readonly checkoutPaymentRepository: Repository<CheckoutPaymentEntity>,
    @InjectRepository(CheckoutPaymentOrderEntity)
    private readonly checkoutPaymentOrderRepository: Repository<CheckoutPaymentOrderEntity>,
    @InjectRepository(StoreUnavailabilityEntity)
    private readonly storeUnavailabilityRepository: Repository<StoreUnavailabilityEntity>,
    @InjectRepository(OpenPlayEventEntity)
    private readonly openPlayEventRepository: Repository<OpenPlayEventEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    private readonly storageService: StorageService,
    private readonly availabilityRealtimeService: AvailabilityRealtimeService,
  ) {}

  async findAll(
    query: QuerySellerDetailedBookingsDto,
    user: User,
  ): Promise<SellerDetailedBookingsListResponse> {
    const sellerId = this.resolveSellerId(query, user);
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortField = query.sortField ?? 'awaiting_confirmation_priority';
    const sortBy =
      query.sortBy ??
      (sortField === 'awaiting_confirmation_priority' ? 'ASC' : 'DESC');
    const dateField = query.date_field ?? 'created_at';
    const dateFrom = query.date_from
      ? this.buildStartOfDay(query.date_from, 'date_from')
      : null;
    const dateTo = query.date_to
      ? this.buildEndOfDay(query.date_to, 'date_to')
      : null;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'Invalid date range: date_from cannot be later than date_to',
      );
    }

    const escrowAggregateSubQuery = this.escrowTransactionRepository
      .createQueryBuilder('et')
      .select('et.booking_id', 'booking_id')
      .addSelect(
        `COALESCE(SUM(CASE WHEN et.transaction_type = '${EscrowTransactionTypeEnum.DEPOSIT}' AND et.status = '${EscrowTransactionStatusEnum.COMPLETED}' THEN et.amount ELSE 0 END), 0)`,
        'deposit_amount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN et.transaction_type IN ('${EscrowTransactionTypeEnum.RELEASE}', '${EscrowTransactionTypeEnum.DISPUTE_RELEASE}') AND et.status = '${EscrowTransactionStatusEnum.COMPLETED}' THEN et.amount ELSE 0 END), 0)`,
        'released_amount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN et.transaction_type = '${EscrowTransactionTypeEnum.REFUND}' AND et.status = '${EscrowTransactionStatusEnum.COMPLETED}' THEN et.amount ELSE 0 END), 0)`,
        'refund_amount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN et.transaction_type = '${EscrowTransactionTypeEnum.DEPOSIT}' AND et.status = '${EscrowTransactionStatusEnum.FAILED}' THEN 1 ELSE 0 END), 0)`,
        'failed_deposit_count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN et.transaction_type IN ('${EscrowTransactionTypeEnum.DEPOSIT}', '${EscrowTransactionTypeEnum.REFUND}') AND et.status IN ('${EscrowTransactionStatusEnum.PENDING}', '${EscrowTransactionStatusEnum.PROCESSING}') THEN 1 ELSE 0 END), 0)`,
        'in_flight_count',
      )
      .where('et.deleted_at IS NULL')
      .groupBy('et.booking_id');

    const baseQb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.customer', 'customer')
      .leftJoin('booking.service', 'service')
      .leftJoin('booking.sales_order', 'sales_order')
      .leftJoin('booking.checkout_order', 'checkout_order')
      .leftJoin(
        `(${escrowAggregateSubQuery.getQuery()})`,
        'esc',
        'esc.booking_id = booking.id',
      )
      .setParameters(escrowAggregateSubQuery.getParameters())
      .where('booking.deleted_at IS NULL')
      .andWhere('booking.seller_id = :sellerId', { sellerId });

    if (query.status) {
      baseQb.andWhere('LOWER(booking.status::text) = :status', {
        status: String(query.status).toLowerCase(),
      });
    }

    if (query.service_type) {
      baseQb.andWhere('service.service_type = :serviceType', {
        serviceType: query.service_type,
      });
    }

    if (dateFrom) {
      baseQb.andWhere(`booking.${dateField} >= :dateFrom`, {
        dateFrom,
      });
    }

    if (dateTo) {
      baseQb.andWhere(`booking.${dateField} <= :dateTo`, {
        dateTo,
      });
    }

    if (query.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      baseQb.andWhere(
        `(booking.booking_number ILIKE :search OR booking.booking_group_number ILIKE :search OR sales_order.order_number ILIKE :search OR customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR service.title ILIKE :search OR EXISTS (SELECT 1 FROM booking_guests bg_search WHERE bg_search.booking_id = booking.id AND TRIM(CONCAT(COALESCE(bg_search.first_name, ''), ' ', COALESCE(bg_search.last_name, ''))) ILIKE :search))`,
        { search },
      );
    }

    const netAmountExpr = `COALESCE(booking.provider_payout, booking.subtotal - booking.platform_fee, 0)`;
    const scheduledDateTimeExpr = `(booking.scheduled_date::timestamp + COALESCE(booking.scheduled_start_time, TIME '00:00:00'))`;
    const idPageQuery = baseQb.clone().select('booking.id', 'id');

    if (sortField === 'awaiting_confirmation_priority') {
      idPageQuery
        .orderBy(
          `CASE WHEN LOWER(booking.status::text) = 'awaiting_confirmation' THEN 0 ELSE 1 END`,
          'ASC',
        )
        .addOrderBy(
          `CASE WHEN ${scheduledDateTimeExpr} >= NOW() THEN 0 ELSE 1 END`,
          'ASC',
        )
        .addOrderBy(scheduledDateTimeExpr, 'ASC', 'NULLS LAST')
        .addOrderBy('booking.scheduled_date', 'ASC', 'NULLS LAST')
        .addOrderBy('booking.scheduled_start_time', 'ASC', 'NULLS LAST');
    } else if (sortField === 'scheduled_date') {
      idPageQuery
        .orderBy('booking.scheduled_date', sortBy, 'NULLS LAST')
        .addOrderBy('booking.scheduled_start_time', sortBy, 'NULLS LAST');
    } else {
      idPageQuery.orderBy(
        this.resolveSortExpression(sortField, netAmountExpr),
        sortBy,
      );
    }

    idPageQuery.addOrderBy('booking.id', 'DESC').offset(skip).limit(take);
    const pagedIdRows =
      await idPageQuery.getRawMany<Record<string, string | number | null>>();
    const pagedBookingIds = pagedIdRows
      .map((row) => Number(row.id ?? 0))
      .filter((id) => Number.isInteger(id) && id > 0);

    const totalCount = await baseQb
      .clone()
      .select('booking.id')
      .distinct(true)
      .getCount();
    if (pagedBookingIds.length === 0) {
      return {
        data: [],
        totalCount,
        skip,
        take,
      };
    }

    const salesOrderItemsCountExpr = `COALESCE((SELECT COUNT(1) FROM sales_order_items soi WHERE soi.order_id = sales_order.id AND soi.deleted_at IS NULL), 0)`;
    const primaryGuestNameExpr = `COALESCE((SELECT TRIM(CONCAT(COALESCE(bg_primary.first_name, ''), ' ', COALESCE(bg_primary.last_name, ''))) FROM booking_guests bg_primary WHERE bg_primary.booking_id = booking.id AND bg_primary.is_primary_contact = true ORDER BY bg_primary.sort_order ASC LIMIT 1), TRIM(CONCAT(COALESCE(customer.first_name, ''), ' ', COALESCE(customer.last_name, ''))))`;
    const guestNamesSummaryExpr = `(SELECT STRING_AGG(TRIM(CONCAT(COALESCE(bg_summary.first_name, ''), ' ', COALESCE(bg_summary.last_name, ''))), ', ' ORDER BY bg_summary.sort_order) FROM booking_guests bg_summary WHERE bg_summary.booking_id = booking.id)`;
    const rowsQuery = baseQb
      .clone()
      .andWhere('booking.id IN (:...bookingIds)', {
        bookingIds: pagedBookingIds,
      })
      .select('booking.id', 'id')
      .addSelect('booking.booking_number', 'booking_number')
      .addSelect('booking.booking_group_number', 'booking_group_number')
      .addSelect('booking.open_play_event_id', 'open_play_event_id')
      .addSelect('sales_order.id', 'sales_order_id')
      .addSelect('sales_order.order_number', 'sales_order_number')
      .addSelect('sales_order.status', 'sales_order_status')
      .addSelect('sales_order.payment_method', 'sales_order_payment_method')
      .addSelect('sales_order.payment_status', 'sales_order_payment_status')
      .addSelect('sales_order.subtotal', 'sales_order_subtotal')
      .addSelect('sales_order.total_amount', 'sales_order_total_amount')
      .addSelect('sales_order.created_at', 'sales_order_created_at')
      .addSelect(salesOrderItemsCountExpr, 'sales_order_items_count')
      .addSelect('booking.scheduled_date', 'scheduled_date')
      .addSelect('booking.scheduled_start_time', 'scheduled_start_time')
      .addSelect('booking.scheduled_end_time', 'scheduled_end_time')
      .addSelect(
        'service.slot_duration_minutes',
        'service_slot_duration_minutes',
      )
      .addSelect('booking.created_at', 'created_at')
      .addSelect('booking.completed_at', 'completed_at')
      .addSelect('booking.status', 'status')
      .addSelect(primaryGuestNameExpr, 'customer_name')
      .addSelect('customer.phone', 'customer_phone')
      .addSelect('booking.guest_count', 'guest_count')
      .addSelect(guestNamesSummaryExpr, 'guest_names_summary')
      .addSelect('service.title', 'service_title')
      .addSelect(
        'checkout_order.payment_status::text',
        'checkout_order_payment_status',
      )
      .addSelect('booking.subtotal', 'gross_amount')
      .addSelect('booking.total', 'total_amount')
      .addSelect('booking.discount_amount', 'discount_amount')
      .addSelect('booking.platform_fee', 'platform_fee')
      .addSelect(netAmountExpr, 'net_amount')
      .addSelect('COALESCE(esc.released_amount, 0)', 'released_amount')
      .addSelect('COALESCE(esc.refund_amount, 0)', 'refund_amount')
      .addSelect('COALESCE(esc.deposit_amount, 0)', 'deposit_amount')
      .addSelect(
        'COALESCE(esc.failed_deposit_count, 0)',
        'failed_deposit_count',
      )
      .addSelect('COALESCE(esc.in_flight_count, 0)', 'in_flight_count');
    const rawRows = await rowsQuery.getRawMany<Record<string, unknown>>();
    const rowById = new Map<number, Record<string, unknown>>();
    for (const row of rawRows) {
      const rowId = Number(row.id ?? 0);
      if (rowId > 0 && !rowById.has(rowId)) {
        rowById.set(rowId, row);
      }
    }
    const orderedRows = pagedBookingIds
      .map((id) => rowById.get(id) ?? null)
      .filter((row): row is Record<string, unknown> => row !== null);

    const latestCheckoutPaymentStatusBySalesOrderId =
      await this.findLatestCheckoutPaymentStatusBySalesOrderIds(
        orderedRows
          .map((row) => Number(row.sales_order_id ?? 0))
          .filter((id) => Number.isInteger(id) && id > 0),
      );

    const data: SellerDetailedBookingRow[] = orderedRows.map((row) => {
      const grossAmount = Number(row.gross_amount ?? 0);
      const totalAmount = Number(row.total_amount ?? grossAmount);
      const discountAmount = Number(row.discount_amount ?? 0);
      const platformFee = Number(row.platform_fee ?? 0);
      const netAmount = Number(row.net_amount ?? grossAmount - platformFee);
      const releasedAmount = Number(row.released_amount ?? 0);
      const refundAmount = Number(row.refund_amount ?? 0);
      const depositAmount = Number(row.deposit_amount ?? 0);
      const failedDepositCount = Number(row.failed_deposit_count ?? 0);
      const inFlightCount = Number(row.in_flight_count ?? 0);
      const checkoutOrderPaymentStatus = row.checkout_order_payment_status
        ? String(row.checkout_order_payment_status)
        : null;
      const salesOrderPaymentStatus = row.sales_order_payment_status
        ? String(row.sales_order_payment_status)
        : null;
      const heldAmount = Math.max(
        depositAmount - releasedAmount - refundAmount,
        0,
      );
      const slotCount = this.computeSlotCountFromSchedule({
        scheduledStartTime: row.scheduled_start_time
          ? String(row.scheduled_start_time)
          : null,
        scheduledEndTime: row.scheduled_end_time
          ? String(row.scheduled_end_time)
          : null,
        slotDurationMinutes: row.service_slot_duration_minutes,
      });
      const salesOrderId = row.sales_order_id
        ? Number(row.sales_order_id)
        : null;
      const latestCheckoutPaymentStatus =
        salesOrderId === null
          ? null
          : (latestCheckoutPaymentStatusBySalesOrderId.get(salesOrderId) ??
            null);
      const salesOrder: SellerDetailedBookingSalesOrderSummary | null =
        salesOrderId === null
          ? null
          : {
              id: salesOrderId,
              order_number: String(row.sales_order_number ?? ''),
              status: String(row.sales_order_status ?? ''),
              payment_method: row.sales_order_payment_method
                ? String(row.sales_order_payment_method)
                : null,
              subtotal: Number(row.sales_order_subtotal ?? 0),
              discount_amount: discountAmount,
              total_amount: Number(row.sales_order_total_amount ?? 0),
              created_at: row.sales_order_created_at
                ? new Date(String(row.sales_order_created_at))
                : new Date(String(row.created_at)),
              items_count: Number(row.sales_order_items_count ?? 0),
            };
      const escrowAggregate: EscrowAggregate = {
        deposit_amount: depositAmount,
        released_amount: releasedAmount,
        refund_amount: refundAmount,
        failed_deposit_count: failedDepositCount,
        in_flight_count: inFlightCount,
      };

      return {
        id: Number(row.id),
        booking_number: String(row.booking_number ?? ''),
        booking_group_number: row.booking_group_number
          ? String(row.booking_group_number)
          : null,
        slot_count: slotCount,
        booking_type:
          Number(row.open_play_event_id ?? 0) > 0 ? 'open_play' : 'regular',
        open_play_event_id:
          Number(row.open_play_event_id ?? 0) > 0
            ? Number(row.open_play_event_id)
            : null,
        sales_order_number: salesOrder?.order_number ?? null,
        sales_order: salesOrder,
        scheduled_date: row.scheduled_date ? String(row.scheduled_date) : null,
        scheduled_start_time: row.scheduled_start_time
          ? (normalizeTimeForPresentation(String(row.scheduled_start_time)) ??
            String(row.scheduled_start_time))
          : null,
        scheduled_end_time: row.scheduled_end_time
          ? (normalizeTimeForPresentation(String(row.scheduled_end_time)) ??
            String(row.scheduled_end_time))
          : null,
        created_at: new Date(String(row.created_at)),
        completed_at: row.completed_at
          ? new Date(String(row.completed_at))
          : null,
        status: String(row.status ?? ''),
        customer_name: String(row.customer_name ?? '').trim(),
        customer_phone: row.customer_phone
          ? String(row.customer_phone).trim()
          : null,
        guest_count: Number(row.guest_count ?? 1),
        guest_names_summary: row.guest_names_summary
          ? String(row.guest_names_summary).trim()
          : null,
        service_title: String(row.service_title ?? ''),
        payment_status: this.resolvePaymentStatusForDetailedReport({
          latestCheckoutPaymentStatus,
          checkoutOrderPaymentStatus,
          salesOrderPaymentStatus,
          escrowAggregate,
        }),
        gross_amount: grossAmount,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        released_amount: releasedAmount,
        refund_amount: refundAmount,
        held_amount: heldAmount,
        soa_status: this.resolveSoaStatus({
          netAmount,
          releasedAmount,
          refundAmount,
          heldAmount,
        }),
      };
    });

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async findBlockedSlots(
    query: QuerySellerDetailedBlockedSlotsDto,
    user: User,
  ): Promise<SellerDetailedBlockedSlotsListResponse> {
    const sellerId = this.resolveSellerId(query, user);
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const sortBy = query.sortBy ?? 'DESC';
    const sortField = query.sortField ?? 'unavailable_date';
    const dateField = query.date_field ?? 'unavailable_date';

    if (query.date_from) {
      this.parseDate(query.date_from, 'date_from');
    }
    if (query.date_to) {
      this.parseDate(query.date_to, 'date_to');
    }

    if (query.date_from && query.date_to && query.date_from > query.date_to) {
      throw new BadRequestException(
        'Invalid date range: date_from cannot be later than date_to',
      );
    }

    const qb = this.storeUnavailabilityRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.service', 'service')
      .leftJoinAndSelect('u.created_by', 'created_by')
      .where('u.deleted_at IS NULL')
      .andWhere('u.seller_id = :sellerId', { sellerId });

    if (query.status && query.status.trim()) {
      qb.andWhere('LOWER(u.status) = :status', {
        status: query.status.trim().toLowerCase(),
      });
    }

    if (query.date_from) {
      if (dateField === 'created_at') {
        qb.andWhere('u.created_at >= :dateFrom', {
          dateFrom: this.buildStartOfDay(query.date_from, 'date_from'),
        });
      } else {
        qb.andWhere('u.unavailable_date >= :dateFrom', {
          dateFrom: query.date_from,
        });
      }
    }

    if (query.date_to) {
      if (dateField === 'created_at') {
        qb.andWhere('u.created_at <= :dateTo', {
          dateTo: this.buildEndOfDay(query.date_to, 'date_to'),
        });
      } else {
        qb.andWhere('u.unavailable_date <= :dateTo', {
          dateTo: query.date_to,
        });
      }
    }

    if (query.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(
          COALESCE(service.title, '') ILIKE :search
          OR COALESCE(created_by.first_name, '') ILIKE :search
          OR COALESCE(created_by.last_name, '') ILIKE :search
          OR COALESCE(u.reason, '') ILIKE :search
          OR COALESCE(u.status, '') ILIKE :search
          OR COALESCE(u.start_time::text, '') ILIKE :search
          OR COALESCE(u.end_time::text, '') ILIKE :search
          OR (
            CASE
              WHEN u.is_full_day = true THEN 'Full Day'
              ELSE 'Partial Day'
            END
          ) ILIKE :search
        )`,
        { search },
      );
    }

    if (sortField === 'unavailable_date') {
      qb.orderBy('u.unavailable_date', sortBy, 'NULLS LAST').addOrderBy(
        'u.start_time',
        sortBy,
        'NULLS LAST',
      );
    } else {
      qb.orderBy(this.resolveBlockedSortExpression(sortField), sortBy);
    }

    qb.addOrderBy('u.id', 'DESC').skip(skip).take(take);

    const [rows, totalCount] = await qb.getManyAndCount();
    const data = rows.map((row) => this.mapBlockedSlotRow(row));

    return {
      data,
      totalCount,
      skip,
      take,
    };
  }

  async releaseBlockedSlot(
    id: number,
    user: User,
  ): Promise<SellerDetailedBlockedSlotRow> {
    const blockedSlot = await this.storeUnavailabilityRepository.findOne({
      where: { id },
      relations: ['service', 'created_by'],
    });

    if (!blockedSlot || blockedSlot.deleted_at) {
      throw new NotFoundException('Blocked slot not found');
    }

    if (!user.system_admin && blockedSlot.seller_id !== user.seller_id) {
      throw new ForbiddenException(
        'Access denied. Blocked slot belongs to a different seller.',
      );
    }

    if (String(blockedSlot.status ?? '').toLowerCase() !== 'active') {
      throw new BadRequestException('Blocked slot is already released.');
    }

    if (!this.canReleaseBlockedSlot(blockedSlot)) {
      throw new BadRequestException(
        'Only future blocked slots can be released.',
      );
    }

    const normalizedReleasedBlockType = String(blockedSlot.block_type || '')
      .trim()
      .toLowerCase();
    const hasLinkedOpenPlayEvent =
      normalizedReleasedBlockType === 'open_play' &&
      typeof blockedSlot.open_play_event_id === 'number' &&
      Number.isFinite(blockedSlot.open_play_event_id);

    if (hasLinkedOpenPlayEvent) {
      const registeredBookingCount = await this.bookingRepository.count({
        where: {
          seller_id: blockedSlot.seller_id,
          open_play_event_id: blockedSlot.open_play_event_id,
          deleted_at: IsNull(),
          status: In(OPEN_PLAY_REGISTERED_BOOKING_STATUSES),
        } as any,
      });

      if (registeredBookingCount > 0) {
        throw new BadRequestException(
          'Open play cannot be released because registered bookings already exist.',
        );
      }
    }

    await this.storeUnavailabilityRepository.save({
      ...blockedSlot,
      status: 'Inactive',
      updated_at: new Date(),
      updated_by: user?.id ? ({ id: user.id } as any) : blockedSlot.updated_by,
    });

    if (hasLinkedOpenPlayEvent) {
      const openPlayEventUpdatePayload: Record<string, unknown> = {
        status: 'Cancelled',
        updated_at: new Date(),
      };
      if (user?.id) {
        openPlayEventUpdatePayload.updated_by = { id: user.id } as any;
      }

      await this.openPlayEventRepository
        .createQueryBuilder()
        .update(OpenPlayEventEntity)
        .set(openPlayEventUpdatePayload as any)
        .where('id = :eventId', { eventId: blockedSlot.open_play_event_id })
        .andWhere('deleted_at IS NULL')
        .execute();
    }

    const updatedSlot = await this.storeUnavailabilityRepository.findOne({
      where: { id },
      relations: ['service', 'created_by'],
    });

    if (!updatedSlot) {
      throw new NotFoundException('Blocked slot not found');
    }

    const normalizedBlockType = String(updatedSlot.block_type || '')
      .trim()
      .toLowerCase();
    this.availabilityRealtimeService.publishAvailabilityChanged({
      change_type:
        normalizedBlockType === 'open_play'
          ? 'open_play_cancelled'
          : 'blocked_released',
      seller_id: updatedSlot.seller_id,
      service_id: updatedSlot.service_id ?? null,
      date: updatedSlot.unavailable_date,
      start_time: updatedSlot.is_full_day
        ? '00:00:00'
        : (updatedSlot.start_time ?? null),
      end_time: updatedSlot.is_full_day
        ? '23:59:59'
        : (updatedSlot.end_time ?? null),
      block_type:
        normalizedBlockType === 'open_play'
          ? 'open_play'
          : normalizedBlockType === 'maintenance'
            ? 'maintenance'
            : null,
      open_play_event_id: updatedSlot.open_play_event_id ?? null,
      source: 'detailed_report_release',
    });

    return this.mapBlockedSlotRow(updatedSlot);
  }

  async findById(
    bookingId: number,
    user: User,
  ): Promise<SellerDetailedBookingDetailResponse> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: [
        'customer',
        'cancelled_by_user',
        'service',
        'booking_addons',
        'booking_options',
        'sales_order',
        'sales_order.items',
        'sales_order.items.service',
        'sales_order.items.addons',
        'sales_order.items.options',
        'sales_order.items.variant',
        'sales_order.items.variant.product',
        'checkout_order',
        'booking_guests',
      ],
    });

    if (!booking || booking.deleted_at) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const sellerId = this.resolveSellerId(
      { seller_id: booking.seller_id } as QuerySellerDetailedBookingsDto,
      user,
    );
    if (booking.seller_id !== sellerId && !user.system_admin) {
      throw new ForbiddenException(
        'Access denied. Booking belongs to a different seller.',
      );
    }

    const bookingGroupNumber = String(
      booking.booking_group_number || '',
    ).trim();
    const relatedBookingsRaw =
      bookingGroupNumber.length > 0
        ? await this.bookingRepository.find({
            where: {
              seller_id: booking.seller_id,
              booking_group_number: bookingGroupNumber,
              deleted_at: IsNull(),
            } as any,
            relations: [
              'customer',
              'service',
              'booking_addons',
              'booking_options',
              'sales_order',
              'sales_order.items',
              'sales_order.items.service',
              'sales_order.items.addons',
              'sales_order.items.options',
              'sales_order.items.variant',
              'sales_order.items.variant.product',
              'checkout_order',
              'booking_guests',
            ],
          })
        : [booking];

    const relatedBookings = [...relatedBookingsRaw].sort((a, b) => {
      const aDate = a.scheduled_date
        ? new Date(a.scheduled_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bDate = b.scheduled_date
        ? new Date(b.scheduled_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) {
        return aDate - bDate;
      }

      return String(a.scheduled_start_time || '').localeCompare(
        String(b.scheduled_start_time || ''),
      );
    });

    const groupedSlotSummaries = await Promise.all(
      relatedBookings.map(async (relatedBooking) => {
        const relatedLatestPayment =
          await this.findLatestCheckoutPaymentForBooking(relatedBooking);
        const relatedPaymentStatus = this.resolvePaymentStatusForDetailedReport(
          {
            latestCheckoutPaymentStatus: relatedLatestPayment?.status,
            checkoutOrderPaymentStatus:
              relatedBooking.checkout_order?.payment_status,
            salesOrderPaymentStatus:
              (relatedBooking.sales_order as any)?.payment_status ?? null,
            escrowAggregate: {
              deposit_amount: 0,
              released_amount: 0,
              refund_amount: 0,
              failed_deposit_count: 0,
              in_flight_count: 0,
            },
          },
        );
        const relatedSortedGuests = [
          ...(relatedBooking.booking_guests ?? []),
        ].sort((a, b) =>
          a.sort_order !== b.sort_order
            ? a.sort_order - b.sort_order
            : a.id - b.id,
        );
        const relatedSlotCount = this.computeSlotCountFromSchedule({
          scheduledStartTime: relatedBooking.scheduled_start_time,
          scheduledEndTime:
            relatedBooking.scheduled_end_time ??
            relatedBooking.scheduled_start_time,
          slotDurationMinutes: relatedBooking.service?.slot_duration_minutes,
        });
        const relatedPrimaryGuest =
          relatedSortedGuests.find((guest) => guest.is_primary_contact) ??
          relatedSortedGuests[0];

        return {
          id: relatedBooking.id,
          booking_number: relatedBooking.booking_number,
          slot_count: relatedSlotCount,
          sales_order_number: relatedBooking.sales_order?.order_number ?? null,
          service_title: relatedBooking.service?.title ?? null,
          scheduled_date: relatedBooking.scheduled_date ?? null,
          scheduled_start_time:
            normalizeTimeForPresentation(relatedBooking.scheduled_start_time) ??
            relatedBooking.scheduled_start_time,
          scheduled_end_time:
            normalizeTimeForPresentation(relatedBooking.scheduled_end_time) ??
            null,
          status: String(relatedBooking.status || ''),
          payment_status: relatedPaymentStatus,
          total_amount: Number(relatedBooking.total ?? 0),
          customer_name: relatedPrimaryGuest
            ? `${relatedPrimaryGuest.first_name ?? ''} ${relatedPrimaryGuest.last_name ?? ''}`.trim()
            : `${relatedBooking.customer?.first_name ?? ''} ${relatedBooking.customer?.last_name ?? ''}`.trim(),
          guest_count: Number(
            relatedBooking.guest_count ??
              (relatedBooking.booking_guests?.length || 1),
          ),
        };
      }),
    );

    const transactions = await this.escrowTransactionRepository.find({
      where: { booking_id: bookingId },
      order: { created_at: 'DESC' },
    });

    const escrowAggregate = this.computeEscrowAggregate(transactions);
    const grossAmount = Number(booking.subtotal ?? 0);
    const discountAmount = Number(booking.discount_amount ?? 0);
    const platformFee = Number(booking.platform_fee ?? 0);
    const netAmount = Number(
      booking.provider_payout ?? booking.subtotal - booking.platform_fee,
    );
    const heldAmount = Math.max(
      escrowAggregate.deposit_amount -
        escrowAggregate.released_amount -
        escrowAggregate.refund_amount,
      0,
    );
    const latestCheckoutPayment =
      await this.findLatestCheckoutPaymentForBooking(booking);
    const paymentStatus = this.resolvePaymentStatusForDetailedReport({
      latestCheckoutPaymentStatus: latestCheckoutPayment?.status,
      checkoutOrderPaymentStatus: booking.checkout_order?.payment_status,
      salesOrderPaymentStatus:
        (booking.sales_order as any)?.payment_status ?? null,
      escrowAggregate,
    });
    const paymentProofUrl = await this.resolvePaymentProofUrl(
      latestCheckoutPayment,
    );
    const paymentProofUploadedAt =
      typeof latestCheckoutPayment?.metadata
        ?.guest_payment_proof_uploaded_at === 'string'
        ? latestCheckoutPayment.metadata.guest_payment_proof_uploaded_at
        : null;
    const paymentReference = latestCheckoutPayment?.transaction_number ?? null;
    const paymentMetadata = (latestCheckoutPayment?.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const approvedById = this.extractMetadataUserId(
      paymentMetadata,
      'seller_payment_confirmed_by',
    );
    const rejectedByIdFromMetadata = this.extractMetadataUserId(
      paymentMetadata,
      'seller_payment_rejected_by',
    );
    const approvedAt =
      this.extractMetadataIsoDate(
        paymentMetadata,
        'seller_payment_confirmed_at',
      ) ?? (booking.confirmed_at ? booking.confirmed_at.toISOString() : null);
    const rejectedAt =
      this.extractMetadataIsoDate(
        paymentMetadata,
        'seller_payment_rejected_at',
      ) ?? (booking.cancelled_at ? booking.cancelled_at.toISOString() : null);
    const rejectionReason =
      this.extractMetadataString(
        paymentMetadata,
        'seller_payment_rejection_reason',
      ) ??
      booking.cancellation_reason ??
      latestCheckoutPayment?.failure_reason ??
      null;
    const salesOrder = booking.sales_order ?? null;
    const hasOpenPlayEventId =
      typeof booking.open_play_event_id === 'number' &&
      Number.isFinite(booking.open_play_event_id);
    const openPlayEvent = hasOpenPlayEventId
      ? await this.openPlayEventRepository.findOne({
          where: {
            id: booking.open_play_event_id as number,
            deleted_at: IsNull(),
          },
        })
      : null;
    const salesOrderItems = this.mapSalesOrderItems(salesOrder);
    const groupedSalesOrders = Array.from(
      relatedBookings
        .reduce((acc, relatedBooking) => {
          const salesOrderDetail = this.mapSalesOrderDetail({
            salesOrder: relatedBooking.sales_order ?? null,
            discountAmount: relatedBooking.discount_amount,
          });
          if (!salesOrderDetail) {
            return acc;
          }

          if (!acc.has(salesOrderDetail.id)) {
            acc.set(salesOrderDetail.id, salesOrderDetail);
          }

          return acc;
        }, new Map<number, SellerDetailedBookingSalesOrderDetail>())
        .values(),
    ).sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.order_number.localeCompare(right.order_number);
    });

    // Attach sales_order_vouchers to each grouped sales order
    const salesOrderIds = groupedSalesOrders.map((o) => o.id);
    if (salesOrderIds.length > 0) {
      const allVouchers = await this.salesOrderVoucherRepository.find({
        where: { sales_order_id: In(salesOrderIds) },
      });
      for (const order of groupedSalesOrders) {
        order.vouchers = allVouchers
          .filter((v) => v.sales_order_id === order.id)
          .map((v) => ({
            id: v.id,
            voucher_code: v.voucher_code,
            voucher_discount: Number(v.voucher_discount),
            user_voucher_id: v.user_voucher_id,
          }));
      }
    }

    const primarySalesOrderSummary = this.mapSalesOrderSummary({
      salesOrder,
      discountAmount: booking.discount_amount,
      itemsCount: salesOrderItems.length,
    });
    const matchedPrimarySalesOrder = primarySalesOrderSummary
      ? groupedSalesOrders.find(
          (order) => order.id === primarySalesOrderSummary.id,
        )
      : undefined;
    const primarySalesOrderVouchers = matchedPrimarySalesOrder?.vouchers
      ? [...matchedPrimarySalesOrder.vouchers]
      : [];
    const sortedGuests = [...(booking.booking_guests ?? [])].sort((a, b) =>
      a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.id - b.id,
    );
    const primaryGuest =
      sortedGuests.find((guest) => guest.is_primary_contact) ?? sortedGuests[0];
    const guestNamesSummary =
      sortedGuests.length > 0
        ? sortedGuests
            .map((guest) =>
              `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim(),
            )
            .filter(Boolean)
            .join(', ')
        : null;
    const cancelledByName = booking.cancelled_by_user
      ? `${booking.cancelled_by_user.first_name ?? ''} ${booking.cancelled_by_user.last_name ?? ''}`.trim() ||
        booking.cancelled_by_user.email ||
        null
      : null;
    const rejectedById =
      rejectedByIdFromMetadata ??
      (typeof booking.cancelled_by === 'number' &&
      Number.isFinite(booking.cancelled_by)
        ? booking.cancelled_by
        : null);
    const actorUserIds = [
      approvedById,
      rejectedById,
      typeof booking.cancelled_by === 'number' &&
      Number.isFinite(booking.cancelled_by)
        ? booking.cancelled_by
        : null,
    ].filter(
      (id): id is number =>
        typeof id === 'number' && Number.isInteger(id) && id > 0,
    );
    const actorNameById = await this.findUserNamesByIds(actorUserIds);
    const approvedByName =
      (approvedById ? (actorNameById.get(approvedById) ?? null) : null) ?? null;
    let rejectedByName =
      (rejectedById ? (actorNameById.get(rejectedById) ?? null) : null) ??
      cancelledByName;
    const normalizedLatestPaymentStatus = this.normalizePaymentStatus(
      latestCheckoutPayment?.status,
    );
    const looksLikeTimeoutCancellation =
      normalizedLatestPaymentStatus === CheckoutPaymentStatusEnum.EXPIRED ||
      /payment window expired|timeout/i.test(String(rejectionReason || ''));
    const looksLikeGuestAbandonment = /abandon/i.test(
      String(rejectionReason || ''),
    );
    if (!rejectedByName && !rejectedById && rejectedAt) {
      if (looksLikeTimeoutCancellation) {
        rejectedByName = 'System (Payment Timeout)';
      } else if (looksLikeGuestAbandonment) {
        rejectedByName = 'Guest (Payment Abandoned)';
      }
    }
    const groupedSlotCount = groupedSlotSummaries.reduce((sum, slot) => {
      const slotCount = Number(slot.slot_count ?? 1);
      if (!Number.isFinite(slotCount) || slotCount <= 0) {
        return sum + 1;
      }
      return sum + slotCount;
    }, 0);

    return {
      booking: {
        id: booking.id,
        booking_number: booking.booking_number,
        booking_group_number: booking.booking_group_number ?? null,
        slot_count: groupedSlotCount > 0 ? groupedSlotCount : 1,
        grouped_slots: groupedSlotSummaries,
        booking_type: hasOpenPlayEventId ? 'open_play' : 'regular',
        open_play_event_id: booking.open_play_event_id ?? null,
        open_play_title: openPlayEvent?.title ?? null,
        open_play_max_applicants:
          typeof openPlayEvent?.max_applicants === 'number' &&
          Number.isFinite(openPlayEvent.max_applicants)
            ? openPlayEvent.max_applicants
            : null,
        open_play_skill_level_code: openPlayEvent?.skill_level_code ?? null,
        open_play_skill_level_label: openPlayEvent?.skill_level_code
          ? formatOpenPlaySkillLevelLabel(openPlayEvent.skill_level_code)
          : null,
        service_id: booking.service_id ?? null,
        service_type: booking.service?.service_type ?? null,
        sales_order_number: booking.sales_order?.order_number ?? null,
        scheduled_date: booking.scheduled_date,
        scheduled_start_time:
          normalizeTimeForPresentation(booking.scheduled_start_time) ??
          booking.scheduled_start_time,
        scheduled_end_time:
          normalizeTimeForPresentation(booking.scheduled_end_time) ?? null,
        created_at: booking.created_at,
        completed_at: booking.completed_at,
        status: booking.status,
        payment_status: paymentStatus,
        payment_reference: paymentReference,
        payment_proof_url: paymentProofUrl,
        payment_proof_uploaded_at: paymentProofUploadedAt,
        customer_name: primaryGuest
          ? `${primaryGuest.first_name ?? ''} ${primaryGuest.last_name ?? ''}`.trim()
          : `${booking.customer?.first_name ?? ''} ${booking.customer?.last_name ?? ''}`.trim(),
        customer_email: primaryGuest?.email ?? booking.customer?.email ?? null,
        customer_phone: primaryGuest?.phone ?? booking.customer?.phone ?? null,
        guest_count: Number(booking.guest_count ?? 1),
        guest_names_summary: guestNamesSummary,
        guests: sortedGuests.map((guest) => ({
          sort_order: guest.sort_order,
          is_primary_contact: guest.is_primary_contact,
          first_name: guest.first_name,
          last_name: guest.last_name,
          full_name:
            `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim(),
          email: guest.email ?? null,
          phone: guest.phone ?? null,
        })),
        service_title: booking.service?.title ?? null,
        service_address_text: booking.service_address_text,
        base_price: Number(booking.base_price ?? 0),
        addons_total: Number(booking.addons_total ?? 0),
        options_total: Number(booking.options_total ?? 0),
        location_additional_fee: Number(booking.location_additional_fee ?? 0),
        subtotal: Number(booking.subtotal ?? 0),
        customer_notes: booking.customer_notes,
        provider_notes: booking.provider_notes,
        internal_notes: booking.internal_notes,
        cancelled_by: booking.cancelled_by ?? null,
        cancelled_by_name: cancelledByName,
        cancellation_reason: booking.cancellation_reason,
        confirmed_at: booking.confirmed_at ?? null,
        cancelled_at: booking.cancelled_at ?? null,
        updated_at: booking.updated_at,
        approved_at: approvedAt,
        approved_by: approvedById,
        approved_by_name: approvedByName,
        rejected_at: rejectedAt,
        rejected_by: rejectedById,
        rejected_by_name: rejectedByName,
        rejection_reason: rejectionReason,
        booking_addons: this.mapBookingAddons(booking),
        booking_options: this.mapBookingOptions(booking),
      },
      statement_of_account: {
        gross_amount: grossAmount,
        discount_amount: discountAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        released_amount: escrowAggregate.released_amount,
        refund_amount: escrowAggregate.refund_amount,
        held_amount: heldAmount,
        deposit_amount: escrowAggregate.deposit_amount,
        soa_status: this.resolveSoaStatus({
          netAmount,
          releasedAmount: escrowAggregate.released_amount,
          refundAmount: escrowAggregate.refund_amount,
          heldAmount,
        }),
      },
      sales_order: primarySalesOrderSummary
        ? {
            ...primarySalesOrderSummary,
            items: salesOrderItems,
            vouchers: primarySalesOrderVouchers,
          }
        : null,
      sales_orders: groupedSalesOrders,
      escrow_transactions: transactions.map((transaction) => ({
        id: transaction.id,
        transaction_type: transaction.transaction_type,
        status: transaction.status,
        amount: Number(transaction.amount ?? 0),
        reference_number: transaction.reference_number ?? null,
        notes: transaction.notes ?? null,
        processed_at: transaction.processed_at ?? null,
        created_at: transaction.created_at,
      })),
    };
  }

  private mapSalesOrderSummary(input: {
    salesOrder: BookingEntity['sales_order'] | null | undefined;
    discountAmount?: unknown;
    itemsCount?: number;
  }): SellerDetailedBookingSalesOrderSummary | null {
    const salesOrder = input.salesOrder;
    if (!salesOrder) {
      return null;
    }

    const subtotal = Number(salesOrder.subtotal ?? 0);
    const totalAmount = Number(salesOrder.total_amount ?? 0);
    const providedDiscount = Number(input.discountAmount);
    const fallbackDiscount = subtotal - totalAmount;
    const discountAmount = Number.isFinite(providedDiscount)
      ? providedDiscount
      : Number.isFinite(fallbackDiscount)
        ? fallbackDiscount
        : 0;
    const providedItemsCount = Number(input.itemsCount);
    const fallbackItemsCount = Array.isArray(salesOrder.items)
      ? salesOrder.items.length
      : 0;
    const itemsCount =
      Number.isFinite(providedItemsCount) && providedItemsCount >= 0
        ? Math.floor(providedItemsCount)
        : fallbackItemsCount;

    return {
      id: salesOrder.id,
      order_number: salesOrder.order_number,
      status: String(salesOrder.status ?? ''),
      payment_method: salesOrder.payment_method ?? null,
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      created_at: salesOrder.created_at,
      items_count: itemsCount,
    };
  }

  private mapSalesOrderItems(
    salesOrder: BookingEntity['sales_order'] | null | undefined,
  ): SellerDetailedBookingSalesOrderItem[] {
    return (salesOrder?.items ?? []).map((item) => ({
      id: item.id,
      item_type: item.item_type,
      service_title: item.service?.title ?? null,
      product_name: item.variant?.product?.product_name ?? null,
      variant_name: item.variant?.variant_name ?? null,
      sku: item.variant?.sku ?? null,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      line_total: Number(item.total_price ?? 0),
      scheduled_date: item.scheduled_date ?? null,
      scheduled_start_time: item.scheduled_start_time ?? null,
      addons: (item.addons ?? []).map((addon) => ({
        id: addon.id,
        addon_id: addon.addon_id ?? null,
        addon_name: addon.addon_name,
        addon_code: addon.addon_code,
        quantity: Number(addon.quantity ?? 0),
        unit_price: Number(addon.unit_price ?? 0),
        total_price: Number(addon.total_price ?? 0),
        duration_minutes:
          addon.duration_minutes === null ||
          addon.duration_minutes === undefined
            ? null
            : Number(addon.duration_minutes),
      })),
      options: (item.options ?? []).map((option) => ({
        id: option.id,
        option_group_id: option.option_group_id ?? null,
        option_value_id: option.option_value_id ?? null,
        group_name: option.group_name,
        group_code: option.group_code,
        value_label: option.value_label,
        value_code: option.value_code,
        quantity: Number(option.quantity ?? 0),
        price_adjustment: Number(option.price_adjustment ?? 0),
        duration_adjustment_minutes: Number(
          option.duration_adjustment_minutes ?? 0,
        ),
      })),
    }));
  }

  private mapBookingAddons(
    booking: BookingEntity,
  ): SellerDetailedBookingAddon[] {
    return (booking.booking_addons ?? []).map((addon) => ({
      id: addon.id,
      addon_id: addon.addon_id ?? null,
      addon_name: addon.addon_name,
      addon_code: addon.addon_code,
      quantity: Number(addon.quantity ?? 0),
      unit_price: Number(addon.unit_price ?? 0),
      total_price: Number(addon.total_price ?? 0),
      duration_minutes:
        addon.duration_minutes === null || addon.duration_minutes === undefined
          ? null
          : Number(addon.duration_minutes),
    }));
  }

  private mapBookingOptions(
    booking: BookingEntity,
  ): SellerDetailedBookingOption[] {
    return (booking.booking_options ?? []).map((option) => ({
      id: option.id,
      option_group_id: option.option_group_id ?? null,
      option_value_id: option.option_value_id ?? null,
      group_name: option.group_name,
      group_code: option.group_code,
      value_label: option.value_label,
      value_code: option.value_code,
      quantity: Number(option.quantity ?? 0),
      price_adjustment: Number(option.price_adjustment ?? 0),
      duration_adjustment_minutes: Number(
        option.duration_adjustment_minutes ?? 0,
      ),
    }));
  }

  private mapSalesOrderDetail(input: {
    salesOrder: BookingEntity['sales_order'] | null | undefined;
    discountAmount?: unknown;
  }): SellerDetailedBookingSalesOrderDetail | null {
    const summary = this.mapSalesOrderSummary({
      salesOrder: input.salesOrder,
      discountAmount: input.discountAmount,
    });
    if (!summary) {
      return null;
    }

    return {
      ...summary,
      items: this.mapSalesOrderItems(input.salesOrder),
      vouchers: [],
    };
  }

  private extractMetadataUserId(
    metadata: Record<string, unknown>,
    key: string,
  ): number | null {
    const raw = metadata[key];
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private extractMetadataIsoDate(
    metadata: Record<string, unknown>,
    key: string,
  ): string | null {
    const raw = metadata[key];
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return null;
    }

    const parsedDate = new Date(raw);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }

  private extractMetadataString(
    metadata: Record<string, unknown>,
    key: string,
  ): string | null {
    const raw = metadata[key];
    if (typeof raw !== 'string') {
      return null;
    }

    const normalized = raw.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async findUserNamesByIds(
    userIds: number[],
  ): Promise<Map<number, string>> {
    const normalizedUserIds = [
      ...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0)),
    ];
    if (normalizedUserIds.length === 0) {
      return new Map<number, string>();
    }

    const users = await this.userRepository.find({
      where: {
        id: In(normalizedUserIds),
      },
      select: ['id', 'first_name', 'last_name', 'email'],
    });

    const userNameById = new Map<number, string>();
    for (const user of users) {
      const fullName =
        `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
        user.email ||
        '';
      if (!fullName) {
        continue;
      }
      userNameById.set(user.id, fullName);
    }

    return userNameById;
  }

  private resolveSellerId(query: { seller_id?: number }, user: User): number {
    if (user.system_admin) {
      if (query.seller_id) {
        return query.seller_id;
      }
      if (user.seller_id) {
        return user.seller_id;
      }
      throw new BadRequestException(
        'seller_id is required for system admin requests',
      );
    }

    if (!user.seller_id) {
      throw new ForbiddenException(
        'Only sellers can access this detailed report endpoint',
      );
    }

    if (query.seller_id && query.seller_id !== user.seller_id) {
      throw new ForbiddenException(
        'Access denied. seller_id does not belong to current user.',
      );
    }

    return user.seller_id;
  }

  private mapBlockedSlotRow(
    row: StoreUnavailabilityEntity,
  ): SellerDetailedBlockedSlotRow {
    const blockedByName = [
      row.created_by?.first_name,
      row.created_by?.last_name,
    ]
      .filter((chunk) => String(chunk ?? '').trim().length > 0)
      .join(' ')
      .trim();

    return {
      id: row.id,
      seller_id: row.seller_id,
      service_id: row.service_id ?? null,
      service_title: row.service?.title ?? null,
      blocked_by_user_id: row.created_by?.id ?? null,
      blocked_by_name: blockedByName || null,
      unavailable_date: row.unavailable_date,
      end_date: row.end_date ?? null,
      start_time: row.start_time ?? null,
      end_time: row.end_time ?? null,
      is_full_day: row.is_full_day,
      reason: row.reason ?? null,
      block_type: row.block_type ?? 'maintenance',
      open_play_event_id: row.open_play_event_id ?? null,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private canReleaseBlockedSlot(row: StoreUnavailabilityEntity): boolean {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const slotDate = this.parseDate(row.unavailable_date, 'unavailable_date');
    const blockedDate = new Date(
      slotDate.getFullYear(),
      slotDate.getMonth(),
      slotDate.getDate(),
      0,
      0,
      0,
      0,
    );

    if (blockedDate > today) {
      return true;
    }
    if (blockedDate < today) {
      return false;
    }
    if (row.is_full_day) {
      return false;
    }
    if (!row.start_time) {
      return false;
    }

    const [hour, minute, second] = this.parseTimeParts(row.start_time);
    const startDateTime = new Date(
      blockedDate.getFullYear(),
      blockedDate.getMonth(),
      blockedDate.getDate(),
      hour,
      minute,
      second,
      0,
    );

    return startDateTime > now;
  }

  private parseTimeParts(time: string): [number, number, number] {
    const match = String(time)
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) {
      throw new BadRequestException('Invalid time value');
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      Number.isNaN(second) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      throw new BadRequestException('Invalid time value');
    }

    return [hour, minute, second];
  }

  private resolveSortExpression(
    sortField: QuerySellerDetailedBookingsDto['sortField'],
    netAmountExpr: string,
  ): string {
    const sortMap: Record<NonNullable<typeof sortField>, string> = {
      awaiting_confirmation_priority: `CASE WHEN LOWER(booking.status::text) = 'awaiting_confirmation' THEN 0 ELSE 1 END`,
      created_at: 'booking.created_at',
      scheduled_date: 'booking.scheduled_date',
      booking_number: 'booking.booking_number',
      sales_order_number: 'sales_order.order_number',
      status: 'booking.status',
      gross_amount: 'booking.subtotal',
      total_amount: 'booking.total',
      net_amount: netAmountExpr,
      released_amount: 'COALESCE(esc.released_amount, 0)',
    };
    return (
      sortMap[sortField ?? 'awaiting_confirmation_priority'] ??
      sortMap.awaiting_confirmation_priority
    );
  }

  private resolveBlockedSortExpression(
    sortField: QuerySellerDetailedBlockedSlotsDto['sortField'],
  ): string {
    const sortMap: Record<NonNullable<typeof sortField>, string> = {
      unavailable_date: 'u.unavailable_date',
      created_at: 'u.created_at',
      service_title: 'service.title',
      status: 'u.status',
    };
    return sortMap[sortField ?? 'unavailable_date'] ?? 'u.unavailable_date';
  }

  private buildStartOfDay(dateString: string, label: string): Date {
    const date = this.parseDate(dateString, label);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private buildEndOfDay(dateString: string, label: string): Date {
    const date = this.parseDate(dateString, label);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private parseDate(dateString: string, label: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      throw new BadRequestException(`Invalid ${label} format. Use YYYY-MM-DD`);
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const isValidDate =
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
    if (!isValidDate) {
      throw new BadRequestException(`Invalid ${label} value`);
    }
    return date;
  }

  private async findLatestCheckoutPaymentForBooking(
    booking: BookingEntity,
  ): Promise<CheckoutPaymentEntity | null> {
    const salesOrderIds = new Set<number>();

    if (
      typeof booking.sales_order_id === 'number' &&
      booking.sales_order_id > 0
    ) {
      salesOrderIds.add(booking.sales_order_id);
    }

    if (salesOrderIds.size === 0) {
      return null;
    }

    const orderLinks = await this.checkoutPaymentOrderRepository.find({
      where: {
        sales_order_id: In([...salesOrderIds]),
      },
      order: {
        created_at: 'DESC',
      },
    });

    const paymentIdsFromLinks = [
      ...new Set(
        orderLinks
          .map((link) => link.checkout_payment_id)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    ];

    if (paymentIdsFromLinks.length > 0) {
      return this.checkoutPaymentRepository.findOne({
        where: {
          id: In(paymentIdsFromLinks),
        },
        order: {
          created_at: 'DESC',
        },
      });
    }

    return this.checkoutPaymentRepository.findOne({
      where: {
        sales_order_id: In([...salesOrderIds]),
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  private async findLatestCheckoutPaymentStatusBySalesOrderIds(
    salesOrderIds: number[],
  ): Promise<Map<number, string>> {
    const statusBySalesOrderId = new Map<number, string>();
    const normalizedSalesOrderIds = [
      ...new Set(
        salesOrderIds.filter((id) => Number.isInteger(id) && Number(id) > 0),
      ),
    ];
    if (normalizedSalesOrderIds.length === 0) {
      return statusBySalesOrderId;
    }

    const orderLinks = await this.checkoutPaymentOrderRepository.find({
      where: {
        sales_order_id: In(normalizedSalesOrderIds),
      },
      order: {
        created_at: 'DESC',
      },
    });

    const latestPaymentIdBySalesOrderId = new Map<number, number>();
    for (const link of orderLinks) {
      if (
        !latestPaymentIdBySalesOrderId.has(link.sales_order_id) &&
        Number(link.checkout_payment_id) > 0
      ) {
        latestPaymentIdBySalesOrderId.set(
          link.sales_order_id,
          link.checkout_payment_id,
        );
      }
    }

    const paymentIds = [
      ...new Set([...latestPaymentIdBySalesOrderId.values()]),
    ].filter((id) => Number(id) > 0);
    if (paymentIds.length > 0) {
      const payments = await this.checkoutPaymentRepository.find({
        where: {
          id: In(paymentIds),
        },
      });
      const paymentStatusById = new Map<number, string>();
      for (const payment of payments) {
        paymentStatusById.set(payment.id, payment.status);
      }

      for (const [salesOrderId, paymentId] of latestPaymentIdBySalesOrderId) {
        const normalizedStatus = this.normalizePaymentStatus(
          paymentStatusById.get(paymentId),
        );
        if (normalizedStatus) {
          statusBySalesOrderId.set(salesOrderId, normalizedStatus);
        }
      }
    }

    const salesOrderIdsWithoutLink = normalizedSalesOrderIds.filter(
      (id) => !statusBySalesOrderId.has(id),
    );
    if (salesOrderIdsWithoutLink.length > 0) {
      const directPayments = await this.checkoutPaymentRepository.find({
        where: {
          sales_order_id: In(salesOrderIdsWithoutLink),
        },
        order: {
          created_at: 'DESC',
        },
      });
      for (const payment of directPayments) {
        const salesOrderId = Number(payment.sales_order_id ?? 0);
        if (salesOrderId <= 0 || statusBySalesOrderId.has(salesOrderId)) {
          continue;
        }
        const normalizedStatus = this.normalizePaymentStatus(payment.status);
        if (normalizedStatus) {
          statusBySalesOrderId.set(salesOrderId, normalizedStatus);
        }
      }
    }

    return statusBySalesOrderId;
  }

  private async resolvePaymentProofUrl(
    payment: CheckoutPaymentEntity | null,
  ): Promise<string | null> {
    const metadata = (payment?.metadata || {}) as Record<string, any>;
    const directUrl =
      typeof metadata.guest_payment_proof_url === 'string' &&
      metadata.guest_payment_proof_url.trim().length > 0
        ? metadata.guest_payment_proof_url.trim()
        : null;

    if (directUrl) {
      return directUrl;
    }

    const proofKey =
      typeof metadata.guest_payment_proof_key === 'string' &&
      metadata.guest_payment_proof_key.trim().length > 0
        ? metadata.guest_payment_proof_key.trim()
        : null;

    if (!proofKey) {
      return null;
    }

    return this.resolveStoragePublicUrl(proofKey);
  }

  private async resolveStoragePublicUrl(key: string): Promise<string | null> {
    try {
      const result = await this.storageService.get(key);
      if (typeof result === 'string' && result.trim().length > 0) {
        return result.trim();
      }

      if (
        result &&
        typeof result === 'object' &&
        typeof (result as any).url === 'string' &&
        (result as any).url.trim().length > 0
      ) {
        return (result as any).url.trim();
      }

      return null;
    } catch {
      return null;
    }
  }

  private computeEscrowAggregate(
    transactions: EscrowTransactionEntity[],
  ): EscrowAggregate {
    return transactions.reduce<EscrowAggregate>(
      (acc, tx) => {
        if (
          tx.transaction_type === EscrowTransactionTypeEnum.DEPOSIT &&
          tx.status === EscrowTransactionStatusEnum.FAILED
        ) {
          acc.failed_deposit_count += 1;
        }
        if (
          [
            EscrowTransactionTypeEnum.DEPOSIT,
            EscrowTransactionTypeEnum.REFUND,
          ].includes(tx.transaction_type) &&
          [
            EscrowTransactionStatusEnum.PENDING,
            EscrowTransactionStatusEnum.PROCESSING,
          ].includes(tx.status)
        ) {
          acc.in_flight_count += 1;
        }

        if (tx.status === EscrowTransactionStatusEnum.COMPLETED) {
          const amount = Number(tx.amount ?? 0);
          if (tx.transaction_type === EscrowTransactionTypeEnum.DEPOSIT) {
            acc.deposit_amount += amount;
          }
          if (
            tx.transaction_type === EscrowTransactionTypeEnum.RELEASE ||
            tx.transaction_type === EscrowTransactionTypeEnum.DISPUTE_RELEASE
          ) {
            acc.released_amount += amount;
          }
          if (tx.transaction_type === EscrowTransactionTypeEnum.REFUND) {
            acc.refund_amount += amount;
          }
        }
        return acc;
      },
      {
        deposit_amount: 0,
        released_amount: 0,
        refund_amount: 0,
        failed_deposit_count: 0,
        in_flight_count: 0,
      },
    );
  }

  private resolvePaymentStatusForDetailedReport(params: {
    latestCheckoutPaymentStatus?: string | null;
    checkoutOrderPaymentStatus?: string | null;
    salesOrderPaymentStatus?: string | null;
    escrowAggregate: EscrowAggregate;
  }): string {
    const fromCheckoutPayment = this.normalizePaymentStatus(
      params.latestCheckoutPaymentStatus,
    );
    if (fromCheckoutPayment) {
      return fromCheckoutPayment;
    }

    const fromCheckoutOrder = this.normalizePaymentStatus(
      params.checkoutOrderPaymentStatus,
    );
    if (fromCheckoutOrder) {
      return fromCheckoutOrder;
    }

    const fromSalesOrder = this.normalizePaymentStatus(
      params.salesOrderPaymentStatus,
    );
    if (fromSalesOrder) {
      return fromSalesOrder;
    }

    return this.derivePaymentStatusFromEscrowAggregate(params.escrowAggregate);
  }

  private normalizePaymentStatus(status?: string | null): string | null {
    if (!status) {
      return null;
    }
    const normalized = String(status).trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const map: Record<string, string> = {
      paid: 'paid',
      completed: 'paid',
      pending_release: 'paid',
      pending: 'pending',
      awaiting_payment: 'pending',
      processing: 'processing',
      failed: 'failed',
      cancelled: 'failed',
      expired: 'failed',
      chargeback: 'failed',
      partial: 'partial',
      partially_refunded: 'partial',
      refunded: 'refunded',
      fully_refunded: 'refunded',
    };

    return map[normalized] ?? normalized;
  }

  private derivePaymentStatusFromEscrowAggregate(
    escrowAggregate: EscrowAggregate,
  ): string {
    if (escrowAggregate.in_flight_count > 0) {
      return 'processing';
    }
    if (escrowAggregate.refund_amount > 0) {
      if (
        escrowAggregate.deposit_amount > 0 &&
        escrowAggregate.refund_amount < escrowAggregate.deposit_amount
      ) {
        return 'partial';
      }
      return 'refunded';
    }
    if (
      escrowAggregate.deposit_amount > 0 ||
      escrowAggregate.released_amount > 0
    ) {
      return 'paid';
    }
    if (escrowAggregate.failed_deposit_count > 0) {
      return 'failed';
    }
    return 'pending';
  }

  private computeSlotCountFromSchedule(input: {
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    slotDurationMinutes?: unknown;
  }): number {
    const startMinutes = this.timeToMinutes(input.scheduledStartTime);
    const endMinutes = this.timeToMinutes(
      input.scheduledEndTime ?? input.scheduledStartTime,
    );
    if (startMinutes === null || endMinutes === null) {
      return 1;
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes <= 0) {
      return 1;
    }

    const slotDuration = this.resolveSlotDurationMinutes(
      input.slotDurationMinutes,
    );
    const count = Math.ceil(durationMinutes / slotDuration);
    if (!Number.isFinite(count) || count <= 0) {
      return 1;
    }

    return count;
  }

  private resolveSlotDurationMinutes(value: unknown): number {
    const normalized = Number(value ?? 0);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 60;
    }
    return normalized;
  }

  private timeToMinutes(time?: string | null): number | null {
    const raw = String(time ?? '').trim();
    if (!raw) {
      return null;
    }

    const twentyFourHourMatch = raw.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/,
    );
    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);
      const seconds = Number(twentyFourHourMatch[3] ?? 0);
      const isValidMidnightBoundary =
        hours === 24 && minutes === 0 && seconds === 0;
      if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds) ||
        hours < 0 ||
        hours > 24 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59 ||
        (hours === 24 && !isValidMidnightBoundary)
      ) {
        return null;
      }

      return hours * 60 + minutes + seconds / 60;
    }

    const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!twelveHourMatch) {
      return null;
    }

    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = String(twelveHourMatch[3] || '').toUpperCase();
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  private resolveSoaStatus(params: {
    netAmount: number;
    releasedAmount: number;
    refundAmount: number;
    heldAmount: number;
  }): SoaStatus {
    if (params.netAmount <= 0 || params.refundAmount >= params.netAmount) {
      return 'refunded';
    }
    if (params.releasedAmount >= params.netAmount) {
      return 'released';
    }
    if (params.releasedAmount > 0 || params.refundAmount > 0) {
      return 'partial';
    }
    if (params.heldAmount > 0) {
      return 'held';
    }
    return 'held';
  }
}
