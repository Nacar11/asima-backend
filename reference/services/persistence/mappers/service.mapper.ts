import { Service } from '@/services/domain/service';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { ServiceCategoryMapper } from '@/service-categories/persistence/mappers/service-category.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { ServiceMilestoneTemplateMapper } from '@/service-milestone-templates/persistence/mappers/service-milestone-template.mapper';
import { ServiceOptionGroupMapper } from '@/service-option-groups/persistence/mappers/service-option-group.mapper';
import { ServiceAddonMapper } from '@/service-addons/persistence/mappers/service-addon.mapper';

export class ServiceMapper {
  /**
   * Build full URL from a raw MinIO object key.
   * Matches the same logic used by MediaMapper so service
   * images are reachable in both local dev and deployed environments.
   */
  private static buildImageUrl(
    imageUrl: string | null | undefined,
  ): string | null {
    if (!imageUrl) return null;

    // Already a full URL or bundled asset — return as-is
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('assets/')
    ) {
      return imageUrl;
    }

    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'media';
    const encodedPath = imageUrl
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  static toDomain(raw: ServiceEntity): Service {
    const domain = new Service();

    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.category_id = raw.category_id;
    domain.currency_id = raw.currency_id;
    domain.title = raw.title;
    domain.code = raw.code;
    domain.description = raw.description;
    domain.short_description = raw.short_description;
    domain.pricing_type = raw.pricing_type;
    domain.service_type = raw.service_type;

    domain.base_price = raw.base_price ? Number(raw.base_price) : null;

    domain.hourly_rate = raw.hourly_rate ? Number(raw.hourly_rate) : null;

    // Calculate min_price and max_price
    const prices = [
      raw.base_price ? Number(raw.base_price) : null,
      raw.hourly_rate ? Number(raw.hourly_rate) : null,
    ].filter((p): p is number => p !== null && p !== undefined);

    if (prices.length > 0) {
      domain.min_price = Math.min(...prices);
      domain.max_price = Math.max(...prices);
    } else {
      domain.min_price = null;
      domain.max_price = null;
    }

    domain.estimated_duration_minutes = raw.estimated_duration_minutes;
    domain.minimum_duration_minutes = raw.minimum_duration_minutes;
    domain.maximum_duration_minutes = raw.maximum_duration_minutes;
    domain.service_radius_km = raw.service_radius_km;
    domain.is_remote_available = raw.is_remote_available;
    domain.service_location_type =
      raw.service_location_type ?? ServiceLocationTypeEnum.HOME_SERVICE;

    // Venue configuration
    domain.venue_capacity = raw.venue_capacity;
    domain.slot_duration_minutes = raw.slot_duration_minutes;

    // Peak pricing configuration
    domain.peak_price_multiplier = raw.peak_price_multiplier
      ? Number(raw.peak_price_multiplier)
      : null;
    domain.peak_days = raw.peak_days
      ? raw.peak_days.map((d) => Number(d))
      : null;
    domain.peak_start_time = raw.peak_start_time;
    domain.peak_end_time = raw.peak_end_time;

    domain.max_bookings_per_day = raw.max_bookings_per_day;
    domain.advance_booking_days = raw.advance_booking_days;
    domain.minimum_notice_hours = raw.minimum_notice_hours;
    domain.status = raw.status;
    domain.is_featured = raw.is_featured;
    domain.requires_quote = raw.requires_quote;
    domain.has_checklist = raw.has_checklist;
    domain.instant_booking = raw.instant_booking;
    domain.view_count = raw.view_count;
    domain.total_bookings = raw.total_bookings;
    domain.average_rating = Number(raw.average_rating);
    domain.total_reviews = raw.total_reviews;

    if (raw.seller) {
      const sellerDomain = SellerMapper.toDomain(raw.seller);
      domain.seller = {
        id: sellerDomain.id,
        store_name: sellerDomain.store_name,
        slug: sellerDomain.slug,
        store_logo_url: sellerDomain.store_logo_url,
        average_rating: sellerDomain.average_rating,
        pickup_city: sellerDomain.pickup_city,
        pickup_province: sellerDomain.pickup_province,
        status: sellerDomain.status,
        contact: sellerDomain.contact,
        email: sellerDomain.email,
        website: sellerDomain.website,
        service_location_address_id: sellerDomain.service_location_address_id,
        service_location_address: sellerDomain.service_location_address,
      };
    }
    if (raw.category)
      domain['category'] = ServiceCategoryMapper.toDomain(raw.category);
    if (raw.currency)
      domain['currency'] = CurrencyMapper.toDomain(raw.currency);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    // Map milestone templates if loaded
    if (raw.milestone_templates) {
      domain.milestone_templates = raw.milestone_templates
        .filter((t) => !t.deleted_at)
        .map((t) => ServiceMilestoneTemplateMapper.toDomain(t));
    }

    // Map option groups if loaded
    if (raw.option_groups) {
      domain.option_groups = raw.option_groups
        .filter((g) => !g.deleted_at)
        .map((g) => ServiceOptionGroupMapper.toDomain(g));
    }

    // Map addons if loaded
    if (raw.addons) {
      domain.addons = raw.addons
        .filter((a) => !a.deleted_at)
        .map((a) => ServiceAddonMapper.toDomain(a));
    }

    // Map gallery if loaded (inline to avoid circular dependency)
    if (raw.gallery) {
      const activeGallery = raw.gallery.filter((g) => !g.deleted_at);
      domain.gallery = activeGallery.map((g) => ({
        id: g.id,
        service_id: g.service_id,
        image_url: ServiceMapper.buildImageUrl(g.image_url) ?? g.image_url,
        caption: g.caption,
        alt_text: g.alt_text,
        is_primary: g.is_primary,
        display_order: g.display_order,
        status: g.status,
        created_at: g.created_at,
        updated_at: g.updated_at,
        deleted_at: g.deleted_at,
      }));

      // Set primary_image_url from primary gallery image or first image
      const primaryImage = activeGallery.find((g) => g.is_primary);
      const rawPrimaryUrl =
        primaryImage?.image_url ??
        activeGallery[0]?.image_url ??
        raw.category?.image_url ??
        null;
      domain.primary_image_url =
        ServiceMapper.buildImageUrl(rawPrimaryUrl) ?? rawPrimaryUrl;
    } else if (raw.category?.image_url) {
      // Fallback to category image if gallery is not loaded or empty
      domain.primary_image_url =
        ServiceMapper.buildImageUrl(raw.category.image_url) ??
        raw.category.image_url;
    }

    // Stable card image URL for list views
    domain.card_image_url = domain.primary_image_url ?? null;

    // Icon URL from category (for list/card icons)
    domain.icon_url = raw.category?.icon_url ?? null;

    return domain;
  }

