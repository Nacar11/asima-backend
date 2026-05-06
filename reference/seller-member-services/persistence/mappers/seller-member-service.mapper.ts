import { SellerMemberService } from '@/seller-member-services/domain/seller-member-service';
import { SellerMemberServiceEntity } from '@/seller-member-services/persistence/entities/seller-member-service.entity';
import { SellerMemberMapper } from '@/seller-members/persistence/mappers/seller-member.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class SellerMemberServiceMapper {
  static toDomain(raw: SellerMemberServiceEntity): SellerMemberService {
    const domain = new SellerMemberService();

    domain.id = raw.id;
    domain.seller_member_id = raw.seller_member_id;
    domain.service_id = raw.service_id;
    domain.proficiency_level = raw.proficiency_level;
    domain.is_primary = raw.is_primary;
    domain.status = raw.status;

    if (raw.seller_member) {
      domain.seller_member = SellerMemberMapper.toDomain(raw.seller_member);
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

  static toPersistence(domain: SellerMemberService): SellerMemberServiceEntity {
    const entity = new SellerMemberServiceEntity();

    if (domain.id) {
      entity.id = domain.id;
    }
    entity.seller_member_id = domain.seller_member_id;
    entity.service_id = domain.service_id;
    entity.proficiency_level = domain.proficiency_level;
    entity.is_primary = domain.is_primary;
    entity.status = domain.status ?? 'Active';

    if (domain.seller_member) {
      entity.seller_member = SellerMemberMapper.toPersistence(
        domain.seller_member,
      ) as any;
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
