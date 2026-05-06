import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';
import { QuoteRequestStatusEnum } from '@/quote-requests/domain/quote-request';
import { QuotationItemEntity } from '@/quotation-items/persistence/entities/quotation-item.entity';
import { QuotationItemTypeEnum } from '@/quotation-items/enums/quotation-item-type.enum';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { SalesOrderQuotationSnapshotsService } from '@/sales-order-quotation-snapshots/sales-order-quotation-snapshots.service';
import { FormSubmissionsService } from '@/form-submissions/form-submissions.service';
import { User } from '@/users/domain/user';
import { ParametersService } from '@/parameters/parameters.service';
import {
  QuotationCheckoutPreviewResponseDto,
  QuotationCheckoutPreviewItem,
  BookingPreview,
  QuotationCheckoutSummary,
} from './dto/quotation-checkout-preview.dto';
import {
  ProcessQuotationCheckoutDto,
  QuotationCheckoutResultDto,
} from './dto/process-quotation-checkout.dto';

const MAX_ORDER_NUMBER_RETRIES = 3;

/**
 * Quotation Checkout Service.
 *
 * Handles direct checkout from quotation acceptance (skip cart flow).
 * Creates SalesOrder, SalesOrderItems, and manages booking status transitions.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class QuotationCheckoutService {
  constructor(
    @InjectRepository(QuoteRequestEntity)
    private readonly quotationRepository: Repository<QuoteRequestEntity>,
    @InjectRepository(QuotationItemEntity)
    private readonly quotationItemRepository: Repository<QuotationItemEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    private readonly dataSource: DataSource,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
    private readonly snapshotsService: SalesOrderQuotationSnapshotsService,
    private readonly formSubmissionsService: FormSubmissionsService,
    private readonly parametersService: ParametersService,
  ) {}

  private async getPlatformFeePercent(): Promise<number> {
    const parameter = await this.parametersService.findByCode(
      'platform_fee_percent',
    );
    const platformFeePercent = Number(parameter?.numeric_value);

    if (Number.isFinite(platformFeePercent) && platformFeePercent >= 0) {
      return platformFeePercent;
    }

    return 0.0;
  }

  /**
   * Get checkout preview for a quotation.
   *
   * Shows all items, existing bookings (preventive), and pricing summary.
   *
   * Recurrence (Phase A4): For preventive, only bookings with quotation_id = quotationId
   * are included. So one quotation can cover one occurrence (one booking linked) or
   * multiple (provider must set quotation_id on each linked booking when creating the quote).
   * Only those linked bookings are updated to PENDING on checkout; others stay in their current status.
   *
   * @param quotationId - Quotation ID
   * @param user - Current authenticated user (customer)
   * @returns Checkout preview
   */
  async getCheckoutPreview(
    quotationId: number,
    user: User,
  ): Promise<QuotationCheckoutPreviewResponseDto> {
    // 1. Get quotation with items
    const quotation = await this.quotationRepository.findOne({
      where: { id: quotationId },
      relations: ['customer', 'seller', 'service'],
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }

    // 2. Verify user is the customer
    if (quotation.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer can checkout this quotation',
      );
    }

    // 3. Get quotation items
    const items = await this.quotationItemRepository.find({
      where: { quotation_id: quotationId },
      order: { sequence_order: 'ASC' },
    });

    // 4. Check status and expiry
    const errors: string[] = [];
    const warnings: string[] = [];

    const isExpired =
      quotation.quote_expires_at &&
      new Date(quotation.quote_expires_at) < new Date();

    if (quotation.status !== QuoteRequestStatusEnum.QUOTED) {
      errors.push(
        `Quotation status is ${quotation.status}. Only QUOTED quotations can be checked out.`,
      );
    }

    if (isExpired) {
      errors.push('This quotation has expired. Please request a new quote.');
    }

    if (items.length === 0) {
      errors.push('Quotation has no items.');
    }

    // 5. Determine flow type (preventive or reactive)
    // Preventive = only bookings for maintenance services (service_type = 'standard') linked to THIS quotation.
    // Diagnostic bookings (service_type = 'assessment') are part of the reactive flow and
    // should NOT be counted as preventive — a new booking is created from the quotation instead.
    const linkedBookings: BookingEntity[] = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('services', 'service', 'service.id = booking.service_id')
      .where('booking.quotation_id = :quotationId', { quotationId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatusEnum.PENDING_REVIEW,
          BookingStatusEnum.AWAITING_QUOTATION,
        ],
      })
      .andWhere('service.service_type = :serviceType', {
        serviceType: 'standard',
      })
      .andWhere('booking.deleted_at IS NULL')
      .orderBy('booking.scheduled_date', 'ASC')
      .getMany();

    const isPreventiveFlow = linkedBookings.length > 0;
    const flowType = isPreventiveFlow ? 'preventive' : 'reactive';

    // 6. Build preview items
    const previewItems: QuotationCheckoutPreviewItem[] = items.map(
      (item: QuotationItemEntity) => ({
        quotation_item_id: item.id,
        item_type: item.item_type,
        service_id: item.service_id,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        suggested_schedule_date: item.suggested_schedule_date
          ? new Date(item.suggested_schedule_date).toISOString().split('T')[0]
          : null,
      }),
    );

    // 7. Build booking previews (preventive flow)
    const bookingPreviews: BookingPreview[] = linkedBookings.map(
      (booking: BookingEntity) => ({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        current_status: booking.status,
        scheduled_date: booking.scheduled_date
          ? new Date(booking.scheduled_date).toISOString().split('T')[0]
          : '',
        scheduled_start_time: booking.scheduled_start_time,
        action_note:
          'Will be updated to PENDING after checkout with pricing from quotation',
      }),
    );

    // 8. Calculate summary
    const serviceItems = items.filter(
      (i) => i.item_type === QuotationItemTypeEnum.SERVICE,
    );
    const materialItems = items.filter(
      (i) => i.item_type === QuotationItemTypeEnum.MATERIAL,
    );

    const servicesSubtotal = serviceItems.reduce(
      (sum: number, i: QuotationItemEntity) => sum + Number(i.total_price),
      0,
    );
    const materialsSubtotal = materialItems.reduce(
      (sum: number, i: QuotationItemEntity) => sum + Number(i.total_price),
      0,
    );
    const subtotal = servicesSubtotal + materialsSubtotal;
    const platformFeePercent = await this.getPlatformFeePercent();
    const platformFee = (subtotal * platformFeePercent) / 100;
    const totalAmount = subtotal; // Platform fee is deducted from seller payout

    const summary: QuotationCheckoutSummary = {
      item_count: items.length,
      service_item_count: serviceItems.length,
      material_item_count: materialItems.length,
      services_subtotal: servicesSubtotal,
      materials_subtotal: materialsSubtotal,
      subtotal,
      platform_fee: platformFee,
      platform_fee_percent: platformFeePercent,
      total_amount: totalAmount,
    };

    return {
      can_checkout: errors.length === 0,
      quotation_id: quotation.id,
      quote_number: quotation.quote_number,
      quotation_status: quotation.status,
      expires_at: quotation.quote_expires_at,
      is_expired: isExpired || false,
      flow_type: flowType,
      items: previewItems,
      existing_bookings:
        isPreventiveFlow && bookingPreviews.length > 0
          ? bookingPreviews
          : undefined,
      summary,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Process quotation checkout.
   *
   * Creates SalesOrder, updates/creates bookings, processes payment.
   *
   * @param quotationId - Quotation ID
   * @param input - Checkout DTO
   * @param user - Current authenticated user (customer)
   * @returns Checkout result
   */
  async processCheckout(
    quotationId: number,
    input: ProcessQuotationCheckoutDto,
    user: User,
  ): Promise<QuotationCheckoutResultDto> {
    // 1. Validate quotation
    const preview = await this.getCheckoutPreview(quotationId, user);

    if (!preview.can_checkout) {
      throw new BadRequestException(
        `Cannot checkout: ${preview.errors?.join(', ')}`,
      );
    }

    // 2. Get quotation entity
    const quotation = await this.quotationRepository.findOne({
      where: { id: quotationId },
      relations: ['customer', 'seller', 'service'],
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // 3. Execute checkout in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4. Generate order number
      const orderNumber = await this.generateUniqueOrderNumber();

      // 5. Create SalesOrder
      const salesOrder = queryRunner.manager.create(SalesOrderEntity, {
        user_id: user.id,
        seller_id: quotation.seller_id,
        order_number: orderNumber,
        status: OrderStatusEnum.PROCESSING,
        subtotal: preview.summary.subtotal,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: preview.summary.total_amount,
        source_quotation_id: quotationId,
        delivery_address_id: input.service_address_id || null,
        notes: input.notes || null,
        checkout_source: input.checkout_source || 'etravajoe',
        created_by: user as any,
        updated_by: user as any,
      });

      const savedOrder = await queryRunner.manager.save(
        SalesOrderEntity,
        salesOrder,
      );

      // 6. Create SalesOrderItems from quotation items
      const quotationItems = await queryRunner.manager
        .getRepository(QuotationItemEntity)
        .find({
          where: { quotation_id: quotationId },
          order: { sequence_order: 'ASC' },
        });

      const salesOrderItemRepo =
        queryRunner.manager.getRepository(SalesOrderItemEntity);
      const salesOrderItemMap = new Map<number, number>();

      for (const qItem of quotationItems) {
        const scheduleOverride = input.schedule_overrides?.find(
          (s) => s.quotation_item_id === qItem.id,
        );
        const isService = qItem.item_type === QuotationItemTypeEnum.SERVICE;

        // CHK_sales_order_items_variant_or_service: service => (service_id NOT NULL, variant_id NULL); product => (variant_id NOT NULL, service_id NULL)
        // For service items, use quotation's service_id as fallback if quotation item doesn't have one
        const effectiveServiceId = isService
          ? (qItem.service_id ?? quotation.service_id)
          : null;

        if (isService) {
          if (effectiveServiceId == null) continue; // skip service item with no service_id and no quotation service_id
        } else {
          if (qItem.product_id == null) continue; // skip material with no product_id (would violate variant_id NOT NULL for product)
        }

        const item_type = isService
          ? CartItemTypeEnum.SERVICE
          : CartItemTypeEnum.PRODUCT;
        const variant_id = isService ? null : qItem.product_id;
        const service_id = effectiveServiceId;

        const scheduledDate = scheduleOverride
          ? new Date(scheduleOverride.scheduled_date)
          : qItem.suggested_schedule_date
            ? new Date(qItem.suggested_schedule_date)
            : null;
        const scheduledStartTime =
          scheduleOverride?.scheduled_start_time || '09:00:00';

        const salesOrderItem = salesOrderItemRepo.create({
          order_id: savedOrder.id,
          item_type,
          variant_id,
          service_id,
          quantity: qItem.quantity,
          quantity_returned: 0,
          unit_price: Number(qItem.unit_price),
          total_price: Number(qItem.total_price),
          scheduled_date: scheduledDate,
          scheduled_start_time: scheduledStartTime,
          source_quotation_id: quotationId,
          source_quotation_item_id: qItem.id,
          created_by: user as any,
          updated_by: user as any,
        });
        const savedItem = await salesOrderItemRepo.save(salesOrderItem);
        salesOrderItemMap.set(qItem.id, savedItem.id);
      }

      // 6b. Create quotation snapshots (immutable record of what was quoted)
      try {
        await this.snapshotsService.createFromQuotationItems(
          savedOrder.id,
          quotationId,
          quotationItems.map((qi) => ({
            id: qi.id,
            item_type: qi.item_type,
            service_id: qi.service_id,
            product_id: qi.product_id,
            name: qi.name,
            description: qi.description,
            quantity: qi.quantity,
            unit_type: qi.unit_type,
            unit_price: Number(qi.unit_price),
            total_price: Number(qi.total_price),
            scheduled_date: qi.suggested_schedule_date ?? null,
            sequence_order: qi.sequence_order,
          })),
          salesOrderItemMap,
          user.id,
        );
      } catch (err) {
        console.error('Failed to create quotation snapshots:', err);
      }

      // 7. Handle bookings based on flow type
      const bookingIds: number[] = [];

      if (preview.flow_type === 'preventive' && preview.existing_bookings) {
        // Update existing bookings from PENDING_REVIEW to PENDING
        // After customer accepts & pays, booking goes back to PENDING for provider to confirm schedule
        const bookingRepo = queryRunner.manager.getRepository(BookingEntity);
        const subtotal = preview.summary.subtotal;
        const basePrice = preview.summary.services_subtotal ?? subtotal;
        const addonsTotal = 0;
        const optionsTotal = preview.summary.materials_subtotal ?? 0;
        const providerPayout = subtotal - preview.summary.platform_fee;

        for (const bookingPreview of preview.existing_bookings) {
          // Phase B1: Set full pricing breakdown from quotation summary (total, subtotal, base_price, addons_total, options_total, platform_fee, provider_payout)
          await bookingRepo.update(bookingPreview.booking_id, {
            status: BookingStatusEnum.PENDING,
            base_price: basePrice,
            addons_total: addonsTotal,
            options_total: optionsTotal,
            subtotal,
            total: subtotal,
            platform_fee: preview.summary.platform_fee,
            platform_fee_percent: preview.summary.platform_fee_percent,
            provider_payout: providerPayout,
            sales_order_id: savedOrder.id,
          });
          bookingIds.push(bookingPreview.booking_id);
        }
      } else {
        // Reactive/diagnostic flow: Create ONE single booking for the entire quotation.
        // All quotation service items become milestones on this single booking (step 9b).
        // Use the first service item's service_id (the actual maintenance/repair service)
        // instead of quotation.service_id (the diagnostic/assessment service).
        const firstServiceItem = quotationItems.find(
          (i) => i.item_type === QuotationItemTypeEnum.SERVICE,
        );
        const effectiveServiceId =
          firstServiceItem?.service_id ?? quotation.service_id;
        if (effectiveServiceId != null) {
          const firstScheduleOverride = firstServiceItem
            ? input.schedule_overrides?.find(
                (s) => s.quotation_item_id === firstServiceItem.id,
              )
            : undefined;

          const scheduledDate = firstScheduleOverride
            ? new Date(firstScheduleOverride.scheduled_date)
            : firstServiceItem?.suggested_schedule_date
              ? new Date(firstServiceItem.suggested_schedule_date)
              : new Date();

          // Total price is the sum of ALL quotation items (services + materials)
          const totalPrice = preview.summary.total_amount;

          // Create a single booking via service.
          // skipTemplateMilestones = false so the booking gets proper
          // checklist milestones from service milestone templates
          // (with response_type, category, measurement_unit, etc.).
          const booking = await this.bookingsService.createFromQuotationItem({
            quotation_id: quotationId,
            quotation_item_id: firstServiceItem?.id ?? 0,
            service_id: effectiveServiceId,
            seller_id: quotation.seller_id,
            customer_id: user.id,
            scheduled_date: scheduledDate,
            unit_price: totalPrice,
            quantity: 1,
            total_price: totalPrice,
            notes: input.notes || undefined,
            skipTemplateMilestones: true,
          });

          bookingIds.push(booking.id);

          // Link booking to sales order and copy service address from assessment booking
          const updateFields: Partial<BookingEntity> = {
            sales_order_id: savedOrder.id,
          };

          // Copy service_address_id from assessment booking if available
          if (quotation.assessment_booking_id) {
            const assessmentBooking = await queryRunner.manager
              .getRepository(BookingEntity)
              .findOne({ where: { id: quotation.assessment_booking_id } });
            if (assessmentBooking?.service_address_id) {
              updateFields.service_address_id =
                assessmentBooking.service_address_id;
            }
          }

          await queryRunner.manager
            .getRepository(BookingEntity)
            .update(booking.id, updateFields);

          // Copy form submission (Requirements) from assessment booking
          if (quotation.assessment_booking_id) {
            try {
              const assessmentBooking = await queryRunner.manager
                .getRepository(BookingEntity)
                .findOne({ where: { id: quotation.assessment_booking_id } });
              if (assessmentBooking?.form_submission_id) {
                const copiedSubmission =
                  await this.formSubmissionsService.createCopyForBooking(
                    assessmentBooking.form_submission_id,
                    booking.id,
                    user,
                  );
                await queryRunner.manager
                  .getRepository(BookingEntity)
                  .update(booking.id, {
                    form_submission_id: copiedSubmission.id,
                  });
              }
            } catch (err) {
              console.error(
                `Failed to copy form submission to booking ${booking.id}:`,
                err,
              );
            }
          }
        }
      }

      // 7b. Complete assessment booking (Booking #1) ONLY for reactive/diagnostic flow
      if (!preview.existing_bookings && quotation.assessment_booking_id) {
        await queryRunner.manager
          .getRepository(BookingEntity)
          .update(quotation.assessment_booking_id, {
            status: BookingStatusEnum.COMPLETED,
            completed_at: new Date(),
          });
      }

      // 8. Update quotation status to ACCEPTED
      await queryRunner.manager
        .getRepository(QuoteRequestEntity)
        .update(quotationId, {
          status: QuoteRequestStatusEnum.ACCEPTED,
          responded_at: new Date(),
          result_sales_order_id: savedOrder.id,
        });

      // 9. Commit transaction
      await queryRunner.commitTransaction();

      // 9b. Phase D1: Create booking milestones from quotation service items (preventive flow)
      if (preview.flow_type === 'preventive' && bookingIds.length > 0) {
        for (const bid of bookingIds) {
          try {
            await this.bookingsService.createMilestonesFromQuotationServiceItems(
              bid,
              quotationId,
              user,
            );
          } catch (err) {
            console.error(
              `Failed to create milestones from quotation for booking ${bid}:`,
              err,
            );
          }
        }
      }

      // 9c. Create booking milestones from quotation service items (reactive/diagnostic flow)
      if (preview.flow_type === 'reactive' && bookingIds.length > 0) {
        for (const bid of bookingIds) {
          try {
            await this.bookingsService.createMilestonesFromQuotationServiceItems(
              bid,
              quotationId,
              user,
            );
          } catch (err) {
            console.error(
              `Failed to create milestones from quotation for booking ${bid}:`,
              err,
            );
          }
        }
      }

      // 10. Send notifications
      try {
        // Notify seller about accepted quotation
        if (quotation.seller?.user_id) {
          await this.notificationsService.create({
            user_id: quotation.seller.user_id,
            type: NotificationTypeEnum.QUOTE_ACCEPTED,
            title: 'Quotation Accepted',
            body: `Your quotation #${quotation.quote_number} has been accepted. Order #${orderNumber} created.`,
            entity_type: 'sales_order',
            entity_id: savedOrder.id,
            action_url: `/seller/orders/${savedOrder.id}`,
            send_push: true,
          });
        }

        // Notify customer about order creation
        await this.notificationsService.create({
          user_id: user.id,
          type: NotificationTypeEnum.ORDER_PLACED,
          title: 'Order Placed',
          body: `Your order #${orderNumber} from quotation has been placed successfully.`,
          entity_type: 'sales_order',
          entity_id: savedOrder.id,
          action_url: `/orders/${savedOrder.id}`,
          send_push: true,
        });
      } catch (error) {
        console.error('Failed to send checkout notifications:', error);
      }

      // 11. Return result
      return {
        success: true,
        sales_order_id: savedOrder.id,
        order_number: orderNumber,
        booking_ids: bookingIds,
        quotation_id: quotationId,
        total_amount: preview.summary.total_amount,
        payment_status: 'pending', // TODO: Integrate with payment gateway
        message: `Quotation checkout completed successfully. ${bookingIds.length} booking(s) ${preview.flow_type === 'preventive' ? 'updated' : 'created'}.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate unique order number.
   */
  private async generateUniqueOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderNumber = `QO-${timestamp}-${random}`;

      const existing = await this.salesOrderRepository.findOne({
        where: { order_number: orderNumber },
      });

      if (!existing) {
        return orderNumber;
      }
    }

    throw new BadRequestException(
      'Failed to generate unique order number. Please try again.',
    );
  }
}
