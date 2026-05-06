import { plainToInstance } from 'class-transformer';
import { AttributeValueEntity } from '../entities/attribute-value.entity';
import { AttributeValue } from '../../domain/attribute-value';

export class AttributeValueMapper {
  static toDomain(entity: AttributeValueEntity): AttributeValue {
    return plainToInstance(AttributeValue, entity, {
      excludeExtraneousValues: false,
    });
  }

  static toPersistence(domain: AttributeValue): AttributeValueEntity {
    const entity = new AttributeValueEntity();
    Object.assign(entity, domain as Omit<AttributeValue, 'id' | 'attribute'>);

    if (domain.id) {
      entity.id = domain.id;
    }

    return entity;
  }
}
