import { DocumentSignatory } from '@/document-signatories/domain/document-signatory';
import { DocumentSignatoryEntity } from '@/document-signatories/persistence/entities/document-signatory.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class DocumentSignatoryMapper {
  static toDomain(raw: DocumentSignatoryEntity): DocumentSignatory {
    const domainEntity = new DocumentSignatory();

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

  static toPersistence(
    domainEntity: DocumentSignatory,
  ): DocumentSignatoryEntity {
    const persistenceEntity = new DocumentSignatoryEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<DocumentSignatory, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
