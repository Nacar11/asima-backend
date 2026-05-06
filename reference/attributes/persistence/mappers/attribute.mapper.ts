import { AttributeEntity } from '../entities/attribute.entity';
import { Attribute } from '../../domain/attribute';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { AttributeValueMapper } from '@/attribute-values/persistence/mappers/attribute-value.mapper';
import { User } from '@/users/domain/user';

export class AttributeMapper {
  static toDomain(entity: AttributeEntity): Attribute {
    const domain = new Attribute();

    Object.assign(domain, entity);

    if (entity.created_by) {
      domain.created_by = getCauser(entity.created_by);
    }

    if (entity.updated_by) {
      domain.updated_by = getCauser(entity.updated_by);
    }

    if (entity.deleted_by) {
      domain.deleted_by = getCauser(entity.deleted_by);
    }

    domain.attribute_values =
      entity.attribute_values?.map((av) => AttributeValueMapper.toDomain(av)) ??
      [];
    return domain;
  }

  static toPersistence(domain: Attribute): AttributeEntity {
    const entity = new AttributeEntity();

    Object.assign(
      entity,
      domain as Omit<
        Attribute,
        | 'id'
        | 'seller'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
        | 'attribute_values'
      >,
    );

    if (domain.id) {
      entity.id = domain.id;
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
