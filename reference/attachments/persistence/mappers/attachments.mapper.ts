import { Attachments } from '@/attachments/domain/attachments';
import { AttachmentsEntity } from '@/attachments/persistence/entities/attachments.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class AttachmentsMapper {
  static toDomain(raw: AttachmentsEntity): Attachments {
    const domainEntity = new Attachments();

    Object.assign(domainEntity, raw);

    if (raw.created_by) {
      domainEntity.created_by = getUser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getUser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getUser(raw.deleted_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: Attachments): AttachmentsEntity {
    const persistenceEntity = new AttachmentsEntity();
    Object.assign(persistenceEntity, domainEntity as Omit<Attachments, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
