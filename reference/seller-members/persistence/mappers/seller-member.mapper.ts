import { SellerMember } from '@/seller-members/domain/seller-member';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';

export class SellerMemberMapper {
  static toDomain(raw: SellerMemberEntity): SellerMember {
    const domain = new SellerMember();

    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.user_id = raw.user_id;
    domain.role = raw.role;
    domain.is_service_provider = raw.is_service_provider;
    domain.max_daily_bookings = raw.max_daily_bookings;
    domain.max_concurrent_bookings = raw.max_concurrent_bookings;
    domain.service_capacity_hours = Number(raw.service_capacity_hours);
    domain.is_available_for_booking = raw.is_available_for_booking;
    domain.display_name = raw.display_name;
    domain.profile_image_url = raw.profile_image_url;
    domain.bio = raw.bio;
    domain.average_rating = Number(raw.average_rating);
    domain.total_reviews = raw.total_reviews;
    domain.total_completed_bookings = raw.total_completed_bookings;
    domain.status = raw.status;

    if (raw.seller) {
      domain.seller = SellerMapper.toDomain(raw.seller);
    }
    if (raw.user) {
      domain.user = UserMapper.toDomain(raw.user);
    }
    if (raw.created_by) {
      domain.created_by = getCauser(raw.created_by);
    }
    if (raw.updated_by) {
      domain.updated_by = getCauser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domain.deleted_by = getCauser(raw.deleted_by);
    }
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: SellerMember): SellerMemberEntity {
    const entity = new SellerMemberEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.seller_id = domain.seller_id;
    entity.user_id = domain.user_id;
    entity.role = domain.role;
    entity.is_service_provider = domain.is_service_provider;
    entity.max_daily_bookings = domain.max_daily_bookings;
    entity.max_concurrent_bookings = domain.max_concurrent_bookings;
    entity.service_capacity_hours = domain.service_capacity_hours;
    entity.is_available_for_booking = domain.is_available_for_booking;
    entity.display_name = domain.display_name ?? null;
    entity.profile_image_url = domain.profile_image_url ?? null;
    entity.bio = domain.bio ?? null;
    entity.average_rating = domain.average_rating ?? 0;
    entity.total_reviews = domain.total_reviews ?? 0;
    entity.total_completed_bookings = domain.total_completed_bookings ?? 0;
    entity.status = domain.status;

    if (domain.seller) {
      entity.seller = SellerMapper.toPersistence(domain.seller);
    }
    if (domain.user) {
      entity.user = UserMapper.toPersistence(domain.user as User);
    }
    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    return entity;
  }
}
