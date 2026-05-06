import { Injectable } from '@nestjs/common';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { Seller } from '@/sellers/domain/seller';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { SellerEdistrictInfo } from '@/sellers/domain/seller';

/**
 * Mapper for converting between SellerEntity and Seller domain
 */
@Injectable()
export class SellerMapper {
  /**
   * Build full URL from a storage key/path
   */
  private static buildUrl(
    keyOrUrl: string | null | undefined,
    publicEndpoint: string,
    bucket: string,
  ): string | null {
    if (!keyOrUrl) {
      return null;
    }

    // If it's already a full URL, return it as is
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      return keyOrUrl;
    }

    // Otherwise, build the full URL from the storage key
    const encodedPath = keyOrUrl
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  /**
   * Extract storage key from a full URL or return the key as-is
   */
  private static extractStorageKey(
    urlOrKey: string | null | undefined,
    publicEndpoint: string,
    bucket: string,
  ): string | null {
    if (!urlOrKey) {
      return null;
    }

    // If it's not a full URL, return it as-is (it's already a storage key)
    if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
      return urlOrKey;
    }

    // Extract storage key from full URL
    // Format: http://endpoint/bucket/key
    const urlPattern = new RegExp(
      `^https?://[^/]+/${bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+)$`,
    );
    const match = urlOrKey.match(urlPattern);
    if (match && match[1]) {
      // Decode the path segments
      return decodeURIComponent(match[1]);
    }

