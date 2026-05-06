import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { ShoppingCartItem } from '@/shopping-carts/domain/shopping-cart-item';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { ServicePackageMapper } from '@/service-packages/persistence/mappers/service-package.mapper';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';

/**
 * Mapper for ShoppingCartItem domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like product variants, services, service packages, and audit fields.
 *
 * @version 2
 * @since 1.0.0
 */
export class ShoppingCartItemMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns ShoppingCartItem domain model
   */
  static toDomain(raw: ShoppingCartItemEntity): ShoppingCartItem {
    const domainEntity = new ShoppingCartItem();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert location_additional_fee from string (decimal column) to number
    if (
      raw.location_additional_fee !== null &&
      raw.location_additional_fee !== undefined
    ) {
      domainEntity.location_additional_fee = Number(
        raw.location_additional_fee,
      );
    }

    // Map variant relation if loaded
    if (raw.variant) {
      // Compute variant image URL from variant.media using MediaMapper
      // Prefer thumbnail for cart list (small 80x80 display)
      let variantImageUrl: string | null = null;
      if (raw.variant.media) {
        const variantMediaDomain = MediaMapper.toDomain(raw.variant.media);
        variantImageUrl =
          variantMediaDomain.thumbnail_url ||
          variantMediaDomain.compressed_url ||
          variantMediaDomain.url ||
          null;
      }

      // Compute product image URL from product_media_mappings using MediaMapper
      let productImageUrl: string | null = null;
      if (raw.variant.product?.product_media_mappings?.length) {
        // Repository guarantees index 0 is the primary image (is_primary DESC, display_order ASC)
        const primaryMapping = raw.variant.product.product_media_mappings[0];

        if (primaryMapping?.media) {
          const productMediaDomain = MediaMapper.toDomain(primaryMapping.media);
          productImageUrl =
            productMediaDomain.thumbnail_url ||
            productMediaDomain.compressed_url ||
            productMediaDomain.url ||
            null;
        }
      }

      // Map variant entity directly (no domain model for ProductVariant yet)
      domainEntity.variant = {
        id: raw.variant.id,
        sku: raw.variant.sku,
        variant_name: raw.variant.variant_name,
        selling_price: raw.variant.selling_price,
        cost_price: raw.variant.cost_price,
        minimum_order: raw.variant.minimum_order,
        status: raw.variant.status,
        variant_image_url: variantImageUrl,
        inventory_stock: raw.variant.inventory_stock
          ? {
              available_quantity:
                raw.variant.inventory_stock.available_quantity,
              reserved_quantity: raw.variant.inventory_stock.reserved_quantity,
              stock_quantity: raw.variant.inventory_stock.stock_quantity,
            }
          : null,
        product: raw.variant.product
          ? {
              id: raw.variant.product.id,
              product_name: raw.variant.product.product_name,
              description: raw.variant.product.description,
              status: raw.variant.product.status,
              product_image_url: productImageUrl,
              seller_id: raw.variant.product.seller?.id || null,
              store_name: raw.variant.product.seller?.store_name || null,
            }
          : undefined,
      };
      // Calculate prices from variant
      domainEntity.unit_price = Number(raw.variant.selling_price);
      domainEntity.total_price =
        Number(raw.variant.selling_price) * raw.quantity;
    }

    // Map service relation if loaded
    if (raw.service) {
      domainEntity.service = ServiceMapper.toDomain(raw.service);
    }

    // Map package relation if loaded
    if (raw.package) {
      domainEntity.package = ServicePackageMapper.toDomain(raw.package);
    }

    // Map service address relation if loaded
    if (raw.service_address) {
      domainEntity.service_address = UserAddressMapper.toDomain(
        raw.service_address,
      );
    }

    // Map special_requests
    domainEntity.special_requests = raw.special_requests ?? null;

    // Map appointment_location_type
    domainEntity.appointment_location_type =
      raw.appointment_location_type ?? null;

    // Map form_submission_id
    domainEntity.form_submission_id = raw.form_submission_id ?? null;

    // Calculate prices for service items
    if (raw.item_type === CartItemTypeEnum.SERVICE) {
      let basePrice = 0;
      if (raw.package) {
        // Use package price if package is selected
        basePrice = Number(raw.package.price);
      } else if (raw.service) {
        // Use service base_price if no package
        basePrice = Number(
          raw.service.base_price || raw.service.hourly_rate || 0,
        );
      }

      domainEntity.unit_price = basePrice;

      // Calculate addon total price
      let addonsTotalPrice = 0;
      if (raw.cart_item_addons && raw.cart_item_addons.length > 0) {
        addonsTotalPrice = raw.cart_item_addons.reduce(
          (sum, addon) => sum + Number(addon.total_price || 0),
          0,
        );
      }

      // Calculate option price adjustments (price_adjustment * quantity)
      let optionsTotalAdjustment = 0;
      if (raw.cart_item_options && raw.cart_item_options.length > 0) {
        optionsTotalAdjustment = raw.cart_item_options.reduce(
          (sum, option) =>
            sum + Number(option.price_adjustment || 0) * (option.quantity || 1),
          0,
        );
      }

      // Venue services: per-slot pricing with optional peak multiplier
      if (
        raw.service?.service_type === 'venue' &&
        raw.scheduled_start_time &&
        raw.scheduled_end_time
      ) {
        const slotDuration = raw.service.slot_duration_minutes || 60;
        const startMinutes = ShoppingCartItemMapper.timeToMinutes(
          raw.scheduled_start_time,
        );
        const endMinutes = ShoppingCartItemMapper.timeToMinutes(
          raw.scheduled_end_time,
        );
        const dayOfWeek = raw.scheduled_date
          ? new Date(raw.scheduled_date).getDay()
          : 0;

        let totalVenuePrice = 0;
        let cursor = startMinutes;
        while (cursor < endMinutes) {
          const slotStartTime = ShoppingCartItemMapper.minutesToTime(cursor);
          const isPeak = ShoppingCartItemMapper.isPeakSlot(
            slotStartTime,
            raw.service,
            dayOfWeek,
          );
          const slotRate = isPeak
            ? basePrice * Number(raw.service.peak_price_multiplier || 1)
            : basePrice;
          totalVenuePrice += slotRate * (slotDuration / 60);
          cursor += slotDuration;
        }

        domainEntity.total_price =
          totalVenuePrice + addonsTotalPrice + optionsTotalAdjustment;
      } else {
        // Non-venue: standard pricing
        domainEntity.total_price =
          basePrice * raw.quantity + addonsTotalPrice + optionsTotalAdjustment;
      }
    }

    // Map cart item addons if loaded
    if (raw.cart_item_addons && raw.cart_item_addons.length > 0) {
      domainEntity.selected_addons = raw.cart_item_addons.map((addon) => ({
        id: addon.id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: Number(addon.unit_price),
        total_price: Number(addon.total_price),
        // Include duration_minutes from the addon relation for client-side duration calculation
        duration_minutes: addon.addon?.duration_minutes ?? null,
        addon: addon.addon
          ? {
              id: addon.addon.id,
              name: addon.addon.name,
              description: addon.addon.description ?? undefined,
              duration_minutes: addon.addon.duration_minutes ?? null,
            }
          : undefined,
      }));
    }

    // Map cart item options if loaded
    if (raw.cart_item_options && raw.cart_item_options.length > 0) {
      domainEntity.selected_options = raw.cart_item_options.map((option) => ({
        id: option.id,
        option_group_id: option.option_group_id,
        option_value_id: option.option_value_id,
        quantity: option.quantity,
        price_adjustment: Number(option.price_adjustment),
        duration_adjustment_minutes: option.duration_adjustment_minutes,
        option_group: option.option_group
          ? {
              id: option.option_group.id,
              name: option.option_group.name,
            }
          : undefined,
        option_value: option.option_value
          ? {
              id: option.option_value.id,
              name: option.option_value.label,
            }
          : undefined,
      }));
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

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns ShoppingCartItemEntity for TypeORM
   */
  static toPersistence(domainEntity: ShoppingCartItem): ShoppingCartItemEntity {
    const persistenceEntity = new ShoppingCartItemEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      shopping_cart_id: domainEntity.shopping_cart_id,
      variant_id: domainEntity.variant_id ?? null,
      service_id: domainEntity.service_id ?? null,
      package_id: domainEntity.package_id ?? null,
      item_type: domainEntity.item_type ?? CartItemTypeEnum.PRODUCT,
      scheduled_date: domainEntity.scheduled_date ?? null,
      scheduled_start_time: domainEntity.scheduled_start_time ?? null,
      scheduled_end_time: domainEntity.scheduled_end_time ?? null,
      service_address_id: domainEntity.service_address_id ?? null,
      special_requests: domainEntity.special_requests ?? null,
      appointment_location_type: domainEntity.appointment_location_type ?? null,
      form_submission_id: domainEntity.form_submission_id ?? null,
      quantity: domainEntity.quantity,
      is_selected: domainEntity.is_selected,
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

  /** Convert "HH:mm:ss" or "HH:mm" to total minutes since midnight. */
  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /** Convert total minutes since midnight to "HH:mm:ss". */
  private static minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}:00`;
  }

  /** Check whether a slot falls within the service's peak window. */
  private static isPeakSlot(
    startTime: string,
    service: any,
    dayOfWeek: number,
  ): boolean {
    if (!service.peak_price_multiplier || !service.peak_days?.length) {
      return false;
    }
    const peakDays: number[] = Array.isArray(service.peak_days)
      ? service.peak_days.map(Number)
      : [];
    if (!peakDays.includes(dayOfWeek)) return false;
    if (!service.peak_start_time || !service.peak_end_time) return true;
    const slotMin = ShoppingCartItemMapper.timeToMinutes(startTime);
    const peakStart = ShoppingCartItemMapper.timeToMinutes(
      service.peak_start_time,
    );
    const peakEnd = ShoppingCartItemMapper.timeToMinutes(service.peak_end_time);
    return slotMin >= peakStart && slotMin < peakEnd;
  }
}
