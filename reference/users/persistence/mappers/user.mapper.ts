import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import {
  getCostCenter,
  getUser,
  getSeller,
} from '@/utils/helpers/entity.helper';
import { CostCenterMapper } from '@/cost-centers/persistence/mappers/cost-center.mapper';
import { GenderEnum } from '@/user-details/domain/user-detail';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { UserGroupMapper } from '@/user-groups/persistence/mappers/user-group.mapper';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();

    // Exclude related entities and sensitive fields from Object.assign
    const {
      seller,
      cost_center,
      details,
      default_address,
      created_by,
      updated_by,
      deleted_by,
      password, // eslint-disable-line @typescript-eslint/no-unused-vars
      salt, // eslint-disable-line @typescript-eslint/no-unused-vars
      device_pin, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...restOfRaw
    } = raw;
    Object.assign(domainEntity, restOfRaw);

    if (cost_center) {
      domainEntity.cost_center = getCostCenter(cost_center);
    }

    if (seller) {
      domainEntity.seller = getSeller(seller);
      // Ensure seller_id is a valid number or null (never NaN or undefined)
      domainEntity.seller_id =
        typeof seller.id === 'number' && !isNaN(seller.id) ? seller.id : null;
    } else {
      domainEntity.seller_id = null;
    }

    // Map user details (phone, address, gender, date_of_birth, profile_picture)
    if (details) {
      domainEntity.phone = domainEntity.phone ?? details.phone ?? null;
      domainEntity.address = details.address ?? null;
      domainEntity.gender = (details.gender as GenderEnum) ?? null;
      domainEntity.date_of_birth = details.date_of_birth ?? null;
      domainEntity.profile_picture = details.profile_picture ?? null;
      domainEntity.phone_verified =
        domainEntity.phone_verified || !!details.phone_verified_at;
      domainEntity.email_verified =
        domainEntity.email_verified || !!details.email_verified_at;
    }

    if (created_by) {
      domainEntity.created_by = getUser(created_by);
    }

    if (updated_by) {
      domainEntity.updated_by = getUser(updated_by);
    }

    if (deleted_by) {
      domainEntity.deleted_by = getUser(deleted_by);
    }

    if (default_address) {
      domainEntity.default_address =
        UserAddressMapper.toDomain(default_address);
      domainEntity.default_address_id = default_address.id;
    } else {
      domainEntity.default_address_id = null;
    }

    domainEntity.preferred_currency_id =
      domainEntity.preferred_currency_id ?? null;

    domainEntity.email_verified = domainEntity.email_verified ?? false;
    domainEntity.phone_verified = domainEntity.phone_verified ?? false;
    domainEntity.must_change_password =
      domainEntity.must_change_password ?? false;

    // Map assignments if present (for permission checking)
    // Use a simple mapping to avoid circular dependency with UserAssignmentMapper
    if (raw.assignments && Array.isArray(raw.assignments)) {
      domainEntity.assignments = raw.assignments.map((assignment) => {
        const assignmentDomain = new UserAssignment();
        assignmentDomain.id = assignment.id;
        assignmentDomain.status = assignment.status as any;
        if (assignment.group) {
          assignmentDomain.group = UserGroupMapper.toDomain(assignment.group);
        }
        return assignmentDomain;
      });
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserEntity {
    const persistenceEntity = new UserEntity();

    // Exclude fields that belong to user_details table or are computed
    const excludedFields = [
      'id',
      'cost_center',
      'address',
      'gender',
      'date_of_birth',
      'seller_id',
      'profile_picture',
    ];
    const userFields = Object.fromEntries(
      Object.entries(domainEntity).filter(
        ([key, value]) => !excludedFields.includes(key) && value !== undefined,
      ),
    );

    Object.assign(persistenceEntity, userFields);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.cost_center) {
      persistenceEntity.cost_center = CostCenterMapper.toPersistence(
        domainEntity.cost_center,
      );
    }

    if (domainEntity.default_address?.id) {
      persistenceEntity.default_address = {
        id: domainEntity.default_address.id,
      } as any;
    } else if (domainEntity.default_address_id) {
      persistenceEntity.default_address = {
        id: domainEntity.default_address_id,
      } as any;
    }
    return persistenceEntity;
  }
}
