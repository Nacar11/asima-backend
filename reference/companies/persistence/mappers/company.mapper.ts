import { Company } from '@/companies/domain/company';
import { CompanyEntity } from '@/companies/persistence/entities/company.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class CompanyMapper {
  static toDomain(raw: CompanyEntity): Company {
    const domainEntity = new Company();

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

  static toPersistence(domainEntity: Company): CompanyEntity {
    const persistenceEntity = new CompanyEntity();
    Object.assign(persistenceEntity, domainEntity as Omit<Company, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
