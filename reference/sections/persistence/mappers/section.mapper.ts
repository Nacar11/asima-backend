import { Section } from '@/sections/domain/section';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

export class SectionMapper {
  static toDomain(raw: SectionEntity): Section {
    const domainEntity = new Section();

    Object.assign(domainEntity, raw);

    if (raw.section_head) {
      domainEntity.section_head = getUser(raw.section_head);
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

  static toPersistence(domainEntity: Section): SectionEntity {
    const persistenceEntity = new SectionEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Section,
        'id' | 'section_head' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.section_head) {
      persistenceEntity.section_head = UserMapper.toPersistence(
        domainEntity.section_head as User,
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
