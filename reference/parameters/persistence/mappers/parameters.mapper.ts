import { Parameter } from '@/parameters/domain/parameter';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class ParametersMapper {
  static toDomain(raw: ParameterEntity): Parameter {
    const domainEntity = new Parameter();

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

  static toPersistence(domainEntity: Parameter): ParameterEntity {
    const persistenceEntity = new ParameterEntity();
    Object.assign(persistenceEntity, domainEntity as Omit<Parameter, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
