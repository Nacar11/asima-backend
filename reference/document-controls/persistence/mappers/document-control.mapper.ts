import { DocumentControl } from '@/document-controls/domain/document-control';
import { DocumentControlEntity } from '@/document-controls/persistence/entities/document-control.entity';
import { getMenu, getUser } from '@/utils/helpers/entity.helper';

export class DocumentControlMapper {
  static toDomain(raw: DocumentControlEntity): DocumentControl {
    const domainEntity = new DocumentControl();

    Object.assign(domainEntity, raw);

    if (raw.menu) {
      domainEntity.menu = getMenu(raw.menu);
    }

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

  static toPersistence(domainEntity: DocumentControl): DocumentControlEntity {
    const persistenceEntity = new DocumentControlEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<DocumentControl, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