  static toPersistence(domain: Service): ServiceEntity {
    const entity = new ServiceEntity();

    if (domain.id) entity.id = domain.id;
    entity.seller_id = domain.seller_id;
    entity.category_id = domain.category_id ?? null;
    entity.currency_id = domain.currency_id ?? null;
    entity.title = domain.title;
    entity.code = domain.code;
    entity.description = domain.description ?? null;
    entity.short_description = domain.short_description ?? null;
    entity.pricing_type = domain.pricing_type;
    entity.service_type = domain.service_type;

    entity.base_price = domain.base_price ?? null;

    entity.hourly_rate = domain.hourly_rate ?? null;
    entity.estimated_duration_minutes =
      domain.estimated_duration_minutes ?? null;
    entity.minimum_duration_minutes = domain.minimum_duration_minutes ?? null;
    entity.maximum_duration_minutes = domain.maximum_duration_minutes ?? null;
    entity.service_radius_km = domain.service_radius_km ?? null;
    entity.is_remote_available = domain.is_remote_available ?? false;
    entity.service_location_type =
      domain.service_location_type ?? ServiceLocationTypeEnum.HOME_SERVICE;

    // Venue configuration
    entity.venue_capacity = domain.venue_capacity ?? null;
    entity.slot_duration_minutes = domain.slot_duration_minutes ?? null;

    // Peak pricing configuration
    entity.peak_price_multiplier = domain.peak_price_multiplier ?? null;
    entity.peak_days = domain.peak_days ?? null;
    entity.peak_start_time = domain.peak_start_time ?? null;
    entity.peak_end_time = domain.peak_end_time ?? null;

    entity.max_bookings_per_day = domain.max_bookings_per_day ?? null;
    entity.advance_booking_days = domain.advance_booking_days ?? 30;
    entity.minimum_notice_hours = domain.minimum_notice_hours ?? null;
    entity.status = domain.status;
    entity.is_featured = domain.is_featured ?? false;
    entity.requires_quote = domain.requires_quote ?? false;
    entity.has_checklist = domain.has_checklist ?? false;
    entity.instant_booking = domain.instant_booking ?? true;
    entity.view_count = domain.view_count ?? 0;
    entity.total_bookings = domain.total_bookings ?? 0;
    entity.average_rating = domain.average_rating ?? 0;
    entity.total_reviews = domain.total_reviews ?? 0;

    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;

    return entity;
  }
}