    // If pattern doesn't match, try to extract from common patterns
    const parts = urlOrKey.split('/');
    const bucketIndex = parts.findIndex((part) => part === bucket);
    if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
      return parts.slice(bucketIndex + 1).join('/');
    }

    // If we can't extract, return the original (might be a different URL format)
    return urlOrKey;
  }

  /**
   * Convert TypeORM entity to domain class
   */
  static toDomain(raw: SellerEntity): Seller {
    const domainEntity = new Seller();

    Object.assign(
      domainEntity,
      raw as Omit<
        Seller,
        | 'id'
        | 'user'
        | 'categories'
        | 'edistrict'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
        | 'store_logo_url'
        | 'store_banner_url'
      >,
    );

    if (raw.id) {
      domainEntity.id = raw.id;
    }

    if (raw.user) {
      const mappedUser = UserMapper.toDomain(raw.user);
      domainEntity.user = {
        id: mappedUser.id,
        first_name: mappedUser.first_name,
        last_name: mappedUser.last_name,
      };
    }

    domainEntity.sells_products = raw.sells_products;
    domainEntity.sells_services = raw.sells_services;
    domainEntity.is_featured = raw.is_featured ?? false;
    domainEntity.auto_accept_bookings = raw.auto_accept_bookings;
    domainEntity.bio = raw.bio;
    domainEntity.years_of_experience = raw.years_of_experience;
    domainEntity.hourly_rate = Number(raw.hourly_rate);
    domainEntity.commission_rate = Number(raw.commission_rate ?? 0);
    domainEntity.average_rating = Number(raw.average_rating);
    domainEntity.total_services = raw.total_services;
    domainEntity.total_completed_bookings = raw.total_completed_bookings;
    domainEntity.max_concurrent_bookings = raw.max_concurrent_bookings;
    domainEntity.max_daily_bookings = raw.max_daily_bookings;
    domainEntity.service_capacity_hours = Number(raw.service_capacity_hours);

    if (raw.service_location_address) {
      domainEntity.service_location_address = UserAddressMapper.toDomain(
        raw.service_location_address,
      );
    } else {
      domainEntity.service_location_address = null;
    }

    // Convert storage keys to full URLs
    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'product-media';

    domainEntity.store_logo_url = this.buildUrl(
      raw.store_logo_url,
      publicEndpoint,
      bucket,
    );
    domainEntity.store_banner_url = this.buildUrl(
      raw.store_banner_url,
      publicEndpoint,
      bucket,
    );

    if (raw.categories && raw.categories.length > 0) {
      domainEntity.categories = raw.categories.map((category) => ({
        id: category.id,
        category_name: category.category_name,
        slug: category.slug,
        display_order: category.display_order,
        parent_category_id: category.parent_category_id,
        seller_id: category.seller_id,
      }));
    }

    domainEntity.edistrict_id = raw.edistrict_id ?? null;
    if (raw.edistrict) {
      const info = new SellerEdistrictInfo();
      info.id = raw.edistrict.id;
      info.key = raw.edistrict.key;
      info.name = raw.edistrict.name;
      info.subtitle = raw.edistrict.subtitle;
      info.store_name = raw.edistrict.store_name;
      info.image_url = raw.edistrict.image_url;
      info.background_image_url = raw.edistrict.background_image_url;
      info.status = raw.edistrict.status;
      info.is_members_only = raw.edistrict.is_members_only;
      info.display_order = raw.edistrict.display_order;
      domainEntity.edistrict = info;
    } else {
      domainEntity.edistrict = null;
    }

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
   * Convert domain class to TypeORM entity
   */
  static toPersistence(domainEntity: Seller): SellerEntity {
    const persistenceEntity = new SellerEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Seller,
        | 'id'
        | 'user'
        | 'categories'
        | 'edistrict'
        | 'subscription'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
        | 'store_logo_url'
        | 'store_banner_url'
        | 'pickup_enabled'
        | 'pickup_address_id'
        | 'pickup_address_entity'
        | 'pickup_preparation_time'
        | 'pickup_max_concurrent_orders'
        | 'pickup_instructions'
        | 'pickup_grace_period'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(
        domainEntity.user as User,
      );
    }

    persistenceEntity.sells_products = domainEntity.sells_products;
    persistenceEntity.sells_services = domainEntity.sells_services;
    persistenceEntity.is_featured = domainEntity.is_featured ?? false;
    persistenceEntity.auto_accept_bookings = domainEntity.auto_accept_bookings;
    persistenceEntity.bio = domainEntity.bio ?? null;
    persistenceEntity.years_of_experience =
      domainEntity.years_of_experience ?? null;
    persistenceEntity.hourly_rate = domainEntity.hourly_rate ?? 0;
    persistenceEntity.average_rating = domainEntity.average_rating ?? 0;
    persistenceEntity.total_services = domainEntity.total_services ?? 0;
    persistenceEntity.total_completed_bookings =
      domainEntity.total_completed_bookings ?? 0;
    persistenceEntity.max_concurrent_bookings =
      domainEntity.max_concurrent_bookings ?? 1;
    persistenceEntity.max_daily_bookings = domainEntity.max_daily_bookings ?? 8;
    persistenceEntity.service_capacity_hours =
      domainEntity.service_capacity_hours ?? 8;

    // Convert full URLs back to storage keys for persistence
    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'product-media';

    persistenceEntity.store_logo_url = this.extractStorageKey(
      domainEntity.store_logo_url,
      publicEndpoint,
      bucket,
    );
    persistenceEntity.store_banner_url = this.extractStorageKey(
      domainEntity.store_banner_url,
      publicEndpoint,
      bucket,
    );

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

    // Pickup configuration — set raw FK column directly.
    // Delete pickup_address_entity so TypeORM does not attempt to resolve the
    // @ManyToOne relation and conflict with the raw pickup_address_id FK column.
    persistenceEntity.pickup_enabled = domainEntity.pickup_enabled ?? false;
    persistenceEntity.pickup_address_id =
      domainEntity.pickup_address_id ?? null;
    delete (persistenceEntity as any).pickup_address_entity;
    persistenceEntity.pickup_preparation_time =
      domainEntity.pickup_preparation_time ?? 30;
    persistenceEntity.pickup_max_concurrent_orders =
      domainEntity.pickup_max_concurrent_orders ?? 10;
    persistenceEntity.pickup_instructions =
      domainEntity.pickup_instructions ?? null;
    persistenceEntity.pickup_grace_period =
      domainEntity.pickup_grace_period ?? 120;

    persistenceEntity.edistrict_id = domainEntity.edistrict_id ?? null;
    delete (persistenceEntity as any).edistrict;

    return persistenceEntity;
  }
}
