import { SubSection } from '@/sub-sections/domain/sub-section';
import { SubSectionEntity } from '@/sub-sections/persistence/entities/sub-section.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

export class SubSectionMapper {
  static toDomain(raw: SubSectionEntity): SubSection {
    const domainEntity = new SubSection();

    Object.assign(domainEntity, raw);

    if (raw.sub_section_head) {
      domainEntity.sub_section_head = getUser(raw.sub_section_head);
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

  static toPersistence(domainEntity: SubSection): SubSectionEntity {
    const persistenceEntity = new SubSectionEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        SubSection,
        'id' | 'sub_section_head' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.sub_section_head) {
      persistenceEntity.sub_section_head = UserMapper.toPersistence(
        domainEntity.sub_section_head as User,
      );
    }

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
