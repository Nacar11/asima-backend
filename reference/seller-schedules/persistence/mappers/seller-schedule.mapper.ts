import { SellerSchedule } from '@/seller-schedules/domain/seller-schedule';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class SellerScheduleMapper {
  static toDomain(raw: SellerScheduleEntity): SellerSchedule {
    const domain = new SellerSchedule();
    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.day_of_week = raw.day_of_week;
    domain.status = raw.status;
    domain.start_time = raw.start_time ?? null;
    domain.end_time = raw.end_time ?? null;
    domain.break_start = raw.break_start ?? null;
    domain.break_end = raw.break_end ?? null;
    if (raw.seller) domain.seller = SellerMapper.toDomain(raw.seller);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at ?? null;
    return domain;
  }

  static toPersistence(domain: SellerSchedule): SellerScheduleEntity {
    const entity = new SellerScheduleEntity();
    if (domain.id) entity.id = domain.id;
    entity.seller_id = domain.seller_id;
    entity.day_of_week = domain.day_of_week;
    entity.status = domain.status ?? 'Active';
    entity.start_time = domain.start_time ?? null;
    entity.end_time = domain.end_time ?? null;
    entity.break_start = domain.break_start ?? null;
    entity.break_end = domain.break_end ?? null;

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
