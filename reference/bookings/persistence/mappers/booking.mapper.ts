import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { Booking } from '@/bookings/domain/booking';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { BookingGuestMapper } from '@/booking-guests/persistence/mappers/booking-guest.mapper';

/**
 * Mapper for Booking domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like checkout order, seller, service, customer, and addresses.
 *
 * @version 1
 * @since 1.0.0
 */
export class BookingMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns Booking domain model
   */
  static toDomain(raw: BookingEntity): Booking {
    const domainEntity = new Booking();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Phase B3: Normalize scheduled_start_time to HH:mm:ss for consistent API response
    if (raw.scheduled_start_time) {
      const t = String(raw.scheduled_start_time).trim();
      domainEntity.scheduled_start_time =
        t.length === 5 && t.indexOf(':') === 2 ? `${t}:00` : t;
    }

    if (raw.scheduled_end_time) {
      const t = String(raw.scheduled_end_time).trim();
      domainEntity.scheduled_end_time =
        t.length === 5 && t.indexOf(':') === 2 ? `${t}:00` : t;
    }

    // Convert decimal fields to numbers
    // Price breakdown fields
    domainEntity.base_price = Number(raw.base_price ?? 0);
    domainEntity.addons_total = Number(raw.addons_total ?? 0);
    domainEntity.options_total = Number(raw.options_total ?? 0);
    domainEntity.location_additional_fee = Number(
      raw.location_additional_fee ?? 0,
    );

    if (raw.subtotal !== null && raw.subtotal !== undefined) {
      domainEntity.subtotal = Number(raw.subtotal);
    }
    if (raw.discount_amount !== null && raw.discount_amount !== undefined) {
      domainEntity.discount_amount = Number(raw.discount_amount);
    }
    if (raw.platform_fee !== null && raw.platform_fee !== undefined) {
      domainEntity.platform_fee = Number(raw.platform_fee);
    }
    if (
      raw.platform_fee_percent !== null &&
      raw.platform_fee_percent !== undefined
    ) {
      domainEntity.platform_fee_percent = Number(raw.platform_fee_percent);
    }
    if (raw.provider_payout !== null && raw.provider_payout !== undefined) {
      domainEntity.provider_payout = Number(raw.provider_payout);
    }
    if (raw.total !== null && raw.total !== undefined) {
      domainEntity.total = Number(raw.total);
    }
    domainEntity.guest_count = Number(raw.guest_count ?? 1);
    domainEntity.open_play_event_id = raw.open_play_event_id ?? null;
    if (raw.service_latitude !== null && raw.service_latitude !== undefined) {
      domainEntity.service_latitude = Number(raw.service_latitude);
    }
    if (raw.service_longitude !== null && raw.service_longitude !== undefined) {
      domainEntity.service_longitude = Number(raw.service_longitude);
    }

    // Map booking addons if loaded
    if (raw.booking_addons) {
      domainEntity.booking_addons = raw.booking_addons.map((addon) => ({
        id: addon.id,
        addon_id: addon.addon_id,
        addon_name: addon.addon_name,
        addon_code: addon.addon_code,
        addon_description: addon.addon_description,
        unit_type: addon.unit_type,
        quantity: addon.quantity,
        unit_price: Number(addon.unit_price),
        total_price: Number(addon.total_price),
        duration_minutes: addon.duration_minutes,
      }));
    }

    // Map booking options if loaded
    if (raw.booking_options) {
      domainEntity.booking_options = raw.booking_options.map((option) => ({
        id: option.id,
        option_group_id: option.option_group_id,
        option_value_id: option.option_value_id,
        group_name: option.group_name,
        group_code: option.group_code,
        value_label: option.value_label,
        value_code: option.value_code,
        quantity: option.quantity,
        price_adjustment: Number(option.price_adjustment),
        duration_adjustment_minutes: option.duration_adjustment_minutes,
      }));
    }

    // Map booking milestones if loaded (checklist template: include nested template for app)
    if (raw.booking_milestones) {
      domainEntity.booking_milestones = raw.booking_milestones.map((m) => {
        const milestone: any = {
          id: m.id,
          booking_id: m.booking_id,
          template_id: m.template_id,
          name: m.name,
          description: m.description,
          sequence_order: m.sequence_order,
          status: m.status,
          payment_percent: Number(m.payment_percent),
          payment_amount: Number(m.payment_amount),
          payment_released: m.payment_released,
          payment_released_at: m.payment_released_at,
          started_at: m.started_at,
          completed_at: m.completed_at,
          submitted_at: m.submitted_at,
          approved_at: m.approved_at,
          customer_notes: m.customer_notes,
          provider_notes: m.provider_notes,
          rejection_reason: m.rejection_reason,
          approved_by: m.approved_by,
          auto_approved: m.auto_approved,
          auto_approve_after_hours: m.auto_approve_after_hours,
          milestone_type: m.milestone_type,
          category: m.category,
          response_type: m.response_type,
          measurement_unit: m.measurement_unit,
          is_required: m.is_required,
          checkbox_value: m.checkbox_value,
          text_value: m.text_value,
          rating_value: m.rating_value,
          measurement_value: m.measurement_value,
          photo_urls: m.photo_urls,
          source_quotation_item_id: m.source_quotation_item_id,
        };
        // Nested template (ServiceMilestoneTemplateEntity) for checklist form fields (final_flow)
        if (m.template) {
          const t = m.template as any;
          milestone.template = {
            id: t.id,
            service_id: t.service_id,
            package_id: t.package_id,
            name: t.name,
            description: t.description,
            template_type: t.template_type,
            category: t.category,
            response_type: t.response_type,
            measurement_unit: t.measurement_unit,
            is_required: t.is_required ?? false,
            sequence_order: t.sequence_order,
            status: t.status,
          };
        }
        return milestone;
      });
    }

    if (raw.booking_guests) {
      const guests = [...raw.booking_guests]
        .sort((a, b) =>
          a.sort_order !== b.sort_order
            ? a.sort_order - b.sort_order
            : a.id - b.id,
        )
        .map((guest) => BookingGuestMapper.toDomain(guest));
      domainEntity.booking_guests = guests;
      domainEntity.primary_guest =
        guests.find((guest) => guest.is_primary_contact) ?? guests[0] ?? null;
      domainEntity.guest_names_summary = guests
        .map((guest) => guest.full_name)
        .filter(Boolean)
        .join(', ');
    } else {
      domainEntity.primary_guest = null;
      domainEntity.guest_names_summary = null;
    }

    // Map checkout order relation if loaded (DEPRECATED)
    if (raw.checkout_order) {
      domainEntity.checkout_order = raw.checkout_order;
      if (raw.checkout_order.payment_status) {
        domainEntity.payment_status = raw.checkout_order.payment_status;
      }
    }

    // Map sales order relation if loaded
    if (raw.sales_order) {
      domainEntity.sales_order = raw.sales_order;
    }

    // Map sales order item relation if loaded
    if (raw.sales_order_item) {
      domainEntity.sales_order_item = raw.sales_order_item;
    }

    // Map seller relation if loaded (use SellerMapper so store_logo_url serializes for API/mobile)
    if (raw.seller) {
      domainEntity.seller = SellerMapper.toDomain(raw.seller);

      // Fallback for store logo if missing (use user profile image)
      if (!domainEntity.seller.store_logo_url && raw.seller.user?.image) {
        domainEntity.seller.store_logo_url = raw.seller.user.image;
      }

      // Fallback for seller contact email: use the seller's user account email
      // when the seller has not configured a dedicated store contact email.
      if (!domainEntity.seller.email && raw.seller.user?.email) {
        (domainEntity.seller as any).email = raw.seller.user.email;
      }
    }

    // Map service relation if loaded (use ServiceMapper so primary_image_url from gallery/category is set)
    if (raw.service) {
      domainEntity.service = ServiceMapper.toDomain(raw.service);

      // Map primary image URL from gallery or category
      if (raw.service.gallery && raw.service.gallery.length > 0) {
        const primaryImage =
          raw.service.gallery.find((img) => img.is_primary) ||
          raw.service.gallery.sort(
            (a, b) => a.display_order - b.display_order,
          )[0];

        if (primaryImage) {
          domainEntity.service.primary_image_url = primaryImage.image_url;
        }
      } else if (
        raw.service.category &&
        (raw.service.category.icon_url || raw.service.category.image_url)
      ) {
        // Fallback to category icon/image
        domainEntity.service.primary_image_url =
          raw.service.category.icon_url || raw.service.category.image_url;
      }
    }

    // Map package relation if loaded
    if (raw.package) {
      domainEntity.package = raw.package;
    }

    // Map assigned member relation if loaded
    if (raw.assigned_member) {
      domainEntity.assigned_member = raw.assigned_member;
    }

    // Map customer relation if loaded (Phase C2: include computed name for provider booking list/detail)
    if (raw.customer) {
      const firstName = raw.customer.first_name ?? '';
      const lastName = raw.customer.last_name ?? '';
      const name =
        firstName && lastName
          ? `${firstName}, ${lastName}`
          : [firstName, lastName].filter(Boolean).join(', ') || null;
      domainEntity.customer = {
        id: raw.customer.id,
        first_name: raw.customer.first_name,
        last_name: raw.customer.last_name,
        name,
        email: raw.customer.email,
        phone_number: raw.customer.phone ?? null,
        image: raw.customer.image ?? null,
      };
    }

    // Map service address relation if loaded
    if (raw.service_address) {
      domainEntity.service_address = UserAddressMapper.toDomain(
        raw.service_address,
      );
    }

    // Map cancelled_by_user relation if loaded
    if (raw.cancelled_by_user) {
      domainEntity.cancelled_by_user = getCauser(raw.cancelled_by_user);
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    // Map quotation relation if loaded
    if (raw.quotation) {
      domainEntity.quotation = raw.quotation;
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns BookingEntity for TypeORM
   */
  static toPersistence(domainEntity: Booking): BookingEntity {
    const persistenceEntity = new BookingEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      checkout_order_id: domainEntity.checkout_order_id || null,
      sales_order_id: domainEntity.sales_order_id || null,
      sales_order_item_id: domainEntity.sales_order_item_id || null,
      seller_id: domainEntity.seller_id,
      service_id: domainEntity.service_id,
      package_id: domainEntity.package_id,
      bundle_id: domainEntity.bundle_id,
      booking_number: domainEntity.booking_number,
      booking_group_number: domainEntity.booking_group_number ?? null,
      guest_email: domainEntity.guest_email ?? null,
      guest_payment_method: domainEntity.guest_payment_method ?? null,
      guest_count: domainEntity.guest_count ?? 1,
      open_play_event_id: domainEntity.open_play_event_id ?? null,
      assigned_member_id: domainEntity.assigned_member_id,
      customer_id: domainEntity.customer_id,
      scheduled_date: domainEntity.scheduled_date,
      scheduled_start_time: domainEntity.scheduled_start_time,
      scheduled_end_time: domainEntity.scheduled_end_time,
      actual_start_time: domainEntity.actual_start_time,
      actual_end_time: domainEntity.actual_end_time,
      service_address_id: domainEntity.service_address_id,
      service_address_text: domainEntity.service_address_text,
      service_latitude: domainEntity.service_latitude,
      service_longitude: domainEntity.service_longitude,
      appointment_location_type: domainEntity.appointment_location_type,
      base_price: domainEntity.base_price ?? 0,
      addons_total: domainEntity.addons_total ?? 0,
      options_total: domainEntity.options_total ?? 0,
      location_additional_fee: domainEntity.location_additional_fee ?? 0,
      subtotal: domainEntity.subtotal,
      discount_amount: domainEntity.discount_amount,
      platform_fee: domainEntity.platform_fee,
      platform_fee_percent: domainEntity.platform_fee_percent,
      provider_payout: domainEntity.provider_payout,
      total: domainEntity.total,
      status: domainEntity.status,
      customer_notes: domainEntity.customer_notes,
      provider_notes: domainEntity.provider_notes,
      internal_notes: domainEntity.internal_notes,
      cancelled_at: domainEntity.cancelled_at,
      cancelled_by: domainEntity.cancelled_by,
      cancellation_reason: domainEntity.cancellation_reason,
      completed_at: domainEntity.completed_at,
      confirmed_at: domainEntity.confirmed_at,
      // DPO Assessment Fields
      is_assessment: domainEntity.is_assessment ?? false,
      source_quotation_id: domainEntity.source_quotation_id || null,
      source_quotation_item_id: domainEntity.source_quotation_item_id || null,
      // MEPF Flow Fields
      form_submission_id: domainEntity.form_submission_id || null,
      recurrence_group_id: domainEntity.recurrence_group_id || null,
      recurrence_index: domainEntity.recurrence_index || null,
    });

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }
}
